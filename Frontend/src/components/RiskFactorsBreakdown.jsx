import React, { useState } from 'react';

/**
 * RiskFactorsBreakdown Component (Spec §14, §18)
 * "TOP RISK FACTORS"
 * Renders a compact, scannable list of primary contributory risk factors.
 * Features:
 * - Clean compact rows with severity tags (HIGH, MEDIUM, LOW)
 * - Shows top 4 factors initially with "View All Factors" toggle
 * - Avoids repetitive 85% boilerplate or oversized redundant cards
 */
export default function RiskFactorsBreakdown({
  riskFactors = [],
  majorIndicators = []
}) {
  const [showAll, setShowAll] = useState(false);

  // Normalize factors list
  let items = [];
  if (Array.isArray(riskFactors) && riskFactors.length > 0) {
    items = riskFactors.map((rf, idx) => {
      if (typeof rf === 'string') {
        return {
          id: `rf-${idx}`,
          factor: rf,
          level: 'MEDIUM',
          agent: 'Detection Engine'
        };
      }
      const weight = typeof rf.weight === 'number' ? rf.weight : 0.7;
      let level = 'LOW';
      if (weight >= 0.8 || (rf.severity && rf.severity.toUpperCase() === 'HIGH')) {
        level = 'HIGH';
      } else if (weight >= 0.5 || (rf.severity && rf.severity.toUpperCase() === 'MEDIUM')) {
        level = 'MEDIUM';
      }

      return {
        id: `rf-${idx}`,
        factor: rf.factor || rf.indicator || 'Risk indicator flagged',
        level,
        agent: rf.agent || 'Analysis Engine',
        weight
      };
    });
  } else if (Array.isArray(majorIndicators) && majorIndicators.length > 0) {
    items = majorIndicators.map((ind, idx) => ({
      id: `ind-${idx}`,
      factor: ind,
      level: 'HIGH',
      agent: 'Indicator Engine'
    }));
  }

  const displayedItems = showAll ? items : items.slice(0, 4);

  const getLevelBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-600">
            <span className="material-symbols-outlined text-[19px]">warning</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              TOP RISK FACTORS
            </h3>
            <p className="text-xs text-slate-500">
              Observable signals contributing to the overall threat assessment.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          {items.length} Identified
        </span>
      </div>

      {/* Body: Compact Rows */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        {items.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-emerald-600 text-[18px]">verified</span>
            <span>No elevated risk factors detected across analytical models.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                    arrow_right
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                    {item.factor}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border shrink-0 ${getLevelBadge(item.level)}`}>
                  {item.level}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View All Toggle */}
        {items.length > 4 && (
          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition inline-flex items-center gap-1"
            >
              <span>{showAll ? 'Show Top Factors Only' : `View All Factors (${items.length})`}</span>
              <span className="material-symbols-outlined text-[15px]">
                {showAll ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
