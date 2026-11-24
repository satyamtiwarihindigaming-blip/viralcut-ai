import os
import uuid
import asyncio
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.clip import Clip
from app.models.project import Project
from app.schemas.clip import ClipResponse, ClipUpdate, RenderRequest
from app.services.video_renderer import video_renderer_service
from app.services.video_metadata import video_metadata_service
from app.services.storage_service import storage_service

router = APIRouter(prefix="/clips", tags=["Clips"])

@router.get("", response_model=List[ClipResponse])
async def list_clips(
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Clip).order_by(Clip.created_at.desc())
    if project_id:
        query = query.where(Clip.project_id == project_id)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{clip_id}", response_model=ClipResponse)
async def get_clip(clip_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")
    return clip

@router.patch("/{clip_id}", response_model=ClipResponse)
async def update_clip(
    clip_id: int,
    clip_in: ClipUpdate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    update_data = clip_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(clip, field, val)

    # Recompute duration if start or end changed
    if clip.start_time is not None and clip.end_time is not None:
        clip.duration = round(max(1.0, clip.end_time - clip.start_time), 2)

    await db.commit()
    await db.refresh(clip)
    return clip

@router.post("/{clip_id}/render")
async def rerender_clip(
    clip_id: int,
    req: RenderRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Clip).options(selectinload(Clip.project)).where(Clip.id == clip_id)
    )
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    project = clip.project
    if not project or not project.file_path or not os.path.exists(project.file_path):
        raise HTTPException(status_code=400, detail="Source media file not found")

    clip.status = "rendering"
    clip.render_progress = 10.0
    clip.export_resolution = req.export_resolution or clip.export_resolution or "4K"
    clip.export_codec = req.export_codec or clip.export_codec or "libx264"
    clip.crf = req.crf or clip.crf or 18
    await db.commit()

    # Launch background render
    asyncio.create_task(_execute_clip_render(clip.id))
    return {"message": "Re-rendering initiated", "clip_id": clip_id, "resolution": clip.export_resolution}

async def _execute_clip_render(clip_id: int):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Clip).options(selectinload(Clip.project)).where(Clip.id == clip_id)
        )
        clip = result.scalar_one_or_none()
        if not clip or not clip.project:
            return

        source_path = clip.project.file_path
        in_w = clip.project.width or 1920
        in_h = clip.project.height or 1080

        clip_filename = f"clip_{clip.project_id}_{clip.id}_{uuid.uuid4().hex[:8]}.mp4"
        out_path = str(settings.STORAGE_LOCAL_DIR / "clips" / clip_filename)
        thumb_filename = f"thumb_{clip.project_id}_{clip.id}_{uuid.uuid4().hex[:8]}.jpg"
        thumb_path = str(settings.STORAGE_LOCAL_DIR / "clips" / thumb_filename)

        trajectory = clip.framing_config.get("trajectory") if clip.framing_config else None
        manual_crop = clip.framing_config.get("manual_crop") if clip.framing_config else None

        try:
            render_res = await asyncio.to_thread(
                video_renderer_service.render_clip,
                source_video_path=source_path,
                output_clip_path=out_path,
                start_time=clip.start_time,
                end_time=clip.end_time,
                in_width=in_w,
                in_height=in_h,
                framing_mode=clip.framing_mode,
                export_resolution=clip.export_resolution,
                export_codec=clip.export_codec,
                crf=clip.crf,
                trajectory=trajectory,
                manual_crop=manual_crop,
                subtitles=clip.subtitles,
                hook_text=clip.hook,
                caption_style=clip.caption_style
            )

            # Thumbnail
            video_metadata_service.generate_thumbnail(out_path, thumb_path, timestamp_sec=1.0)

            clip.rendered_file_path = out_path
            clip.download_url = storage_service.get_download_url(out_path)
            clip.thumbnail_path = storage_service.get_download_url(thumb_path)
            clip.file_size_bytes = render_res["file_size_bytes"]
            clip.status = "completed"
            clip.render_progress = 100.0
            clip.error_message = None
            await session.commit()
        except Exception as e:
            clip.status = "failed"
            clip.error_message = str(e)
            await session.commit()

@router.delete("/{clip_id}")
async def delete_clip(clip_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Clip).where(Clip.id == clip_id))
    clip = result.scalar_one_or_none()
    if not clip:
        raise HTTPException(status_code=404, detail="Clip not found")

    if clip.rendered_file_path and os.path.exists(clip.rendered_file_path):
        try:
            os.remove(clip.rendered_file_path)
        except Exception:
            pass

    await db.delete(clip)
    await db.commit()
    return {"message": f"Clip {clip_id} deleted successfully"}
