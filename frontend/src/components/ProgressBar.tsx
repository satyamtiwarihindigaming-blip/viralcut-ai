import React from 'react';
import { Loader2, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProcessingJob } from '../types';

interface ProgressBarProps {
  job: ProcessingJob | null;
  onCancel?: (jobId: string) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ job, onCancel }) => {
  if (!job) return null;

  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';
  const isCancelled = job.status === 'cancelled';
  const isRunning = job.status === 'running' || job.status === 'pending';

  return (
    <div className="p-4 rounded-2xl glass-panel border border-purple-500/30 shadow-xl shadow-purple-900/10 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          {isRunning && <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />}
          {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isFailed && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {isCancelled && <XCircle className="w-5 h-5 text-amber-400" />}
          
          <div>
            <h4 className="text-sm font-semibold text-white">
              {job.current_step || 'AI Director Pipeline Active'}
            </h4>
            <p className="text-xs text-gray-400">
              {isRunning && 'AI analyzing scenes, tracking speakers and rendering 4K vertical clips...'}
              {isCompleted && 'All clips generated and ready for export!'}
              {isFailed && (job.error_message || 'Processing failed. You can retry from project view.')}
              {isCancelled && 'Pipeline stopped by user.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-gradient">{Math.round(job.progress)}%</span>
          {isRunning && onCancel && (
            <button
              onClick={() => onCancel(job.id)}
              className="text-xs text-gray-400 hover:text-rose-400 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-border transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-dark-800 h-2 rounded-full overflow-hidden border border-dark-border/50">
        <div
          className={`h-full transition-all duration-500 ${
            isFailed ? 'bg-rose-500' : isCompleted ? 'bg-emerald-500' : 'gradient-brand'
          }`}
          style={{ width: `${Math.max(3, Math.min(100, job.progress))}%` }}
        />
      </div>
    </div>
  );
};
