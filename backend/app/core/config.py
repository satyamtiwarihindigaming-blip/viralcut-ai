import os
from pathlib import Path
from typing import List, Optional, Union, Any
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # App Information
    PROJECT_NAME: str = "VIRALCUT AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    import json
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    # Authentication & Security
    SECRET_KEY: str = "viralcut-ai-super-secret-key-production-change-this-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Initial Admin / Owner
    OWNER_EMAIL: str = "admin@viralcut.ai"
    OWNER_PASSWORD: str = "admin123456"
    
    # Gemini AI SDK Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR / 'viralcut.db'}"
    
    # Task Queue / Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Storage Configuration
    STORAGE_PROVIDER: str = "local" # 'local' or 's3'
    STORAGE_LOCAL_DIR: Path = BASE_DIR / "storage"
    STORAGE_ENDPOINT: Optional[str] = None
    STORAGE_BUCKET: str = "viralcut-clips"
    STORAGE_ACCESS_KEY: Optional[str] = None
    STORAGE_SECRET_KEY: Optional[str] = None
    STORAGE_REGION: str = "us-east-1"
    
    # Video Processing Limits & Quality
    MAX_UPLOAD_SIZE_MB: int = 1000
    MAX_VIDEO_DURATION_SECONDS: int = 7200
    DEFAULT_EXPORT_RESOLUTION: str = "1080p" # 1080p: 1080x1920 (ultra-fast cloud render), 4K: 2160x3840
    DEFAULT_EXPORT_CRF: int = 18
    DEFAULT_EXPORT_CODEC: str = "libx264" # libx264 or libx265
    
    # Maintenance Mode
    MAINTENANCE_MODE: bool = False

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# Ensure local storage and upload directories exist
os.makedirs(settings.STORAGE_LOCAL_DIR / "uploads", exist_ok=True)
os.makedirs(settings.STORAGE_LOCAL_DIR / "clips", exist_ok=True)
os.makedirs(settings.STORAGE_LOCAL_DIR / "temp", exist_ok=True)
os.makedirs(settings.STORAGE_LOCAL_DIR / "exports", exist_ok=True)
