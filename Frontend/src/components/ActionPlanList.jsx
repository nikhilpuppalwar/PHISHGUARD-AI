import React from 'react';

/**
 * ActionPlanList Component (Spec §12, §18)
 * Dynamically renders personalized response steps tailored to the user's role,
 * security awareness, and detected attack pattern.
 */
export default function ActionPlanList({
  actionPlan = [],
  userRole = 'Student',
  attackType = 'General Threat'
}) {
  const steps = (actionPlan && actionPlan.length > 0)
    ? actionPlan
    : [
        "Do not click unverified links or download unexpected attachments.",
        "Verify the sender identity through an independent, official communication channel.",
        "Report suspicious messages to your security or IT administrator."
      ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-[17px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Personalized Defense Action Plan
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tailored for: {userRole}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Immediate operational countermeasures calibrated to your profile and {attackType}.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {steps.length} Action Steps
        </span>
      </div>

      {/* Action Steps List */}
      <div className="p-5 space-y-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3.5 p-3 rounded-lg bg-slate-50/50 border border-slate-200/70 hover:bg-slate-50 transition"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 text-xs text-slate-800 leading-relaxed font-normal">
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
