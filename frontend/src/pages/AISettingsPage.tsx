import React, { useEffect, useState } from 'react';
import { 
  Key, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  RefreshCw,
  Lock,
  Layers
} from 'lucide-react';
import { GeminiSettings } from '../types';
import { settingsService } from '../services/api';

export const AISettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<GeminiSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  
  // Test result state
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getGemini();
      setSettings(data);
      setSelectedModel(data.model || 'gemini-2.5-flash');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      await settingsService.updateGemini(apiKey, selectedModel);
      setApiKey(''); // Clear raw key input immediately after sending to backend
      setFeedback({ type: 'success', message: 'Gemini configuration securely updated!' });
      await loadSettings();
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.detail || 'Failed to update Gemini settings' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await settingsService.testGemini();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.response?.data?.detail || 'Failed to communicate with Google GenAI SDK'
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span>Loading AI Settings...</span>
      </div>
    );
  }

  const isConfigured = settings?.is_configured;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Cpu className="w-8 h-8 text-purple-400" />
          <span>Gemini AI Engine Settings</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure the official Google GenAI SDK to discover high-retention viral moments and hooks.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm border ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Security Notice Card */}
      <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white">Security & Secret Protection</h4>
          <p className="text-xs text-gray-300 leading-relaxed">
            Your Google AI Studio key is processed purely server-side via backend environment variables. 
            It is <strong>never exposed to client JavaScript</strong>, never stored in client cookies, 
            and <strong>never committed to GitHub</strong>.
          </p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="rounded-3xl glass-panel border border-dark-border p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-bold text-white text-base">Google AI Studio API Key</h3>
              <p className="text-xs text-gray-400">Official Google GenAI SDK Client</p>
            </div>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
            isConfigured 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isConfigured ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configured ({settings?.masked_key})</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Unconfigured</span>
              </>
            )}
          </span>
        </div>

        {/* Step-by-Step Guide */}
        <div className="p-4 rounded-xl bg-dark-800/80 border border-dark-border space-y-2 text-xs">
          <p className="font-bold text-gray-300">How to get your free Gemini API Key:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-400">
            <li>
              Visit Google AI Studio:{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-semibold underline"
              >
                https://aistudio.google.com/apikey <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Click <strong>"Create API key"</strong> and copy your key.</li>
            <li>Paste your key below and click <strong>"Save & Test Connection"</strong>.</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder={isConfigured ? '••••••••••••••••••••••••••••••••••••••••' : 'AIzaSy...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-dark-900 border border-dark-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 font-mono placeholder-gray-600"
              />
              <Lock className="w-4 h-4 text-gray-500 absolute right-4 top-3.5" />
            </div>
            {isConfigured && (
              <p className="text-[11px] text-gray-400 mt-1.5">
                Current active key: <span className="font-mono text-purple-400">{settings?.masked_key}</span>. Leave empty to keep existing key.
              </p>
            )}
          </div>

          {/* Model Selector */}
          <div>
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
              Gemini Model
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Recommended' },
                { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Fast' },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: 'Stable' },
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Deep Reasoning' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedModel === m.id
                      ? 'border-purple-500 bg-purple-600/15 text-white'
                      : 'border-dark-border bg-dark-900 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold">{m.name}</div>
                  <div className="text-[10px] text-purple-400 font-medium mt-0.5">{m.badge}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-purple-600/25 hover:opacity-95 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !isConfigured}
              className="px-5 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 text-gray-200 border border-dark-border font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting && <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />}
              <span>Test Gemini Connection</span>
            </button>
          </div>
        </form>

        {/* Live Test Results Card */}
        {testResult && (
          <div className={`p-5 rounded-2xl border text-sm space-y-2 animate-in fade-in duration-200 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-2">
                {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.success ? 'Gemini Connection Verified!' : 'Connection Check Failed'}
              </span>
              {testResult.latency_ms && (
                <span className="text-xs font-mono font-normal">
                  Latency: {testResult.latency_ms} ms
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed opacity-90">{testResult.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};
