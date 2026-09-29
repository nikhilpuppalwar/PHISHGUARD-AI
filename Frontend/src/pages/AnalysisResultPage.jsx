import React, { useState } from 'react';
import ThreatAssessmentCard from '../components/ThreatAssessmentCard';
import OriginalSubmittedContent from '../components/OriginalSubmittedContent';
import WhyThisResultCard from '../components/WhyThisResultCard';
import ActionPlanList from '../components/ActionPlanList';
import PersonalizationContextPanel from '../components/PersonalizationContextPanel';
import EvidenceCoverageCard from '../components/EvidenceCoverageCard';
import WhatChangedComparison from '../components/WhatChangedComparison';
import RiskFactorsBreakdown from '../components/RiskFactorsBreakdown';
import SignalBar from '../components/SignalBar';
import AgentDeltaCard from '../components/AgentDeltaCard';
import ExternalThreatIntelligence from '../components/ExternalThreatIntelligence';
import AgentAnalysisTrace from '../components/AgentAnalysisTrace';
import InlineFeedbackCard from '../components/InlineFeedbackCard';
import FeedbackModal from '../components/FeedbackModal';

/**
 * PhishGuard AI — User-Friendly Threat Analysis Report (Spec §2 & §24)
 * Implements Progressive Disclosure:
 * 1. Report Header (Compact, sender/date/channel/quick actions)
 * 2. Threat Assessment (Prominent score, risk level, evidence-grounded summary, distinct Low/Med/High states)
 * 3. Your Submitted Content (Monospace sandbox, non-clickable links, copy button, line breaks, expand/collapse)
 * 4. Why This Result? & What Should You Do? (Side-by-side plain language evidence points & dynamic action plan)
 * 5. Why This Matters to You? (Personalized context & tailored explanation; hidden if no context)
 * 6. How Did We Check It? (Evidence Coverage compact matrix: Evaluated / Not provided / Not applicable / Unavailable)
 * 7. Similar Incident & Top Risk Factors (Side-by-side: compact RAG match + compact risk factors with View All)
 * 8. Technical Analysis (Collapsed by default! Expandable cards for Text, URL, Sender, External Intel GSB/VT)
 * 9. Detailed Explanation / Explainable AI (Collapsed by default! Overall finding, why flagged, agent evidence, risk interpretation)
 * 10. Technical Execution Trace (Collapsed by default! "11 execution stages completed [View Full Trace]")
 * 11. User Feedback (Was this helpful? [Yes/No], Was assessment correct? [Phishing/Legitimate/Unsure])
 * 12. About This Analysis & Limitations (Short methodology + limitations note)
 */
export default function AnalysisResultPage({ result, onNavigate }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackVerdict, setFeedbackVerdict] = useState(result?.user_feedback_state || null);
  const [technicalOpen, setTechnicalOpen] = useState(false);
  const [detailedExplainOpen, setDetailedExplainOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  if (!result) {
    return (
      <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200 shadow-2xs max-w-lg mx-auto my-12">
        <span className="material-symbols-outlined text-[42px] text-slate-400">find_in_page</span>
        <h2 className="text-base font-bold text-slate-800">No Threat Analysis Loaded</h2>
        <p className="text-xs text-slate-500">
          Please submit suspicious text or a link to view threat assessment results.
        </p>
        <button
          onClick={() => onNavigate('submit')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
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
    confidence = 0.85,
    attack_type,
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
    personalization_context,
    why_this_matters,
    user_role_context = 'Student',
    evidence_coverage,
    agent_trace,
    external_threat_intel,
    url_evidence,
    risk_factors = result.risk_factors || result.risk?.risk_factors || []
  } = result;

  const isLowRisk = overall_score < 40.0;
  const isMediumRisk = overall_score >= 40.0 && overall_score < 75.0;

  // Resolve user-friendly category title per Spec §4
  const displayAttackTitle = isLowRisk
    ? 'No Significant Phishing Attack Detected'
    : (attack_classification?.name || attack_type || (isMediumRisk ? 'Suspicious Message' : 'Targeted Phishing Attempt'));

  const displayAttackDescription = attack_classification?.description || attack_type_description;

  const displaySummary = isLowRisk
    ? 'No major phishing indicators were found in the available evidence.'
    : (explainability_details?.overall_finding || explanation || (
        isMediumRisk
          ? 'Some warning signs were detected. Verify the sender and destination before taking action.'
          : 'Multiple suspicious indicators were detected across the submitted content and available evidence.'
      ));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. REPORT HEADER (Spec §3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <button onClick={() => onNavigate('dashboard')} className="hover:text-blue-600 font-medium transition">
              Workspace
            </button>
            <span className="text-slate-300">/</span>
            <button onClick={() => onNavigate('incidents')} className="hover:text-blue-600 font-medium transition">
              Incidents
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold font-mono">
              #{submission_id?.slice(0, 8)}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Threat Analysis Report
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
            <span>Channel: <strong className="uppercase text-slate-800 font-semibold">{channel}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Sender: <strong className="text-slate-800 font-semibold">{sender || 'Not provided'}</strong></span>
            <span className="text-slate-300">•</span>
            <span>Scanned: <span className="font-medium text-slate-700">{new Date(submitted_at).toLocaleString()}</span></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFeedbackOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">rate_review</span>
            <span>{feedbackVerdict ? 'Update Feedback' : 'Feedback'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition"
            title="Print Report"
            aria-label="Print Report"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
          </button>
          <button
            onClick={() => onNavigate('submit')}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>New Analysis</span>
          </button>
        </div>
      </div>

      {/* 2. THREAT ASSESSMENT CARD (Spec §4, §5, §25, §26, §27) */}
      <ThreatAssessmentCard
        score={overall_score}
        severity={severity}
        confidence={confidence}
        attackType={displayAttackTitle}
        attackDescription={displayAttackDescription}
        summary={displaySummary}
      />

      {/* 3. ORIGINAL SUBMITTED CONTENT (Spec §6) */}
      <OriginalSubmittedContent
        content={original_content}
        channel={channel}
        sender={sender}
        subject={subject}
        extractedUrls={extracted_urls}
      />

      {/* 4. WHY THIS RESULT? & WHAT SHOULD YOU DO? (Spec §7 & §8) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WhyThisResultCard
          score={overall_score}
          whyFlagged={explainability_details?.why_flagged}
          majorIndicators={major_indicators}
          riskFactors={risk_factors}
          isLowRisk={isLowRisk}
        />

        <ActionPlanList
          actionPlan={action_plan}
          score={overall_score}
          userRole={personalization_context?.role || user_role_context || 'Student'}
          attackType={displayAttackTitle}
        />
      </div>

      {/* 5. WHY THIS MATTERS TO YOU? (Spec §9 & §10) */}
      <PersonalizationContextPanel
        personalizationContext={personalization_context}
        userRole={user_role_context}
        whyThisMatters={why_this_matters}
        baseScore={base_score ?? overall_score}
        personalizedScore={personalized_score ?? overall_score}
        profileRelevance={profile_relevance}
      />

      {/* 6. HOW DID WE CHECK IT? — EVIDENCE COVERAGE MATRIX (Spec §11) */}
      <EvidenceCoverageCard evidenceCoverage={evidence_coverage} />

      {/* 7. SIMILAR INCIDENT & TOP RISK FACTORS (Spec §12, §13, §14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WhatChangedComparison
          similarIncident={similar_incident}
          whatChanged={what_changed}
        />

        <RiskFactorsBreakdown
          riskFactors={risk_factors}
          majorIndicators={major_indicators}
        />
      </div>

      {/* 8. TECHNICAL ANALYSIS (Spec §15, §16) — Collapsed by default */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <div className="px-6 py-4 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600">
              <span className="material-symbols-outlined text-[19px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  TECHNICAL ANALYSIS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-200/80 text-slate-700">
                  Advanced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed evidence from the PhishGuard analysis engine.
              </p>
            </div>
          </div>

          <button
            onClick={() => setTechnicalOpen(!technicalOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">
              {technicalOpen ? 'expand_less' : 'expand_more'}
            </span>
            <span>{technicalOpen ? 'Collapse Technical Details' : 'Expand Technical Details'}</span>
          </button>
        </div>

        {technicalOpen && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 space-y-6">
            {/* Multi-Agent Signal Contribution Bar */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                Multi-Agent Signal Contribution
              </div>
              <SignalBar contributions={agent_contributions} />
            </div>

            {/* 4 Specialized Agent Delta Cards */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                Individual Agent Evidence & SHAP Attributions
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['url', 'text', 'sender', 'rag'].map((key) => (
                  <AgentDeltaCard
                    key={key}
                    agentKey={key}
                    data={agent_details?.[key] || {}}
                  />
                ))}
              </div>
            </div>

            {/* External Threat Intelligence (GSB & VirusTotal) */}
            <ExternalThreatIntelligence
              intel={external_threat_intel}
              urlEvidence={url_evidence || agent_details?.url?.evidence_object}
            />
          </div>
        )}
      </div>

      {/* 9. DETAILED EXPLANATION (Spec §17) — Collapsed by default */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
        <div className="px-6 py-4 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-[19px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  DETAILED EXPLANATION
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Explainable AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                For users who want to understand how the result was reached.
              </p>
            </div>
          </div>

          <button
            onClick={() => setDetailedExplainOpen(!detailedExplainOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition"
          >
            <span className="material-symbols-outlined text-[16px] text-slate-500">
              {detailedExplainOpen ? 'expand_less' : 'expand_more'}
            </span>
            <span>{detailedExplainOpen ? 'Collapse Details' : 'Expand Details'}</span>
          </button>
        </div>

        {detailedExplainOpen && (
          <div className="p-6 border-t border-slate-100 space-y-5 bg-white">
            {/* Overall Finding */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Overall Finding
              </h4>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                {explainability_details?.overall_finding || explanation || displaySummary}
              </p>
            </div>

            {/* Why It Was Flagged */}
            {explainability_details?.why_flagged && explainability_details.why_flagged.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Why It Was Flagged (Key Indicators)
                </h4>
                <ol className="space-y-2 list-none">
                  {explainability_details.why_flagged.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-800 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 border border-slate-200">
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
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Evidence by Agent
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  {Object.entries(explainability_details.evidence_by_agent).map(([agentKey, points]) => (
                    <div key={agentKey} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="font-mono text-xs font-bold uppercase text-slate-800 block">
                        {agentKey.toUpperCase()} AGENT
                      </span>
                      <ul className="space-y-1 list-disc list-inside text-slate-700 text-xs leading-relaxed">
                        {Array.isArray(points) ? points.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        )) : <li>{String(points)}</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Interpretation */}
            {explainability_details?.risk_interpretation && (
              <div className="pt-4 border-t border-slate-100 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Risk Interpretation
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed font-normal">
                  {explainability_details.risk_interpretation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10. TECHNICAL EXECUTION TRACE (Spec §19) — Collapsed by default */}
      <AgentAnalysisTrace agentTrace={agent_trace} />

      {/* 11. USER FEEDBACK (Spec §20) */}
      <InlineFeedbackCard
        submissionId={submission_id}
        currentVerdict={feedbackVerdict}
        onVerdictChange={(v) => setFeedbackVerdict(v)}
      />

      {/* 12. ABOUT THIS ANALYSIS & LIMITATIONS (Spec §21 & §22) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-blue-600">info</span>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
              ABOUT THIS ANALYSIS
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            This assessment combines machine learning, specialized AI agents, historical incident retrieval, external threat intelligence, risk analysis, and Generative AI.
          </p>
        </div>

        {/* Expandable Technical Methodology */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setMethodologyOpen(!methodologyOpen)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition"
          >
            <span>{methodologyOpen ? 'Hide Technical Methodology' : 'View Technical Methodology'}</span>
            <span className="material-symbols-outlined text-[15px]">
              {methodologyOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {methodologyOpen && (
            <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p>
                <strong>ML Models:</strong> Text NLP (TF-IDF + Logistic Regression), URL XGBoost on 14 structural features, Sender RFC authentication.
              </p>
              <p>
                <strong>RAG Memory:</strong> Vector similarity indexing against historical verified campaigns with a strict 0.55 similarity threshold.
              </p>
              <p>
                <strong>Risk Fusion:</strong> Deterministic Bayesian evidence calibration ensuring multi-source validation before risk score elevation.
              </p>
              <p>
                <strong>Explainable AI:</strong> TreeSHAP and linear feature attributions bounding AI reasoning strictly to observable characteristics.
              </p>
            </div>
          )}
        </div>

        {/* Limitations Notice */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2">
          <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
            Analysis Note & Limitations
          </div>
          <ul className="space-y-1 text-xs text-slate-600 leading-relaxed list-disc list-inside">
            <li>A result not appearing in a threat database does not guarantee that the content is safe.</li>
            <li>The assessment reflects the evidence available at analysis time.</li>
            <li>Missing sender/header information may limit sender authentication.</li>
            <li>External service outages may reduce available intelligence evidence.</li>
          </ul>
        </div>
      </div>

      {/* Feedback Modal (for full feedback modal dialog) */}
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
