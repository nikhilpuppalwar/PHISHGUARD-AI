import React, { useState } from 'react';
import { api } from '../api/client';

/**
 * InlineFeedbackCard Component (Spec §20)
 * Allows the user to provide rapid feedback near the bottom of the Threat Report:
 * 1. Was this result helpful? [ Yes ] [ No ]
 * 2. Was the assessment correct? [ Phishing ] [ Legitimate ] [ Unsure ]
 * Saves verdict to backend database and updates incident memory verification store.
 */
export default function InlineFeedbackCard({
  submissionId,
  currentVerdict = null,
  onVerdictChange = null
}) {
  const [helpful, setHelpful] = useState(null);
  const [assessment, setAssessment] = useState(currentVerdict || null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(currentVerdict));
  const [statusMessage, setStatusMessage] = useState('');

  const handleAssessmentSubmit = async (verdictChoice) => {
    setAssessment(verdictChoice);
    if (!submissionId) return;

    setLoading(true);
    try {
      // Map user choice to API verdict format
      let apiVerdict = 'unsure';
      if (verdictChoice === 'phishing') apiVerdict = 'confirmed_phishing';
      else if (verdictChoice === 'legitimate') apiVerdict = 'confirmed_legitimate';
      else if (verdictChoice === 'unsure') apiVerdict = 'unsure';

      await api.feedback.submit(
        submissionId,
        apiVerdict,
        helpful !== null ? `Helpful: ${helpful ? 'Yes' : 'No'}` : ''
      );

      setSubmitted(true);
      setStatusMessage('Thank you! Your feedback has been recorded to calibrate future threat detection.');
      if (onVerdictChange) {
        onVerdictChange(apiVerdict);
      }
    } catch (err) {
      setStatusMessage(`Failed to record feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulSelect = (val) => {
    setHelpful(val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[19px]">rate_review</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              USER FEEDBACK
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback verifies analytical accuracy and helps protect the community.
            </p>
          </div>
        </div>

        {submitted && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Recorded</span>
          </span>
        )}
      </div>

      {/* Body: Helpful Question & Assessment Question */}
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Question 1: Was this result helpful? */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
              Was this result helpful?
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleHelpfulSelect(true)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  helpful === true
                    ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                <span>Yes</span>
              </button>

              <button
                type="button"
                onClick={() => handleHelpfulSelect(false)}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                  helpful === false
                    ? 'bg-slate-100 border-slate-300 text-slate-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                <span>No</span>
              </button>
            </div>
          </div>

          {/* Question 2: Was the assessment correct? */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
              Was the assessment correct?
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssessmentSubmit('phishing')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  assessment === 'phishing' || assessment === 'confirmed_phishing'
                    ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Phishing
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssessmentSubmit('legitimate')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  assessment === 'legitimate' || assessment === 'confirmed_legitimate'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Legitimate
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssessmentSubmit('unsure')}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  assessment === 'unsure'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Unsure
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">check_circle</span>
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
