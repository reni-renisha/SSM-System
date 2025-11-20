# In app/schemas/student.py

import base64
from pydantic import BaseModel, EmailStr, computed_field
from datetime import date
from typing import Optional, Any, Dict

# 1. Corrected Base Schema with NO Duplicates
class StudentBase(BaseModel):
    # Core Identity
    name: Optional[str] = None
    age: Optional[int] = None
    dob: Optional[date] = None
    gender: Optional[str] = None
    religion: Optional[str] = None
    caste: Optional[str] = None
    category: Optional[str] = None
    blood_group: Optional[str] = None

    # Class & Roll Info
    class_name: Optional[str] = None
    roll_no: Optional[str] = None
    academic_year: Optional[str] = None
    admission_number: Optional[str] = None
    admission_date: Optional[date] = None
    class_teacher: Optional[str] = None

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
    address_and_phone: Optional[str] = None

    # Contact
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None

    # Family Info
    father_name: Optional[str] = None
    father_education: Optional[str] = None
    father_occupation: Optional[str] = None
    mother_name: Optional[str] = None
    mother_education: Optional[str] = None
    mother_occupation: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_occupation: Optional[str] = None
    guardian_relationship: Optional[str] = None
    guardian_contact: Optional[str] = None
    total_family_income: Optional[str] = None

    # Bank Details
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    branch: Optional[str] = None
    ifsc_code: Optional[str] = None

    # Identification & Medical
    aadhar_number: Optional[str] = None
    disability_type: Optional[str] = None
    disability_percentage: Optional[float] = None
    identification_marks: Optional[str] = None
    specific_diagnostic: Optional[str] = None
    medical_conditions: Optional[str] = None
    is_on_regular_drugs: Optional[str] = None
    allergies: Optional[str] = None
    drug_allergy: Optional[str] = None
    food_allergy: Optional[str] = None
    drug_history: Optional[Any] = None
    household: Optional[Any] = None

    # Case Record Fields
    informant_name: Optional[str] = None
    informant_relationship: Optional[str] = None
    duration_of_contact: Optional[str] = None
    present_complaints: Optional[str] = None
    previous_treatments: Optional[str] = None
    family_history_mental_illness: Optional[str] = None
    family_history_mental_retardation: Optional[str] = None
    family_history_epilepsy: Optional[str] = None
    prenatal_history: Optional[str] = None
    natal_history: Optional[str] = None
    postnatal_history: Optional[str] = None
    school_history: Optional[str] = None
    occupational_history: Optional[str] = None
    behaviour_problems: Optional[str] = None
    psychological_assessment: Optional[str] = None
    medical_examination: Optional[str] = None
    diagnosis: Optional[str] = None
    management_plan: Optional[str] = None

    # Activities of Daily Living / Self-help & Adaptive
    eating_habits: Optional[str] = None
    drinking_habits: Optional[str] = None
    toilet_habits: Optional[str] = None
    brushing: Optional[str] = None
    bathing: Optional[str] = None
    dressing_removing_wearing: Optional[str] = None
    dressing_buttoning: Optional[str] = None
    dressing_footwear: Optional[str] = None
    dressing_grooming: Optional[str] = None

    # Motor / Sensory / Communication
    gross_motor: Optional[str] = None
    fine_motor: Optional[str] = None
    sensory: Optional[str] = None
    language_communication: Optional[str] = None
    social_behaviour: Optional[str] = None
    mobility_in_neighborhood: Optional[str] = None

    # Cognitive / Attention / Functional
    attention: Optional[str] = None
    identification_of_objects: Optional[str] = None
    use_of_objects: Optional[str] = None
    following_instruction: Optional[str] = None
    awareness_of_danger: Optional[str] = None

    # Concept formation
    concept_color: Optional[str] = None
    concept_size: Optional[str] = None
    concept_sex: Optional[str] = None
    concept_shape: Optional[str] = None
    concept_number: Optional[str] = None
    concept_time: Optional[str] = None
    concept_money: Optional[str] = None

    # Academic & Prevocational
    academic_reading: Optional[str] = None
    academic_writing: Optional[str] = None
    academic_arithmetic: Optional[str] = None
    prevocational_ability: Optional[str] = None
    prevocational_interest: Optional[str] = None
    prevocational_dislike: Optional[str] = None

    # Behaviours / Observations / Recommendations
    any_peculiar_behaviour: Optional[str] = None
    any_other: Optional[str] = None
    observations: Optional[str] = None
    recommendation: Optional[str] = None

    # Development History Booleans
    smiles_at_other: bool = False
    head_control: bool = False
    sitting: bool = False
    responds_to_name: bool = False
    babbling: bool = False
    first_words: bool = False
    standing: bool = False
    walking: bool = False
    two_word_phrases: bool = False
    toilet_control: bool = False
    sentences: bool = False
    physical_deformity: bool = False
    
    photo: Optional[bytes] = None

    class Config:
        # Allow arbitrary types including bytes without validation
        arbitrary_types_allowed = True

# 2. Schema for CREATING
class StudentCreate(StudentBase):
    name: str

# 3. Schema for UPDATING
class StudentUpdate(StudentBase):
    pass

# 4. Schema for API RESPONSES
class Student(StudentBase):
    id: int
    student_id: str
    created_at: date
    updated_at: date
    case_record: Optional[Dict[str, Any]] = None
    # Don't include photo in response, only photo_url

    @computed_field
    @property
    def photo_url(self) -> Optional[str]:
        if self.photo:
            try:
                b64_photo = base64.b64encode(self.photo).decode("utf-8")
                return f"data:image/jpeg;base64,{b64_photo}"
            except Exception:
                return None
        return None

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True
        # Exclude photo bytes from JSON response
        exclude = {'photo'}