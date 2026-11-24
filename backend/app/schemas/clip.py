from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ViralMomentCandidate(BaseModel):
    start_time: float = Field(..., description="Start time in seconds")
    end_time: float = Field(..., description="End time in seconds")
    title: str = Field(..., description="Catchy clip title")
    hook: str = Field(..., description="Opening attention hook text")
    category: str = Field("general", description="Clip category: educational, funny, motivational, podcast, storytelling, etc.")
    viral_score: int = Field(85, ge=0, le=100, description="Relative virality score (0-100)")
    reason: str = Field(..., description="Reason why this segment was selected")
    framing: str = Field("speaker_tracking", description="Recommended framing: speaker_tracking, split_screen, stacked_screen, blurred_bg, dynamic_tracking, context_aware")

class SubtitleWord(BaseModel):
    word: str
    start: float
    end: float
    score: Optional[float] = 1.0

class SubtitleSegment(BaseModel):
    id: Optional[int] = None
    text: str
    start: float
    end: float
    words: Optional[List[SubtitleWord]] = None

class ClipCreate(BaseModel):
    project_id: int
    title: str
    hook: Optional[str] = None
    category: Optional[str] = "general"
    viral_score: Optional[int] = 85
    reason: Optional[str] = None
    start_time: float
    end_time: float
    framing_mode: Optional[str] = "speaker_tracking"
    caption_style: Optional[str] = "bold_viral"
    export_resolution: Optional[str] = "4K"

class ClipUpdate(BaseModel):
    title: Optional[str] = None
    hook: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    framing_mode: Optional[str] = None
    framing_config: Optional[Dict[str, Any]] = None
    caption_style: Optional[str] = None
    caption_settings: Optional[Dict[str, Any]] = None
    subtitles: Optional[List[Dict[str, Any]]] = None
    export_resolution: Optional[str] = None
    export_codec: Optional[str] = None
    crf: Optional[int] = None

class ClipResponse(BaseModel):
    id: int
    project_id: int
    title: str
    hook: Optional[str]
    category: str
    viral_score: int
    reason: Optional[str]
    start_time: float
    end_time: float
    duration: float
    framing_mode: str
    framing_config: Optional[Dict[str, Any]]
    caption_style: str
    caption_settings: Optional[Dict[str, Any]]
    subtitles: Optional[List[Dict[str, Any]]]
    export_resolution: str
    export_codec: str
    crf: int
    rendered_file_path: Optional[str]
    download_url: Optional[str]
    thumbnail_path: Optional[str]
    file_size_bytes: Optional[int]
    status: str
    render_progress: float
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RenderRequest(BaseModel):
    clip_id: int
    export_resolution: Optional[str] = "4K" # 4K, 1440p, 1080p, 720p
    export_codec: Optional[str] = "libx264"
    crf: Optional[int] = 18
