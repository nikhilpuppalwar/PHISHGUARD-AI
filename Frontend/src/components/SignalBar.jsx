import React from 'react';

export default function SignalBar({ contributions = {} }) {
  const urlPct = contributions.url || 40;
  const textPct = contributions.text || 35;
  const senderPct = contributions.sender || 15;
  const ragPct = contributions.rag || 10;

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Multi-Agent Signal Contribution Bar
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          Composite Formula: Weighted Bayesian Fusion
        </span>
      </div>

      {/* Stacked Proportional Bar */}
      <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
        <div 
          className="bg-[#06B6D4] h-full transition-all duration-500" 
          style={{ width: `${urlPct}%` }} 
          title={`URL Intelligence: ${urlPct}%`}
        />
        <div 
          className="bg-[#3B82F6] h-full transition-all duration-500" 
          style={{ width: `${textPct}%` }} 
          title={`Text Semantic Agent: ${textPct}%`}
        />
        <div 
          className="bg-[#6366F1] h-full transition-all duration-500" 
          style={{ width: `${senderPct}%` }} 
          title={`Sender Reputation Agent: ${senderPct}%`}
        />
        <div 
          className="bg-[#8B5CF6] h-full transition-all duration-500" 
          style={{ width: `${ragPct}%` }} 
          title={`Phishing RAG Vector Retrieval: ${ragPct}%`}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs font-mono text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]"></span>
          <span>URL Agent: <strong className="text-slate-800">{urlPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
          <span>Text Agent: <strong className="text-slate-800">{textPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]"></span>
          <span>Sender Agent: <strong className="text-slate-800">{senderPct}%</strong></span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
          <span>RAG Memory: <strong className="text-slate-800">{ragPct}%</strong></span>
        </span>
      </div>
    </div>
  );
}
