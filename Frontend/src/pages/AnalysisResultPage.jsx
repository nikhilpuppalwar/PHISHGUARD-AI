import React, { useState } from 'react';
import RiskGauge from '../components/RiskGauge';
import SignalBar from '../components/SignalBar';
import AgentDeltaCard from '../components/AgentDeltaCard';
import ActionPlanList from '../components/ActionPlanList';
import PersonalizedRecommendationsCard from '../components/PersonalizedRecommendationsCard';
import FeedbackModal from '../components/FeedbackModal';
import ExternalThreatIntelligence from '../components/ExternalThreatIntelligence';
import OriginalSubmittedContent from '../components/OriginalSubmittedContent';
import PersonalizationContextPanel from '../components/PersonalizationContextPanel';
import BeforeYouActChecklist from '../components/BeforeYouActChecklist';
import EvidenceCoverageCard from '../components/EvidenceCoverageCard';
import AgentAnalysisTrace from '../components/AgentAnalysisTrace';
import WhatChangedComparison from '../components/WhatChangedComparison';

/**
 * Threat Analysis Report Page (Master Spec §18)
 * Assembles the full, evidence-grounded threat diagnostic report featuring:
 * 1. Detailed Evidence-Grounded Explanation (Why This Message Is Risky)
 * 2. Dynamic Action Plan (Operational Response)
 * 3. Personalized Recommendations (Tailored to Profile & Awareness)
 */
export default function AnalysisResultPage({ result, onNavigate }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState(result?.user_feedback_state || null);

  if (!result) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-xl border border-slate-200 shadow-2xs max-w-lg mx-auto my-12">
        <span className="material-symbols-outlined text-[42px] text-slate-400">find_in_page</span>
        <h2 className="text-base font-bold text-slate-800">No Threat Analysis Loaded</h2>
        <p className="text-xs text-slate-500">
          Please submit suspicious text or a link from the Threat Studio to view diagnostic results.
        </p>
        <button
          onClick={() => onNavigate('submit')}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition"
        >
          Submit Content to Analyze
        </button>
      </div>
    );
  }

  const {
    submission_id,
    submitted_at,
    original_content,
    channel = 'email',
    sender,
    subject,
    extracted_urls = [],
    overall_score = 0,
    base_score,
    personalized_score,
    profile_relevance,
    severity = 'Low Risk',
    confidence = 0.8,
    attack_type = 'Generic Phishing',
    attack_type_description,
    attack_classification,
    agent_contributions = {},
    agent_details = {},
    explainability_details,
    major_indicators = [],
    similar_incident,
    what_changed,
    explanation,
    action_plan = [],
    personalized_recommendations = [],
    personalization_context,
    why_this_matters,
    before_you_act,
    user_role_context = 'Student',
    evidence_coverage,
    agent_trace,
    external_threat_intel,
    url_evidence
  } = result;

  // Determine attack classification banner status
  const isLowRisk = overall_score < 40.0;
  const isMediumRisk = overall_score >= 40.0 && overall_score < 75.0;
  const isHighRisk = overall_score >= 75.0;

  const displayAttackTitle = attack_classification?.name || attack_type || (
    isLowRisk ? "No significant phishing attack detected" : (
      isMediumRisk ? "Suspicious / Possible Social Engineering" : "Credential Phishing"
    )
  );

  const displayAttackDescription = attack_classification?.description || attack_type_description || (
    isLowRisk
      ? "Content does not demonstrate active phishing indicators, credential harvesting, or deceptive payload infrastructure."
      : "Semantic and structural patterns suggest social engineering, deceptive solicitation, or unauthorized access attempts."
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. Header & Breadcrumbs & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 transition">
              Workspace
            </button>
            <span>/</span>
            <button onClick={() => onNavigate('incidents')} className="hover:text-blue-600 transition">
              Incidents
            </button>
            <span>/</span>
            <span className="text-slate-800 font-semibold font-mono">#{submission_id?.slice(0, 8)}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Threat Analysis Report
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono text-slate-500">
            <span>Channel: <strong className="uppercase text-slate-700">{channel}</strong></span>
            <span>•</span>
            <span>Sender: <strong className="text-slate-700">{sender || 'None specified'}</strong></span>
            <span>•</span>
            <span>Scanned: {new Date(submitted_at).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">rate_review</span>
            <span>{feedbackVerdict ? 'Update Feedback' : 'Provide Feedback'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition"
            title="Print Report"
            aria-label="Print Report"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
          </button>
          <button
            onClick={() => onNavigate('submit')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* Verified feedback banner if present */}
      {feedbackVerdict && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">check_circle</span>
            <span>
              Recorded Feedback Status: <strong className="uppercase font-mono">{feedbackVerdict.replace('_', ' ')}</strong>
            </span>
          </div>
          <button onClick={() => setFeedbackOpen(true)} className="underline text-blue-700 font-medium">
            Change
          </button>
        </div>
      )}

      {/* 2. COMPOSITE THREAT RISK SCORE GAUGE */}
      <RiskGauge score={overall_score} severity={severity} confidence={confidence} />

      {/* 3. ORIGINAL SUBMITTED CONTENT (Spec §3, §18) */}
      <OriginalSubmittedContent
        content={original_content}
        channel={channel}
        sender={sender}
        subject={subject}
        extractedUrls={extracted_urls}
      />

      {/* 4. ATTACK TYPE CATEGORY BANNER (Spec §6, §18) */}
      <div className={`p-5 rounded-xl border shadow-2xs space-y-2 transition-all ${
        isLowRisk
          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950'
          : (isMediumRisk
              ? 'bg-amber-50/40 border-amber-200 text-amber-950'
              : 'bg-white border-slate-200 text-slate-900')
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[20px] ${
              isLowRisk ? 'text-emerald-600' : (isMediumRisk ? 'text-amber-600' : 'text-slate-700')
            }`}>
              category
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Attack Classification
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
              isLowRisk
                ? 'bg-emerald-100/70 text-emerald-800 border-emerald-200'
                : (isMediumRisk
                    ? 'bg-amber-100/70 text-amber-800 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200')
            }`}>
              {attack_classification?.category || (isLowRisk ? 'Benign' : (isMediumRisk ? 'Suspicious' : 'Malicious'))}
            </span>
          </div>

          <button
            onClick={() => onNavigate('glossary')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Threat Taxonomy</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <h3 className="text-base font-bold tracking-tight">
          {displayAttackTitle}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {displayAttackDescription}
        </p>
      </div>

      {/* 5. GENERATIVE SECURITY ASSESSMENT — WHY THIS MESSAGE IS RISKY (Task Section 1 & 6) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[17px]">psychology</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Generative Security Assessment
              </h3>
              <p className="text-[11px] text-slate-500">
                Detailed evidence-grounded AI forensic explanation of why this input was flagged.
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Why This Message Is Risky
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Overall finding */}
          <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Overall Finding
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
              {explainability_details?.overall_finding || explanation}
            </p>
          </div>

          {/* Numbered Why Flagged List */}
          {explainability_details?.why_flagged && explainability_details.why_flagged.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Why It Was Flagged (Key Indicators)
              </h4>
              <ol className="space-y-2 list-none">
                {explainability_details.why_flagged.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Evidence by Agent */}
          {explainability_details?.evidence_by_agent && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Evidence by Agent
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {Object.entries(explainability_details.evidence_by_agent).map(([agentKey, points]) => (
                  <div key={agentKey} className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/60 space-y-1.5">
                    <span className="font-mono text-[11px] font-bold uppercase text-slate-700 block">
                      {agentKey.toUpperCase()} AGENT
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                      {Array.isArray(points) ? points.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      )) : <li>{String(points)}</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incident Memory Context if available */}
          {explainability_details?.incident_context && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Incident Memory Context
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {explainability_details.incident_context}
              </p>
            </div>
          )}

          {/* Risk Interpretation */}
          {explainability_details?.risk_interpretation && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk Interpretation
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {explainability_details.risk_interpretation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 6. DYNAMIC ACTION PLAN (Task Section 2 & 6) */}
      <ActionPlanList
        actionPlan={action_plan}
        userRole={personalization_context?.role || user_role_context || 'Student'}
        attackType={displayAttackTitle}
      />

      {/* 7. PERSONALIZED RECOMMENDATIONS (Task Section 3 & 6) */}
      <PersonalizedRecommendationsCard
        recommendations={personalized_recommendations}
        context={personalization_context}
        whyThisMatters={why_this_matters}
        userRole={user_role_context}
      />

      {/* 8. BEFORE YOU ACT CHECKLIST */}
      <BeforeYouActChecklist items={before_you_act} />

      {/* 9. PERSONALIZATION CONTEXT PANEL */}
      <PersonalizationContextPanel
        personalizationContext={personalization_context}
        userRole={user_role_context}
        whyThisMatters={null}
        baseScore={base_score ?? overall_score}
        personalizedScore={personalized_score ?? overall_score}
        profileRelevance={profile_relevance}
      />

      {/* 10. INCIDENT MEMORY & RAG RETRIEVAL (Spec §9, §18) */}
      <WhatChangedComparison
        similarIncident={similar_incident}
        whatChanged={what_changed}
      />

      {/* 11. EXTERNAL THREAT INTELLIGENCE (Spec §8, §18) */}
      <ExternalThreatIntelligence
        intel={external_threat_intel}
        urlEvidence={url_evidence || agent_details?.url?.evidence_object}
      />

      {/* 12. MULTI-AGENT SIGNAL CONTRIBUTION BAR */}
      <SignalBar contributions={agent_contributions} />

      {/* 12. DETAILED 4-AGENT SHAP DELTA CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['url', 'text', 'sender', 'rag'].map((key) => (
          <AgentDeltaCard
            key={key}
            agentKey={key}
            data={agent_details?.[key] || {}}
          />
        ))}
      </div>

      {/* 13. EVIDENCE COVERAGE MATRIX (Spec §14, §18) */}
      <EvidenceCoverageCard evidenceCoverage={evidence_coverage} />

      {/* 14. PIPELINE EXECUTION TRACE (Spec §13, §18) */}
      <AgentAnalysisTrace agentTrace={agent_trace} />

      {/* 15. FORENSIC ANALYSIS NOTE & LIMITATIONS */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="material-symbols-outlined text-[16px] text-slate-500">info</span>
          <span>Forensic Methodology & Limitations</span>
        </div>
        <p className="leading-relaxed">
          Diagnostic results are synthesized using deterministic Bayesian evidence fusion of specialized machine learning models (TF-IDF + Logistic Regression, PhiUSIIL XGBoost, Random Forest), live external threat intelligence (Google Safe Browsing, VirusTotal API v3), and organizational vector Incident RAG. Risk scores reflect observable characteristics at evaluation time and do not execute embedded active payloads.
        </p>
      </div>

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
