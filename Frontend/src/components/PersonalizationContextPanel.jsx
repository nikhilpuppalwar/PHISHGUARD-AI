import React from 'react';

/**
 * PersonalizationContextPanel Component (Spec §11, §18, §19)
 * Highlights the authenticated user's current security profile, online context,
 * and contextual relevance to this threat without overriding technical evidence.
 */
export default function PersonalizationContextPanel({
  personalizationContext = null,
  userRole = 'Student',
  whyThisMatters = null,
  baseScore = null,
  personalizedScore = null,
  profileRelevance = 'MODERATE'
}) {
  const role = personalizationContext?.role || userRole || 'Authenticated User';
  const activity = personalizationContext?.relevant_activity || 'General Academic & Online Services';
  const awareness = personalizationContext?.security_awareness || 'Intermediate';
  const prevIncident = personalizationContext?.relevant_previous_incident || 'No prior similar incident';
  const style = personalizationContext?.explanation_preference || 'Simple & Actionable';
  const relevance = personalizationContext?.relevance || profileRelevance || 'MODERATE';

  // Badge styling for profile relevance
  const relevanceBadge = () => {
    switch (relevance.toUpperCase()) {
      case 'HIGH':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Directly Targets Your Profile'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Relevant to Your Activities'
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'General Relevance / Low Exposure'
        };
    }
  };

  const badge = relevanceBadge();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[19px]">person_check</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Personalization Context</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluated against your active profile and routine communication habits.
            </p>
          </div>
        </div>

        {/* Technical Score vs Personalized Context Indicator */}
        {baseScore !== null && (
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
              Base Risk: <strong className="text-slate-900">{Math.round(baseScore)}/100</strong>
            </div>
            {personalizedScore !== null && (
              <div className="px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800">
                Personalized Score: <strong>{Math.round(personalizedScore)}/100</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Attribute Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border-b border-slate-100">
        <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Current Role
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-blue-600">badge</span>
            <span>{role}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Targeted Activity
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5" title={activity}>
            <span className="material-symbols-outlined text-[17px] text-blue-600">travel_explore</span>
            <span className="truncate">{activity}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Security Awareness
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px] text-emerald-600">shield</span>
            <span>{awareness}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Historical Memory
          </div>
          <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5" title={prevIncident}>
            <span className="material-symbols-outlined text-[17px] text-purple-600">history_edu</span>
            <span className="truncate">{prevIncident}</span>
          </div>
        </div>
      </div>

      {/* Why This Matters to You Banner */}
      {whyThisMatters && (
        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-blue-50/30 to-white flex items-start gap-3.5">
          <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-200">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
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
