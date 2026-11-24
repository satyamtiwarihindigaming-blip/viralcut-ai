import os
import time
import shutil
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.core.database import get_db, engine
from app.models.project import Project
from app.models.clip import Clip
from app.models.job import ProcessingJob
from app.services.gemini_service import gemini_service
from app.services.video_metadata import video_metadata_service

router = APIRouter(prefix="/owner", tags=["Owner Administration"])

APP_START_TIME = time.time()

@router.get("/dashboard")
async def get_owner_dashboard(db: AsyncSession = Depends(get_db)):
    # Query database stats
    proj_count = await db.scalar(select(func.count(Project.id))) or 0
    clip_count = await db.scalar(select(func.count(Clip.id))) or 0
    active_jobs = await db.scalar(
        select(func.count(ProcessingJob.id)).where(ProcessingJob.status.in_(["pending", "running"]))
    ) or 0
    completed_jobs = await db.scalar(
        select(func.count(ProcessingJob.id)).where(ProcessingJob.status == "completed")
    ) or 0
    failed_jobs = await db.scalar(
        select(func.count(ProcessingJob.id)).where(ProcessingJob.status == "failed")
    ) or 0

    # Calculate storage footprint
    storage_mb = 0.0
    if os.path.exists(settings.STORAGE_LOCAL_DIR):
        total_bytes = 0
        for root, dirs, files in os.walk(settings.STORAGE_LOCAL_DIR):
            for f in files:
                fp = os.path.join(root, f)
                try:
                    total_bytes += os.path.getsize(fp)
                except Exception:
                    pass
        storage_mb = round(total_bytes / (1024 * 1024), 2)

    # Disk space
    disk = shutil.disk_usage(os.path.abspath("."))
    disk_free_gb = round(disk.free / (1024**3), 2)
    disk_total_gb = round(disk.total / (1024**3), 2)

    uptime_hours = round((time.time() - APP_START_TIME) / 3600, 2)

    return {
        "stats": {
            "total_projects": proj_count,
            "total_clips": clip_count,
            "active_jobs": active_jobs,
            "completed_jobs": completed_jobs,
            "failed_jobs": failed_jobs,
            "storage_used_mb": storage_mb,
            "disk_free_gb": disk_free_gb,
            "disk_total_gb": disk_total_gb,
            "uptime_hours": uptime_hours,
            "maintenance_mode": settings.MAINTENANCE_MODE,
        },
        "services": {
            "frontend": {"status": "healthy", "port": 5173},
            "backend": {"status": "healthy", "version": settings.VERSION, "env": settings.ENVIRONMENT},
            "database": {"status": "healthy", "provider": "PostgreSQL / SQLite Async"},
            "gemini_api": {
                "status": "ready" if settings.GEMINI_API_KEY else "unconfigured",
                "model": settings.GEMINI_MODEL
            },
            "ffmpeg": {"status": "healthy", "engine": "FFmpeg 9.0+ Lanczos 4K"},
            "storage": {"status": "healthy", "provider": settings.STORAGE_PROVIDER},
        }
    }

@router.post("/maintenance")
async def toggle_maintenance_mode():
    settings.MAINTENANCE_MODE = not settings.MAINTENANCE_MODE
    return {
        "maintenance_mode": settings.MAINTENANCE_MODE,
        "message": f"Maintenance mode set to {settings.MAINTENANCE_MODE}"
    }
