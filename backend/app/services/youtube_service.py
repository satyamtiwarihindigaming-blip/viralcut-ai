import re
import urllib.parse
from typing import Dict, Any, Optional
import httpx

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
        Retrieves official public video metadata using YouTube's oEmbed endpoint.
        Does not bypass restrictions or scrape unauthorized content.
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
                        "requires_media_upload": True,
                        "message": (
                            "YouTube metadata verified. In accordance with platform terms and copyright compliance, "
                            "please upload the authorized video file (MP4/MOV) to render and export 4K clips."
                        )
                    }
                else:
                    return {
                        "valid": True,
                        "video_id": video_id,
                        "title": f"YouTube Video ({video_id})",
                        "author": "YouTube Creator",
                        "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                        "canonical_url": canonical_url,
                        "requires_media_upload": True,
                        "message": "YouTube link recognized. Please upload the source video file for AI clipping."
                    }
        except Exception as e:
            return {
                "valid": True,
                "video_id": video_id,
                "title": f"YouTube Video ({video_id})",
                "thumbnail_url": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                "canonical_url": canonical_url,
                "requires_media_upload": True,
                "message": f"YouTube link detected. Source file required for rendering."
            }

youtube_service = YouTubeService()
