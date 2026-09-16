import React, { useState } from 'react';
import aiVisualization from '../assets/ai_visualization.png';

export default function LandingPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 overflow-x-hidden font-sans">
      {/* Top Ambient Glow */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[480px] bg-gradient-to-b from-blue-200/40 via-blue-50/50 to-transparent blur-3xl pointer-events-none" />

        {/* 1. HERO SECTION */}
        <section className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-12 pb-14">
          <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
            {/* Academic Capstone Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-sm border border-slate-200/90 text-xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-semibold text-blue-600 uppercase tracking-wider font-mono">
                Final Year Engineering Project
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-slate-600">
                Applied AI & Cybersecurity Research
              </span>
            </div>

            {/* Project Title & Heading */}
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-mono uppercase tracking-widest text-slate-500 font-semibold block">
                PhishGuard AI
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-extrabold text-slate-900 tracking-tight leading-[1.18]">
                Personalized Multi-Agent Phishing Detection <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  & Explainable Risk Analysis
                </span>
              </h1>
            </div>

            {/* Subtitle / Abstract */}
            <p className="text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
              An academic project designed to move beyond simple binary (spam/ham) filters. PhishGuard AI coordinates specialized machine learning agents (Text NLP, URL XGBoost, Sender Random Forest) with Generative AI and Profile Memory to explain <em>why</em> a threat is dangerous and provide role-tailored defense guidance for students and everyday users.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('submit')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">shield</span>
                <span>Try Live Analysis Demo</span>
              </button>
              <a
                href="#project-architecture"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200 shadow-sm transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">account_tree</span>
                <span>View Project Pipeline</span>
              </a>
              <button
                onClick={() => onNavigate('onboarding')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold border border-slate-200 transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">psychology</span>
                <span>AI Profile Setup</span>
              </button>
            </div>

            {/* Project Academic Highlights Bar */}
            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-blue-600 text-[22px] mt-0.5">school</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">Student Defense</div>
                  <div className="text-[11px] text-slate-500">Trained on campus scams</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-indigo-600 text-[22px] mt-0.5">hub</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">3 Specialized ML Agents</div>
                  <div className="text-[11px] text-slate-500">Random Forest + XGBoost + NLP</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-cyan-600 text-[22px] mt-0.5">auto_awesome</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">Generative AI + RAG</div>
                  <div className="text-[11px] text-slate-500">Plain-language explanations</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-start gap-3">
                <span className="material-symbols-outlined text-emerald-600 text-[22px] mt-0.5">account_circle</span>
                <div>
                  <div className="text-xs font-bold text-slate-900 font-mono">Profile Personalization</div>
                  <div className="text-[11px] text-slate-500">Dynamic AI conversation</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 2. PROJECT DEMO & STUDENT THREAT INSPECTOR */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-8" id="threat-inspector">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Title Bar */}
          <div className="bg-[#0B1220] px-6 py-3.5 flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/90" />
                <span className="w-3 h-3 rounded-full bg-amber-500/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/90" />
              </div>
              <span className="text-xs font-mono text-slate-300 ml-2">
                PhishGuard AI • Interactive Capstone Evaluation Demo
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Campus Incident Sample: Internship Scam
              </span>
              <span className="px-2.5 py-0.5 rounded bg-blue-600 text-white font-medium">
                Live Simulation
              </span>
            </div>
          </div>

          {/* Demo Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Column: Sample Student Payload */}
            <div className="lg:col-span-5 p-6 bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600">
                  Sample Suspicious Email (Received by Student)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                  Internship Trap
                </span>
              </div>

              {/* Sample Email Box */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">Sender:</span>
                    <span className="text-red-700 font-medium bg-red-50 px-2 py-0.5 rounded border border-red-200 truncate">
                      hr-verify@quick-career.org
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">Subject:</span>
                    <span className="text-slate-800 font-semibold truncate">
                      Summer Analyst Internship — Slot Confirmation & Fee
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16">Link:</span>
                    <span className="text-blue-600 underline truncate">http://bit.ly/internship-fee-2024</span>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg font-mono border border-slate-100">
                    “Congratulations! You have been selected for the Summer Analyst internship program. Pay <span className="bg-red-100 text-red-700 font-bold px-1 rounded">₹2,000 within 2 hours</span> using the link below to reserve your candidate pass: <span className="text-blue-600 font-semibold">bit.ly/internship-fee-2024</span>. Failure to process will release your seat to waiting candidates.”
                  </p>
                </div>
              </div>

              {/* Identified Problem in College Context */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                  <span>Why This Targets College Students:</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Students actively seeking internships often fall victim to fake campus recruitment emails that fabricate urgency and demand advance registration or laptop insurance fees before joining.
                </p>
              </div>
            </div>

            {/* Right Column: Multi-Agent Analysis Output */}
            <div className="lg:col-span-7 p-6 space-y-5">
              {/* Threat Result Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/80 border border-red-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
                      High Risk Threat Detected
                    </span>
                    <span className="text-xs font-mono text-slate-500">Confidence: 97.4%</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Internship Advance-Fee Scam
                  </h2>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-red-200 shadow-sm shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Calculated Risk</div>
                    <div className="text-3xl font-extrabold text-red-600">
                      91<span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <span className="material-symbols-outlined text-[24px]">warning</span>
                  </div>
                </div>
              </div>

              {/* Multi-Agent Contribution Bar */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Multi-Agent Evidence Fusion</span>
                  <span className="font-mono text-slate-500 text-[11px]">Deterministic Bayesian Engine</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                  <div className="bg-[#06B6D4] h-full" style={{ width: '40%' }} title="URL Agent: 40%" />
                  <div className="bg-[#3B82F6] h-full" style={{ width: '35%' }} title="Text Agent: 35%" />
                  <div className="bg-[#6366F1] h-full" style={{ width: '15%' }} title="Sender Agent: 15%" />
                  <div className="bg-[#8B5CF6] h-full" style={{ width: '10%' }} title="RAG Retrieval: 10%" />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-600">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#06B6D4]" />URL Agent: 40%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" />Text Agent: 35%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#6366F1]" />Sender Agent: 15%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />Incident RAG: 10%</span>
                </div>
              </div>

              {/* Agent Diagnostic Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      URL Agent (XGBoost)
                    </span>
                    <span className="font-mono text-red-600 font-bold">+0.40 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Flagged shortened link (bit.ly) hiding payment gateway destination and unverified domain.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      Text Agent (LLM + NLP)
                    </span>
                    <span className="font-mono text-red-600 font-bold">+0.35 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Detected artificial 2-hour deadline, advance fee demand (₹2,000), and psychological coercion.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                      Sender Agent (Random Forest)
                    </span>
                    <span className="font-mono text-red-600 font-bold">+0.15 Delta</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Domain age under 5 days, missing corporate DMARC record, and SPF softfail alert.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                      Incident RAG Retrieval
                    </span>
                    <span className="font-mono text-purple-600 font-bold">Match: 91%</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Matched verified historical database pattern: “Campus Recruitment Advance-Fee Scheme”.
                  </p>
                </div>
              </div>

              {/* Tailored Student Action Plan */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">verified</span>
                    Recommended Action Plan (Tailored for Students)
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">
                    Role: Student
                  </span>
                </div>
                <ul className="text-xs text-slate-800 space-y-1.5 pl-5 list-decimal leading-relaxed">
                  <li><strong>Never pay upfront fees:</strong> Legitimate internships and company recruiters never ask candidates for security deposits or seat booking charges.</li>
                  <li><strong>Cross-verify with Placement Cell:</strong> Contact your university training & placement cell (TPO) to confirm if this company is an authorized recruiter.</li>
                  <li><strong>Alert your peers & campus IT:</strong> Report this email to your college IT admin so it can be blocked across the student email network.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROJECT ARCHITECTURE & METHODOLOGY */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-16" id="project-architecture">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600">
            System Design & Workflow
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How PhishGuard AI Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Our multi-stage pipeline integrates automated preprocessing, specialized machine learning classifiers, vector RAG retrieval, Bayesian risk fusion, and conversational Generative AI.
          </p>
        </div>

        {/* 8-Stage Sequential Flow Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { num: 1, name: 'User Profile', desc: 'Role & services memory' },
            { num: 2, name: 'Preprocessor', desc: 'Auto-extract text & URLs' },
            { num: 3, name: 'Orchestrator', desc: 'LLM agent routing' },
            { num: 4, name: 'Multi-Agent', desc: 'ML & NLP classifiers' },
            { num: 5, name: 'Incident RAG', desc: 'Similar vector search' },
            { num: 6, name: 'Risk AI', desc: 'Bayesian evidence fusion' },
            { num: 7, name: 'Explainable AI', desc: 'Grounded insights' },
            { num: 8, name: 'Action Plan', desc: 'Personalized guidance' },
          ].map((stage) => (
            <div key={stage.num} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-center space-y-1.5 hover:border-blue-300 transition">
              <span className="w-7 h-7 mx-auto rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                {stage.num}
              </span>
              <div className="text-xs font-bold text-slate-900">{stage.name}</div>
              <div className="text-[10px] text-slate-500 font-mono leading-tight">{stage.desc}</div>
            </div>
          ))}
        </div>

        {/* Tech Stack Highlights */}
        <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold font-mono uppercase text-slate-600 mb-4 text-center">
            Project Technology Stack & Tools
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">React + Vite</div>
              <div className="text-[10px] text-slate-500 font-mono">Modern Frontend</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">FastAPI (Python)</div>
              <div className="text-[10px] text-slate-500 font-mono">High-Speed Backend</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">Random Forest</div>
              <div className="text-[10px] text-slate-500 font-mono">Sender ML Agent</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">XGBoost</div>
              <div className="text-[10px] text-slate-500 font-mono">URL ML Agent</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">Multi-Provider LLM</div>
              <div className="text-[10px] text-slate-500 font-mono">Gemini, Groq, Ollama</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs font-bold text-slate-900">SQLite + RAG</div>
              <div className="text-[10px] text-slate-500 font-mono">Incident Vector Memory</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACADEMIC FOOTER */}
      <footer className="bg-[#0B1220] text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">PhishGuard AI</span>
              <span className="text-xs text-slate-500 font-mono ml-2">| College Capstone Project</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono text-center sm:text-right space-y-0.5">
            <div>Department of Computer Science & Engineering • Final Year Project</div>
            <div className="text-slate-500 text-[11px]">Personalized Multi-Agent Phishing Detection & Explainable Risk Analysis</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
