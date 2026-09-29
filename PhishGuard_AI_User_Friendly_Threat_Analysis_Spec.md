# PhishGuard AI — User-Friendly Threat Analysis Report Specification

## Purpose

Redesign the existing **Threat Analysis Report** so that the powerful backend remains intact while the frontend becomes easy for a normal user to understand.

The system features a multi-agent forensic workflow with Text Agent, URL Agent, Sender Agent, External Threat Intelligence, Incident RAG, Bayesian Risk AI, Explainable AI, Personalization, and Generative AI.

The report uses **progressive disclosure**:

> **Simple result first → evidence → action → personalization → technical details**

The user understands the result within a few seconds without needing prior knowledge of ML, RAG, SHAP, Bayesian fusion, or AI agents.

---

# 1. Main UX Principle

The report answers these questions in this order:

1. **What did I submit?**
2. **Is it risky?**
3. **Why did you say that?**
4. **What should I do?**
5. **Why does this matter to me?**
6. **How can I inspect the technical details?**

---

# 2. Final Report Order

1. **Report Header**: Compact metadata (Channel, Sender, Scanned datetime, Quick actions: New Analysis, Feedback, Print).
2. **Threat Assessment**: Prominent score (e.g. 56 / 100), Risk Level badge (LOW, MEDIUM, HIGH), attack category title, and 1–2 sentence evidence-grounded summary.
3. **Your Submitted Content**: Monospaced sandbox, non-clickable links, copy button, line breaks preserved, expand/collapse for long content.
4. **Why This Result? & What Should You Do?**:
   - Why This Result?: Top 3–5 plain-language evidence points grounded in actual analysis data.
   - What Should You Do?: Dynamic 3–5 countermeasures tailored to risk & attack type (calm assurance for Low Risk).
5. **Why This Matters to You?**: Role, Relevant Activity, Security Awareness, and personalized relevance explanation; gracefully hidden if no meaningful context.
6. **How Did We Check It?**: Evidence Coverage compact matrix (`✓ Evaluated`, `— Not provided`, `○ Not applicable`, `⚠ Unavailable`).
7. **Similar Incident & Top Risk Factors**:
   - Similar Incident: Similarity % badge, historical attack pattern, common indicators, and expandable `[View What Changed]`.
   - Top Risk Factors: Compact rows with severity tags (HIGH, MEDIUM, LOW) and `View All Factors` toggle.
8. **Technical Analysis**: Collapsed by default. Expands to show Multi-Agent Signal Contribution, specialized 4-agent SHAP attribution deltas, and External Threat Intelligence (GSB & VirusTotal).
9. **Detailed Explanation / Explainable AI**: Collapsed by default. Expands to show Overall Finding, Key Flagged Indicators, and Agent-by-Agent evidence breakdown.
10. **Technical Execution Trace**: Collapsed by default (`11 execution stages completed [View Full Trace]`).
11. **User Feedback**: Inline widget (`Was this result helpful? [Yes/No]`, `Was the assessment correct? [Phishing/Legitimate/Unsure]`).
12. **About This Analysis & Limitations**: Plain description, expandable Technical Methodology, and clear limitations notice.

---

# 3. Wording & Integrity Rules

- No technical jargon in primary headings (no "Bayesian Risk Assessment Verdict", "Harmonized Composite Risk", "SHAP Delta", "Vector Similarity", "RFC Authentication", "PhiUSIIL").
- Low Risk (< 40) displays "No Significant Phishing Attack Detected".
- External intelligence handles 0/0 as "No detection data returned", never "Safe".
- All sections use the same evaluated incident data consistently.
