from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.api import deps

router = APIRouter()


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
