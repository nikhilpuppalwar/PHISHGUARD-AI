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
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-[17px]">person_check</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Personalization Context</h3>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluated against your active profile and routine communication habits.
            </p>
          </div>
        </div>

        {/* Technical Score vs Personalized Context Indicator */}
        {baseScore !== null && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600">
              Base Risk: <strong className="text-slate-800">{Math.round(baseScore)}/100</strong>
            </div>
            {personalizedScore !== null && (
              <div className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700">
                Personalized Score: <strong>{Math.round(personalizedScore)}/100</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Attribute Grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border-b border-slate-100 text-xs">
        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Current Role
          </div>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-slate-500">badge</span>
            {role}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Targeted Activity
          </div>
          <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5" title={activity}>
            <span className="material-symbols-outlined text-[15px] text-slate-500">travel_explore</span>
            {activity}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Security Awareness
          </div>
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-slate-500">shield</span>
            {awareness}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
            Historical Memory
          </div>
          <div className="font-semibold text-slate-800 truncate flex items-center gap-1.5" title={prevIncident}>
            <span className="material-symbols-outlined text-[15px] text-slate-500">history_edu</span>
            {prevIncident}
          </div>
        </div>
      </div>

      {/* Why This Matters to You Banner */}
      {whyThisMatters && (
        <div className="p-5 bg-gradient-to-r from-indigo-50/40 via-blue-50/30 to-white flex items-start gap-3.5">
          <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
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
