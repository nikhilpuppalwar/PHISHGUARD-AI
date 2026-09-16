import React, { useState } from 'react';
import RiskGauge from '../components/RiskGauge';
import SignalBar from '../components/SignalBar';
import AgentDeltaCard from '../components/AgentDeltaCard';
import ActionPlanList from '../components/ActionPlanList';
import FeedbackModal from '../components/FeedbackModal';

export default function AnalysisResultPage({ result, onNavigate }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState(result?.user_feedback_state || null);

  if (!result) {
    return (
      <div className="p-12 text-center space-y-4">
        <span className="material-symbols-outlined text-[48px] text-slate-300">find_in_page</span>
        <h2 className="text-lg font-bold text-slate-800">No Analysis Result Loaded</h2>
        <button
          onClick={() => onNavigate('submit')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
        >
          Submit a Threat to Analyze
        </button>
      </div>
    );
  }

  const {
    submission_id,
    submitted_at,
    channel,
    sender,
    extracted_urls,
    overall_score,
    severity,
    confidence,
    attack_type,
    attack_type_description,
    agent_contributions,
    agent_details,
    major_indicators,
    similar_incident,
    explanation,
    action_plan,
    user_role_context
  } = result;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600">
              Workspace
            </button>
            <span>/</span>
            <button onClick={() => onNavigate('incidents')} className="hover:text-blue-600">
              Incidents
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">#{submission_id?.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Threat Analysis Report
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
            <span>Channel: <strong className="uppercase text-slate-700">{channel}</strong></span>
            <span>•</span>
            <span>Sender: <strong className="text-slate-700">{sender || 'Anonymous'}</strong></span>
            <span>•</span>
            <span>Scanned: {new Date(submitted_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            <span>{feedbackVerdict ? 'Update Feedback' : 'Provide Feedback'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Print or Export Report"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
          </button>
          <button
            onClick={() => onNavigate('submit')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Scan Another</span>
          </button>
        </div>
      </div>

      {/* Verified feedback banner if present */}
      {feedbackVerdict && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-800">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">verified</span>
            <span>
              Recorded Feedback Status: <strong className="uppercase">{feedbackVerdict.replace('_', ' ')}</strong>
            </span>
          </div>
          <button onClick={() => setFeedbackOpen(true)} className="underline text-blue-700 font-medium">
            Change
          </button>
        </div>
      )}

      {/* 1. COMPOSITE THREAT SCORE GAUGE */}
      <RiskGauge score={overall_score} severity={severity} confidence={confidence} />

      {/* 2. ATTACK TYPE CATEGORY BANNER */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[22px]">category</span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Attack Classification
            </span>
          </div>
          <button
            onClick={() => onNavigate('glossary')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Learn about this threat in Attack Glossary</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>
        <h3 className="text-lg font-bold text-slate-900">{attack_type}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {attack_type_description || 'Identified based on semantic correlation of urgency, payment requests, and link infrastructure.'}
        </p>
      </div>

      {/* 3. MULTI-AGENT SIGNAL CONTRIBUTION BAR */}
      <SignalBar contributions={agent_contributions} />

      {/* 4. DETAILED 4-AGENT SHAP DELTA CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['url', 'text', 'sender', 'rag'].map((key) => (
          <AgentDeltaCard
            key={key}
            agentKey={key}
            data={agent_details?.[key] || {}}
          />
        ))}
      </div>

      {/* 5. PHISHING RAG VECTOR SIMILARITY MATCH */}
      {similar_incident && (
        <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900">
              <span className="material-symbols-outlined text-[22px]">hub</span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                ChromaDB Vector Incident Memory Match
              </span>
            </div>
            <span className="text-xs font-mono font-bold bg-purple-200 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-300">
              {(similar_incident.similarity * 100).toFixed(0)}% Semantic Overlap
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">{similar_incident.title}</h4>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {similar_incident.content_summary}
            </p>
          </div>
          {similar_incident.indicators && similar_incident.indicators.length > 0 && (
            <div className="pt-2 border-t border-purple-200/60">
              <span className="text-[10px] font-mono text-purple-900 font-semibold uppercase block mb-1">
                Matched Incident Signatures:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {similar_incident.indicators.map((ind, i) => (
                  <span key={i} className="text-[10px] bg-white text-purple-900 px-2 py-0.5 rounded border border-purple-200 font-medium">
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. GENAI GROUNDED EXPLANATION */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600 text-[20px]">psychology</span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            Explainable AI Threat Diagnostic
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
          {explanation}
        </p>
      </div>

      {/* 7. PERSONALIZED ACTION PLAN */}
      <ActionPlanList
        actionPlan={action_plan}
        userRole={user_role_context || 'Student'}
        attackType={attack_type}
      />

      {/* Feedback modal */}
      <FeedbackModal
        submissionId={submission_id}
        currentVerdict={feedbackVerdict}
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        onSubmitted={(v) => setFeedbackVerdict(v)}
      />
    </div>
  );
}
