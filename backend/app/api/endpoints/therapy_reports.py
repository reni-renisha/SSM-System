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
    max_length: int = 280
    min_length: int = 60


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
    # Optionally set teacher_id from current_user if not provided
    if not report_in.teacher_id:
        try:
            report_in.teacher_id = current_user.id
        except Exception:
            report_in.teacher_id = None

    return crud.therapy_report.create(db, obj_in=report_in)


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
        
        # 3. Current Status Analysis - AI analyzes recent reports
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
    """Build AI prompt for brief overview using actual report data."""
    student_name = getattr(student, 'name', 'Student')
    therapy_types = list(set(r.therapy_type for r in reports if r.therapy_type))
    
    prompt = f"Analyze therapy progress for {student_name}:\n\n"
    prompt += f"Total Sessions: {len(reports)}\n"
    prompt += f"Therapy Types: {', '.join(therapy_types)}\n"
    prompt += f"Date Range: {reports[0].report_date} to {reports[-1].report_date}\n\n"
    
    prompt += "Recent Session Details:\n"
    # Include actual report content from last 5 sessions
    for i, report in enumerate(reports[-5:], 1):
        prompt += f"\nSession {len(reports)-5+i} ({report.report_date}):\n"
        prompt += f"Therapy: {report.therapy_type or 'Not specified'}\n"
        prompt += f"Progress Level: {report.progress_level or 'Not rated'}\n"
        if report.progress_notes:
            prompt += f"Notes: {report.progress_notes[:200]}\n"
        if report.goals_achieved:
            prompt += f"Goals: {report.goals_achieved[:150]}\n"
    
    prompt += "\nProvide a brief overview of this student's overall therapy progress and current status based on the actual session data above."
    return prompt


def _build_start_analysis_prompt(start_reports, student):
    """Build AI prompt for initial assessment using actual early report data."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = f"Analyze the initial therapy baseline for {student_name}:\n\n"
    prompt += "Early Therapy Sessions (Baseline Data):\n"
    
    for i, report in enumerate(start_reports, 1):
        prompt += f"\nEarly Session {i} ({report.report_date}):\n"
        prompt += f"Therapy Type: {report.therapy_type or 'Not specified'}\n" 
        prompt += f"Initial Progress Level: {report.progress_level or 'Not rated'}\n"
        
        if report.progress_notes:
            prompt += f"Initial Assessment Notes: {report.progress_notes}\n"
        if report.goals_achieved:
            prompt += f"Early Goals/Challenges: {report.goals_achieved}\n"
    
    prompt += f"\nBased on these actual early session records, analyze {student_name}'s initial condition, baseline abilities, and starting challenges when therapy began."
    return prompt


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
    """Build AI prompt for recommendations using actual progress data."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = f"Generate therapy recommendations for {student_name}:\n\n"
    prompt += "Progress Analysis Data:\n"
    for key, value in metrics.items():
        prompt += f"- {key}: {value}\n"
    
    prompt += "\nRecent Session Performance:\n"
    # Focus on last 3 sessions for recommendations
    for i, report in enumerate(reports[-3:], 1):
        prompt += f"\nSession {len(reports)-3+i} ({report.report_date}):\n"
        prompt += f"Progress Level: {report.progress_level}\n"
        if report.progress_notes:
            prompt += f"Session Notes: {report.progress_notes[:200]}\n"
        if report.goals_achieved:
            prompt += f"Achievements: {report.goals_achieved[:150]}\n"
    
    prompt += f"\nBased on {student_name}'s actual therapy data and progress patterns above, provide specific recommendations for future therapy sessions, goals, and next steps."
    return prompt


def _build_main_summary_prompt(reports, student):
    """Build AI prompt for main comprehensive summary using all report data."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = f"Comprehensive therapy analysis for {student_name}:\n\n"
    
    # Include data from all sessions, focusing on key information
    prompt += "Complete Session History:\n"
    for i, report in enumerate(reports, 1):
        prompt += f"\nSession {i} ({report.report_date}):\n"
        prompt += f"Type: {report.therapy_type or 'N/A'} | Level: {report.progress_level or 'N/A'}\n"
        
        # Include abbreviated notes to fit in prompt
        if report.progress_notes:
            notes = report.progress_notes[:150] + "..." if len(report.progress_notes) > 150 else report.progress_notes
            prompt += f"Notes: {notes}\n"
        if report.goals_achieved:
            goals = report.goals_achieved[:100] + "..." if len(report.goals_achieved) > 100 else report.goals_achieved
            prompt += f"Goals: {goals}\n"
    
    prompt += f"\nProvide a comprehensive summary of {student_name}'s complete therapy journey based on all session data above."
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
    
    # Analyze recent reports for current status  
    end_analysis = "Recent sessions: "
    for report in reports[-2:]:
        end_analysis += f"{report.report_date} - {report.progress_level or 'Unrated'}, "
    end_analysis += "showing current performance level."
    
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
