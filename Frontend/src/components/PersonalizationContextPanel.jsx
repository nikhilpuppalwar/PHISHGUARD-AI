import React from 'react';

/**
 * WhyThisMattersCard Component (Spec §9, §10, §18)
 * "WHY THIS MATTERS TO YOU"
 * Bridges the technical threat assessment with the user's personal context:
 * - Role, Relevant Activity, Security Awareness
 * - Explains why this specific threat matters to the user's routine workflows
 * - Displays genuinely calculated Base Risk vs Personalized Risk if different
 * - Gracefully hides if no meaningful profile context exists
 */
export default function PersonalizationContextPanel({
  personalizationContext = null,
  userRole = 'Student',
  whyThisMatters = null,
  baseScore = null,
  personalizedScore = null,
  profileRelevance = 'MODERATE',
  personalizedRecommendations = []
}) {
  const role = personalizationContext?.role || userRole;
  const activity = personalizationContext?.relevant_activity;
  const awareness = personalizationContext?.security_awareness;
  const explanation = whyThisMatters || personalizationContext?.why_this_matters;
  const recommendations = (Array.isArray(personalizedRecommendations) && personalizedRecommendations.length > 0)
    ? personalizedRecommendations
    : (Array.isArray(personalizationContext?.personalized_recommendations) ? personalizationContext.personalized_recommendations : []);

  // If no meaningful personalization context or role is present, do not render a generic filler box
  if (!role && !activity && !explanation && recommendations.length === 0) {
    return null;
  }

  // Generate plain-language relevance statement if not provided directly
  const displayExplanation = explanation || (
    activity
      ? `Because your activity involves ${activity}, this communication pattern directly intersects with your routine workflows.`
      : `Based on your profile as a ${role}, staying vigilant against unsolicited solicitations helps safeguard your credentials.`
  );

  const hasScoreAdjustment = baseScore !== null && personalizedScore !== null && Math.round(baseScore) !== Math.round(personalizedScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[19px]">person_check</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                WHY THIS MATTERS TO YOU
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Personalized Context
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated against your active profile and routine communication workflows.
            </p>
          </div>
        </div>

        {hasScoreAdjustment && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              Base Risk: <strong className="text-slate-900">{Math.round(baseScore)}/100</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800">
              Personalized Risk: <strong>{Math.round(personalizedScore)}/100</strong>
            </span>
          </div>
        )}
      </div>

      {/* Body: Profile Attributes, Personalized Reason & Tailored Recommendations */}
      <div className="p-6 space-y-4">
        {/* Profile Attributes Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Role
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-indigo-600">badge</span>
              <span>{role || 'Authenticated User'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Relevant Activity
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[16px] text-indigo-600">history_edu</span>
              <span className="truncate">{activity || 'Routine communications'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Security Awareness
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-indigo-600">shield</span>
              <span>{awareness || 'Beginner'}</span>
            </div>
          </div>
        </div>

        {/* Tailored Explanation Quote */}
        <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 flex items-start gap-3">
          <span className="material-symbols-outlined text-indigo-600 text-[20px] mt-0.5 shrink-0">
            lightbulb
          </span>
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {displayExplanation}
          </p>
        </div>

        {/* Tailored Personalized Recommendations */}
        {recommendations.length > 0 && (
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                </div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Personalized Recommendations for {role}
                </h4>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                {recommendations.length} Tailored Actions
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-indigo-50/30 hover:border-indigo-200 transition"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center justify-center text-[11px] font-mono font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                    {rec}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
