import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onNavigate, currentScreen }) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <span className="material-symbols-outlined text-[24px]">security</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              PhishGuard <span className="text-cyan-600">AI</span>
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {!user ? (
            <>
              <button 
                onClick={() => onNavigate('landing')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'landing' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Overview
              </button>
              <a 
                href="#threat-inspector" 
                onClick={() => onNavigate('landing')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                Live Inspector
              </a>
              <a 
                href="#pipeline-architecture" 
                onClick={() => onNavigate('landing')}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
              >
                8-Stage Pipeline
              </a>
              <button 
                onClick={() => onNavigate('glossary')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'glossary' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Attack Glossary
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onNavigate('dashboard')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate('submit')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'submit' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Submit Threat
              </button>
              <button 
                onClick={() => onNavigate('incidents')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'incidents' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                History
              </button>
              <button 
                onClick={() => onNavigate('analytics')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'analytics' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Analytics
              </button>
              <button 
                onClick={() => onNavigate('glossary')} 
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${currentScreen === 'glossary' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Glossary
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
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-md shadow-blue-500/20 transition-all"
              >
                Get Started
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('submit')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[16px]">add_moderator</span>
                Analyze Threat
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-700 text-xs font-medium"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px]">
                  {user.profile?.preferred_name ? user.profile.preferred_name[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline">{user.profile?.preferred_name || 'Profile'}</span>
              </button>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-red-600 rounded-lg transition"
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
