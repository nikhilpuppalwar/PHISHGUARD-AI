# PhishGuard AI — User-Friendly Threat Analysis TODO

## P0 — Audit & Core Foundations

- [x] Inspect current Analyze Threat page.
- [x] Inspect current Threat Analysis Report.
- [x] Inspect current incident API response.
- [x] Inspect Text Agent.
- [x] Inspect URL Agent.
- [x] Inspect Sender Agent.
- [x] Inspect Incident RAG.
- [x] Inspect Risk AI.
- [x] Inspect Attack Classification.
- [x] Inspect Explainable AI.
- [x] Inspect Personalization AI.
- [x] Inspect GenAI output generation.
- [x] Inspect MongoDB incident schema.
- [x] Search for hard-coded sample personas and report text.

## P0 — Data Integrity

- [x] Ensure each report uses the current incident only.
- [x] Ensure each report uses the authenticated user's profile.
- [x] Preserve original_content exactly.
- [x] Prevent stale result state when loading a new incident.
- [x] Ensure risk score, classification, factors, explanation and recommendations agree.
- [x] Ensure missing data is represented as unavailable/not provided.
- [x] Remove hard-coded production personas.

## P0 — Top Result

- [x] Rename top section to "Threat Assessment".
- [x] Show risk level prominently.
- [x] Show score prominently.
- [x] Show evidence confidence only if genuinely calculated.
- [x] Add short evidence-grounded summary.
- [x] Make Low/Medium/High layouts distinct.
- [x] Do not force a phishing category on Low Risk.

## P0 — Original Content

- [x] Add "Your Submitted Content".
- [x] Display exact original content.
- [x] Preserve line breaks.
- [x] Show email metadata when actually provided.
- [x] Show extracted URL(s).
- [x] Add safe sandbox rendering.
- [x] Disable accidental link navigation.
- [x] Add Copy button.
- [x] Add Expand/Collapse for long input.

## P1 — Simple Explanation

- [x] Add "Why This Result?" section.
- [x] Show top 3–5 strongest evidence points.
- [x] Generate reasons from actual evidence.
- [x] Use plain language.
- [x] Create Low Risk explanation state.
- [x] Create Medium Risk explanation state.
- [x] Create High Risk explanation state.
- [x] Remove unsupported absolute claims.

## P1 — Action Plan

- [x] Move "What Should You Do?" near the top.
- [x] Generate actions based on risk.
- [x] Generate actions based on attack type.
- [x] Keep primary action plan to 3–5 actions.
- [x] Remove static generic action lists.
- [x] Add detailed action plan under expandable section if needed.
- [x] Verify actions do not contradict risk level.

## P1 — Personalization

- [x] Load current authenticated user's profile.
- [x] Use relevant profile context.
- [x] Add "Why This Matters to You?".
- [x] Add role.
- [x] Add relevant activity.
- [x] Add awareness level.
- [x] Add relevant history when available.
- [x] Hide section when no meaningful personalization exists.
- [x] Ensure profile does not arbitrarily set threat severity.
- [x] Remove stale sample persona text.

## P1 — Evidence Coverage

- [x] Add "How Did We Check It?".
- [x] Text status.
- [x] URL status.
- [x] Sender status.
- [x] External intelligence status.
- [x] RAG status.
- [x] User profile status.
- [x] Use clear status labels:
  - [x] Evaluated
  - [x] Not provided
  - [x] Not applicable
  - [x] Unavailable

## P1 — Agent Analysis

- [x] Put Text/URL/Sender/Incident into one Technical Analysis section.
- [x] Collapse technical cards by default.
- [x] Show model name.
- [x] Show real ML result.
- [x] Show actual evidence.
- [x] Show actual confidence if available.
- [x] Prevent fabricated sender authentication results.
- [x] Prevent fabricated agent evidence.

## P1 — External Intelligence

- [x] Google Safe Browsing state handling.
- [x] VirusTotal state handling.
- [x] Live vs cached indicator.
- [x] Error state.
- [x] Unavailable state.
- [x] Not checked state.
- [x] Fix 0/0 interpretation (Never "Safe" / "No detection data returned").
- [x] 0/Y should mean no malicious detections reported by queried engines.
- [x] Do not call no-match "Safe".
- [x] Add provider timestamp where useful.

## P1 — Incident Memory

- [x] Show compact Similar Incident card.
- [x] Use actual RAG similarity.
- [x] Apply similarity threshold.
- [x] Show no-match state.
- [x] Never show random historical cases.
- [x] Add "View What Changed" only for strong matches.
- [x] Build actual previous/current comparison.

## P1 — Risk Factors

- [x] Replace large individual cards with compact rows.
- [x] Show top risk factors first.
- [x] Add View All.
- [x] Show severity only if calculated.
- [x] Do not show identical 85% contribution for all factors.
- [x] Show numerical contributions only when actually calculated.
- [x] Keep detailed SHAP in Technical Analysis.

## P1 — Explainable AI

- [x] Rename primary heading to "Detailed Explanation".
- [x] Add Overall Finding.
- [x] Add Why It Was Flagged.
- [x] Add Evidence by Agent.
- [x] Add Incident Memory Context.
- [x] Add External Intelligence.
- [x] Add Risk Interpretation.
- [x] Add optional Technical Details.
- [x] Prevent unsupported statements.
- [x] Prevent LLM from changing the actual risk score.

## P1 — Attack Classification

- [x] Low → No significant phishing attack detected.
- [x] Medium → Suspicious / Possible attack.
- [x] High → Specific category when supported.
- [x] Add confidence only when calculated.
- [x] Make classification evidence-aware.

## P2 — UI Simplification

- [x] Reduce visible initial text by progressive disclosure.
- [x] Collapse technical sections by default.
- [x] Avoid showing all execution stages by default.
- [x] Avoid duplicate information.
- [x] Make buttons clear.
- [x] Keep card widths readable.
- [x] Avoid very narrow columns.
- [x] Keep consistent spacing.
- [x] Keep risk colors semantic.

## P2 — Layout & Responsive

- [x] Threat Summary full width.
- [x] Original Content full width.
- [x] Why This Result / What Should You Do side-by-side.
- [x] Personalization full width.
- [x] Evidence Coverage compact.
- [x] Similar Incident / Risk Factors grid.
- [x] Technical Analysis lower on page (collapsed by default).
- [x] Explainability expandable (collapsed by default).
- [x] Pipeline Trace collapsed by default.
- [x] Feedback near bottom.
- [x] Limitations at bottom.
- [x] Test responsive behavior across viewport widths.

## P2 — Feedback & Transparency

- [x] Was this result helpful? (Yes / No).
- [x] Was the assessment correct? (Phishing / Legitimate / Unsure).
- [x] Associate feedback with submission ID.
- [x] Add short "About This Analysis".
- [x] Add expandable Technical Methodology.
- [x] Add limitations notice.
