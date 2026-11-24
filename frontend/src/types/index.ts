export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
  probability?: number;
}

export interface SubtitleCard {
  id: number;
  text: string;
  start: number;
  end: number;
  words?: SubtitleWord[];
}

export interface Clip {
  id: number;
  project_id: number;
  title: string;
  hook?: string;
  category: string;
  viral_score: number;
  reason?: string;
  start_time: number;
  end_time: number;
  duration: number;
  framing_mode: string;
  framing_config?: any;
  caption_style: string;
  caption_settings?: any;
  subtitles?: SubtitleCard[];
  export_resolution: string;
  export_codec: string;
  crf: number;
  rendered_file_path?: string;
  download_url?: string;
  thumbnail_path?: string;
  file_size_bytes?: number;
  status: 'draft' | 'queued' | 'rendering' | 'completed' | 'failed';
  render_progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  title: string;
  source_type: 'upload' | 'youtube';
  source_url?: string;
  file_path?: string;
  file_size_bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  custom_prompt?: string;
  status: 'uploaded' | 'awaiting_media' | 'processing' | 'ready' | 'failed';
  error_message?: string;
  clips: Clip[];
  created_at: string;
  updated_at: string;
}

export interface ProcessingJob {
  id: string;
  project_id?: number;
  clip_id?: number;
  job_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_step?: string;
  progress: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface GeminiSettings {
  is_configured: boolean;
  masked_key: string;
  model: string;
  supported_models: string[];
  setup_guide: {
    title: string;
    step_1: string;
    step_2: string;
    step_3: string;
    note: string;
  };
}

export interface OwnerDashboardData {
  stats: {
    total_projects: number;
    total_clips: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    storage_used_mb: number;
    disk_free_gb: number;
    disk_total_gb: number;
    uptime_hours: number;
    maintenance_mode: boolean;
  };
  services: {
    frontend: { status: string; port: number };
    backend: { status: string; version: string; env: string };
    database: { status: string; provider: string };
    gemini_api: { status: string; model: string };
    ffmpeg: { status: string; engine: string };
    storage: { status: string; provider: string };
  };
}
