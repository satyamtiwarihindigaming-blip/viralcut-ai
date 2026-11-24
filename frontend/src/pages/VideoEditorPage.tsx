import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Scissors, 
  Download, 
  Sparkles, 
  Sliders, 
  Layers, 
  Type, 
  Eye, 
  Check, 
  RefreshCw, 
  Save, 
  AlertCircle,
  Clock,
  Video
} from 'lucide-react';
import { Clip, Project } from '../types';
import { clipService, projectService } from '../services/api';

interface VideoEditorProps {
  clipId?: number;
  projectId?: number;
  onNavigate: (page: string, params?: any) => void;
}

export const VideoEditorPage: React.FC<VideoEditorProps> = ({ clipId, projectId, onNavigate }) => {
  const [clips, setClips] = useState<Clip[]>([]);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  // Video player state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Editable Clip Fields
  const [title, setTitle] = useState('');
  const [hook, setHook] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(30);
  const [framingMode, setFramingMode] = useState('speaker_tracking');
  const [captionStyle, setCaptionStyle] = useState('bold_viral');
  const [exportRes, setExportRes] = useState('4K');
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'framing' | 'captions' | 'export'>('framing');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadEditorData();
  }, [clipId, projectId]);

  const loadEditorData = async () => {
    try {
      setLoading(true);
      if (projectId) {
        const projData = await projectService.get(projectId);
        setProject(projData);
        if (projData.clips && projData.clips.length > 0) {
          setClips(projData.clips);
          const target = clipId 
            ? projData.clips.find(c => c.id === clipId) || projData.clips[0] 
            : projData.clips[0];
          selectClipForEditing(target);
        }
      } else {
        const allClips = await clipService.list();
        setClips(allClips);
        if (allClips.length > 0) {
          const target = clipId 
            ? allClips.find(c => c.id === clipId) || allClips[0] 
            : allClips[0];
          selectClipForEditing(target);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectClipForEditing = (clip: Clip) => {
    setSelectedClip(clip);
    setTitle(clip.title);
    setHook(clip.hook || '');
    setStartTime(clip.start_time);
    setEndTime(clip.end_time);
    setFramingMode(clip.framing_mode || 'speaker_tracking');
    setCaptionStyle(clip.caption_style || 'bold_viral');
    setExportRes(clip.export_resolution || '4K');
    setSubtitles(clip.subtitles || []);
    setCurrentTime(clip.start_time);

    if (videoRef.current) {
      videoRef.current.currentTime = clip.start_time;
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    if (time >= endTime) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSaveDraft = async () => {
    if (!selectedClip) return;
    try {
      setIsSaving(true);
      const updated = await clipService.update(selectedClip.id, {
        title,
        hook,
        start_time: startTime,
        end_time: endTime,
        framing_mode: framingMode,
        caption_style: captionStyle,
        export_resolution: exportRes,
        subtitles,
      });
      setSelectedClip(updated);
      setStatusMessage('Changes saved to clip record!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReRender = async () => {
    if (!selectedClip) return;
    try {
      setIsRendering(true);
      await handleSaveDraft();
      await clipService.rerender(selectedClip.id, {
        export_resolution: exportRes,
        export_codec: 'libx264',
        crf: 18
      });
      setStatusMessage('Re-rendering started in background! Check Exports tab when done.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to initiate re-render');
    } finally {
      setIsRendering(false);
    }
  };

  // Framing Modes metadata
  const framingModes = [
    { id: 'speaker_tracking', name: 'Smart Speaker Track', desc: 'Smoothly follows the speaker’s face horizontal position' },
    { id: 'split_screen', name: '2-Person Split Screen', desc: 'Dual stacked view: top speaker & bottom speaker (podcasts)' },
    { id: 'stacked_screen', name: '3-Person Stacked', desc: 'Reaction or multi-guest 3-panel vertical composition' },
    { id: 'blurred_bg', name: 'Blurred Background', desc: 'Preserves full landscape 16:9 context with stylized blur padding' },
    { id: 'dynamic_tracking', name: 'Dynamic Motion Track', desc: 'Follows rapid motion focal points and action' },
    { id: 'context_aware', name: 'Context Wide Crop', desc: 'Wider composition ensuring gestures & text stay visible' }
  ];

  const captionStyles = [
    { id: 'bold_viral', name: '🔥 Bold Viral', desc: 'Thick black outline, vibrant yellow active word glow' },
    { id: 'karaoke', name: '🎤 Neon Karaoke', desc: 'Bouncing word-by-word neon green highlights' },
    { id: 'minimal', name: '✨ Minimal White', desc: 'Clean modern typography with subtle drop shadow' },
    { id: 'podcast', name: '🎙️ Clean Podcast', desc: 'Soft cyan accents with elegant rounded typography' },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading Video Editor...</span>
      </div>
    );
  }

  if (!selectedClip) {
    return (
      <div className="py-24 text-center rounded-3xl glass-panel border border-dark-border space-y-4">
        <Sliders className="w-12 h-12 text-purple-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">No Clips Available</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Upload a video or generate clips first to open the Video Editor.
        </p>
        <button
          onClick={() => onNavigate('create')}
          className="px-6 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold"
        >
          Create Clips
        </button>
      </div>
    );
  }

  const videoSourceUrl = selectedClip.download_url || (project?.file_path ? `/storage/${project.file_path.replace(/\\/g, '/')}` : '');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('projects')}
            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-white border border-dark-border transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="text-xs px-2 py-0.5 rounded-md gradient-brand text-white font-bold">
                {exportRes}
              </span>
            </h1>
            <p className="text-xs text-gray-400">
              Score: <span className="text-purple-400 font-bold">{selectedClip.viral_score}</span> • Duration: {Math.round(endTime - startTime)}s • Framing: {framingMode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {statusMessage && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              {statusMessage}
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-200 border border-dark-border text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4 text-purple-400" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            onClick={handleReRender}
            disabled={isRendering}
            className="px-5 py-2 rounded-xl gradient-brand text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:opacity-95 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isRendering ? 'Rendering...' : 'Render 4K Vertical'}</span>
          </button>

          {selectedClip.download_url && (
            <a
              href={selectedClip.download_url}
              download
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-purple-400 border border-dark-border transition-colors"
              title="Download Rendered MP4"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Video Player & Timeline */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl bg-black border border-dark-border p-4 shadow-2xl relative flex flex-col items-center justify-center">
            {/* 9:16 Aspect Ratio Frame */}
            <div className="relative aspect-[9/16] w-full max-w-[340px] rounded-2xl overflow-hidden bg-dark-900 border border-dark-border/80 flex items-center justify-center">
              {videoSourceUrl ? (
                <video
                  ref={videoRef}
                  src={videoSourceUrl}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                />
              ) : (
                <div className="p-6 text-center text-gray-500 text-xs">
                  Video source preview loading...
                </div>
              )}

              {/* Subtitle / Hook Overlay Preview */}
              {hook && (
                <div className="absolute top-8 left-4 right-4 pointer-events-none">
                  <div className="bg-black/75 backdrop-blur-md border border-purple-500/40 rounded-xl p-2.5 text-center shadow-2xl">
                    <span className="text-yellow-400 font-extrabold text-xs tracking-wide">
                      🔥 {hook.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Subtitle Preview Overlay */}
              <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-extrabold shadow-2xl ${
                  captionStyle === 'bold_viral' 
                    ? 'bg-black/80 text-yellow-300 border border-yellow-400/50' 
                    : captionStyle === 'karaoke'
                    ? 'bg-dark-900/90 text-emerald-400 border border-emerald-400/50'
                    : 'bg-black/60 text-white'
                }`}>
                  {subtitles.length > 0 ? subtitles[0].text : 'VIRAL CAPTIONS ACTIVE'}
                </span>
              </div>
            </div>

            {/* Player Controls Bar */}
            <div className="w-full mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{currentTime.toFixed(1)}s</span>
                <span className="font-medium text-white">{Math.round(endTime - startTime)}s Selected</span>
                <span>{videoDuration ? `${videoDuration.toFixed(1)}s` : '0.0s'}</span>
              </div>

              {/* Seek Slider */}
              <input
                type="range"
                min={0}
                max={videoDuration || 100}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-dark-700 h-1.5 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={() => handleSeek(startTime)}
                  className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 transition-colors"
                  title="Jump to Start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-3.5 rounded-2xl gradient-brand text-white shadow-lg shadow-purple-600/30 hover:opacity-95 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings, Framing, Subtitles & Specs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Clip Selector Tabs (if project has multiple clips) */}
          {clips.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {clips.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => selectClipForEditing(c)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
                    selectedClip.id === c.id
                      ? 'gradient-brand text-white shadow-md shadow-purple-500/20'
                      : 'bg-dark-800 text-gray-400 hover:text-white border border-dark-border'
                  }`}
                >
                  <span>Clip #{idx + 1}</span>
                  <span className="text-[10px] opacity-80">({c.viral_score}★)</span>
                </button>
              ))}
            </div>
          )}

          {/* Basic Info Editor */}
          <div className="p-5 rounded-2xl bg-dark-800/60 border border-dark-border space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Clip Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-dark-900 border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Opening Attention Hook (First 3 Seconds)
              </label>
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                placeholder="e.g. Wait until you hear this..."
                className="w-full bg-dark-900 border border-dark-border rounded-xl px-3.5 py-2 text-sm text-yellow-300 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Start and End Trimming Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">Start Time (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-dark-900 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">End Time (sec)</label>
                <input
                  type="number"
                  step="0.5"
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 30)}
                  className="w-full bg-dark-900 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Editor Module Tabs */}
          <div className="flex border-b border-dark-border">
            <button
              onClick={() => setActiveTab('framing')}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'framing'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Smart Reframing (9:16)</span>
            </button>

            <button
              onClick={() => setActiveTab('captions')}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'captions'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Captions & Subtitles</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-5 py-2.5 border-b-2 text-xs font-bold transition-all ${
                activeTab === 'export'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>4K Export Specs</span>
            </button>
          </div>

          {/* Module 1: Smart Reframing Layouts */}
          {activeTab === 'framing' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Choose the intelligent composition layout. No simple center cropping is used.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {framingModes.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setFramingMode(m.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      framingMode === m.id
                        ? 'border-purple-500 bg-purple-950/20 shadow-md shadow-purple-500/10'
                        : 'border-dark-border bg-dark-800/60 hover:bg-dark-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white">{m.name}</span>
                      {framingMode === m.id && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 2: Captions & Subtitles */}
          {activeTab === 'captions' && (
            <div className="space-y-4">
              {/* Style Presets */}
              <div className="grid grid-cols-2 gap-2.5">
                {captionStyles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCaptionStyle(s.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      captionStyle === s.id
                        ? 'border-purple-500 bg-purple-950/20'
                        : 'border-dark-border bg-dark-800/60 hover:bg-dark-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-white">{s.name}</span>
                      {captionStyle === s.id && <Check className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-[10px] text-gray-400">{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Subtitle Words List Editor */}
              <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Subtitle Cards ({subtitles.length})</span>
                  <span className="text-[10px] text-gray-400">Word-level Faster-Whisper Timestamps</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {subtitles.map((card, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-dark-900 border border-dark-border/60 flex items-center gap-3">
                      <span className="text-[10px] font-mono text-purple-400 flex-shrink-0">
                        {card.start.toFixed(1)}s - {card.end.toFixed(1)}s
                      </span>
                      <input
                        type="text"
                        value={card.text}
                        onChange={(e) => {
                          const updated = [...subtitles];
                          updated[idx].text = e.target.value;
                          setSubtitles(updated);
                        }}
                        className="flex-1 bg-transparent text-xs text-gray-200 focus:outline-none focus:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Module 3: 4K Export Specs */}
          {activeTab === 'export' && (
            <div className="p-5 rounded-2xl bg-dark-800/60 border border-dark-border space-y-4">
              <div>
                <label className="text-xs font-bold text-white block mb-2">Export Resolution (9:16 Vertical)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['4K', '1440p', '1080p', '720p'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setExportRes(res)}
                      className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        exportRes === res
                          ? 'border-purple-500 bg-purple-600/20 text-purple-300'
                          : 'border-dark-border bg-dark-900 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div>{res}</div>
                      <div className="text-[9px] font-normal text-gray-400">
                        {res === '4K' ? '2160×3840' : res === '1440p' ? '1440×2560' : res === '1080p' ? '1080×1920' : '720×1280'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dark-border/60 text-xs">
                <div>
                  <span className="text-gray-400">Video Codec:</span>
                  <p className="font-semibold text-white mt-0.5">H.264 (libx264 high-profile)</p>
                </div>
                <div>
                  <span className="text-gray-400">Audio:</span>
                  <p className="font-semibold text-white mt-0.5">AAC 192kbps 48kHz Stereo</p>
                </div>
                <div>
                  <span className="text-gray-400">CRF Quality:</span>
                  <p className="font-semibold text-emerald-400 mt-0.5">18 (Visually Lossless)</p>
                </div>
                <div>
                  <span className="text-gray-400">Scaler:</span>
                  <p className="font-semibold text-purple-400 mt-0.5">Lanczos High-Precision</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
