import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Play, 
  Trash2, 
  Scissors, 
  Sparkles, 
  Film, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  X,
  Sliders
} from 'lucide-react';
import { Clip } from '../types';
import { clipService } from '../services/api';

interface ExportsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ExportsPage: React.FC<ExportsPageProps> = ({ onNavigate }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    try {
      setLoading(true);
      const data = await clipService.list();
      setClips(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clipId: number) => {
    if (!window.confirm('Delete this exported clip?')) return;
    try {
      await clipService.delete(clipId);
      setClips(clips.filter((c) => c.id !== clipId));
      if (previewClip?.id === clipId) setPreviewClip(null);
    } catch (e) {
      console.error(e);
    }
  };

  const completedClips = clips.filter((c) => c.status === 'completed' || c.download_url);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Exports & Downloads</h1>
          <p className="text-gray-400 text-sm">Download your rendered 4K vertical viral shorts.</p>
        </div>
        <button
          onClick={loadExports}
          className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-border transition-colors flex items-center gap-2 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading exports...</span>
        </div>
      ) : completedClips.length === 0 ? (
        <div className="py-24 text-center rounded-3xl glass-panel border border-dark-border space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto text-purple-400">
            <Download className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Exports Yet</h3>
            <p className="text-gray-400 text-sm max-w-sm mx-auto mt-1">
              Run the AI Director on any video to produce high-retention 4K shorts ready for download.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedClips.map((clip) => (
            <div
              key={clip.id}
              className="rounded-2xl bg-dark-800/80 border border-dark-border overflow-hidden hover:border-purple-500/40 transition-all flex flex-col justify-between group shadow-xl"
            >
              {/* Vertical Thumbnail */}
              <div
                onClick={() => setPreviewClip(clip)}
                className="relative aspect-[9/16] max-h-72 w-full bg-black cursor-pointer overflow-hidden flex items-center justify-center"
              >
                {clip.thumbnail_path ? (
                  <img
                    src={clip.thumbnail_path}
                    alt={clip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <Film className="w-10 h-10 text-gray-600" />
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white shadow-xl">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg gradient-brand text-white font-extrabold text-xs shadow-lg">
                  Score {clip.viral_score}
                </div>

                <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold">
                  {Math.round(clip.duration)}s • {clip.export_resolution}
                </div>
              </div>

              {/* Clip Information */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-bold text-white text-sm truncate" title={clip.title}>
                    {clip.title}
                  </h3>
                  {clip.hook && (
                    <p className="text-xs text-purple-300 font-medium truncate mt-0.5">
                      🔥 {clip.hook}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-dark-border">
                  <span className="capitalize">{clip.framing_mode.replace('_', ' ')}</span>
                  <span>{clip.file_size_bytes ? `${(clip.file_size_bytes / (1024 * 1024)).toFixed(1)} MB` : '4K MP4'}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={clip.download_url}
                    download
                    className="flex-1 py-2 rounded-xl gradient-brand text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 hover:opacity-95 transition-opacity"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download 4K</span>
                  </a>

                  <button
                    onClick={() => onNavigate('editor', { clipId: clip.id, projectId: clip.project_id })}
                    className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 text-gray-200 border border-dark-border transition-colors"
                    title="Edit Clip"
                  >
                    <Sliders className="w-4 h-4 text-purple-400" />
                  </button>

                  <button
                    onClick={() => handleDelete(clip.id)}
                    className="p-2 rounded-xl bg-dark-700 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-dark-border transition-colors"
                    title="Delete Clip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-dark-900 border border-dark-border rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm truncate pr-2">{previewClip.title}</h4>
              <button
                onClick={() => setPreviewClip(null)}
                className="p-1 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                src={previewClip.download_url}
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400">
                {previewClip.export_resolution} • {Math.round(previewClip.duration)}s
              </span>
              <a
                href={previewClip.download_url}
                download
                className="px-4 py-2 rounded-xl gradient-brand text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
