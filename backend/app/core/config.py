import os
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from functools import lru_cache
from typing import List

# Load .env file
load_dotenv()

class Settings(BaseModel):
    DATABASE_URL: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", ""))
    SECRET_KEY: str = Field(default_factory=lambda: os.getenv("SECRET_KEY", "default_secret"))
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    GEMINI_API_KEY: str = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY", ""))
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
