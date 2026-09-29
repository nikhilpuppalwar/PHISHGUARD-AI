import React from 'react';

/**
 * WhatChangedComparison Component (Spec §9, §18)
 * Handles Incident Memory RAG matching:
 * 1. Strict threshold: Displays "No sufficiently similar previous incident found" if < 0.55 similarity.
 * 2. High confidence match: Displays similar incident details and side-by-side tactical differences ("What Changed?").
 */
export default function WhatChangedComparison({
  similarIncident = null,
  whatChanged = null
}) {
  const hasMatch = similarIncident && (similarIncident.has_match !== false) && (similarIncident.similarity >= 0.55);

  if (!hasMatch) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-[17px]">history</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Incident Memory & RAG Retrieval</h3>
              <p className="text-[11px] text-slate-500">
                Vector similarity search against verified enterprise threat repository.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Strict Threshold: ≥0.55
          </span>
        </div>

        <div className="p-5 flex items-start gap-3.5 bg-white">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-100">
            <span className="material-symbols-outlined text-[20px]">manage_search</span>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-slate-800">
              No sufficiently similar previous incident found
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              None of the historical threat records matched this submission with sufficient semantic vector similarity (similarity &lt; 55%). This submission was evaluated purely from first principles using independent multi-agent ML, structural heuristics, and real-time external threat intelligence feeds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const similarityPct = Math.round(similarIncident.similarity * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200/60 flex items-center justify-center text-purple-600">
            <span className="material-symbols-outlined text-[17px]">hub</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Incident Memory & RAG Retrieval</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                {similarityPct}% Vector Match
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Correlated with historical campaign in organizational incident memory.
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Matched: {similarIncident.attack_type || 'Phishing Attack'}
        </span>
      </div>

      {/* Matched Incident Overview */}
      <div className="p-5 border-b border-slate-100 bg-white space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900">{similarIncident.title}</span>
          {similarIncident.incident_id && (
            <span className="text-[10px] font-mono text-slate-400">({similarIncident.incident_id})</span>
          )}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {similarIncident.content_summary}
        </p>

        {similarIncident.indicators && similarIncident.indicators.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {similarIncident.indicators.map((ind, i) => (
              <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-700 border border-purple-100">
                {ind}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* What Changed Section (Spec §9, §18) */}
      {whatChanged && (
        <div className="p-5 bg-gradient-to-r from-purple-50/30 to-white space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-purple-600">compare_arrows</span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
              What Changed? (Tactical Campaign Evolution)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Historical traits */}
            <div className="p-3 rounded-lg bg-white border border-purple-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Previous Campaign Blueprint
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {whatChanged.previous_tactics || "Classic internship scam pattern demanding upfront fee via wire transfer."}
              </p>
            </div>

            {/* Current evolutions */}
            <div className="p-3 rounded-lg bg-white border border-purple-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                Current Variant Modifications
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {whatChanged.current_modifications || "Updated sender domain to mimic legitimate human resources, refined deadline urgency to 2 hours."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
