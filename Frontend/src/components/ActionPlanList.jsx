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
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-[19px]">verified_user</span>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Personalized Defense Action Plan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Tailored for: {userRole}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Immediate operational countermeasures calibrated to your profile and {attackType}.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {steps.length} Action Steps
        </span>
      </div>

      {/* Action Steps List */}
      <div className="p-6 space-y-3.5">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3.5 p-3.5 rounded-lg bg-slate-50/60 border border-slate-200/80 hover:bg-slate-50 transition"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 text-sm sm:text-base text-slate-800 leading-relaxed font-normal pt-0.5">
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
