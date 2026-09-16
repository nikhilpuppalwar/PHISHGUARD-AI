import React, { useState } from 'react';
import aiVisualization from '../assets/ai_visualization.png';

export default function LandingPage({ onNavigate }) {
  const [activeInspectorTab, setActiveInspectorTab] = useState('overview');

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
      {/* Top Ambient Glow Wash */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-blue-200/40 via-blue-50/50 to-transparent blur-3xl pointer-events-none" />

        {/* 1. HERO SECTION */}
        <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-14 pb-16">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/80">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-semibold text-blue-600 tracking-wider uppercase font-mono">
                Multi-Agent Threat Intelligence
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-600">
                Explainable GenAI Risk Analysis
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Beyond Binary Detection: <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent">
                Explainable, Personalized
              </span> Phishing Risk Analysis
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              PhishGuard AI coordinates specialized Text, URL, and Sender ML agents with vector RAG context to assess threat severity, expose attack mechanics, and deliver personalized action plans.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('submit')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">shield</span>
                <span>Test Suspicious Input</span>
              </button>
              <a
                href="#pipeline-architecture"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200 shadow-sm transition"
              >
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                <span>Explore 8-Stage Architecture</span>
              </a>
            </div>

            {/* Trust Indicator Bar */}
            <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 w-full max-w-4xl text-left">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-blue-600 text-[22px] mt-0.5">query_stats</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">99.4% Verified</div>
                  <div className="text-[11px] text-slate-500">Multi-source benchmark</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-emerald-600 text-[22px] mt-0.5">verified_user</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">Zero Execution</div>
                  <div className="text-[11px] text-slate-500">Safe heuristic parsing</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-indigo-600 text-[22px] mt-0.5">attribution</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">SHAP Attribution</div>
                  <div className="text-[11px] text-slate-500">Feature contribution deltas</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-purple-600 text-[22px] mt-0.5">database</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">Vector RAG</div>
                  <div className="text-[11px] text-slate-500">ChromaDB semantic anchors</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. LIVE INTERACTIVE THREAT INSPECTOR PREVIEW */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-10" id="threat-inspector">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* Window Title Bar */}
          <div className="bg-[#0B1220] px-6 py-3.5 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <span className="text-xs font-mono text-slate-400 ml-2">
                PhishGuard Autonomous Triage Inspector • v2.0
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Multi-Agent Pipeline Active
              </span>
              <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-medium">
                Session: #INC-2025-0841
              </span>
            </div>
          </div>

          {/* Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Column: Input Payload & Extracted Metadata */}
            <div className="lg:col-span-5 p-6 bg-slate-50/70 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                  Extracted Inbound Payload
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">mail</span> E-Mail / Ingestion
                </span>
              </div>

              {/* Email Mock Body Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">From:</span>
                    <span className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      hr-verify@quick-career.org
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">Channel:</span>
                    <span className="text-slate-700">Inbound External Gateway</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">Embedded:</span>
                    <span className="text-blue-600 underline truncate">http://bit.ly/internship-fee-2024</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg font-mono border border-slate-100">
                    “Congratulations! You have been selected for the Summer Analyst internship program. Pay <span className="bg-red-100 text-red-700 font-bold px-1 rounded">₹2,000 within 2 hours</span> using the secure portal link below to reserve your slot and generate the candidate pass: <span className="text-blue-600 font-semibold">bit.ly/internship-fee-2024</span>. Failure to process immediately releases the allocation.”
                  </p>
                </div>
              </div>

              {/* Pre-triage Metadata Attributes */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block font-mono">
                  Static Heuristic Signatures
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">DKIM / SPF</span>
                    <span className="text-red-600 font-semibold">SPF Softfail / No DMARC</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Domain Age</span>
                    <span className="text-amber-600 font-semibold">4 Days Old</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Payment Type</span>
                    <span className="text-red-600 font-semibold">Advance Upfront Fee</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-400 block text-[10px]">Target Persona</span>
                    <span className="text-blue-600 font-semibold">University Student</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Real-time Multi-Agent Diagnostic Engine */}
            <div className="lg:col-span-7 p-6 space-y-5">
              {/* Header Risk Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/70 border border-red-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
                      High Risk Attack Confirmed
                    </span>
                    <span className="text-xs font-mono text-slate-500">Confidence: 97.8%</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Internship Scam (Credential & Advance-Fee Phishing)
                  </h2>
                </div>
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-red-200 shadow-sm shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Threat Score</div>
                    <div className="text-3xl font-extrabold text-red-600">
                      91<span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                </div>
              </div>

              {/* Signal Contribution Bar */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Multi-Agent Signal Contribution Bar</span>
                  <span className="font-mono text-slate-500 text-[11px]">Weighted Bayesian Fusion</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div className="bg-[#06B6D4] h-full" style={{ width: '41%' }} title="URL: 41%" />
                  <div className="bg-[#3B82F6] h-full" style={{ width: '32%' }} title="Text: 32%" />
                  <div className="bg-[#6366F1] h-full" style={{ width: '18%' }} title="Sender: 18%" />
                  <div className="bg-[#8B5CF6] h-full" style={{ width: '9%' }} title="RAG: 9%" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]" />URL Agent: 41%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" />Text Agent: 32%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366F1]" />Sender Agent: 18%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />RAG Context: 9%</span>
                </div>
              </div>

              {/* Detailed 4-Agent Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />URL Agent (XGBoost)
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600">+0.41 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Shortened URL masking suspicious redirect destination. DOM mismatch and untrusted SSL hierarchy.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />Text Agent (TF-IDF + LR)
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600">+0.32 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    High synthetic urgency (“within 2 hours”), immediate advance-fee demand (₹2,000), coercive psychological pressure.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#6366F1]" />Sender Agent (Random Forest)
                    </span>
                    <span className="text-xs font-mono font-bold text-red-600">+0.18 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    Unauthenticated sender domain. Domain newly registered (&lt; 5 days) without valid corporate DMARC policy.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />Phishing RAG (ChromaDB)
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600">+0.09 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-900">91% semantic match</strong> to confirmed campus recruitment scam vectors in vector memory.
                  </p>
                </div>
              </div>

              {/* Personalized Action Plan Snippet */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                    Personalized Action Plan (Role: University Student)
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Tier 1 Guidance
                  </span>
                </div>
                <ul className="text-xs text-slate-800 space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li><strong>Do NOT transfer money:</strong> Legitimate internships never demand registration fees or upfront deposits.</li>
                  <li><strong>Cross-Verify:</strong> Contact your university placement cell or visit the official employer careers portal.</li>
                  <li><strong>Quarantine:</strong> Forward to your campus IT abuse desk (abuse@university.edu).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 8-STAGE MULTI-AGENT ENGINE PIPELINE */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16" id="pipeline-architecture">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            Deterministic Intelligence Pipeline
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The 8-Stage Multi-Agent Analysis Engine
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Moving past single-point classifier failures through coordinated autonomous agents that validate context, verify infrastructure, and synthesize explainable evidence.
          </p>
        </div>

        {/* 8-Stage Sequential Flow Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { num: 1, name: 'Understand', desc: 'User Context RAG' },
            { num: 2, name: 'Preprocess', desc: 'Auto-Extraction' },
            { num: 3, name: 'Analyze ML', desc: 'Parallel Agents' },
            { num: 4, name: 'Retrieve', desc: 'ChromaDB Cases' },
            { num: 5, name: 'Assess', desc: 'Bayesian Fusion' },
            { num: 6, name: 'Explain', desc: 'SHAP Attribution' },
            { num: 7, name: 'Personalize', desc: 'Role Guidance' },
            { num: 8, name: 'Learn', desc: 'Incident Memory' },
          ].map((stage) => (
            <div key={stage.num} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center space-y-1.5">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                {stage.num}
              </span>
              <div className="text-xs font-bold text-slate-900">{stage.name}</div>
              <div className="text-[10px] text-slate-500 font-mono">{stage.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-[#0B1220] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">PhishGuard AI</span>
            <span className="text-xs text-slate-500 font-mono">| Capstone Cybersecurity Platform</span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Designed for Applied AI in Cybersecurity • All models verified
          </div>
        </div>
      </footer>
    </div>
  );
}
