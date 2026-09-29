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
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[19px]">psychology_alt</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Personalized Recommendations
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                GenAI Profile Alignment
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Tailored guidance calibrated strictly to your profile context and active workflows.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {items.length} Recommendations
        </span>
      </div>

      {/* Context Used Bar */}
      <div className="px-6 py-3.5 bg-slate-50/50 border-b border-slate-100">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
          Context Used For Synthesis:
        </div>
        <div className="flex flex-wrap gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <span className="text-slate-500 font-sans font-medium">Role:</span>
            <strong className="font-semibold">{role}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <span className="text-slate-500 font-sans font-medium">Relevant Activity:</span>
            <strong className="font-semibold truncate max-w-xs">{activity}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <span className="text-slate-500 font-sans font-medium">Security Awareness:</span>
            <strong className="font-semibold">{awareness}</strong>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
            <span className="text-slate-500 font-sans font-medium">Style:</span>
            <strong className="font-semibold">{style}</strong>
          </span>
        </div>
      </div>

      {/* Numbered Recommendations List */}
      <div className="p-6 space-y-3.5">
        {items.map((rec, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3.5 p-4 rounded-lg bg-indigo-50/30 border border-indigo-100 hover:bg-indigo-50/50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 text-sm sm:text-base text-slate-800 leading-relaxed font-normal pt-0.5">
              {rec}
            </div>
          </div>
        ))}
      </div>

      {/* Why This Matters to You Banner */}
      {whyThisMatters && (
        <div className="p-6 bg-gradient-to-r from-indigo-50/60 via-blue-50/40 to-white border-t border-indigo-100 flex items-start gap-3.5">
          <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-200">
            <span className="material-symbols-outlined text-[18px]">info</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider font-mono">
              Why This Matters to You
            </h4>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {whyThisMatters}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
