from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(50), default="upload") # 'upload' or 'youtube'
    source_url = Column(String(1024), nullable=True)
    file_path = Column(String(1024), nullable=True) # local path or cloud object key
    file_size_bytes = Column(Integer, nullable=True)
    
    # Metadata
    duration = Column(Float, nullable=True) # in seconds
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    fps = Column(Float, nullable=True)
    codec = Column(String(50), nullable=True)
    
    # AI Data & Cache
    transcription_data = Column(JSON, nullable=True) # list of words with timestamps
    scene_cuts = Column(JSON, nullable=True) # list of scene cut timestamps
    custom_prompt = Column(Text, nullable=True)
    
    # Status
    status = Column(String(50), default="uploaded") # uploaded, processing, ready, failed
    error_message = Column(Text, nullable=True)
    
    # Foreign Key
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    clips = relationship("Clip", back_populates="project", cascade="all, delete-orphan")
    jobs = relationship("ProcessingJob", back_populates="project", cascade="all, delete-orphan")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
