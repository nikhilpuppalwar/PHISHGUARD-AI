import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const PIPELINE_STEPS = [
  'Input Processing',
  'AI Orchestrator',
  'Text Agent',
  'URL Agent',
  'Sender Agent',
  'External URL Intelligence',
  'Incident RAG',
  'Risk AI',
  'Explainable AI',
  'Personalization',
  'Generative AI'
];

export default function SubmitAnalysisPage({ onNavigate, onAnalysisComplete, initialText = '' }) {
  const [rawInput, setRawInput] = useState(initialText || '');
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');

  // Sample payloads for testing
  const samples = [
    {
      label: 'Internship Advance-Fee Scam',
      text: `From: hr-verify@quick-career.org\nSubject: Summer Analyst Internship Offer - Allocation Verification Required\n\nCongratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the secure portal link below to reserve your slot and generate the candidate pass: http://bit.ly/internship-fee-2024. Failure to process immediately releases the allocation.`
    },
    {
      label: 'PayPal Credential Phishing',
      text: `From: security-alert@paypal-update-center.com\nSubject: Unauthorized Login Attempt - Verify Password\n\nDear Customer, We detected an unauthorized sign-in to your PayPal wallet from an unfamiliar IP address. Verify your account password immediately at http://secure-paypal-login.xyz/verify to prevent permanent suspension.`
    },
    {
      label: 'Package Delivery Smishing SMS',
      text: `USPS Alert: Your package #9400109 could not be delivered due to an incomplete street address. Update your details and pay $1.99 redelivery fee at https://usps-redelivery-portal.info/track within 24 hours.`
    },
    {
      label: 'Legitimate University Notice',
      text: `From: notifications@university.edu\nSubject: Spring Semester Course Registration Schedule\n\nDear Students, Priority course registration for the upcoming Spring semester begins on Monday at 9:00 AM. Please review your degree audit on the official student portal (https://portal.university.edu). Contact your academic advisor with questions.`
    }
  ];

  // Debounced auto-extract preview as user types
  useEffect(() => {
    if (!rawInput.trim() || rawInput.length < 15) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await api.analyze.previewExtract(rawInput);
        setPreview(data);
      } catch (err) {
        console.error('Preview extract failed:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [rawInput]);

  const handleRunAnalysis = async (e) => {
    e.preventDefault();
    if (!rawInput.trim()) {
      setError('Please provide message text, email headers, or a URL to analyze.');
      return;
    }

    setError('');
    setAnalyzing(true);
    setActiveStep(1);

    // Dynamic progression ticker through the multi-agent pipeline (Spec §18)
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 9 ? prev + 1 : prev));
    }, 280);

    try {
      const result = await api.analyze.runAnalysis(rawInput);
      clearInterval(stepInterval);
      setActiveStep(11);
      setTimeout(() => {
        onAnalysisComplete(result);
      }, 400);
    } catch (err) {
      clearInterval(stepInterval);
      setAnalyzing(false);
      setError(err.message || 'Threat analysis failed. Please verify the backend is running.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Consistent Header & Breadcrumbs */}
      <PageHeader
        screenId="submit"
        eyebrow="WORKSPACE"
        title="Analyze Threat"
        description="Submit suspicious emails, URLs, messages, or other content for multi-agent security analysis."
        onNavigate={onNavigate}
      >
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          Unified Ingestion Studio
        </span>
      </PageHeader>

      {/* Preset Threat Samples */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold block">
          Load Pre-Configured Test Samples:
        </span>
        <div className="flex flex-wrap gap-2.5">
          {samples.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setRawInput(s.text);
                setError('');
              }}
              className="px-3.5 py-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium transition"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Input Form */}
      <form onSubmit={handleRunAnalysis} className="space-y-4">
        <div className="p-5 sm:p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2" htmlFor="unified-threat-input">
              <span className="material-symbols-outlined text-blue-600 text-[20px]">terminal</span>
              <span>Raw Content (Email Headers, SMS, or URL)</span>
            </label>
            <span className="text-xs font-mono text-slate-500 font-medium">
              {rawInput.length} characters
            </span>
          </div>

          <textarea
            id="unified-threat-input"
            rows={7}
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              if (error) setError('');
            }}
            placeholder="Paste suspicious raw text here...&#10;&#10;Supported formats:&#10;• Full email including From: and Subject: headers&#10;• Short SMS / chat message with URL&#10;• Solitary web link (e.g. http://bit.ly/...)&#10;• Urgent notification asking for password verification"
            className="w-full p-4 text-sm sm:text-base font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition leading-relaxed"
          />

          {error && (
            <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-medium flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Auto-Extracted Preview */}
        {preview && (
          <div className="p-5 rounded-xl bg-navy-900 text-slate-200 border border-navy-border shadow-xs space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                  Preprocessor Entity Extraction
                </span>
              </div>
              <span className="text-xs font-mono font-semibold bg-navy-800 text-blue-300 px-2.5 py-1 rounded border border-slate-700 uppercase">
                Channel: {preview.detected_channel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-sm font-mono">
              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/60 space-y-1.5">
                <span className="text-xs text-slate-300 block uppercase font-bold">Sender</span>
                <span className="text-white text-sm font-semibold truncate block">
                  {preview.extracted_sender || 'None detected'}
                </span>
                <span className="text-xs text-slate-400 block pt-1">Target: Sender Agent</span>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/60 space-y-1.5">
                <span className="text-xs text-slate-300 block uppercase font-bold">
                  URLs Found ({preview.extracted_urls.length})
                </span>
                {preview.extracted_urls.length > 0 ? (
                  <div className="space-y-1">
                    {preview.extracted_urls.map((u, i) => (
                      <span key={i} className="text-blue-300 truncate block text-xs">
                        {u}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">None detected</span>
                )}
                <span className="text-xs text-slate-400 block pt-1">Target: URL Agent</span>
              </div>

              <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/60 space-y-1.5">
                <span className="text-xs text-slate-300 block uppercase font-bold">Lexical Cues</span>
                {preview.extracted_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {preview.extracted_keywords.map((kw, i) => (
                      <span key={i} className="text-xs bg-red-950 text-red-200 px-2 py-0.5 rounded border border-red-800 font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Standard syntax</span>
                )}
                <span className="text-xs text-slate-400 block pt-1">Target: Text Agent</span>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Agent Analysis Pipeline Execution Display (Spec §18) */}
        {analyzing && (
          <div className="p-5 sm:p-6 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
                  Autonomous Multi-Agent Pipeline Execution
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">
                Step {Math.min(activeStep, 11)} / 11
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {PIPELINE_STEPS.map((stepName, idx) => {
                const stepNum = idx + 1;
                const isDone = activeStep > stepNum || activeStep === 11;
                const isCurrent = activeStep === stepNum && activeStep !== 11;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-mono transition-all ${
                      isDone
                        ? 'bg-slate-800/80 text-emerald-300 border border-emerald-900/40'
                        : isCurrent
                        ? 'bg-blue-950/70 text-blue-300 border border-blue-700 shadow-2xs'
                        : 'bg-slate-800/40 text-slate-500 border border-slate-800/70'
                    }`}
                  >
                    <span className="truncate">{stepName}</span>
                    <span className="text-sm font-bold ml-2">
                      {isDone ? (
                        <span className="text-emerald-400">✓</span>
                      ) : isCurrent ? (
                        <span className="inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-slate-600">○</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              setRawInput('');
              setPreview(null);
              setError('');
            }}
            className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
          >
            Clear Form
          </button>
          <button
            type="submit"
            disabled={analyzing || !rawInput.trim()}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-semibold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Multi-Agent Pipeline...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">shield</span>
                <span>Analyze Threat</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
