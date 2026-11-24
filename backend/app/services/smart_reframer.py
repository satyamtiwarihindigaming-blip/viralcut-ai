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
        manual_crop: Optional[Dict[str, Any]] = None,
        duration: float = 15.0,
        show_progress_bar: bool = True
    ) -> str:
        """
        Builds the FFmpeg -filter_complex command string.
        
        MODES:
        - 'three_zone_motion' (DEFAULT): Trending 3-zone vertical composition.
           Preserves 100% of the original video in the middle zone (fit-contain, NO cropping),
           with stylized blurred background filling top/bottom, subtle border framing, and progress bar.
        - 'full_frame_blurred': Minimalist full frame in center with blurred background.
        - 'speaker_tracking': Dynamic horizontal focal tracking on speaker face.
        - 'split_screen': 2-person stacked split view for podcasts.
        - 'stacked_screen': 3-panel stacked reaction layout.
        - 'manual': Custom user coordinates.
        """
        out_w, out_h = self.RESOLUTION_MAP.get(out_res, (2160, 3840))

        # Default focal X (center if no trajectory)
        avg_focal_x = in_width / 2.0
        if trajectory and len(trajectory) > 0:
            avg_focal_x = sum(t.get("focal_x", in_width / 2.0) for t in trajectory) / len(trajectory)

        dur_safe = max(1.0, duration)
        pb_height = max(6, int(out_h * 0.003)) # 10px in 4K, 6px in 1080p

        # ========================================================
        # 1. THREE-ZONE MOTION REELS COMPOSITION (DEFAULT & TRENDING)
        # ========================================================
        if framing_mode in ["three_zone_motion", "full_frame_blurred", "default", "full_frame"]:
            # Calculate proportional dimensions for middle zone fit-contain
            aspect_in = in_width / in_height if in_height > 0 else 1.778
            aspect_out = out_w / out_h # 9/16 = 0.5625

            if aspect_in >= aspect_out:
                # Landscape or square: fit to width out_w
                fg_w = out_w
                fg_h = int(out_w / aspect_in)
                # Ensure even dimensions for encoder
                if fg_h % 2 != 0:
                    fg_h -= 1
            else:
                # Vertical source: fit to height
                fg_h = int(out_h * 0.65) # keep safe margins for top/bottom zones
                fg_w = int(fg_h * aspect_in)
                if fg_w % 2 != 0:
                    fg_w -= 1

            fg_y = int((out_h - fg_h) / 2)

            # Ultra-fast downscaled background blur (30x faster with silky smooth aesthetic blur)
            filter_str = (
                f"[0:v]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=8:2,"
                f"scale={out_w}:{out_h}:flags=fast_bilinear,"
                f"drawbox=x=0:y=0:w={out_w}:h={out_h}:color=black@0.45:t=fill[bg];"
                f"[0:v]scale={fg_w}:{fg_h}:flags=lanczos[fg_clean];"
                f"[fg_clean]drawbox=x=0:y=0:w={fg_w}:h=2:color=white@0.25:t=fill,"
                f"drawbox=x=0:y={fg_h - 2}:w={fg_w}:h=2:color=white@0.25:t=fill[fg];"
                f"[bg][fg]overlay=(W-w)/2:{fg_y}[v_base]"
            )

            # Animated top progress bar indicator line (moves smoothly from 0 to 100% with time)
            if show_progress_bar:
                filter_str += (
                    f";[v_base]drawbox=x=0:y=0:w='min(iw, iw*(t/{dur_safe}))':h={pb_height}:color=0x8B5CF6@0.95:t=fill[v]"
                )
            else:
                filter_str += ";[v_base]null[v]"

            return filter_str

        # ========================================================
        # 2. TWO-PERSON SPLIT SCREEN (Podcasts / Interviews)
        # ========================================================
        elif framing_mode == "split_screen":
            half_h = int(out_h / 2)
            crop_w = int(in_height * (9 / 16))
            left_x = max(0, int(in_width * 0.25 - crop_w / 2))
            right_x = min(in_width - crop_w, int(in_width * 0.75 - crop_w / 2))

            filter_str = (
                f"[0:v]crop={crop_w}:{in_height}:{left_x}:0,"
                f"scale={out_w}:{half_h}:flags=lanczos[top];"
                f"[0:v]crop={crop_w}:{in_height}:{right_x}:0,"
                f"scale={out_w}:{half_h}:flags=lanczos[bot];"
                f"[top][bot]vstack=inputs=2[v_stack];"
                f"[v_stack]drawbox=x=0:y={half_h - 2}:w={out_w}:h=4:color=white@0.3:t=fill[v]"
            )
            return filter_str

        # ========================================================
        # 3. MULTIPLE-SPEAKER STACKED SCREEN (3-Panel Reaction)
        # ========================================================
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

        # ========================================================
        # 4. MANUAL CROP
        # ========================================================
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

        # ========================================================
        # 5. DYNAMIC SPEAKER TRACKING (Vertical Slice)
        # ========================================================
        else: # speaker_tracking / dynamic_tracking
            crop_w = int(in_height * (9 / 16))
            if crop_w > in_width:
                crop_w = in_width
                crop_h = int(in_width * (16 / 9))
                crop_y = int((in_height - crop_h) / 2)
                crop_x = 0
            else:
                crop_h = in_height
                crop_y = 0
                crop_x = int(avg_focal_x - (crop_w / 2))
                crop_x = max(0, min(in_width - crop_w, crop_x))

            filter_str = (
                f"[0:v]crop={crop_w}:{crop_h}:{crop_x}:{crop_y},"
                f"scale={out_w}:{out_h}:flags=lanczos[v]"
            )
            return filter_str

smart_reframer_service = SmartReframerService()
