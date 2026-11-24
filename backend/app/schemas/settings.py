from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class GeminiSettingsRequest(BaseModel):
    gemini_api_key: Optional[str] = Field(None, description="Google AI Studio Gemini API Key")
    gemini_model: Optional[str] = Field("gemini-2.5-flash", description="Configured Gemini Model")

class GeminiTestResponse(BaseModel):
    success: bool
    model: str
    message: str
    latency_ms: Optional[float] = None
    supported_models: List[str] = []

class SystemHealthResponse(BaseModel):
    status: str # healthy, degraded, maintenance
    environment: str
    version: str
    uptime_seconds: float
    services: Dict[str, Any]
    database: Dict[str, Any]
    gemini: Dict[str, Any]
    ffmpeg: Dict[str, Any]
    queue: Dict[str, Any]
    storage: Dict[str, Any]

class OwnerDashboardStats(BaseModel):
    total_projects: int
    total_clips: int
    active_jobs: int
    completed_jobs: int
    failed_jobs: int
    total_storage_mb: float
    maintenance_mode: bool
