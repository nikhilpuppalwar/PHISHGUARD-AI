import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentScreen, onNavigate }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'submit', label: 'Submit Threat', icon: 'send_and_archive' },
    { id: 'incidents', label: 'Incident History', icon: 'history' },
    { id: 'analytics', label: 'Risk Analytics', icon: 'monitoring' },
    { id: 'glossary', label: 'Attack Glossary', icon: 'menu_book' },
    { id: 'profile', label: 'Profile & Settings', icon: 'manage_accounts' },
  ];

  return (
    <aside className="w-64 bg-[#0B1220] text-slate-200 min-h-[calc(100vh-5rem)] border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 select-none">
      <div className="space-y-6">
        {/* User context badge */}
        <div className="p-3 rounded-xl bg-[#14233D] border border-cyan-500/20 glow-cyan-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-md">
              {user?.profile?.preferred_name ? user.profile.preferred_name[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">
                {user?.profile?.preferred_name || 'Alex Rivera'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Role: {user?.profile?.role || 'Student'}</span>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>TIER:</span>
            <span className="text-emerald-400 font-semibold">{user?.profile?.security_awareness || 'Beginner'}</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="space-y-1">
          <div className="px-3 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Workspaces
          </div>
          {navItems.map((item) => {
            const active = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#14233D]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Multi-Agent Telemetry Status */}
        <div className="p-3 rounded-lg bg-[#0F1A2E] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">PIPELINE ENGINE</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> ONLINE
            </span>
          </div>
          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex justify-between">
              <span>Text Agent:</span>
              <span className="text-blue-400">TF-IDF + LR</span>
            </div>
            <div className="flex justify-between">
              <span>URL Agent:</span>
              <span className="text-cyan-400">XGBoost (54f)</span>
            </div>
            <div className="flex justify-between">
              <span>Sender Agent:</span>
              <span className="text-indigo-400">Random Forest</span>
            </div>
            <div className="flex justify-between">
              <span>Threat RAG:</span>
              <span className="text-purple-400">Chroma Vectors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Profile action */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={() => onNavigate('onboarding')}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-950/70 transition"
        >
          <span className="material-symbols-outlined text-[16px]">psychology</span>
          Re-run Profiling AI
        </button>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/20 transition"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
