from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any, Union
from datetime import date

from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate
from app.crud.base import CRUDBase
from app.utils.date_utils import get_today, generate_id_with_year_prefix

class CRUDStudent(CRUDBase[Student, StudentCreate, StudentUpdate]):
    def get_by_admission_number(self, db: Session, *, admission_number: str) -> Optional[Student]:
        return db.query(Student).filter(Student.admission_number == admission_number).first()
        
    def get_filtered(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        class_name: Optional[str] = None
    ) -> List[Student]:
        query = db.query(Student)
        
        if search:
            search_filter = or_(
                Student.name.ilike(f"%{search}%"),
                Student.admission_number.ilike(f"%{search}%"),
                Student.student_id.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        if class_name:
            query = query.filter(Student.class_name == class_name)
        
        return query.offset(skip).limit(limit).all()
    
    def create(self, db: Session, *, obj_in: StudentCreate) -> Student:
        # Generate student_id
        count = db.query(Student).count()
        student_id = generate_id_with_year_prefix("STU", count + 1)
        
        obj_in_data = obj_in.model_dump()
        today = get_today()
        db_obj = Student(
            student_id=student_id,
            created_at=today,
            updated_at=today,
            **obj_in_data
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Student,
        obj_in: Union[StudentUpdate, Dict[str, Any]]
    ) -> Student:
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
        
        update_data["updated_at"] = get_today()
        
        return super().update(db, db_obj=db_obj, obj_in=update_data)

student = CRUDStudent(Student) 