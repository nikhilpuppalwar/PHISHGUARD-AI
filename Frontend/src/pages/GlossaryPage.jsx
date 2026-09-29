import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

const VECTOR_METADATA = {
  "Internship Scam": {
    code: "ATK-01",
    category: "Campus & Student",
    icon: "school",
    severity: "High Risk",
    severityClass: "text-amber-700 bg-amber-50 border-amber-200",
    dotClass: "bg-amber-500",
    iconBg: "bg-amber-50 text-amber-700",
    targetAudience: "College Students, Recent Graduates & Job Seekers",
    psychologicalTrigger: "Job Market Anxiety & Artificial Scarcity (Urgent 2-hour deadline)",
    vectorChannel: "Unsolicited Job Emails & Fake Placement Links",
    personalizationAdvice: "For students: Cross-reference with your university career office. Legitimate employers never request upfront onboarding or verification fees before issuing formal offer letters.",
    samplePayload: `From: hr-verify@quick-career.org\nSubject: Summer Analyst Internship Offer - Allocation Verification Required\n\nCongratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours using the secure portal link below to reserve your slot and generate the candidate pass: http://bit.ly/internship-fee-2024. Failure to process immediately releases the allocation.`
  },
  "Credential Phishing": {
    code: "ATK-02",
    category: "Credential Theft",
    icon: "lock_open",
    severity: "Critical Risk",
    severityClass: "text-red-700 bg-red-50 border-red-200",
    dotClass: "bg-red-500",
    iconBg: "bg-red-50 text-red-700",
    targetAudience: "University Portal Users, Campus SSO Accounts & Professionals",
    psychologicalTrigger: "Fear of Account Deactivation & Service Suspension",
    vectorChannel: "Spoofed SSO Login Portals & Harvest Forms",
    personalizationAdvice: "For campus users: IT administrators will never send links requiring immediate password re-entry under threat of deactivation. Always verify the domain in your browser address bar.",
    samplePayload: `From: security-alert@paypal-update-center.com\nSubject: Unauthorized Login Attempt - Verify Password\n\nDear Customer, We detected an unauthorized sign-in to your PayPal wallet from an unfamiliar IP address. Verify your account password immediately at http://secure-paypal-login.xyz/verify to prevent permanent suspension.`
  },
  "Invoice Fraud": {
    code: "ATK-03",
    category: "Financial & Wire",
    icon: "receipt_long",
    severity: "High Risk",
    severityClass: "text-blue-700 bg-blue-50 border-blue-200",
    dotClass: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-700",
    targetAudience: "Academic Coordinators, Department Treasurers & Small Businesses",
    psychologicalTrigger: "Authority Impersonation & Wire Transfer Diversion",
    vectorChannel: "Spoofed Supplier Billing & Payment Gateway Links",
    personalizationAdvice: "For organizational roles: Never alter supplier bank details or execute wire payments based solely on an email request. Always perform out-of-band telephone verification.",
    samplePayload: `From: executive-billing@supplier-vendor-portal.net\nSubject: URGENT: Revised Wire Instructions for Outstanding Invoice #INV-84910\n\nAttention Accounts Payable: Please be advised that our primary treasury account has changed due to annual banking audit. Route all pending wire disbursements for invoice #INV-84910 ($14,850.00) to our new corporate account: http://wire-transfer-update.cc/portal. Confirm receipt within 4 hours.`
  },
  "Advance-Fee Scam": {
    code: "ATK-04",
    category: "Social Engineering",
    icon: "savings",
    severity: "Elevated Risk",
    severityClass: "text-purple-700 bg-purple-50 border-purple-200",
    dotClass: "bg-purple-500",
    iconBg: "bg-purple-50 text-purple-700",
    targetAudience: "General Email Users, Scholarship Seekers & Grant Applicants",
    psychologicalTrigger: "Phantom Windfalls & Fabricated Clearinghouse Fees",
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
    iconBg: "bg-emerald-50 text-emerald-700",
    targetAudience: "Smartphone Users, E-commerce Buyers & Students",
    psychologicalTrigger: "Package Delivery Interruption & Nominal ($1.99) Payment Trap",
    vectorChannel: "SMS / RCS Mobile Notifications with Short URLs",
    personalizationAdvice: "For mobile users: Courier services will not hold deliveries conditional on clicking shortened URLs. Track packages directly through the courier's official app or web portal.",
    samplePayload: `USPS Alert: Your package #9400109 could not be delivered due to an incomplete street address. Update your details and pay $1.99 redelivery fee at https://usps-redelivery-portal.info/track within 24 hours.`
  },
  "Generic Phishing": {
    code: "ATK-06",
    category: "Broad Campaigns",
    icon: "mark_email_unread",
    severity: "Elevated Risk",
    severityClass: "text-indigo-700 bg-indigo-50 border-indigo-200",
    dotClass: "bg-indigo-500",
    iconBg: "bg-indigo-50 text-indigo-700",
    targetAudience: "All Campus Inboxes & Public Email Accounts",
    psychologicalTrigger: "Broad System Alerts, Vague Warnings & Urgency Tricks",
    vectorChannel: "Automated Mass Mailers & Generic Domain Spoofing",
    personalizationAdvice: "For general users: Look for impersonal greetings ('Dear Customer') and mismatch between the sender display name and the underlying email address domain.",
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
  iconBg: "bg-blue-50 text-blue-700",
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
    setTimeout(() => setToastMessage(''), 2500);
  };

  const copyToClipboard = (text, label = 'Content') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`);
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
    <div className="space-y-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-md border border-slate-700 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Consistent Header & Breadcrumbs */}
      <PageHeader
        screenId="glossary"
        eyebrow="SECURITY"
        title="Attack Glossary"
        description="Curated taxonomy of social engineering attack vectors, behavioral deception mechanisms, technical forensic indicators, and defensive protocols."
        onNavigate={onNavigate}
      />

      {/* Forensic Reference Banner */}
      <div className="rounded-xl bg-navy-900 p-6 sm:p-7 text-white border border-navy-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded text-xs font-mono font-bold bg-navy-800 text-slate-200 border border-slate-700">
              <span>Threat Taxonomy & Forensic Reference (FR-18)</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Vector Intelligence Catalog
            </div>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Explore attack vector signatures, real-world lures, and personalized defense advice calibrated to your role.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/60 text-center min-w-[110px]">
              <span className="text-xs font-mono uppercase text-slate-300 font-bold block">Signatures</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{attackTypes.length || 6} Vectors</span>
            </div>
            <div className="p-3.5 rounded-lg bg-navy-800 border border-slate-700/60 text-center min-w-[110px]">
              <span className="text-xs font-mono uppercase text-slate-300 font-bold block">Coverage</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">Multi-Agent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <label htmlFor="glossary-search" className="sr-only">Search vectors</label>
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </span>
          <input
            id="glossary-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vectors or keywords..."
            className="w-full pl-10 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Master-Detail Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Attack Vector Catalog */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
            <span>DOCUMENTED VECTORS ({filtered.length})</span>
            <span>SELECT TO VIEW</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-white border border-slate-200 text-slate-600 space-y-2">
              <span className="material-symbols-outlined text-[36px] text-slate-400">search_off</span>
              <p className="text-sm">No attack vectors match your search criteria.</p>
              <button
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="text-sm text-blue-600 font-semibold underline"
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
                  className={`p-4 rounded-xl border transition-colors cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg} border border-slate-200/60`}>
                      <span className="material-symbols-outlined text-[20px]">{meta.icon}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
                          {meta.code} • {meta.category}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${meta.severityClass}`}>
                          {meta.severity}
                        </span>
                      </div>

                      <h3 className={`text-base font-bold truncate mt-1 ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {at.name}
                      </h3>

                      <p className="text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {at.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: In-Depth Threat Profile */}
        <div className="lg:col-span-7">
          {selectedAttack ? (
            <div className="rounded-xl bg-white border border-slate-200 shadow-2xs p-6 sm:p-7 space-y-5">
              {/* Header Profile */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    <span>VECTOR ID: {selectedMeta.code}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-bold border ${selectedMeta.severityClass}`}>
                    <span>{selectedMeta.severity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${selectedMeta.iconBg} border border-slate-200/60`}>
                    <span className="material-symbols-outlined text-[24px]">{selectedMeta.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {selectedAttack.name}
                    </h2>
                    <span className="text-sm text-slate-600 font-medium">
                      Category: {selectedMeta.category} • Channel: {selectedMeta.vectorChannel}
                    </span>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-700 leading-relaxed pt-1">
                  {selectedAttack.description}
                </p>
              </div>

              {/* Target & Vulnerability Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="text-sm font-mono font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-[18px]">psychology</span>
                  Target Demographics & Trigger Mechanics:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm pt-0.5">
                  <div>
                    <span className="text-slate-500 block font-mono text-xs uppercase font-bold">Exploited Trigger:</span>
                    <span className="font-semibold text-slate-900 leading-relaxed">{selectedMeta.psychologicalTrigger}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-mono text-xs uppercase font-bold">Targeted Group:</span>
                    <span className="font-semibold text-slate-900 leading-relaxed">{selectedMeta.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Forensic Red Flags */}
              <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-mono font-bold text-red-950 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-600 text-[18px]">find_in_page</span>
                    Forensic Indicators & Signatures:
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedAttack.sample_indicators.join('\n'), 'Indicators')}
                    className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 font-mono"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>Copy</span>
                  </button>
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-sm text-slate-800 leading-relaxed">
                  {(selectedAttack.sample_indicators || []).map((ind, i) => (
                    <li key={i}>
                      <span className="font-semibold text-slate-900">{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Defense and Verification Protocol */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="text-sm font-mono font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">shield</span>
                  Defense & Verification Protocol:
                </div>
                <ul className="space-y-1.5 pl-5 list-disc text-sm text-emerald-950 leading-relaxed">
                  {(selectedAttack.mitigation_tips || []).map((tip, i) => (
                    <li key={i}>
                      <span className="font-medium">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Realistic Payload Preview Box */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-navy-900 text-slate-200 text-sm">
                <div className="px-4 py-2.5 bg-navy-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-300 font-bold uppercase tracking-wider">
                    <span>Sample Vector Payload</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedMeta.samplePayload, 'Payload')}
                    className="text-xs text-slate-200 hover:text-white flex items-center gap-1 font-mono font-semibold"
                  >
                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto whitespace-pre-wrap">
                  {selectedMeta.samplePayload}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3.5 border-t border-slate-100">
                <span className="text-xs text-slate-600 font-mono font-semibold">
                  Referenced by FR-12 classification engine
                </span>
                <button
                  onClick={() => onNavigate('submit', { initialText: selectedMeta.samplePayload })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  <span>Test in Threat Studio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl bg-white border border-slate-200 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-[36px] text-slate-300">menu_book</span>
              <p className="text-sm font-medium text-slate-600">No attack vector selected</p>
              <p className="text-xs">Select any attack vector from the catalog on the left to inspect its complete profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
