import React, { useState } from 'react';
import { api } from '../api/client';
import { validateEmail, checkPasswordStrength, getFriendlyErrorMessage } from '../utils/authValidation';
import aiVisualization from '../assets/ai_visualization.png';

export default function PasswordResetPage({ onNavigate }) {
  const [step, setStep] = useState(1); // 1: Email Request, 2: OTP/New Password, 3: Success
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [formError, setFormError] = useState('');

  const pwStrength = checkPasswordStrength(newPassword);
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

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

  const handleRequest = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setEmailTouched(true);
      setEmailError(emailValidation.error);
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.requestPasswordReset(trimmedEmail);
      // Account enumeration safe message
      setInfoMsg(res.message || "If an account exists for this email, you'll receive password reset instructions shortly.");
      if (res.demo_code) {
        setResetCode(res.demo_code);
      }
      setStep(2);
    } catch (err) {
      setFormError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!resetCode.trim()) {
      setFormError('Please enter your recovery code.');
      return;
    }

    if (!pwStrength.isValid) {
      setPasswordTouched(true);
      setFormError('Please ensure your new password satisfies all required security rules.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmTouched(true);
      setFormError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.confirmPasswordReset(email.trim(), resetCode.trim(), newPassword);
      setStep(3);
    } catch (err) {
      setFormError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* LEFT COLUMN: Reset Flow Form (Priority on Mobile & Tablet) */}
      <main className="w-full lg:w-[50%] xl:w-[48%] bg-white flex items-center justify-center p-6 sm:p-12 lg:p-16 order-1 overflow-y-auto">
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
              {step === 1 && 'Reset your password'}
              {step === 2 && 'Create a new password'}
              {step === 3 && 'Password updated'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {step === 1 && "Enter your email address and we'll send reset instructions if an account exists."}
              {step === 2 && 'Enter your verification code and choose a new secure password.'}
              {step === 3 && 'Your password has been updated. You can now sign in with your new credentials.'}
            </p>
          </div>

          {/* Factual Info Message / Account Enumeration Protection */}
          {infoMsg && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] text-blue-600 shrink-0 mt-0.5">
                info
              </span>
              <span className="leading-relaxed">{infoMsg}</span>
            </div>
          )}

          {/* Form Error Message */}
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

          {/* STEP 1: Request Code */}
          {step === 1 && (
            <form onSubmit={handleRequest} noValidate className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semibold uppercase font-mono text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    placeholder="alex.rivera@university.edu"
                    required
                    aria-required="true"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'reset-email-error' : undefined}
                    className={`block w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                      emailError
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                    }`}
                  />
                </div>
                {emailError && (
                  <p id="reset-email-error" className="text-xs text-red-600 font-medium flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending instructions...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>Send Reset Instructions</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Verify Code & Set New Password */}
          {step === 2 && (
            <form onSubmit={handleConfirm} noValidate className="space-y-4">
              <div className="space-y-1">
                <label
                  htmlFor="reset-code"
                  className="block text-xs font-semibold uppercase font-mono text-slate-700"
                >
                  Recovery Code
                </label>
                <input
                  id="reset-code"
                  name="code"
                  type="text"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="482910"
                  required
                  className="block w-full px-3 py-2 font-mono text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold uppercase font-mono text-slate-700"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    name="new_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordTouched(true);
                      if (formError) setFormError('');
                    }}
                    placeholder="••••••••••••"
                    required
                    aria-required="true"
                    className="block w-full px-3 pr-10 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
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

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="pt-1.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono text-[11px]">Strength:</span>
                      <span
                        className={`font-semibold text-[11px] font-mono ${
                          pwStrength.strength === 'Strong'
                            ? 'text-emerald-700'
                            : pwStrength.strength === 'Good'
                            ? 'text-blue-700'
                            : pwStrength.strength === 'Fair'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {pwStrength.strength}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full transition-colors duration-200 ${
                            pwStrength.score >= step
                              ? pwStrength.score === 4
                                ? 'bg-emerald-500'
                                : pwStrength.score === 3
                                ? 'bg-blue-500'
                                : pwStrength.score === 2
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Password Rules Checklist */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 mt-2 space-y-1 text-[11px] font-mono">
                  <span className="text-slate-600 font-semibold block uppercase text-[10px]">
                    Password must contain:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                    <span className={`flex items-center gap-1.5 ${pwStrength.rules.length ? 'text-emerald-700 font-medium' : ''}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {pwStrength.rules.length ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>At least 8 characters</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwStrength.rules.uppercase ? 'text-emerald-700 font-medium' : ''}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {pwStrength.rules.uppercase ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>One uppercase letter</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwStrength.rules.lowercase ? 'text-emerald-700 font-medium' : ''}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {pwStrength.rules.lowercase ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>One lowercase letter</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwStrength.rules.number ? 'text-emerald-700 font-medium' : ''}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {pwStrength.rules.number ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>One number</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${pwStrength.rules.special ? 'text-emerald-700 font-medium' : ''} sm:col-span-2`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {pwStrength.rules.special ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>One special character</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label
                  htmlFor="confirm-new-password"
                  className="block text-xs font-semibold uppercase font-mono text-slate-700"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <input
                    id="confirm-new-password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmTouched(true);
                      if (formError) setFormError('');
                    }}
                    placeholder="Re-enter new password"
                    required
                    aria-required="true"
                    className={`block w-full px-3 pr-10 py-2 text-xs sm:text-sm bg-white border rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                      confirmTouched && !passwordsMatch
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {confirmTouched && !passwordsMatch && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1 pt-0.5">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>Passwords do not match.</span>
                  </p>
                )}
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating password...</span>
                    </span>
                  ) : (
                    <span>Save New Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="space-y-4 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900">Your password has been updated</h2>
                <p className="text-xs text-slate-500">
                  Your credentials have been securely updated. You can now sign in with your new password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-xs transition"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Back to Sign In link */}
          {step !== 3 && (
            <div className="text-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT COLUMN: Product Security & Protocol Overview */}
      <aside className="w-full lg:w-[50%] xl:w-[52%] bg-navy-900 text-slate-100 flex flex-col justify-between p-6 sm:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-slate-800 order-2">
        <div className="space-y-7">
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
              Account Security
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Secure Account Recovery
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg">
              Reset your credentials securely with automated verification, preventing user enumeration and unauthorized credential tampering.
            </p>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-navy-950 shadow-md">
            <img
              src={aiVisualization}
              alt="Cybersecurity multi-agent architecture preview"
              className="w-full h-44 sm:h-52 object-cover object-center opacity-85"
            />
            <div className="p-3 bg-navy-800/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="text-slate-400">AUTHENTICATION PROTOCOL:</span>
              <span className="text-emerald-400 font-semibold">Salted PBKDF2</span>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="p-3 rounded-lg bg-navy-800 border border-slate-700/60 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-blue-400 text-[18px] shrink-0 mt-0.5">
                shield
              </span>
              <div>
                <span className="font-semibold text-white block">Account Enumeration Protection</span>
                <span className="text-slate-400 text-[11px]">
                  Generic responses ensure email registration status is never exposed to untrusted entities.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Security Protocol FR-17</span>
          <span>PhishGuard AI</span>
        </div>
      </aside>
    </div>
  );
}
