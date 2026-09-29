import React from 'react';

/**
 * AgentDeltaCard Component (Spec §17)
 * Renders agent attribution deltas and detailed evidence factors.
 * For URL Agent, renders the dedicated URL ML + External Threat Intelligence panel.
 */
export default function AgentDeltaCard({ agentKey, data = {} }) {
  const isUrlAgent = agentKey === 'url';

  const meta = {
    url: {
      title: 'URL Agent',
      model: data.model_name || 'XGBoost (PhiUSIIL 14f)',
      color: '#0284C7'
    },
    text: {
      title: 'Text Agent',
      model: data.model_name || 'TF-IDF + Logistic Regression',
      color: '#2563EB'
    },
    sender: {
      title: 'Sender Agent',
      model: data.model_name || 'Random Forest Classifier',
      color: '#4F46E5'
    },
    rag: {
      title: 'Incident Memory',
      model: data.model_name || 'RAG Vector Similarity',
      color: '#7C3AED'
    }
  }[agentKey] || {
    title: agentKey,
    model: 'AI Agent',
    color: '#2563EB'
  };

  const delta = data.delta !== undefined ? data.delta : 0.25;
  const isHighDelta = delta >= 0.25;

  // Extract URL agent specific details (Spec §17)
  const evidenceObj = data.evidence_object || null;
  const extIntel = data.external_threat_intel || evidenceObj?.external_intelligence || null;
  const gsb = extIntel?.google_safe_browsing || null;
  const vt = extIntel?.virustotal || null;
  const mlProb = data.model_probability !== undefined ? Math.round(data.model_probability * 100) : null;

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
          <div>
            <div className="text-sm font-semibold text-slate-900 leading-tight">
              {meta.title}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {meta.model}
            </div>
          </div>
        </div>
        <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
          isHighDelta ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700'
        }`}>
          +{delta} Delta
        </span>
      </div>

      {/* URL Agent Dedicated Panel (Spec §17) */}
      {isUrlAgent && (
        <div className="space-y-3 pt-1">
          {/* URL ML Section */}
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              URL ML Diagnostics
            </span>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Model:</span>
              <span className="font-semibold text-slate-800">XGBoost (PhiUSIIL)</span>
            </div>
            {mlProb !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Phishing Probability:</span>
                <span className={`font-bold ${mlProb >= 70 ? 'text-red-600' : mlProb >= 40 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {mlProb}%
                </span>
              </div>
            )}
          </div>

          {/* External Intelligence Subpanel */}
          {extIntel && (
            <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 space-y-1.5 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-blue-900 block">
                External Intelligence Corroboration
              </span>
              <div className="text-slate-700">
                <span className="text-slate-500 block text-[10px]">Google Safe Browsing:</span>
                <span className="font-medium">
                  {gsb?.known_threat
                    ? `Known Threat (${gsb.threat_types?.join(', ') || 'MALICIOUS'})`
                    : gsb?.checked
                    ? 'Not identified as a known Google Safe Browsing threat'
                    : 'Unavailable'}
                </span>
              </div>
              <div className="text-slate-700 pt-1 border-t border-blue-100">
                <span className="text-slate-500 block text-[10px]">VirusTotal:</span>
                <span className="font-medium">
                  {vt?.checked
                    ? `${vt.detection_ratio || '0/0'} detections (${vt.malicious > 0 ? 'Malicious' : 'No detections reported'})`
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          )}

          {/* Agent Interpretation */}
          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono mb-1">
              Agent Interpretation:
            </span>
            <span>{data.summary || 'Elevated URL risk based on combined internal and external evidence.'}</span>
          </div>
        </div>
      )}

      {/* Standard Agent Summary for Non-URL Agents */}
      {!isUrlAgent && (
        <p className="text-xs text-slate-600 leading-relaxed">
          {data.summary || 'Analyzed inbound signals with standard confidence thresholds.'}
        </p>
      )}

      {/* Indicators List */}
      {data.indicators && data.indicators.length > 0 && (
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Extracted Evidence Factors:
          </span>
          <ul className="space-y-1 pl-1">
            {data.indicators.slice(0, 4).map((ind, i) => (
              <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                <span className="text-red-500 mt-1 text-[8px]">•</span>
                <span>{ind}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
