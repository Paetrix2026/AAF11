import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Float, Integer, JSON, ForeignKey, Text, Enum, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class FeelStatus(str, enum.Enum):
    better = "better"
    same = "same"
    worse = "worse"


class SymptomCheckin(Base):
    """Patient daily check-in — minimal friction, max insight."""
    __tablename__ = "symptom_checkins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    checkin_date = Column(Date, default=date.today)

    # "How do you feel today?" — better / same / worse
    feel_status = Column(Enum(FeelStatus), nullable=False)

    # Optional symptoms selected from dynamic list
    symptoms_present = Column(JSON, default=list)  # e.g. ["headache", "fatigue"]
    symptom_severity = Column(Integer)  # 1-10 scale

    # Vitals (optional, patient-entered)
    temperature_c = Column(Float)
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    heart_rate = Column(Integer)
    oxygen_saturation = Column(Float)
    blood_glucose = Column(Float)

    patient_note = Column(Text)
    checked_in_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="symptom_checkins")


class RecoveryScore(Base):
    """
    Computed daily recovery score per patient.
    Score 0-100. Trend: improving / stable / declining.
    Color: green (>=70) / yellow (40-69) / red (<40)
    """
    __tablename__ = "recovery_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    score_date = Column(Date, default=date.today)

    score = Column(Float, nullable=False)  # 0-100

    # Sub-scores that feed the total
    medication_adherence_score = Column(Float, default=0)  # 0-40 points
    symptom_score = Column(Float, default=0)               # 0-35 points
    vitals_score = Column(Float, default=0)                # 0-25 points

    trend = Column(String, default="stable")  # improving | stable | declining
    color_status = Column(String, default="yellow")  # green | yellow | red

    # Missed medication intelligence
    missed_doses_today = Column(Integer, default=0)
    consecutive_missed_days = Column(Integer, default=0)
    missed_dose_alert = Column(String)  # Generated warning message

    # AI-generated follow-up suggestion
    follow_up_suggestion = Column(String)
    follow_up_in_days = Column(Integer)

    computed_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="recovery_scores")
