import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    specialization = Column(String, nullable=False)
    registration_number = Column(String, unique=True, nullable=False)
    phone = Column(String)
    profile_picture_url = Column(String)

    # Multi-clinic support — list of {name, address, city, phone}
    clinics = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patients = relationship("DoctorPatient", back_populates="doctor")
    diagnoses = relationship("Diagnosis", back_populates="doctor")
    calendar_events = relationship("CalendarEvent", back_populates="doctor")
    sos_requests = relationship("SOSRequest", back_populates="doctor")
    chat_messages = relationship("ChatMessage", back_populates="doctor")
