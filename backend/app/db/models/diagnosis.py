import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text, Enum, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class DiagnosisStatus(str, enum.Enum):
    active = "active"
    improving = "improving"
    stable = "stable"
    critical = "critical"
    discharged = "discharged"


class Diagnosis(Base):
    __tablename__ = "diagnoses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)

    # Disease info — comes from dropdown fed by AI
    disease_name = Column(String, nullable=False)
    disease_category = Column(String)
    icd_code = Column(String)  # International Classification of Diseases code
    stage = Column(String)  # e.g. "Stage 2", "Acute", "Chronic"

    # Clinic where diagnosed
    clinic_name = Column(String)
    clinic_address = Column(String)

    # Tests ordered — dynamic list of {test_name, ordered_at}
    tests_ordered = Column(JSON, default=list)

    # Test results — dynamic {test_name: result_value, unit, reference_range, result_at}
    test_results = Column(JSON, default=list)

    # AI-generated recommendations based on disease + stage
    ai_recommendations = Column(JSON, default=dict)
    # {
    #   "medications": [...],
    #   "dosage_guidance": [...],
    #   "recovery_timeline": "...",
    #   "precautions": [...],
    #   "follow_up_in_days": int
    # }

    # Plain-language explanation for patient (non-scary)
    patient_explanation = Column(Text)

    # Doctor's written summary
    doctor_notes = Column(Text)

    status = Column(Enum(DiagnosisStatus), default=DiagnosisStatus.active)
    diagnosed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="diagnoses")
    patient = relationship("Patient", back_populates="diagnoses")
