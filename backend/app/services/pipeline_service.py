import os
import uuid
import asyncio
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.project import Project
from app.models.clip import Clip
from app.models.job import ProcessingJob

from app.services.video_metadata import video_metadata_service
from app.services.scene_detector import scene_detector_service
from app.services.transcription_service import transcription_service
from app.services.gemini_service import gemini_service
from app.services.face_tracking_service import face_tracking_service
from app.services.smart_reframer import smart_reframer_service
from app.services.caption_renderer import caption_renderer_service
from app.services.video_renderer import video_renderer_service
from app.services.storage_service import storage_service

class PipelineService:
    def __init__(self):
        self._running_tasks: Dict[str, asyncio.Task] = {}

    async def start_pipeline(self, project_id: int) -> str:
        """Launches the complete AI Director pipeline in an asynchronous background worker task."""
        job_id = str(uuid.uuid4())
        
        async with AsyncSessionLocal() as session:
            job = ProcessingJob(
                id=job_id,
                project_id=project_id,
                job_type="pipeline",
                status="running",
                current_step="Initializing AI Director",
                progress=5.0
            )
            session.add(job)
            await session.commit()

        # Spawn non-blocking background task
        task = asyncio.create_task(self._execute_pipeline(job_id, project_id))
        self._running_tasks[job_id] = task
        return job_id

    async def _update_job(self, job_id: str, step: str, progress: float, status: str = "running", error: Optional[str] = None):
        async with AsyncSessionLocal() as session:
            stmt = (
                update(ProcessingJob)
                .where(ProcessingJob.id == job_id)
                .values(
                    current_step=step,
                    progress=round(progress, 1),
                    status=status,
                    error_message=error
                )
            )
            await session.execute(stmt)
            await session.commit()

    async def _execute_pipeline(self, job_id: str, project_id: int):
        try:
            # 1. Fetch Project
            async with AsyncSessionLocal() as session:
                project = await session.get(Project, project_id)
                if not project or not project.file_path:
                    raise ValueError("Project source media file not found")
                video_path = project.file_path
                custom_prompt = project.custom_prompt

            # 2. Extract Metadata (FFprobe)
            await self._update_job(job_id, "Extracting Video Metadata", 10.0)
            metadata = video_metadata_service.get_metadata(video_path)
            
            async with AsyncSessionLocal() as session:
                p = await session.get(Project, project_id)
                p.duration = metadata["duration"]
                p.width = metadata["width"]
                p.height = metadata["height"]
                p.fps = metadata["fps"]
                p.codec = metadata["codec"]
                await session.commit()

            # 3. Scene Detection (PySceneDetect)
            await self._update_job(job_id, "Detecting Visual Scene Cuts", 20.0)
            scenes = scene_detector_service.detect_scenes(video_path)

            # 4. Transcription (Faster-Whisper)
            await self._update_job(job_id, "Transcribing Audio & Generating Word Timestamps", 35.0)
            # Run CPU-bound whisper transcription in thread pool
            transcription = await asyncio.to_thread(
                transcription_service.transcribe_video, video_path
            )

            async with AsyncSessionLocal() as session:
                p = await session.get(Project, project_id)
                p.transcription_data = transcription
                p.scene_cuts = scenes
                await session.commit()

            # 5. Gemini AI Viral Moment Detection
            await self._update_job(job_id, "Gemini AI Analyzing High-Retention Viral Moments", 50.0)
            formatted_text = transcription.get("formatted_transcript", "")
            
            viral_candidates = await asyncio.to_thread(
                gemini_service.detect_viral_moments,
                transcript_text=formatted_text,
                duration_seconds=metadata["duration"],
                target_clips=3,
                min_clip_len=30,
                max_clip_len=60,
                custom_instructions=custom_prompt
            )

            # 6. For each viral moment: Reframing, Subtitle extraction, and Rendering
            total_clips = len(viral_candidates)
            created_clips = []

            for idx, candidate in enumerate(viral_candidates):
                clip_pct_base = 55.0 + (idx / total_clips) * 40.0
                await self._update_job(
                    job_id,
                    f"Processing Clip {idx + 1}/{total_clips}: {candidate['title']}",
                    clip_pct_base
                )

                start_t = candidate["start_time"]
                end_t = candidate["end_time"]
                duration_t = round(end_t - start_t, 2)

                # Face tracking & layout selection
                tracking_result = await asyncio.to_thread(
                    face_tracking_service.analyze_faces_in_clip,
                    video_path,
                    start_t,
                    end_t
                )
                framing = candidate.get("framing") or tracking_result.get("recommended_layout", "speaker_tracking")

                # Extract word-level subtitles for this segment
                subtitles = transcription_service.extract_clip_subtitles(
                    transcription, start_t, end_t
                )

                # Output filenames
                clip_filename = f"clip_{project_id}_{idx + 1}_{uuid.uuid4().hex[:8]}.mp4"
                output_clip_path = str(settings.STORAGE_LOCAL_DIR / "clips" / clip_filename)
                thumb_filename = f"thumb_{project_id}_{idx + 1}_{uuid.uuid4().hex[:8]}.jpg"
                thumb_path = str(settings.STORAGE_LOCAL_DIR / "clips" / thumb_filename)

                # Render Clip in FFmpeg
                render_result = await asyncio.to_thread(
                    video_renderer_service.render_clip,
                    source_video_path=video_path,
                    output_clip_path=output_clip_path,
                    start_time=start_t,
                    end_time=end_t,
                    in_width=metadata["width"],
                    in_height=metadata["height"],
                    framing_mode=framing,
                    export_resolution=settings.DEFAULT_EXPORT_RESOLUTION,
                    export_codec=settings.DEFAULT_EXPORT_CODEC,
                    crf=settings.DEFAULT_EXPORT_CRF,
                    trajectory=tracking_result.get("trajectory"),
                    subtitles=subtitles,
                    hook_text=candidate.get("hook"),
                    caption_style="bold_viral"
                )

                # Generate thumbnail from rendered clip
                video_metadata_service.generate_thumbnail(
                    output_clip_path, thumb_path, timestamp_sec=1.5
                )

                download_url = storage_service.get_download_url(output_clip_path)
                thumb_url = storage_service.get_download_url(thumb_path)

                # Save Clip record to database
                async with AsyncSessionLocal() as session:
                    db_clip = Clip(
                        project_id=project_id,
                        title=candidate["title"],
                        hook=candidate.get("hook"),
                        category=candidate.get("category", "general"),
                        viral_score=candidate.get("viral_score", 85),
                        reason=candidate.get("reason"),
                        start_time=start_t,
                        end_time=end_t,
                        duration=duration_t,
                        framing_mode=framing,
                        framing_config={"trajectory": tracking_result.get("trajectory")},
                        caption_style="bold_viral",
                        subtitles=subtitles,
                        export_resolution=settings.DEFAULT_EXPORT_RESOLUTION,
                        export_codec=settings.DEFAULT_EXPORT_CODEC,
                        crf=settings.DEFAULT_EXPORT_CRF,
                        rendered_file_path=output_clip_path,
                        download_url=download_url,
                        thumbnail_path=thumb_url,
                        file_size_bytes=render_result["file_size_bytes"],
                        status="completed",
                        render_progress=100.0
                    )
                    session.add(db_clip)
                    await session.commit()
                    created_clips.append(db_clip.id)

            # Mark Project and Job as Complete
            async with AsyncSessionLocal() as session:
                p = await session.get(Project, project_id)
                p.status = "ready"
                await session.commit()

            await self._update_job(
                job_id,
                f"Successfully generated {len(created_clips)} 4K viral clips!",
                100.0,
                status="completed"
            )

        except asyncio.CancelledError:
            await self._update_job(job_id, "Job was cancelled by user", 0.0, status="cancelled")
        except Exception as e:
            err_msg = str(e)
            await self._update_job(job_id, "Processing failed", 0.0, status="failed", error=err_msg)
            async with AsyncSessionLocal() as session:
                p = await session.get(Project, project_id)
                if p:
                    p.status = "failed"
                    p.error_message = err_msg
                    await session.commit()
        finally:
            self._running_tasks.pop(job_id, None)

    def cancel_job(self, job_id: str) -> bool:
        task = self._running_tasks.get(job_id)
        if task and not task.done():
            task.cancel()
            return True
        return False

pipeline_service = PipelineService()
