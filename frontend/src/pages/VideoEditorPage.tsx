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
  Video,
  Flame,
  Zap,
  Activity,
  Maximize2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { Clip, Project, FramingMode, CaptionStyle } from '../types';
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
  const [framingMode, setFramingMode] = useState<FramingMode>('three_zone_motion');
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>('karaoke');
  const [exportRes, setExportRes] = useState('4K');
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'layout' | 'kinetic' | 'subtitles' | 'export'>('layout');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Three-Zone Customization
  const [topZoneMargin, setTopZoneMargin] = useState(280);
  const [bottomZoneMargin, setBottomZoneMargin] = useState(240);
  const [preserveFullFrame, setPreserveFullFrame] = useState(true);

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
    // Default to three_zone_motion if unset
    const defaultMode = (clip.framing_mode as FramingMode) || 'three_zone_motion';
    setFramingMode(defaultMode);
    setPreserveFullFrame(defaultMode === 'three_zone_motion' || defaultMode === 'full_frame_blurred');
    setCaptionStyle((clip.caption_style as CaptionStyle) || 'karaoke');
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
      const effectiveMode = preserveFullFrame ? 'three_zone_motion' : framingMode;
      const updated = await clipService.update(selectedClip.id, {
        title,
        hook,
        start_time: startTime,
        end_time: endTime,
        framing_mode: effectiveMode,
        caption_style: captionStyle,
        export_resolution: exportRes,
        subtitles,
      });
      setSelectedClip(updated);
      setStatusMessage('✓ Saved to clip record!');
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
      setStatusMessage('🚀 4K Motion Reel re-rendering started! Check Exports tab when done.');
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (e: any) {
      alert(e.response?.data?.detail || 'Failed to initiate re-render');
    } finally {
      setIsRendering(false);
    }
  };

  // 3-Zone Framing Modes
  const framingModes: { id: FramingMode; name: string; desc: string; badge: string }[] = [
    { 
      id: 'three_zone_motion', 
      name: 'Three-Zone Motion Reel', 
      desc: 'Top hook banner + 100% full original middle frame (no crop) + bottom kinetic subtitles & waveform', 
      badge: 'RECOMMENDED' 
    },
    { 
      id: 'full_frame_blurred', 
      name: 'Full Frame with Blur Background', 
      desc: 'Preserves complete original frame with soft blurred duplicate padding', 
      badge: 'POPULAR' 
    },
    { 
      id: 'speaker_tracking', 
      name: 'Smart Speaker Tracking', 
      desc: 'Intelligent face follow moving with the active speaker across 9:16 vertical crop', 
      badge: 'PORTRAIT' 
    },
    { 
      id: 'split_screen', 
      name: '2-Person Split Screen', 
      desc: 'Top speaker & bottom speaker stacked for interviews, podcasts and debates', 
      badge: 'PODCAST' 
    },
    { 
      id: 'stacked_screen', 
      name: '3-Person Stacked', 
      desc: '3-panel stacked vertical composition for reaction videos and panel discussions', 
      badge: 'MULTI' 
    },
    { 
      id: 'manual', 
      name: 'Custom User Framing', 
      desc: 'Manually specify focal center crop coordinates', 
      badge: 'CUSTOM' 
    }
  ];

  // 8 Trending Kinetic Caption Styles
  const captionStyles: { id: CaptionStyle; name: string; desc: string; preview: string; color: string }[] = [
    { 
      id: 'karaoke', 
      name: 'Karaoke Highlight', 
      desc: 'Word-by-word active highlight with smooth scale bounce & vibrant yellow glow',
      preview: 'THE SECRET TO GOING VIRAL',
      color: 'from-amber-400 to-yellow-500'
    },
    { 
      id: 'word_pop', 
      name: 'Word Pop', 
      desc: 'Active word pops forward with dynamic zoom emphasis and gold stroke',
      preview: 'EVERY WORD POPS FORWARD',
      color: 'from-yellow-400 to-orange-500'
    },
    { 
      id: 'bouncing', 
      name: 'Bouncing Active Word', 
      desc: 'Energetic bounce on each spoken word in neon electric green',
      preview: 'BOUNCING ACTIVE HIGHLIGHT',
      color: 'from-emerald-400 to-green-500'
    },
    { 
      id: 'bold_podcast', 
      name: 'Bold Podcast Captions', 
      desc: 'High-contrast bold viral typography with deep black outline and boxed backing',
      preview: 'BOLD PODCAST INTERVIEW',
      color: 'from-amber-300 to-yellow-400'
    },
    { 
      id: 'neon_glow', 
      name: 'Cyber Neon Glow', 
      desc: 'Vibrant cyan & magenta neon halo glow around active words',
      preview: 'CYBER NEON GLOW VIBE',
      color: 'from-cyan-400 to-fuchsia-500'
    },
    { 
      id: 'minimal_clean', 
      name: 'Minimal Clean', 
      desc: 'Understated, modern white sans-serif with soft shadow for documentary reels',
      preview: 'clean minimalist subtitles',
      color: 'from-slate-200 to-gray-400'
    },
    { 
      id: 'keyword_highlight', 
      name: 'Keyword Highlight', 
      desc: 'Automatically identifies & triggers high-emotion power keywords in bold coral/red',
      preview: 'POWER WORDS ARE EMPHASIZED',
      color: 'from-rose-500 to-red-600'
    },
    { 
      id: 'premium_social', 
      name: 'Premium Social Style', 
      desc: 'Hormozi / MrBeast style bold social media typography with dynamic color shifts',
      preview: 'PRO SOCIAL MEDIA VIRAL',
      color: 'from-purple-400 to-pink-500'
    }
  ];

  // Active word calculation for real-time kinetic preview
  const getActiveSubtitle = () => {
    const relTime = currentTime - startTime;
    return subtitles.find(s => relTime >= s.start && relTime <= s.end);
  };
  const activeSub = getActiveSubtitle();

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading 3-Zone Motion Reels Editor...</span>
      </div>
    );
  }

  if (!selectedClip) {
    return (
      <div className="py-24 text-center space-y-4">
        <Video className="w-12 h-12 text-gray-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">No Clips Found</h2>
        <p className="text-sm text-gray-400">Create a new clip from YouTube or file upload first.</p>
        <button 
          onClick={() => onNavigate('create')} 
          className="btn-primary inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Create Clips
        </button>
      </div>
    );
  }

  const videoSourceUrl = selectedClip.download_url || (selectedClip.rendered_file_path ? `/storage/${selectedClip.rendered_file_path.replace(/\\/g, '/').replace(/^storage\//, '')}` : '');

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Three-Zone Motion Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-dark-800 text-gray-400 border border-dark-border">
              9:16 Vertical
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            {title || selectedClip.title}
          </h1>
          <p className="text-xs text-gray-400">
            Score: <span className="font-bold text-amber-400">{selectedClip.viral_score}★</span> • Duration: {selectedClip.duration}s • Full-Frame Preserved
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {statusMessage && (
            <div className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold animate-pulse">
              {statusMessage}
            </div>
          )}

          <button 
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="btn-secondary text-xs flex items-center gap-1.5 px-3.5 py-2"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          <button 
            onClick={handleReRender}
            disabled={isRendering}
            className="btn-primary text-xs flex items-center gap-1.5 px-4 py-2 shadow-lg shadow-purple-600/30"
          >
            {isRendering ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Render 4K Vertical
          </button>

          {selectedClip.download_url && (
            <a 
              href={selectedClip.download_url} 
              download 
              className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-300 border border-dark-border"
              title="Download Current MP4"
            >
              <Download className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Main Grid: 9:16 Live Three-Zone Preview Player & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: 9:16 Three-Zone Vertical Canvas Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] md:max-w-[360px] aspect-[9/16] rounded-3xl overflow-hidden glass-panel border-2 border-purple-500/30 shadow-2xl relative flex flex-col justify-between bg-black select-none">
            
            {/* Top Animated Progress Indicator Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-dark-800 z-30 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
                style={{ 
                  width: `${Math.min(100, Math.max(0, ((currentTime - startTime) / Math.max(1, endTime - startTime)) * 100))}%` 
                }}
              />
            </div>

            {/* 1. TOP ZONE: Hook Card & Category Pill */}
            <div className="relative z-20 pt-5 px-4 text-center space-y-2 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-purple-300 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {selectedClip.category || 'VIRAL REEL'}
              </div>
              
              {hook && (
                <div className="p-2.5 rounded-2xl bg-black/75 backdrop-blur-md border border-yellow-500/30 shadow-xl shadow-black/80">
                  <p className="text-xs md:text-sm font-black text-yellow-300 leading-snug tracking-tight uppercase flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 animate-bounce" />
                    <span>{hook}</span>
                  </p>
                </div>
              )}
            </div>

            {/* 2. MIDDLE ZONE: Complete Original Frame (Fit-Contain) */}
            <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden my-auto w-full">
              {/* Blurred Duplicate Background fill */}
              {preserveFullFrame && videoSourceUrl && (
                <video 
                  src={videoSourceUrl}
                  className="absolute inset-0 w-full h-full object-cover scale-150 blur-xl opacity-45 pointer-events-none"
                  muted
                  playsInline
                />
              )}

              {/* Main Video Player */}
              {videoSourceUrl ? (
                <video 
                  ref={videoRef}
                  src={videoSourceUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  onClick={handlePlayPause}
                  className={`relative z-10 w-full ${preserveFullFrame ? 'max-h-[60%] object-contain rounded-lg shadow-2xl border border-white/10' : 'h-full object-cover'} cursor-pointer`}
                  playsInline
                />
              ) : (
                <div className="p-8 text-center text-gray-500 space-y-2">
                  <Video className="w-8 h-8 mx-auto text-purple-400 animate-pulse" />
                  <p className="text-xs">Processing Video Stream...</p>
                </div>
              )}

              {/* Play Overlay Button */}
              {!isPlaying && videoSourceUrl && (
                <button 
                  onClick={handlePlayPause}
                  className="absolute z-20 w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                >
                  <Play className="w-6 h-6 ml-1" />
                </button>
              )}
            </div>

            {/* 3. BOTTOM ZONE: Kinetic Word-by-Word Subtitles & Audio Waveform */}
            <div className="relative z-20 pb-5 px-4 text-center space-y-3 pointer-events-none">
              {/* Dynamic Subtitle Display */}
              <div className="min-h-[50px] flex items-center justify-center">
                {activeSub ? (
                  <div className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 max-w-[95%] mx-auto">
                    <p className="text-xs md:text-sm font-black tracking-tight leading-snug">
                      {activeSub.words && activeSub.words.length > 0 ? (
                        activeSub.words.map((w: any, idx: number) => {
                          const relT = currentTime - startTime;
                          const isWordActive = relT >= w.start && relT <= w.end;
                          return (
                            <span 
                              key={idx}
                              className={`inline-block mx-0.5 transition-all duration-100 ${
                                isWordActive 
                                  ? 'text-yellow-400 scale-110 drop-shadow-[0_2px_10px_rgba(250,204,21,0.8)] font-black' 
                                  : 'text-white opacity-90'
                              }`}
                            >
                              {w.word}{' '}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-yellow-300 font-extrabold uppercase">
                          {activeSub.text}
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 italic">
                    [Captions Active During Speech]
                  </div>
                )}
              </div>

              {/* Audio Waveform Indicator */}
              <div className="flex items-center justify-center gap-0.5 text-purple-400 text-xs tracking-widest opacity-80">
                <span className="animate-pulse"> ▂ ▃ ▄ ▅ ▆ ▇ █ ▇ ▆ ▅ ▄ ▃ ▂ </span>
              </div>
            </div>

          </div>

          {/* Player Seek & Trim Bar */}
          <div className="w-full max-w-[360px] mt-4 space-y-2 glass-panel p-3 rounded-2xl border border-dark-border">
            <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>{(currentTime - startTime).toFixed(1)}s</span>
              <span className="text-purple-400 font-bold">{((currentTime - startTime) / Math.max(1, endTime - startTime) * 100).toFixed(0)}%</span>
              <span>{(endTime - startTime).toFixed(1)}s</span>
            </div>

            <input 
              type="range"
              min={startTime}
              max={endTime}
              step="0.1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <button 
                onClick={() => handleSeek(startTime)}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Start
              </button>
              <button 
                onClick={handlePlayPause}
                className="px-3 py-1 rounded-lg bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 text-xs font-bold flex items-center gap-1"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <span className="text-[10px] text-gray-400 font-mono">
                {exportRes} Vertical
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Studio Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Editor Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-dark-border pb-3 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('layout')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'layout' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Three-Zone Layout
            </button>

            <button 
              onClick={() => setActiveTab('kinetic')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'kinetic' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Kinetic Captions
            </button>

            <button 
              onClick={() => setActiveTab('subtitles')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'subtitles' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Subtitles List ({subtitles.length})
            </button>

            <button 
              onClick={() => setActiveTab('export')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'export' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Export & Quality
            </button>
          </div>

          {/* TAB 1: THREE-ZONE LAYOUT & FULL-FRAME CONTROLS */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              
              {/* Full Frame Guarantee Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Full-Frame Video Preservation</h3>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Preserves 100% of the original video without cropping speakers, faces or gameplay. Unused vertical space is filled with intelligent blurred duplicate background.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !preserveFullFrame;
                    setPreserveFullFrame(next);
                    if (next) setFramingMode('three_zone_motion');
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                    preserveFullFrame ? 'bg-purple-600' : 'bg-dark-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    preserveFullFrame ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Title & Hook Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Clip Title
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-border rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    placeholder="Short catchy title..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                    <Flame className="w-3 h-3 text-yellow-400" />
                    Opening Hook (First 3-4 Seconds)
                  </label>
                  <input 
                    type="text" 
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    className="w-full bg-dark-900 border border-dark-border rounded-xl px-3.5 py-2 text-sm text-yellow-300 font-bold focus:outline-none focus:border-purple-500"
                    placeholder="Attention grabbing hook..."
                  />
                </div>
              </div>

              {/* Trim Duration Controls */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-dark-900 border border-dark-border">
                <div className="space-y-1">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">Start Time (sec)</span>
                  <input 
                    type="number"
                    step="0.5"
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                    className="w-full bg-dark-800 border border-dark-border rounded-xl px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-gray-400 font-bold uppercase">End Time (sec)</span>
                  <input 
                    type="number"
                    step="0.5"
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value) || 30)}
                    className="w-full bg-dark-800 border border-dark-border rounded-xl px-3 py-1.5 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Layout Mode Selection Cards */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Select Vertical Composition Layout
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {framingModes.map((mode) => (
                    <div 
                      key={mode.id}
                      onClick={() => {
                        setFramingMode(mode.id);
                        setPreserveFullFrame(mode.id === 'three_zone_motion' || mode.id === 'full_frame_blurred');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        framingMode === mode.id 
                          ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-500/10' 
                          : 'bg-dark-900/60 border-dark-border hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{mode.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-dark-800 text-purple-300 border border-purple-500/20">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{mode.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: KINETIC CAPTIONS ENGINE (8 STYLES) */}
          {activeTab === 'kinetic' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-border space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Kinetic Word-Level Animation Engine
                  </h3>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Hindi & English Supported
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Every spoken word is synchronized with word-level audio timestamps. Select an animation preset below:
                </p>
              </div>

              {/* 8 Preset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {captionStyles.map((style) => (
                  <div 
                    key={style.id}
                    onClick={() => setCaptionStyle(style.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      captionStyle === style.id 
                        ? 'bg-purple-600/15 border-purple-500 ring-2 ring-purple-500/30 shadow-lg' 
                        : 'bg-dark-900 border-dark-border hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{style.name}</span>
                        {captionStyle === style.id && (
                          <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{style.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-dark-border/60">
                      <div className="px-2.5 py-1.5 rounded-lg bg-black/60 text-center font-black tracking-tight text-xs uppercase">
                        <span className={`bg-gradient-to-r ${style.color} bg-clip-text text-transparent`}>
                          {style.preview}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SUBTITLE WORDS EDITOR */}
          {activeTab === 'subtitles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{subtitles.length} Spoken Sentences Detected</span>
                <span className="font-mono text-purple-400">Click any card to jump</span>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {subtitles.map((card, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSeek(startTime + card.start)}
                    className="p-3.5 rounded-2xl bg-dark-900 border border-dark-border hover:border-purple-500/50 cursor-pointer space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                      <span className="px-1.5 py-0.5 rounded bg-dark-800 text-purple-300 font-bold">
                        #{idx + 1}
                      </span>
                      <span>
                        {card.start.toFixed(2)}s ➔ {card.end.toFixed(2)}s
                      </span>
                    </div>

                    <input 
                      type="text" 
                      value={card.text}
                      onChange={(e) => {
                        const copy = [...subtitles];
                        copy[idx].text = e.target.value;
                        setSubtitles(copy);
                      }}
                      className="w-full bg-dark-800 border border-dark-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />

                    {card.words && card.words.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {card.words.map((w: any, widx: number) => (
                          <span 
                            key={widx}
                            className="px-1.5 py-0.5 rounded bg-dark-800 text-[10px] text-gray-300 border border-dark-border"
                          >
                            {w.word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT & QUALITY SETTINGS */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-border space-y-3">
                <h3 className="text-sm font-bold text-white">4K Video Export Profile</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {['720p', '1080p', '1440p', '4K'].map((res) => (
                    <button
                      key={res}
                      onClick={() => setExportRes(res)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        exportRes === res 
                          ? 'bg-purple-600 text-white border-purple-500 shadow-md font-black' 
                          : 'bg-dark-800 text-gray-300 border-dark-border hover:bg-dark-700'
                      }`}
                    >
                      <div className="text-xs">{res}</div>
                      <div className="text-[9px] opacity-75">{res === '4K' ? '2160x3840' : res === '1080p' ? '1080x1920' : '9:16'}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-900 border border-dark-border space-y-3">
                <h3 className="text-sm font-bold text-white">Encoding Specifications</h3>
                <div className="text-xs text-gray-400 space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-dark-border">
                    <span>Video Codec</span>
                    <span className="font-mono text-white">H.264 (libx264)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border">
                    <span>Scaling Engine</span>
                    <span className="font-mono text-purple-300">Lanczos 4K Filter</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-dark-border">
                    <span>Audio Profile</span>
                    <span className="font-mono text-white">AAC 48kHz Stereo 192kbps</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Subtitles Standard</span>
                    <span className="font-mono text-yellow-400">Burned ASS v4.00+ Kinetic</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleReRender}
                disabled={isRendering}
                className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/25"
              >
                {isRendering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Render Final {exportRes} Vertical Reel
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
