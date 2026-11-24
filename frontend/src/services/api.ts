import axios from 'axios';
import { Project, Clip, ProcessingJob, GeminiSettings, OwnerDashboardData } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
});

// Attach Authorization token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('viralcut_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('viralcut_token', res.data.access_token);
      localStorage.setItem('viralcut_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('viralcut_token');
    localStorage.removeItem('viralcut_user');
  }
};

export const projectService = {
  uploadVideo: async (file: File, title?: string, prompt?: string, onProgress?: (pct: number) => void): Promise<Project> => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (prompt) formData.append('custom_prompt', prompt);

    const res = await api.post('/projects/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
    return res.data;
  },
  validateYoutube: async (url: string) => {
    const res = await api.post('/projects/youtube/validate', { url });
    return res.data;
  },
  createFromYoutube: async (url: string, customPrompt?: string): Promise<Project> => {
    const formData = new FormData();
    formData.append('url', url);
    if (customPrompt) formData.append('custom_prompt', customPrompt);
    const res = await api.post('/projects/youtube', formData);
    return res.data;
  },
  list: async (): Promise<Project[]> => {
    const res = await api.get('/projects');
    return res.data;
  },
  get: async (id: number): Promise<Project> => {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },
  process: async (id: number) => {
    const res = await api.post(`/projects/${id}/process`);
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  }
};

export const clipService = {
  list: async (projectId?: number): Promise<Clip[]> => {
    const res = await api.get('/clips', { params: { project_id: projectId } });
    return res.data;
  },
  get: async (id: number): Promise<Clip> => {
    const res = await api.get(`/clips/${id}`);
    return res.data;
  },
  update: async (id: number, data: Partial<Clip>): Promise<Clip> => {
    const res = await api.patch(`/clips/${id}`, data);
    return res.data;
  },
  rerender: async (id: number, options: { export_resolution?: string; export_codec?: string; crf?: number }) => {
    const res = await api.post(`/clips/${id}/render`, { clip_id: id, ...options });
    return res.data;
  },
  delete: async (id: number) => {
    const res = await api.delete(`/clips/${id}`);
    return res.data;
  }
};

export const jobService = {
  get: async (jobId: string): Promise<ProcessingJob> => {
    const res = await api.get(`/jobs/${jobId}`);
    return res.data;
  },
  cancel: async (jobId: string) => {
    const res = await api.post(`/jobs/${jobId}/cancel`);
    return res.data;
  },
  list: async () => {
    const res = await api.get('/jobs');
    return res.data;
  }
};

export const settingsService = {
  getGemini: async (): Promise<GeminiSettings> => {
    const res = await api.get('/settings/gemini');
    return res.data;
  },
  updateGemini: async (apiKey: string, model: string) => {
    const res = await api.post('/settings/gemini', {
      gemini_api_key: apiKey,
      gemini_model: model,
    });
    return res.data;
  },
  testGemini: async () => {
    const res = await api.post('/settings/gemini/test');
    return res.data;
  }
};

export const ownerService = {
  getDashboard: async (): Promise<OwnerDashboardData> => {
    const res = await api.get('/owner/dashboard');
    return res.data;
  },
  toggleMaintenance: async () => {
    const res = await api.post('/owner/maintenance');
    return res.data;
  }
};

export default api;
