import json
import time
import re
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.core.config import settings

class GeminiService:
    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-3.5-flash-lite"
        self._client: Optional[genai.Client] = None
        self.supported_models = [
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-3.5-flash",
            "gemini-3.1-pro-preview",
        ]
    
    def _get_client(self) -> genai.Client:
        key = self.api_key or settings.GEMINI_API_KEY
        if not key or key == "your_gemini_api_key_here":
            raise ValueError(
                "GEMINI_API_KEY is not configured. Please get a free API key at "
                "https://aistudio.google.com/apikey and configure it in AI Settings."
            )
        if not self._client or self.api_key != getattr(self._client, "_configured_key", None):
            self._client = genai.Client(api_key=key)
            self._client._configured_key = key
        return self._client

    def test_connection(self) -> Dict[str, Any]:
        """Test API key validity and measure response latency."""
        start_time = time.time()
        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=self.model_name,
                contents="Respond with the exact word 'ONLINE' if you receive this message.",
            )
            latency_ms = round((time.time() - start_time) * 1000, 2)
            
            supported_models = self.supported_models
            
            return {
                "success": True,
                "model": self.model_name,
                "message": f"Gemini API connection successful ({latency_ms}ms). Response: {response.text.strip()}",
                "latency_ms": latency_ms,
                "supported_models": supported_models,
            }
        except Exception as e:
            err_msg = str(e)
            if "API_KEY_INVALID" in err_msg or "400" in err_msg:
                user_msg = "Invalid Gemini API Key. Please verify your key at https://aistudio.google.com/apikey."
            elif "RESOURCE_EXHAUSTED" in err_msg or "429" in err_msg:
                user_msg = "Gemini API Quota limit reached. Please wait a moment or check your Google AI Studio quota."
            else:
                user_msg = f"Gemini connection error: {err_msg}"
                
            return {
                "success": False,
                "model": self.model_name,
                "message": user_msg,
                "latency_ms": None,
                "supported_models": ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
            }

    def detect_viral_moments(
        self,
        transcript_text: str,
        duration_seconds: float,
        target_clips: int = 3,
        min_clip_len: int = 30,
        max_clip_len: int = 60,
        custom_instructions: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Analyze transcript context to find high-engagement viral clips.
        Ensures complete thoughts/sentences and never cuts off mid-sentence.
        """
        client = self._get_client()

        user_guide = custom_instructions or (
            "Identify the most engaging, viral-worthy segments: "
            "emotional moments, surprising revelations, funny dialogue, high-retention stories, or deep insights."
        )

        prompt = f"""
You are the AI Director for VIRALCUT AI, a professional video clipping engine.
Your task is to analyze the following video transcript and identify exactly {target_clips} high-impact viral clip candidates for vertical short-form video (TikTok, YouTube Shorts, Reels).

CRITICAL RULES:
1. Clip duration MUST be between {min_clip_len} and {max_clip_len} seconds. Total video duration is {duration_seconds:.1f} seconds.
2. DO NOT cut sentences in the middle. Choose natural conversation start and end boundaries.
3. Every clip must have a clear hook in the first 3 seconds to stop viewers scrolling.
4. User Focus / Guidance: "{user_guide}"
5. Choose the optimal framing layout based on scene context:
   - "speaker_tracking": standard single person speaking or dominant speaker
   - "split_screen": two people having a dialogue/debate
   - "stacked_screen": multi-person podcast or reaction setup
   - "blurred_bg": wide landscape context where full screen must be preserved
   - "dynamic_tracking": fast moving object or speaker

TRANSCRIPT WITH TIMESTAMPS:
{transcript_text}

OUTPUT FORMAT:
Return a valid JSON array of objects. Do NOT include markdown backticks like ```json ... ```, just pure JSON:
[
  {{
    "start_time": 12.0,
    "end_time": 45.0,
    "title": "Catchy 3-5 Word Title",
    "hook": "Attention-grabbing opening hook text",
    "category": "educational",
    "viral_score": 92,
    "reason": "Clear narrative arc with an unexpected conclusion",
    "framing": "speaker_tracking"
  }}
]
"""
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        text = response.text.strip()
        # Clean markdown code blocks if present
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()

        try:
            candidates = json.loads(text)
            if not isinstance(candidates, list):
                raise ValueError("Expected a list of clip candidates")
        except Exception:
            # Fallback regex extraction of JSON array
            match = re.search(r"\[.*\]", text, re.DOTALL)
            if match:
                candidates = json.loads(match.group(0))
            else:
                raise ValueError(f"Failed to parse Gemini viral moments JSON response: {text[:200]}")

        # Validate timestamps and bounds
        validated = []
        for c in candidates:
            start = max(0.0, float(c.get("start_time", 0.0)))
            end = min(duration_seconds, float(c.get("end_time", start + 30.0)))
            if end <= start:
                end = min(duration_seconds, start + 30.0)
            
            # Constrain duration bounds
            clip_dur = end - start
            if clip_dur < 10.0 and duration_seconds >= 15.0:
                end = min(duration_seconds, start + 15.0)

            validated.append({
                "start_time": round(start, 2),
                "end_time": round(end, 2),
                "title": str(c.get("title", "Untitled Viral Moment")),
                "hook": str(c.get("hook", "Wait for this...")),
                "category": str(c.get("category", "general")),
                "viral_score": int(c.get("viral_score", 85)),
                "reason": str(c.get("reason", "High audience retention factor")),
                "framing": str(c.get("framing", "speaker_tracking")),
            })

        return validated

gemini_service = GeminiService()
