import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, getFriendlyErrorMessage } from '../utils/authValidation';
import aiVisualization from '../assets/ai_visualization.png';

export default function LoginPage({ onNavigate, redirectMessage, targetScreen }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('alex.rivera@university.edu');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailBlur = () => {
    setEmailTouched(true);
    const { isValid, error } = validateEmail(email);
    setEmailError(isValid ? '' : error);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (formError) setFormError('');
    if (emailTouched) {
      const { isValid, error } = validateEmail(val);
      setEmailError(isValid ? '' : error);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setEmailTouched(true);
      setEmailError(emailValidation.error);
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password, rememberMe);
      if (!res.has_profile) {
        onNavigate('onboarding');
      } else {
        onNavigate(targetScreen || 'dashboard');
      }
    } catch (err) {
      setFormError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* LEFT COLUMN: Sign In Form (Priority on Mobile & Tablet) */}
      <main className="w-full lg:w-[50%] xl:w-[48%] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16 order-1">
        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="space-y-1.5">
            {/* Mobile Branding Header */}
            <div
              className="lg:hidden flex items-center gap-2 cursor-pointer select-none mb-4"
              onClick={() => onNavigate('landing')}
            >
              <div className="w-7 h-7 rounded-md bg-navy-900 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[18px]">security</span>
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                PhishGuard <span className="text-blue-600">AI</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Sign in to manage your security workspaces, threat analyses, and defense profile.
            </p>
          </div>

          {/* Session Expiry or Guard Notice */}
          {redirectMessage && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">
                lock
              </span>
              <span className="leading-relaxed">{redirectMessage}</span>
            </div>
          )}

          {/* Form Level Error Message */}
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5"
            >
              <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed font-medium">{formError}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase font-mono text-slate-700"
              >
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  placeholder="student@example.com"
                  required
                  aria-required="true"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'login-email-error' : undefined}
                  className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                    emailError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                  }`}
                />
              </div>
              {emailError && (
                <p id="login-email-error" className="text-xs text-red-600 font-medium flex items-center gap-1 pt-0.5">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase font-mono text-slate-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  required
                  aria-required="true"
                  className="block w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center pt-0.5">
              <input
                id="remember-me"
                name="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-xs text-slate-600 select-none cursor-pointer"
              >
                Keep me signed in on this device (30 days)
              </label>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Sign Up */}
          <div className="text-center pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('signup')}
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* RIGHT COLUMN: Product Explanation / Detection Workspace Preview */}
      <aside className="w-full lg:w-[50%] xl:w-[52%] bg-navy-900 text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-slate-800 order-2">
        <div className="space-y-8">
          {/* Header & Capstone Context */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none"
              onClick={() => onNavigate('landing')}
            >
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">security</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                PhishGuard <span className="text-blue-400">AI</span>
              </span>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-navy-800 text-slate-300 border border-slate-700">
              MDP Capstone
            </span>
          </div>

          {/* Heading and Short Context */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Personalized Phishing Threat Triage
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              Sign in to run multi-agent threat analyses, review Bayesian risk assessments, and configure personalized defense profiles.
            </p>
          </div>

          {/* Real Architecture Preview Card */}
          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-navy-950 shadow-md">
            <img
              src={aiVisualization}
              alt="PhishGuard AI multi-agent detection pipeline preview"
              className="w-full h-44 sm:h-52 object-cover object-center opacity-85"
            />
            <div className="p-3 bg-navy-800/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="text-slate-400">DETECTION ENGINES:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                4 Active Agents
              </span>
            </div>
          </div>

          {/* Detection Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-xs">
            <div className="p-3 rounded-lg bg-navy-800 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Detection Agents</span>
              <span className="text-white font-medium">Text, URL, Sender</span>
            </div>
            <div className="p-3 rounded-lg bg-navy-800 border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trained Models</span>
              <span className="text-white font-medium">Random Forest + XGBoost</span>
            </div>
          </div>
        </div>

        {/* Footer Security Note */}
        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Applied AI Research</span>
          <span>Salted PBKDF2 Encryption</span>
        </div>
      </aside>
    </div>
  );
}
