import React, { useState } from 'react';
import { api } from '../api/client';

export default function FeedbackModal({ submissionId, currentVerdict, isOpen, onClose, onSubmitted }) {
  const [verdict, setVerdict] = useState(currentVerdict || 'confirmed_phishing');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      }, 1000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const options = [
    { value: 'confirmed_phishing', label: 'Confirmed Phishing', desc: 'Malicious threat intent verified. Adds to vector memory.', color: 'border-red-500 text-red-700 bg-red-50' },
    { value: 'confirmed_legitimate', label: 'Confirmed Legitimate', desc: 'False positive; communication is authentic.', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { value: 'incorrect', label: 'Classification Incorrect', desc: 'Wrong attack type or mismatched risk scoring.', color: 'border-amber-500 text-amber-700 bg-amber-50' },
    { value: 'unsure', label: 'Unsure / Under Review', desc: 'Requires administrative or secondary human review.', color: 'border-slate-400 text-slate-700 bg-slate-50' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[24px]">rate_review</span>
            <h3 className="text-lg font-bold text-slate-900">Provide Analysis Feedback</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <span className="material-symbols-outlined text-emerald-600 text-[48px]">check_circle</span>
            <div className="text-base font-bold text-slate-900">Feedback Recorded!</div>
            <p className="text-xs text-slate-500">Your ground-truth input has been saved to reinforce threat memory.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Your feedback is stored in PhishGuard's incident memory to calibrate future threat detection for your organization.
            </p>

            <div className="space-y-2">
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${
                    verdict === opt.value ? opt.color : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="verdict"
                    value={opt.value}
                    checked={verdict === opt.value}
                    onChange={(e) => setVerdict(e.target.value)}
                    className="mt-0.5 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                    <div className="text-xs text-slate-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Additional Notes or Clarifications (Optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Sender claimed to be university recruiter but domain was newly created."
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Save Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
