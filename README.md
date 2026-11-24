# VIRALCUT AI — 4K AI Video Clipping SaaS

> Production-ready AI-powered video clipping platform: Automatic viral moment detection using the official Google GenAI SDK, Faster-Whisper Hindi/English transcription, computer vision smart reframing (9:16), animated captions, and true 4K FFmpeg rendering.

---

## 🌟 Key Capabilities

1. **Automatic AI Director**: 1-click end-to-end pipeline (`Upload -> Metadata -> Scene Cuts -> Whisper Transcription -> Gemini Analysis -> Face & Speaker Tracking -> Smart Reframing -> Captions -> 4K Render`).
2. **True 4K Video Engine**: Default export resolution `2160 × 3840` (9:16 vertical), with Lanczos scaling, H.264/H.265 encoding, and visually lossless CRF tuning.
3. **Advanced Smart Reframing**:
   - Single-Speaker Smart Tracking (smooth horizontal pan following face interest point)
   - 2-Person Split Screen (podcast/interview stacked format)
   - 3-Person Stacked Composition
   - Blurred Background Composition (preserving wide context)
   - Dynamic Motion Tracking & Context-Aware Wide Framing
4. **AI Caption Engine**: Faster-Whisper transcription supporting Hindi, English, and Hinglish with word-level timestamps, animated neon highlights, karaoke bouncing, and opening hook banners.
5. **Full Video Editor**: Real-time trimming, seek controls, reframing switch, subtitle text & timing editor, and re-rendering.
6. **24/7 Cloud Architecture**: Render-ready blueprint with separate Frontend, Backend API, Celery Background Worker, PostgreSQL, and Redis Queue.

---

## 🛠️ Architecture & Tech Stack

```
                        ┌─────────────────────────────────────────┐
                        │          React 19 + Vite Frontend       │
                        │       (Tailwind CSS, Lucide Icons)      │
                        └────────────────────┬────────────────────┘
                                             │ HTTP / REST
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │            FastAPI Backend              │
                        │        (Auth, Projects, Storage)        │
                        └─────────┬──────────────────────┬────────┘
                                  │                      │
                 Task Enqueue     ▼                      ▼   Object Media
                        ┌──────────────────┐   ┌──────────────────────────┐
                        │ Redis Job Queue  │   │  Local Storage / AWS S3  │
                        └─────────┬────────┘   └─────────────▲────────────┘
                                  │                          │
                 Worker Consume   ▼                          │
                        ┌────────────────────────────────────┴────┐
                        │      Celery 24/7 Cloud Worker Engine    │
                        │  - Faster-Whisper (Hindi/English)       │
                        │  - Google GenAI SDK (Gemini 2.5 Flash)  │
                        │  - OpenCV Face & Motion Tracking        │
                        │  - PySceneDetect Cut Detection          │
                        │  - FFmpeg True 4K Lanczos Rendering     │
                        └─────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+
- FFmpeg 6.0+

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Configure your free **GEMINI_API_KEY** in `.env`:
Get a free key from [Google AI Studio](https://aistudio.google.com/apikey).

Start backend API:
```bash
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will be running at `http://localhost:5173`.

### 3. Default Login Credentials
- **Email**: `admin@viralcut.ai`
- **Password**: `admin123456`

---

## ☁️ 24/7 Cloud Deployment (Render)

This repository includes a native `render.yaml` blueprint defining the complete 5-part production infrastructure:

1. Push your repository to your private GitHub repository (`viralcut-ai`).
2. Log into [Render.com](https://render.com).
3. Click **New +** -> **Blueprint**.
4. Connect your private repository `viralcut-ai`.
5. Enter your environment variables:
   - `GEMINI_API_KEY`: Your key from Google AI Studio.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
6. Click **Apply Blueprint**. Render will provision:
   - `viralcut-frontend` (Static Web Service)
   - `viralcut-backend` (FastAPI Docker Web Service)
   - `viralcut-worker` (Background Processing Worker)
   - `viralcut-postgres` (Managed Database)
   - `viralcut-redis` (Job Broker)

Your platform will run 24/7 in the cloud completely independent of your personal PC or phone.

---

## 🔒 Security & Secret Management

- **No Secrets in Frontend**: All Gemini API calls, database credentials, and signing keys are isolated in backend environment variables.
- **Git Protection**: `.gitignore` strictly ignores `.env`, video binaries, temporary media, and database files.
- **Path Traversal Protection**: Uploaded files receive cryptographically random UUID names.
- **CORS & Auth**: Restricted origin handling and BCrypt password hashing.

---

## 📄 License
Private & Proprietary — VIRALCUT AI. All rights reserved.
