import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.config import settings
from app.models.project import Project
from app.models.clip import Clip
from app.schemas.project import ProjectResponse, YouTubeValidateRequest, YouTubeValidateResponse
from app.services.storage_service import storage_service
from app.services.video_metadata import video_metadata_service
from app.services.youtube_service import youtube_service
from app.services.pipeline_service import pipeline_service

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/upload", response_model=ProjectResponse)
async def upload_project_video(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    custom_prompt: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".mov", ".mkv", ".webm"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format: {ext}. Supported formats: MP4, MOV, MKV, WEBM"
        )

    # Save to storage securely
    try:
        saved_path = storage_service.save_upload(file.file, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {str(e)}")

    # Extract initial metadata using FFprobe
    metadata = {}
    if os.path.exists(saved_path):
        try:
            metadata = video_metadata_service.get_metadata(saved_path)
        except Exception:
            pass

    display_title = title.strip() if title and title.strip() else os.path.splitext(file.filename)[0]

    new_project = Project(
        title=display_title,
        source_type="upload",
        file_path=saved_path,
        file_size_bytes=metadata.get("size_bytes"),
        duration=metadata.get("duration"),
        width=metadata.get("width"),
        height=metadata.get("height"),
        fps=metadata.get("fps"),
        codec=metadata.get("codec"),
        custom_prompt=custom_prompt,
        status="uploaded"
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    # Reload with clips relationship
    result = await db.execute(
        select(Project).options(selectinload(Project.clips)).where(Project.id == new_project.id)
    )
    return result.scalar_one()

@router.post("/youtube/validate", response_model=YouTubeValidateResponse)
async def validate_youtube_url(req: YouTubeValidateRequest):
    return await youtube_service.get_video_info(req.url)

@router.post("/youtube", response_model=ProjectResponse)
async def create_youtube_project(
    url: str = Form(...),
    custom_prompt: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    info = await youtube_service.get_video_info(url)
    if not info.get("valid"):
        raise HTTPException(status_code=400, detail=info.get("message", "Invalid YouTube link"))

    # Download source video stream automatically into storage
    upload_dir = str(settings.STORAGE_LOCAL_DIR / "uploads")
    import asyncio
    try:
        download_data = await asyncio.to_thread(
            youtube_service.download_video, url, upload_dir
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to retrieve YouTube video stream: {str(e)}")

    new_project = Project(
        title=download_data.get("title", info.get("title", "YouTube Video")),
        source_type="youtube",
        source_url=info.get("canonical_url"),
        file_path=download_data.get("file_path"),
        file_size_bytes=download_data.get("filesize"),
        duration=download_data.get("duration"),
        width=download_data.get("width"),
        height=download_data.get("height"),
        fps=download_data.get("fps"),
        custom_prompt=custom_prompt,
        status="uploaded"
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)

    result = await db.execute(
        select(Project).options(selectinload(Project.clips)).where(Project.id == new_project.id)
    )
    return result.scalar_one()
    return result.scalar_one()

@router.get("", response_model=List[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).options(selectinload(Project.clips)).order_by(Project.created_at.desc())
    )
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).options(selectinload(Project.clips)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/{project_id}/process")
async def trigger_ai_pipeline(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not project.file_path or not os.path.exists(project.file_path):
        raise HTTPException(
            status_code=400,
            detail="Source video file is missing. Please upload the media file to process."
        )

    project.status = "processing"
    await db.commit()

    # Start async AI Director pipeline
    job_id = await pipeline_service.start_pipeline(project_id)
    return {"message": "AI Director pipeline started", "job_id": job_id, "project_id": project_id}

@router.delete("/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Project).options(selectinload(Project.clips)).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Clean up disk files
    if project.file_path and os.path.exists(project.file_path):
        try:
            os.remove(project.file_path)
        except Exception:
            pass

    for clip in project.clips:
        if clip.rendered_file_path and os.path.exists(clip.rendered_file_path):
            try:
                os.remove(clip.rendered_file_path)
            except Exception:
                pass

    await db.delete(project)
    await db.commit()
    return {"message": f"Project {project_id} deleted successfully"}
