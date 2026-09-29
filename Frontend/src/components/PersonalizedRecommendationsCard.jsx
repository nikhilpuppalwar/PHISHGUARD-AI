import React from 'react';

/**
 * PersonalizedRecommendationsCard Component (Task Section 3 & 6)
 * Renders the dedicated Generative AI Personalized Recommendations capability:
 * Displays the specific context used (Role, Relevant Activity, Security Awareness, Preference)
 * followed by dynamic, personalized security recommendations and "Why This Matters to You".
 */
export default function PersonalizedRecommendationsCard({
  recommendations = [],
  context = null,
  whyThisMatters = null,
  userRole = 'Student'
}) {
  const role = context?.role || userRole || 'Student';
  const activity = context?.relevant_activity || 'Routine communication';
  const awareness = context?.security_awareness || 'Beginner';
  const style = context?.explanation_preference || 'Simple';

  const defaultRecommendations = [
    `Because your profile lists active ${activity}, verify any unexpected requests through official institutional channels before compliance.`,
    `Do not enter credentials or pay fees in response to urgent unverified alerts.`,
    `Contact your organization or IT support if you observe repeated unsolicited communications.`
  ];

  const items = (recommendations && recommendations.length > 0)
    ? recommendations
    : defaultRecommendations;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[17px]">psychology_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Personalized Recommendations
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                GenAI Profile Alignment
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tailored guidance calibrated strictly to your profile context and active workflows.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {items.length} Recommendations
        </span>
      </div>

      {/* Context Used Bar */}
      <div className="px-5 py-3 bg-slate-50/40 border-b border-slate-100">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Context Used For Synthesis:
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            <span className="text-slate-400 font-sans text-[11px]">Role:</span>
            <strong>{role}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            <span className="text-slate-400 font-sans text-[11px]">Relevant Activity:</span>
            <strong className="truncate max-w-xs">{activity}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            <span className="text-slate-400 font-sans text-[11px]">Security Awareness:</span>
            <strong>{awareness}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 font-medium">
            <span className="text-slate-400 font-sans text-[11px]">Style:</span>
            <strong>{style}</strong>
          </span>
        </div>
      </div>

      {/* Numbered Recommendations List */}
      <div className="p-5 space-y-3">
        {items.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3.5 p-3.5 rounded-lg bg-indigo-50/20 border border-indigo-100/70 hover:bg-indigo-50/40 transition"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 text-xs text-slate-800 leading-relaxed font-normal">
              {rec}
            </div>
          </div>
        ))}
      </div>

      {/* Why This Matters to You Banner */}
      {whyThisMatters && (
        <div className="p-5 bg-gradient-to-r from-indigo-50/50 via-blue-50/30 to-white border-t border-indigo-100/60 flex items-start gap-3.5">
          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[16px]">info</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-indigo-950 uppercase tracking-wide">
              Why This Matters to You
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-normal">
              {whyThisMatters}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
