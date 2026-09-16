import React from 'react';

export default function ActionPlanList({ actionPlan = [], userRole = 'Student', attackType = '' }) {
  return (
    <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">task_alt</span>
          <span className="text-sm font-bold text-slate-900">
            Personalized Action Plan (Role: {userRole})
          </span>
        </div>
        <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 font-semibold">
          Automated Response Tier
        </span>
      </div>

      <p className="text-xs text-slate-500">
        Tailored guidance calibrated to your role and threat profile for {attackType || 'identified vector'}.
      </p>

      <ol className="space-y-2.5 pl-5 list-decimal text-xs text-slate-800 leading-relaxed">
        {actionPlan.map((step, idx) => (
          <li key={idx} className="pl-1">
            <span className="font-medium">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
