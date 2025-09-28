import base64
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict

# Renamed import to avoid variable name conflicts
from app.crud.student import student as crud_student
from app.schemas.student import Student, StudentCreate, StudentUpdate
from app.db.session import get_db
from app.utils.pagination import PageParams, Page

router = APIRouter()

# --------------------------------------------------------------------
# ▼▼▼ THIS IS THE FULLY MODIFIED FUNCTION ▼▼▼
# --------------------------------------------------------------------
@router.get("/", response_model=Page[Student])
def read_students(
    db: Session = Depends(get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    class_name: Optional[str] = None
) -> Any: # Changed return type for flexibility
    """
    Retrieve students with optional search, filtering, and pagination.
    """
    students_from_db = crud_student.get_filtered(
        db,
        skip=pagination.skip,
        limit=pagination.page_size,
        search=search,
        class_name=class_name
    )

    # ++ NEW: Process photos for each student in the list ++
    students_with_photos = []
    for student_obj in students_from_db:
        student_data = student_obj.__dict__
        if student_obj.photo:
            b64_photo = base64.b64encode(student_obj.photo).decode("utf-8")
            student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
        else:
            student_data['photo_url'] = None
        students_with_photos.append(student_data)
    # ++ END OF NEW PHOTO LOGIC ++

    # Get the total count for pagination
    query = db.query(crud_student.model)
    if search:
        from sqlalchemy import or_
        search_filter = or_(
            crud_student.model.name.ilike(f"%{search}%"),
            crud_student.model.admission_number.ilike(f"%{search}%"),
            crud_student.model.student_id.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    if class_name:
        query = query.filter(crud_student.model.class_name == class_name)

    total = query.count()

    # Return the new list that contains the photo URLs
    return Page.create(
        items=students_with_photos, # Use the new list with photo URLs
        total=total,
        params=pagination
    )
# --------------------------------------------------------------------
# ▲▲▲ END OF MODIFIED FUNCTION ▲▲▲
# --------------------------------------------------------------------


@router.post("/", response_model=Student)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student.
    """
    if student_in.admission_number:
        db_student = crud_student.get_by_admission_number(db, admission_number=student_in.admission_number)
        if db_student:
            raise HTTPException(
                status_code=400,
                detail="Student with this admission number already exists"
            )
    return crud_student.create(db=db, obj_in=student_in)

@router.put("/{student_id}/case-record", response_model=Student)
def upsert_case_record(
    student_id: int,
    case_record: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Create/update a student's case record.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    updated = crud_student.update_case_record(db=db, db_obj=db_student, case_record=case_record)
    return updated

@router.get("/{student_id}", response_model=Student)
def read_student(
    student_id: int,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get a specific student by ID, including a photo URL if available.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    student_data = db_student.__dict__
    
    if db_student.photo:
        b64_photo = base64.b64encode(db_student.photo).decode("utf-8")
        student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
    else:
        student_data['photo_url'] = None

    return student_data

@router.post("/{student_id}/photo", response_model=Student)
def upload_student_photo(
    *,
    student_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload and update a student's photo.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    contents = file.file.read()
    update_data = {"photo": contents}
    updated_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)
    
    return updated_student

@router.put("/{student_id}", response_model=Student)
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a student's information.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # If photo is being updated, handle it
    update_data = student_update.model_dump(exclude_unset=True)
    if 'photo' in update_data and update_data['photo'] is not None:
        update_data['photo'] = update_data['photo']  # bytes expected
    db_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)

    # Prepare response with photo_url if photo exists
    student_data = db_student.__dict__
    if db_student.photo:
        b64_photo = base64.b64encode(db_student.photo).decode("utf-8")
        student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
    else:
        student_data['photo_url'] = None
    return student_data

@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a student.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    crud_student.remove(db=db, id=student_id)
    return {"message": "Student successfully deleted"}

