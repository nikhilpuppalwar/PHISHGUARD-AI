import React from 'react';

/**
 * ActionPlanList Component (Spec §8, §25, §26, §27)
 * "WHAT SHOULD YOU DO?"
 * Placed near the top of the report to give the user immediate, prioritized guidance.
 * Strictly respects Low / Medium / High risk states without repeating generic static lists.
 */
export default function ActionPlanList({
  actionPlan = [],
  score = 0,
  userRole = 'Student',
  attackType = 'General Threat'
}) {
  const isLow = score < 40;
  const isMed = score >= 40 && score < 75;

  let steps = [];

  if (isLow) {
    // Low risk: calm reassurance per spec §8 & §25
    steps = [];
  } else if (Array.isArray(actionPlan) && actionPlan.length > 0) {
    steps = actionPlan.slice(0, 5);
  } else if (isMed) {
    steps = [
      "Pause before responding or clicking any embedded links.",
      "Verify the sender independently through an established phone number or official directory.",
      "Check the destination URL carefully before entering any credentials or personal details."
    ];
  } else {
    // High risk defaults tailored to attack pattern
    const isPayment = attackType.toLowerCase().includes('payment') || attackType.toLowerCase().includes('fee') || attackType.toLowerCase().includes('internship') || attackType.toLowerCase().includes('advance');
    steps = [
      "Do not click the suspicious link or download attachments.",
      isPayment ? "Do not make any advance fee or internship payment." : "Do not share passwords, OTPs, or sensitive financial information.",
      "Verify the claimed organization independently via official public contact information.",
      "Report this message to your IT security administrator or email provider."
    ];
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
            isLow ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <span className="material-symbols-outlined text-[19px]">
              {isLow ? 'check_circle' : 'security'}
            </span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              WHAT SHOULD YOU DO?
            </h3>
            <p className="text-xs text-slate-500">
              {isLow ? 'Recommended posture' : `Immediate countermeasures tailored for ${userRole}`}
            </p>
          </div>
        </div>

        {!isLow && (
          <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {steps.length} Actions
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col justify-center">
        {isLow ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <span className="material-symbols-outlined text-emerald-600 text-[20px]">done_all</span>
              <span>No Immediate Action Required</span>
            </div>
            <p className="text-sm text-emerald-900/90 leading-relaxed font-normal">
              No immediate defensive action is required based on the available evidence. Continue normal caution with unexpected requests or unfamiliar attachments.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/80 hover:bg-slate-50 transition"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="text-sm text-slate-800 leading-relaxed font-normal pt-0.5">
                  {step}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
