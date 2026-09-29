import React from 'react';

/**
 * RiskFactorsBreakdown Component
 * Displays the structured breakdown of risk factors synthesized from
 * Text, URL, Sender agents, External Intelligence (Google Safe Browsing, VirusTotal),
 * and Incident RAG.
 */
export default function RiskFactorsBreakdown({ riskFactors = [], majorIndicators = [] }) {
  // Normalize factors list: support either direct risk_factors objects or fallback string indicators
  let items = [];
  if (Array.isArray(riskFactors) && riskFactors.length > 0) {
    items = riskFactors.map((rf, idx) => {
      if (typeof rf === 'string') {
        return {
          id: `rf-${idx}`,
          factor: rf,
          agent: 'heuristic',
          weight: 0.75,
        };
      }
      return {
        id: `rf-${idx}`,
        factor: rf.factor || rf.indicator || 'Suspicious characteristic detected',
        agent: rf.agent || 'detection',
        weight: typeof rf.weight === 'number' ? rf.weight : 0.8,
      };
    });
  } else if (Array.isArray(majorIndicators) && majorIndicators.length > 0) {
    items = majorIndicators.map((ind, idx) => ({
      id: `ind-${idx}`,
      factor: ind,
      agent: 'multi-agent',
      weight: 0.85,
    }));
  }

  const getAgentBadge = (agent) => {
    const a = (agent || '').toLowerCase();
    if (a.includes('url')) {
      return {
        label: 'URL Agent',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: 'link',
      };
    }
    if (a.includes('text')) {
      return {
        label: 'Text Agent',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: 'match_case',
      };
    }
    if (a.includes('sender')) {
      return {
        label: 'Sender Agent',
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: 'alternate_email',
      };
    }
    if (a.includes('google') || a.includes('safe_browsing')) {
      return {
        label: 'Safe Browsing',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: 'security',
      };
    }
    if (a.includes('virustotal')) {
      return {
        label: 'VirusTotal',
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: 'radar',
      };
    }
    return {
      label: agent.toUpperCase(),
      color: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: 'flag',
    };
  };

  const getWeightImpact = (weight) => {
    if (weight >= 0.9) {
      return { label: 'Critical Impact', badge: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    if (weight >= 0.75) {
      return { label: 'High Impact', badge: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: 'Moderate Impact', badge: 'bg-blue-100 text-blue-800 border-blue-200' };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined text-[17px]">warning</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Risk Factor Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Contributory risk factors and weighted signals isolated across the detection pipeline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {items.length} Factors Identified
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {items.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center gap-3 text-xs text-emerald-800">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>No critical risk factors were triggered across the analytical layers. The message exhibits nominal baseline patterns.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item) => {
              const badge = getAgentBadge(item.agent);
              const impact = getWeightImpact(item.weight);
              const weightPct = Math.round(item.weight * 100);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[18px] text-rose-500 mt-0.5 shrink-0">
                      report_problem
                    </span>
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-slate-900">
                        {item.factor}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${badge.color}`}>
                          <span className="material-symbols-outlined text-[11px]">{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">Weight factor: <strong className="font-mono text-slate-700">{item.weight.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] font-mono text-slate-500">Signal Contribution</div>
                      <div className="text-xs font-mono font-bold text-slate-800">{weightPct}%</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${impact.badge}`}>
                      {impact.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
