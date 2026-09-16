import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import aiVisualization from '../assets/ai_visualization.png';

export default function SignUpPage({ onNavigate }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const role = 'Unspecified';
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!agreeTerms) {
      setError('Please acknowledge the capstone terms and privacy notice');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, role);
      // Route immediately to dynamic conversational profiling wizard!
      onNavigate('onboarding');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Visual Showcase Panel (#0B1220 Deep Navy) */}
      <aside className="w-full lg:w-[48%] xl:w-[50%] bg-[#0B1220] text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14233D15_1px,transparent_1px),linear-gradient(to_bottom,#14233D15_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
              Account Registration
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-blue-950/60 text-blue-300 border border-blue-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Dynamic Context-Aware Protection
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              Join the Next Generation of Phishing Defense
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Create an account to unlock interactive conversational profiling, single-click threat triage, and personalized security action plans.
            </p>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-700 glow-blue-subtle bg-[#0B1220]">
            <img 
              src={aiVisualization} 
              alt="Cybersecurity AI pipeline visualization" 
              className="w-full h-48 sm:h-56 object-cover object-center opacity-90 transition duration-500 hover:scale-[1.01]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-cyan-300 bg-[#0B1220]/75 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700">
              <span>PROTECTION: Continuous Learning Memory</span>
              <span className="text-emerald-400">ENCRYPTION: AES-256</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Included Capstone Modules:
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              <li className="flex items-center gap-2 bg-[#14233D]/50 p-2 rounded-lg border border-slate-800">
                <span className="text-cyan-400">✓</span> Text Agent (TF-IDF + LR)
              </li>
              <li className="flex items-center gap-2 bg-[#14233D]/50 p-2 rounded-lg border border-slate-800">
                <span className="text-cyan-400">✓</span> URL Agent (XGBoost 54f)
              </li>
              <li className="flex items-center gap-2 bg-[#14233D]/50 p-2 rounded-lg border border-slate-800">
                <span className="text-cyan-400">✓</span> Sender Agent (Random Forest)
              </li>
              <li className="flex items-center gap-2 bg-[#14233D]/50 p-2 rounded-lg border border-slate-800">
                <span className="text-cyan-400">✓</span> Vector RAG + Dynamic LLM
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Student Security Suite</span>
          <span>CS-CAPSTONE-2025</span>
        </div>
      </aside>

      {/* Right Registration Form */}
      <main className="w-full lg:w-[52%] xl:w-[50%] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6 py-4">
          <div className="space-y-2">
            <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              NEW REGISTRATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Create Account
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Register your email to configure your threat defense profile and begin analysis.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>
            </div>


            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="reg-password">
                Create Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="reg-confirm">
                Confirm Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                </div>
                <input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div className="flex items-start pt-1">
              <input
                id="terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="ml-2.5 block text-xs text-slate-600 select-none leading-snug">
                I understand PhishGuard AI is an educational cybersecurity assistance platform and agrees to non-malicious usage terms.
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                <span>{loading ? 'Creating Account...' : 'Continue to Profiling AI'}</span>
                <span className="material-symbols-outlined text-[18px] ml-2">arrow_forward</span>
              </button>
            </div>
          </form>

          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign In instead
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
