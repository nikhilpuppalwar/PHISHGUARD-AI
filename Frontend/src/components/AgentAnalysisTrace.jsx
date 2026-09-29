import React, { useState } from 'react';

/**
 * AgentAnalysisTrace Component (Spec §19)
 * "TECHNICAL EXECUTION TRACE"
 * Collapsed by default showing "11 execution stages completed [View Full Trace]"
 * Expands to show the transparent, verified pipeline execution stages.
 */
export default function AgentAnalysisTrace({ agentTrace = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!agentTrace || agentTrace.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MATCH_FOUND':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BYPASSED':
      case 'SKIPPED':
      case 'NO_MATCH':
      case 'INCOMPLETE_HEADERS':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header / Collapsed Summary Bar */}
      <div className="px-6 py-4 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
            <span className="material-symbols-outlined text-[19px]">account_tree</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                TECHNICAL EXECUTION TRACE
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                {agentTrace.length} execution stages completed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deterministic multi-agent execution pipeline telemetry.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition"
        >
          <span className="material-symbols-outlined text-[16px] text-slate-500">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
          <span>{isExpanded ? 'Hide Trace' : 'View Full Trace'}</span>
        </button>
      </div>

      {/* Expanded Trace Timeline List */}
      {isExpanded && (
        <div className="p-6 border-t border-slate-100 divide-y divide-slate-100 bg-white">
          {agentTrace.map((step) => (
            <div key={step.stage} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
              {/* Stage Number Badge */}
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-700 shrink-0 mt-0.5">
                {step.stage}
              </div>

              {/* Stage Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{step.name}</span>
                    <span className="text-xs font-mono text-slate-500">• {step.agent}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold border ${getStatusBadge(step.status)}`}>
                    {step.status}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {step.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
