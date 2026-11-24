import os
from typing import List, Dict, Any, Optional
from faster_whisper import WhisperModel

class TranscriptionService:
    def __init__(self, model_size: str = "tiny", device: str = "cpu", compute_type: str = "int8"):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self._model: Optional[WhisperModel] = None

    def _get_model(self) -> WhisperModel:
        if self._model is None:
            # Load lightweight Faster-Whisper model (runs fast on 512MB RAM cloud & local CPU)
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
                cpu_threads=1,
                num_workers=1
            )
        return self._model

    def transcribe_video(
        self,
        video_path: str,
        language: Optional[str] = None # None for auto-detect (Hindi, English, etc.)
    ) -> Dict[str, Any]:
        """
        Transcribe video audio with word-level timestamps using Faster-Whisper.
        Automatically detects Hindi, English, and multi-lingual Hinglish.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        model = self._get_model()

        # Demux 16kHz mono audio WAV first for ultra-fast Whisper transcription
        import subprocess
        audio_wav_path = f"{os.path.splitext(video_path)[0]}_temp_audio.wav"
        demux_cmd = [
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn", "-ar", "16000", "-ac", "1",
            "-c:a", "pcm_s16le",
            audio_wav_path
        ]
        input_media = video_path
        try:
            subprocess.run(demux_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            if os.path.exists(audio_wav_path):
                input_media = audio_wav_path
        except Exception:
            input_media = video_path

        try:
            # Run transcription with word timestamps enabled (vad_filter=False keeps memory <60MB)
            segments_gen, info = model.transcribe(
                input_media,
                language=language if language and language != "auto" else None,
                word_timestamps=True,
                vad_filter=False,
                beam_size=1
            )
        finally:
            if input_media != video_path and os.path.exists(audio_wav_path):
                try:
                    os.remove(audio_wav_path)
                except Exception:
                    pass

        detected_language = info.language
        language_probability = round(info.language_probability, 3)

        segments_data = []
        full_transcript_lines = []

        for seg in segments_gen:
            words_list = []
            if seg.words:
                for w in seg.words:
                    words_list.append({
                        "word": w.word.strip(),
                        "start": round(w.start, 2),
                        "end": round(w.end, 2),
                        "probability": round(w.probability, 2) if hasattr(w, "probability") else 1.0
                    })
            
            clean_text = seg.text.strip()
            segments_data.append({
                "id": seg.id,
                "start": round(seg.start, 2),
                "end": round(seg.end, 2),
                "text": clean_text,
                "words": words_list
            })
            full_transcript_lines.append(f"[{round(seg.start, 1)}s - {round(seg.end, 1)}s] {clean_text}")

        # Unload Whisper model immediately to free ~150MB RAM before Gemini & FFmpeg start
        del self._model
        self._model = None
        import gc
        gc.collect()

        return {
            "language": detected_language,
            "language_probability": language_probability,
            "duration": round(info.duration, 2),
            "segments": segments_data,
            "formatted_transcript": "\n".join(full_transcript_lines),
        }

    def extract_clip_subtitles(
        self,
        transcription: Dict[str, Any],
        start_time: float,
        end_time: float
    ) -> List[Dict[str, Any]]:
        """
        Extract and rebase word timestamps relative to the clip's 0-based start time.
        """
        clip_words = []
        for seg in transcription.get("segments", []):
            for w in seg.get("words", []):
                w_start = w["start"]
                w_end = w["end"]
                # Check overlap
                if w_end > start_time and w_start < end_time:
                    relative_start = max(0.0, w_start - start_time)
                    relative_end = max(relative_start + 0.1, min(end_time - start_time, w_end - start_time))
                    clip_words.append({
                        "word": w["word"],
                        "start": round(relative_start, 2),
                        "end": round(relative_end, 2),
                    })

        # Group words into short viral reading chunks (2-4 words per subtitle card)
        grouped_cards = []
        chunk_size = 3
        for i in range(0, len(clip_words), chunk_size):
            chunk = clip_words[i:i + chunk_size]
            card_start = chunk[0]["start"]
            card_end = chunk[-1]["end"]
            card_text = " ".join(c["word"] for c in chunk)
            grouped_cards.append({
                "id": len(grouped_cards) + 1,
                "text": card_text,
                "start": card_start,
                "end": card_end,
                "words": chunk
            })

        return grouped_cards

transcription_service = TranscriptionService()
