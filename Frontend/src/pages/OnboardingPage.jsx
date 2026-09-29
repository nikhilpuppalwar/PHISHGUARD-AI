import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  ArrowRight,
  Send,
  HelpCircle,
  Shield,
  Layers,
  Cpu,
  Check,
  Plus
} from 'lucide-react';

export default function OnboardingPage({ onNavigate }) {
  const { user, refreshProfile } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(20);
  const [extractedProfile, setExtractedProfile] = useState({
    role: 'Unspecified',
    common_services: [],
    online_activities: [],
    security_awareness: 'Beginner',
    technical_experience: 'Intermediate',
    banking_usage: false,
    work_email_usage: false
  });

  // Active answer states for current question
  const [selectedOptions, setSelectedOptions] = useState([]); // for multiple_choice or single_choice
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [freeText, setFreeText] = useState('');

  const messagesEndRef = useRef(null);

  // Initialize onboarding from backend on mount
  useEffect(() => {
    initOnboarding();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, currentQuestion]);

  const initOnboarding = async () => {
    setLoading(true);
    try {
      const res = await api.profile.startOnboarding();
      setConversationId(res.conversation_id);
      setCurrentQuestion(res.question);
      setProfileCompletion(res.profile_completion || 20);
      if (res.extracted_profile) {
        setExtractedProfile(res.extracted_profile);
      }
      setMessages([
        {
          role: 'assistant',
          content: res.assistant_message,
          question: res.question
        }
      ]);
    } catch (err) {
      console.error('Error starting onboarding:', err);
      // Fallback first question
      const defaultQ = {
        question: 'What best describes your role?',
        question_type: 'single_choice',
        options: ['Student', 'Employee', 'Business Owner', 'IT Professional', 'Developer', 'Teacher', 'Other'],
        allow_custom_input: true,
        profile_field: 'role',
        current_step: 1,
        total_steps: 4,
        profile_completion: 20
      };
      setCurrentQuestion(defaultQ);
      setMessages([
        {
          role: 'assistant',
          content: "Welcome to PhishGuard AI! Let's personalize your threat protection. What best describes your role?",
          question: defaultQ
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle option selection
  const handleOptionClick = (opt) => {
    if (!currentQuestion) return;

    if (opt === 'Other' || opt === 'None of these / Other') {
      setShowCustomInput(true);
      if (currentQuestion.question_type === 'single_choice') {
        setSelectedOptions(['Other']);
      } else {
        if (!selectedOptions.includes('Other')) {
          setSelectedOptions([...selectedOptions, 'Other']);
        }
      }
      return;
    }

    if (currentQuestion.question_type === 'single_choice' || currentQuestion.question_type === 'yes_no') {
      setSelectedOptions([opt]);
      setShowCustomInput(false);
      // Auto-submit single choice for quick frictionless flow
      submitAnswer(opt, null);
    } else {
      // multiple_choice
      if (selectedOptions.includes(opt)) {
        setSelectedOptions(selectedOptions.filter((o) => o !== opt));
      } else {
        setSelectedOptions([...selectedOptions, opt]);
      }
    }
  };

  // Submit answer
  const submitAnswer = async (overrideAnswer = null, overrideCustom = null) => {
    if (!currentQuestion || loading) return;

    let finalAnswer = overrideAnswer !== null ? overrideAnswer : null;
    let customAns = overrideCustom !== null ? overrideCustom : (customText.trim() || null);

    if (finalAnswer === null) {
      if (currentQuestion.question_type === 'text') {
        if (!freeText.trim()) return;
        finalAnswer = freeText.trim();
      } else if (currentQuestion.question_type === 'multiple_choice') {
        if (selectedOptions.length === 0 && !customAns) return;
        finalAnswer = [...selectedOptions];
      } else {
        // single_choice
        if (selectedOptions.length === 0 && !customAns) return;
        finalAnswer = selectedOptions[0] || 'Other';
      }
    }

    // Display user message in feed
    const displayUserText = Array.isArray(finalAnswer)
      ? finalAnswer.map((a) => (a === 'Other' && customAns ? `Other (${customAns})` : a)).join(', ')
      : (finalAnswer === 'Other' && customAns ? `Other: ${customAns}` : String(finalAnswer));

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: displayUserText }
    ]);

    // Clear active answer controls
    setSelectedOptions([]);
    setShowCustomInput(false);
    setCustomText('');
    setFreeText('');
    setCurrentQuestion(null);
    setLoading(true);

    try {
      const res = await api.profile.answerOnboarding({
        conversation_id: conversationId,
        field: currentQuestion.profile_field,
        answer: finalAnswer,
        custom_answer: customAns
      });

      setProfileCompletion(res.profile_completion || 60);
      if (res.extracted_profile) {
        setExtractedProfile(res.extracted_profile);
      }

      const botMsg = {
        role: 'assistant',
        content: res.assistant_message,
        question: res.next_question
      };
      setMessages((prev) => [...prev, botMsg]);

      if (res.is_complete || !res.next_question) {
        setIsComplete(true);
        await refreshProfile();
      } else {
        setCurrentQuestion(res.next_question);
      }
    } catch (err) {
      console.error('Error processing answer:', err);
      setIsComplete(true);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "🎉 Profile setup completed! Your security context has been calibrated and saved to the database."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const stepDots = [1, 2, 3, 4];
  const activeStep = currentQuestion ? (currentQuestion.current_step || 1) : 4;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col pt-16 pb-12">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Conversational Wizard Area */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden min-h-[580px]">
          {/* Top Bar with Dynamic Progress */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Conversational Security Profiling</span>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md">
                    Dynamic Interview
                  </span>
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Adaptive questionnaire to calibrate role-tailored phishing defenses.
                </p>
              </div>
            </div>

            {/* Stepper Dots & Percentage */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {stepDots.map((s) => (
                  <span
                    key={s}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      isComplete || s <= activeStep
                        ? 'bg-blue-600'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <div className="text-right font-mono text-sm text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200 font-medium">
                Setup Progress: <strong className="text-blue-600">{profileCompletion}%</strong>
              </div>
            </div>
          </div>

          {/* Linear Progress Indicator */}
          <div className="w-full bg-slate-100 h-1 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white font-medium shadow-xs'
                        : 'bg-slate-100 text-slate-900 border border-slate-200/90'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-2 text-slate-700 text-sm font-medium">
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing profile update...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Question Answering Dock */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/70">
            {isComplete ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50 p-5 rounded-xl border border-emerald-200">
                <div className="flex items-center gap-2.5 text-emerald-950 text-sm sm:text-base font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Your personalized security profile is complete and stored in the database.</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('submit')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-navy-900 hover:bg-slate-800 text-white text-sm font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Analyze Threat</span>
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {currentQuestion.question_type === 'multiple_choice'
                        ? 'Select all that apply:'
                        : 'Select one option:'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold font-mono">
                    Step {activeStep} of 4
                  </span>
                </div>

                <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {currentQuestion.question}
                </div>

                {/* Question Options Grid */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = selectedOptions.includes(opt);
                      const isOther = opt === 'Other' || opt === 'None of these / Other';

                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleOptionClick(opt)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition flex items-center gap-2 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4" />
                          ) : isOther ? (
                            <Plus className="w-4 h-4 text-slate-400" />
                          ) : null}
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Custom "Other" Text Input Box (Section 5 & 6) */}
                {showCustomInput && (
                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2.5 animate-fade-in">
                    <label className="text-sm font-semibold text-blue-900 block">
                      Please specify your custom answer:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Type custom details..."
                        className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitAnswer('Other', customText);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => submitAnswer('Other', customText)}
                        disabled={!customText.trim()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}

                {/* Text Question Input */}
                {currentQuestion.question_type === 'text' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitAnswer(freeText);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder={currentQuestion.placeholder || 'Type your answer here...'}
                      className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!freeText.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}

                {/* Scale Question Input (Spec §27) */}
                {currentQuestion.question_type === 'scale' && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      {currentQuestion.options.map((opt, idx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => submitAnswer(opt)}
                          className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left transition flex flex-col justify-between group"
                        >
                          <span className="font-bold text-base text-blue-600 font-mono group-hover:scale-105 transition-transform">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-800 font-medium mt-1.5 leading-snug">
                            {opt.replace(/^\d+\s*[-—]\s*/, '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Multiple Choice "Continue" Action */}
                {currentQuestion.question_type === 'multiple_choice' && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <span className="text-xs text-slate-600 font-medium font-mono">
                      {selectedOptions.length} option(s) selected
                    </span>
                    <button
                      type="button"
                      onClick={() => submitAnswer()}
                      disabled={selectedOptions.length === 0 && !customText.trim()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition disabled:opacity-50 flex items-center gap-2"
                    >
                      <span>Confirm & Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Natural-Language Alternative Input Bar (Spec §6, §8) */}
                <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder="Or type naturally in your own words (e.g. 'I am a final-year student...')"
                    className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && freeText.trim()) {
                        e.preventDefault();
                        submitAnswer(freeText.trim());
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={!freeText.trim() || loading}
                    onClick={() => submitAnswer(freeText.trim())}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Live Profile Telemetry Card */}
        <aside className="w-full lg:w-80 bg-navy-900 text-slate-100 rounded-xl p-5 border border-navy-border shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Profile Context Vector</span>
              </span>
              <h3 className="text-base font-bold text-white">Extracted Metadata</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Information gathered from your answers is used to personalize detection explanations and action plans.
              </p>
            </div>

            {/* Extracted Profile Cards */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/80 space-y-1">
                <span className="text-xs text-slate-400 block uppercase font-semibold">Primary Role</span>
                <span className="text-base font-bold text-white">
                  {extractedProfile.role || 'Unspecified'}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/80 space-y-1">
                <span className="text-xs text-slate-400 block uppercase font-semibold">Online Activities</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(extractedProfile.online_activities?.length > 0 ? extractedProfile.online_activities : ['Standard Web']).map((a, i) => (
                    <span key={i} className="text-xs bg-navy-950 text-slate-200 px-2 py-0.5 rounded border border-slate-700 font-medium">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/80 space-y-1">
                <span className="text-xs text-slate-400 block uppercase font-semibold">Services & Platforms</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(extractedProfile.common_services?.length > 0 ? extractedProfile.common_services : ['Google / Webmail']).map((s, i) => (
                    <span key={i} className="text-xs bg-navy-950 text-slate-200 px-2 py-0.5 rounded border border-slate-700 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/80 space-y-1">
                <span className="text-xs text-slate-400 block uppercase font-semibold">Security Awareness</span>
                <span className="text-sm font-bold text-emerald-400">
                  {extractedProfile.security_awareness || 'Beginner'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Database:</span>
              <span className="text-emerald-400 font-bold">✓ SQLite (Current State)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Profile RAG:</span>
              <span className="text-cyan-400 font-bold">✓ Semantic Memory Synced</span>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full text-center text-sm text-slate-300 hover:text-white py-1.5 font-medium transition"
            >
              Skip to Dashboard →
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
