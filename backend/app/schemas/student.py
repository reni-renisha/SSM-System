from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional, Any, Dict

class StudentBase(BaseModel):
    # Core identity
    name: str
    age: Optional[int] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None

    # Class/roll information
    class_name: Optional[str] = None
    roll_no: Optional[str] = None

    # Address
    birth_place: Optional[str] = None
    house_name: Optional[str] = None
    street_name: Optional[str] = None
    post_office: Optional[str] = None
    pin_code: Optional[str] = None
    revenue_district: Optional[str] = None
    block_panchayat: Optional[str] = None
    local_body: Optional[str] = None
    taluk: Optional[str] = None

    # Contact
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    
    # Parent/Guardian Information
    father_name: Optional[str] = None
    father_education: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_education: Optional[str] = None
    mother_occupation: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_contact: Optional[str] = None
    
    # Academic Information
    academic_year: Optional[str] = None
    admission_number: Optional[str] = None
    admission_date: Optional[date] = None
    class_teacher: Optional[str] = None
    
    # Bank Details
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    branch: Optional[str] = None
    ifsc_code: Optional[str] = None
    
    # Special Needs Information
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
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
    case_record: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class Student(StudentInDBBase):
    pass

class StudentInDB(StudentInDBBase):
    pass 