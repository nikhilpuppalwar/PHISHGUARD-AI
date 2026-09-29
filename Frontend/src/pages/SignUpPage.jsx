import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, checkPasswordStrength, getFriendlyErrorMessage } from '../utils/authValidation';
import TermsPrivacyModal from '../components/TermsPrivacyModal';
import aiVisualization from '../assets/ai_visualization.png';

export default function SignUpPage({ onNavigate }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Student');
  const [customRole, setCustomRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false); // Explicit opt-in, not pre-checked

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Legal Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('terms');

  const ROLES = ['Student', 'Employee', 'Developer', 'IT Professional', 'Business Owner', 'Teacher / Educator', 'Other'];

  const pwStrength = checkPasswordStrength(password);
  const passwordsMatch = !confirmPassword || password === confirmPassword;

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
    setPasswordTouched(true);
    if (formError) setFormError('');
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setConfirmTouched(true);
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

    if (!pwStrength.isValid) {
      setPasswordTouched(true);
      setFormError('Please ensure your password meets all required security criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setConfirmTouched(true);
      setFormError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setFormError('You must review and agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    const finalRole = role === 'Other' ? (customRole.trim() || 'Other') : role;

    setLoading(true);
    try {
      await register(trimmedEmail, password, finalRole, fullName.trim());
      onNavigate('onboarding');
    } catch (err) {
      setFormError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openLegalModal = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Terms & Privacy Dialog */}
      <TermsPrivacyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={modalTab}
      />

      {/* LEFT COLUMN: Registration Form (Priority on Mobile & Tablet) */}
      <main className="w-full lg:w-[50%] xl:w-[48%] bg-white flex items-center justify-center p-6 sm:p-10 lg:p-12 order-1 overflow-y-auto">
        <div className="w-full max-w-sm space-y-5">
          {/* Header */}
          <div className="space-y-1">
            {/* Mobile Branding Header */}
            <div
              className="lg:hidden flex items-center gap-2 cursor-pointer select-none mb-3"
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
              Create your account
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Set up your PhishGuard account to run multi-agent threat analyses and calibrate your defense profile.
            </p>
          </div>

          {/* Form Error Message */}
          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2.5 font-medium"
            >
              <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed font-semibold">{formError}</span>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Full Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Rivera"
                required
                className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Email address
              </label>
              <input
                id="signup-email"
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
                aria-describedby={emailError ? 'signup-email-error' : undefined}
                className={`block w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
                  emailError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-300 focus:ring-blue-600 focus:border-blue-600'
                }`}
              />
              {emailError && (
                <p id="signup-email-error" className="text-xs text-red-600 font-semibold flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{emailError}</span>
                </p>
              )}
            </div>

            {/* Primary Role */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-role"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Primary Role
              </label>
              <select
                id="signup-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition font-medium"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {role === 'Other' && (
              <div className="space-y-1.5 animate-in fade-in duration-100">
                <label
                  htmlFor="signup-custom-role"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Specify Custom Role
                </label>
                <input
                  id="signup-custom-role"
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Security Researcher, Data Analyst"
                  className="block w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                />
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••••••"
                  required
                  aria-required="true"
                  className="block w-full px-3.5 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold font-mono">Strength:</span>
                    <span
                      className={`font-bold font-mono ${
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
                  {/* Visual Strength Meter */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-1">
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

              {/* Factual Password Policy Rules Checklist (Displayed BEFORE Submission) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-2 space-y-1.5 text-xs">
                <span className="text-slate-700 font-bold block uppercase text-xs tracking-wider">
                  Password must contain:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 font-medium">
                  <span className={`flex items-center gap-1.5 ${pwStrength.rules.length ? 'text-emerald-700 font-semibold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {pwStrength.rules.length ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>At least 8 characters</span>
                  </span>
                  <span className={`flex items-center gap-1.5 ${pwStrength.rules.uppercase ? 'text-emerald-700 font-semibold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {pwStrength.rules.uppercase ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>One uppercase letter</span>
                  </span>
                  <span className={`flex items-center gap-1.5 ${pwStrength.rules.lowercase ? 'text-emerald-700 font-semibold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {pwStrength.rules.lowercase ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>One lowercase letter</span>
                  </span>
                  <span className={`flex items-center gap-1.5 ${pwStrength.rules.number ? 'text-emerald-700 font-semibold' : ''}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {pwStrength.rules.number ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>One number</span>
                  </span>
                  <span className={`flex items-center gap-1.5 ${pwStrength.rules.special ? 'text-emerald-700 font-semibold' : ''} sm:col-span-2`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {pwStrength.rules.special ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span>One special character (e.g. !@#$%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="signup-confirm-password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  placeholder="Re-enter password"
                  required
                  aria-required="true"
                  className={`block w-full px-3.5 pr-11 py-2.5 text-sm bg-white border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition ${
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
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {confirmTouched && !passwordsMatch && (
                <p className="text-xs text-red-600 font-semibold flex items-center gap-1 pt-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>Passwords do not match.</span>
                </p>
              )}
            </div>

            {/* Terms and Privacy Consent Checkbox (Explicit, not pre-checked) */}
            <div className="flex items-start pt-1.5">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="agree-terms" className="ml-2.5 block text-xs sm:text-sm text-slate-700 select-none cursor-pointer leading-relaxed font-medium">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('terms')}
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  Terms & Conditions
                </button>{' '}
                and acknowledge the{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('privacy')}
                  className="text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  Privacy Policy
                </button>.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center pt-3 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="font-bold text-blue-600 hover:text-blue-700 transition-colors ml-1"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </main>

      {/* RIGHT COLUMN: Product Explanation / Architecture Highlights */}
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
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                PhishGuard <span className="text-blue-400">AI</span>
              </span>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-semibold bg-navy-800 text-slate-200 border border-slate-700">
              Account Registration
            </span>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Create Your Security Workspace
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
              Set up your profile to receive personalized threat risk assessments, tailored security action plans, and explainable forensic insights.
            </p>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-navy-950 shadow-md">
            <img
              src={aiVisualization}
              alt="Cybersecurity multi-agent architecture preview"
              className="w-full h-44 sm:h-52 object-cover object-center opacity-85"
            />
            <div className="p-3.5 bg-navy-800/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-200">
              <span className="text-slate-400 font-semibold">PROTECTION: Continuous RAG Memory</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Included In This Platform:
            </div>
            <ul className="space-y-2.5 text-sm text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Contextual User Security Profiling (Adaptive Questionnaire)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Multi-Agent Text, URL, and Sender Threat Verification</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-blue-400 text-[18px] shrink-0 mt-0.5">check_circle</span>
                <span>Incident Vector RAG Memory & Explainable Attribution</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>MDP Capstone Deliverable</span>
          <span>Salted PBKDF2 Password Hashing</span>
        </div>
      </aside>
    </div>
  );
}
