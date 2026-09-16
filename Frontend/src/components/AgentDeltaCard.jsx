import React from 'react';

export default function AgentDeltaCard({ agentKey, data = {} }) {
  const meta = {
    url: {
      title: 'URL Agent',
      model: data.model_name || 'XGBoost (PhiUSIIL 54f)',
      color: '#06B6D4',
      bgGlow: 'border-cyan-500/30'
    },
    text: {
      title: 'Text Agent',
      model: data.model_name || 'TF-IDF + Logistic Regression',
      color: '#3B82F6',
      bgGlow: 'border-blue-500/30'
    },
    sender: {
      title: 'Sender Agent',
      model: data.model_name || 'Random Forest',
      color: '#6366F1',
      bgGlow: 'border-indigo-500/30'
    },
    rag: {
      title: 'Phishing RAG',
      model: data.model_name || 'ChromaDB Vector Retrieval',
      color: '#8B5CF6',
      bgGlow: 'border-purple-500/30'
    }
  }[agentKey] || {
    title: agentKey,
    model: 'AI Agent',
    color: '#3B82F6',
    bgGlow: 'border-slate-200'
  };

  const delta = data.delta !== undefined ? data.delta : 0.25;
  const isHighDelta = delta >= 0.25;

  return (
    <div className={`p-4 rounded-xl bg-white border ${meta.bgGlow} shadow-sm space-y-2.5 transition hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }}></span>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">
              {meta.title}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {meta.model}
            </div>
          </div>
        </div>
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
          isHighDelta ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700'
        }`}>
          +{delta} Delta
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        {data.summary || 'Analyzed inbound signals with standard confidence thresholds.'}
      </p>

      {data.indicators && data.indicators.length > 0 && (
        <div className="pt-1.5 border-t border-slate-100 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Extracted Evidence:
          </span>
          <ul className="space-y-1 pl-1">
            {data.indicators.slice(0, 3).map((ind, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="text-red-500 mt-0.5 text-[10px]">•</span>
                <span>{ind}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
