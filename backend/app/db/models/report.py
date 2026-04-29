import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class ReportType(str, enum.Enum):
    progress = "progress"
    treatment_plan = "treatment_plan"
    discharge = "discharge"
    follow_up = "follow_up"
    lab_summary = "lab_summary"


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    diagnosis_id = Column(String, ForeignKey("diagnoses.id"), nullable=True)

    report_type = Column(Enum(ReportType), nullable=False)
    title = Column(String, nullable=False)

    # Full report content — doctor writes this
    content = Column(Text, nullable=False)

    # AI-generated plain-language version for patient
    patient_friendly_content = Column(Text)

    # Structured treatment plan (if type == treatment_plan)
    treatment_plan = Column(JSON)
    # {
    #   "phases": [{"phase": "...", "duration": "...", "medications": [...], "goals": [...]}],
    #   "expected_recovery": "...",
    #   "lifestyle_changes": [...]
    # }

    clinic_name = Column(String)
    clinic_address = Column(String)
    is_shared_with_patient = Column(Boolean, default=True)
    generated_at = Column(DateTime, default=datetime.utcnow)


class CalendarEvent(Base):
    """Doctor's scheduling calendar — surgeries, follow-ups, appointments."""
    __tablename__ = "calendar_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True)  # None for personal events

    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False)  # surgery | follow_up | consultation | personal
    description = Column(Text)

    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime)
    duration_minutes = Column(String)

    clinic_name = Column(String)
    clinic_address = Column(String)
    room = Column(String)

    notes = Column(Text)
    reminder_minutes_before = Column(String, default="30")
    is_cancelled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="calendar_events")
