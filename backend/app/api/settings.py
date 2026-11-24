import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.core.config import settings, BASE_DIR
from app.services.gemini_service import gemini_service
from app.schemas.settings import GeminiSettingsRequest, GeminiTestResponse

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/gemini")
async def get_gemini_settings():
    """
    Returns current Gemini configuration status without ever leaking the actual raw key.
    """
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here")
    masked_key = ""
    if has_key and settings.GEMINI_API_KEY:
        k = settings.GEMINI_API_KEY
        masked_key = f"{k[:4]}...{k[-4:]}" if len(k) > 8 else "****"

    return {
        "is_configured": has_key,
        "masked_key": masked_key,
        "model": settings.GEMINI_MODEL,
        "supported_models": [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ],
        "setup_guide": {
            "title": "How to get a Google AI Studio Gemini API Key",
            "step_1": "Go to Google AI Studio at https://aistudio.google.com/apikey",
            "step_2": "Click 'Create API key'",
            "step_3": "Paste the generated key below and click 'Save & Test Connection'",
            "note": "Your key is stored securely in backend server environment variables and is never exposed to browser clients or committed to GitHub."
        }
    }

@router.post("/gemini")
async def update_gemini_settings(req: GeminiSettingsRequest):
    """
    Updates the backend Gemini API key and model in-memory and persists to backend/.env.
    """
    if req.gemini_api_key and req.gemini_api_key.strip():
        new_key = req.gemini_api_key.strip()
        settings.GEMINI_API_KEY = new_key
        gemini_service.api_key = new_key

    if req.gemini_model and req.gemini_model.strip():
        new_model = req.gemini_model.strip()
        settings.GEMINI_MODEL = new_model
        gemini_service.model_name = new_model

    # Persist to local .env if in local development
    env_file = BASE_DIR / ".env"
    try:
        lines = []
        if os.path.exists(env_file):
            with open(env_file, "r", encoding="utf-8") as f:
                lines = f.readlines()

        key_written = False
        model_written = False
        new_lines = []
        for line in lines:
            if line.startswith("GEMINI_API_KEY="):
                new_lines.append(f"GEMINI_API_KEY={settings.GEMINI_API_KEY}\n")
                key_written = True
            elif line.startswith("GEMINI_MODEL="):
                new_lines.append(f"GEMINI_MODEL={settings.GEMINI_MODEL}\n")
                model_written = True
            else:
                new_lines.append(line)

        if not key_written and settings.GEMINI_API_KEY:
            new_lines.append(f"GEMINI_API_KEY={settings.GEMINI_API_KEY}\n")
        if not model_written and settings.GEMINI_MODEL:
            new_lines.append(f"GEMINI_MODEL={settings.GEMINI_MODEL}\n")

        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass # In production, environment variables are managed via cloud host (Render)

    return {
        "success": True,
        "message": "Gemini configuration updated successfully",
        "model": settings.GEMINI_MODEL,
        "is_configured": bool(settings.GEMINI_API_KEY)
    }

@router.post("/gemini/test", response_model=GeminiTestResponse)
async def test_gemini_connection():
    """
    Tests live connection to Google GenAI API with the configured key.
    """
    res = gemini_service.test_connection()
    return res
