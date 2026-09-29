import React from 'react';

/**
 * External Threat Intelligence Component (Spec §1, §2, §7, §16, §21).
 * Displays real-world URL reputation evidence from Google Safe Browsing and VirusTotal.
 * Strictly adheres to wording rules:
 * - "Not identified as a known Google Safe Browsing threat." (Never "Safe")
 * - "No malicious detections reported by the queried engines." (Never "Safe")
 * - Clearly displays "Demo Mode — Simulated" when in simulated fallback.
 */
export default function ExternalThreatIntelligence({ intel, urlEvidence }) {
  if (!intel && !urlEvidence?.external_intelligence) {
    return null;
  }

  const threatData = intel || urlEvidence?.external_intelligence || {};
  const gsb = threatData.google_safe_browsing || {};
  const vt = threatData.virustotal || {};
  const checkedAt = threatData.checked_at;
  const isSimulated = gsb.is_simulated || vt.is_simulated || false;
  const isCached = threatData.cached || false;

  // Resolve GSB status text and style
  const renderGSBStatus = () => {
    if (!gsb.checked) {
      return {
        label: 'Unavailable',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
        detail: gsb.details || 'External threat intelligence unavailable. Assessment uses internal analysis.'
      };
    }
    if (gsb.known_threat) {
      const types = (gsb.threat_types && gsb.threat_types.length > 0)
        ? gsb.threat_types.join(', ')
        : 'SOCIAL_ENGINEERING';
      return {
        label: `Known Threat: ${types}`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-600',
        detail: gsb.details || 'Identified as a malicious threat entry by Google Safe Browsing.'
      };
    }
    return {
      label: 'Not identified as a known Google Safe Browsing threat',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      dotColor: 'bg-emerald-600',
      detail: gsb.details || 'Not identified as a known Google Safe Browsing threat.'
    };
  };

  // Resolve VirusTotal status text and style
  const renderVTStatus = () => {
    if (!vt.checked) {
      return {
        label: 'Unavailable',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        dotColor: 'bg-slate-400',
        detail: vt.details || 'External threat intelligence unavailable. Assessment uses internal analysis.'
      };
    }
    const mal = vt.malicious || 0;
    const susp = vt.suspicious || 0;
    const total = vt.total_engines || 0;
    const ratio = vt.detection_ratio || `${mal}/${total}`;

    if (mal >= 3) {
      return {
        label: 'Malicious',
        ratio: ratio,
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        dotColor: 'bg-red-600',
        detail: `${mal} of ${total} engines flagged malicious (${susp} suspicious).`
      };
    }
    if (mal > 0 || susp > 0) {
      return {
        label: 'Suspicious',
        ratio: ratio,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        detail: `${mal} malicious, ${susp} suspicious out of ${total} security engines.`
      };
    }
    return {
      label: 'No detections',
      ratio: ratio,
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
      dotColor: 'bg-emerald-600',
      detail: 'No malicious detections reported by the queried engines.'
    };
  };

  const gsbInfo = renderGSBStatus();
  const vtInfo = renderVTStatus();

  return (
    <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
            <span className="material-symbols-outlined text-[19px]">public</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              External Threat Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Real-world reputation evidence corroborating internal ML analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSimulated && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Demo Mode — Simulated
            </span>
          )}
          {isCached && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
              <span className="material-symbols-outlined text-[14px]">cached</span>
              MongoDB Cached
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Safe Browsing */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${gsbInfo.dotColor}`} />
              <span className="text-sm font-bold text-slate-900">
                Google Safe Browsing
              </span>
            </div>
            <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
              {gsb.checked ? (
                <>
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                  <span>Checked</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">cancel</span>
                  <span>Unavailable</span>
                </>
              )}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-mono font-medium">Status Verdict:</div>
            <div className={`text-xs sm:text-sm px-3 py-1.5 rounded-md border font-semibold ${gsbInfo.badgeClass}`}>
              {gsbInfo.label}
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-slate-200/60">
            {gsbInfo.detail}
          </p>
        </div>

        {/* VirusTotal */}
        <div className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${vtInfo.dotColor}`} />
              <span className="text-sm font-bold text-slate-900">
                VirusTotal (API v3)
              </span>
            </div>
            <span className="text-xs font-mono text-slate-600 flex items-center gap-1">
              {vt.checked ? (
                <>
                  <span className="material-symbols-outlined text-emerald-600 text-[16px]">check_circle</span>
                  <span>Checked</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">cancel</span>
                  <span>Unavailable</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-mono font-medium">Detections:</div>
              <div className="text-sm px-2.5 py-1.5 rounded-md border bg-white border-slate-200 font-mono font-bold text-slate-900">
                {vt.detection_ratio || '0/0'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-500 font-mono font-medium">Status:</div>
              <div className={`text-xs sm:text-sm px-2.5 py-1.5 rounded-md border font-semibold truncate ${vtInfo.badgeClass}`}>
                {vtInfo.label}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-slate-200/60">
            {vtInfo.detail}
          </p>
        </div>
      </div>

      {/* Metadata footer */}
      {checkedAt && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-500 pt-1">
          <span>
            Last verified: {new Date(checkedAt).toLocaleString()}
          </span>
          <span>
            Provider Security: TLS 1.3 Direct Proxy
          </span>
        </div>
      )}
    </div>
  );
}
