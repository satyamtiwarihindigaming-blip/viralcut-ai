import React from 'react';
import { Scissors, Cloud, Sparkles, LogOut, ShieldCheck, User } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onLogout }) => {
  return (
    <header className="h-16 border-b border-dark-border bg-dark-900/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => onNavigate('dashboard')}
      >
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
          <Scissors className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-white">VIRALCUT</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-bold gradient-brand text-white">AI</span>
          </div>
          <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">4K Intelligent Video Engine</p>
        </div>
      </div>

      {/* Cloud Status Pill & Actions */}
      <div className="flex items-center gap-4">
        {/* 24/7 Cloud Status */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-800 border border-dark-border text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Cloud className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-medium">24/7 Cloud Engine Online</span>
        </div>

        {/* Quick Create Button */}
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/25 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create Clips</span>
        </button>

        {/* Owner Menu / Sign out */}
        <div className="flex items-center gap-2 pl-2 border-l border-dark-border">
          <button
            onClick={() => onNavigate('owner')}
            title="Owner Dashboard"
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-purple-400 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-gray-400 hover:text-rose-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
