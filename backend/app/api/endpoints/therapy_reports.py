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
    """Generate an AI summary of therapy reports for a student using Hugging Face Inference API.

    Notes:
      - Requires env var HUGGINGFACE_API_TOKEN (Hugging Face API token with read access)
      - If huggingface_hub not installed, returns 503
      - Applies optional filtering by date range and therapy type
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

    # Build prompt text
    parts: List[str] = []
    for rep in filtered:
        parts.append(
            f"Date: {rep.report_date}\n" \
            f"Therapy: {rep.therapy_type or 'N/A'}\n" \
            f"Progress Level: {rep.progress_level or 'N/A'}\n" \
            f"Progress Notes: {rep.progress_notes or ''}\n" \
            f"Goals Achieved: {rep.goals_achieved or ''}"
        )
    combined = "\n\n---\n\n".join(parts)

    MAX_CHARS = 12000
    truncated = False
    if len(combined) > MAX_CHARS:
        combined = combined[:MAX_CHARS] + "\n...(truncated)"
        truncated = True

    client = InferenceClient(api_key=settings.HUGGINGFACE_API_TOKEN)

    try:
        result = client.summarization(
            combined,
            model=payload.model or "facebook/bart-large-cnn"
        )
    except Exception as e:
        logging.exception("Hugging Face summarization failed")
        raise HTTPException(status_code=502, detail=f"Summarization failed: {e}")

    # huggingface_hub summarization returns a dict with 'summary_text'
    summary_text = ""
    if isinstance(result, dict) and result.get("summary_text"):
        summary_text = result["summary_text"].strip()
    else:
        # Fallback string conversion
        summary_text = str(result)[:1000]

    return TherapyAISummaryResponse(
        student_id=payload.student_id,
        model=payload.model or "facebook/bart-large-cnn",
        used_reports=len(filtered),
        truncated=truncated,
        summary=summary_text,
    )
