import os
import asyncio
from celery import Celery
from app.core.config import settings

# Initialize Celery app
celery_app = Celery(
    "viralcut_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

@celery_app.task(name="pipeline.process_video", bind=True)
def celery_process_video(self, project_id: int):
    """
    Celery task wrapper to execute the async AI Director pipeline inside
    the independent cloud worker process.
    """
    from app.services.pipeline_service import pipeline_service
    # Run async pipeline in sync Celery worker
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(pipeline_service.start_pipeline(project_id))
