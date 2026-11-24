import os
import re
from typing import List, Dict, Any, Optional

class CaptionRendererService:
    def __init__(self):
        # Power words for automatic keyword highlight style
        self.POWER_KEYWORDS = set([
            "SECRET", "NEVER", "ALWAYS", "MONEY", "MILLION", "BILLION", "TRUTH", "LIE",
            "SHOCKING", "VIRAL", "INSANE", "CRAZY", "MISTAKE", "WHY", "HOW", "STOP",
            "BEST", "WORST", "DANGEROUS", "FREE", "RICH", "POOR", "AI", "GOD", "WAR",
            "GTA", "LUCIA", "TRAILER", "GAME", "RULES", "POWER", "SUCCESS", "HINDI",
            "सच", "झूठ", "रहस्य", "वायरल", "पैसा", "सफलता", "नियम", "खतरनाक", "गलती"
        ])

    def generate_ass_subtitles(
        self,
        subtitles: List[Dict[str, Any]],
        output_ass_path: str,
        style: str = "karaoke",
        hook_text: Optional[str] = None,
        video_title: Optional[str] = None,
        duration: float = 15.0,
        font_name: str = "Arial, Noto Sans Devanagari, Mangal, Segoe UI",
        margin_bottom: int = 240,
        margin_top: int = 280
    ) -> str:
        """
        Generates an Advanced SubStation Alpha (.ass) file with 3-zone vertical kinetic animations,
        word-level audio-synchronized highlights, and top/bottom motion graphics.
        """
        os.makedirs(os.path.dirname(output_ass_path), exist_ok=True)

        # Style presets configuration
        # Colors are &HAABBGGRR (ASS hex format)
        if style == "word_pop":
            font_size = 62
            stroke_width = 5
            primary_color = "&H00FFFFFF"   # White
            highlight_color = "&H0000E5FF" # Vibrant Gold/Amber
            shadow_color = "&H80000000"
            pop_scale = 120
        elif style == "bouncing":
            font_size = 60
            stroke_width = 5
            primary_color = "&H00FFFFFF"
            highlight_color = "&H0000FF7F" # Neon Spring Green
            shadow_color = "&H80000000"
            pop_scale = 115
        elif style == "bold_podcast":
            font_size = 64
            stroke_width = 6
            primary_color = "&H00E2E8F0"
            highlight_color = "&H0000D4FF" # Vibrant Yellow
            shadow_color = "&HAA000000"
            pop_scale = 108
        elif style == "neon_glow":
            font_size = 58
            stroke_width = 3
            primary_color = "&H00FFFFFF"
            highlight_color = "&H00FFFF00" # Cyan Glow
            shadow_color = "&H40FF00AA"    # Neon Magenta Shadow Glow
            pop_scale = 112
        elif style == "minimal_clean":
            font_size = 48
            stroke_width = 2
            primary_color = "&H00F8FAFC"
            highlight_color = "&H0038BDF8" # Light Sky Blue
            shadow_color = "&H40000000"
            pop_scale = 105
        elif style == "keyword_highlight":
            font_size = 60
            stroke_width = 5
            primary_color = "&H00FFFFFF"
            highlight_color = "&H00002BFF" # Power Red / Coral for key words
            shadow_color = "&H80000000"
            pop_scale = 118
        elif style == "premium_social":
            font_size = 64
            stroke_width = 6
            primary_color = "&H00FFFFFF"
            highlight_color = "&H0000FFCC" # Electric Lime / Cyan
            shadow_color = "&H90000000"
            pop_scale = 114
        else: # "karaoke" or default
            style = "karaoke"
            font_size = 60
            stroke_width = 5
            primary_color = "&H00FFFFFF"
            highlight_color = "&H0000FFFF" # Vibrant Yellow
            shadow_color = "&H80000000"
            pop_scale = 110

        # Base 1080x1920 coordinate system for ASS (scales proportionally to 4K 2160x3840)
        ass_content = f"""[Script Info]
Title: VIRALCUT AI Kinetic Captions & Motion Graphics
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: KineticCaption,{font_name},{font_size},{primary_color},&H000000FF,&H00000000,{shadow_color},-1,0,0,0,100,100,0,0,1,{stroke_width},3,2,60,60,{margin_bottom},1
Style: TopHookCard,{font_name},66,&H0000FFFF,&H000000FF,&H00000000,&HA0000000,-1,0,0,0,100,100,1,0,1,5,4,8,60,60,{margin_top},1
Style: CategoryBadge,{font_name},34,&H00E2E8F0,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,2,2,8,60,60,{margin_top + 130},1
Style: AudioWaveBar,{font_name},28,&H00A855F7,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,1,0,1,0,0,2,60,60,{margin_bottom - 70},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []

        # ========================================================
        # 1. TOP ZONE MOTION GRAPHICS: Hook & Brand Category Pill
        # ========================================================
        hook_dur = min(4.5, duration)
        if hook_text and hook_text.strip():
            hook_clean = hook_text.strip().replace("\n", " ")
            # Animated Hook with smooth fade in and subtle zoom-pop
            events.append(
                f"Dialogue: 2,0:00:00.00,{self._fmt_time(hook_dur)},TopHookCard,,0,0,0,,{{\\fad(250,400)\\t(0,250,\\fscx104\\fscy104)\\t(250,500,\\fscx100\\fscy100)}}🔥 {hook_clean}"
            )
            # Subtle category badge right above the hook
            badge_title = (video_title[:32] if video_title else "VIRAL MOMENT").upper()
            events.append(
                f"Dialogue: 1,0:00:00.00,{self._fmt_time(duration)},CategoryBadge,,0,0,0,,{{\\fad(300,300)}}● {badge_title} ●"
            )

        # Subtle bottom decorative audio waveform bar indicator
        events.append(
            f"Dialogue: 1,0:00:00.00,{self._fmt_time(duration)},AudioWaveBar,,0,0,0,,{{\\fad(400,400)}}  ▂ ▃ ▄ ▅ ▆ ▇ █ ▇ ▆ ▅ ▄ ▃ ▂   ▂ ▃ ▄ ▅ ▆ ▇ █ ▇ ▆ ▅  "
        )

        # ========================================================
        # 2. BOTTOM ZONE: Kinetic Word-by-Word Captions
        # ========================================================
        for card in subtitles:
            words = card.get("words", [])
            start_sec = card.get("start", 0.0)
            end_sec = card.get("end", start_sec + 1.5)

            if words and len(words) > 0:
                for active_idx, target_word in enumerate(words):
                    w_start = target_word.get("start", start_sec)
                    w_end = target_word.get("end", w_start + 0.35)
                    if w_end <= w_start:
                        w_end = w_start + 0.35

                    sentence_parts = []
                    for i, w in enumerate(words):
                        raw_word = str(w.get("word", "")).strip()
                        if not raw_word:
                            continue

                        clean_token = re.sub(r'[^A-Za-z0-9\u0900-\u097F]', '', raw_word).upper()
                        is_power_kw = (clean_token in self.POWER_KEYWORDS)

                        if i == active_idx:
                            # ACTIVE WORD: Kinetic animation based on selected style
                            if style == "word_pop":
                                sentence_parts.append(
                                    f"{{\\c{highlight_color}\\t(0,120,\\fscx{pop_scale}\\fscy{pop_scale})\\t(120,240,\\fscx100\\fscy100)}}{raw_word}{{\\c{primary_color}\\fscx100\\fscy100}}"
                                )
                            elif style == "bouncing":
                                sentence_parts.append(
                                    f"{{\\c{highlight_color}\\t(0,100,\\fscy{pop_scale}\\fsp2)\\t(100,200,\\fscy100\\fsp0)}}{raw_word}{{\\c{primary_color}}}"
                                )
                            elif style == "neon_glow":
                                sentence_parts.append(
                                    f"{{\\c{highlight_color}\\blur4\\3c{shadow_color}\\fscx108\\fscy108}}{raw_word}{{\\c{primary_color}\\blur0\\3c&H00000000&\\fscx100\\fscy100}}"
                                )
                            elif style == "keyword_highlight" and is_power_kw:
                                sentence_parts.append(
                                    f"{{\\c&H0000FFFF&\\fscx122\\fscy122}}{raw_word}{{\\c{primary_color}\\fscx100\\fscy100}}"
                                )
                            elif style == "premium_social":
                                sentence_parts.append(
                                    f"{{\\c{highlight_color}\\fscx114\\fscy114\\b1}}{raw_word}{{\\c{primary_color}\\fscx100\\fscy100\\b0}}"
                                )
                            else: # karaoke & bold_podcast
                                sentence_parts.append(
                                    f"{{\\c{highlight_color}\\fscx{pop_scale}\\fscy{pop_scale}}}{raw_word}{{\\c{primary_color}\\fscx100\\fscy100}}"
                                )
                        else:
                            # INACTIVE WORDS: If keyword_highlight is active and word is power word, give it subtle accent
                            if style == "keyword_highlight" and is_power_kw:
                                sentence_parts.append(f"{{\\c&H0000E5FF&}}{raw_word}{{\\c{primary_color}}}")
                            else:
                                sentence_parts.append(raw_word)

                    line_text = " ".join(sentence_parts)
                    events.append(
                        f"Dialogue: 0,{self._fmt_time(w_start)},{self._fmt_time(w_end)},KineticCaption,,0,0,0,,{line_text}"
                    )
            else:
                # Plain card text fallback
                text_clean = card.get("text", "").strip()
                if text_clean:
                    events.append(
                        f"Dialogue: 0,{self._fmt_time(start_sec)},{self._fmt_time(end_sec)},KineticCaption,,0,0,0,,{{\\fad(150,150)}}{text_clean}"
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
