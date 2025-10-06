from typing import List
from sqlalchemy.orm import Session
from app.models.therapy_report import TherapyReport
from app.schemas.therapy_report import TherapyReportCreate


def create(db: Session, *, obj_in: TherapyReportCreate) -> TherapyReport:
    db_obj = TherapyReport(
        student_id=obj_in.student_id,
        teacher_id=obj_in.teacher_id,
        report_date=obj_in.report_date,
        therapy_type=obj_in.therapy_type,
        progress_notes=obj_in.progress_notes,
        goals_achieved=obj_in.goals_achieved,
        progress_level=obj_in.progress_level,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_by_student(db: Session, student_id: int) -> List[TherapyReport]:
    return db.query(TherapyReport).filter(TherapyReport.student_id == student_id).order_by(TherapyReport.report_date.desc()).all()
