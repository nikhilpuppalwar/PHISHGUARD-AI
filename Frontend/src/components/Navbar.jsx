import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/25 text-white transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[24px]">security</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              PhishGuard <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">AI</span>
            </span>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200/70 tracking-wide">
              Academic Capstone
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {!user ? (
            <>
              <button 
                onClick={() => onNavigate('landing')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'landing' 
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Overview
              </button>
              <a 
                href="#threat-inspector" 
                onClick={() => onNavigate('landing')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
              >
                Live Inspector
              </a>
              <a 
                href="#pipeline-architecture" 
                onClick={() => onNavigate('landing')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
              >
                8-Stage Pipeline
              </a>
              <button 
                onClick={() => onNavigate('glossary')} 
                title="Sign in required to access full Threat Encyclopedia"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50/60 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-[15px] text-slate-400">lock</span>
                <span>Attack Glossary</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'dashboard' 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate('submit')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'submit' 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Analyze Threat
              </button>
              <button 
                onClick={() => onNavigate('incidents')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'incidents' 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Incident History
              </button>
              <button 
                onClick={() => onNavigate('analytics')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'analytics' 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Risk Analytics
              </button>
              <button 
                onClick={() => onNavigate('glossary')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                  currentScreen === 'glossary' 
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Attack Glossary
              </button>
            </>
          )}
        </nav>

        {/* Right CTA Cluster */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('submit')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-[16px]">add_moderator</span>
                Analyze Threat
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 transition text-slate-800 text-xs font-medium border border-slate-200/60"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                  {user.profile?.preferred_name ? user.profile.preferred_name[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                </div>
                <span className="hidden sm:inline font-semibold">{user.profile?.preferred_name || (user.email ? user.email.split('@')[0] : 'Profile')}</span>
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
