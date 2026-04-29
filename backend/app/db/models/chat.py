import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=True)

    role = Column(String, nullable=False)  # user, assistant, system
    message = Column(Text, nullable=False)
    context = Column(JSON)  # Additional context for AI

    created_at = Column(DateTime, default=datetime.utcnow)
