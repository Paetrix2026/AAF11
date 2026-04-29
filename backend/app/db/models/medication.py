import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Boolean, Text, Integer, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class MedicationStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    stopped = "stopped"
    paused = "paused"


class Medication(Base):
    __tablename__ = "medications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    diagnosis_id = Column(String, ForeignKey("diagnoses.id"), nullable=True)

    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)  # e.g. "500mg"
    frequency = Column(String, nullable=False)  # e.g. "twice daily"
    route = Column(String, default="oral")  # oral, IV, topical, etc.

    # Times to take — e.g. ["08:00", "20:00"]
    schedule_times = Column(JSON, default=list)

    instructions = Column(Text)  # "Take after food", etc.
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    duration_days = Column(Integer)

    status = Column(Enum(MedicationStatus), default=MedicationStatus.active)
    prescribed_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="medications")
    logs = relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationLog(Base):
    """One row per scheduled dose — patient marks taken or missed."""
    __tablename__ = "medication_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    medication_id = Column(String, ForeignKey("medications.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)

    scheduled_at = Column(DateTime, nullable=False)
    taken_at = Column(DateTime)  # null = not yet taken
    is_taken = Column(Boolean, default=False)
    is_missed = Column(Boolean, default=False)
    patient_note = Column(String)

    medication = relationship("Medication", back_populates="logs")
