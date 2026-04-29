import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Float, JSON, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


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


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    date_of_birth = Column(Date)
    gender = Column(String)
    phone = Column(String)
    address = Column(Text)
    blood_group = Column(Enum(BloodGroup), default=BloodGroup.unknown)
    weight_kg = Column(Float)
    height_cm = Column(Float)

    # Stored as JSON list of strings
    allergies = Column(JSON, default=list)
    chronic_conditions = Column(JSON, default=list)
    emergency_contact = Column(JSON)  # {name, phone, relation}

    profile_picture_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    doctors = relationship("DoctorPatient", back_populates="patient")
    diagnoses = relationship("Diagnosis", back_populates="patient")
    medications = relationship("Medication", back_populates="patient")
    recovery_scores = relationship("RecoveryScore", back_populates="patient")
    symptom_checkins = relationship("SymptomCheckin", back_populates="patient")
    sos_requests = relationship("SOSRequest", back_populates="patient")
    chat_messages = relationship("ChatMessage", back_populates="patient")


class DoctorPatient(Base):
    """Links a doctor to a patient — scoped independently per pair."""
    __tablename__ = "doctor_patients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)

    # Which clinic the doctor is treating this patient at
    clinic_name = Column(String)
    clinic_address = Column(String)

    # Doctor's notes visible to patient as improvement suggestions
    doctor_summary = Column(Text)
    improvement_suggestions = Column(JSON, default=list)  # list of strings
    diet_plan = Column(JSON, default=list)  # list of {meal, items, notes}

    status = Column(String, default="active")  # active | discharged | follow_up
    assigned_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="patients")
    patient = relationship("Patient", back_populates="doctors")
