from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def init_db():
    async with engine.begin() as conn:
        # Import models here to ensure they are registered with Base
        from app.db.models.user import User
        from app.db.models.doctor import Doctor
        from app.db.models.patient import Patient, DoctorPatient
        from app.db.models.diagnosis import Diagnosis
        from app.db.models.medication import Medication, MedicationLog
        from app.db.models.recovery import SymptomCheckin, RecoveryScore
        from app.db.models.report import Report, CalendarEvent
        from app.db.models.notification import Notification
        from app.db.models.sos import SOSRequest
        from app.db.models.chat import ChatMessage
        
        await conn.run_sync(Base.metadata.create_all)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
