import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, JSON, ForeignKey, Text
from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    recipient_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_user_id = Column(String, nullable=True)  # null = system generated

    notification_type = Column(String, nullable=False)
    # Types: missed_dose | critical_alert | follow_up_reminder | report_ready
    #        appointment_reminder | recovery_update | doctor_note

    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    metadata = Column(JSON, default=dict)  # extra context {patient_id, diagnosis_id, etc}

    is_read = Column(Boolean, default=False)
    is_actioned = Column(Boolean, default=False)
    priority = Column(String, default="normal")  # low | normal | high | critical

    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
