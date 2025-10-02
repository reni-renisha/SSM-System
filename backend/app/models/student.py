from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Float, LargeBinary # 👈 Updated
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.db.session import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    dob = Column(Date)
    gender = Column(String)
    religion = Column(String)
    caste = Column(String)
    class_name = Column(String)
    roll_no = Column(String)
    birth_place = Column(String)
    house_name = Column(String)
    street_name = Column(String)
    post_office = Column(String)
    pin_code = Column(String)
    revenue_district = Column(String)
    block_panchayat = Column(String, nullable=True)
    local_body = Column(String, nullable=True)
    taluk = Column(String, nullable=True)
    phone_number = Column(String)
    email = Column(String)
    aadhar_number = Column(String, unique=True, index=True, nullable=True)
    
    # Parent/Guardian Information
    father_name = Column(String)
    father_education = Column(String)
    father_occupation = Column(String)
    mother_name = Column(String)
    mother_education = Column(String)
    mother_occupation = Column(String)
    guardian_name = Column(String)
    guardian_relationship = Column(String)
    guardian_contact = Column(String)
    # Special Needs Information
    disability_type = Column(String, nullable=True) 
    disability_percentage = Column(Float, nullable=True) 


    
    # Academic Information
    academic_year = Column(String)
    admission_number = Column(String)
    admission_date = Column(Date)
    class_teacher = Column(String)
    
    # Bank Details
    bank_name = Column(String)
    account_number = Column(String)
    branch = Column(String)
    ifsc_code = Column(String)
    
    # Special Needs Information
    disability_type = Column(String)
    disability_percentage = Column(Float)
    medical_conditions = Column(Text)
    allergies = Column(Text)
    identification_marks = Column(Text, nullable=True)
    
    # Additional Fields
    photo = Column(LargeBinary, nullable=True) # 👈 Add this line for the image
    created_at = Column(Date)
    updated_at = Column(Date)

    # Case record stored as JSON for flexible schema
    case_record = Column(JSONB)