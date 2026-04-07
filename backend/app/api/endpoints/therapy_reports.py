from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
import json
import logging
import re
from datetime import date
import httpx

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
    model: Optional[str] = "meta-llama/Llama-3.3-70B-Instruct"
    text_gen_model: Optional[str] = "meta-llama/Llama-3.3-70B-Instruct"
    max_length: int = 500
    min_length: int = 100
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


def _get_filtered_reports_for_payload(db: Session, payload: TherapyAISummaryRequest):
    """Resolve student and filter reports by optional date/type filters."""
    from app.crud.student import student as crud_student

    db_student = crud_student.get_by_student_id(db, student_id=payload.student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail=f"Student with ID {payload.student_id} not found.")

    reports = crud.therapy_report.get_by_student(db, student_id=db_student.id)
    if not reports:
        raise HTTPException(status_code=404, detail="No therapy reports found for student.")

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

    filtered.sort(key=lambda r: r.report_date)
    return db_student, filtered



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

        # Log the incoming goals_achieved structure
        logging.info(f"Creating report for student {report_in.student_id}, therapy: {report_in.therapy_type}")
        if hasattr(report_in, 'goals_achieved') and report_in.goals_achieved:
            logging.info(f"goals_achieved type: {type(report_in.goals_achieved)}")
            if isinstance(report_in.goals_achieved, dict):
                logging.info(f"goals_achieved keys: {list(report_in.goals_achieved.keys())}")
                # Log first entry as sample
                for key, value in list(report_in.goals_achieved.items())[:1]:
                    logging.info(f"Sample entry - key: '{key}', value type: {type(value)}, value: {value}")

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


@router.post("/summary/ai/test", response_model=TherapyAISummaryResponse)
def ai_summarize_reports_test(
    payload: TherapyAISummaryRequest = Body(...),
    db: Session = Depends(deps.get_db),
) -> Any:
    """TEST ENDPOINT - Generate AI analysis WITHOUT authentication (for testing only).
    
    WARNING: This endpoint bypasses authentication. Remove in production!
    Use this only for testing the AI summarization functionality.
    """
    if not settings.HUGGINGFACE_API_TOKEN:
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_TOKEN environment variable not set on server.")

    db_student, filtered = _get_filtered_reports_for_payload(db, payload)
    analysis = _generate_comprehensive_analysis(filtered, db_student, payload)
    return analysis


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
    if not settings.HUGGINGFACE_API_TOKEN:
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_TOKEN environment variable not set on server.")
    
    # Debug: Log the token being used (first 15 chars only for security)
    token_prefix = settings.HUGGINGFACE_API_TOKEN[:15] if settings.HUGGINGFACE_API_TOKEN else "NONE"
    print(f"\n{'='*60}")
    print(f"AI SUMMARY REQUEST - Token prefix: {token_prefix}...")
    print(f"Student: {payload.student_id}, Model: {payload.model}")
    print(f"{'='*60}\n")

    db_student, filtered = _get_filtered_reports_for_payload(db, payload)
    
    # Generate comprehensive analysis based on actual data
    analysis = _generate_comprehensive_analysis(filtered, db_student, payload)
    return analysis


@router.post("/summary/ai/stream")
def ai_summarize_reports_stream(
    payload: TherapyAISummaryRequest = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: schemas.user.User = Depends(deps.get_current_active_user),
) -> Any:
    """Stream main summary progressively, then return full AI analysis as final event."""
    if not settings.HUGGINGFACE_API_TOKEN:
        raise HTTPException(status_code=503, detail="HUGGINGFACE_API_TOKEN environment variable not set on server.")

    db_student, filtered = _get_filtered_reports_for_payload(db, payload)

    def event_stream():
        try:
            # `client` is kept for backward-compat function signatures.
            # We now call HF Router directly in `_run_model_completion`.
            client = None
            model_name = payload.model or "meta-llama/Llama-3.3-70B-Instruct"
            main_summary_prompt = _build_main_summary_prompt_with_fewshot(filtered, db_student)

            streamed_summary_parts = []
            for chunk in _stream_model_completion(
                client=client,
                prompt=main_summary_prompt,
                model=model_name,
                max_tokens=2000,
                temperature=0.25,
            ):
                if not chunk:
                    continue
                streamed_summary_parts.append(chunk)
                yield f"event: summary\ndata: {json.dumps({'chunk': chunk})}\n\n"

            main_summary = "".join(streamed_summary_parts).strip()
            if _is_low_quality_summary(main_summary):
                logging.warning("Streamed main summary quality check failed; using structured fallback formatter")
                main_summary = _build_structured_summary_fallback(filtered, db_student)
                yield f"event: summary_replace\ndata: {json.dumps({'summary': main_summary})}\n\n"

            analysis = _generate_comprehensive_analysis(
                filtered,
                db_student,
                payload,
                precomputed_main_summary=main_summary,
            )

            analysis_payload = analysis.dict() if hasattr(analysis, "dict") else analysis
            yield f"event: complete\ndata: {json.dumps(analysis_payload)}\n\n"
        except Exception as e:
            logging.exception("AI summary stream failed")
            yield f"event: error\ndata: {json.dumps({'message': str(e)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _generate_comprehensive_analysis(reports, student, payload, precomputed_main_summary: Optional[str] = None):
    """Generate a comprehensive AI-powered analysis based on actual therapy report data."""
    client = None
    
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
    
    # Build a data-driven baseline once; use it for per-section fallback instead of
    # downgrading the entire response when a single AI call fails.
    baseline = _generate_fallback_analysis(reports, student, payload, improvement_metrics, date_range)

    model_name = payload.model or "meta-llama/Llama-3.3-70B-Instruct"

    # 1. Brief Overview - AI analyzes all reports for general progress
    try:
        overview_prompt = _build_overview_prompt_with_fewshot(reports, student)
        overview_result = _run_model_completion(
            client=client,
            prompt=overview_prompt,
            model=model_name,
            max_tokens=300,
            temperature=0.7
        )
        brief_overview = _extract_generated_text(overview_result)
    except Exception as e:
        logging.warning(f"Brief overview generation failed, using baseline: {e}")
        brief_overview = baseline.brief_overview

    # 2. Start Date Analysis - AI analyzes initial reports
    try:
        start_prompt = _build_start_analysis_prompt_with_fewshot(start_reports, student)
        start_result = _run_model_completion(
            client=client,
            prompt=start_prompt,
            model=model_name,
            max_tokens=350,
            temperature=0.7
        )
        start_analysis = _extract_generated_text(start_result)
    except Exception as e:
        logging.warning(f"Start-date analysis generation failed, using baseline: {e}")
        start_analysis = baseline.start_date_analysis

    # 3. Current Status Analysis - Enhanced with text generation for detailed insights
    end_analysis = _generate_enhanced_current_status_llama(client, end_reports, student, payload)

    # 4. Recommendations - AI generates based on progress patterns
    try:
        recommendations_prompt = _build_recommendations_prompt_with_fewshot(reports, improvement_metrics, student)
        rec_result = _run_model_completion(
            client=client,
            prompt=recommendations_prompt,
            model=model_name,
            max_tokens=400,
            temperature=0.7
        )
        recommendations = _extract_generated_text(rec_result)
    except Exception as e:
        logging.warning(f"Recommendations generation failed, using baseline: {e}")
        recommendations = baseline.recommendations

    # 5. Main Summary - AI analyzes all report content
    if precomputed_main_summary:
        main_summary = precomputed_main_summary
    else:
        try:
            main_summary_prompt = _build_main_summary_prompt_with_fewshot(reports, student)
            main_result = _run_model_completion(
                client=client,
                prompt=main_summary_prompt,
                model=model_name,
                max_tokens=2000,  # Large enough for detailed clinical paragraphs per section
                temperature=0.25  # Low temperature for faithful, data-grounded output
            )
            main_summary = _extract_generated_text(main_result)
            if _is_low_quality_summary(main_summary):
                logging.warning("Main summary quality check failed; using structured fallback formatter")
                main_summary = _build_structured_summary_fallback(reports, student)
        except Exception as e:
            logging.warning(f"Main summary generation failed, using structured report-based fallback: {e}")
            main_summary = _build_structured_summary_fallback(reports, student)
    
    return TherapyAISummaryResponse(
        student_id=payload.student_id,
        model=payload.model or "meta-llama/Llama-3.3-70B-Instruct",
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


def _extract_generated_text(result):
    """Extract generated text from Llama text generation result."""
    if isinstance(result, str):
        return result.strip()
    elif hasattr(result, 'choices') and len(result.choices) > 0:
        # Chat completion response
        message = result.choices[0].message
        content = getattr(message, "content", None)
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, str):
                    parts.append(item)
                elif isinstance(item, dict):
                    text = item.get("text") or item.get("content")
                    if isinstance(text, str):
                        parts.append(text)
            merged = "\n".join([p.strip() for p in parts if p and p.strip()]).strip()
            if merged:
                return merged
        return str(content).strip() if content is not None else ""
    elif isinstance(result, dict):
        if "generated_text" in result:
            return result["generated_text"].strip()
        elif "text" in result:
            return result["text"].strip()
        elif "choices" in result and isinstance(result["choices"], list) and result["choices"]:
            choice = result["choices"][0]
            if isinstance(choice, dict):
                message = choice.get("message", {})
                content = message.get("content") if isinstance(message, dict) else None
                if isinstance(content, str):
                    return content.strip()
    return str(result)[:1000]


def _run_model_completion(client, prompt, model, max_tokens, temperature):
    """Run chat completion via Hugging Face Router (OpenAI-compatible endpoint).

    Why: `huggingface_hub` <=0.24.x still targets `api-inference.huggingface.co` for model calls,
    which now returns 410 Gone. The router endpoint is the supported replacement.
    """

    base = getattr(settings, "HUGGINGFACE_BASE_URL", "https://router.huggingface.co") or "https://router.huggingface.co"
    base = base.rstrip("/")
    if base.endswith("/v1"):
        v1_base = base
    else:
        v1_base = f"{base}/v1"

    url = f"{v1_base}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": False,
    }

    # Keep timeouts bounded so API failures degrade gracefully to fallbacks.
    timeout = httpx.Timeout(60.0, connect=10.0)
    with httpx.Client(timeout=timeout) as http_client:
        resp = http_client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        return resp.json()


def _stream_model_completion(client, prompt, model, max_tokens, temperature):
    """Yield text chunks for progressive UI updates.

    Router streaming is possible, but to keep things robust and dependency-free,
    we do a single completion request and chunk the result.
    """
    result = _run_model_completion(
        client=client,
        prompt=prompt,
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    full_text = _extract_generated_text(result)
    for piece in _chunk_text_for_streaming(full_text):
        yield piece


def _extract_stream_chunk_text(chunk):
    """Extract incremental text from HF stream chunk object/dict shapes."""
    try:
        # Object form with OpenAI-like delta path
        choices = getattr(chunk, "choices", None)
        if choices:
            delta = getattr(choices[0], "delta", None)
            if delta is not None:
                content = getattr(delta, "content", None)
                if isinstance(content, str):
                    return content

        # Dict form fallback
        if isinstance(chunk, dict):
            choices_dict = chunk.get("choices")
            if isinstance(choices_dict, list) and choices_dict:
                delta_dict = choices_dict[0].get("delta", {}) if isinstance(choices_dict[0], dict) else {}
                content = delta_dict.get("content") if isinstance(delta_dict, dict) else None
                if isinstance(content, str):
                    return content
    except Exception:
        return ""
    return ""


def _chunk_text_for_streaming(text: str, chunk_size: int = 28):
    """Split completed text into small chunks for progressive UI updates."""
    if not text:
        return
    for i in range(0, len(text), chunk_size):
        yield text[i:i + chunk_size]


def _is_low_quality_summary(text):
    """Detect summaries that look like raw note dumps or malformed model output."""
    if not text or len(text.strip()) < 120:
        return True

    lowered = text.lower()
    raw_markers = [
        "- sarah",
        "sarah she",
        "exdpress",
        "gets really quiet when that happens",
    ]
    if any(marker in lowered for marker in raw_markers):
        return True

    # Require at least one section title marker for a clinical progress summary.
    if "**" not in text and "progress summary" not in lowered:
        return True

    return False


def _build_structured_summary_fallback(reports, student):
    """Build a section-based clinical summary from report content when AI main summary fails."""
    therapy_label = reports[0].therapy_type if reports and reports[0].therapy_type else "Therapy"

    therapy_sections = {
        "Speech Therapy": [
            "Receptive Language Skills (Comprehension)",
            "Expressive Language Skills",
            "Oral Motor & Oral Placement Therapy (OPT) Goals",
            "Pragmatic Language Skills (Social Communication)",
            "Narrative Skills",
        ],
        "Behavioral Therapy": [
            "Behavior Regulation & Self-Control",
            "Attention, Compliance & Task Engagement",
            "Emotional Regulation Skills",
            "Social Behavior & Interaction Skills",
            "Adaptive Behavior & Functional Skills",
        ],
        "Cognitive Therapy": [
            "Attention & Concentration Skills",
            "Memory & Recall Skills",
            "Problem Solving & Reasoning Skills",
            "Executive Functioning Skills",
            "Cognitive Flexibility & Processing Skills",
        ],
        "Occupational Therapy": [
            "Fine Motor Skills",
            "Sensory Processing & Integration",
            "Visual-Motor Integration Skills",
            "Activities of Daily Living (ADL)",
            "Handwriting & Pre-Academic Skills",
        ],
        "Physical Therapy": [
            "Gross Motor Skills",
            "Balance & Postural Control",
            "Strength & Endurance",
            "Coordination & Motor Planning",
            "Functional Mobility Skills",
        ],
    }

    def _clean_text(text):
        if not text:
            return ""
        cleaned = re.sub(r"\s+", " ", str(text)).strip()
        cleaned = re.sub(r"\b\d{4}-\d{2}-\d{2}\b", "", cleaned).strip()
        cleaned = cleaned.replace(" ,", ",")
        cleaned = cleaned.replace("exdpress", "express")
        cleaned = cleaned.replace("Exdpress", "Express")
        cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
        return cleaned

    def _to_clinical_sentence(note_text):
        if not note_text:
            return ""

        text = _clean_text(note_text)
        text = re.sub(r"^[\-•\s]+", "", text)
        # Remove student-name lead-ins to keep objective style.
        text = re.sub(r"^(Sarah|The student)\b\s*", "", text, flags=re.IGNORECASE)
        text = text.strip(" .")
        if not text:
            return ""

        # Split rough clauses and turn into 1-2 polished sentences.
        parts = [p.strip() for p in re.split(r"\s*(?:,|;|\band\b)\s*", text) if p.strip()]
        first = parts[0]
        first = first[0].upper() + first[1:] if len(first) > 1 else first.upper()
        sentence_1 = f"The student {first.lower() if first[:2].islower() else first}."

        if len(parts) > 1:
            second = parts[1]
            second = second[0].upper() + second[1:] if len(second) > 1 else second.upper()
            sentence_2 = second if second.endswith((".", "!", "?")) else f"{second}."
            return f"{sentence_1} {sentence_2}"

        return sentence_1

    ordered_titles = therapy_sections.get(therapy_label, [])
    extracted_titles = _extract_section_titles(reports)
    if not ordered_titles:
        ordered_titles = extracted_titles
    else:
        # Append non-standard sections while preserving known therapy order first.
        extras = [t for t in extracted_titles if t not in ordered_titles]
        ordered_titles = ordered_titles + extras

    lines = [f"{therapy_label} – Progress Summary", ""]

    if ordered_titles:
        sections_written = 0
        for title in ordered_titles:
            section_notes = []
            for report in reports:
                note = _extract_section_content(report, title)
                note = _clean_text(note)
                if note:
                    section_notes.append(note)

            # De-duplicate while preserving order
            unique_notes = []
            seen = set()
            for note in section_notes:
                key = note.lower()
                if key not in seen:
                    seen.add(key)
                    unique_notes.append(note)

            if not unique_notes:
                continue

            sections_written += 1
            lines.append(f"**{title}**")
            for note in unique_notes[:3]:
                note_text = _to_clinical_sentence(note[:340])
                if note_text:
                    lines.append(f"• {note_text}")
            lines.append("")

        if sections_written > 0:
            return "\n".join(lines).strip()

    # Last-resort structured summary from progress notes.
    general_notes = []
    for report in reports:
        if report.progress_notes and str(report.progress_notes).strip():
            cleaned = _clean_text(report.progress_notes)
            if cleaned:
                general_notes.append(cleaned)

    if general_notes:
        lines.append("**Clinical Observations**")
        for note in general_notes[:3]:
            note_text = _to_clinical_sentence(note[:360])
            if note_text:
                lines.append(f"• {note_text}")
        return "\n".join(lines).strip()

    return f"{therapy_label} – Progress Summary\n\nNo detailed clinical observations were available in the selected reports."


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
            prompt += f"Detailed Notes: {report.progress_notes}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved)
        if goals_text:
            prompt += f"Goals/Observations: {goals_text}\n"
    
    prompt += f"\nProvide a factual overview of {student_name}'s therapy progress based ONLY on the session data above. Summarize what the notes say without inventing details not present in the notes."
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
        
        if report.progress_notes:
            prompt += f"Assessment Notes: {report.progress_notes}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved)
        if goals_text:
            prompt += f"Goals/Observations: {goals_text}\n"
    
    prompt += f"\nBased on these early session records, describe {student_name}'s initial condition and starting challenges. Only reference details that appear in the notes above - do not invent observations."
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
        
        if report.progress_notes:
            context += f"  Progress Notes: {report.progress_notes}\n"
        
        goals_text = _goals_to_readable_text(report.goals_achieved)
        if goals_text:
            context += f"  Observations: {goals_text}\n"
        
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
        goals_text = _goals_to_readable_text(report.goals_achieved)
        if goals_text:
            prompt += f"Recent Observations: {goals_text}\n"
    
    prompt += f"\nBased on these recent session records, describe {student_name}'s current abilities and status. Only describe what the notes actually say - do not invent observations."
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
            prompt += f"Session Notes: {report.progress_notes}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved)
        if goals_text:
            prompt += f"Observations: {goals_text}\n"
    
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
        
        if report.progress_notes:
            notes = report.progress_notes[:300] + "..." if len(report.progress_notes) > 300 else report.progress_notes
            prompt += f"Notes: {notes}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved, 300)
        if goals_text:
            prompt += f"Goals/Observations: {goals_text}\n"
    
    # Add analysis of patterns and trends
    prompt += "\nKEY PATTERNS TO ANALYZE:\n"
    therapy_evolution = _analyze_therapy_evolution(reports)
    prompt += f"Therapy Evolution: {therapy_evolution}\n"
    
    progress_journey = _analyze_progress_journey(reports)
    prompt += f"Progress Journey: {progress_journey}\n"
    
    prompt += f"\nProvide a factual summary of {student_name}'s therapy journey based on the actual session data above. Only reference details explicitly mentioned in the notes."
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

# ============================================================================
# HELPER: Extract readable notes text from goals_achieved
# ============================================================================

def _goals_to_readable_text(goals_achieved, max_length=500):
    """Convert goals_achieved (dict or JSON string) into readable text for prompts.
    Returns a string like 'Behavioral Management: notes here; Emotional Regulation: notes here'
    instead of dumping raw dict/JSON."""
    parsed = _parse_goals_achieved(goals_achieved)
    if parsed is None:
        if isinstance(goals_achieved, str) and goals_achieved.strip():
            return goals_achieved.strip()[:max_length]
        return ""
    
    parts = []
    for key, value in parsed.items():
        if isinstance(value, dict):
            label = value.get('label', key)
            notes = value.get('notes', '').strip()
            if notes:
                parts.append(f"{label}: {notes}")
        elif isinstance(value, str) and value.strip():
            parts.append(f"{key}: {value.strip()}")
    
    if not parts:
        return ""
    return "; ".join(parts)[:max_length]


# ============================================================================
# HELPER: Parse goals_achieved (may be JSON string or dict)
# ============================================================================

def _parse_goals_achieved(goals_achieved):
    """Parse goals_achieved field which may be a JSON string, dict, or None.
    Returns a dict or None."""
    if goals_achieved is None:
        return None
    if isinstance(goals_achieved, dict):
        return goals_achieved
    if isinstance(goals_achieved, str):
        try:
            parsed = json.loads(goals_achieved)
            if isinstance(parsed, dict):
                return parsed
        except (json.JSONDecodeError, TypeError):
            logging.warning(f"Could not parse goals_achieved JSON string: {goals_achieved[:100]}")
    return None

# ============================================================================
# FEW-SHOT PROMPT BUILDERS WITH PROFESSIONAL EXAMPLES
# ============================================================================

def _extract_section_titles(reports):
    """Extract unique section titles from therapy reports' goals_achieved field."""
    section_titles = set()
    
    for report in reports:
        if report.goals_achieved:
            parsed = _parse_goals_achieved(report.goals_achieved)
            if isinstance(parsed, dict):
                # Get section labels from the parsed dict values
                for key, value in parsed.items():
                    if isinstance(value, dict) and value.get('label'):
                        section_titles.add(value['label'])
                    else:
                        section_titles.add(key)
            elif isinstance(report.goals_achieved, str):
                # Fallback: try to parse common section patterns from raw text
                import re
                matches = re.findall(r'^([A-Z][A-Za-z\s&(),]+(?:\s+and\s+[A-Z]+)?[A-Za-z\s]*):', report.goals_achieved, re.MULTILINE)
                section_titles.update([m.strip() for m in matches if m.strip()])
    
    # Return as sorted list for consistency
    return sorted(list(section_titles)) if section_titles else []


def _extract_section_content(report, section_name):
    """Extract content for a specific section from a report - ONLY from matching section."""
    if not report.goals_achieved:
        return ""
    
    parsed = _parse_goals_achieved(report.goals_achieved)
    
    if isinstance(parsed, dict):
        # Try matching by label first (new format), then by key
        for key, value in parsed.items():
            if isinstance(value, dict):
                label = value.get('label', '')
                notes = value.get('notes', '')
                if (label == section_name or key == section_name) and notes and notes.strip():
                    return notes.strip()[:300]
            elif isinstance(value, str) and value.strip():
                if key == section_name:
                    return value.strip()[:300]
        return ""
    
    # If goals_achieved is a raw string (not JSON), try regex extraction
    if isinstance(report.goals_achieved, str):
        import re
        pattern = rf"^{re.escape(section_name)}:\s*(.*?)(?=\n[A-Z][A-Za-z\s&(),]+(?:\s+and\s+[A-Z]+)?[A-Za-z\s]*:|$)"
        match = re.search(pattern, report.goals_achieved, re.DOTALL | re.MULTILINE)
        if match:
            return match.group(1).strip()[:300]
    
    return ""


# ============================================================================
# FEW-SHOT PROMPT BUILDERS WITH PROFESSIONAL EXAMPLES
# ============================================================================

def _build_overview_prompt_with_fewshot(reports, student):
    """Build overview prompt with few-shot examples for better quality output."""
    student_name = getattr(student, 'name', 'Student')
    
    # Extract actual section titles from goals_achieved field
    section_titles = _extract_section_titles(reports)
    
    # Few-shot examples matching the desired format
    prompt = """You are a clinical report summarization assistant for SPEECH THERAPY.

Generate a PROGRESS SUMMARY that consolidates multiple therapy sessions into one coherent report.

CRITICAL RULES:
- Use ONLY the exact section titles provided from the actual reports
- Do NOT invent, rename, or merge section titles
- Do NOT add sections that are not in the provided list
- Standard speech therapy sections: Receptive Language, Expressive Language, Oral Motor and OPT, Pragmatic Language, Narrative Skills
- NO dates, NO session numbers, NO "Session 1/2/3"
- NO Social-Emotional, Cognitive, or ADL sections unless explicitly in the reports
- STOP after completing all provided sections - do not add extra sections

WRITING REQUIREMENTS:
- For each section (Receptive, Expressive, Oral Motor, Pragmatic, Narrative), write 2-3 COMPLETE sentences describing current abilities and progress toward therapy goals
- Use formal, professional language suitable for a clinical report
- Highlight skills that have improved, are emerging, or need minimal support
- Avoid repeating the therapy goals themselves - focus on what the child CAN DO now
- Use consistent sentence starters with the child's name: "{student_name} demonstrates...", "{student_name} constructs...", "{student_name} shows..."
- For narrative and expressive sections, include higher-level descriptors like "uses transition words," "sequencing skills improving," "story comprehension developing"
- Each section MUST be at least 2-3 sentences to ensure a complete professional summary
- Use ONLY information from the reports - do NOT include details not mentioned (like age, grade, etc.)
- Avoid one-line bullet points or incomplete statements
- Use present tense for current abilities ("demonstrates", "shows", "can")
- Describe progress using phrases like "has improved", "is emerging", "needs support", "responds with moderate prompts"

EXAMPLE FORMAT:

PROGRESS SUMMARY
During therapy sessions, the child showed consistent participation and steady progress toward goals.

Receptive Language:
The child successfully follows three-step commands independently in most opportunities. Comprehension of prepositions has become consistent in structured activities. Understanding of pronouns is emerging and responds correctly with moderate prompts.

Expressive Language:
The child constructs 4-5 word utterances spontaneously and with minimal cues. Expresses needs appropriately and vocabulary has expanded to include descriptive words and basic verbs.

Oral Motor and OPT:
The child demonstrates improved oral motor control with reduced drooling. Chewing patterns show progress with harder textures. Tongue lateralization is emerging with verbal cues.

Pragmatic Language:
The child maintains eye contact during interactions and responds appropriately to greetings. Turn-taking skills have improved in structured play activities. Social initiation is emerging with adult support.

Narrative Skills:
The child sequences 2-3 picture cards with moderate verbal prompts. Retells simple stories using key vocabulary provided. Understanding of story elements is developing with visual supports.

NOW GENERATE FOR THIS STUDENT:
"""
    
    # Add actual student data with section-by-section breakdown
    prompt += f"\nStudent Name: {student_name}\n"
    prompt += f"Total Sessions: {len(reports)}\n"
    
    # If we found section titles, list them
    if section_titles:
        prompt += f"\nSection Titles to Use (EXACTLY as written):\n"
        for title in section_titles:
            prompt += f"  - {title}\n"
    
    # Provide session data organized by sections
    prompt += f"\nSession Data by Section:\n"
    for section in section_titles if section_titles else ["General Progress"]:
        prompt += f"\n{section}:\n"
        
        # Extract notes related to this section from early and recent sessions
        early_notes = []
        recent_notes = []
        
        for report in reports[:min(3, len(reports))]:  # Early sessions
            note = _extract_section_content(report, section)
            if note:
                early_notes.append(note)
        
        for report in reports[-min(3, len(reports)):]:  # Recent sessions
            note = _extract_section_content(report, section)
            if note:
                recent_notes.append(note)
        
        if early_notes:
            prompt += f"  Early sessions: {' '.join(early_notes[:2])}\n"
        if recent_notes:
            prompt += f"  Recent sessions: {' '.join(recent_notes[:2])}\n"
    
    prompt += f"\nGenerate a consolidated PROGRESS SUMMARY using the exact section titles listed above. Start with 'PROGRESS SUMMARY' as the heading, then list each section with a description of the child's current abilities and progress:\n"
    
    return prompt


def _build_start_analysis_prompt_with_fewshot(start_reports, student):
    """Build start analysis prompt with few-shot examples."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = """You are a clinical report summarization assistant.

Your role is to analyze initial therapy sessions and describe the baseline status.

Rules:
- Do NOT invent new section titles.
- Do NOT rename or merge section titles.
- Use ONLY the section titles exactly as they appear in the input reports.
- Maintain professional, therapist-friendly language.
- Describe the child's initial condition and challenges.
- Do not include dates, scores, or session-by-session repetition.

EXAMPLE 1:
Input: Alex, initial sessions showed poor motor skills, difficulty with pencil grip, reluctant to participate
Output: At the start of therapy, Alex presented with challenges in fine motor coordination. Pencil grip was inconsistent and required frequent correction. Hand strength appeared limited, affecting precise movements. Alex showed reluctance to engage in structured fine motor activities and needed significant encouragement to participate.

EXAMPLE 2:
Input: Maria, early sessions: poor articulation, shy, limited vocabulary, difficulty with 's' and 'th' sounds
Output: Initial sessions revealed articulation difficulties, particularly with 's' and 'th' sounds. Expressive vocabulary was limited compared to age expectations. Maria exhibited shyness that impacted her willingness to verbalize. She required substantial prompting to produce connected speech and often responded with single words rather than complete sentences.

NOW ANALYZE THIS STUDENT'S BASELINE:
"""
    
    prompt += f"Student Name: {student_name}\n"
    prompt += f"Initial Assessment Period: {len(start_reports)} early sessions\n\n"
    
    prompt += "Early Session Notes (actual baseline data):\n"
    for i, report in enumerate(start_reports, 1):
        if report.progress_notes:
            prompt += f"- {report.progress_notes[:200]}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved, 200)
        if goals_text:
            prompt += f"  Goals: {goals_text}\n"
    
    prompt += f"\nDescribe {student_name}'s initial baseline condition based on the early session notes above. Only describe what the notes say - do not invent details:\n"
    
    return prompt


def _generate_enhanced_current_status_llama(client, end_reports, student, payload):
    """Generate current status using Llama with few-shot examples."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = """You are a clinical report summarization assistant.

Your role is to describe the child's current abilities and status based on recent sessions.

Rules:
- Do NOT invent new section titles.
- Do NOT rename or merge section titles.
- Use ONLY the section titles exactly as they appear in the input reports.
- Maintain professional, therapist-friendly language.
- Describe current abilities and functioning level.
- Do not include dates, scores, or session-by-session repetition.

EXAMPLE 1:
Input: Michael, recent sessions show confident speaking, leads discussions, clear articulation
Output: Michael now demonstrates confident verbal communication. He initiates conversations independently and actively participates in group discussions. Articulation is clear and consistent across all previously targeted sounds. He requires minimal prompting to elaborate on responses and maintains topic relevance throughout conversations.

EXAMPLE 2:
Input: Emma, recent sessions show independent cutting, neat handwriting, proper pencil grip
Output: Emma currently exhibits age-appropriate fine motor skills. She completes cutting tasks independently with good precision along both straight and curved lines. Pencil grip is consistently appropriate without reminders. Handwriting is legible and properly sized. She demonstrates the hand strength and coordination needed for classroom activities.

NOW ANALYZE THIS STUDENT'S CURRENT STATUS:
"""
    
    prompt += f"Student Name: {student_name}\n"
    prompt += f"Analysis Period: {len(end_reports)} most recent sessions\n\n"
    
    prompt += "Recent Session Notes (current status data):\n"
    for report in end_reports:
        if report.progress_notes:
            prompt += f"- {report.progress_notes[:200]}\n"
        goals_text = _goals_to_readable_text(report.goals_achieved, 200)
        if goals_text:
            prompt += f"  Observations: {goals_text}\n"
    
    prompt += f"\nDescribe {student_name}'s current abilities and functioning level based on the notes above. Only describe what the notes say - do not invent details:\n"
    
    try:
        result = _run_model_completion(
            client=client,
            prompt=prompt,
            model=payload.model or "meta-llama/Llama-3.3-70B-Instruct",
            max_tokens=350,
            temperature=0.3
        )
        return _extract_generated_text(result)
    except Exception as e:
        logging.warning(f"Llama current status failed: {e}, using fallback")
        return _build_basic_current_status(end_reports, student)


def _build_recommendations_prompt_with_fewshot(reports, metrics, student):
    """Build recommendations prompt with few-shot examples."""
    student_name = getattr(student, 'name', 'Student')
    
    prompt = """You are a clinical report summarization assistant.

Your role is to provide professional recommendations based on the child's therapy progress.

Rules:
- Maintain professional, therapist-friendly language.
- Provide specific, actionable recommendations.
- Do not include dates, scores, or session numbers.
- Focus on next steps and future planning.

EXAMPLE 1:
Input: Student progressed significantly, now meeting age expectations, ready for mainstream
Output: The child has achieved the therapeutic goals and demonstrates skills appropriate for age level. Consider transitioning to classroom-based support with monitoring rather than direct therapy. A follow-up evaluation in several months would help ensure skill maintenance. The family may benefit from home strategies to continue reinforcing progress.

EXAMPLE 2:
Input: Student shows progress but needs continued support in specific areas
Output: Continued therapy is recommended to build upon current gains. Increasing session frequency may accelerate progress in remaining challenge areas. Implementing home practice activities in collaboration with the family would reinforce skills between sessions. Focus should remain on advancing expressive language and social communication skills.

NOW GENERATE RECOMMENDATIONS FOR:
"""
    
    prompt += f"Student Name: {student_name}\n"
    prompt += f"Total Sessions Completed: {len(reports)}\n"
    
    # Add early to later progression narrative
    if len(reports) >= 2:
        prompt += f"\nEarly Sessions Context:\n"
        for report in reports[:min(2, len(reports))]:
            if report.progress_notes:
                prompt += f"- {report.progress_notes[:150]}\n"
        
        prompt += f"\nRecent Sessions Context:\n"
        for report in reports[-min(2, len(reports)):]:
            if report.progress_notes:
                prompt += f"- {report.progress_notes[:150]}\n"
    
    prompt += f"\nGenerate professional recommendations for {student_name} based on the progress shown:\n"
    
    return prompt


def _build_main_summary_prompt_with_fewshot(reports, student):
    """Build main summary prompt with section-based bullet point format."""
    import logging
    
    student_name = getattr(student, 'name', 'Student')
    
    # Detect therapy type from reports
    therapy_type = None
    if reports and reports[0].therapy_type:
        therapy_type = reports[0].therapy_type
    
    # Define exact 5 sections for each therapy type (matching frontend)
    therapy_sections = {
        "Speech Therapy": [
            "Receptive Language Skills (Comprehension)",
            "Expressive Language Skills",
            "Oral Motor & Oral Placement Therapy (OPT) Goals",
            "Pragmatic Language Skills (Social Communication)",
            "Narrative Skills"
        ],
        "Behavioral Therapy": [
            "Behavior Regulation & Self-Control",
            "Attention, Compliance & Task Engagement",
            "Emotional Regulation Skills",
            "Social Behavior & Interaction Skills",
            "Adaptive Behavior & Functional Skills"
        ],
        "Cognitive Therapy": [
            "Attention & Concentration Skills",
            "Memory & Recall Skills",
            "Problem Solving & Reasoning Skills",
            "Executive Functioning Skills",
            "Cognitive Flexibility & Processing Skills"
        ],
        "Occupational Therapy": [
            "Fine Motor Skills",
            "Sensory Processing & Integration",
            "Visual-Motor Integration Skills",
            "Activities of Daily Living (ADL)",
            "Handwriting & Pre-Academic Skills"
        ],
        "Physical Therapy": [
            "Gross Motor Skills",
            "Balance & Postural Control",
            "Strength & Endurance",
            "Coordination & Motor Planning",
            "Functional Mobility Skills"
        ]
    }
    
    # Get the 5 sections for this therapy type
    predefined_sections = therapy_sections.get(therapy_type, therapy_sections["Speech Therapy"])
    
    # CRITICAL: Build mappings from old/alternate labels AND keys to standard sections
    # This handles reports saved with getGoalsForTherapyType() (old labels) and key variations
    label_aliases = {
        # Behavioral Therapy aliases (getGoalsForTherapyType used different labels)
        "Behavioral Management": "Behavior Regulation & Self-Control",
        "Emotional Regulation": "Emotional Regulation Skills",
        "Social Skills": "Social Behavior & Interaction Skills",
        "Coping Strategies": "Adaptive Behavior & Functional Skills",
        # Occupational Therapy aliases
        "Fine Motor Skills": "Fine Motor Skills",
        "Gross Motor Skills": "Gross Motor Skills",  
        "Daily Living Activities": "Activities of Daily Living (ADL)",
        "Sensory Integration": "Sensory Processing & Integration",
        # Physical Therapy aliases
        "Strength & Endurance": "Strength & Endurance",
        "Flexibility & Range of Motion": "Coordination & Motor Planning",
        "Balance & Coordination": "Balance & Postural Control",
        "Mobility & Gait": "Functional Mobility Skills",
    }
    
    # Key-based aliases: map JSON keys to standard section titles
    key_aliases = {
        # Behavioral Therapy keys
        "behavior_regulation": "Behavior Regulation & Self-Control",
        "behavioral_management": "Behavior Regulation & Self-Control",
        "attention_compliance": "Attention, Compliance & Task Engagement",
        "emotional_regulation": "Emotional Regulation Skills",
        "social_behavior": "Social Behavior & Interaction Skills",
        "social_skills": "Social Behavior & Interaction Skills",
        "adaptive_behavior": "Adaptive Behavior & Functional Skills",
        "coping_strategies": "Adaptive Behavior & Functional Skills",
    }
    
    # First, detect what labels actually exist in the reports
    actual_labels_in_reports = set()
    actual_keys_in_reports = set()
    for report in reports:
        parsed = _parse_goals_achieved(report.goals_achieved)
        if isinstance(parsed, dict):
            for key, value in parsed.items():
                actual_keys_in_reports.add(key)
                if isinstance(value, dict):
                    label = value.get('label', '').strip()
                    if label:
                        actual_labels_in_reports.add(label)
    
    logging.info(f"="*60)
    logging.info(f"AI SUMMARY EXTRACTION DEBUG INFO:")
    logging.info(f"Actual labels in reports: {actual_labels_in_reports}")
    logging.info(f"Actual keys in reports: {actual_keys_in_reports}")
    logging.info(f"Predefined sections for {therapy_type}: {predefined_sections}")
    logging.info(f"="*60)
    
    # Build reverse lookup: for each predefined section, which labels/keys should match?
    section_to_aliases = {}
    section_to_key_aliases = {}
    for section in predefined_sections:
        # Label aliases
        aliases = {section, section.lower()}
        for old_label, mapped_section in label_aliases.items():
            if mapped_section == section:
                aliases.add(old_label)
                aliases.add(old_label.lower())
        section_to_aliases[section] = aliases
        
        # Key aliases
        key_alias_set = set()
        for key, mapped_section in key_aliases.items():
            if mapped_section == section:
                key_alias_set.add(key)
                key_alias_set.add(key.lower())
        section_to_key_aliases[section] = key_alias_set
    
    # Check if ANY predefined section matches any report label
    any_match = False
    for section in predefined_sections:
        for actual_label in actual_labels_in_reports:
            if actual_label in section_to_aliases.get(section, set()) or actual_label == section:
                any_match = True
                break
    
    # If no predefined sections match, use the actual labels from reports instead
    if not any_match and actual_labels_in_reports:
        logging.warning(f"No predefined sections matched report labels. Using actual labels from reports.")
        section_titles = sorted(list(actual_labels_in_reports))
    else:
        section_titles = predefined_sections
    
    # Build prompt with therapy-specific context
    therapy_label = therapy_type if therapy_type else "Therapy"
    
    # Determine if this is a single-session or multi-session summary
    is_single_session = len(reports) == 1
    session_count_label = "1 session" if is_single_session else f"{len(reports)} sessions"
    
    prompt = f"""You are an objective clinical therapist writing a factual progress summary based STRICTLY on the session notes provided.

Generate a {therapy_label} Progress Summary for a student. You MUST only describe what is stated in the session notes below. Do NOT add, infer, or fabricate any observations, techniques, or details that are not explicitly written in the notes.

THIS SUMMARY IS BASED ON: {session_count_label}
"""
    
    if is_single_session:
        prompt += f"""*** SINGLE-SESSION RULES (CRITICAL — only 1 day of data) ***
- This is a SINGLE therapy session. There is NO timeline and NO progression.
- Do NOT use words like: "improved", "showed improvement", "progressed", "increased", "showed growth", "early session", "mid session", "recent session", "across sessions", "over time", "compared to earlier"
- INSTEAD use words like: "demonstrated", "attempted", "participated in", "practiced", "worked on", "engaged in", "was observed to", "required cues/prompts", "emerging", "with support", "during the session"
- Describe what was ATTEMPTED or OBSERVED during this single session, not improvement
- If goals are listed, describe them as targets that were worked on — not as achievements
"""
    else:
        prompt += f"""*** MULTI-SESSION RULES ({len(reports)} sessions) ***
- You may describe changes across sessions if the notes support it
- Use comparison language only when notes from different sessions show actual change
- If notes are similar across sessions, say performance was "consistent" or "stable" — not "improved"
"""
    
    prompt += f"""FORMAT REQUIREMENTS:
- Title: "{therapy_label} – Progress Summary"
- Generate ONLY the sections listed below that have session notes — do NOT generate sections with no data
- Each section must have 2-3 bullet points (use • for bullets)
- Each bullet point must be 2-3 COMPLETE SENTENCES
- Write in professional clinical language
- NO dates, NO session numbers

WRITING STYLE:
- Be OBJECTIVE and EVIDENCE-BASED: only summarize what the notes actually say
- If notes describe inconsistent, fluctuating, or uneven progress, say so directly - do NOT reframe it as positive
- If notes describe struggles, difficulties, or lack of progress, report that honestly
- If notes describe progress, report that accurately without exaggerating
- Use hedging language that matches the data: "sometimes", "inconsistently", "on some occasions" when the notes indicate variability
- NEVER fabricate specific techniques, tools, methods, or observations not mentioned in the notes
- NEVER add details like "eye contact", "visual aids", "role-playing", "deep breathing" unless the notes explicitly mention them

**CRITICAL: DO NOT GIVE ADVICE OR RECOMMENDATIONS**
- DO NOT write: "The therapist should...", "It is recommended...", "Continued support is needed...", "Further work is indicated...", "Additional practice would help..."
- DO NOT suggest strategies, interventions, or next steps
- ONLY describe what WAS OBSERVED in the session notes - past tense descriptions only
- This is a SUMMARY of progress, NOT a recommendation or treatment plan

CRITICAL ANTI-HALLUCINATION RULES:
- If the notes say "sometimes follows rules but needs reminders" → write about inconsistent rule-following and need for reminders. Do NOT say "significant improvement"
- If the notes say "progress is uneven" → write about uneven progress. Do NOT say "consistent improvement"
- If the notes say "struggles when upset" → write about difficulty during emotional distress. Do NOT say "notable progress in emotional regulation"
- EVERY claim in your summary must be directly traceable to a specific note provided below
- ONLY generate sections that are listed below — do NOT invent or add sections that are not provided
- Do NOT invert the tone of the notes (don't turn negative into positive or vice versa)

**SECTION ISOLATION — CRITICAL:**
- Each section's bullet points must ONLY describe notes listed under THAT section
- Do NOT move or copy notes from one section into another section
- If Section A's notes mention "lip closure" and Section B's notes mention "prepositions", do NOT swap them
- Every sentence must come from the notes of its OWN section
"""
    
    if is_single_session:
        prompt += f"""
EXAMPLE — Single-session summary (use THIS style for 1-session summaries):

**Receptive Language Skills (Comprehension)**
• During the session, the student demonstrated understanding of basic prepositions such as in, on, and under with verbal and visual cues. The student followed 3-step related commands in familiar routines with support.
• Understanding of personal pronouns (he, she, they) was emerging and required prompts during the session.

**Expressive Language Skills**
• The student used 4–5-word utterances to describe actions and express needs when provided with cues. Simple narrative retelling using 3 sequential events was attempted with support and modeling.

**Oral Motor & Oral Placement Therapy (OPT) Goals**
• The student participated in oral motor activities targeting lip closure, bilabial strength, and jaw stability. Tongue elevation, lateralization, and retraction were practiced with guidance and support.
"""
    else:
        prompt += f"""
EXAMPLE 1 – Inconsistent/fluctuating progress (use when notes describe mixed results):

**Behavior Regulation & Self-Control**
• The student followed rules on some days but frequently required reminders to stay on task. Progress in this area was inconsistent, with periods of improvement followed by regression to earlier behavior patterns.
• Impulsive behavior continued to be observed on certain days. Self-regulation skills were not reliably demonstrated across different contexts and sessions.

EXAMPLE 2 – Genuine progress (use ONLY when notes from different sessions clearly show change):

**Expressive Language Skills**
• The student showed improvement in using complete sentences to express needs, moving from single-word responses in earlier sessions to short phrases in recent sessions. More complex sentence structures were observed in the most recent sessions.
• Occasional difficulty with complex syntax remained, but overall expressive output had increased when comparing early and recent sessions.
"""

    prompt += f"""
NOW GENERATE FOR THIS STUDENT:

Student Name: {student_name}
Therapy Type: {therapy_label}
Total Sessions: {len(reports)}

REQUIRED SECTIONS (Use these EXACT titles in this EXACT order, with ** bold markers):
"""
    
    # ── PRE-COLLECT notes per section so we know which sections have data ──
    section_notes_map = {}  # title -> list of notes
    for title in section_titles:
        all_notes = []
        title_lower = title.lower().strip()
        aliases = section_to_aliases.get(title, {title, title_lower})
        title_clean = re.sub(r'[^a-z0-9\s]', ' ', title_lower)
        title_keywords = set(title_clean.split()) - {'and', 'the', 'of', 'for', 'in', 'skills', 'a', ''}
        
        logging.info(f"\n--- Searching for section: '{title}' ---")
        logging.info(f"  Title keywords: {title_keywords}")
        logging.info(f"  Known aliases: {aliases}")
        logging.info(f"  Key aliases: {section_to_key_aliases.get(title, set())}")
        
        for report in reports:
            parsed = _parse_goals_achieved(report.goals_achieved)
            if isinstance(parsed, dict):
                logging.info(f"Processing report ID={report.id} for section '{title}': keys={list(parsed.keys())}")
                
                for key, value in parsed.items():
                    if isinstance(value, dict):
                        label = value.get('label', '').strip()
                        notes = value.get('notes', '')
                        has_notes = notes and notes.strip()
                        
                        if not has_notes:
                            continue
                        
                        label_match = False
                        match_reason = None
                        
                        key_normalized = key.lower().replace('_', ' ').strip()
                        key_clean = re.sub(r'[^a-z0-9\\s]', ' ', key_normalized)
                        key_words = set(key_clean.split()) - {'and', 'the', 'of', 'for', 'in', 'skills', 'a', ''}
                        
                        if label == title:
                            label_match = True
                            match_reason = "exact label match"
                        
                        if not label_match and (label in aliases or label.lower() in aliases):
                            label_match = True
                            match_reason = "alias match"
                        
                        if not label_match and label and label.lower().strip() == title_lower:
                            label_match = True
                            match_reason = "case-insensitive exact match"
                        
                        if not label_match:
                            key_lower = key.lower().strip()
                            if key_lower in section_to_key_aliases.get(title, set()):
                                label_match = True
                                match_reason = "explicit key alias"
                        
                        if not label_match and key_words:
                            matching_words = key_words & title_keywords
                            if len(matching_words) >= 2:
                                label_match = True
                                match_reason = f"keyword match (2+ words): {matching_words}"
                            elif len(key_words) == 1 and key_words.issubset(title_keywords):
                                label_match = True
                                match_reason = f"single keyword match: {key_words}"
                        
                        if not label_match:
                            for alias in aliases:
                                alias_clean = re.sub(r'[^a-z0-9\s]', ' ', alias.lower())
                                alias_keywords = set(alias_clean.split()) - {'and', 'the', 'of', 'for', 'in', 'skills', 'a', ''}
                                if key_words and alias_keywords:
                                    matching = key_words & alias_keywords
                                    if len(matching) >= 2 or (len(key_words) == 1 and key_words.issubset(alias_keywords)):
                                        label_match = True
                                        match_reason = f"alias keyword match via '{alias}': {matching}"
                                        break
                        
                        if not label_match and label:
                            label_cleaned = re.sub(r'[^a-z0-9\s]', ' ', label.lower())
                            title_cleaned = re.sub(r'[^a-z0-9\s]', ' ', title_lower)
                            label_words = set(label_cleaned.split()) - {'and', 'the', 'of', 'for', 'in', 'skills', 'a', ''}
                            title_words_full = set(title_cleaned.split()) - {'and', 'the', 'of', 'for', 'in', 'skills', 'a', ''}
                            if label_words and title_words_full:
                                overlap = label_words & title_words_full
                                min_words = min(len(label_words), len(title_words_full))
                                required_matches = max(2, int(0.8 * min_words))
                                if len(overlap) >= required_matches:
                                    label_match = True
                                    match_reason = f"substring/overlap match ({len(overlap)}/{min_words} words): {overlap}"
                        
                        if label_match:
                            logging.info(f"  ✓ MATCH - Key='{key}', Label='{label}', Reason={match_reason}")
                            all_notes.append(notes.strip())
                        else:
                            logging.debug(f"  ✗ No match - Key='{key}', Label='{label}'")
                    elif isinstance(value, str) and value.strip():
                        if title.lower().replace(' ', '_').startswith(key.lower().replace(' ', '_')[:10]):
                            all_notes.append(value)
            else:
                logging.warning(f"Report ID={report.id}: goals_achieved could not be parsed (type={type(report.goals_achieved)})")
        
        logging.info(f"Section '{title}': Found {len(all_notes)} notes")
        section_notes_map[title] = all_notes
    
    # ── Filter to only sections that have notes ──
    active_sections = [t for t in section_titles if section_notes_map.get(t)]
    skipped_sections = [t for t in section_titles if not section_notes_map.get(t)]
    
    if skipped_sections:
        logging.info(f"Skipping sections with no data: {skipped_sections}")
    
    # List only the active sections in the prompt
    for i, title in enumerate(active_sections, 1):
        prompt += f"{i}. {title}\n"
    
    prompt += f"\nSession Notes by Section:\n"
    prompt += f"⚠️ CRITICAL RULE: For EACH section below, use ONLY the notes listed under that section's heading. DO NOT move notes between sections. ⚠️\n"
    
    # Provide section data — only sections that have notes
    for title in active_sections:
        all_notes = section_notes_map[title]
        prompt += f"\n━━━ {title} ━━━\n"
        prompt += f"(Write 2-3 bullets using ONLY the notes below)\n"
        
        if len(reports) == 1:
            for idx, note in enumerate(all_notes, 1):
                prompt += f"  [{idx}] {note[:300]}\n"
        elif len(all_notes) >= 3:
            prompt += f"  [1] Session 1: {all_notes[0][:250]}\n"
            prompt += f"  [2] Mid-point: {all_notes[len(all_notes)//2][:250]}\n"
            prompt += f"  [3] Latest: {all_notes[-1][:250]}\n"
        elif len(all_notes) == 2:
            prompt += f"  [1] First: {all_notes[0][:250]}\n"
            prompt += f"  [2] Second: {all_notes[-1][:250]}\n"
        else:
            prompt += f"  [1] {all_notes[0][:250]}\n"
    
    # SAFETY NET: If ALL sections have no notes, include raw progress_notes as general context
    # This handles cases where goals_achieved labels don't match any section
    all_sections_empty = True
    for title in section_titles:
        # Re-check quickly
        for report in reports:
            parsed = _parse_goals_achieved(report.goals_achieved)
            if isinstance(parsed, dict):
                for key, value in parsed.items():
                    if isinstance(value, dict) and value.get('notes', '').strip():
                        # There ARE notes in the data, they just didn't match sections
                        all_sections_empty = False
                        break
            if not all_sections_empty:
                break
        if not all_sections_empty:
            break
    
    if all_sections_empty:
        # Dump ALL available notes as general context
        prompt += f"\n--- ADDITIONAL CONTEXT (notes from reports that did not match specific sections) ---\n"
        for report in reports:
            if report.progress_notes and report.progress_notes.strip():
                prompt += f"  Progress notes: {report.progress_notes.strip()[:300]}\n"
            goals_text = _goals_to_readable_text(report.goals_achieved, 400)
            if goals_text:
                prompt += f"  Goal notes: {goals_text}\n"
        prompt += f"--- END ADDITIONAL CONTEXT ---\n"
        prompt += f"\nNOTE: The above notes did not match the predefined section titles. Distribute the information across the most relevant sections. Do NOT leave sections marked 'No documented data' if relevant notes exist above.\n"
    
    prompt += f"\nIMPORTANT REMINDERS:\n"
    prompt += f"- Write 2-3 sentences per bullet point (• symbol) based ONLY on the session notes above\n"
    prompt += f"- ONLY generate the {len(active_sections)} sections listed above — do NOT add extra sections or write 'No documented data'\n"
    prompt += f"- For each section: paraphrase and synthesize the notes faithfully — do NOT add information not in the notes\n"
    prompt += f"- SECTION ISOLATION: each section's bullets must ONLY use notes from THAT section — never borrow notes from other sections\n"
    if is_single_session:
        prompt += f"- SINGLE SESSION: Do NOT use improvement/progression language. Use: 'demonstrated', 'attempted', 'practiced', 'worked on', 'with support', 'emerging', 'during the session'\n"
        prompt += f"- SINGLE SESSION: Goals listed in notes are targets that were WORKED ON — do not claim they were achieved or improved\n"
    prompt += f"- If notes describe inconsistent or uneven progress, your summary MUST reflect that - do NOT reframe as improvement\n"
    prompt += f"- NEVER fabricate specific techniques, tools, or strategies not mentioned in the notes\n"
    prompt += f"\n**ABSOLUTE BAN ON RECOMMENDATIONS:**\n"
    prompt += f"- DO NOT write: 'support is needed', 'further work is indicated', 'continued practice', 'therapist should', 'it is recommended', 'would benefit from'\n"
    
    prompt += f"\n🔒 FINAL REMINDER - SECTION ISOLATION:\n"
    prompt += f"Each section is separated by ━━━ dividers above. When writing bullets for 'Behavior Regulation & Self-Control', use ONLY notes under that heading.\n"
    prompt += f"Do NOT copy notes from 'Emotional Regulation Skills' into 'Behavior Regulation & Self-Control' even if they mention similar topics.\n"
    prompt += f"If a note appears under Section A's heading, it belongs ONLY in Section A's output - NEVER in Section B, C, D, or E.\n"
    prompt += f"- ONLY describe what WAS observed or attempted — past tense, descriptive language ONLY\n"
    prompt += f"- This is a progress SUMMARY (describing what happened), NOT a treatment plan\n"
    prompt += f"\n- Match the EXACT tone of the notes: uncertain notes = uncertain summary, negative notes = honest summary\n"
    prompt += f"- Use bold **section titles** for each section\n"
    prompt += f"\nSTART YOUR RESPONSE WITH: '{therapy_label} – Progress Summary'\n"
    
    return prompt