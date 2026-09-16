import React, { useState } from 'react';
import { api } from '../api/client';
import aiVisualization from '../assets/ai_visualization.png';

export default function PasswordResetPage({ onNavigate }) {
  const [step, setStep] = useState(1); // 1: Email Request, 2: OTP/New Password, 3: Success
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.requestPasswordReset(email);
      setMsg(res.message);
      if (res.demo_code) {
        setResetCode(res.demo_code); // Prefill demo code for convenient evaluation
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.auth.confirmPasswordReset(email, resetCode, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Brand Panel (#0B1220 Deep Navy) */}
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
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/25">
              Account Recovery
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Secure Credential Reset (FR-17)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              Encrypted Password Recovery
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              PhishGuard AI protects user privacy through constant-time enumeration resistance and cryptographic token authorization.
            </p>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-cyan-500/25 glow-cyan-subtle bg-[#0B1220]">
            <img 
              src={aiVisualization} 
              alt="Cybersecurity defense network" 
              className="w-full h-48 sm:h-56 object-cover object-center opacity-90 transition duration-500 hover:scale-[1.01]" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1220] via-transparent to-transparent opacity-80 pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-cyan-300 bg-[#0B1220]/75 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-cyan-500/30">
              <span>ZERO-LEAKAGE RESPONSE ENFORCED</span>
              <span className="text-emerald-400">STATUS: ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Security Protocol v2.0</span>
          <span>CS-CAPSTONE-2025</span>
        </div>
      </aside>

      {/* Right Recovery Form */}
      <main className="w-full lg:w-[52%] xl:w-[50%] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-7 py-4">
          <div className="space-y-2">
            <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              RECOVERY STEP {step} OF 3
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {step === 1 && 'Reset Password'}
              {step === 2 && 'Verify & Set New Password'}
              {step === 3 && 'Password Successfully Reset'}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              {step === 1 && 'Enter your registered email address to receive a secure recovery code.'}
              {step === 2 && 'Enter the verification code and configure your new secure password.'}
              {step === 3 && 'Your credentials have been securely updated. You can now log into your workspace.'}
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {msg && step === 2 && (
            <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-[18px]">info</span>
              <span>{msg}</span>
            </div>
          )}

          {/* STEP 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="reset-email">
                  Registered Email Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  <span>{loading ? 'Dispatching...' : 'Send Recovery Code'}</span>
                  <span className="material-symbols-outlined text-[18px] ml-2">send</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Code & New Password */}
          {step === 2 && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="reset-code">
                  Verification Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="6-digit code (e.g. 482910)"
                  required
                  className="block w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="new-pw">
                  New Password
                </label>
                <input
                  id="new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="confirm-pw">
                  Confirm New Password
                </label>
                <input
                  id="confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                >
                  <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
                  <span className="material-symbols-outlined text-[18px] ml-2">check</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Complete */}
          {step === 3 && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[36px]">verified</span>
              </div>
              <p className="text-xs text-slate-600">
                You can now log in using your updated password.
              </p>
              <button
                onClick={() => onNavigate('login')}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md transition"
              >
                Return to Sign In
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
