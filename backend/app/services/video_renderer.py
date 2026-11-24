import os
import subprocess
import time
from typing import Dict, Any, Optional, Callable
from app.services.smart_reframer import smart_reframer_service
from app.services.caption_renderer import caption_renderer_service

class VideoRendererService:
    def __init__(self, ffmpeg_path: str = "ffmpeg"):
        self.ffmpeg = ffmpeg_path

    def render_clip(
        self,
        source_video_path: str,
        output_clip_path: str,
        start_time: float,
        end_time: float,
        in_width: int,
        in_height: int,
        framing_mode: str = "speaker_tracking",
        export_resolution: str = "4K",
        export_codec: str = "libx264",
        crf: int = 18,
        trajectory: Optional[list] = None,
        manual_crop: Optional[dict] = None,
        subtitles: Optional[list] = None,
        hook_text: Optional[str] = None,
        caption_style: str = "bold_viral",
        progress_callback: Optional[Callable[[float, str], None]] = None
    ) -> Dict[str, Any]:
        """
        Renders a high-definition or true 4K vertical short-form clip (9:16)
        using FFmpeg, Lanczos scaling, and hardburned animated captions.
        """
        is_url = source_video_path.startswith("http://") or source_video_path.startswith("https://")
        if not is_url and not os.path.exists(source_video_path):
            raise FileNotFoundError(f"Source video not found: {source_video_path}")

        duration = max(1.0, end_time - start_time)
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)

        if progress_callback:
            progress_callback(10.0, "Preparing reframing and captions...")

        # 1. Generate Reframing Filter Graph with Three-Zone Motion and Progress Bar
        base_filter = smart_reframer_service.build_ffmpeg_filter(
            framing_mode=framing_mode,
            in_width=in_width,
            in_height=in_height,
            out_res=export_resolution,
            trajectory=trajectory,
            manual_crop=manual_crop,
            duration=duration,
            show_progress_bar=True
        )

        # 2. Generate Subtitles ASS File if subtitles are present
        ass_path = None
        filter_complex = base_filter
        if subtitles and len(subtitles) > 0:
            ass_path = os.path.splitext(output_clip_path)[0] + "_temp.ass"
            caption_renderer_service.generate_ass_subtitles(
                subtitles=subtitles,
                output_ass_path=ass_path,
                style=caption_style,
                hook_text=hook_text,
                duration=duration
            )
            # Escape path for FFmpeg filter on Windows
            clean_ass_path = ass_path.replace("\\", "/").replace(":", "\\:")
            # Chain ASS subtitles onto [v]
            filter_complex += f";[v]subtitles='{clean_ass_path}'[outv]"
            map_video = "[outv]"
        else:
            map_video = "[v]"

        if progress_callback:
            progress_callback(25.0, f"Rendering {export_resolution} video with {export_codec}...")

        # 3. Build FFmpeg command (supporting local files & live internet streams)
        input_args = []
        if source_video_path.startswith("http://") or source_video_path.startswith("https://"):
            input_args = [
                "-reconnect", "1",
                "-reconnect_at_eof", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",
            ]

        cmd = [
            self.ffmpeg,
            "-y",
            *input_args,
            "-threads", "1",
            "-filter_threads", "1",
            "-filter_complex_threads", "1",
            "-max_muxing_queue_size", "512",
            "-ss", str(start_time),
            "-t", str(duration),
            "-i", str(source_video_path),
            "-filter_complex", filter_complex,
            "-map", map_video,
            "-map", "0:a?", # Copy or encode audio if present
            "-c:v", export_codec,
            "-crf", str(crf),
            "-preset", "ultrafast", # Fastest live stream rendering
            "-bufsize", "2M",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-movflags", "+faststart",
            str(output_clip_path)
        ]

        start_render = time.time()
        try:
            # Execute FFmpeg rendering process cleanly without buffer deadlock
            res = subprocess.run(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.PIPE,
                text=True,
                check=False
            )
            if res.returncode != 0:
                raise RuntimeError(f"FFmpeg render failed with exit code {res.returncode}:\n{res.stderr[-500:]}")

        finally:
            # Clean up temporary ASS file
            if ass_path and os.path.exists(ass_path):
                try:
                    os.remove(ass_path)
                except Exception:
                    pass

        render_seconds = round(time.time() - start_render, 2)
        out_size_bytes = os.path.getsize(output_clip_path) if os.path.exists(output_clip_path) else 0

        if progress_callback:
            progress_callback(100.0, "Render completed!")

        return {
            "output_path": output_clip_path,
            "render_seconds": render_seconds,
            "file_size_bytes": out_size_bytes,
            "resolution": export_resolution,
            "codec": export_codec,
            "is_upscaled": in_height < 2160 and export_resolution == "4K"
        }

video_renderer_service = VideoRendererService()
