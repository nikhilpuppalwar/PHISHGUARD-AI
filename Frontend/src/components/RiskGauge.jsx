import React from 'react';

export default function RiskGauge({ score = 0, severity = 'Low Risk', confidence = 0.9 }) {
  const isHigh = score >= 75;
  const isMed = score >= 40 && score < 75;

  const colorClass = isHigh
    ? 'text-red-600'
    : isMed
    ? 'text-amber-500'
    : 'text-emerald-600';

  const bgClass = isHigh
    ? 'bg-red-50 text-red-700 border-red-200'
    : isMed
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const iconName = isHigh ? 'warning' : isMed ? 'help' : 'verified_user';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${bgClass}`}>
            <span className="material-symbols-outlined text-[16px]">{iconName}</span>
            {severity.toUpperCase()}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Model Confidence: {(confidence * 100).toFixed(1)}%
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          PhishGuard Multi-Agent Threat Verdict
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculated via Bayesian multi-signal fusion across Text, URL, and Sender evidence vectors.
        </p>
      </div>

      {/* Numerical score gauge */}
      <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <div className="text-right">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Threat Score
          </div>
          <div className={`text-4xl font-extrabold tracking-tight ${colorClass}`}>
            {score}
            <span className="text-lg font-normal text-slate-400">/100</span>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isHigh ? 'bg-red-100 text-red-600' : isMed ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
          <span className="material-symbols-outlined text-[28px]">{iconName}</span>
        </div>
      </div>
    </div>
  );
}
