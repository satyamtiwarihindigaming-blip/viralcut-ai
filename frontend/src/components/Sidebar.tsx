import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Film, 
  Sliders, 
  Download, 
  Cpu, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Clips', icon: PlusCircle, badge: 'AI' },
    { id: 'projects', label: 'Projects', icon: Film },
    { id: 'editor', label: 'Video Editor', icon: Sliders },
    { id: 'exports', label: 'Exports', icon: Download },
    { id: 'settings', label: 'AI Settings', icon: Cpu, badge: 'Gemini' },
    { id: 'owner', label: 'Owner Panel', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-dark-border bg-dark-900/50 flex flex-col justify-between py-6 px-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-purple-500 text-white' : 'bg-dark-700 text-gray-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cloud Spec Footer Card */}
      <div className="p-3.5 rounded-xl bg-dark-800/80 border border-dark-border space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Rendering Engine</span>
          <span className="text-purple-400 font-semibold">Lanczos 4K</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Aspect Ratio</span>
          <span className="text-gray-200 font-medium">9:16 Vertical</span>
        </div>
        <div className="w-full bg-dark-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full w-full" />
        </div>
      </div>
    </aside>
  );
};
