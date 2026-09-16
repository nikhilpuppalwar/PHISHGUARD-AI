# PhishGuard AI — Product Requirements Document (PRD)

**Version:** 2.0
**Status:** Active — supersedes the original `PRD.md`
**Related documents:** `flow_and_system_architecture.md`, `trd.md`, `database.md`, `todo.md`

---

## 1. Product Overview

| | |
|---|---|
| **Project** | PhishGuard AI |
| **Full Title** | Personalized Multi-Agent Phishing Detection and Risk Analysis Using Generative AI |
| **Project Type** | MDM Capstone Project |
| **Domain** | Applied Artificial Intelligence in Cybersecurity |

PhishGuard AI is a GenAI-first, personalized cybersecurity assistance and risk-analysis system. It analyzes suspicious emails, SMS/messages, and URLs and goes beyond a simple phishing/legitimate classification by producing a structured risk assessment, an explanation of the evidence, attack-type information, and a personalized action plan.

> **Important:** PhishGuard AI is a risk-analysis and security-assistance system, **not** a guarantee of 100% phishing detection. This framing must be preserved in every deliverable (docs, demo, presentation).

---

## 2. Problem Statement

Existing phishing defenses commonly rely on:
- Rule-based / signature filtering
- Blocklists
- Single-signal machine-learning classifiers (text **or** URL, rarely both)
- Generic spam filtering

These approaches typically provide a binary verdict but do **not**:
1. Combine text, URL, and sender evidence in one workflow.
2. Provide a structured risk score and severity.
3. Personalize results using user context.
4. Reuse previous incidents and user feedback.
5. Clearly explain why a message was considered risky.
6. Specifically address increasingly convincing AI-generated phishing content.

---

## 3. Product Vision

Move phishing protection from:

> **"Is this phishing?"**

to:

> **"How risky is this, why is it risky, what type of attack is it, what evidence supports the result, and what should this particular user do?"**

---

## 4. Target Users

- Students
- Professionals
- General users with varying levels of security awareness

The system adapts guidance to the user's role, security-awareness level, communication habits, and available history rather than issuing the same generic warning to everyone.

---

## 5. Core User Journey

1. User creates/logs into an account.
2. User completes conversational security profiling.
3. User submits suspicious content (email, SMS/message, or URL).
4. System extracts text, URL, sender, subject, and channel information.
5. AI Orchestrator dispatches specialized analysis.
6. Text, URL, and Sender agents generate evidence (ML + rules).
7. RAG retrieves similar phishing cases and relevant user context.
8. Risk AI combines the evidence into a structured score.
9. Explainable AI identifies the factors behind the result.
10. Attack Type Detection identifies the likely attack category.
11. Personalization adapts the result to the user.
12. GenAI produces a clear explanation and action plan.
13. User feedback / confirmed incidents are stored for future analysis.

Full step-by-step flow diagrams live in `flow_and_system_architecture.md`.

---

## 6. Functional Requirements

| ID | Requirement | Notes |
|---|---|---|
| **FR-01** | Authentication | System shall support user authentication and a basic user dashboard. |
| **FR-02** | Conversational User Profiling | Collect relevant user context through guided questions: role, preferences, common communication types, security-awareness level, previous incidents, feedback/learning history. |
| **FR-03** | Suspicious Input | Accept email/message text, URL, sender information, and subject/channel information where available. |
| **FR-04** | Input Processing | Preprocess and extract relevant evidence from the submitted input. |
| **FR-05** | Multi-Agent Analysis | Coordinate Text, URL, and Sender agents; agents should operate in parallel where possible. |
| **FR-06** | Text Detection | Text Agent analyzes urgency/pressure, payment requests, credential bait, and social-engineering language. Model: **TF-IDF + Logistic Regression**, trained on the consolidated email/SMS corpus (see §8 and `database.md` §7). |
| **FR-07** | URL Detection | URL Agent analyzes URL structure, domain-related signals, obfuscation, and suspicious patterns. Model: **XGBoost** on engineered URL/DOM features (PhiUSIIL dataset). |
| **FR-08** | Sender Analysis | Sender Agent analyzes sender identity, domain mismatch, impersonation, and authentication signals. Model: **Random Forest**, trained on engineered sender features (see `trd.md` §5.3 and `database.md` §7). Heuristic/rule-based checks (e.g. exact domain match) may still run alongside the model as sanity checks or a fallback when a feature is missing. |
| **FR-09** | RAG Retrieval | Retrieve known phishing cases, phishing patterns, similar incidents, security knowledge, and relevant user-profile context. |
| **FR-10** | Risk Analysis | Combine available evidence into a risk score, severity, confidence, and risk factors. |
| **FR-11** | Explainability | Explain which agent contributed evidence, which indicators were detected, which similar cases were retrieved, and which factors influenced the risk score. |
| **FR-12** | Attack Type Detection | Identify the likely type/category of phishing attack where sufficient evidence exists (e.g. internship scam, credential phishing, invoice fraud). |
| **FR-13** | Personalization | Adapt explanations and recommendations using the user's stored context. |
| **FR-14** | Generative AI Output | Generate a plain-language explanation, a risk summary, and an action plan. |
| **FR-15** | Feedback | Allow feedback/confirmation to be stored for future analysis. |
| **FR-16** | Multi-Source Data Foundation | Text-detection training shall draw on multiple labeled corpora (see §8) rather than a single dataset, to reduce source bias and improve generalization across email styles, SMS, and scam types. |
| **FR-17** | Password Reset | The system shall allow a user to securely reset a forgotten password via a verified channel (e.g. email link/OTP), without exposing whether an email is registered. |
| **FR-18** | Attack Type Glossary | The system shall provide a reference page explaining each attack category used by Attack Type Detection (FR-12), so a flagged result can be looked up and understood independent of a specific analysis. |

---

## 7. Non-Functional Requirements

| ID | Requirement |
|---|---|
| **NFR-01 — Explainability** | Results should be understandable and traceable to detected evidence. |
| **NFR-02 — Modularity** | Agents should be independently replaceable or extendable. |
| **NFR-03 — Extensibility** | The architecture should allow additional agents and detection methods (e.g. attachment analysis, voice phishing). |
| **NFR-04 — Responsiveness** | Independent agent analyses should be executed concurrently where practical. |
| **NFR-05 — Data Protection** | User profile and incident information should be stored and accessed with appropriate security controls (see `database.md` §9). |
| **NFR-06 — Reliability** | The system should clearly communicate uncertainty and should not present its risk score as absolute truth. |
| **NFR-07 — Data Governance** | Large or out-of-scope datasets (e.g. corporate fraud corpora) shall not be merged into the phishing training set without an explicit relabeling/validation step. |

---

## 8. Data Foundation (Summary)

A dataset audit (`database.md` §7 and `DATASET_INFO.md`) confirmed **10 CSV datasets, ~1.02 GB, 853,756 total records** are available. Primary sources per agent:

| Agent | Primary Dataset(s) | Rows Available |
|---|---|---|
| URL Agent | PhiUSIIL Phishing URL Dataset | 235,795 (55 columns) |
| Text Agent (email) | `phishing_email.csv` (combined corpus), `CEAS_08.csv`, `Enron.csv`, `SpamAssasin.csv`, `Ling.csv` | ~159,000 combined |
| Text Agent (SMS) | `spam_sms.csv` | 5,572 |
| Text Agent (augmentation / stress-testing) | `Nazario.csv` (100% phishing), `Nigerian_Fraud.csv` (100% fraud) | 4,897 |
| Future / out of initial scope | `enron_data_fraud_labeled_.csv` (corporate fraud, not phishing-labeled, 97.1%/2.9% imbalance) | 447,417 |

> **Correction:** Earlier presentation materials stated the PhiUSIIL split as "134,850 legitimate / 100,945 phishing." The verified dataset documentation shows the opposite: **label `1` = Phishing = 134,850 (57.2%)**, **label `0` = Legitimate = 100,945 (42.8%)**. All future documents and slides should use the corrected split.

Full dataset-level detail, per-column schema, and preprocessing guidance is in `trd.md` §6 and `database.md` §7.

---

## 9. Expected Output

A result may contain:

- **Phishing Risk:** e.g. 91/100
- **Severity:** High Risk
- **Confidence:** e.g. 93%
- **Attack Type:** e.g. Internship Scam
- **Major Indicators:** Payment request, Urgency, Suspicious URL, Possible impersonation
- **Similar Incident:** similarity to a previous case
- **Explanation**
- **Personalized Action Plan**

The numerical values above are illustrative examples, not guaranteed values for every message.

---

## 10. Success Criteria

The project should be evaluated using measurable detection and system-quality metrics rather than claiming perfect detection.

- Text classification performance (precision, recall, F1, confusion matrix) on a held-out split of the combined email/SMS corpus
- URL classification performance on a held-out split of PhiUSIIL
- Sender-analysis performance (Random Forest — precision, recall, F1, confusion matrix)
- Risk-score consistency across repeated/similar inputs
- Explanation quality (evidence correctness, indicator traceability)
- RAG retrieval relevance (top-K relevance)
- Personalization usefulness (qualitative review)
- End-to-end response time

---

## 11. Scope

### In Scope
- Personalized phishing risk analysis
- Text, URL, and sender evidence
- Multi-agent orchestration
- ML detection trained on the audited datasets (§8)
- RAG retrieval (user profile + phishing/incident)
- Risk scoring
- Explainability
- Attack-type detection
- Personalized GenAI guidance
- Feedback and incident memory

### Out of Scope
- Guaranteeing 100% phishing detection
- Replacing enterprise email security gateways
- Automatically blocking or deleting messages without user/system authorization
- Treating an LLM response as definitive security proof
- Corporate/insider-fraud detection using `enron_data_fraud_labeled_.csv` (different label semantics; candidate for a future extension only)

---

## 12. Risks & Assumptions

| Risk | Mitigation |
|---|---|
| Class imbalance in several datasets (e.g. `enron_data_fraud_labeled_.csv` 2.9% positive, `spam_sms.csv` 13.4% positive) could bias models if merged carelessly | Use stratified splits, per-source evaluation, and keep imbalanced/out-of-domain sources out of the core training mix (see §8) |
| Mixing several email corpora (different eras, headers, writing styles) may introduce source bias | Track dataset origin per record; evaluate per-source as well as combined |
| `spam_sms.csv` has broken columns from unescaped commas | Recover text by concatenating `v2` + overflow columns before use (see `trd.md` §6.2) |
| LLM output could "invent" evidence not backed by agents/RAG | GenAI prompts must be grounded strictly in structured evidence (`Input → Evidence → Retrieval → Risk → Explanation → Guidance`) |
| Sender Agent's Random Forest model needs a labeled sender-feature dataset | Assemble labeled sender features from header-bearing sources (`CEAS_08`, `Nazario`, `Nigerian_Fraud`, `SpamAssasin`) plus confirmed incidents; document actual training/evaluation results before claiming performance numbers |

---

## 13. Product Principle

**Detect → Retrieve → Assess → Explain → Personalize → Guide → Learn**

---

## 14. Milestones

See `todo.md` for the phase-by-phase task backlog and current status.
