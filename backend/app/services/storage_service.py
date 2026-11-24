import os
import shutil
import uuid
from pathlib import Path
from typing import Optional, BinaryIO
import boto3
from botocore.config import Config
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER # 'local' or 's3'
        self.local_dir = Path(settings.STORAGE_LOCAL_DIR)
        
        # S3 client initialization if configured
        self.s3_client = None
        if self.provider == "s3" and settings.STORAGE_ACCESS_KEY and settings.STORAGE_SECRET_KEY:
            self.s3_client = boto3.client(
                "s3",
                endpoint_url=settings.STORAGE_ENDPOINT,
                aws_access_key_id=settings.STORAGE_ACCESS_KEY,
                aws_secret_access_key=settings.STORAGE_SECRET_KEY,
                region_name=settings.STORAGE_REGION,
                config=Config(signature_version="s3v4")
            )

    def save_upload(self, file_obj: BinaryIO, original_filename: str) -> str:
        """
        Saves uploaded video file securely with a unique UUID filename to prevent collision and path traversal.
        """
        ext = os.path.splitext(original_filename)[1].lower()
        if ext not in [".mp4", ".mov", ".mkv", ".webm"]:
            raise ValueError(f"Unsupported video format: {ext}. Allowed: .mp4, .mov, .mkv, .webm")

        safe_filename = f"{uuid.uuid4().hex}{ext}"
        destination_path = self.local_dir / "uploads" / safe_filename
        os.makedirs(destination_path.parent, exist_ok=True)

        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file_obj, buffer)

        # If S3 provider is enabled in production, upload to bucket
        if self.s3_client and settings.STORAGE_BUCKET:
            s3_key = f"uploads/{safe_filename}"
            self.s3_client.upload_file(str(destination_path), settings.STORAGE_BUCKET, s3_key)
            return s3_key

        return str(destination_path)

    def get_download_url(self, file_path_or_key: str, expires_in_seconds: int = 3600) -> str:
        """
        Generates a direct download URL or pre-signed S3 URL for secure authorized downloading.
        """
        if self.s3_client and settings.STORAGE_BUCKET and not os.path.isabs(file_path_or_key):
            try:
                signed_url = self.s3_client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.STORAGE_BUCKET, "Key": file_path_or_key},
                    ExpiresIn=expires_in_seconds
                )
                return signed_url
            except Exception:
                pass

        # For local development, return relative path served via backend /storage route
        if os.path.isabs(file_path_or_key):
            try:
                rel = os.path.relpath(file_path_or_key, self.local_dir)
                rel_url = rel.replace("\\", "/")
                return f"/storage/{rel_url}"
            except ValueError:
                return f"/storage/{os.path.basename(file_path_or_key)}"

        clean_key = file_path_or_key.replace("\\", "/")
        return f"/storage/{clean_key}"

storage_service = StorageService()
