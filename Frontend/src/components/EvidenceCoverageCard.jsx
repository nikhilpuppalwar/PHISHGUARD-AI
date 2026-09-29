import React from 'react';

/**
 * EvidenceCoverageCard Component (Spec §11, §18)
 * "HOW DID WE CHECK IT?"
 * Compact matrix displaying verification coverage across all analytical dimensions.
 * Strictly adheres to states:
 * - ✓ Evaluated / Checked / Used
 * - — Not provided
 * - ○ Not applicable
 * - ⚠ Unavailable
 */
export default function EvidenceCoverageCard({ evidenceCoverage = null }) {
  const defaultCoverage = [
    {
      label: "Text Analysis",
      status: "✓ Evaluated",
      type: "success"
    },
    {
      label: "URL Analysis",
      status: "✓ Evaluated",
      type: "success"
    },
    {
      label: "Sender Analysis",
      status: "— Not provided",
      type: "neutral"
    },
    {
      label: "External Threat Intel",
      status: "✓ Checked",
      type: "success"
    },
    {
      label: "Incident Memory",
      status: "✓ No match",
      type: "neutral"
    },
    {
      label: "User Profile",
      status: "✓ Used",
      type: "success"
    }
  ];

  // Map incoming coverage data if provided as object
  let items = defaultCoverage;
  if (evidenceCoverage && typeof evidenceCoverage === 'object') {
    const rawItems = Object.entries(evidenceCoverage);
    if (rawItems.length > 0) {
      items = rawItems.map(([key, val]) => {
        let label = val.dimension || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let status = val.status || 'Evaluated';
        let type = 'neutral';

        const s = status.toLowerCase();
        if (s.includes('evaluated') || s.includes('active') || s.includes('checked') || s.includes('used')) {
          status = status.startsWith('✓') ? status : `✓ ${status}`;
          type = 'success';
        } else if (s.includes('not provided') || s.includes('missing') || s.includes('none')) {
          status = status.startsWith('—') ? status : `— ${status}`;
          type = 'neutral';
        } else if (s.includes('not applicable') || s.includes('n/a')) {
          status = status.startsWith('○') ? status : `○ ${status}`;
          type = 'neutral';
        } else if (s.includes('unavailable') || s.includes('error')) {
          status = status.startsWith('⚠') ? status : `⚠ ${status}`;
          type = 'warning';
        } else if (s.includes('no match')) {
          status = status.startsWith('✓') ? status : `✓ No match`;
          type = 'neutral';
        } else if (s.includes('match')) {
          status = status.startsWith('✓') ? status : `✓ Match found`;
          type = 'warning';
        }

        return { label, status, type };
      });
    }
  }

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
            <span className="material-symbols-outlined text-[19px]">fact_check</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              HOW DID WE CHECK IT?
            </h3>
            <p className="text-xs text-slate-500">
              Evidence coverage across analytical models, external feeds, and threat memory.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
          {items.length} Dimensions
        </span>
      </div>

      {/* Compact Coverage Grid */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 flex items-center justify-between gap-2.5 hover:bg-slate-50 transition"
          >
            <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              {item.label}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border shrink-0 ${getBadgeStyle(item.type)}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
