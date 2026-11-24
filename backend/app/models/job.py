from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(100), primary_key=True, index=True) # UUID or Celery task ID
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    clip_id = Column(Integer, ForeignKey("clips.id"), nullable=True)
    
    job_type = Column(String(50), nullable=False) # pipeline, analyze, transcribe, render, upscale
    status = Column(String(50), default="pending") # pending, running, completed, failed, cancelled
    
    current_step = Column(String(100), nullable=True) # e.g. "Scene Detection", "Transcribing Speech", "Face Tracking"
    progress = Column(Float, default=0.0) # 0 to 100
    
    details = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    
    project = relationship("Project", back_populates="jobs")
