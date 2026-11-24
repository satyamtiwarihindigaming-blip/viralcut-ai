import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User

from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.clips import router as clips_router
from app.api.jobs import router as jobs_router
from app.api.settings import router as settings_router
from app.api.owner import router as owner_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default owner account
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == settings.OWNER_EMAIL))
        owner = result.scalar_one_or_none()
        if not owner:
            default_admin = User(
                email=settings.OWNER_EMAIL,
                hashed_password=get_password_hash(settings.OWNER_PASSWORD),
                full_name="VIRALCUT AI Owner",
                is_active=True,
                is_superuser=True
            )
            session.add(default_admin)
            await session.commit()

    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VIRALCUT AI — 4K AI Video Clipping Engine & SaaS API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow local and cloud domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Maintenance mode check middleware
@app.middleware("http")
async def check_maintenance(request: Request, call_next):
    if settings.MAINTENANCE_MODE and not request.url.path.startswith("/api/owner"):
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"detail": "VIRALCUT AI is temporarily in maintenance mode. Please try again soon."}
        )
    return await call_next(request)

# Static file serving for media storage
os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_LOCAL_DIR)), name="storage")

# Include Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(clips_router, prefix="/api")
app.include_router(jobs_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(owner_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "description": "Production 4K AI Video Clipping SaaS Engine"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
