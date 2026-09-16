import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import aiVisualization from '../assets/ai_visualization.png';

export default function LoginPage({ onNavigate }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('alex.rivera@university.edu');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (!res.has_profile) {
        onNavigate('onboarding');
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Telemetry Panel (#0B1220 Deep Navy) */}
      <aside className="w-full lg:w-[48%] xl:w-[50%] bg-[#0B1220] text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14233D15_1px,transparent_1px),linear-gradient(to_bottom,#14233D15_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => onNavigate('landing')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <span className="material-symbols-outlined text-[24px]">security</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                PhishGuard <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/25">
              Student / Capstone Project
            </span>
          </div>

          {/* Title & summary */}
          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Multi-Agent Ensemble Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              Personalized Multi-Agent Phishing Detection & Explainable Threat Triage
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Real-time inference pipeline that extracts lexical features, domain credibility, and sender intent using collaborative AI agents.
            </p>
          </div>

          {/* AI Graph image */}
          <div className="relative rounded-xl overflow-hidden border border-cyan-500/25 glow-cyan-subtle bg-[#0B1220]">
            <img 
              src={aiVisualization} 
              alt="Cybersecurity abstract AI visualization" 
              className="w-full h-48 sm:h-56 object-cover object-center opacity-90 transition duration-500 hover:scale-[1.01]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-cyan-300 bg-[#0B1220]/75 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-cyan-500/30">
              <span>ACTIVE MODEL: XGBoost + LR + Random Forest</span>
              <span className="text-emerald-400">STATUS: READY</span>
            </div>
          </div>

          {/* Quick specs pill row */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#14233D]/60 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px]">TRAINING CORPUS</span>
              <span className="text-white font-semibold">10 CSV Datasets (~1.02 GB)</span>
            </div>
            <div className="p-3 rounded-lg bg-[#14233D]/60 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px]">VECTOR RETRIEVAL</span>
              <span className="text-cyan-400 font-semibold">Top-K ChromaDB Anchors</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Applied AI in Cybersecurity</span>
          <span>CS-CAPSTONE-2025</span>
        </div>
      </aside>

      {/* Right Auth Panel */}
      <main className="w-full lg:w-[52%] xl:w-[50%] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-7 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                SECURE WORKSPACE ACCESS
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> System Online
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sign in to your PhishGuard AI account to analyze suspicious emails, links, and messages.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="email">
                College or Personal Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.rivera@university.edu"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2.5 block text-xs text-slate-600 select-none cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span>
              </button>
            </div>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
