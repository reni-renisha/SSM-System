from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional

class StudentBase(BaseModel):
    name: str
    dob: date
    gender: str
    religion: str
    caste: str
    class_name: str
    roll_no: str
    birth_place: str
    house_name: str
    street_name: str
    post_office: str
    pin_code: str
    revenue_district: str
    phone_number: str
    email: Optional[EmailStr] = None
    
    # Parent/Guardian Information
    father_name: str
    father_education: str
    father_occupation: str
    mother_name: str
    mother_education: str
    mother_occupation: str
    guardian_name: str
    guardian_relationship: str
    guardian_contact: str
    
    # Academic Information
    academic_year: str
    admission_number: str
    admission_date: date
    class_teacher: str
    
    # Bank Details
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    branch: Optional[str] = None
    ifsc_code: Optional[str] = None
    
    # Special Needs Information
    disability_type: str
    disability_percentage: float
    medical_conditions: Optional[str] = None
    allergies: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(StudentBase):
    pass

class StudentInDBBase(StudentBase):
    id: int
    student_id: str
    created_at: date
    updated_at: date

    class Config:
        from_attributes = True

class Student(StudentInDBBase):
    pass

class StudentInDB(StudentInDBBase):
    pass 