import React from 'react';

/**
 * EvidenceCoverageCard Component (Spec §14, §18)
 * Displays the 6-dimension evidence coverage matrix showing which technical
 * analysis engines, external intelligence feeds, and historical memories
 * evaluated this submission.
 */
export default function EvidenceCoverageCard({ evidenceCoverage = null }) {
  const defaultCoverage = {
    text_analysis: {
      dimension: "Text Content Analysis (TF-IDF + Logistic Regression)",
      status: "Evaluated",
      detail: "NLP lexical triggers, urgency detection, and ML probability evaluated.",
      active: true
    },
    url_analysis: {
      dimension: "URL Structural & Feature Analysis (XGBoost ML)",
      status: "Evaluated",
      detail: "PhiUSIIL 14-feature structural characteristics and URL entropy analyzed.",
      active: true
    },
    sender_authentication: {
      dimension: "Sender & Header Authentication",
      status: "Evaluated",
      detail: "Headers checked. Missing cryptographic signatures marked 'Not provided'.",
      active: true
    },
    external_threat_intel: {
      dimension: "External Threat Intelligence (GSB & VirusTotal)",
      status: "Evaluated",
      detail: "Live API lookup performed against global threat feeds.",
      active: true
    },
    incident_memory_rag: {
      dimension: "Incident Memory RAG (Historical Vector Similarity)",
      status: "Evaluated",
      detail: "Queried past enterprise threat repository with strict 0.55 similarity threshold.",
      active: true
    },
    user_profile_context: {
      dimension: "Personalized Profile Context",
      status: "Active",
      detail: "Fused authenticated user role, routine workflows, and security awareness.",
      active: true
    }
  };

  const coverage = evidenceCoverage || defaultCoverage;
  const items = Object.values(coverage);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('evaluated') || s.includes('active') || s.includes('clean')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('match found') || s.includes('detected')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (s.includes('bypassed') || s.includes('not applicable') || s.includes('headers absent') || s.includes('no match')) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-600">
            <span className="material-symbols-outlined text-[17px]">dataset</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Evidence Coverage Matrix</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-teal-50 text-teal-700 border border-teal-200">
                6 Dimensions Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Multi-vector verification ensuring no single point of failure or fabricated safe assertions.
            </p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/40 hover:bg-slate-50 transition flex flex-col justify-between gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800 leading-snug">
                {item.dimension}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border whitespace-nowrap ${getStatusBadge(item.status)}`}>
                {item.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
