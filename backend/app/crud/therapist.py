from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.therapist import Therapist
from app.schemas.therapist import TherapistCreate, TherapistUpdate

def get_therapist(db: Session, therapist_id: int) -> Optional[Therapist]:
    return db.query(Therapist).filter(Therapist.id == therapist_id).first()

def get_therapists(db: Session, skip: int = 0, limit: int = 100) -> List[Therapist]:
    return db.query(Therapist).offset(skip).limit(limit).all()

def create_therapist(db: Session, therapist: TherapistCreate) -> Therapist:
    db_therapist = Therapist(**therapist.dict())
    db.add(db_therapist)
    db.commit()
    db.refresh(db_therapist)
    return db_therapist

def update_therapist(db: Session, therapist_id: int, therapist: TherapistUpdate) -> Optional[Therapist]:
    db_therapist = get_therapist(db, therapist_id)
    if db_therapist:
        update_data = therapist.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_therapist, key, value)
        db.commit()
        db.refresh(db_therapist)
    return db_therapist

def delete_therapist(db: Session, therapist_id: int) -> bool:
    db_therapist = get_therapist(db, therapist_id)
    if db_therapist:
        db.delete(db_therapist)
        db.commit()
        return True
    return False

def search_therapists(db: Session, search: str, skip: int = 0, limit: int = 100) -> List[Therapist]:
    query = db.query(Therapist)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Therapist.name.ilike(search_filter)) |
            (Therapist.mobile_number.ilike(search_filter)) |
            (Therapist.qualifications_details.ilike(search_filter)) |
            (Therapist.specialization.ilike(search_filter))
        )
    return query.offset(skip).limit(limit).all()
