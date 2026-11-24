import os
from typing import List, Dict, Any, Optional

class CaptionRendererService:
    def __init__(self):
        pass

    def generate_ass_subtitles(
        self,
        subtitles: List[Dict[str, Any]],
        output_ass_path: str,
        style: str = "bold_viral",
        hook_text: Optional[str] = None,
        font_name: str = "Arial",
        font_size: int = 58,
        primary_color: str = "&H00FFFFFF", # White in BGR ASS format
        highlight_color: str = "&H0000FFFF", # Vibrant Yellow (&H00FFFF00 in ASS is Cyan/Yellow)
        stroke_color: str = "&H00000000", # Pure Black Outline
        stroke_width: int = 4,
        margin_v: int = 240 # Vertical margin from bottom
    ) -> str:
        """
        Generates an Advanced SubStation Alpha (.ass) file with word-level highlights
        and optional opening hook banner.
        """
        os.makedirs(os.path.dirname(output_ass_path), exist_ok=True)

        # Style presets
        if style == "bold_viral":
            font_size = 62
            stroke_width = 5
            primary_color = "&H00FFFFFF"
            highlight_color = "&H0000D4FF" # Bright Viral Gold/Yellow
            margin_v = 280
        elif style == "karaoke":
            font_size = 58
            stroke_width = 4
            primary_color = "&H00FFFFFF"
            highlight_color = "&H0000FF00" # Neon Green
            margin_v = 260
        elif style == "minimal":
            font_size = 46
            stroke_width = 2
            primary_color = "&H00F0F0F0"
            highlight_color = "&H00FFFFFF"
            margin_v = 180
        elif style == "podcast":
            font_size = 50
            stroke_width = 3
            primary_color = "&H00E0E0FF"
            highlight_color = "&H00FF8000" # Sky Blue
            margin_v = 220

        # Header for ASS file (1080x1920 base script coordinate system)
        ass_content = f"""[Script Info]
Title: VIRALCUT AI Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{primary_color},&H000000FF,{stroke_color},&H80000000,-1,0,0,0,100,100,0,0,1,{stroke_width},2,2,40,40,{margin_v},1
Style: HookStyle,{font_name},68,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,8,50,50,280,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []

        # 1. Add Opening Hook Banner if present (displays for first 3.5 seconds)
        if hook_text and hook_text.strip():
            hook_clean = hook_text.strip().replace("\n", " ").upper()
            events.append(
                f"Dialogue: 1,0:00:00.00,0:00:03.50,HookStyle,,0,0,0,,{{\\fad(200,300)}}🔥 {hook_clean}"
            )

        # 2. Add Word-level or Card-level Subtitle Events
        for card in subtitles:
            words = card.get("words", [])
            start_sec = card.get("start", 0.0)
            end_sec = card.get("end", start_sec + 1.5)

            if words and len(words) > 0:
                # Karaoke / Word highlight animation
                for active_idx, target_word in enumerate(words):
                    w_start = target_word["start"]
                    w_end = target_word["end"]
                    if w_end <= w_start:
                        w_end = w_start + 0.3

                    # Construct sentence where the active word has highlight color
                    sentence_parts = []
                    for i, w in enumerate(words):
                        w_text = w["word"].upper()
                        if i == active_idx:
                            # Highlighted word with slight bounce scale
                            sentence_parts.append(f"{{\\c{highlight_color}\\fscx108\\fscy108}}{w_text}{{\\c{primary_color}\\fscx100\\fscy100}}")
                        else:
                            sentence_parts.append(w_text)
                    
                    line_text = " ".join(sentence_parts)
                    events.append(
                        f"Dialogue: 0,{self._fmt_time(w_start)},{self._fmt_time(w_end)},Default,,0,0,0,,{line_text}"
                    )
            else:
                # Plain card text
                text_clean = card.get("text", "").strip().upper()
                if text_clean:
                    events.append(
                        f"Dialogue: 0,{self._fmt_time(start_sec)},{self._fmt_time(end_sec)},Default,,0,0,0,,{text_clean}"
                    )

        ass_content += "\n".join(events) + "\n"

        with open(output_ass_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        return output_ass_path

    def _fmt_time(self, seconds: float) -> str:
        """Converts float seconds to ASS timestamp format: H:MM:SS.cs"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centisecs = int(round((seconds - int(seconds)) * 100))
        if centisecs >= 100:
            centisecs = 99
        return f"{hours}:{minutes:02d}:{secs:02d}.{centisecs:02d}"

caption_renderer_service = CaptionRendererService()
