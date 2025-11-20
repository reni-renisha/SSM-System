from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Optional, Dict, Any
import json


class GoalItem(BaseModel):
    """Individual goal with checkbox and notes"""
    checked: bool = False
    notes: str = ""


class TherapyReportBase(BaseModel):
    report_date: date
    therapy_type: Optional[str] = None
    progress_notes: Optional[str] = None
    goals_achieved: Optional[Dict[str, Any]] = None
    progress_level: Optional[str] = None

    @field_validator('goals_achieved', mode='before')
    @classmethod
    def parse_goals_achieved(cls, v):
        """Parse goals_achieved if it's a JSON string"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v


class TherapyReportCreate(TherapyReportBase):
    student_id: int
    teacher_id: Optional[int] = None


class TherapyReport(TherapyReportBase):
    id: int
    student_id: int
    teacher_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    @field_validator('goals_achieved', mode='before')
    @classmethod
    def parse_goals_achieved(cls, v):
        """Parse goals_achieved if it's a JSON string"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return v
        return v

    class Config:
        from_attributes = True
        orm_mode = True  # Keep for backwards compatibility
