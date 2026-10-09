import React, { useState } from 'react';
import architectureDiagram from '../assets/Phishing Detection Platform Architecture.png';

// Walkthrough Scenario Mock Data
const WALKTHROUGH_SCENARIOS = {
  internship: {
    id: 'internship',
    label: 'Internship Advance-Fee Scam',
    type: 'High Risk Threat',
    typeBadge: 'bg-red-50 text-red-700 border-red-200',
    score: 91,
    scoreColor: 'text-red-600',
    scoreBg: 'bg-red-50 border-red-200',
    confidence: '97.4%',
    channel: 'Email Channel',
    sender: 'hr-verify@quick-career.org',
    senderMeta: 'Domain registered 4 days ago • Missing DMARC • SPF softfail',
    subject: 'Summer Analyst Internship Offer — Confirmation Fee Required',
    url: 'http://bit.ly/internship-fee-2024',
    urlMeta: 'Shortened redirect to unverified payment gateway',
    body: 'Congratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the link below to reserve your candidate pass: bit.ly/internship-fee-2024. Failure to process will release your seat to waiting candidates.',
    highlightText: 'Pay ₹2,000 within 2 hours',
    contextProfile: 'Student (Internship / Recruitment)',
    contextNote: 'Students actively seeking internships often fall victim to fake campus recruitment emails that fabricate artificial urgency and demand upfront registration fees.',
    signals: {
      url: 40,
      text: 35,
      sender: 15,
      rag: 10
    },
    deltas: [
      { name: 'URL Agent (XGBoost)', delta: '+0.40 Delta', desc: 'Shortened URL (bit.ly) masking destination domain with payment intent keywords.' },
      { name: 'Text Agent (TF-IDF + LR)', delta: '+0.35 Delta', desc: 'High linguistic urgency (2-hour limit), upfront fee demand (₹2,000), and forfeiture threat.' },
      { name: 'Sender Agent (Random Forest)', delta: '+0.15 Delta', desc: 'Domain registered under 5 days ago, missing DMARC record, and SPF softfail alert.' },
      { name: 'Incident RAG Retrieval', delta: '91% Match', desc: 'Correlated with confirmed historical case: "Campus Recruitment Advance-Fee Scheme".' }
    ],
    guidance: [
      { title: 'Never pay upfront fees', detail: 'Legitimate employers and campus recruiters never charge candidate fees or seat reservations.' },
      { title: 'Verify with Placement Office', detail: 'Cross-reference this recruiter directly with your university placement cell or career services.' },
      { title: 'Report to IT Support', detail: 'Notify your campus email administrator to quarantine the sender domain.' }
    ]
  },
  wireFraud: {
    id: 'wireFraud',
    label: 'Executive Wire / Invoice Fraud',
    type: 'High Risk Threat',
    typeBadge: 'bg-red-50 text-red-700 border-red-200',
    score: 86,
    scoreColor: 'text-red-600',
    scoreBg: 'bg-red-50 border-red-200',
    confidence: '94.2%',
    channel: 'Executive Email Spoofing',
    sender: 'cfo-office@corpvp-finance.co',
    senderMeta: 'Lookalike domain registered recently • Direct reply-to mismatch',
    subject: 'URGENT: Outstanding Vendor Invoice #INV-84910 Disbursement',
    url: 'https://vendor-portal-wire.cc/disburse',
    urlMeta: 'Homograph domain impersonating registered vendor bank details',
    body: 'Please process immediate wire disbursement for outstanding invoice #INV-84910 ($14,850.00). Treasury banking details have been updated following quarterly audit. Route funds via vendor-portal-wire.cc/disburse by 3:00 PM today.',
    highlightText: 'updated following quarterly audit • by 3:00 PM today',
    contextProfile: 'Finance / Accounts Payable',
    contextNote: 'Finance personnel handling vendor invoices are primary targets for lookalike executive impersonation urging expedited wire re-routing.',
    signals: {
      url: 35,
      text: 35,
      sender: 20,
      rag: 10
    },
    deltas: [
      { name: 'Text Agent (TF-IDF + LR)', delta: '+0.35 Delta', desc: 'High urgency language, authority impersonation, and irregular bank detail modification.' },
      { name: 'URL Agent (XGBoost)', delta: '+0.35 Delta', desc: 'Newly registered .cc domain with payment gateway keywords mimicking vendor.' },
      { name: 'Sender Agent (Random Forest)', delta: '+0.20 Delta', desc: 'Lookalike domain (corpvp-finance.co) with reply-to header pointing to external host.' },
      { name: 'Incident RAG Retrieval', delta: '88% Match', desc: 'High cosine similarity with documented Business Email Compromise (BEC) pattern.' }
    ],
    guidance: [
      { title: 'Perform out-of-band verification', detail: 'Call the vendor billing contact via previously established telephone numbers, not email.' },
      { title: 'Hold wire release', detail: 'Do not modify recipient bank accounts without dual-authorization sign-off.' },
      { title: 'Flag to SecOps', detail: 'Submit headers to your internal Security Operations Center for domain blocklisting.' }
    ]
  },
  legitimateNotice: {
    id: 'legitimateNotice',
    label: 'Legitimate Campus IT Service Notice',
    type: 'Low Risk Communication',
    typeBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    score: 14,
    scoreColor: 'text-emerald-600',
    scoreBg: 'bg-emerald-50 border-emerald-200',
    confidence: '98.1%',
    channel: 'Verified Campus Broadcast',
    sender: 'it-support@university.edu',
    senderMeta: 'Valid SPF, DKIM & DMARC pass • Domain age > 15 years',
    subject: 'Scheduled Library Wi-Fi Maintenance — Saturday 2:00 AM',
    url: 'https://university.edu/it/status/notice-241',
    urlMeta: 'Verified institutional subdomain with valid SSL certificate',
    body: 'Campus IT Services will conduct routine maintenance on Library network switches this Saturday between 2:00 AM and 4:00 AM. No action is required. Review full maintenance schedule on university.edu/it/status.',
    highlightText: 'No action is required',
    contextProfile: 'Student / Faculty Community',
    contextNote: 'Routine internal notifications with no credential requests, no financial demands, and verified authentication pass.',
    signals: {
      url: 10,
      text: 5,
      sender: 5,
      rag: 0
    },
    deltas: [
      { name: 'Sender Agent (Random Forest)', delta: 'Verified Pass', desc: 'All SPF, DKIM, and DMARC checks passed on authentic university.edu domain.' },
      { name: 'URL Agent (XGBoost)', delta: 'Low Risk (0.04)', desc: 'Official institutional domain with long-standing clean threat reputation.' },
      { name: 'Text Agent (TF-IDF + LR)', delta: 'Informational (0.05)', desc: 'No coercive urgency, no credential solicitation, and explicit "no action" phrase.' },
      { name: 'Incident RAG Retrieval', delta: '0% Threat Match', desc: 'Zero similarity to confirmed malicious campaigns in vector database.' }
    ],
    guidance: [
      { title: 'Standard Informational Notice', detail: 'This communication is legitimate and originates from verified campus infrastructure.' },
      { title: 'No credential or payment requested', detail: 'Legitimate notices provide public reference URLs without demanding immediate user action.' }
    ]
  }
};

export default function LandingPage({ onNavigate }) {
  const [activeScenarioKey, setActiveScenarioKey] = useState('internship');
  const [showArchModal, setShowArchModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student');

  const scenario = WALKTHROUGH_SCENARIOS[activeScenarioKey];

  return (
    <div className="w-full bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION                                                           */}
      {/* ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Eyebrow Badge: Research & Project Identity */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="font-semibold text-blue-700 font-mono tracking-wider text-[11px] uppercase">
              PERSONALIZED MULTI-AGENT PHISHING DETECTION
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500 font-medium">
              MDM Capstone Project & Applied Cybersecurity
            </span>
          </div>

          {/* Primary Headline & Supporting Subheadings */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Know Before You Click.
            </h1>
            <p className="text-lg sm:text-xl font-medium text-slate-800 max-w-3xl mx-auto leading-snug">
              AI-powered phishing detection that understands the message, the sender, the URL — and your risk profile.
            </p>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              PhishGuard AI combines specialized ML agents, incident memory, explainable AI, and user context to detect suspicious communications and provide personalized risk guidance.
            </p>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs hover:shadow-sm transition"
            >
              <span className="material-symbols-outlined text-[19px]">verified_user</span>
              <span>Analyze a Threat</span>
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200 shadow-2xs hover:border-slate-300 transition"
            >
              <span className="material-symbols-outlined text-[19px]">account_tree</span>
              <span>See How It Works</span>
            </a>
            <button
              onClick={() => onNavigate('glossary')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-medium border border-slate-200 transition"
            >
              <span className="material-symbols-outlined text-[19px]">menu_book</span>
              <span>Attack Glossary</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. HERO VISUAL: UI-STYLE THREAT ANALYSIS CONSOLE MOCKUP                    */}
        {/* ========================================================================= */}
        <div className="mt-12 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Console Header Bar */}
            <div className="bg-navy-950 px-4 sm:px-6 py-3 flex items-center justify-between border-b border-navy-800 text-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-medium text-slate-300 border-l border-slate-700 pl-3">
                  PhishGuard AI Engine • Threat Assessment Console
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Telemetry
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">ID: PG-2024-8841</span>
              </div>
            </div>

            {/* Console Content: Split Message & Diagnostic Verdict */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* Left Pane: Inbound Message Inspector */}
              <div className="lg:col-span-6 p-5 sm:p-6 bg-slate-50/70 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    Inbound Suspicious Communication
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Email Channel
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold shrink-0">Sender:</span>
                    <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 truncate font-medium">
                      hr-verify@quick-career.org
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold shrink-0">Subject:</span>
                    <span className="text-slate-800 font-medium truncate">
                      Summer Analyst Internship Offer — Confirmation Fee Required
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-16 font-semibold shrink-0">URL:</span>
                    <span className="text-blue-600 underline truncate font-medium">
                      http://bit.ly/internship-fee-2024
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 font-sans text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded border border-slate-200">
                    "Congratulations! You have been selected for the Summer Analyst internship program. Pay <span className="bg-red-100 text-red-800 font-semibold px-1 rounded">₹2,000 within 2 hours</span> using the link below to reserve your candidate pass: <span className="text-blue-600 font-mono">bit.ly/internship-fee-2024</span>. Failure to process will release your seat to waiting candidates."
                  </div>
                </div>

                {/* Sender & URL Flags */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                    <div className="text-slate-500 font-semibold">SENDER DOMAIN</div>
                    <div className="text-red-700 font-medium truncate">Age: 4 days (High risk)</div>
                  </div>
                  <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                    <div className="text-slate-500 font-semibold">DESTINATION</div>
                    <div className="text-red-700 font-medium truncate">Shortened bit.ly redirect</div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Risk Assessment & Multi-Agent Signals */}
              <div className="lg:col-span-6 p-5 sm:p-6 space-y-4">
                {/* Score & Verdict Card */}
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white uppercase tracking-wider">
                        HIGH RISK
                      </span>
                      <span className="text-xs font-mono text-slate-600 font-medium">Confidence: 97.4%</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      Internship Advance-Fee Scam
                    </div>
                  </div>

                  <div className="text-right bg-white px-3.5 py-2 rounded-lg border border-red-200 shadow-2xs">
                    <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">RISK SCORE</div>
                    <div className="text-2xl font-black text-red-600 font-mono">
                      91<span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                </div>

                {/* Multi-Agent Contribution Breakdown */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>Multi-Agent Signal Contribution</span>
                    <span className="text-[11px] font-mono text-slate-500">Bayesian Fusion</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-slate-500 text-[10px]">URL AGENT</div>
                      <div className="font-bold text-blue-700">+0.40</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-slate-500 text-[10px]">TEXT AGENT</div>
                      <div className="font-bold text-blue-700">+0.35</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-slate-500 text-[10px]">SENDER AGENT</div>
                      <div className="font-bold text-blue-700">+0.15</div>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200">
                      <div className="text-slate-500 text-[10px]">INCIDENT RAG</div>
                      <div className="font-bold text-purple-700">+0.10</div>
                    </div>
                  </div>
                </div>

                {/* Personalized Recommendation */}
                <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[16px]">account_circle</span>
                      Personalized Recommendation (Student Profile)
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    "Do not pay upfront. Verify the recruiter independently with your university placement cell."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CAPABILITY STRIP                                                       */}
      {/* ========================================================================= */}
      <section className="border-y border-slate-200 bg-white py-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Message Intelligence */}
            <div className="flex items-start gap-3.5 p-2">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">chat</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">MESSAGE</div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Message Intelligence</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Detect suspicious language, coercive urgency, and social engineering intent using TF-IDF NLP.
                </p>
              </div>
            </div>

            {/* URL Analysis */}
            <div className="flex items-start gap-3.5 p-2">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">link</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">URL</div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">URL Analysis</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Identify suspicious URL patterns and homographs across 54 lexical features using XGBoost.
                </p>
              </div>
            </div>

            {/* Sender Analysis */}
            <div className="flex items-start gap-3.5 p-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">SENDER</div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Sender Analysis</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Evaluate sender-related signals including domain age, SPF, DKIM, and DMARC alignment.
                </p>
              </div>
            </div>

            {/* Incident Memory */}
            <div className="flex items-start gap-3.5 p-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
                <span className="material-symbols-outlined text-[22px]">memory</span>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">INCIDENT MEMORY</div>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">Incident Memory</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Compare incoming communications against previous confirmed phishing incidents using vector RAG.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. INTERACTIVE THREAT ANALYSIS (VISUAL CENTERPIECE)                       */}
      {/* ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16" id="threat-inspector">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            LIVE SECURITY CONSOLE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Interactive Threat Analysis Walkthrough
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Select a verified attack scenario below to inspect how multi-agent signal contributions, Bayesian risk fusion, and personalized guidance operate in real time.
          </p>

          {/* Scenario Tab Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {Object.keys(WALKTHROUGH_SCENARIOS).map((key) => {
              const item = WALKTHROUGH_SCENARIOS[key];
              const isActive = activeScenarioKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveScenarioKey(key)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition border ${
                    isActive
                      ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Realistic Console Walkthrough Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-navy-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-blue-400">shield</span>
              <span className="text-sm font-mono font-semibold tracking-wide text-white">
                Interactive Analysis Walkthrough
              </span>
              <span className="text-xs text-slate-400 font-mono">|</span>
              <span className="text-xs font-mono text-slate-300 font-medium">
                {scenario.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-navy-800 text-slate-200 border border-slate-700 font-medium">
                Target Profile: {scenario.contextProfile}
              </span>
            </div>
          </div>

          {/* Demo Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: Sample Payload */}
            <div className="lg:col-span-5 p-6 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  Inbound Communication Payload
                </span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  {scenario.channel}
                </span>
              </div>

              {/* Sample Email Details */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 text-xs sm:text-sm">
                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-16 font-semibold shrink-0">Sender:</span>
                      <span className="text-slate-900 font-medium truncate">{scenario.sender}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-[72px]">{scenario.senderMeta}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-16 font-semibold shrink-0">Subject:</span>
                      <span className="text-slate-900 font-medium truncate">{scenario.subject}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 w-16 font-semibold shrink-0">Link:</span>
                      <span className="text-blue-600 underline font-medium truncate">{scenario.url}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 pl-[72px]">{scenario.urlMeta}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-800 leading-relaxed font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    "{scenario.body}"
                  </p>
                </div>
              </div>

              {/* Context Profile Callout */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">info</span>
                  <span>Recipient Context & Threat Vector:</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {scenario.contextNote}
                </p>
              </div>
            </div>

            {/* Right Column: Multi-Agent Analysis Output */}
            <div className="lg:col-span-7 p-6 space-y-5">
              {/* Verdict Header */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${scenario.scoreBg}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${scenario.typeBadge}`}>
                      {scenario.type}
                    </span>
                    <span className="text-xs font-mono text-slate-600 font-semibold">
                      Confidence: {scenario.confidence}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {scenario.label}
                  </h3>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">Calculated Risk</div>
                    <div className={`text-3xl font-black font-mono ${scenario.scoreColor}`}>
                      {scenario.score}<span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    scenario.score > 50 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <span className="material-symbols-outlined text-[24px]">
                      {scenario.score > 50 ? 'warning' : 'verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Agent Contribution Bar */}
              <div className="space-y-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-800">Multi-Agent Signal Contribution</span>
                  <span className="font-mono text-slate-600 font-semibold text-xs">Bayesian Fusion</span>
                </div>
                {/* Proportional Bar */}
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div className="bg-[#0284C7] h-full transition-all duration-300" style={{ width: `${scenario.signals.url}%` }} title={`URL Agent: ${scenario.signals.url}%`} />
                  <div className="bg-[#2563EB] h-full transition-all duration-300" style={{ width: `${scenario.signals.text}%` }} title={`Text Agent: ${scenario.signals.text}%`} />
                  <div className="bg-[#4F46E5] h-full transition-all duration-300" style={{ width: `${scenario.signals.sender}%` }} title={`Sender Agent: ${scenario.signals.sender}%`} />
                  <div className="bg-[#7C3AED] h-full transition-all duration-300" style={{ width: `${scenario.signals.rag}%` }} title={`Incident RAG: ${scenario.signals.rag}%`} />
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-mono text-slate-700 font-medium">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />URL Agent: {scenario.signals.url}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />Text Agent: {scenario.signals.text}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5]" />Sender Agent: {scenario.signals.sender}%</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />Incident RAG: {scenario.signals.rag}%</span>
                </div>
              </div>

              {/* Diagnostic breakdown cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                {scenario.deltas.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{item.name}</span>
                      <span className="font-mono text-blue-700 font-bold">{item.delta}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action plan / Personalized Guidance */}
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-950 flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">task_alt</span>
                    Personalized Guidance ({scenario.contextProfile})
                  </span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-800 space-y-2 pl-4 list-disc leading-relaxed font-medium">
                  {scenario.guidance.map((g, idx) => (
                    <li key={idx}>
                      <strong>{g.title}:</strong> {g.detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. EXPLAINABLE AI SECTION (XAI)                                           */}
      {/* ========================================================================= */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              EXPLAINABLE AI (XAI)
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Why was this classified as high risk?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              PhishGuard provides transparent, verifiable model attribution. Instead of a black-box verdict, every assessment exposes exact feature contribution deltas.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Feature Attribution Breakdown
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sample: Internship Advance-Fee Scam (#PG-2024-8841)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[11px] font-mono text-slate-500 uppercase">CALCULATED TOTAL</div>
                  <div className="text-xl font-black text-red-600 font-mono">91 / 100</div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 uppercase font-mono">
                  HIGH RISK
                </span>
              </div>
            </div>

            {/* Horizontal Contribution Chart */}
            <div className="mt-6 space-y-4">
              {[
                { factor: 'Payment Request', weight: '+40%', pct: 40, color: 'bg-red-600', detail: 'Direct solicitation of upfront candidate fee (₹2,000) under artificial deadline.' },
                { factor: 'Suspicious URL', weight: '+25%', pct: 25, color: 'bg-blue-600', detail: 'Shortened redirect (bit.ly) masking domain target with payment parameter keywords.' },
                { factor: 'Urgency Language', weight: '+15%', pct: 15, color: 'bg-amber-600', detail: 'Coercive forfeiture deadline ("within 2 hours or release seat to waiting candidates").' },
                { factor: 'Sender Anomaly', weight: '+11%', pct: 11, color: 'bg-indigo-600', detail: 'Newly registered domain (4 days old), missing DMARC record, and SPF softfail.' },
                { factor: 'Similar Incident', weight: '+9%', pct: 9, color: 'bg-purple-600', detail: 'Vector RAG similarity match against confirmed "Campus Recruitment Scam" cluster.' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-slate-800">{item.factor}</span>
                    <span className="font-mono font-bold text-slate-900">{item.weight}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                    <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.pct * 2.2}%` }} />
                  </div>
                  <div className="text-xs text-slate-500">{item.detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
              <span className="font-mono">
                Attribution Method: SHAP Factor Deltas + Bayesian Risk Weights
              </span>
              <button
                onClick={() => onNavigate('submit')}
                className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
              >
                <span>Run analysis on your own suspicious message</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PERSONALIZATION SECTION                                                */}
      {/* ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            CONTEXT-AWARE DEFENSE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            The Same Message Can Mean Different Risk.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Generic filters treat all users identically. PhishGuard evaluates incoming communications through the recipient's role, operational workflows, and active accounts to generate tailored recommendations.
          </p>
        </div>

        {/* 4-Step Personalization Flow Diagram */}
        <div className="max-w-4xl mx-auto mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600">STEP 1</span>
              <div className="font-bold text-sm text-slate-900">Suspicious Message</div>
              <p className="text-xs text-slate-500">Inbound payload parsed</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600">STEP 2</span>
              <div className="font-bold text-sm text-slate-900">User Profile</div>
              <p className="text-xs text-slate-500">Role & account context</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600">STEP 3</span>
              <div className="font-bold text-sm text-slate-900">Personalized Risk</div>
              <p className="text-xs text-slate-500">Target vulnerability evaluated</p>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-xs font-mono font-bold text-blue-600">STEP 4</span>
              <div className="font-bold text-sm text-slate-900">Tailored Guidance</div>
              <p className="text-xs text-slate-500">Actionable advice generated</p>
            </div>
          </div>
        </div>

        {/* Interactive Profile Context Demonstration Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="text-xs font-mono uppercase font-bold text-slate-500">DEMONSTRATION CARD</div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Role Context Adaptation
              </h3>
            </div>
            {/* Role Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedRole('student')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedRole === 'student' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Student Profile
              </button>
              <button
                onClick={() => setSelectedRole('finance')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedRole === 'finance' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Finance Profile
              </button>
              <button
                onClick={() => setSelectedRole('itAdmin')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  selectedRole === 'itAdmin' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                IT Admin Profile
              </button>
            </div>
          </div>

          {selectedRole === 'student' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">ACTIVE PROFILE PARAMETERS</div>
                <div className="space-y-1.5">
                  <div><span className="text-slate-400">User Type:</span> <strong className="text-slate-900">Student</strong></div>
                  <div><span className="text-slate-400">Context:</span> <span className="text-slate-800">Internship / Campus Recruitment</span></div>
                  <div><span className="text-slate-400">Risk Preference:</span> <span className="text-slate-800">Medium</span></div>
                  <div><span className="text-slate-400">Threat Susceptibility:</span> <span className="text-red-700">Placement fee deception, job scarcity urgency</span></div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-red-50/70 border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white font-mono uppercase">
                    HIGH RISK
                  </span>
                  <span className="text-xs font-mono text-red-700 font-bold">Severity: Placement Fraud</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  "Do not pay upfront. Verify the recruiter independently."
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Legitimate campus employers never require payment for interview scheduling, candidate security cards, or training kits before a formal contract.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'finance' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">ACTIVE PROFILE PARAMETERS</div>
                <div className="space-y-1.5">
                  <div><span className="text-slate-400">User Type:</span> <strong className="text-slate-900">Finance & Accounting</strong></div>
                  <div><span className="text-slate-400">Context:</span> <span className="text-slate-800">Vendor Disbursements & Accounts Payable</span></div>
                  <div><span className="text-slate-400">Risk Preference:</span> <span className="text-slate-800">Conservative / Zero-Tolerance</span></div>
                  <div><span className="text-slate-400">Threat Susceptibility:</span> <span className="text-red-700">Wire transfer diversion, vendor account modification</span></div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-red-50/70 border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white font-mono uppercase">
                    HIGH RISK
                  </span>
                  <span className="text-xs font-mono text-red-700 font-bold">Severity: Financial Wire Fraud</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  "Halt wire processing. Call registered vendor treasurer on authenticated phone line."
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Sudden banking updates sent via email demand out-of-band telephone verification before any treasury disbursement is executed.
                </p>
              </div>
            </div>
          )}

          {selectedRole === 'itAdmin' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">ACTIVE PROFILE PARAMETERS</div>
                <div className="space-y-1.5">
                  <div><span className="text-slate-400">User Type:</span> <strong className="text-slate-900">Systems & IT Administrator</strong></div>
                  <div><span className="text-slate-400">Context:</span> <span className="text-slate-800">Identity Provider, SSO Portals, OAuth Scopes</span></div>
                  <div><span className="text-slate-400">Risk Preference:</span> <span className="text-slate-800">Technical Audit</span></div>
                  <div><span className="text-slate-400">Threat Susceptibility:</span> <span className="text-red-700">Credential harvesting, session token theft, OAuth consent abuse</span></div>
                </div>
              </div>

              <div className="p-5 rounded-lg bg-red-50/70 border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white font-mono uppercase">
                    HIGH RISK
                  </span>
                  <span className="text-xs font-mono text-red-700 font-bold">Severity: Credential Harvesting</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  "Quarantine recipient inbox. Inspect Active Directory SSO logs for unauthorized token exchange."
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Inbound link mimics administrative credential re-authentication page. Block reverse proxy IP at campus firewall edge.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. INCIDENT MEMORY / RAG SECTION                                          */}
      {/* ========================================================================= */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
              HISTORICAL ATTACK REPOSITORY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Learn From Previous Attacks
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              PhishGuard maintains an indexed vector knowledge base of confirmed phishing incidents. Incoming messages are projected into vector space to recognize modified variants of known attack patterns.
            </p>
          </div>

          {/* Conceptual RAG Pipeline Flow */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono text-slate-700">
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200 font-bold text-slate-900">New Suspicious Message</span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">Incident RAG</span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200 font-bold text-slate-900">Similar Historical Incidents</span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 rounded bg-white border border-slate-200 font-bold text-slate-900">Attack Pattern</span>
              <span className="text-slate-400">→</span>
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">Risk Context</span>
            </div>
          </div>

          {/* 3 Example Incident Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Advance Fee Scam Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  91% Similarity
                </span>
                <span className="text-xs font-mono text-slate-500">Case #INC-2024-04</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Advance Fee Scam
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Matches confirmed template where recipients are offered high-paying roles contingent on an immediate upfront registration fee or equipment guarantee.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-slate-500">
                Pattern: Fee requirement + Artificial deadline
              </div>
            </div>

            {/* Fake Recruitment Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  88% Similarity
                </span>
                <span className="text-xs font-mono text-slate-500">Case #INC-2023-19</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Fake Recruitment
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spoofs corporate recruitment headers and student placement communications to trick applicants into clicking malicious onboarding forms.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-slate-500">
                Pattern: Spoofed HR domain + Shortened link
              </div>
            </div>

            {/* Credential Harvesting Card */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  84% Similarity
                </span>
                <span className="text-xs font-mono text-slate-500">Case #INC-2024-11</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Credential Harvesting
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Simulates urgent account deactivation warnings directing victims to deceptive lookalike authentication pages to harvest passwords and session cookies.
              </p>
              <div className="pt-2 border-t border-slate-200/80 text-[11px] font-mono text-slate-500">
                Pattern: Account suspension fear + Form intercept
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. SIMPLE HOW-IT-WORKS SECTION                                            */}
      {/* ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16" id="how-it-works">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            END-TO-END PIPELINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How PhishGuard Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From raw input submission to calibrated explainable threat guidance, each message is processed through an automated multi-stage pipeline.
          </p>
        </div>

        {/* Simplified 7-Stage Flow */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 max-w-5xl mx-auto mb-16 text-center">
          {[
            { step: '1', title: 'Suspicious Input', desc: 'Email, URL, or text message submitted' },
            { step: '2', title: 'AI Orchestrator', desc: 'Payload parsing & asynchronous dispatch' },
            { step: '3', title: 'ML Agents', desc: 'Parallel Text, URL, and Sender evaluation' },
            { step: '4', title: 'Incident RAG', desc: 'Vector similarity against historical cases' },
            { step: '5', title: 'Risk Analysis', desc: 'Calibrated Bayesian probability fusion' },
            { step: '6', title: 'Explainability', desc: 'SHAP factor contribution generation' },
            { step: '7', title: 'Action Plan', desc: 'Role-tailored defensive guidance' }
          ].map((s) => (
            <div key={s.step} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <span className="w-6 h-6 mx-auto rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center">
                {s.step}
              </span>
              <div className="text-xs font-bold text-slate-900 leading-snug">{s.title}</div>
              <div className="text-[11px] text-slate-500 leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* ======================================================================= */}
        {/* 9. SYSTEM ARCHITECTURE IMAGE (CRITICAL PROJECT ASSET)                    */}
        {/* ======================================================================= */}
        <div className="max-w-6xl mx-auto" id="architecture">
          <div className="text-center max-w-2xl mx-auto mb-6 space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              SYSTEM ARCHITECTURE SCHEMATIC
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              PhishGuard Platform Architecture
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Complete technical topology: client interface, FastAPI orchestrator, ML agent inference cluster, vector memory, and explainability engine.
            </p>
          </div>

          {/* Architecture Container with Console Header & Zoom Support */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-slate-100/80 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-blue-600">account_tree</span>
                <span className="font-bold text-slate-800">
                  PhishGuard AI System Architecture & Data Flow Pipeline
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                  1536 × 1024 High-Resolution Vector Schematic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowArchModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium transition shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                  <span>View High Resolution</span>
                </button>
              </div>
            </div>

            {/* Scrollable Responsive Image Container */}
            <div className="p-4 sm:p-6 bg-slate-50/50 overflow-x-auto flex justify-center">
              <div className="min-w-[680px] max-w-full">
                <img
                  src={architectureDiagram}
                  alt="PhishGuard AI Platform Architecture Diagram"
                  className="w-full h-auto rounded-lg border border-slate-200 shadow-2xs object-contain cursor-pointer hover:border-blue-400 transition"
                  onClick={() => setShowArchModal(true)}
                  title="Click to expand architecture diagram in full resolution"
                />
              </div>
            </div>

            {/* Schematic Explanatory Legend / Architecture Tiers */}
            <div className="p-4 sm:p-6 bg-white border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>1. Ingestion & Preprocessing</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Extracts raw text, headers, and destination URLs. Sanitizes inputs and dispatches parallel worker tasks.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span>2. Multi-Agent Inference</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Text NLP classifier, XGBoost 54-feature URL analyzer, and Random Forest sender authentication check.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600" />
                  <span>3. Vector Incident Memory</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Vector RAG retrieval identifies cosine similarity against historical attacks and campus fraud campaigns.
                </p>
              </div>

              <div className="space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>4. Fusion, XAI & Profiling</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Bayesian probability calibration combines signals with user context to generate SHAP deltas and action steps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Architecture Diagram */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 text-white max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-blue-400">account_tree</span>
              <span className="font-bold text-sm sm:text-base">
                PhishGuard AI System Architecture & Data Flow Pipeline (1536 × 1024)
              </span>
            </div>
            <button
              onClick={() => setShowArchModal(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-950 rounded-xl border border-slate-800 p-2 sm:p-4 flex items-center justify-center max-w-7xl mx-auto w-full">
            <img
              src={architectureDiagram}
              alt="Full Resolution PhishGuard AI System Architecture"
              className="max-w-full max-h-[85vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. TECHNOLOGY STACK                                                      */}
      {/* ========================================================================= */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              ENGINEERING FOUNDATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Production-Grade Machine Learning & Security Stack
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Built using verified libraries and frameworks integrated throughout the PhishGuard AI repository.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 max-w-5xl mx-auto text-center text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">React + Vite</div>
              <div className="text-xs text-slate-500 font-mono">Frontend Client</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">FastAPI</div>
              <div className="text-xs text-slate-500 font-mono">Python Backend</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">XGBoost</div>
              <div className="text-xs text-slate-500 font-mono">54 URL Features</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Scikit-Learn</div>
              <div className="text-xs text-slate-500 font-mono">TF-IDF & Sender RF</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">SQLite + RAG</div>
              <div className="text-xs text-slate-500 font-mono">Incident Memory</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">Multi-LLM Gateway</div>
              <div className="text-xs text-slate-500 font-mono">Gemini, Groq, Ollama</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. RESEARCH-DRIVEN CYBERSECURITY                                         */}
      {/* ========================================================================= */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
              ACADEMIC DELIVERABLE & RESEARCH RIGOR
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Research-Driven Cybersecurity
            </h2>
            <div className="text-sm font-semibold text-slate-800">
              Personalized Multi-Agent Phishing Detection and Explainable Risk Analysis
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            PhishGuard AI addresses the fundamental limitation of monolithic detection filters by unifying <strong>Multi-Agent AI</strong>, <strong>Machine Learning</strong>, <strong>Retrieval-Augmented Generation (RAG)</strong>, <strong>Explainable AI (XAI)</strong>, and <strong>Personalization</strong> into a verifiable defense architecture. By decoupling individual feature domains (linguistic syntax, lexical URL topology, and sender infrastructure), the system avoids single-point evasion and produces defensible audit trails.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Multi-Agent AI</strong>
              Domain-specific models
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Machine Learning</strong>
              XGBoost & Random Forest
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Vector RAG</strong>
              Historical attack memory
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Explainable AI</strong>
              SHAP attribution deltas
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Personalization</strong>
              Recipient role awareness
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              <strong className="block text-slate-900">Risk Analysis</strong>
              Bayesian fusion calibration
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. ATTACK GLOSSARY PREVIEW                                               */}
      {/* ========================================================================= */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 max-w-5xl mx-auto">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
                THREAT TAXONOMY
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Attack Type Glossary Preview
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Taxonomy of social engineering attack vectors, behavioral mechanisms, and defense guidance.
              </p>
            </div>
            <button
              onClick={() => onNavigate('glossary')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200 self-start sm:self-auto"
            >
              <span>Explore Complete Glossary</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { code: 'ATK-01', title: 'Phishing', desc: 'Broad deceptive emails mass-distributed to impersonate trusted institutions and capture login credentials.', icon: 'mark_email_unread' },
              { code: 'ATK-02', title: 'Spear Phishing', desc: 'Highly customized communications targeting specific individuals using researched organizational context.', icon: 'gps_fixed' },
              { code: 'ATK-03', title: 'Advance-Fee Scam', desc: 'Deceptive promises of employment, awards, or payouts requiring upfront processing fees.', icon: 'savings' },
              { code: 'ATK-04', title: 'Credential Harvesting', desc: 'Lookalike login portals designed to intercept campus SSO tokens and multi-factor authentication codes.', icon: 'lock_open' },
              { code: 'ATK-05', title: 'Malicious URL', desc: 'Obfuscated links, typosquats, and shortened redirects leading to malware payload droppers.', icon: 'link_off' }
            ].map((atk) => (
              <div key={atk.code} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:bg-white hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-700 font-semibold">{atk.code}</span>
                  <span className="material-symbols-outlined text-[18px] text-slate-500">{atk.icon}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{atk.title}</div>
                <p className="text-xs text-slate-600 leading-relaxed">{atk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 13. FINAL CALL TO ACTION (CTA)                                            */}
      {/* ========================================================================= */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Have a suspicious message?
            </h2>
            <p className="text-base text-slate-600">
              Let PhishGuard analyze it.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('submit')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition"
            >
              <span className="material-symbols-outlined text-[19px]">verified_user</span>
              <span>Analyze a Threat</span>
            </button>
            <button
              onClick={() => onNavigate('glossary')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium border border-slate-200 transition"
            >
              <span className="material-symbols-outlined text-[19px]">menu_book</span>
              <span>Browse Attack Taxonomy</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 14. FOOTER                                                                */}
      {/* ========================================================================= */}
      <footer className="bg-navy-950 text-slate-400 py-12 border-t border-navy-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs sm:text-sm">
            {/* Identity Column */}
            <div className="space-y-3 sm:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <span className="font-bold text-white text-base">PhishGuard AI</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                Personalized phishing detection and explainable risk analysis. Multi-agent machine learning architecture evaluated across real-world social engineering datasets.
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                MDM Capstone Deliverable • Applied Artificial Intelligence in Cybersecurity
              </div>
            </div>

            {/* Product Column */}
            <div className="space-y-2.5">
              <div className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Product
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="#how-it-works" className="hover:text-slate-200 transition">How It Works</a>
                </li>
                <li>
                  <a href="#threat-inspector" className="hover:text-slate-200 transition">Threat Analysis</a>
                </li>
                <li>
                  <button onClick={() => onNavigate('glossary')} className="hover:text-slate-200 transition text-left">
                    Attack Glossary
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigate('submit')} className="hover:text-slate-200 transition text-left">
                    Analyze Threat
                  </button>
                </li>
              </ul>
            </div>

            {/* Research Column */}
            <div className="space-y-2.5">
              <div className="font-bold text-white text-xs uppercase tracking-wider font-mono">
                Research
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li>
                  <a href="#architecture" className="hover:text-slate-200 transition">Architecture</a>
                </li>
                <li>
                  <span className="text-slate-400">Methodology</span>
                </li>
                <li>
                  <span className="text-slate-400">Documentation</span>
                </li>
                <li>
                  <span className="text-slate-500 font-mono text-[11px]">MIT License • Capstone 2026</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div>© 2026 PhishGuard AI. All rights reserved.</div>
            <div>Academic Cybersecurity Research Deliverable</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
