from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class TherapistBase(BaseModel):
    name: str
    address: str
    date_of_birth: date
    gender: str
    blood_group: str
    mobile_number: str
    aadhar_number: str
    religion: str
    caste: str
    rci_number: str
    rci_renewal_date: date
    qualifications_details: str
    category: str
    email: Optional[str] = None
    specialization: Optional[str] = None

class TherapistCreate(TherapistBase):
    pass

class TherapistUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    mobile_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None
    rci_number: Optional[str] = None
    rci_renewal_date: Optional[date] = None
    qualifications_details: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None

class Therapist(TherapistBase):
    id: int

    class Config:
        from_attributes = True
