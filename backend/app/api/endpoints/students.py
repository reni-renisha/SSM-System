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
@router.get("/")
def read_students(
    db: Session = Depends(get_db),
    pagination: PageParams = Depends(),
    search: Optional[str] = None,
    class_name: Optional[str] = None
) -> Dict[str, Any]:
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

    # Serialize students safely (drop raw binary `photo`, add `photo_url`)
    students_with_photos = []
    for student_obj in students_from_db:
        # Only include table columns to avoid _sa_instance_state and binary data issues
        student_data = {c.name: getattr(student_obj, c.name) for c in student_obj.__table__.columns}
        # Convert photo bytes to base64 URL if present
        if student_data.get('photo'):
            try:
                b64_photo = base64.b64encode(student_data['photo']).decode('utf-8')
                student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
            except Exception:
                student_data['photo_url'] = None
        else:
            student_data['photo_url'] = None
        # Remove raw photo bytes to keep payload JSON-serializable
        student_data.pop('photo', None)
        # Strip file_data from documents to keep payload small and avoid encoding issues
        if student_data.get('documents'):
            student_data['documents'] = [
                {k: v for k, v in doc.items() if k != 'file_data'}
                for doc in student_data['documents']
            ]
        students_with_photos.append(student_data)

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

    # Return as dict to avoid Pydantic validation
    return {
        "items": students_with_photos,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size
    }
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

@router.get("/{student_id}")
def read_student(
    student_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get a specific student by ID, including a photo URL if available.
    """
    db_student = crud_student.get(db, id=student_id)
    if db_student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    # Build a safe, JSON-serializable dict from table columns
    student_data = {c.name: getattr(db_student, c.name) for c in db_student.__table__.columns}
    if student_data.get('photo'):
        try:
            b64_photo = base64.b64encode(student_data['photo']).decode('utf-8')
            student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
        except Exception:
            student_data['photo_url'] = None
    else:
        student_data['photo_url'] = None
    student_data.pop('photo', None)
    # Strip file_data from documents to keep payload small
    if student_data.get('documents'):
        student_data['documents'] = [
            {k: v for k, v in doc.items() if k != 'file_data'}
            for doc in student_data['documents']
        ]

    return student_data

@router.post("/{student_id}/photo")
def upload_student_photo(
    *,
    student_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Upload and update a student's photo.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    contents = file.file.read()
    update_data = {"photo": contents}
    updated_student = crud_student.update(db=db, db_obj=db_student, obj_in=update_data)

    # Return serialized student data with photo_url
    student_data = {c.name: getattr(updated_student, c.name) for c in updated_student.__table__.columns}
    if student_data.get('photo'):
        try:
            b64_photo = base64.b64encode(student_data['photo']).decode('utf-8')
            student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
        except Exception:
            student_data['photo_url'] = None
    else:
        student_data['photo_url'] = None
    student_data.pop('photo', None)
    # Strip file_data from documents
    if student_data.get('documents'):
        student_data['documents'] = [
            {k: v for k, v in doc.items() if k != 'file_data'}
            for doc in student_data['documents']
        ]
    return student_data

@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
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

    # Serialize the updated student safely
    student_data = {c.name: getattr(db_student, c.name) for c in db_student.__table__.columns}
    if student_data.get('photo'):
        try:
            b64_photo = base64.b64encode(student_data['photo']).decode('utf-8')
            student_data['photo_url'] = f"data:image/jpeg;base64,{b64_photo}"
        except Exception:
            student_data['photo_url'] = None
    else:
        student_data['photo_url'] = None
    student_data.pop('photo', None)
    # Strip file_data from documents
    if student_data.get('documents'):
        student_data['documents'] = [
            {k: v for k, v in doc.items() if k != 'file_data'}
            for doc in student_data['documents']
        ]
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

@router.post("/{student_id}/documents")
def upload_student_document(
    *,
    student_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    Upload a document/certificate (PDF) for a student. Maximum 5MB.
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Read file contents
    contents = file.file.read()
    file_size = len(contents)
    
    # Validate file size (5MB = 5 * 1024 * 1024 bytes)
    max_size = 5 * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(status_code=400, detail=f"File size exceeds 5MB limit. File size: {file_size / (1024 * 1024):.2f}MB")
    
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Convert to base64 for storage
    import base64
    from datetime import datetime
    import uuid
    b64_content = base64.b64encode(contents).decode('utf-8')
    
    # Create document entry with unique ID
    document_entry = {
        "id": str(uuid.uuid4()),
        "name": file.filename,
        "file_data": b64_content,
        "upload_date": datetime.now().isoformat(),
        "file_size": file_size
    }
    
    # Get existing documents or initialize empty list
    existing_docs = db_student.documents if db_student.documents else []
    if not isinstance(existing_docs, list):
        existing_docs = []
    
    # Make a copy to avoid mutating the original
    import copy
    docs_copy = copy.deepcopy(existing_docs)
    docs_copy.append(document_entry)
    
    # Update student with new documents list
    try:
        # Use direct SQLAlchemy update to avoid ORM issues
        from sqlalchemy import update as sa_update
        from app.models.student import Student
        stmt = sa_update(Student).where(Student.id == student_id).values(documents=docs_copy)
        db.execute(stmt)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")
    
    return {
        "message": "Document uploaded successfully",
        "document_name": file.filename,
        "file_size": file_size,
        "total_documents": len(docs_copy)
    }

@router.get("/{student_id}/documents")
def get_student_documents(
    student_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get all documents for a student.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    documents = db_student.documents if db_student.documents else []
    
    # Return documents without the large base64 data for listing
    documents_list = []
    for doc in documents:
        documents_list.append({
            "id": doc.get("id"),
            "name": doc.get("name"),
            "upload_date": doc.get("upload_date"),
            "file_size": doc.get("file_size")
        })
    
    return {
        "documents": documents_list,
        "total": len(documents_list)
    }

@router.get("/{student_id}/documents/{document_id}")
def download_student_document(
    student_id: int,
    document_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Download a specific document by UUID.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    documents = db_student.documents if db_student.documents else []
    
    # Find document by ID
    document = None
    for doc in documents:
        if doc.get("id") == document_id:
            document = doc
            break
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": document.get("id"),
        "name": document.get("name"),
        "file_data": f"data:application/pdf;base64,{document.get('file_data')}",
        "upload_date": document.get("upload_date"),
        "file_size": document.get("file_size")
    }

@router.delete("/{student_id}/documents/{document_id}")
def delete_student_document(
    student_id: int,
    document_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete a specific document by UUID.
    """
    db_student = crud_student.get(db, id=student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    documents = db_student.documents if db_student.documents else []
    
    # Find and remove document by ID
    document_found = False
    deleted_doc_name = None
    updated_documents = []
    for doc in documents:
        if doc.get("id") == document_id:
            document_found = True
            deleted_doc_name = doc.get("name")
            continue  # Skip this document (delete it)
        updated_documents.append(doc)
    
    if not document_found:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update student with new documents list
    try:
        from sqlalchemy import update as sa_update
        from app.models.student import Student
        stmt = sa_update(Student).where(Student.id == student_id).values(documents=updated_documents)
        db.execute(stmt)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
    
    return {
        "message": "Document deleted successfully",
        "document_name": deleted_doc_name
    }
