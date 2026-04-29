import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class SOSStatus(str, enum.Enum):
    active = "active"
    accepted = "accepted"
    resolved = "resolved"
    rejected = "rejected"


class SOSRequest(Base):
    __tablename__ = "sos_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True)

    message = Column(Text, nullable=False)
    status = Column(Enum(SOSStatus), default=SOSStatus.active)
    priority = Column(String, default="high")  # low, medium, high, critical

    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime)
    resolved_at = Column(DateTime)
    doctor_notes = Column(Text)

    patient = relationship("Patient", back_populates="sos_requests")
