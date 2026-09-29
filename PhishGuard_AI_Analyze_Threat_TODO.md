# PhishGuard AI — Analyze Threat TODO

## P0 — Critical

- [x] Inspect current Analyze Threat page and Threat Analysis Report implementation.
- [x] Inspect current Text Agent implementation.
- [x] Inspect current URL Agent implementation.
- [x] Inspect current Sender Agent implementation.
- [x] Inspect Incident Memory RAG implementation.
- [x] Inspect Risk AI / Bayesian Risk Fusion implementation.
- [x] Inspect Attack Classification logic.
- [x] Inspect Explainable AI generation.
- [x] Inspect Personalization / User Profile retrieval.
- [x] Inspect MongoDB schemas and persistence.
- [x] Search for hard-coded profile-specific text such as "nuclear scientist", "sensitive clearance", sample identities, and static attack labels.
- [x] Preserve exact original user input in the incident record.
- [x] Display original submitted content in the final report.
- [x] Add safe rendering/sanitization for original content.
- [x] Add expand/collapse and copy for long original content.
- [x] Fix Attack Classification so low-risk inputs do not receive forced phishing categories.
- [x] Ensure Risk AI has deterministic/documented evidence fusion.
- [x] Ensure personalization uses the authenticated user's current profile.
- [x] Remove stale/static personalized action plans.

## P1 — Text Agent

- [x] Verify TF-IDF + Logistic Regression output.
- [x] Verify LLM reasoning uses only supplied message evidence.
- [x] Return structured evidence.
- [x] Return ML probability and status.
- [x] Detect urgency.
- [x] Detect payment requests.
- [x] Detect credential requests.
- [x] Detect social engineering.
- [x] Detect impersonation.
- [x] Detect suspicious calls to action.

## P1 — URL Agent

- [x] Verify XGBoost model integration.
- [x] Verify URL structural feature extraction.
- [x] Integrate Google Safe Browsing.
- [x] Integrate VirusTotal API v3.
- [x] Normalize provider responses.
- [x] Add provider states: Known threat, Not identified, Unavailable, Error, Not checked.
- [x] Never treat provider non-match as guaranteed safe.
- [x] Cache URL threat checks in MongoDB.
- [x] Avoid unnecessary repeated external API calls.
- [x] Verify URL-agent output reaches Risk AI.

## P1 — Sender Agent

- [x] Verify sender/domain analysis.
- [x] Verify Random Forest if currently used.
- [x] Verify display-name impersonation.
- [x] Verify sender/domain mismatch.
- [x] Verify reply-to mismatch when available.
- [x] Verify SPF/DKIM/DMARC only when headers are provided.
- [x] Show unavailable header evidence as "Not provided".
- [x] Never fabricate sender evidence.

## P1 — Incident Memory / RAG

- [x] Verify embeddings/retrieval.
- [x] Add similarity threshold.
- [x] Return only relevant incidents.
- [x] Show "No sufficiently similar previous incident found" when no match passes threshold.
- [x] Show similarity only when actually calculated.
- [x] Implement What Changed? for strong matches.
- [x] Prevent random historical incidents.
- [x] Store meaningful confirmed incidents in MongoDB and Incident RAG.

## P1 — Risk AI

- [x] Verify inputs from Text Agent.
- [x] Verify inputs from URL Agent.
- [x] Verify inputs from Sender Agent.
- [x] Verify Incident RAG contribution.
- [x] Verify external threat-intelligence contribution.
- [x] Document the risk formula/weights.
- [x] Keep risk calculation deterministic.
- [x] Store evidence used for score.
- [x] Decide whether user profile affects numeric score or only relevance/presentation.
- [x] If numeric personalization is used, show base vs personalized score.
- [x] Do not allow LLM to silently change score.

## P1 — Attack Classification

- [x] Implement low/medium/high-aware classification states.
- [x] LOW → no significant attack detected.
- [x] MEDIUM → suspicious / possible attack.
- [x] HIGH → specific category only when supported.
- [x] Add classification confidence only when calculated.
- [x] Verify classification is based on evidence.

## P1 — Explainable AI

- [x] Add Overall Finding.
- [x] Add Why It Was Flagged.
- [x] Add numbered evidence.
- [x] Add evidence grouped by agent.
- [x] Add external-intelligence evidence.
- [x] Add RAG similarity evidence.
- [x] Add risk-factor contribution.
- [x] Add final detailed explanation.
- [x] Remove generic/very-short summaries.
- [x] Prevent fabricated evidence.

## P1 — Personalization

- [x] Retrieve current authenticated user's profile.
- [x] Verify correct user ID is used.
- [x] Remove all static/stale profile references.
- [x] Add Personalization Context panel.
- [x] Use actual role.
- [x] Use relevant activities.
- [x] Use awareness level.
- [x] Use relevant previous incidents.
- [x] Use explanation preference.
- [x] Dynamically generate defense action plan.
- [x] Keep security evidence independent from profile.
- [x] Add "Why this matters to you?" section.

## P1 — Final Report UI

- [x] Reorder sections according to specification.
- [x] Add Original Submitted Content.
- [x] Add Attack Classification state.
- [x] Add Agent Analysis/Trace.
- [x] Add External Threat Intelligence.
- [x] Add Incident Memory.
- [x] Add Risk Factor Breakdown.
- [x] Add detailed Explainable AI Forensic Summary.
- [x] Add Personalization Context.
- [x] Add dynamic Personalized Defense Action Plan.
- [x] Add What Changed? when applicable.
- [x] Add Evidence Coverage.
- [x] Add Before You Act checklist.
- [x] Add Analysis Note.
- [x] Keep New Analysis working.

## P2 — MongoDB

- [x] Confirm MongoDB is the primary database.
- [x] Verify collections: users, user_profiles, incidents, feedback, url_threat_checks, rag_metadata.
- [x] Store original_content.
- [x] Store structured agent results.
- [x] Store RAG results.
- [x] Store external intelligence.
- [x] Store risk result.
- [x] Store attack classification.
- [x] Store explainability.
- [x] Store personalization context.
- [x] Store generated report.
- [x] Store user feedback.
- [x] Do not add unnecessary system_logs collection.

## P2 — Security

- [x] Verify user-specific authorization.
- [x] Sanitize user-submitted HTML/email content.
- [x] Prevent script execution from submitted content.
- [x] Keep external API keys backend-only.
- [x] Do not log secrets.
- [x] Handle external API timeouts.
- [x] Handle rate limits.
- [x] Treat unavailable external services as unavailable, not safe.

## P2 — Testing

### Legitimate message
- [x] University notice.
- [x] Low risk.
- [x] No significant attack classification.
- [x] No forced phishing label.

### Suspicious message
- [x] Medium risk.
- [x] Suspicious classification.
- [x] Evidence shown.

### High-risk phishing
- [x] Internship scam.
- [x] High risk.
- [x] Specific attack category.
- [x] Detailed explanation.
- [x] Dynamic personalized action plan.

### URL
- [x] XGBoost runs.
- [x] Structural analysis runs.
- [x] Safe Browsing runs when configured.
- [x] VirusTotal runs when configured.
- [x] Provider results display correctly.

### Missing URL
- [x] URL Agent does not break the analysis.
- [x] External URL intelligence marked not applicable.

### Missing sender data
- [x] Sender Agent returns limited evidence.
- [x] No fabricated authentication results.

### RAG
- [x] No-match case works.
- [x] Strong-match case works.
- [x] What Changed? works.

### Personalization
- [x] Two different user profiles produce context-appropriate guidance.
- [x] Core security evidence remains consistent.
- [x] No stale profile text appears.

### External APIs unavailable
- [x] Analysis continues.
- [x] Provider shown as unavailable.
- [x] No false safe conclusion.

### Original content
- [x] Exact content is preserved.
- [x] Long content expands/collapses.
- [x] Copy works.

## P2 — Quality

- [x] Remove hard-coded demo output from production result components.
- [x] Remove duplicate analysis logic.
- [x] Keep API contracts consistent.
- [x] Add loading states.
- [x] Add empty states.
- [x] Add clear error states.
- [x] Verify responsive layout.
- [x] Run backend tests.
- [x] Run frontend lint/build.
- [x] Run end-to-end manual test.
- [x] Update README/project documentation.

## Final Definition of Done

- [x] Original submitted content is visible.
- [x] Risk is evidence-driven.
- [x] User profile is dynamically used.
- [x] Attack classification matches risk/evidence.
- [x] Text Agent works.
- [x] URL Agent works.
- [x] Sender Agent works.
- [x] Incident RAG works.
- [x] Explainable AI is detailed.
- [x] Personalized action plan is dynamic.
- [x] No stale hard-coded profile text exists.
- [x] MongoDB persistence works.
- [x] Feedback works.
- [x] External API integration works when configured.
- [x] External API failure does not break analysis.
- [x] No secrets are exposed.
- [x] Existing major features are not broken.
