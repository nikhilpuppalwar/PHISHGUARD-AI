import React from 'react';

/**
 * ThreatAssessmentCard Component (Spec §4, §5, §25, §26, §27)
 * The primary result card presented at the top of the Threat Analysis Report.
 * Features:
 * - Simple, jargon-free headings (No "Bayesian Verdict" or "Harmonized Composite Risk")
 * - Prominent numerical score (e.g., 91 / 100) and risk level badge (LOW, MEDIUM, HIGH)
 * - Clear category title (e.g., "No Significant Phishing Attack Detected" for Low Risk)
 * - Short evidence-grounded 1-2 sentence summary
 * - Distinct, semantic visual themes for Low, Medium, and High risk states
 */
export default function ThreatAssessmentCard({
  score = 0,
  severity = 'Low Risk',
  confidence = 0.85,
  attackType = null,
  attackDescription = null,
  summary = null
}) {
  const isLow = score < 40;
  const isMed = score >= 40 && score < 75;
  const isHigh = score >= 75;

  // Determine attack category heading per spec §4
  let displayTitle = '';
  let defaultSummary = '';

  if (isLow) {
    displayTitle = 'No Significant Phishing Attack Detected';
    defaultSummary = summary || 'No major phishing indicators were found in the available evidence.';
  } else if (isMed) {
    displayTitle = attackType && !attackType.toLowerCase().includes('generic')
      ? attackType
      : 'Suspicious Message';
    defaultSummary = summary || 'Some warning signs were detected. Verify the sender and destination before taking action.';
  } else {
    displayTitle = attackType && !attackType.toLowerCase().includes('generic')
      ? attackType
      : 'Targeted Phishing Attempt';
    defaultSummary = summary || 'Multiple suspicious indicators were detected across the submitted content and available evidence.';
  }

  // Visual styling variants
  const styles = isLow
    ? {
        cardBg: 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-200/90',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        scoreColor: 'text-emerald-700',
        iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: 'verified_user',
        levelLabel: 'LOW RISK',
        titleColor: 'text-emerald-950',
        summaryColor: 'text-emerald-900/80',
        scoreBoxBg: 'bg-emerald-50/80 border-emerald-200'
      }
    : isMed
    ? {
        cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-200/90',
        badge: 'bg-amber-100 text-amber-900 border-amber-300',
        scoreColor: 'text-amber-700',
        iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: 'warning',
        levelLabel: 'MEDIUM RISK',
        titleColor: 'text-amber-950',
        summaryColor: 'text-amber-900/80',
        scoreBoxBg: 'bg-amber-50/80 border-amber-200'
      }
    : {
        cardBg: 'bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 border-rose-200/90',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        scoreColor: 'text-rose-700',
        iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
        icon: 'gpp_maybe',
        levelLabel: 'HIGH RISK',
        titleColor: 'text-rose-950',
        summaryColor: 'text-slate-700',
        scoreBoxBg: 'bg-rose-50/80 border-rose-200'
      };

  return (
    <div className={`p-6 sm:p-7 rounded-2xl border shadow-sm transition-all ${styles.cardBg}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Level badge, Main Category Heading, and Evidence-grounded Summary */}
        <div className="space-y-2.5 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Threat Assessment
            </span>
            <span className="text-slate-300">•</span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wide border shadow-2xs ${styles.badge}`}>
              <span className="material-symbols-outlined text-[15px]">{styles.icon}</span>
              <span>{styles.levelLabel}</span>
            </span>

            {confidence && (
              <span className="text-xs font-mono font-medium text-slate-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                Confidence: {Math.round(confidence * 100)}%
              </span>
            )}
          </div>

          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${styles.titleColor}`}>
            {displayTitle}
          </h2>

          <p className={`text-sm sm:text-base leading-relaxed ${styles.summaryColor}`}>
            {defaultSummary}
          </p>

          {attackDescription && attackDescription !== defaultSummary && (
            <p className="text-xs text-slate-500 leading-relaxed font-normal pt-0.5">
              {attackDescription}
            </p>
          )}
        </div>

        {/* Right: Prominent Numerical Score Gauge */}
        <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border shrink-0 shadow-2xs self-start md:self-center ${styles.scoreBoxBg}`}>
          <div className="text-right">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold">
              Threat Score
            </div>
            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${styles.scoreColor}`}>
              {Math.round(score)}
              <span className="text-sm sm:text-base font-semibold text-slate-400 ml-1">/100</span>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs border ${styles.iconBg}`}>
            <span className="material-symbols-outlined text-[28px]">{styles.icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
