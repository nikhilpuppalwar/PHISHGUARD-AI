import React from 'react';

export default function RiskGauge({ score = 0, severity = 'Low Risk', confidence = 0.9 }) {
  const isHigh = score >= 75;
  const isMed = score >= 40 && score < 75;

  const colorClass = isHigh
    ? 'text-red-600'
    : isMed
    ? 'text-amber-600'
    : 'text-emerald-600';

  const badgeClass = isHigh
    ? 'bg-red-50 text-red-700 border-red-200'
    : isMed
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const iconName = isHigh ? 'warning' : isMed ? 'help_outline' : 'verified_user';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${badgeClass}`}>
            <span className="material-symbols-outlined text-[15px]">{iconName}</span>
            <span>{severity}</span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Confidence: {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Bayesian Risk Assessment Verdict
        </h2>
        <p className="text-xs text-slate-500">
          Harmonized composite risk calculated across Text NLP, URL structural heuristics, and Sender authentication.
        </p>
      </div>

      {/* Numerical score gauge */}
      <div className="flex items-center gap-4 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 shrink-0">
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Threat Score
          </div>
          <div className={`text-3xl font-extrabold tracking-tight ${colorClass}`}>
            {score}
            <span className="text-sm font-normal text-slate-400">/100</span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isHigh ? 'bg-red-100 text-red-600' : isMed ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          <span className="material-symbols-outlined text-[24px]">{iconName}</span>
        </div>
      </div>
    </div>
  );
}
