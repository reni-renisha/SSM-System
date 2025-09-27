from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
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
        """
        Create a new student with a reliable, unique student_id.
        """
        # Find the last student created by looking for the highest primary key 'id'
        last_student = db.query(self.model).order_by(desc(self.model.id)).first()
        
        if last_student:
            # If a student exists, increment their primary key 'id' by 1 for the new ID
            next_id_num = last_student.id + 1
        else:
            # If the table is empty, start the count at 1
            next_id_num = 1
        
        # Generate the unique student_id using the reliable next number
        student_id = generate_id_with_year_prefix("STU", next_id_num)
        
        obj_in_data = obj_in.model_dump()
        today = get_today()
        db_obj = self.model(
            **obj_in_data,
            student_id=student_id,
            created_at=today,
            updated_at=today
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

    def update_case_record(
        self,
        db: Session,
        *,
        db_obj: Student,
        case_record: Dict[str, Any]
    ) -> Student:
        update_data: Dict[str, Any] = {
            "case_record": case_record,
            "updated_at": get_today(),
        }
        return super().update(db, db_obj=db_obj, obj_in=update_data)

student = CRUDStudent(Student)