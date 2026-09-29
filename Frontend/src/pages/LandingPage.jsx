import React, { useState } from 'react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="flex flex-col items-center text-center space-y-5 max-w-4xl mx-auto">
          {/* Project Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="font-semibold text-blue-700 uppercase font-mono tracking-wider">
              MDM Capstone Project
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              Applied Artificial Intelligence in Cybersecurity
            </span>
          </div>

          {/* Project Title & Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.2]">
              Personalized Multi-Agent Phishing Detection <br className="hidden sm:inline" />
              and Explainable Risk Analysis
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Moving beyond binary spam filters. PhishGuard AI combines specialized machine learning models (Text NLP, URL XGBoost, Sender Random Forest) with user security profiling to explain why threats are dangerous and provide role-tailored action guidance.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-xs transition"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Try Live Threat Analysis</span>
            </button>
            <a
              href="#pipeline-architecture"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium border border-slate-200 shadow-xs transition"
            >
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
              <span>View System Pipeline</span>
            </a>
            <button
              onClick={() => onNavigate('glossary')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 transition"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              <span>Attack Type Glossary</span>
            </button>
          </div>

          {/* Key Capabilities Grid */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full max-w-4xl text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">hub</span>
                <span>3 Specialized ML Agents</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                TF-IDF + Logistic Regression, XGBoost (54 URL features), and Random Forest sender checks.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">account_circle</span>
                <span>Contextual User Profiling</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Adapts risk assessments and advice based on user role, active services, and security tier.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">psychology</span>
                <span>Explainable AI (XAI)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Transparent SHAP attribution deltas showing exactly what factors triggered the score.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
                <span>Incident Memory (RAG)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Vector similarity matching against confirmed historical incidents to detect variations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE THREAT INSPECTOR DEMO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="threat-inspector">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-navy-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-blue-400">shield</span>
              <span className="text-sm font-mono font-semibold tracking-wide text-white">
                Interactive Analysis Walkthrough
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200 border border-slate-700 font-medium">
                Sample: Internship Advance-Fee Scam
              </span>
            </div>
          </div>

          {/* Demo Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: Sample Payload */}
            <div className="lg:col-span-5 p-6 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Inbound Suspicious Communication
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  Email Channel
                </span>
              </div>

              {/* Sample Email Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs sm:text-sm">
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold">Sender:</span>
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 truncate font-medium">
                      hr-verify@quick-career.org
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold">Subject:</span>
                    <span className="text-slate-800 font-medium truncate">
                      Summer Analyst Internship Offer — Confirmation Fee Required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold">Link:</span>
                    <span className="text-blue-600 underline truncate font-medium">http://bit.ly/internship-fee-2024</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-800 leading-relaxed font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    "Congratulations! You have been selected for the Summer Analyst internship program. Pay <span className="bg-red-50 text-red-700 font-semibold px-1 rounded">₹2,000 within 2 hours</span> using the link below to reserve your candidate pass: <span className="text-blue-600 font-medium">bit.ly/internship-fee-2024</span>. Failure to process will release your seat to waiting candidates."
                  </p>
                </div>
              </div>

              {/* Context analysis */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs sm:text-sm">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>Target Profile Context:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Students actively seeking internships often fall victim to fake campus recruitment emails that fabricate artificial urgency and demand upfront registration or laptop security fees.
                </p>
              </div>
            </div>

            {/* Right Column: Multi-Agent Analysis Output */}
            <div className="lg:col-span-7 p-6 space-y-5">
              {/* Verdict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50 border border-red-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
                      High Risk Threat
                    </span>
                    <span className="text-xs font-mono text-slate-600 font-semibold">Confidence: 97.4%</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Internship Advance-Fee Scam
                  </h2>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-red-200 shrink-0 shadow-2xs">
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-500 uppercase font-semibold">Calculated Risk</div>
                    <div className="text-3xl font-bold text-red-600">
                      91<span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                </div>
              </div>

              {/* Multi-Agent Contribution Bar */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-800">Multi-Agent Signal Contribution</span>
                  <span className="font-mono text-slate-600 font-semibold text-xs">Bayesian Fusion</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div className="bg-[#0284C7] h-full" style={{ width: '40%' }} title="URL Agent: 40%" />
                  <div className="bg-[#2563EB] h-full" style={{ width: '35%' }} title="Text Agent: 35%" />
                  <div className="bg-[#4F46E5] h-full" style={{ width: '15%' }} title="Sender Agent: 15%" />
                  <div className="bg-[#7C3AED] h-full" style={{ width: '10%' }} title="RAG Retrieval: 10%" />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />URL Agent: 40%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />Text Agent: 35%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />Sender Agent: 15%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />Incident RAG: 10%</span>
                </div>
              </div>

              {/* Diagnostic breakdown cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>URL Agent (XGBoost)</span>
                    <span className="font-mono text-red-600 font-bold">+0.40 Delta</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Shortened URL (bit.ly) masking destination domain with payment intent keywords.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Text Agent (TF-IDF + LR)</span>
                    <span className="font-mono text-red-600 font-bold">+0.35 Delta</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    High linguistic urgency (2-hour limit), upfront fee demand (₹2,000), and forfeiture threat.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Sender Agent (Random Forest)</span>
                    <span className="font-mono text-red-600 font-bold">+0.15 Delta</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Domain registered under 5 days ago, missing DMARC record, and SPF softfail alert.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Incident RAG Retrieval</span>
                    <span className="font-mono text-blue-600 font-bold">91% Match</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Correlated with confirmed historical case: "Campus Recruitment Advance-Fee Scheme".
                  </p>
                </div>
              </div>

              {/* Action plan */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">task_alt</span>
                    Personalized Guidance (Student Profile)
                  </span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-800 space-y-1.5 pl-4 list-disc leading-relaxed font-medium">
                  <li><strong>Never pay upfront fees:</strong> Legitimate recruiters never charge candidate fees or seat reservations.</li>
                  <li><strong>Verify with Placement Office:</strong> Confirm with your university placement cell if this recruiter is authorized.</li>
                  <li><strong>Report to IT Support:</strong> Notify your campus network administrator to block the sender domain.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PIPELINE ARCHITECTURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="pipeline-architecture">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            System Design & Pipeline
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Multi-Stage Detection Architecture
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Inbound content passes through automated extraction, parallel specialized ML classifiers, RAG vector retrieval, Bayesian risk fusion, and explainable guidance generation.
          </p>
        </div>

        {/* 8-Stage Sequential Flow Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { num: 1, name: 'User Profile', desc: 'Role & accounts context' },
            { num: 2, name: 'Preprocessor', desc: 'Entity extraction' },
            { num: 3, name: 'Orchestrator', desc: 'Parallel dispatch' },
            { num: 4, name: 'ML Agents', desc: 'Text, URL, Sender' },
            { num: 5, name: 'Incident RAG', desc: 'Vector similarity' },
            { num: 6, name: 'Bayesian Fusion', desc: 'Calibrated score' },
            { num: 7, name: 'Explainability', desc: 'SHAP factor deltas' },
            { num: 8, name: 'Action Plan', desc: 'Tailored guidance' },
          ].map((stage) => (
            <div key={stage.num} className="p-3.5 rounded-xl bg-white border border-slate-200 text-center space-y-1.5 shadow-2xs">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                {stage.num}
              </span>
              <div className="text-xs sm:text-sm font-bold text-slate-900">{stage.name}</div>
              <div className="text-xs text-slate-500 font-mono leading-tight">{stage.desc}</div>
            </div>
          ))}
        </div>

        {/* Technical stack summary */}
        <div className="mt-10 p-6 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Implementation Technology Stack
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 text-center text-xs sm:text-sm">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">React + Vite</div>
              <div className="text-xs text-slate-500 mt-0.5">Frontend Client</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">FastAPI</div>
              <div className="text-xs text-slate-500 mt-0.5">Python Backend</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">XGBoost</div>
              <div className="text-xs text-slate-500 mt-0.5">URL Feature Classifier</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Scikit-Learn</div>
              <div className="text-xs text-slate-500 mt-0.5">Text & Sender Models</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">SQLite + RAG</div>
              <div className="text-xs text-slate-500 mt-0.5">Incident Memory</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-bold text-slate-900">Multi-LLM Gateway</div>
              <div className="text-xs text-slate-500 mt-0.5">Gemini, Groq, Ollama</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="bg-navy-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">security</span>
            </div>
            <span className="font-bold text-white text-base">PhishGuard AI</span>
            <span className="text-slate-400 font-mono text-xs">| MDM - Generative AI Capstone</span>
          </div>
          <div className="text-slate-300 font-mono text-center sm:text-right space-y-1">
            <div className="font-medium">Personalized Multi-Agent Phishing Detection & Explainable Risk Analysis</div>
            <div className="text-slate-400 text-xs">Academic Research Deliverable • Evaluated on Public Phishing Corpora</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
