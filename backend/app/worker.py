import os
from app.tasks import celery_app

if __name__ == "__main__":
    # Start worker process
    celery_app.worker_main(argv=["worker", "--loglevel=info", "-c", "2"])
