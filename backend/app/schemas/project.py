from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.clip import ClipResponse

class ProjectCreate(BaseModel):
    title: str = Field(..., description="Project or video title")
    source_type: str = Field("upload", description="'upload' or 'youtube'")
    source_url: Optional[str] = Field(None, description="YouTube link or source URL")
    custom_prompt: Optional[str] = Field(
        None, 
        description="Custom AI prompt, e.g. 'Find the funniest moments' or 'Find motivational moments'"
    )
    target_clip_count: Optional[int] = Field(3, ge=1, le=10, description="Target number of clips to generate")
    min_clip_duration: Optional[int] = Field(30, ge=10, le=180, description="Minimum clip duration in seconds")
    max_clip_duration: Optional[int] = Field(60, ge=15, le=300, description="Maximum clip duration in seconds")

class ProjectResponse(BaseModel):
    id: int
    title: str
    source_type: str
    source_url: Optional[str]
    file_path: Optional[str]
    file_size_bytes: Optional[int]
    duration: Optional[float]
    width: Optional[int]
    height: Optional[int]
    fps: Optional[float]
    codec: Optional[str]
    custom_prompt: Optional[str]
    status: str
    error_message: Optional[str]
    clips: List[ClipResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class YouTubeValidateRequest(BaseModel):
    url: str

class YouTubeValidateResponse(BaseModel):
    valid: bool
    title: Optional[str] = None
    duration: Optional[float] = None
    author: Optional[str] = None
    thumbnail_url: Optional[str] = None
    message: Optional[str] = None
