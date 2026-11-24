import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Video, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Sliders, 
  Film, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { projectService } from '../services/api';
import { Project } from '../types';

interface CreateClipsProps {
  onNavigate: (page: string, params?: any) => void;
  onJobStarted?: (jobId: string) => void;
}

export const CreateClipsPage: React.FC<CreateClipsProps> = ({ onNavigate, onJobStarted }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // YouTube link state
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');
  const [youtubeInfo, setYoutubeInfo] = useState<any>(null);
  const [isValidatingYt, setIsValidatingYt] = useState<boolean>(false);
  
  // Settings & Prompts
  const [title, setTitle] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('Find the most engaging, high-retention viral moments with strong opening hooks.');
  const [targetClips, setTargetClips] = useState<number>(3);
  const [minDuration, setMinDuration] = useState<number>(30);
  const [maxDuration, setMaxDuration] = useState<number>(60);
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetPrompts = [
    { label: "😂 Funniest Moments", prompt: "Find the funniest, most hilarious moments and punchlines with comic timing." },
    { label: "🔥 Motivational / Alpha", prompt: "Find intense motivational, inspiring, and powerful life advice moments." },
    { label: "🧠 Educational / Mind-Blowing", prompt: "Find fascinating educational facts, mind-bending explanations, and high-retention trivia." },
    { label: "🎙️ Best Podcast Debates", prompt: "Find high-energy conversations, debates, and controversial opinions between speakers." },
    { label: "🇮🇳 Hindi Viral Shorts", prompt: "Identify the best Hindi dialogue moments with dramatic animated Devnagari typography hooks." }
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectFile = (file: File) => {
    setError(null);
    const validExtensions = ['.mp4', '.mov', '.mkv', '.webm'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError(`Unsupported file format. Please upload an MP4, MOV, MKV, or WEBM video.`);
      return;
    }
    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleValidateYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    try {
      setIsValidatingYt(true);
      setError(null);
      const res = await projectService.validateYoutube(youtubeUrl);
      if (res.valid) {
        setYoutubeInfo(res);
        if (!title && res.title) setTitle(res.title);
      } else {
        setError(res.message || 'Invalid YouTube URL');
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to inspect YouTube URL');
    } finally {
      setIsValidatingYt(false);
    }
  };

  const handleStartPipeline = async () => {
    try {
      setError(null);
      let project: Project;

      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Please select a video file to upload.');
          return;
        }
        setIsUploading(true);
        project = await projectService.uploadVideo(
          selectedFile,
          title || selectedFile.name,
          customPrompt,
          (pct) => setUploadProgress(pct)
        );
      } else {
        if (!youtubeUrl.trim()) {
          setError('Please enter a YouTube video URL.');
          return;
        }
        setIsUploading(true);
        project = await projectService.createFromYoutube(youtubeUrl, customPrompt);
      }

      // If YouTube project awaits actual file upload
      if (project.status === 'awaiting_media') {
        setIsUploading(false);
        setError(
          'YouTube metadata recognized! In compliance with video rights and high-res rendering, ' +
          'please upload the authorized video file to render 4K vertical clips.'
        );
        setActiveTab('upload');
        return;
      }

      // Start the Automatic AI Director Pipeline
      const processRes = await projectService.process(project.id);
      setIsUploading(false);

      if (onJobStarted && processRes.job_id) {
        onJobStarted(processRes.job_id);
      }

      onNavigate('projects');
    } catch (e: any) {
      setIsUploading(false);
      setError(e.response?.data?.detail || e.message || 'Failed to initialize AI Director pipeline');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-white">Create Viral Clips</h1>
        <p className="text-gray-400 text-sm">
          Upload your footage or paste a supported video link. The AI Director will find viral moments, 
          reframe horizontally into 9:16 vertical, generate subtitles, and render 4K video.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Tab Selector */}
      <div className="flex border-b border-dark-border">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'upload'
              ? 'border-purple-500 text-purple-300 bg-purple-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Direct Video Upload (MP4, MOV, MKV)</span>
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-all ${
            activeTab === 'youtube'
              ? 'border-purple-500 text-purple-300 bg-purple-500/5'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          <Video className="w-4 h-4 text-red-500" />
          <span>YouTube URL Import</span>
        </button>
      </div>

      {/* Main Input Box */}
      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
            selectedFile
              ? 'border-purple-500/60 bg-purple-950/10'
              : 'border-dark-border hover:border-purple-500/40 bg-dark-800/40 hover:bg-dark-800/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp4,.mov,.mkv,.webm"
            className="hidden"
            onChange={(e) => e.target.files && handleSelectFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-purple-500/20">
              <UploadCloud className="w-8 h-8 text-white" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-bold text-white text-base">{selectedFile.name}</p>
                <p className="text-xs text-purple-400 font-medium">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • Click or drag to change file
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="font-bold text-white text-base">Drag & Drop Video Here, or Click to Browse</p>
                <p className="text-xs text-gray-400">Supported: MP4, MOV, MKV, WEBM (Up to 1000 MB)</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-dark-800/60 border border-dark-border space-y-4">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Supported YouTube Video or Shorts URL
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="flex-1 bg-dark-900 border border-dark-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={handleValidateYoutube}
              disabled={isValidatingYt || !youtubeUrl}
              className="px-5 py-3 rounded-xl bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white font-medium text-sm border border-dark-border transition-colors flex items-center gap-2"
            >
              {isValidatingYt && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Inspect Link</span>
            </button>
          </div>

          {youtubeInfo && (
            <div className="p-4 rounded-xl bg-dark-900/80 border border-emerald-500/30 flex items-center gap-4">
              {youtubeInfo.thumbnail_url && (
                <img
                  src={youtubeInfo.thumbnail_url}
                  alt={youtubeInfo.title}
                  className="w-20 h-12 object-cover rounded-lg border border-dark-border flex-shrink-0"
                />
              )}
              <div className="truncate">
                <h4 className="text-sm font-bold text-white truncate">{youtubeInfo.title}</h4>
                <p className="text-xs text-gray-400">{youtubeInfo.author} • Verified Public Video</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Viral Focus Prompt */}
      <div className="p-6 rounded-2xl bg-dark-800/60 border border-dark-border space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Director Guidance / Focus Prompt</span>
          </label>
          <span className="text-[11px] text-gray-500">Gemini 2.5 Flash</span>
        </div>

        {/* Quick Prompt Presets */}
        <div className="flex flex-wrap gap-2">
          {presetPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setCustomPrompt(p.prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-dark-700/80 hover:bg-purple-600/20 hover:border-purple-500/40 border border-dark-border text-gray-300 hover:text-white transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Describe what kind of viral clips you want (e.g. funny jokes, intense debates, educational revelations)..."
          className="w-full bg-dark-900 border border-dark-border rounded-xl p-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Production Defaults */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-border space-y-1.5">
          <span className="text-xs text-gray-400 font-medium">Export Resolution</span>
          <p className="text-base font-bold text-white">4K (2160 × 3840)</p>
          <p className="text-[11px] text-purple-400">Lanczos High-Quality Scaling</p>
        </div>

        <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-border space-y-1.5">
          <span className="text-xs text-gray-400 font-medium">Target Clip Duration</span>
          <p className="text-base font-bold text-white">30 – 60 Seconds</p>
          <p className="text-[11px] text-emerald-400">Complete Thought Bounds</p>
        </div>

        <div className="p-4 rounded-xl bg-dark-800/50 border border-dark-border space-y-1.5">
          <span className="text-xs text-gray-400 font-medium">Smart Framing</span>
          <p className="text-base font-bold text-white">Speaker Auto-Track</p>
          <p className="text-[11px] text-blue-400">No Basic Center Cropping</p>
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-2">
        <button
          onClick={handleStartPipeline}
          disabled={isUploading}
          className="w-full py-4 rounded-2xl gradient-brand text-white font-bold text-base shadow-xl shadow-purple-600/30 hover:opacity-95 transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Uploading & Initializing Pipeline... ({uploadProgress}%)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Launch 1-Click AI Director</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
