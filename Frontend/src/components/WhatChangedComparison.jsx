import React, { useState } from 'react';

/**
 * SimilarIncidentCard / WhatChangedComparison Component (Spec §12, §13, §18)
 * "SIMILAR INCIDENT"
 * Displays historical Incident Memory matches with strict thresholding:
 * - Match state: Similarity %, Attack category, common patterns, and expandable [View What Changed]
 * - No-match state: "NO SIMILAR INCIDENT FOUND - No previous incident met the configured similarity threshold."
 */
export default function WhatChangedComparison({
  similarIncident = null,
  whatChanged = null
}) {
  const [showComparison, setShowComparison] = useState(false);

  const hasMatch = similarIncident && (similarIncident.has_match !== false) && (similarIncident.similarity >= 0.55);

  if (!hasMatch) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <span className="material-symbols-outlined text-[19px]">history</span>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                SIMILAR INCIDENT
              </h3>
              <p className="text-xs text-slate-500">
                Historical correlation via organizational incident memory.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            Threshold: ≥55%
          </span>
        </div>

        <div className="p-6 flex items-start gap-3.5 flex-1 bg-white">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
            <span className="material-symbols-outlined text-[18px]">search_off</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              NO SIMILAR INCIDENT FOUND
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              No previous incident met the configured similarity threshold. This submission was analyzed independently from first principles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const similarityPct = Math.round(similarIncident.similarity * 100);
  const diffData = whatChanged || similarIncident.what_changed;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
            <span className="material-symbols-outlined text-[19px]">hub</span>
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              SIMILAR INCIDENT
            </h3>
            <p className="text-xs text-slate-500">
              Historical match found in organizational incident memory.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
          {similarityPct}% Similar
        </span>
      </div>

      {/* Body */}
      <div className="p-6 space-y-3.5 flex-1">
        <div className="space-y-1">
          <div className="text-sm font-bold text-slate-900 leading-snug">
            {similarIncident.title || 'Historical Phishing Pattern'}
          </div>
          {similarIncident.content_summary && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {similarIncident.content_summary}
            </p>
          )}
        </div>

        {/* Common Pattern Indicators */}
        {similarIncident.indicators && similarIncident.indicators.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
              Common Pattern:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {similarIncident.indicators.slice(0, 4).map((ind, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View What Changed Toggle Button */}
        {diffData && (
          <div className="pt-2">
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition"
            >
              <span className="material-symbols-outlined text-[16px]">
                {showComparison ? 'unfold_less' : 'compare_arrows'}
              </span>
              <span>{showComparison ? 'Hide Comparison' : 'View What Changed'}</span>
            </button>
          </div>
        )}

        {/* Expandable Comparison View */}
        {showComparison && diffData && (
          <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200/80 space-y-3 text-xs">
            <div className="font-bold text-purple-900 uppercase font-mono tracking-wider">
              Pattern Comparison Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-2.5 rounded-lg bg-white border border-purple-100 space-y-1">
                <span className="font-mono font-semibold text-slate-500 block">Previous Incident</span>
                <p className="text-slate-800 leading-relaxed font-normal">
                  {diffData.previous || 'Standard historical attack parameters.'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-purple-100 space-y-1">
                <span className="font-mono font-semibold text-purple-700 block">Current Submission</span>
                <p className="text-slate-800 leading-relaxed font-normal">
                  {diffData.current || 'Current variation submitted for analysis.'}
                </p>
              </div>
            </div>
            {diffData.differences && (
              <div className="text-slate-700">
                <strong className="font-semibold text-slate-900">Key Evolution:</strong> {diffData.differences}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
