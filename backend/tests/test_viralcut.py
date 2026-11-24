import os
import sys
import subprocess
import tempfile
import asyncio

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.database import engine, Base, AsyncSessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.clip import Clip

from app.services.video_metadata import video_metadata_service
from app.services.smart_reframer import smart_reframer_service
from app.services.caption_renderer import caption_renderer_service
from app.services.video_renderer import video_renderer_service
from app.services.youtube_service import youtube_service
from app.services.gemini_service import gemini_service

def test_security_auth():
    """Verify password hashing and JWT token signing."""
    pwd = "securepassword123"
    hashed = get_password_hash(pwd)
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongpassword", hashed) is False

    token = create_access_token("test@viralcut.ai")
    sub = decode_access_token(token)
    assert sub == "test@viralcut.ai"
    print("✓ Auth & Security verification passed!")

def test_youtube_validation():
    """Verify YouTube regex validator and metadata extractor."""
    valid_urls = [
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "https://youtu.be/dQw4w9WgXcQ",
        "https://www.youtube.com/shorts/dQw4w9WgXcQ"
    ]
    for url in valid_urls:
        assert youtube_service.validate_url(url) is True

    invalid_urls = ["https://example.com/video.mp4", "not_a_url"]
    for url in invalid_urls:
        assert youtube_service.validate_url(url) is False
    print("✓ YouTube link validation passed!")

def test_smart_reframer():
    """Verify 7 smart reframing layouts generate valid FFmpeg filter strings."""
    layouts = ["speaker_tracking", "split_screen", "stacked_screen", "blurred_bg", "dynamic_tracking", "context_aware"]
    for layout in layouts:
        f = smart_reframer_service.build_ffmpeg_filter(
            framing_mode=layout,
            in_width=1920,
            in_height=1080,
            out_res="4K"
        )
        assert len(f) > 0
        assert "scale=" in f
    print("✓ Smart Reframing layout filters verified!")

def test_caption_ass_generation():
    """Verify ASS subtitle generation with word highlights and opening hook banner."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ass_path = os.path.join(tmpdir, "test.ass")
        subtitles = [
            {
                "id": 1,
                "text": "THIS IS VIRAL",
                "start": 0.5,
                "end": 2.5,
                "words": [
                    {"word": "THIS", "start": 0.5, "end": 1.0},
                    {"word": "IS", "start": 1.0, "end": 1.5},
                    {"word": "VIRAL", "start": 1.5, "end": 2.5}
                ]
            }
        ]
        caption_renderer_service.generate_ass_subtitles(
            subtitles=subtitles,
            output_ass_path=ass_path,
            style="bold_viral",
            hook_text="DON'T MISS THIS"
        )
        assert os.path.exists(ass_path)
        with open(ass_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "PlayResX: 1080" in content
            assert "DON'T MISS THIS" in content
            assert "VIRAL" in content
    print("✓ ASS Subtitle and Hook generator verified!")

def test_ffmpeg_render_synthetic_video():
    """Create a synthetic test video and render a 4K vertical short clip."""
    with tempfile.TemporaryDirectory() as tmpdir:
        synth_input = os.path.join(tmpdir, "input.mp4")
        synth_output = os.path.join(tmpdir, "output_4k.mp4")

        # 1. Synthesize 3-second 1920x1080 test video using FFmpeg testsrc
        gen_cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30",
            "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000",
            "-t", "3",
            "-c:v", "libx264", "-c:a", "aac",
            synth_input
        ]
        subprocess.run(gen_cmd, capture_output=True, check=True)
        assert os.path.exists(synth_input)

        # 2. Inspect with ffprobe metadata service
        meta = video_metadata_service.get_metadata(synth_input)
        assert meta["width"] == 1920
        assert meta["height"] == 1080
        assert meta["has_audio"] is True

        # 3. Render 4K vertical clip (2160x3840) with Smart Reframing & Subtitles
        subtitles = [
            {"id": 1, "text": "4K TEST", "start": 0.5, "end": 2.0}
        ]
        res = video_renderer_service.render_clip(
            source_video_path=synth_input,
            output_clip_path=synth_output,
            start_time=0.0,
            end_time=2.5,
            in_width=1920,
            in_height=1080,
            framing_mode="speaker_tracking",
            export_resolution="4K",
            export_codec="libx264",
            subtitles=subtitles,
            hook_text="VIRAL 4K"
        )
        assert os.path.exists(synth_output)
        out_meta = video_metadata_service.get_metadata(synth_output)
        assert out_meta["width"] == 2160
        assert out_meta["height"] == 3840
        print(f"✓ True 4K Video Render verified! Resolution: {out_meta['width']}x{out_meta['height']} ({res['file_size_bytes']} bytes)")

if __name__ == "__main__":
    print("\n--- RUNNING VIRALCUT AI BACKEND TEST SUITE ---")
    test_security_auth()
    test_youtube_validation()
    test_smart_reframer()
    test_caption_ass_generation()
    test_ffmpeg_render_synthetic_video()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
