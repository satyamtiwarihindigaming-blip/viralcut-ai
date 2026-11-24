import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Server, 
  Database, 
  Cloud, 
  HardDrive, 
  Cpu, 
  Film, 
  Scissors, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Power 
} from 'lucide-react';
import { OwnerDashboardData } from '../types';
import { ownerService } from '../services/api';

export const OwnerDashboardPage: React.FC = () => {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await ownerService.getDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    try {
      setIsTogglingMaintenance(true);
      const res = await ownerService.toggleMaintenance();
      if (data) {
        setData({
          ...data,
          stats: { ...data.stats, maintenance_mode: res.maintenance_mode }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading Owner Administration...</span>
      </div>
    );
  }

  const stats = data?.stats;
  const services = data?.services;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
            <span>Owner Administration</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            24/7 Cloud infrastructure monitor, background queue health, and maintenance controls.
          </p>
        </div>

        {/* Maintenance Toggle */}
        <button
          onClick={handleToggleMaintenance}
          disabled={isTogglingMaintenance}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            stats?.maintenance_mode
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
              : 'bg-dark-800 border-dark-border text-gray-300 hover:text-white'
          }`}
        >
          <Power className="w-4 h-4 text-purple-400" />
          <span>
            {stats?.maintenance_mode ? 'Maintenance Mode: ON' : 'Maintenance Mode: OFF'}
          </span>
        </button>
      </div>

      {/* Cloud Architecture Health Matrix */}
      <div className="rounded-3xl glass-panel border border-dark-border p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <span>Cloud Services Status (Render 24/7 Architecture)</span>
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Frontend Web</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-white">React 19 + Vite</p>
            <p className="text-[10px] text-emerald-400 font-medium">Port 5173 / CDN Ready</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Backend API</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-white">FastAPI {services?.backend?.version}</p>
            <p className="text-[10px] text-emerald-400 font-medium">Uvicorn Async Online</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Background Worker</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-white">Celery / Asyncio</p>
            <p className="text-[10px] text-emerald-400 font-medium">Independent Video Engine</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Database</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-white">PostgreSQL / Async</p>
            <p className="text-[10px] text-emerald-400 font-medium">SQLAlchemy Connected</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Gemini AI Client</span>
              <span className={`w-2 h-2 rounded-full ${
                services?.gemini_api?.status === 'ready' ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </div>
            <p className="text-sm font-bold text-white">Google GenAI SDK</p>
            <p className="text-[10px] text-purple-400 font-medium">{services?.gemini_api?.model}</p>
          </div>

          <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Rendering Engine</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-white">FFmpeg 4K Lanczos</p>
            <p className="text-[10px] text-emerald-400 font-medium">H.264 / H.265 Accelerated</p>
          </div>
        </div>
      </div>

      {/* Production Metrics & Storage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Jobs Breakdown */}
        <div className="p-6 rounded-3xl bg-dark-800/60 border border-dark-border space-y-4">
          <h3 className="font-bold text-white text-base">Pipeline Jobs Execution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Active Jobs Running</span>
              <span className="font-bold text-purple-400">{stats?.active_jobs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Completed Video Jobs</span>
              <span className="font-bold text-emerald-400">{stats?.completed_jobs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Failed / Retried Jobs</span>
              <span className="font-bold text-rose-400">{stats?.failed_jobs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">System Uptime</span>
              <span className="font-bold text-white">{stats?.uptime_hours} Hours</span>
            </div>
          </div>
        </div>

        {/* Disk & Object Storage Footprint */}
        <div className="p-6 rounded-3xl bg-dark-800/60 border border-dark-border space-y-4">
          <h3 className="font-bold text-white text-base">Persistent Storage & Volumes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Media Footprint</span>
              <span className="font-bold text-gradient">{stats?.storage_used_mb} MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Available Disk Space</span>
              <span className="font-bold text-emerald-400">{stats?.disk_free_gb} GB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Total Volume Size</span>
              <span className="font-bold text-white">{stats?.disk_total_gb} GB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-900 border border-dark-border text-xs">
              <span className="text-gray-400">Storage Provider</span>
              <span className="font-bold text-purple-400 uppercase">{services?.storage?.provider}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
