from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.crud import therapist as crud_therapist
from app.schemas import therapist as schemas_therapist

router = APIRouter()

@router.get("/", response_model=List[schemas_therapist.Therapist])
def read_therapists(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(deps.get_db)
):
    """
    Retrieve therapists.
    """
    if search:
        therapists = crud_therapist.search_therapists(db, search=search, skip=skip, limit=limit)
    else:
        therapists = crud_therapist.get_therapists(db, skip=skip, limit=limit)
    return therapists

@router.post("/", response_model=schemas_therapist.Therapist)
def create_therapist(
    therapist: schemas_therapist.TherapistCreate,
    db: Session = Depends(deps.get_db)
):
    """
    Create new therapist.
    """
    return crud_therapist.create_therapist(db=db, therapist=therapist)

@router.get("/{therapist_id}", response_model=schemas_therapist.Therapist)
def read_therapist(
    therapist_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Get therapist by ID.
    """
    db_therapist = crud_therapist.get_therapist(db, therapist_id=therapist_id)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return db_therapist

@router.put("/{therapist_id}", response_model=schemas_therapist.Therapist)
def update_therapist(
    therapist_id: int,
    therapist: schemas_therapist.TherapistUpdate,
    db: Session = Depends(deps.get_db)
):
    """
    Update a therapist.
    """
    db_therapist = crud_therapist.update_therapist(db, therapist_id=therapist_id, therapist=therapist)
    if db_therapist is None:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return db_therapist

@router.delete("/{therapist_id}")
def delete_therapist(
    therapist_id: int,
    db: Session = Depends(deps.get_db)
):
    """
    Delete a therapist.
    """
    success = crud_therapist.delete_therapist(db, therapist_id=therapist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Therapist not found")
    return {"message": "Therapist deleted successfully"}
