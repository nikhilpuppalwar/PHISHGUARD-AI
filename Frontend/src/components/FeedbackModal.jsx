import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function FeedbackModal({ submissionId, currentVerdict, isOpen, onClose, onSubmitted }) {
  const [verdict, setVerdict] = useState(currentVerdict || 'confirmed_phishing');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.feedback.submit(submissionId, verdict, context);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSubmitted(verdict);
        onClose();
      }, 900);
    } catch (err) {
      alert(`Feedback submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { value: 'confirmed_phishing', label: 'Confirmed Phishing', desc: 'Malicious threat intent verified. Adds verified vector to incident memory.', borderClass: 'hover:border-red-500' },
    { value: 'confirmed_legitimate', label: 'Confirmed Legitimate', desc: 'False positive; this communication was genuine.', borderClass: 'hover:border-emerald-500' },
    { value: 'incorrect', label: 'Classification Incorrect', desc: 'Wrong attack type or mismatched risk severity score.', borderClass: 'hover:border-amber-500' },
    { value: 'unsure', label: 'Unsure / Under Review', desc: 'Ambiguous or requires administrative review.', borderClass: 'hover:border-slate-500' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-modal space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[22px]">rate_review</span>
            <h3 id="feedback-modal-title" className="text-base font-bold text-slate-900">
              Record Threat Verdict Feedback
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {success ? (
          <div className="py-6 text-center space-y-2">
            <span className="material-symbols-outlined text-emerald-600 text-[40px]">check_circle</span>
            <div className="text-base font-bold text-slate-900">Feedback Saved</div>
            <p className="text-sm text-slate-600">Your verification label has been saved to the incident memory store.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              Your feedback is recorded to calibrate future threat detection and validate multi-agent accuracy metrics.
            </p>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-slate-800 uppercase font-mono block mb-1.5">
                Select Observed Reality:
              </legend>
              {options.map((opt) => {
                const selected = verdict === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`block p-3 rounded-lg border text-sm cursor-pointer transition ${
                      selected
                        ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                        : `border-slate-200 bg-white ${opt.borderClass}`
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="verdict"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setVerdict(opt.value)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{opt.label}</div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{opt.desc}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </fieldset>

            <div className="space-y-1.5">
              <label htmlFor="feedback-notes" className="block text-sm font-semibold text-slate-800">
                Additional Forensic Notes (Optional):
              </label>
              <textarea
                id="feedback-notes"
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Sender address was confirmed via phone call with vendor..."
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder-slate-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-xs transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
