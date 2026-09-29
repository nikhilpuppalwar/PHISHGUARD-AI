import React from 'react';

export default function SignalBar({ contributions = {} }) {
  const urlPct = contributions.url !== undefined ? contributions.url : 40;
  const textPct = contributions.text !== undefined ? contributions.text : 35;
  const senderPct = contributions.sender !== undefined ? contributions.sender : 15;
  const ragPct = contributions.rag !== undefined ? contributions.rag : 10;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
          Agent Signal Contribution Breakdown
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          Formula: Calibrated Bayesian Weights
        </span>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
        <div 
          className="bg-[#0284C7] h-full transition-all duration-300" 
          style={{ width: `${urlPct}%` }} 
          title={`URL Intelligence: ${urlPct}%`}
        />
        <div 
          className="bg-[#2563EB] h-full transition-all duration-300" 
          style={{ width: `${textPct}%` }} 
          title={`Text Semantic Agent: ${textPct}%`}
        />
        <div 
          className="bg-[#4F46E5] h-full transition-all duration-300" 
          style={{ width: `${senderPct}%` }} 
          title={`Sender Reputation Agent: ${senderPct}%`}
        />
        <div 
          className="bg-[#7C3AED] h-full transition-all duration-300" 
          style={{ width: `${ragPct}%` }} 
          title={`Incident RAG Vector Retrieval: ${ragPct}%`}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs font-mono text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
          <span>URL Agent: <strong className="text-slate-800">{urlPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          <span>Text Agent: <strong className="text-slate-800">{textPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />
          <span>Sender Agent: <strong className="text-slate-800">{senderPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
          <span>Incident Memory: <strong className="text-slate-800">{ragPct}%</strong></span>
        </span>
      </div>
    </div>
  );
}
