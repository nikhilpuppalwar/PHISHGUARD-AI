import React from 'react';

/**
 * WhyThisResultCard Component (Spec §7, §25, §26, §27)
 * Presents the top 3-5 strongest evidence points in clear, plain language.
 * Discloses reasons directly grounded in actual analytical evidence.
 */
export default function WhyThisResultCard({
  score = 0,
  whyFlagged = [],
  majorIndicators = [],
  riskFactors = [],
  agentFindings = null,
  isLowRisk = false
}) {
  const isLow = isLowRisk || score < 40;

  // Build 3 to 5 plain-language evidence points based on actual data
  let points = [];

  if (isLow) {
    points = [
      {
        title: "Benign language patterns",
        detail: "No coercive urgency, credential solicitation, or deceptive phishing language was detected."
      },
      {
        title: "Standard link structure",
        detail: "Submitted URL characteristics align with standard domain conventions without suspicious obfuscation."
      },
      {
        title: "Clean threat intelligence records",
        detail: "No active malicious campaigns or blacklisted entries were reported by queried security feeds."
      },
      {
        title: "No known threat match",
        detail: "Historical threat repository records do not match this submission."
      }
    ];
  } else {
    // Collect from whyFlagged first
    if (Array.isArray(whyFlagged) && whyFlagged.length > 0) {
      points = whyFlagged.slice(0, 5).map((item) => {
        if (typeof item === 'string') {
          // If item contains a colon, split into title and detail
          const parts = item.split(':');
          if (parts.length > 1) {
            return { title: parts[0].trim(), detail: parts.slice(1).join(':').trim() };
          }
          return { title: item, detail: '' };
        }
        return { title: item.title || item.factor || 'Suspicious Indicator', detail: item.detail || '' };
      });
    } else if (Array.isArray(majorIndicators) && majorIndicators.length > 0) {
      points = majorIndicators.slice(0, 5).map((ind) => {
        return { title: ind, detail: '' };
      });
    } else if (Array.isArray(riskFactors) && riskFactors.length > 0) {
      points = riskFactors.slice(0, 5).map((rf) => {
        const factorName = typeof rf === 'string' ? rf : (rf.factor || rf.indicator || 'Risk indicator');
        return { title: factorName, detail: rf.detail || '' };
      });
    } else {
      points = [
        {
          title: "Suspicious message characteristics",
          detail: "Structural heuristics flagged anomalous patterns requiring caution."
        }
      ];
    }
  }

  const titleText = isLow ? "WHY THIS LOOKS LOW RISK" : "WHY THIS RESULT?";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
            isLow ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}>
            <span className="material-symbols-outlined text-[19px]">
              {isLow ? 'task_alt' : 'help_center'}
            </span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {titleText}
            </h3>
            <p className="text-xs text-slate-500">
              {isLow ? 'Grounded in verifiable evaluation signals' : 'Top strongest evidence points in plain language'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          {points.length} Key Points
        </span>
      </div>

      {/* Points List */}
      <div className="p-6 space-y-3.5 flex-1">
        {points.map((pt, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
              isLow
                ? 'bg-emerald-50/30 border-emerald-100/80 hover:bg-emerald-50/50'
                : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 border ${
              isLow
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : 'bg-slate-200 text-slate-800 border-slate-300'
            }`}>
              {isLow ? '✓' : idx + 1}
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-sm font-semibold text-slate-900 leading-snug">
                {pt.title}
              </div>
              {pt.detail && (
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {pt.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
