import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

const VECTOR_METADATA = {
  "Internship Scam": {
    code: "ATK-01",
    category: "Campus & Student",
    icon: "school",
    severity: "High Risk",
    severityClass: "text-amber-700 bg-amber-50 border-amber-200",
    dotClass: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    targetAudience: "College Students, Fresh Graduates & Career Portal Seekers",
    psychologicalTrigger: "Job Market Anxiety & Artificial Scarcity (Urgent 2-hour fee deadline)",
    vectorChannel: "Unsolicited Job Emails & Fake Placement Links",
    personalizationAdvice: "For students: Cross-reference with your university career guidance cell. Genuine employers never request upfront onboarding or verification fees before issuing formal offer letters.",
    samplePayload: `From: hr-verify@quick-career.org\nSubject: Summer Analyst Internship Offer - Allocation Verification Required\n\nCongratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the secure portal link below to reserve your slot and generate the candidate pass: http://bit.ly/internship-fee-2024. Failure to process immediately releases the allocation.`
  },
  "Credential Phishing": {
    code: "ATK-02",
    category: "Credential Theft",
    icon: "lock_open",
    severity: "Critical Risk",
    severityClass: "text-rose-700 bg-rose-50 border-rose-200",
    dotClass: "bg-rose-500",
    iconBg: "bg-rose-100 text-rose-700",
    targetAudience: "University Portal Users, Campus SSO Accounts & Students",
    psychologicalTrigger: "Fear of Mailbox Deactivation & Immediate Account Suspension",
    vectorChannel: "Spoofed SSO Login Portals & Harvest Forms",
    personalizationAdvice: "For campus users: University IT will never send links requiring immediate password re-entry under threat of deactivation. Always verify the domain in the browser address bar.",
    samplePayload: `From: security-alert@paypal-update-center.com\nSubject: Unauthorized Login Attempt - Verify Password\n\nDear Customer, We detected an unauthorized sign-in to your PayPal wallet from an unfamiliar IP address. Verify your account password immediately at http://secure-paypal-login.xyz/verify to prevent permanent suspension.`
  },
  "Invoice Fraud": {
    code: "ATK-03",
    category: "Financial & Wire",
    icon: "receipt_long",
    severity: "High Risk",
    severityClass: "text-blue-700 bg-blue-50 border-blue-200",
    dotClass: "bg-blue-500",
    iconBg: "bg-blue-100 text-blue-700",
    targetAudience: "Academic Department Coordinators, Lab Staff & Club Treasurers",
    psychologicalTrigger: "Executive Authority Impersonation & Wire Routing Alteration",
    vectorChannel: "Spoofed Supplier Billing & Payment Gateway Links",
    personalizationAdvice: "For organizational roles: Never alter supplier bank details or make payments based solely on an email request. Always perform out-of-band telephone verification.",
    samplePayload: `From: executive-billing@supplier-vendor-portal.net\nSubject: URGENT: Revised Wire Instructions for Outstanding Invoice #INV-84910\n\nAttention Accounts Payable: Please be advised that our primary treasury account has changed due to annual banking audit. Route all pending wire disbursements for invoice #INV-84910 ($14,850.00) to our new corporate account: http://wire-transfer-update.cc/portal. Confirm receipt within 4 hours.`
  },
  "Advance-Fee Scam": {
    code: "ATK-04",
    category: "Social Engineering",
    icon: "savings",
    severity: "Elevated Risk",
    severityClass: "text-purple-700 bg-purple-50 border-purple-200",
    dotClass: "bg-purple-500",
    iconBg: "bg-purple-100 text-purple-700",
    targetAudience: "General Email Users, Scholarship Seekers & Grant Applicants",
    psychologicalTrigger: "Greed, Phantom Windfalls & Fabricated Clearinghouse Fees",
    vectorChannel: "Unsolicited International Awards & Lottery Notices",
    personalizationAdvice: "For all recipients: You cannot win a competition or grant you never applied for. Demands for an upfront clearance fee to receive a larger payout are fraudulent.",
    samplePayload: `From: claims@international-lottery-grant.org\nSubject: Official Award Certificate: $450,000 Inheritance Grant Cleared\n\nDear Beneficiary, Your inheritance grant of $450,000 has been verified by the foreign clearance board. To remit funds to your local bank, an initial customs clearance stamp fee of $185 must be transmitted via Western Union or voucher link: http://grant-clearance-stamp.org/payout. Reply immediately.`
  },
  "Smishing / Urgent Delivery Scam": {
    code: "ATK-05",
    category: "Mobile & SMS",
    icon: "sms",
    severity: "High Risk",
    severityClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dotClass: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700",
    targetAudience: "Smartphone Users, E-commerce Buyers & Hostellers",
    psychologicalTrigger: "Package Delivery Interruption & Nominal ($1.99) Payment Trap",
    vectorChannel: "SMS / RCS Mobile Notifications with Short URLs",
    personalizationAdvice: "For mobile users: Courier services will not hold deliveries conditional on clicking shortened URLs. Track directly through the courier's official app or web portal.",
    samplePayload: `USPS Alert: Your package #9400109 could not be delivered due to an incomplete street address. Update your details and pay $1.99 redelivery fee at https://usps-redelivery-portal.info/track within 24 hours.`
  },
  "Generic Phishing": {
    code: "ATK-06",
    category: "Broad Campaigns",
    icon: "mark_email_unread",
    severity: "Elevated Risk",
    severityClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
    dotClass: "bg-indigo-500",
    iconBg: "bg-indigo-100 text-indigo-700",
    targetAudience: "All Campus Inboxes & Public Email Accounts",
    psychologicalTrigger: "Broad System Alerts, Vague Warnings & Urgency Tricks",
    vectorChannel: "Automated Mass Mailers & Generic Domain Spoofing",
    personalizationAdvice: "For general users: Look for impersonal greetings ('Dear Customer') and mismatch between the sender display name and the underlying email address.",
    samplePayload: `From: support@service-notification-alert.com\nSubject: Critical Security Notice: Action Required Immediately\n\nDear Valued Customer, We have flagged irregular activity across your personal account services. To preserve continuous access and update your verification tokens, click here immediately: http://account-service-login-sync.com/auth. Failure to update within 24 hours will result in service termination.`
  }
};

const DEFAULT_META = {
  code: "ATK-REF",
  category: "General Threat",
  icon: "security",
  severity: "Elevated Risk",
  severityClass: "text-blue-700 bg-blue-50 border-blue-200",
  dotClass: "bg-blue-500",
  iconBg: "bg-blue-100 text-blue-700",
  targetAudience: "General Internet & Email Users",
  psychologicalTrigger: "Social Engineering Pressure",
  vectorChannel: "Email / Web Messaging",
  personalizationAdvice: "Always verify unprompted requests using official and independent channels.",
  samplePayload: `From: security-verify@external-system.org\nSubject: Account Review Notification\n\nPlease review your security status at http://verify-portal.org immediately.`
};

export default function GlossaryPage({ onNavigate }) {
  const [attackTypes, setAttackTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.meta.getAttackTypes();
        setAttackTypes(data || []);
        if (data && data.length > 0) {
          setSelectedAttack(data[0]);
        }
      } catch (err) {
        console.error('Failed to load attack glossary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = (text, label = 'Content') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`);
  };

  const categories = ['All', 'Campus & Student', 'Credential Theft', 'Financial & Wire', 'Mobile & SMS'];

  const filtered = attackTypes.filter((at) => {
    const meta = VECTOR_METADATA[at.name] || DEFAULT_META;
    const matchesCategory = selectedCategory === 'All' || meta.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      at.name.toLowerCase().includes(q) ||
      at.description.toLowerCase().includes(q) ||
      meta.category.toLowerCase().includes(q) ||
      meta.targetAudience.toLowerCase().includes(q)
    );
  });

  const selectedMeta = selectedAttack ? (VECTOR_METADATA[selectedAttack.name] || DEFAULT_META) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-xl border border-slate-700 animate-fade-in">
          <span className="material-symbols-outlined text-cyan-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0B1220] via-[#14233D] to-[#0B1220] p-6 sm:p-8 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              THREAT ENCYCLOPEDIA (FR-18) • APPLIED CYBER INTELLIGENCE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Attack Type Glossary & Forensic Reference
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Curated taxonomy of real-world social engineering attack vectors, behavioral deception tactics, technical forensic red flags, and role-personalized defensive protocols.
            </p>
          </div>

          {/* Key Metrics Strip */}
          <div className="flex sm:grid sm:grid-cols-3 gap-3 shrink-0 overflow-x-auto">
            <div className="p-3 rounded-xl bg-[#0F1A2E] border border-slate-700/60 min-w-[110px] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Signatures</span>
              <span className="text-lg font-bold text-cyan-400">{attackTypes.length || 6} Vectors</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0F1A2E] border border-slate-700/60 min-w-[110px] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Coverage</span>
              <span className="text-lg font-bold text-emerald-400">100% Multi-Agent</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0F1A2E] border border-slate-700/60 min-w-[110px] text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Standards</span>
              <span className="text-lg font-bold text-blue-400">NIST / OWASP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <span className="material-symbols-outlined text-[18px]">search</span>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vectors or keywords..."
            className="w-full pl-10 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-2xs placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attack Vector Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-500">
            <span>DOCUMENTED VECTORS ({filtered.length})</span>
            <span>CLICK TO INSPECT</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
              <p className="text-xs">No attack vectors match your filter or search query.</p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="text-xs text-blue-600 font-semibold underline"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filtered.map((at) => {
              const meta = VECTOR_METADATA[at.name] || DEFAULT_META;
              const isSelected = selectedAttack?.attack_type_id === at.attack_type_id;

              return (
                <div
                  key={at.attack_type_id}
                  onClick={() => setSelectedAttack(at)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
                      : 'bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.iconBg} shadow-xs`}>
                      <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                          {meta.code} • {meta.category}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.severityClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                          {meta.severity}
                        </span>
                      </div>

                      <h3 className={`text-sm font-bold truncate mt-0.5 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {at.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {at.description}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate max-w-[200px]">{meta.targetAudience}</span>
                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                          {isSelected ? 'arrow_forward' : 'chevron_right'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: In-Depth Threat Profile & Defensive Blueprint */}
        <div className="lg:col-span-7">
          {selectedAttack ? (
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
              {/* Header Profile */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <span className="material-symbols-outlined text-[15px] text-blue-600">verified_user</span>
                    <span>VECTOR ID: {selectedMeta.code}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${selectedMeta.severityClass}`}>
                    <span className={`w-2 h-2 rounded-full ${selectedMeta.dotClass} animate-pulse`} />
                    <span>{selectedMeta.severity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedMeta.iconBg} shadow-sm`}>
                    <span className="material-symbols-outlined text-[26px]">{selectedMeta.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {selectedAttack.name}
                    </h2>
                    <span className="text-xs text-slate-500 font-medium">
                      Category: {selectedMeta.category} • Delivery Channel: {selectedMeta.vectorChannel}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {selectedAttack.description}
                </p>
              </div>

              {/* Psychological Trigger & Target Vulnerability Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">psychology</span>
                  Cognitive Exploitation & Target Vulnerability:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px] uppercase">Exploited Trigger:</span>
                    <span className="font-semibold text-slate-800">{selectedMeta.psychologicalTrigger}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-mono text-[10px] uppercase">Primary Targeted Group:</span>
                    <span className="font-semibold text-slate-800">{selectedMeta.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Forensic Red Flags */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-rose-900 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-rose-600 text-[18px]">find_in_page</span>
                    Forensic Indicators & Detection Signatures:
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedAttack.sample_indicators.join('\n'), 'Indicators')}
                    className="text-[11px] font-medium text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy List
                  </button>
                </div>
                <ul className="space-y-2 pl-4 list-disc text-xs text-slate-700 leading-relaxed">
                  {(selectedAttack.sample_indicators || []).map((ind, i) => (
                    <li key={i}>
                      <span className="font-medium text-slate-900">{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defense and Verification Protocol */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-900 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">shield</span>
                  Recommended Defense & Verification Protocol:
                </div>
                <ul className="space-y-2 pl-4 list-disc text-xs text-emerald-950 leading-relaxed">
                  {(selectedAttack.mitigation_tips || []).map((tip, i) => (
                    <li key={i}>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Role-Personalized Guidance Callout */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-900 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">tune</span>
                  Personalized AI Guidance Logic:
                </div>
                <p className="text-xs text-blue-950 leading-relaxed">
                  {selectedMeta.personalizationAdvice}
                </p>
              </div>

              {/* Realistic Payload Preview Card */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-slate-200 text-xs">
                <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Realistic Threat Vector Sample Payload</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedMeta.samplePayload, 'Payload')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy Sample
                  </button>
                </div>
                <pre className="p-4 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {selectedMeta.samplePayload}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-mono text-center sm:text-left">
                  Referenced by FR-12 & FR-18 classification engines
                </span>
                <button
                  onClick={() => onNavigate('submit', { initialText: selectedMeta.samplePayload })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">rocket_launch</span>
                  <span>Test Sample in Threat Studio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[40px] text-slate-300">menu_book</span>
              <p className="text-sm font-medium text-slate-600">No attack category selected</p>
              <p className="text-xs">Select any attack vector from the catalog on the left to inspect its complete forensic profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
