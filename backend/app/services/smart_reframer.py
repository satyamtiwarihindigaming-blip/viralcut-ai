from typing import Dict, Any, List, Optional, Tuple

class SmartReframerService:
    def __init__(self):
        # Target vertical resolution mappings (9:16 aspect ratio)
        self.RESOLUTION_MAP = {
            "4K": (2160, 3840),
            "1440p": (1440, 2560),
            "1080p": (1080, 1920),
            "720p": (720, 1280),
        }

    def build_ffmpeg_filter(
        self,
        framing_mode: str,
        in_width: int,
        in_height: int,
        out_res: str = "4K",
        trajectory: Optional[List[Dict[str, float]]] = None,
        manual_crop: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Builds the FFmpeg -filter_complex command string for the selected framing mode.
        Ensures high-quality Lanczos scaling and exact 9:16 vertical frame framing.
        """
        out_w, out_h = self.RESOLUTION_MAP.get(out_res, (2160, 3840))

        # Default focal X (center if no trajectory)
        avg_focal_x = in_width / 2.0
        if trajectory and len(trajectory) > 0:
            avg_focal_x = sum(t.get("focal_x", in_width / 2.0) for t in trajectory) / len(trajectory)

        # 1. Blurred Background Composition (Safe, professional wide presentation)
        if framing_mode == "blurred_bg":
            # Background: scaled to fill out_h, cropped to 9:16, heavy boxblur
            # Foreground: scaled to fit width with clean border / drop-shadow
            filter_str = (
                f"[0:v]scale={out_w}:{out_h}:force_original_aspect_ratio=increase:flags=lanczos,"
                f"crop={out_w}:{out_h},"
                f"boxblur=20:5[bg];"
                f"[0:v]scale={out_w}:-2:flags=lanczos[fg];"
                f"[bg][fg]overlay=(W-w)/2:(H-h)/2[v]"
            )
            return filter_str

        # 2. Two-Person Split Screen (Podcast / Interview / Debate)
        elif framing_mode == "split_screen":
            # Target top half: out_w x (out_h/2), bottom half: out_w x (out_h/2)
            half_h = int(out_h / 2)
            # Left speaker crop (left 50% of 16:9 input)
            # Right speaker crop (right 50% of 16:9 input)
            crop_w = int(in_height * (9 / 16))
            left_x = max(0, int(in_width * 0.25 - crop_w / 2))
            right_x = min(in_width - crop_w, int(in_width * 0.75 - crop_w / 2))

            filter_str = (
                f"[0:v]crop={crop_w}:{in_height}:{left_x}:0,"
                f"scale={out_w}:{half_h}:flags=lanczos[top];"
                f"[0:v]crop={crop_w}:{in_height}:{right_x}:0,"
                f"scale={out_w}:{half_h}:flags=lanczos[bot];"
                f"[top][bot]vstack=inputs=2[v_stack];"
                # Draw a sleek subtle 4px separator line at midpoint
                f"[v_stack]drawbox=x=0:y={half_h - 2}:w={out_w}:h=4:color=white@0.3:t=fill[v]"
            )
            return filter_str

        # 3. Multiple-Speaker Stacked Screen (Reaction / 3-panel podcast)
        elif framing_mode == "stacked_screen":
            third_h = int(out_h / 3)
            crop_w = int(in_height * (9 / 16))
            left_x = max(0, int(in_width * 0.2 - crop_w / 2))
            mid_x = int((in_width - crop_w) / 2)
            right_x = min(in_width - crop_w, int(in_width * 0.8 - crop_w / 2))

            filter_str = (
                f"[0:v]crop={crop_w}:{in_height}:{left_x}:0,scale={out_w}:{third_h}:flags=lanczos[t1];"
                f"[0:v]crop={crop_w}:{in_height}:{mid_x}:0,scale={out_w}:{third_h}:flags=lanczos[t2];"
                f"[0:v]crop={crop_w}:{in_height}:{right_x}:0,scale={out_w}:{third_h}:flags=lanczos[t3];"
                f"[t1][t2][t3]vstack=inputs=3[v]"
            )
            return filter_str

        # 4. Manual Crop (User defined coordinates in Video Editor)
        elif framing_mode == "manual" and manual_crop:
            mx = int(manual_crop.get("x", 0))
            my = int(manual_crop.get("y", 0))
            mw = int(manual_crop.get("width", in_height * (9 / 16)))
            mh = int(manual_crop.get("height", in_height))
            filter_str = (
                f"[0:v]crop={mw}:{mh}:{mx}:{my},"
                f"scale={out_w}:{out_h}:flags=lanczos[v]"
            )
            return filter_str

        # 5. Single-Speaker Smart Tracking & Dynamic / Context-Aware Crop (Default)
        else:
            # Crop 9:16 vertical slice from landscape video
            crop_w = int(in_height * (9 / 16))
            if crop_w > in_width:
                crop_w = in_width
                crop_h = int(in_width * (16 / 9))
                crop_y = int((in_height - crop_h) / 2)
                crop_x = 0
            else:
                crop_h = in_height
                crop_y = 0
                # Calculate safe focal X (keep subject in frame, clamped to margins)
                crop_x = int(avg_focal_x - (crop_w / 2))
                crop_x = max(0, min(in_width - crop_w, crop_x))

            filter_str = (
                f"[0:v]crop={crop_w}:{crop_h}:{crop_x}:{crop_y},"
                f"scale={out_w}:{out_h}:flags=lanczos[v]"
            )
            return filter_str

smart_reframer_service = SmartReframerService()
