from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
import enum

# --- Enums ---

class UserRole(str, enum.Enum):
    doctor = "doctor"
    patient = "patient"

class BloodGroup(str, enum.Enum):
    A_pos = "A+"
    A_neg = "A-"
    B_pos = "B+"
    B_neg = "B-"
    AB_pos = "AB+"
    AB_neg = "AB-"
    O_pos = "O+"
    O_neg = "O-"
    unknown = "Unknown"

# --- User ---

class UserBase(BaseModel):
    email: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token ---

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Doctor ---

class DoctorBase(BaseModel):
    full_name: str
    specialization: str
    registration_number: str
    phone: Optional[str] = None
    profile_picture_url: Optional[str] = None
    clinics: List[Dict[str, Any]] = []

class DoctorCreate(DoctorBase):
    user_id: str

class DoctorResponse(DoctorBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Patient ---

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: BloodGroup = BloodGroup.unknown
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    emergency_contact: Optional[Dict[str, Any]] = None

class PatientCreate(PatientBase):
    user_id: str

class PatientResponse(PatientBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Diagnosis ---

class DiagnosisBase(BaseModel):
    patient_id: str
    disease_name: str
    disease_category: Optional[str] = None
    icd_code: Optional[str] = None
    stage: Optional[str] = None
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    tests_ordered: List[Dict[str, Any]] = []
    test_results: List[Dict[str, Any]] = []
    doctor_notes: Optional[str] = None

class DiagnosisCreate(DiagnosisBase):
    doctor_id: str

class DiagnosisResponse(DiagnosisBase):
    id: str
    doctor_id: str
    ai_recommendations: Dict[str, Any] = {}
    patient_explanation: Optional[str] = None
    status: str
    diagnosed_at: datetime

    class Config:
        from_attributes = True

# --- Medication ---

class MedicationBase(BaseModel):
    patient_id: str
    name: str
    dosage: str
    frequency: str
    route: str = "oral"
    schedule_times: List[str] = []
    instructions: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    duration_days: Optional[int] = None

class MedicationCreate(MedicationBase):
    doctor_id: str
    diagnosis_id: Optional[str] = None

class MedicationResponse(MedicationBase):
    id: str
    doctor_id: str
    status: str
    prescribed_at: datetime

    class Config:
        from_attributes = True

# --- SOS ---

class SOSBase(BaseModel):
    message: str
    priority: str = "high"

class SOSCreate(SOSBase):
    patient_id: str

class SOSResponse(SOSBase):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
