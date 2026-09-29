# PhishGuard AI — Analyze Threat Screen Specification & Implementation Prompt

## Purpose

Redesign and correct the **Analyze Threat → Threat Analysis Report** workflow of PhishGuard AI.

The objective is to make the analysis screen technically correct, transparent, personalized, and clearly connected to the project's final architecture:

**ML + AI Agents + RAG + Risk AI + Explainable AI + Attack Type Detection + Personalization AI + Generative AI + External Threat Intelligence**

This specification is based on the current Analyze Threat and Threat Analysis Report screens supplied for the project.

---

# 1. Main Problems to Fix

1. The original content submitted by the user is not prominently displayed in the final report.
2. The threat score needs a clear, evidence-based relationship with the authenticated user's profile and personalization context.
3. Attack Classification can show a specific attack even when the risk is low. Low-risk content must not be forced into a phishing category.
4. Text Agent, URL Agent, Sender Agent, and Incident Memory must behave as real independent evidence sources and return structured results.
5. Explainable AI is too short and generic.
6. The Personalized Defense Action Plan can display a wrong/stale profile such as a "nuclear scientist profile" instead of the authenticated user's current profile.
7. The report should clearly separate actual threat evidence, ML predictions, RAG evidence, external intelligence, user context, and generated explanation.
8. GenAI must not invent evidence or silently override structured results.
9. "Not detected" or provider non-match must never automatically mean "safe".

---

# 2. Golden End-to-End Pipeline

```text
Original User Content
        ↓
Preprocessing & Extraction
        ↓
AI Orchestrator
        ↓
┌────────────┬────────────┬───────────────┐
│ Text Agent │ URL Agent  │ Sender Agent  │
│ ML + LLM   │ ML + LLM   │ ML + LLM/Rules│
└────────────┴────────────┴───────────────┘
        ↓
Structured Agent Evidence
        ↓
Incident RAG
        ↓
External Threat Intelligence (when URL exists)
        ↓
Relevant User Profile Context
        ↓
Risk AI
        ↓
Attack Type Detection
        ↓
Explainable AI
        ↓
Personalization AI
        ↓
Generative AI
        ↓
Final Threat Report
        ↓
User Feedback
        ↓
MongoDB + RAG Memory
```

---

# 3. Original Submitted Content

The final report MUST display the **exact original content submitted by the authenticated user**, safely rendered.

Add a dedicated section near the top:

## Original Submitted Content

Example:

```text
From: hr@quick-career.org
Subject: Summer Analyst Internship

Congratulations! You have been selected for the internship.
Pay ₹2,000 within 2 hours to reserve your position.

https://example.com/verify
```

Requirements:

- Preserve the original wording.
- Preserve line breaks where practical.
- Preserve sender, subject, URLs, and other submitted fields.
- Safely sanitize HTML so scripts cannot execute.
- Do not silently rewrite the user's content.
- For long content, provide Expand / Collapse.
- Provide Copy.
- Keep the original content available in incident history.

Recommended report order:

```text
Threat Summary
↓
Risk Score + Level
↓
Original Submitted Content
↓
Attack Classification
```

---

# 4. Personalized Risk Assessment

The user's profile must be used for **personalized context**, but it must not arbitrarily override actual security evidence.

Recommended logic:

```text
Threat Evidence
+
ML Evidence
+
Agent Evidence
+
RAG Evidence
+
External Intelligence
        ↓
Base Threat Risk
        ↓
User Profile Context
        ↓
Personalized Relevance / Interpretation
        ↓
Final Report
```

The profile can affect:

- relevance
- explanation style
- recommendation detail
- priority
- examples
- awareness-specific guidance

The profile must NOT do:

```text
Student → automatically High Risk
Developer → automatically Low Risk
```

If numeric personalization is implemented, define a documented formula and show both values:

```text
Base Threat Risk: 84 / 100
Profile Relevance Adjustment: +4
Personalized Risk: 88 / 100
```

Only show this if the system actually calculates it.

Otherwise use:

```text
Threat Risk: 84 / 100
Profile Relevance: High
```

and explain why the threat is relevant to the user.

---

# 5. Attack Classification Must Match the Evidence

Do not show a specific attack type for every message.

## Low Risk

```text
Risk Score: 18 / 100
Risk Level: LOW

Attack Classification:
No significant phishing attack detected
```

## Medium Risk

```text
Risk Score: 56 / 100
Risk Level: MEDIUM

Attack Classification:
Suspicious / Possible Social Engineering
```

## High Risk

```text
Risk Score: 91 / 100
Risk Level: HIGH

Attack Classification:
Internship Scam
```

Possible categories:

- Internship / Job Scam
- Credential Theft
- Banking Phishing
- Delivery Scam
- Refund Scam
- Account Takeover
- Government Impersonation
- Corporate Impersonation
- Social Media Phishing
- Other

Only assign a specific category when evidence and confidence support it.

---

# 6. Text Agent

Use:

**TF-IDF + Logistic Regression + LLM reasoning**

The Text Agent should analyze:

- urgency
- payment requests
- credential requests
- password/OTP requests
- account verification
- threats
- rewards/offers
- impersonation
- social engineering
- suspicious calls to action
- unusual requests

Return structured evidence.

Example:

```json
{
  "agent": "text",
  "status": "success",
  "ml_probability": 0.89,
  "classification": "suspicious",
  "risk_level": "HIGH",
  "evidence": [
    {
      "indicator": "payment_request",
      "severity": "HIGH",
      "evidence": "Pay ₹2,000 to confirm the internship."
    },
    {
      "indicator": "urgency",
      "severity": "HIGH",
      "evidence": "Respond within 2 hours."
    }
  ],
  "llm_reasoning": "The message uses an internship lure and pressure-based payment request.",
  "confidence": 0.91
}
```

Never invent evidence that does not occur in the submitted content.

---

# 7. URL Agent

The URL Agent must combine:

- URL parsing
- URL structural analysis
- XGBoost
- Google Safe Browsing
- VirusTotal
- LLM reasoning
- RAG context when useful

Internal indicators may include:

- URL length
- domain length
- IP-based domain
- subdomains
- obfuscation
- special characters
- HTTPS
- redirects
- domain/title mismatch
- suspicious path
- external form submission
- other available PhiUSIIL features

External intelligence states:

```text
KNOWN_THREAT
NOT_IDENTIFIED
UNAVAILABLE
ERROR
NOT_CHECKED
```

Never convert `NOT_IDENTIFIED` into `SAFE`.

Example normalized result:

```json
{
  "agent": "url",
  "status": "success",
  "ml_probability": 0.84,
  "structural_indicators": [],
  "external_intelligence": {
    "google_safe_browsing": {
      "checked": true,
      "status": "NOT_IDENTIFIED",
      "threat_types": []
    },
    "virustotal": {
      "checked": true,
      "status": "NO_DETECTIONS",
      "malicious": 0,
      "suspicious": 0,
      "total_engines": 0
    }
  },
  "llm_reasoning": "...",
  "confidence": 0.83
}
```

---

# 8. Sender Agent

Use sender information that is actually available.

Analyze:

- sender email
- sender domain
- display name
- reply-to address
- SPF/DKIM/DMARC only if supplied
- domain-related indicators
- possible impersonation
- existing Sender ML if implemented

If headers are missing:

```text
SPF: Not provided
DKIM: Not provided
DMARC: Not provided
```

Never fabricate authentication results.

---

# 9. Incident Memory RAG

Use semantic similarity to retrieve previous relevant incidents.

Flow:

```text
Current Incident
      ↓
Embedding
      ↓
Vector Search
      ↓
Top-K Similar Incidents
      ↓
Similarity Threshold
```

If no result passes the threshold:

```text
No sufficiently similar previous incident found.
```

Do not display random history.

## What Changed?

For a sufficiently similar incident, compare meaningful fields:

```text
Previous          Current
Payment ₹2,000    Payment ₹1,500
Deadline 2 hrs    Deadline 1 hr
Attack: Internship Attack: Internship
```

GenAI can summarize the common pattern and actual differences.

---

# 10. Risk AI

Risk AI should combine structured evidence from:

- Text Agent
- URL Agent
- Sender Agent
- ML outputs
- URL structural evidence
- external threat intelligence
- Incident RAG
- detected attack indicators
- relevant profile context

Keep the core calculation deterministic and reproducible.

Do not let the LLM silently invent or change the score.

Recommended output:

```json
{
  "base_score": 84,
  "risk_level": "HIGH",
  "evidence_used": [],
  "profile_relevance": "HIGH"
}
```

If an actual personalization formula is implemented, return both base and personalized scores.

---

# 11. Explainable AI Forensic Summary

The current summary is too short. Replace it with a detailed evidence-based structure.

## Overall Finding

2–3 clear sentences summarizing the assessment.

## Why It Was Flagged

Show numbered evidence:

```text
1. Payment request
   The message requests an unexpected registration fee.

2. Artificial urgency
   The recipient is given a short deadline.

3. Suspicious URL
   The URL contains characteristics detected by URL analysis.

4. Sender concern
   Sender/domain information raises an impersonation concern.

5. Historical similarity
   The incident resembles a previous phishing case.
```

## Evidence by Agent

```text
Text Agent
High confidence
Detected payment and urgency language.

URL Agent
High confidence
Detected suspicious URL indicators.

Sender Agent
Medium confidence
Detected domain/sender concern.

Incident Memory
81% semantic similarity
Previous internship advance-fee case.
```

## External Intelligence

Show actual provider state and wording.

Example:

```text
Google Safe Browsing:
Not identified as a known threat.

VirusTotal:
No malicious detections reported by queried engines.
```

Do not infer safety from these non-match results.

## Final Explanation

Generate a coherent explanation using only collected evidence.

---

# 12. Personalized Defense Action Plan

The current static profile-specific action plan must be removed.

Never hard-code:

```text
nuclear scientist profile
sensitive clearance
organization's SOC
sample identity
```

Use the authenticated user's current profile.

## Input to the action-plan generator

```text
Risk Level
+
Attack Type
+
Risk Factors
+
User Role
+
Relevant User Activities
+
Security Awareness
+
Relevant Previous Incidents
+
Explanation Preference
```

## Example for a student

```text
Personalized Defense Action Plan

Context used:
Student • Internship applications • Beginner

1. Do not click the suspicious link.
2. Do not make the requested payment.
3. Verify the opportunity through the organization's official website.
4. Contact the organization independently if necessary.
5. Do not share credentials, OTPs, or banking information.
```

## Example for an employee

The recommendations can focus more on:

- sender/domain verification
- corporate reporting procedures
- account protection
- suspicious document/payment workflows

The exact action plan must be dynamically generated from actual user context and threat evidence.

---

# 13. Personalization Context Panel

Add a visible panel:

```text
PERSONALIZATION CONTEXT

Role:
Student

Relevant Activity:
Internship applications

Security Awareness:
Beginner

Relevant Previous Incident:
Internship payment scam

Explanation Preference:
Simple
```

This makes it obvious why the generated response is personalized.

---

# 14. Evidence Coverage

Add:

```text
EVIDENCE COVERAGE

Text Analysis          ✓ Available
URL Analysis           ✓ Available
Sender Analysis        ✓ Available
External Intelligence  ✓ Available / Unavailable
Incident RAG            ✓ Match / No Match
User Profile            ✓ Available
```

This prevents users from assuming every evidence source was always available.

---

# 15. Agent Analysis / Trace

Add an expandable analysis pipeline:

```text
✓ Preprocessing
✓ AI Orchestrator

✓ Text Agent
  ML probability: ...
  LLM reasoning: Complete

✓ URL Agent
  XGBoost: ...
  Safe Browsing: Checked
  VirusTotal: Checked

✓ Sender Agent
  Analysis complete

✓ Incident Memory
  Similarity: ...

✓ Risk AI
  Assessment complete

✓ Explainable AI
  Evidence generated

✓ Personalization AI
  Profile context applied

✓ Generative AI
  Report generated
```

This directly demonstrates the project's multi-agent architecture.

---

# 16. Add "Why This Matters to You?"

Show a short profile-driven explanation:

```text
WHY THIS MATTERS TO YOU

Your profile indicates that you frequently receive
internship-related messages. This threat category is
therefore particularly relevant to your normal communication.
```

This should be generated dynamically.

---

# 17. Add "Before You Act" Checklist

For suspicious results, show a threat-specific checklist:

```text
BEFORE YOU ACT

☐ Verify the sender independently
☐ Open the official website manually
☐ Do not use the link from the suspicious message
☐ Do not share passwords or OTPs
☐ Do not make unexpected payments
```

Adapt it according to the detected attack type.

---

# 18. Final Report Layout

Use this order:

```text
1. Threat Summary
2. Risk Score + Level
3. Original Submitted Content
4. Attack Classification
5. Agent Analysis
6. External Threat Intelligence
7. Incident Memory / Similar Incidents
8. Risk Factor Breakdown
9. Explainable AI Forensic Summary
10. Personalization Context
11. Personalized Defense Action Plan
12. What Changed? (when applicable)
13. Before You Act
14. User Feedback
```

This order makes the evidence clear before showing personalized recommendations.

---

# 19. MongoDB Data Model

MongoDB is the primary persistent database.

Recommended incident document:

```json
{
  "user_id": "...",
  "original_content": "...",
  "channel": "EMAIL",
  "agent_results": {
    "text": {},
    "url": {},
    "sender": {}
  },
  "rag_results": [],
  "external_intelligence": {},
  "risk": {
    "score": 91,
    "level": "HIGH"
  },
  "attack_classification": {
    "type": "INTERNSHIP_SCAM",
    "confidence": 0.92
  },
  "explainability": {},
  "personalization": {},
  "generated_report": {},
  "user_feedback": {}
}
```

Recommended collections:

```text
users
user_profiles
incidents
feedback
url_threat_checks
rag_metadata
```

Do not create unnecessary collections or a `system_logs` collection for this feature.

---

# 20. Important Data Integrity Rules

The system must NEVER:

- invent sender information
- invent SPF/DKIM/DMARC results
- invent previous incidents
- invent API results
- invent user profile details
- show stale profile names
- force an attack category without evidence
- call provider non-match "safe"
- change the original content
- fabricate confidence percentages
- let GenAI silently override structured evidence

---

# 21. GenAI Report Prompting Rules

Feed the final LLM structured context:

```text
ORIGINAL CONTENT:
...

TEXT AGENT:
...

URL AGENT:
...

SENDER AGENT:
...

INCIDENT RAG:
...

EXTERNAL INTELLIGENCE:
...

RISK:
...

ATTACK TYPE:
...

USER PROFILE:
...
```

Use an instruction such as:

```text
Generate a clear security report using only the supplied evidence.
Do not invent provider results, user information, previous incidents,
sender authentication results, or risk scores.
If information is unavailable, say that it is unavailable.
Do not claim certainty when evidence is uncertain.
Respect the user's explanation preference.
Keep the original threat evidence unchanged.
```

---

# 22. Low / Medium / High UX States

## LOW

```text
LOW RISK — 18 / 100

No significant phishing indicators detected.

Attack Classification:
No significant attack detected

Recommendation:
The content appears low risk based on available evidence.
Continue normal caution and verify unexpected requests.
```

## MEDIUM

```text
MEDIUM RISK — 56 / 100

Suspicious indicators detected.

Attack Classification:
Possible Social Engineering

Recommendation:
Verify the sender and avoid sharing credentials or making payments.
```

## HIGH

```text
HIGH RISK — 91 / 100

Strong phishing indicators detected.

Attack Classification:
Internship Scam

Recommendation:
Do not click, pay, or provide credentials.
Verify independently through an official source.
```

---

# 23. Recommended Extra Feature: Analysis Comparison

For a strong RAG demo, allow:

```text
Current Incident
vs
Previous Similar Incident
```

Show:

- common indicators
- changed amount
- changed deadline
- changed sender/domain
- changed wording
- common attack pattern

Only display this when a real similar incident exists.

---

# 24. Recommended Extra Feature: Evidence Coverage and Limitations

At the bottom of the report:

```text
ANALYSIS NOTE

This assessment is based on the submitted content and available
internal and external evidence. A provider non-match or unavailable
provider does not guarantee that content is safe.
```

---

# 25. Recommended Extra Feature: Re-analyze

Keep a **New Analysis** action.

When selected:

- clear the current analysis state
- keep authentication intact
- keep user profile intact
- allow a new input

Do not copy old incident data into the new incident.

---

# 26. Acceptance Criteria

## Original Content

- [ ] Exact submitted content is visible.
- [ ] Long content supports expand/collapse.
- [ ] Safe rendering prevents script execution.
- [ ] Copy works.

## Risk

- [ ] Risk score comes from the Risk AI.
- [ ] Risk formula is deterministic/documented.
- [ ] User profile context is retrieved for personalization.
- [ ] No arbitrary LLM score changes.

## Classification

- [ ] Low risk can show no significant attack.
- [ ] Medium risk can show suspicious/possible attack.
- [ ] High risk can show specific attack type when supported.
- [ ] Classification confidence is evidence-based.

## Agents

- [ ] Text Agent returns structured evidence.
- [ ] URL Agent returns structured evidence.
- [ ] Sender Agent returns structured evidence.
- [ ] Incident RAG returns relevant matches only.
- [ ] Missing evidence is marked unavailable.

## Explainability

- [ ] Overall finding.
- [ ] Why flagged.
- [ ] Evidence by agent.
- [ ] External intelligence.
- [ ] Historical similarity.
- [ ] Risk-factor breakdown.
- [ ] Final detailed explanation.

## Personalization

- [ ] Current authenticated user is used.
- [ ] No stale profile text exists.
- [ ] Action plan is dynamically generated.
- [ ] Personalization context is visible.
- [ ] Threat evidence remains independent from user role.

## Memory

- [ ] Relevant incidents are stored.
- [ ] Similar incidents can be retrieved.
- [ ] What Changed? works for strong matches.
- [ ] Feedback is persisted.

## Security

- [ ] User records are isolated by authenticated user ID.
- [ ] Submitted HTML is safely sanitized.
- [ ] External provider failures do not break analysis.
- [ ] API keys remain backend-only.

---

# 27. Master Prompt for Antigravity

> **Redesign and correct the existing PhishGuard AI Analyze Threat workflow according to this specification.**
>
> First inspect the complete repository and identify the existing Analyze Threat page, Threat Analysis Report page, Text Agent, URL Agent, Sender Agent, Incident Memory RAG, Risk AI/Bayesian Risk Fusion, Attack Classification, Explainable AI, Personalization, Generative AI, MongoDB models/services, User Profile RAG, and external threat-intelligence integration.
>
> Do not rebuild the application from scratch and do not remove working features.
>
> The first visible requirement is that the final Threat Analysis Report MUST display the original content submitted by the authenticated user. Preserve it safely, show it in a dedicated "Original Submitted Content" section, preserve line breaks, and provide expand/collapse and copy controls.
>
> Make the final risk assessment evidence-driven and user-aware. Risk AI must combine structured evidence from the Text Agent, URL Agent, Sender Agent, Incident RAG, and external threat intelligence. Retrieve the authenticated user's relevant profile context from MongoDB/User Profile RAG. Do not let a user's role directly determine the threat score. If a numeric profile adjustment is implemented, define its formula and show base versus personalized score. Otherwise keep the security risk score separate and show profile relevance.
>
> Fix Attack Classification so that low-risk content says "No significant phishing attack detected" rather than forcing a phishing category. Medium risk can use "Suspicious" or "Possible ...". High risk can show a specific category such as Internship Scam only when evidence supports it.
>
> Make the Text Agent use TF-IDF + Logistic Regression + LLM reasoning and return structured evidence. Make the URL Agent use XGBoost + structural analysis + Google Safe Browsing + VirusTotal + LLM reasoning. Make the Sender Agent use only actually available sender/header evidence. Never invent SPF/DKIM/DMARC results.
>
> Make Incident Memory RAG retrieve only genuinely relevant incidents using a similarity threshold. If no match passes the threshold, show that no sufficiently similar incident was found. Add What Changed? only when a real strong match exists.
>
> Make Explainable AI substantially more detailed. Include Overall Finding, Why It Was Flagged, Evidence by Agent, External Intelligence, Historical Similarity, Risk Factors, and a final evidence-based explanation.
>
> Remove all hard-coded profile-specific output such as "nuclear scientist profile", "sensitive clearance", or sample identities. The Personalized Defense Action Plan MUST use the current authenticated user's actual profile, relevant activities, security awareness, preferences, relevant previous incidents, attack type, risk factors, and risk level. It must be generated dynamically for every incident.
>
> Add a visible Personalization Context panel showing the actual user context used for the recommendation.
>
> Add an Evidence Coverage section and an Analysis Note explaining limitations and that provider non-match does not guarantee safety.
>
> Add an expandable Agent Analysis/Trace section showing Text Agent, URL Agent, Sender Agent, Incident RAG, Risk AI, Explainable AI, Personalization AI, and Generative AI statuses and evidence.
>
> Keep MongoDB as the primary persistent database and keep user-specific data isolated.
>
> Preserve the existing professional PhishGuard AI design: white/light-gray background, dark navy sidebar, blue primary actions, thin borders, clean cards, restrained risk colors, minimal animation, and no generic AI-chatbot styling.
>
> Update backend and frontend only where needed. Reuse existing interfaces and components. Do not create duplicate analysis pipelines.
>
> Test at least:
> 1. Legitimate university notice → low risk, no forced attack classification.
> 2. Suspicious message → medium risk.
> 3. Internship phishing → high risk + Internship Scam.
> 4. Message with URL → URL ML + external intelligence.
> 5. Message without URL → no URL-provider failure.
> 6. Missing sender headers → no fabricated authentication data.
> 7. No RAG match → no fake similar incident.
> 8. Strong RAG match → similar incident + What Changed?.
> 9. Different authenticated profiles → different recommendations, same underlying security evidence when threat is the same.
> 10. External provider unavailable → analysis continues.
> 11. Original content → exact content visible.
> 12. No stale hard-coded user profile text.
>
> Run backend tests, frontend build/lint, and an end-to-end analysis test after the changes.
>
> FINAL PRINCIPLE:
>
> **Show the original evidence → analyze it with ML + specialized AI agents → retrieve relevant memory → combine evidence with Risk AI → classify only when supported → explain the evidence in detail → apply the current user's context → generate a dynamic personalized action plan.**

