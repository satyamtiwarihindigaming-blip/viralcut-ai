# ===================================================
# VIRALCUT AI — Production Backend & Worker Dockerfile
# Ubuntu-based with FFmpeg 7/8/9, OpenCV, and Python 3.11
# ===================================================

FROM python:3.11-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies: FFmpeg, OpenCV, Node.js, Deno, unzip (for YouTube JS runtime challenge solver)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1 \
    curl \
    unzip \
    nodejs \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://deno.land/install.sh | sh

ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Create media directories
RUN mkdir -p /app/storage/uploads /app/storage/clips /app/storage/temp /app/storage/exports

EXPOSE 8000

# Default command runs FastAPI web service
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
