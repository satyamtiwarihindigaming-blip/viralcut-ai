from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

class Clip(Base):
    __tablename__ = "clips"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    
    # AI Discovery Fields
    title = Column(String(255), nullable=False)
    hook = Column(String(255), nullable=True)
    category = Column(String(100), default="general")
    viral_score = Column(Integer, default=85)
    reason = Column(Text, nullable=True)
    
    # Timing
    start_time = Column(Float, nullable=False) # in seconds
    end_time = Column(Float, nullable=False) # in seconds
    duration = Column(Float, nullable=False) # in seconds
    
    # Intelligent Framing
    framing_mode = Column(String(50), default="speaker_tracking") 
    # Options: speaker_tracking, split_screen, stacked_screen, blurred_bg, dynamic_tracking, context_aware, manual
    framing_config = Column(JSON, nullable=True) # coordinates, tracking curves, crop settings
    
    # Captions & Subtitles
    caption_style = Column(String(50), default="bold_viral")
    # Options: bold_viral, karaoke, highlight, minimal, podcast, custom
    caption_settings = Column(JSON, nullable=True) # font, size, primary_color, highlight_color, y_pos
    subtitles = Column(JSON, nullable=True) # editable word-level timing array
    
    # Export Specs
    export_resolution = Column(String(20), default="4K") # 4K, 1440p, 1080p, 720p
    export_codec = Column(String(20), default="libx264") # libx264 or libx265
    crf = Column(Integer, default=18)
    
    # Output Files
    rendered_file_path = Column(String(1024), nullable=True)
    download_url = Column(String(1024), nullable=True)
    thumbnail_path = Column(String(1024), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(50), default="draft") # draft, queued, rendering, completed, failed
    render_progress = Column(Float, default=0.0) # 0 to 100%
    error_message = Column(Text, nullable=True)
    
    # Relationship
    project = relationship("Project", back_populates="clips")
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
