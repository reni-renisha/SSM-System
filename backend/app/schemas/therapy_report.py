from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional


class TherapyReportBase(BaseModel):
    report_date: date
    therapy_type: Optional[str] = None
    progress_notes: Optional[str] = None
    goals_achieved: Optional[str] = None
    progress_level: Optional[str] = None


class TherapyReportCreate(TherapyReportBase):
    student_id: int
    teacher_id: Optional[int] = None


class TherapyReportUpdate(BaseModel):
    report_date: Optional[date] = None
    therapy_type: Optional[str] = None
    progress_notes: Optional[str] = None
    goals_achieved: Optional[str] = None
    progress_level: Optional[str] = None


class TherapyReport(TherapyReportBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    student_id: int
    teacher_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime