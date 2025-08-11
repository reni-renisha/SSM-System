from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.db.session import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
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
    phone_number = Column(String)
    email = Column(String)
    
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
    
    # Additional Fields
    created_at = Column(Date)
    updated_at = Column(Date) 