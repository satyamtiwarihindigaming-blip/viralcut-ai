import subprocess
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

class VideoMetadataService:
    def __init__(self, ffprobe_path: str = "ffprobe", ffmpeg_path: str = "ffmpeg"):
        self.ffprobe = ffprobe_path
        self.ffmpeg = ffmpeg_path

    def get_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract complete video and audio stream metadata using ffprobe."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found at: {file_path}")

        cmd = [
            self.ffprobe,
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            str(file_path)
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            probe_data = json.loads(result.stdout)
        except Exception as e:
            raise RuntimeError(f"FFprobe failed to inspect file: {str(e)}")

        video_stream = next(
            (s for s in probe_data.get("streams", []) if s.get("codec_type") == "video"),
            None
        )
        audio_stream = next(
            (s for s in probe_data.get("streams", []) if s.get("codec_type") == "audio"),
            None
        )

        format_info = probe_data.get("format", {})

        duration = float(format_info.get("duration", 0.0))
        size_bytes = int(format_info.get("size", os.path.getsize(file_path)))
        bitrate = int(format_info.get("bit_rate", 0)) if format_info.get("bit_rate") else None

        width = None
        height = None
        fps = None
        codec = None

        if video_stream:
            width = int(video_stream.get("width", 0))
            height = int(video_stream.get("height", 0))
            codec = video_stream.get("codec_name")
            
            # FPS calculation
            r_frame_rate = video_stream.get("r_frame_rate", "30/1")
            try:
                num, den = map(int, r_frame_rate.split("/"))
                fps = round(num / den, 2) if den > 0 else 30.0
            except Exception:
                fps = 30.0

            if duration == 0.0 and video_stream.get("duration"):
                duration = float(video_stream.get("duration", 0.0))

        aspect_ratio = round(width / height, 3) if width and height and height > 0 else 1.778
        is_landscape = aspect_ratio > 1.0

        return {
            "duration": round(duration, 2),
            "width": width,
            "height": height,
            "fps": fps,
            "codec": codec,
            "size_bytes": size_bytes,
            "bitrate": bitrate,
            "aspect_ratio": aspect_ratio,
            "is_landscape": is_landscape,
            "has_audio": audio_stream is not None,
            "audio_codec": audio_stream.get("codec_name") if audio_stream else None,
            "channels": audio_stream.get("channels") if audio_stream else 0,
        }

    def generate_thumbnail(self, video_path: str, output_path: str, timestamp_sec: float = 1.0) -> str:
        """Extract a single high-quality JPG thumbnail frame using FFmpeg."""
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cmd = [
            self.ffmpeg,
            "-y",
            "-ss", str(timestamp_sec),
            "-i", str(video_path),
            "-vframes", "1",
            "-q:v", "2",
            str(output_path)
        ]
        try:
            subprocess.run(cmd, capture_output=True, check=True)
            return output_path
        except Exception as e:
            # If timestamp exceeds duration or fails, fallback to frame 0
            fallback_cmd = [
                self.ffmpeg,
                "-y",
                "-i", str(video_path),
                "-vframes", "1",
                "-q:v", "2",
                str(output_path)
            ]
            subprocess.run(fallback_cmd, capture_output=True, check=False)
            return output_path

video_metadata_service = VideoMetadataService()
