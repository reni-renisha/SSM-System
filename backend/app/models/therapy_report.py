from sqlalchemy import Column, Integer, String, ForeignKey, Date, Text, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base


class TherapyReport(Base):
    __tablename__ = "therapy_reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    report_date = Column(Date, nullable=False)
    therapy_type = Column(String, nullable=True)
    progress_notes = Column(Text, nullable=True)
    goals_achieved = Column(Text, nullable=True)
    progress_level = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
