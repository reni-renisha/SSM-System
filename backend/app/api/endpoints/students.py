from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.crud.student import student
from app.schemas.student import Student, StudentCreate, StudentUpdate
from app.db.session import get_db
from app.utils.pagination import PageParams, Page

router = APIRouter()

@router.get("/", response_model=Page[Student])
def read_students(
    db: Session = Depends(get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    class_name: Optional[str] = None
):
    """
    Retrieve students with optional search, filtering, and pagination.
    """
    students = student.get_filtered(
        db, 
        skip=pagination.skip, 
        limit=pagination.page_size,
        search=search,
        class_name=class_name
    )
    
    # Get the total count for pagination
    query = db.query(student.model)
    if search:
        from sqlalchemy import or_
        search_filter = or_(
            student.model.name.ilike(f"%{search}%"),
            student.model.admission_number.ilike(f"%{search}%"),
            student.model.student_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    if class_name:
        query = query.filter(student.model.class_name == class_name)
        
    total = query.count()
    
    return Page.create(
        items=students,
        total=total,
        params=pagination
    )

@router.post("/", response_model=Student)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student.
    """
    db_student = student.get_by_admission_number(db, admission_number=student_in.admission_number)
    if db_student:
        raise HTTPException(
            status_code=400,
            detail="Student with this admission number already exists"
        )
    return student.create(db=db, obj_in=student_in)

@router.get("/{student_id}", response_model=Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific student by ID.
    """
    db_student = student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return db_student

@router.put("/{student_id}", response_model=Student)
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a student's information.
    """
    db_student = student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    db_student = student.update(db=db, db_obj=db_student, obj_in=student_update)
    return db_student

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a student.
    """
    db_student = student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    student.remove(db=db, id=student_id)
    return {"message": "Student successfully deleted"} 