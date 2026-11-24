import React, { useEffect, useState } from 'react';
import { 
  Film, 
  Scissors, 
  Play, 
  Trash2, 
  Sparkles, 
  Clock, 
  Sliders, 
  RefreshCw, 
  Download,
  AlertCircle 
} from 'lucide-react';
import { Project } from '../types';
import { projectService, getMediaUrl } from '../services/api';

interface ProjectsPageProps {
  onNavigate: (page: string, params?: any) => void;
  onJobStarted?: (jobId: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigate, onJobStarted }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.list();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (projectId: number) => {
    try {
      setProcessingId(projectId);
      const res = await projectService.process(projectId);
      if (onJobStarted && res.job_id) {
        onJobStarted(res.job_id);
      }
      await loadProjects();
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to start pipeline');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (projectId: number) => {
    if (!window.confirm('Are you sure you want to delete this project and all its clips?')) return;
    try {
      await projectService.delete(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Projects</h1>
          <p className="text-gray-400 text-sm">Manage source videos and generated 4K clips.</p>
        </div>
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center rounded-3xl glass-panel border border-dark-border space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto text-purple-400">
            <Film className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Projects Found</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">
              Upload your first video to start generating intelligent 4K vertical clips.
            </p>
          </div>
          <button
            onClick={() => onNavigate('create')}
            className="px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold"
          >
            Create Clips
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-2xl bg-dark-800/60 border border-dark-border p-6 space-y-5 hover:border-dark-border/80 transition-all"
            >
              {/* Project Top Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 truncate">
                  <div className="w-12 h-12 rounded-xl bg-dark-900 border border-dark-border flex items-center justify-center flex-shrink-0 text-purple-400">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-lg font-bold text-white truncate">{project.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {project.duration && <span>{Math.round(project.duration)}s duration</span>}
                      {project.width && <span>• {project.width}×{project.height}</span>}
                      {project.fps && <span>• {project.fps} fps</span>}
                      <span className="capitalize">• {project.source_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                    project.status === 'ready'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : project.status === 'processing'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse'
                      : 'bg-dark-700 text-gray-300 border border-dark-border'
                  }`}>
                    {project.status === 'ready' ? 'Ready' : project.status === 'processing' ? 'Processing...' : project.status}
                  </span>

                  {project.status !== 'processing' && (
                    <button
                      onClick={() => handleProcess(project.id)}
                      disabled={processingId === project.id}
                      className="px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{project.clips?.length > 0 ? 'Re-run AI' : 'Run AI Director'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-2 rounded-xl bg-dark-900 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-dark-border transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Generated Clips Sub-Grid */}
              {project.clips && project.clips.length > 0 && (
                <div className="pt-4 border-t border-dark-border space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-purple-400" />
                    <span>Generated Viral Clips ({project.clips.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {project.clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="rounded-xl bg-dark-900/90 border border-dark-border/80 overflow-hidden group hover:border-purple-500/40 transition-all flex flex-col justify-between"
                      >
                        {/* Thumbnail Container */}
                        <div className="relative aspect-[9/16] max-h-56 w-full bg-black/60 overflow-hidden flex items-center justify-center">
                          {clip.thumbnail_path ? (
                            <img src={getMediaUrl(clip.thumbnail_path)} alt={clip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="text-center p-4">
                              <Film className="w-8 h-8 text-gray-600 mx-auto mb-1" />
                              <span className="text-[10px] text-gray-500">Preview</span>
                            </div>
                          )}

                          {/* Viral Score Badge */}
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md gradient-brand text-white font-bold text-[10px] shadow-lg">
                            Score {clip.viral_score}
                          </div>

                          {/* Duration Badge */}
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white text-[10px] font-medium">
                            {Math.round(clip.duration)}s • {clip.export_resolution}
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-3.5 space-y-2">
                          <h5 className="font-bold text-white text-xs truncate" title={clip.title}>
                            {clip.title}
                          </h5>
                          {clip.hook && (
                            <p className="text-[11px] text-purple-300 truncate font-medium">
                              🔥 {clip.hook}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 border-t border-dark-border/40">
                            <span className="capitalize">{clip.framing_mode.replace('_', ' ')}</span>
                            <span className="capitalize">{clip.caption_style.replace('_', ' ')}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => onNavigate('editor', { clipId: clip.id, projectId: project.id })}
                              className="flex-1 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-dark-border"
                            >
                              <Sliders className="w-3 h-3 text-purple-400" />
                              <span>Edit</span>
                            </button>

                            {(clip.download_url || clip.rendered_file_path) && (
                              <a
                                href={getMediaUrl(clip.download_url || clip.rendered_file_path)}
                                download
                                className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                                title="Download 4K"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
