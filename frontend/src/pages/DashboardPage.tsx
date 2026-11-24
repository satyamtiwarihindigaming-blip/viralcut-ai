import React, { useEffect, useState } from 'react';
import { 
  Film, 
  Scissors, 
  Clock, 
  HardDrive, 
  CloudCheck, 
  Sparkles, 
  Play, 
  Download, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { Project, Clip, OwnerDashboardData } from '../types';
import { projectService, clipService, ownerService } from '../services/api';

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [dashboardData, setDashboardData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projList, clipList, dash] = await Promise.all([
        projectService.list(),
        clipService.list(),
        ownerService.getDashboard().catch(() => null)
      ]);
      setProjects(projList);
      setClips(clipList);
      if (dash) setDashboardData(dash);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const activeJobs = dashboardData?.stats.active_jobs || 0;
  const storageUsed = dashboardData?.stats.storage_used_mb || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 glass-panel border border-purple-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Director 2.0 • 4K Auto-Clipping</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Turn Raw Videos Into <span className="text-gradient">Viral 4K Shorts</span> in Seconds
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Automatic speaker tracking, 2-person split screen, Faster-Whisper Hindi/English subtitles, 
            and Gemini AI viral moment detection — rendered in native 2160×3840 4K.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl gradient-brand text-white font-semibold text-sm hover:opacity-95 shadow-xl shadow-purple-600/30 transition-transform active:scale-95"
            >
              <Scissors className="w-4 h-4" />
              <span>Create New Clips</span>
            </button>
            <button
              onClick={() => onNavigate('projects')}
              className="px-5 py-3 rounded-2xl bg-dark-800 hover:bg-dark-700 text-gray-200 text-sm font-medium border border-dark-border transition-colors"
            >
              View Projects
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-dark-800/80 border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Total Projects</span>
            <Film className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{projects.length}</p>
          <p className="text-[11px] text-gray-400">Source videos analyzed</p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800/80 border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Generated Clips</span>
            <Scissors className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-gradient">{clips.length}</p>
          <p className="text-[11px] text-emerald-400 font-medium">4K Vertical Ready</p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800/80 border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Cloud Jobs</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{activeJobs} Active</p>
          <p className="text-[11px] text-gray-400">Background workers online</p>
        </div>

        <div className="p-5 rounded-2xl bg-dark-800/80 border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-medium">Storage Used</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{storageUsed} MB</p>
          <p className="text-[11px] text-gray-400">Persistent Object Storage</p>
        </div>
      </div>

      {/* Recent Videos & Completed Clips Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Source Projects */}
        <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Film className="w-4 h-4 text-purple-400" />
              <span>Recent Source Videos</span>
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No videos uploaded yet. Paste a YouTube link or upload an MP4 to start!
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onNavigate('editor', { projectId: p.id })}
                  className="p-3.5 rounded-xl bg-dark-700/60 hover:bg-dark-700 border border-dark-border/60 flex items-center justify-between cursor-pointer transition-all hover:border-purple-500/30"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-lg bg-dark-900 flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-white truncate">{p.title}</h4>
                      <p className="text-xs text-gray-400">
                        {p.duration ? `${Math.round(p.duration)}s` : 'Unknown dur'} • {p.width ? `${p.width}x${p.height}` : 'Video'} • {p.clips?.length || 0} clips
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    p.status === 'ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-300'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Viral Clips */}
        <div className="p-6 rounded-2xl bg-dark-800/50 border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Latest Viral Clips</span>
            </h3>
            <button
              onClick={() => onNavigate('exports')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <span>Exports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {clips.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No clips rendered yet. Start the AI Director to produce your first 4K clips!
            </div>
          ) : (
            <div className="space-y-3">
              {clips.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate('editor', { clipId: c.id, projectId: c.project_id })}
                  className="p-3.5 rounded-xl bg-dark-700/60 hover:bg-dark-700 border border-dark-border/60 flex items-center justify-between cursor-pointer transition-all hover:border-indigo-500/30"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-lg bg-dark-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {c.thumbnail_path ? (
                        <img src={c.thumbnail_path} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <Scissors className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-semibold text-white truncate">{c.title}</h4>
                      <p className="text-xs text-gray-400">
                        Score: <span className="text-gradient font-bold">{c.viral_score}</span> • {c.export_resolution} • {c.framing_mode}
                      </p>
                    </div>
                  </div>
                  {c.download_url && (
                    <a
                      href={c.download_url}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg bg-dark-800 hover:bg-purple-600 text-gray-300 hover:text-white transition-colors"
                      title="Download 4K Clip"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
