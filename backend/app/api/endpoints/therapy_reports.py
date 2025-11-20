from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel
import os
import logging
from datetime import date

try:
    from huggingface_hub import InferenceClient
except ImportError:  # Provide a graceful message if dependency missing
    InferenceClient = None  # type: ignore
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps
from app.core.config import settings

router = APIRouter()


class TherapyAISummaryRequest(BaseModel):
    student_id: str  # Changed to str to accept "STU2025001" format
    from_date: Optional[date] = None
    to_date: Optional[date] = None
    therapy_type: Optional[str] = None
    model: Optional[str] = "facebook/bart-large-cnn"
    text_gen_model: Optional[str] = "microsoft/DialoGPT-medium"  # For enhanced current status analysis
    max_length: int = 280
    min_length: int = 60
    use_text_generation: bool = True  # Enable advanced text generation for current status


class TherapyAISummaryResponse(BaseModel):
    student_id: str  # Changed to str to match request
    model: str
    used_reports: int
    truncated: bool
    summary: str
    brief_overview: str
    start_date_analysis: str
    end_date_analysis: str
    improvement_metrics: dict
    recommendations: str
    date_range: dict



@router.post("/", response_model=schemas.therapy_report.TherapyReport)
def create_report(
    *,
    db: Session = Depends(deps.get_db),
    report_in: schemas.therapy_report.TherapyReportCreate,
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Create a therapy report for a student."""
    try:
        # Optionally set teacher_id from current_user if not provided
        if not report_in.teacher_id:
            try:
                report_in.teacher_id = current_user.id
            except Exception as e:
                logging.warning(f"Could not set teacher_id from current_user: {e}")
                report_in.teacher_id = None

        # Create the report
        report = crud.therapy_report.create(db, obj_in=report_in)
        logging.info(f"Successfully created therapy report for student {report_in.student_id}")
        return report
    except Exception as e:
        logging.error(f"Error creating therapy report: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create therapy report: {str(e)}"
        )


@router.get("/student/{student_id}", response_model=List[schemas.therapy_report.TherapyReport])
def list_reports_for_student(
    student_id: int,
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """List therapy reports for a student."""
    # Authorization can be added (e.g., only teacher or admin)
    return crud.therapy_report.get_by_student(db, student_id=student_id)


@router.post("/summary/ai", response_model=TherapyAISummaryResponse)
def ai_summarize_reports(
    payload: TherapyAISummaryRequest = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Generate a comprehensive AI analysis of therapy reports for a student using Hugging Face Inference API.

    Notes:
      - Requires env var HUGGINGFACE_API_TOKEN (Hugging Face API token with read access)
      - If huggingface_hub not installed, returns 503
      - Applies optional filtering by date range and therapy type
      - Provides detailed analysis including start/end comparisons and improvement metrics
    """
    if InferenceClient is None:
        raise HTTPException(status_code=503, detail="huggingface_hub not installed on server.")

    if not settings.HUGGINGFACE_API_TOKEN:
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_TOKEN environment variable not set on server.")

    # First, look up the student by string student_id to get the integer id
    from app.crud.student import student as crud_student
    db_student = crud_student.get_by_student_id(db, student_id=payload.student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail=f"Student with ID {payload.student_id} not found.")
    
    # Now get therapy reports using the integer student id (foreign key)
    reports = crud.therapy_report.get_by_student(db, student_id=db_student.id)
    if not reports:
        raise HTTPException(status_code=404, detail="No therapy reports found for student.")

    # Filter by date range / therapy type
    filtered = []
    for r in reports:
        if payload.from_date and r.report_date < payload.from_date:
            continue
        if payload.to_date and r.report_date > payload.to_date:
            continue
        if payload.therapy_type and (not r.therapy_type or r.therapy_type != payload.therapy_type):
            continue
        filtered.append(r)

    if not filtered:
        raise HTTPException(status_code=404, detail="No therapy reports matched the provided filters.")

    # Sort reports by date for chronological analysis
    filtered.sort(key=lambda r: r.report_date)
    
    # Generate comprehensive analysis based on actual data
    analysis = _generate_comprehensive_analysis(filtered, db_student, payload)
    return analysis


def _generate_comprehensive_analysis(reports, student, payload):
    """Generate a comprehensive AI-powered analysis based on actual therapy report data."""
    from collections import defaultdict
    
    client = InferenceClient(api_key=settings.HUGGINGFACE_API_TOKEN)
    
    # Calculate real improvement metrics from actual data
    improvement_metrics = _calculate_improvement_metrics(reports)
    
    # Date range info
    date_range = {
        "start_date": str(reports[0].report_date) if reports else None,
        "end_date": str(reports[-1].report_date) if reports else None,
        "total_days": (reports[-1].report_date - reports[0].report_date).days if len(reports) > 1 else 0
    }
    
    # Identify start and end periods based on actual data
    start_reports = reports[:min(3, len(reports))]  # First 3 reports for baseline
    end_reports = reports[-min(3, len(reports)):]   # Last 3 reports for current status
    
    try:
        # Generate AI analysis for different sections using actual report content
        
        # 1. Brief Overview - AI analyzes all reports for general progress
        overview_prompt = _build_overview_prompt(reports, student)
        overview_result = client.summarization(
            overview_prompt[:8000],  # Limit size for API
            model=payload.model or "facebook/bart-large-cnn"
        )
        brief_overview = _extract_summary_text(overview_result)
        
        # 2. Start Date Analysis - AI analyzes initial reports
        start_prompt = _build_start_analysis_prompt(start_reports, student)
        start_result = client.summarization(
            start_prompt[:6000],
            model=payload.model or "facebook/bart-large-cnn"
        )
        start_analysis = _extract_summary_text(start_result)
        
        # 3. Current Status Analysis - Enhanced with text generation for detailed insights
        if payload.use_text_generation:
            end_analysis = _generate_enhanced_current_status(client, end_reports, student, payload)
        else:
            end_prompt = _build_end_analysis_prompt(end_reports, student)
            end_result = client.summarization(
                end_prompt[:6000],
                model=payload.model or "facebook/bart-large-cnn"
            )
            end_analysis = _extract_summary_text(end_result)
        
        # 4. Recommendations - AI generates based on progress patterns
        recommendations_prompt = _build_recommendations_prompt(reports, improvement_metrics, student)
        rec_result = client.summarization(
            recommendations_prompt[:6000],
            model=payload.model or "facebook/bart-large-cnn"
        )
        recommendations = _extract_summary_text(rec_result)
        
        # 5. Main Summary - AI analyzes all report content
        main_summary_prompt = _build_main_summary_prompt(reports, student)
        main_result = client.summarization(
            main_summary_prompt[:10000],
            model=payload.model or "facebook/bart-large-cnn"
        )
        main_summary = _extract_summary_text(main_result)
        
    except Exception as e:
        logging.exception("AI analysis failed, using fallback")
        # Fallback to data-driven analysis without AI
        return _generate_fallback_analysis(reports, student, payload, improvement_metrics, date_range)
    
    return TherapyAISummaryResponse(
        student_id=payload.student_id,
        model=payload.model or "facebook/bart-large-cnn",
        used_reports=len(reports),
        truncated=False,
        summary=main_summary,
        brief_overview=brief_overview,
        start_date_analysis=start_analysis,
        end_date_analysis=end_analysis,
        improvement_metrics=improvement_metrics,
        recommendations=recommendations,
        date_range=date_range
    )


def _extract_summary_text(result):
    """Extract summary text from Hugging Face API result."""
    if isinstance(result, dict) and result.get("summary_text"):
        return result["summary_text"].strip()
    else:
        return str(result)[:800]  # Limit length


def _build_overview_prompt(reports, student):
    """Build AI prompt for brief overview using actual report data with specific student details."""
    student_name = getattr(student, 'name', 'Student')
    student_class = getattr(student, 'class_name', None)
    student_age = getattr(student, 'age', None)
    student_disability = getattr(student, 'disability_type', None)
    
    therapy_types = list(set(r.therapy_type for r in reports if r.therapy_type))
    
    prompt = f"Analyze therapy progress for {student_name}:\n\n"
    prompt += f"STUDENT PROFILE:\n"
    prompt += f"Name: {student_name}\n"
    if student_class:
        prompt += f"Class: {student_class}\n"
    if student_age:
        prompt += f"Age: {student_age}\n"
    if student_disability:
        prompt += f"Primary Need: {student_disability}\n"
    prompt += f"\nTHERAPY HISTORY:\n"
    prompt += f"Total Sessions: {len(reports)}\n"
    prompt += f"Therapy Types: {', '.join(therapy_types)}\n"
    prompt += f"Date Range: {reports[0].report_date} to {reports[-1].report_date}\n\n"
    
    prompt += "SPECIFIC SESSION DETAILS WITH ACTUAL PROGRESS NOTES:\n"
    # Include full actual report content from last 5 sessions for personalization
    for i, report in enumerate(reports[-5:], 1):
        prompt += f"\nSession {len(reports)-5+i} ({report.report_date}):\n"
        prompt += f"Therapy: {report.therapy_type or 'Not specified'}\n"
        prompt += f"Progress Level: {report.progress_level or 'Not rated'}\n"
        if report.progress_notes:
            prompt += f"Detailed Notes: {report.progress_notes}\n"  # Include full notes for personalization
        if report.goals_achieved:
            prompt += f"Specific Goals/Achievements: {report.goals_achieved}\n"  # Include full achievements
        if hasattr(report, 'challenges_faced') and report.challenges_faced:
            prompt += f"Challenges: {report.challenges_faced}\n"
    
    prompt += f"\nProvide a personalized overview of {student_name}'s specific therapy progress, mentioning actual achievements, specific skills worked on, and concrete progress made based on the detailed session data above. Focus on what makes {student_name}'s journey unique."
    return prompt


def _build_start_analysis_prompt(start_reports, student):
    """Build AI prompt for initial assessment using actual early report data with specific details."""
    student_name = getattr(student, 'name', 'Student')
    student_disability = getattr(student, 'disability_type', None)
    
    prompt = f"Analyze the initial therapy baseline for {student_name}:\n\n"
    prompt += f"STUDENT BACKGROUND:\n"
    prompt += f"Name: {student_name}\n"
    if student_disability:
        prompt += f"Primary Need: {student_disability}\n"
    prompt += "\nEARLY THERAPY SESSIONS (ACTUAL BASELINE DATA):\n"
    
    for i, report in enumerate(start_reports, 1):
        prompt += f"\nEarly Session {i} ({report.report_date}):\n"
        prompt += f"Therapy Type: {report.therapy_type or 'Not specified'}\n" 
        prompt += f"Initial Progress Level: {report.progress_level or 'Not rated'}\n"
        
        # Include full assessment notes for personalization
        if report.progress_notes:
            prompt += f"Complete Initial Assessment Notes: {report.progress_notes}\n"
        if report.goals_achieved:
            prompt += f"Specific Early Goals/Challenges: {report.goals_achieved}\n"
        if hasattr(report, 'baseline_skills') and report.baseline_skills:
            prompt += f"Baseline Skills Noted: {report.baseline_skills}\n"
    
    prompt += f"\nBased on these specific early session records, provide a personalized analysis of {student_name}'s unique initial condition, specific baseline abilities mentioned in the notes, and particular starting challenges when therapy began. Reference actual details from the assessment notes."
    return prompt


def _generate_enhanced_current_status(client, end_reports, student, payload):
    """Generate enhanced current status analysis using text generation models."""
    student_name = getattr(student, 'name', 'Student')
    
    try:
        # Build comprehensive current status context
        context = _build_current_status_context(end_reports, student)
        
        # Use text generation for detailed current status analysis with specific personalization
        generation_prompt = f"""Based on the specific therapy session data below, write a personalized current status analysis for {student_name}. Use actual details from the progress notes and achievements mentioned. Avoid generic statements.

{context}

Personalized Current Status Analysis:
{student_name} is specifically demonstrating"""
        
        # Try text generation first for more natural, detailed analysis
        try:
            gen_result = client.text_generation(
                generation_prompt,
                model=payload.text_gen_model or "microsoft/DialoGPT-medium",
                max_new_tokens=200,
                temperature=0.7,
                do_sample=True
            )
            
            if isinstance(gen_result, str):
                generated_text = gen_result
            else:
                generated_text = gen_result.get('generated_text', str(gen_result))
            
            # Extract the generated analysis part
            if f"{student_name} is currently demonstrating" in generated_text:
                current_analysis = generated_text.split(f"{student_name} is currently demonstrating", 1)[1].strip()
                current_analysis = f"{student_name} is currently demonstrating {current_analysis}"
            else:
                current_analysis = generated_text.strip()
            
            # Enhance with specific metrics from recent sessions
            metrics_summary = _extract_current_metrics(end_reports)
            
            enhanced_analysis = f"{current_analysis}\n\nRecent Performance Metrics: {metrics_summary}"
            
            return enhanced_analysis[:800]  # Limit length
            
        except Exception as gen_error:
            logging.warning(f"Text generation failed: {gen_error}, falling back to summarization")
            # Fallback to summarization if text generation fails
            return _fallback_current_status_analysis(client, end_reports, student, payload)
            
    except Exception as e:
        logging.exception(f"Enhanced current status generation failed: {e}")
        return _fallback_current_status_analysis(client, end_reports, student, payload)


def _build_current_status_context(end_reports, student):
    """Build detailed context for current status text generation with specific student details."""
    student_name = getattr(student, 'name', 'Student')
    student_id = getattr(student, 'student_id', 'Unknown')
    student_class = getattr(student, 'class_name', None)
    student_disability = getattr(student, 'disability_type', None)
    
    context = f"STUDENT PROFILE:\n"
    context += f"Name: {student_name} (ID: {student_id})\n"
    if student_class:
        context += f"Class: {student_class}\n"
    if student_disability:
        context += f"Primary Need: {student_disability}\n"
    context += f"Analysis Period: {len(end_reports)} most recent sessions\n\n"
    
    context += "DETAILED RECENT SESSION DATA:\n"
    for i, report in enumerate(end_reports, 1):
        context += f"Session {i} - {report.report_date}:\n"
        context += f"  Therapy Type: {report.therapy_type or 'Not specified'}\n"
        context += f"  Progress Level: {report.progress_level or 'Not rated'}\n"
        
        # Include full progress notes for better personalization
        if report.progress_notes:
            context += f"  Detailed Progress Notes: {report.progress_notes}\n"
        
        # Include full achievements for specificity
        if report.goals_achieved:
            context += f"  Specific Achievements: {report.goals_achieved}\n"
        
        # Include any challenges or additional details
        if hasattr(report, 'challenges_faced') and report.challenges_faced:
            context += f"  Challenges Noted: {report.challenges_faced}\n"
        
        if hasattr(report, 'next_session_goals') and report.next_session_goals:
            context += f"  Next Goals: {report.next_session_goals}\n"
        
        context += "\n"
    
    return context


def _extract_current_metrics(end_reports):
    """Extract key metrics from recent sessions for current status."""
    if not end_reports:
        return "No recent sessions available"
    
    # Progress level analysis
    progress_levels = [r.progress_level for r in end_reports if r.progress_level]
    if progress_levels:
        latest_progress = progress_levels[-1]
        progress_trend = "consistent" if len(set(progress_levels)) == 1 else "variable"
    else:
        latest_progress = "Not assessed"
        progress_trend = "No progress data"
    
    # Therapy consistency
    therapy_types = [r.therapy_type for r in end_reports if r.therapy_type]
    therapy_focus = therapy_types[-1] if therapy_types else "Mixed therapies"
    
    # Session frequency (based on recent sessions)
    if len(end_reports) >= 2:
        dates = [r.report_date for r in end_reports]
        dates.sort()
        avg_gap = sum([(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]) / (len(dates)-1)
        frequency = f"Every {avg_gap:.0f} days"
    else:
        frequency = "Single session"
    
    return f"Latest Level: {latest_progress}, Trend: {progress_trend}, Focus: {therapy_focus}, Frequency: {frequency}"


def _fallback_current_status_analysis(client, end_reports, student, payload):
    """Fallback current status analysis using summarization."""
    end_prompt = _build_end_analysis_prompt(end_reports, student)
    try:
        end_result = client.summarization(
            end_prompt[:6000],
            model=payload.model or "facebook/bart-large-cnn"
        )
        return _extract_summary_text(end_result)
    except Exception as e:
        logging.warning(f"Summarization fallback failed: {e}")
        return _build_basic_current_status(end_reports, student)


def _build_basic_current_status(end_reports, student):
    """Build basic current status from data when AI fails."""
    student_name = getattr(student, 'name', 'Student')
    
    if not end_reports:
        return f"{student_name}'s current status: No recent session data available."
    
    latest = end_reports[-1]
    status = f"{student_name}'s current status (as of {latest.report_date}): "
    status += f"Progress level - {latest.progress_level or 'Not assessed'}. "
    
    if latest.therapy_type:
        status += f"Currently receiving {latest.therapy_type}. "
    
    if len(end_reports) > 1:
        status += f"Based on {len(end_reports)} recent sessions. "
    
    return status


def _build_end_analysis_prompt(end_reports, student):
    """Build AI prompt for current status using actual recent report data."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = f"Analyze the current therapy status for {student_name}:\n\n"
    prompt += "Most Recent Therapy Sessions (Current Status):\n"
    
    for i, report in enumerate(end_reports, 1):
        prompt += f"\nRecent Session {i} ({report.report_date}):\n"
        prompt += f"Therapy Type: {report.therapy_type or 'Not specified'}\n"
        prompt += f"Current Progress Level: {report.progress_level or 'Not rated'}\n"
        
        if report.progress_notes:
            prompt += f"Current Assessment Notes: {report.progress_notes}\n"
        if report.goals_achieved:
            prompt += f"Recent Achievements: {report.goals_achieved}\n"
    
    prompt += f"\nBased on these actual recent session records, analyze {student_name}'s current abilities, recent improvements, and present status."
    return prompt


def _build_recommendations_prompt(reports, metrics, student):
    """Build AI prompt for personalized recommendations using specific student progress data."""
    student_name = getattr(student, 'name', 'Student')
    student_disability = getattr(student, 'disability_type', None)
    
    prompt = f"Generate personalized therapy recommendations for {student_name}:\n\n"
    prompt += f"STUDENT PROFILE:\n"
    prompt += f"Name: {student_name}\n"
    if student_disability:
        prompt += f"Primary Need: {student_disability}\n"
    
    prompt += "\nACTUAL PROGRESS ANALYSIS DATA:\n"
    for key, value in metrics.items():
        prompt += f"- {key}: {value}\n"
    
    prompt += "\nSPECIFIC RECENT SESSION PERFORMANCE:\n"
    # Focus on last 3 sessions with full details for personalized recommendations
    for i, report in enumerate(reports[-3:], 1):
        prompt += f"\nSession {len(reports)-3+i} ({report.report_date}):\n"
        prompt += f"Therapy Type: {report.therapy_type}\n"
        prompt += f"Progress Level: {report.progress_level}\n"
        if report.progress_notes:
            prompt += f"Complete Session Notes: {report.progress_notes}\n"  # Full notes for better recommendations
        if report.goals_achieved:
            prompt += f"Specific Achievements: {report.goals_achieved}\n"  # Full achievements
        if hasattr(report, 'challenges_faced') and report.challenges_faced:
            prompt += f"Challenges Identified: {report.challenges_faced}\n"
    
    # Add pattern analysis from all reports
    prompt += "\nOVERALL PATTERN ANALYSIS:\n"
    strengths = _extract_student_strengths(reports)
    challenges = _extract_student_challenges(reports)
    if strengths:
        prompt += f"Consistent Strengths: {', '.join(strengths)}\n"
    if challenges:
        prompt += f"Recurring Challenges: {', '.join(challenges)}\n"
    
    prompt += f"\nBased on {student_name}'s specific therapy data, actual achievements mentioned, and identified patterns above, provide personalized recommendations that address their unique needs, build on their demonstrated strengths, and target their specific challenges. Reference actual progress notes and achievements in your recommendations."
    return prompt


def _build_main_summary_prompt(reports, student):
    """Build AI prompt for main comprehensive summary using all report data with specific personalization."""
    student_name = getattr(student, 'name', 'Student')
    student_id = getattr(student, 'student_id', 'Unknown')
    student_class = getattr(student, 'class_name', None)
    student_disability = getattr(student, 'disability_type', None)
    
    prompt = f"Comprehensive personalized therapy analysis for {student_name}:\n\n"
    prompt += f"STUDENT DETAILS:\n"
    prompt += f"Name: {student_name} (ID: {student_id})\n"
    if student_class:
        prompt += f"Class: {student_class}\n"
    if student_disability:
        prompt += f"Primary Need: {student_disability}\n"
    
    # Include more detailed data from all sessions
    prompt += "\nCOMPLETE SESSION HISTORY WITH SPECIFIC DETAILS:\n"
    for i, report in enumerate(reports, 1):
        prompt += f"\nSession {i} ({report.report_date}):\n"
        prompt += f"Type: {report.therapy_type or 'N/A'} | Level: {report.progress_level or 'N/A'}\n"
        
        # Include more complete notes for better analysis
        if report.progress_notes:
            # Keep more content for better personalization
            notes = report.progress_notes[:300] + "..." if len(report.progress_notes) > 300 else report.progress_notes
            prompt += f"Detailed Notes: {notes}\n"
        if report.goals_achieved:
            # Keep more goals content
            goals = report.goals_achieved[:200] + "..." if len(report.goals_achieved) > 200 else report.goals_achieved
            prompt += f"Specific Goals/Achievements: {goals}\n"
    
    # Add analysis of patterns and trends
    prompt += "\nKEY PATTERNS TO ANALYZE:\n"
    therapy_evolution = _analyze_therapy_evolution(reports)
    prompt += f"Therapy Evolution: {therapy_evolution}\n"
    
    progress_journey = _analyze_progress_journey(reports)
    prompt += f"Progress Journey: {progress_journey}\n"
    
    prompt += f"\nProvide a comprehensive, personalized summary of {student_name}'s unique therapy journey. Reference specific achievements, challenges, and progress patterns mentioned in the actual session notes. Highlight what makes {student_name}'s progress unique and avoid generic statements. Base the analysis on the specific details provided in the session history above."
    return prompt


def _calculate_improvement_metrics(reports):
    """Calculate quantitative improvement metrics from actual report data."""
    from collections import Counter
    
    if not reports:
        return {"error": "No reports available for analysis"}
    
    # Analyze progress levels over time
    progress_levels = [r.progress_level for r in reports if r.progress_level]
    progress_counter = Counter(progress_levels)
    
    # Therapy type analysis  
    therapy_types = [r.therapy_type for r in reports if r.therapy_type]
    therapy_counter = Counter(therapy_types)
    
    # Calculate actual session frequency
    if len(reports) > 1:
        dates = [r.report_date for r in reports]
        dates.sort()
        total_days = (dates[-1] - dates[0]).days
        avg_frequency = total_days / (len(reports) - 1) if len(reports) > 1 else 0
        frequency_desc = f"{avg_frequency:.1f} days between sessions"
    else:
        frequency_desc = "Single session only"
    
    # Analyze actual improvement trend
    improvement_trend = _analyze_actual_improvement_trend(reports)
    
    # Calculate consistency from actual data
    consistency = _calculate_actual_consistency(reports)
    
    return {
        "total_sessions": len(reports),
        "therapy_types_count": len(therapy_counter),
        "most_common_therapy": therapy_counter.most_common(1)[0] if therapy_counter else ("None", 0),
        "progress_distribution": dict(progress_counter),
        "session_frequency": frequency_desc,
        "consistency_score": consistency,
        "improvement_trend": improvement_trend,
        "date_span_days": (reports[-1].report_date - reports[0].report_date).days if len(reports) > 1 else 0
    }


def _analyze_actual_improvement_trend(reports):
    """Analyze improvement trend from actual progress level data."""
    if len(reports) < 2:
        return "Insufficient data for trend analysis"
    
    # Map progress levels to numbers for calculation
    level_map = {
        "Poor": 1, "Below Average": 2, "Average": 3, 
        "Good": 4, "Very Good": 5, "Excellent": 6
    }
    
    # Get numerical scores for reports with progress levels
    scores = []
    for report in reports:
        if report.progress_level and report.progress_level in level_map:
            scores.append(level_map[report.progress_level])
    
    if len(scores) < 2:
        return "No progress levels available for comparison"
    
    # Calculate actual trend
    start_avg = sum(scores[:len(scores)//3]) / len(scores[:len(scores)//3]) if len(scores) >= 3 else scores[0]
    end_avg = sum(scores[-len(scores)//3:]) / len(scores[-len(scores)//3:]) if len(scores) >= 3 else scores[-1]
    
    improvement = end_avg - start_avg
    
    if improvement > 1.5:
        return "Significant improvement demonstrated"
    elif improvement > 0.5:
        return "Moderate improvement shown"
    elif improvement > 0:
        return "Slight improvement noted"
    elif improvement == 0:
        return "Stable performance maintained"
    else:
        return "Performance decline noted - needs attention"


def _calculate_actual_consistency(reports):
    """Calculate therapy consistency from actual attendance data."""
    if len(reports) < 3:
        return "Need more sessions for consistency analysis"
    
    dates = [r.report_date for r in reports]
    dates.sort()
    
    # Calculate intervals between sessions
    intervals = [(dates[i+1] - dates[i]).days for i in range(len(dates)-1)]
    
    if not intervals:
        return "Cannot calculate consistency"
    
    avg_interval = sum(intervals) / len(intervals)
    
    # Calculate standard deviation
    variance = sum((x - avg_interval) ** 2 for x in intervals) / len(intervals)
    std_dev = variance ** 0.5
    
    # Consistency scoring based on actual data
    if std_dev <= 3:
        return "Highly consistent attendance"
    elif std_dev <= 7:
        return "Moderately consistent attendance" 
    else:
        return "Variable attendance pattern"


def _extract_student_strengths(reports):
    """Extract recurring strengths from progress notes."""
    strengths = []
    strength_keywords = ['improved', 'excellent', 'good progress', 'achieved', 'mastered', 'confident', 'successful']
    
    for report in reports:
        if report.progress_notes:
            notes_lower = report.progress_notes.lower()
            for keyword in strength_keywords:
                if keyword in notes_lower:
                    # Extract sentence containing the strength
                    sentences = report.progress_notes.split('.')
                    for sentence in sentences:
                        if keyword in sentence.lower():
                            strengths.append(sentence.strip()[:50])
                            break
    
    return list(set(strengths))[:3]  # Return top 3 unique strengths


def _extract_student_challenges(reports):
    """Extract recurring challenges from progress notes."""
    challenges = []
    challenge_keywords = ['difficulty', 'struggle', 'needs work', 'challenging', 'requires support', 'needs improvement']
    
    for report in reports:
        if report.progress_notes:
            notes_lower = report.progress_notes.lower()
            for keyword in challenge_keywords:
                if keyword in notes_lower:
                    # Extract sentence containing the challenge
                    sentences = report.progress_notes.split('.')
                    for sentence in sentences:
                        if keyword in sentence.lower():
                            challenges.append(sentence.strip()[:50])
                            break
    
    return list(set(challenges))[:3]  # Return top 3 unique challenges


def _analyze_therapy_evolution(reports):
    """Analyze how therapy types and approaches evolved over time."""
    if len(reports) < 2:
        return "Single session recorded"
    
    therapy_sequence = []
    for report in reports:
        if report.therapy_type:
            therapy_sequence.append(report.therapy_type)
    
    if not therapy_sequence:
        return "No therapy types recorded"
    
    if len(set(therapy_sequence)) == 1:
        return f"Consistent focus on {therapy_sequence[0]}"
    else:
        return f"Evolved from {therapy_sequence[0]} to {therapy_sequence[-1]} (total types: {len(set(therapy_sequence))})"


def _analyze_progress_journey(reports):
    """Analyze the progress level journey over time."""
    if not reports:
        return "No progress data available"
    
    progress_levels = []
    for report in reports:
        if report.progress_level:
            progress_levels.append(report.progress_level)
    
    if not progress_levels:
        return "No progress levels recorded"
    
    if len(progress_levels) == 1:
        return f"Single assessment: {progress_levels[0]}"
    
    # Map progress levels to numbers for trend analysis
    level_map = {"Poor": 1, "Below Average": 2, "Average": 3, "Good": 4, "Very Good": 5, "Excellent": 6}
    
    numeric_levels = []
    for level in progress_levels:
        if level in level_map:
            numeric_levels.append(level_map[level])
    
    if len(numeric_levels) >= 2:
        start_avg = sum(numeric_levels[:2]) / 2 if len(numeric_levels) >= 2 else numeric_levels[0]
        end_avg = sum(numeric_levels[-2:]) / 2 if len(numeric_levels) >= 2 else numeric_levels[-1]
        
        if end_avg > start_avg + 0.5:
            return f"Improving journey: from {progress_levels[0]} to {progress_levels[-1]}"
        elif end_avg < start_avg - 0.5:
            return f"Declining trend: from {progress_levels[0]} to {progress_levels[-1]}"
        else:
            return f"Stable performance: maintained around {progress_levels[-1]} level"
    
    return f"Progress tracked from {progress_levels[0]} to {progress_levels[-1]}"


def _generate_fallback_analysis(reports, student, payload, metrics, date_range):
    """Generate data-driven analysis when AI is unavailable."""
    student_name = getattr(student, 'name', 'Student')
    
    # Create analysis based on actual data without AI
    brief_overview = f"{student_name} completed {len(reports)} therapy sessions. " + \
                    f"Progress levels recorded: {', '.join(set(r.progress_level for r in reports if r.progress_level))}. " + \
                    f"Therapy types: {', '.join(set(r.therapy_type for r in reports if r.therapy_type))}."
    
    # Analyze first few reports for baseline
    start_analysis = "Initial sessions: "
    for report in reports[:2]:
        start_analysis += f"{report.report_date} - {report.progress_level or 'Unrated'}, "
    start_analysis += "establishing baseline and treatment approach."
    
    # Enhanced current status analysis using data patterns
    recent_reports = reports[-3:] if len(reports) >= 3 else reports
    end_analysis = f"Current Status Analysis: {student_name} "
    
    # Analyze recent progress trend
    recent_levels = [r.progress_level for r in recent_reports if r.progress_level]
    if recent_levels:
        latest_level = recent_levels[-1]
        if len(recent_levels) > 1:
            trend = "improving" if recent_levels[-1] > recent_levels[0] else "stable" if recent_levels[-1] == recent_levels[0] else "needs attention"
        else:
            trend = "being monitored"
        end_analysis += f"is currently performing at {latest_level} level and {trend}. "
    
    # Current therapy focus
    recent_therapies = [r.therapy_type for r in recent_reports if r.therapy_type]
    if recent_therapies:
        current_focus = recent_therapies[-1]
        end_analysis += f"Currently engaged in {current_focus} therapy. "
    
    # Recent achievements
    recent_achievements = []
    for report in recent_reports:
        if report.goals_achieved and len(report.goals_achieved) > 10:
            recent_achievements.append(report.goals_achieved[:50] + "...")
    
    if recent_achievements:
        end_analysis += f"Recent progress includes: {'; '.join(recent_achievements[-2:])}. "
    
    end_analysis += f"Analysis based on {len(recent_reports)} most recent sessions."
    
    # Generate recommendations based on data patterns
    recommendations = f"Based on {len(reports)} sessions over {date_range['total_days']} days, " + \
                     f"recommend {metrics.get('improvement_trend', 'continued monitoring')}."
    
    # Create comprehensive summary from actual report content
    summary = f"Data analysis of {len(reports)} therapy reports for {student_name}. " + \
              f"Session frequency: {metrics.get('session_frequency', 'varies')}. " + \
              f"Consistency: {metrics.get('consistency_score', 'variable')}."
    
    return TherapyAISummaryResponse(
        student_id=payload.student_id,
        model=payload.model or "data-analysis-fallback",
        used_reports=len(reports),
        truncated=False,
        summary=summary,
        brief_overview=brief_overview,
        start_date_analysis=start_analysis,
        end_date_analysis=end_analysis,
        improvement_metrics=metrics,
        recommendations=recommendations,
        date_range=date_range
    )
