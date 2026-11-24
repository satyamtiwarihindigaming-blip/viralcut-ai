import re
import os
import uuid
import urllib.parse
from typing import Dict, Any, Optional
import httpx
import yt_dlp

class YouTubeService:
    def __init__(self):
        # Regex patterns for standard YouTube URLs, short URLs, and Shorts
        self.YT_REGEX = re.compile(
            r'^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/|embed/)|youtu\.be/)([a-zA-Z0-9_-]{11})'
        )

    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract the 11-character video ID from a YouTube URL."""
        match = self.YT_REGEX.search(url.strip())
        if match:
            return match.group(5)
        return None

    def validate_url(self, url: str) -> bool:
        """Check whether the provided string is a valid YouTube URL format."""
        return self.extract_video_id(url) is not None

    async def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Retrieves official public video metadata.
        """
        video_id = self.extract_video_id(url)
        if not video_id:
            return {
                "valid": False,
                "message": "Invalid YouTube URL format. Please provide a standard YouTube video or Shorts link."
            }

        canonical_url = f"https://www.youtube.com/watch?v={video_id}"
        oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(canonical_url)}&format=json"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(oembed_url)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "valid": True,
                        "video_id": video_id,
                        "title": data.get("title", f"YouTube Video ({video_id})"),
                        "author": data.get("author_name", "Unknown Creator"),
                        "thumbnail_url": data.get("thumbnail_url", f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"),
                        "canonical_url": canonical_url,
                        "requires_media_upload": False,
                        "message": "YouTube video recognized and ready for automatic 4K clipping!"
                    }
        except Exception:
            pass

        return {
            "valid": True,
            "video_id": video_id,
            "title": f"YouTube Video ({video_id})",
            "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            "canonical_url": canonical_url,
            "requires_media_upload": False,
            "message": "YouTube link recognized and ready for automatic 4K clipping!"
        }

    def download_video(self, url: str, output_dir: str) -> Dict[str, Any]:
        """
        Downloads the source YouTube video into the storage directory using yt-dlp.
        """
        os.makedirs(output_dir, exist_ok=True)
        unique_id = uuid.uuid4().hex[:12]
        out_template = os.path.join(output_dir, f"yt_{unique_id}.%(ext)s")

        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': out_template,
            'quiet': True,
            'no_warnings': True,
            'merge_output_format': 'mp4',
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            base, _ = os.path.splitext(filename)
            final_mp4 = f"{base}.mp4"
            filepath = final_mp4 if os.path.exists(final_mp4) else filename

            return {
                "file_path": filepath,
                "title": info.get("title", "YouTube Video"),
                "duration": info.get("duration", 0),
                "width": info.get("width"),
                "height": info.get("height"),
                "fps": info.get("fps"),
                "filesize": os.path.getsize(filepath) if os.path.exists(filepath) else 0,
            }

youtube_service = YouTubeService()
