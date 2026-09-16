import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function SubmitAnalysisPage({ onNavigate, onAnalysisComplete, initialText = '' }) {
  const [rawInput, setRawInput] = useState(initialText || '');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Sample payloads for capstone testing
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
      label: 'Legitimate College Notice',
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
      setError('Please provide text or a URL to analyze');
      return;
    }

    setError('');
    setAnalyzing(true);
    try {
      const result = await api.analyze.runAnalysis(rawInput);
      onAnalysisComplete(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please check backend connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Single Unified Ingestion Studio
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Submit Suspicious Content
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Paste any raw message, full email with headers, or solitary URL into the single input field below. 
          The AI Preprocessor will automatically parse and route components to specialized ML agents.
        </p>
      </div>

      {/* Preset Sample Buttons */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block">
          Load Pre-configured Threat Samples:
        </span>
        <div className="flex flex-wrap gap-2">
          {samples.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRawInput(s.text)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:border-blue-500 hover:text-blue-600 transition shadow-2xs"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Unified Input Form */}
      <form onSubmit={handleRunAnalysis} className="space-y-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2" htmlFor="unified-input">
              <span className="material-symbols-outlined text-blue-600 text-[18px]">terminal</span>
              Raw Suspicious Payload (Email, SMS, or URL)
            </label>
            <span className="text-[11px] font-mono text-slate-400">
              {rawInput.length} characters
            </span>
          </div>

          <textarea
            id="unified-input"
            rows={7}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Paste your suspicious content here...&#10;&#10;Examples:&#10;• Full email with headers (From:, Subject:, body, links)&#10;• SMS text message with shortened link&#10;• Solitary link (e.g. http://bit.ly/...)&#10;• Urgency notification claiming your password expired"
            className="w-full p-4 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition leading-relaxed"
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Auto-Extracted Signal Badges (Preview) */}
        {preview && (
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
                  AI Preprocessor Auto-Extraction Preview
                </span>
              </div>
              <span className="text-[11px] font-mono bg-blue-600/30 text-blue-300 px-2.5 py-0.5 rounded border border-blue-500/40 uppercase">
                Detected Channel: {preview.detected_channel}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {/* Sender Extracted */}
              <div className="p-3 rounded-xl bg-[#14233D] border border-slate-700/60 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Extracted Sender</span>
                <span className="text-cyan-300 font-semibold truncate block">
                  {preview.extracted_sender || 'Anonymous / Solitary Payload'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Routed to: Sender Agent (Random Forest)</span>
              </div>

              {/* Extracted URLs */}
              <div className="p-3 rounded-xl bg-[#14233D] border border-slate-700/60 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Extracted URLs ({preview.extracted_urls.length})</span>
                {preview.extracted_urls.length > 0 ? (
                  <div className="space-y-0.5">
                    {preview.extracted_urls.map((u, i) => (
                      <span key={i} className="text-blue-300 truncate block text-[11px] underline">
                        {u}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500">No embedded URLs</span>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">Routed to: URL Agent (XGBoost 54f)</span>
              </div>

              {/* Lexical Tokens */}
              <div className="p-3 rounded-xl bg-[#14233D] border border-slate-700/60 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Detected Indicators</span>
                {preview.extracted_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {preview.extracted_keywords.map((kw, i) => (
                      <span key={i} className="text-[9px] bg-red-950/70 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500">Standard syntax</span>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">Routed to: Text Agent (TF-IDF + LR)</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Action Cluster */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setRawInput('')}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            Clear Input
          </button>
          <button
            type="submit"
            disabled={analyzing || !rawInput.trim()}
            className="px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running Multi-Agent Pipeline...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">verified_user</span>
                <span>Execute Multi-Agent Threat Triage</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
