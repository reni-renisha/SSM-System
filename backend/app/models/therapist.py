from sqlalchemy import Column, Integer, String, Date, JSON
from app.db.session import Base

class Therapist(Base):
    __tablename__ = "therapists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    gender = Column(String, nullable=False)
    blood_group = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    aadhar_number = Column(String, unique=True, nullable=False)
    religion = Column(String, nullable=False)
    caste = Column(String, nullable=False)
    rci_number = Column(String, unique=True, nullable=False)
    rci_renewal_date = Column(Date, nullable=False)
    qualifications_details = Column(String, nullable=False)
    category = Column(String, nullable=False)
    email = Column(String, nullable=True)
    specialization = Column(String, nullable=True)  # e.g., Speech Therapy, Occupational Therapy, etc.
