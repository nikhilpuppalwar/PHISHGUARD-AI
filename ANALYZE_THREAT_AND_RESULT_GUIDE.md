# PhishGuard AI — Threat Analysis Workflow & Result Guide

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Applies to:** PhishGuard AI Threat Ingestion Studio (`/submit`), Multi-Agent Analysis Pipeline, and Threat Analysis Result Workspace (`/analysis-result/:id`)

---

## 1. Executive Overview

PhishGuard AI moves beyond traditional binary spam filtering ("spam" vs "ham"). It operates a **multi-agent, evidence-based threat triage engine** that takes suspicious communications, dissects them across multiple machine learning models and external threat databases, cross-references historical incident vector memory, and evaluates how dangerous the threat is specifically to the **target user's role and security context**.

```
User Input (Email / SMS / URL)
       │
       ▼
[Stage 1: Preprocessor & Entity Extraction]
       │
       ▼
[Stage 2: AI Orchestrator (Parallel Dispatch)]
       │
   ┌───┴───────────────────────┬─────────────────────────┐
   ▼                           ▼                         ▼
[Text NLP Agent]        [URL XGBoost Agent]     [Sender Random Forest]
(TF-IDF + LR)           (14-feature PhiUSIIL)    (RFC Header Security)
   │                           │                         │
   │                           ▼                         │
   │                [External Threat Intel]              │
   │                (Google Safe Browsing +              │
   │                 VirusTotal v3 + Mongo Cache)        │
   │                           │                         │
   └───┬───────────────────────┴─────────────────────────┘
       ▼
[Stage 5: Incident Vector RAG Memory]
(ChromaDB / Embedding Similarity Match)
       │
       ▼
[Stage 6: Bayesian Risk AI Fusion]
(Base Risk Score 0–100 + Confidence)
       │
       ▼
[Stage 7: Attack Type Classification]
(Low / Suspicious / Specific Category)
       │
       ▼
[Stage 8: Explainable AI (XAI)]
(SHAP Factor Deltas + Triggered Indicators)
       │
       ▼
[Stage 9: Personalization Engine]
(User Profile RAG Semantic Injection)
       │
       ▼
[Stage 10: Generative AI Output Layer]
(Explanation + Action Plan + Tailored Advice)
       │
       ▼
[Stage 11: MongoDB & SQLite Persistence]
```

---

## 2. Inbound Threat Ingestion (`/submit`)

### 2.1 Supported Ingestion Formats
Users can submit suspicious messages via the **Unified Threat Studio**:
- **Raw Email Content:** Full email text or headers + body (RFC 822 format).
- **Direct URLs / Hyperlinks:** Standalone URLs or URLs embedded inside text.
- **SMS / Smishing Messages:** Short-form mobile text alerts.
- **Direct Messages (Slack / Teams / WhatsApp):** Chat-based phishing lures.

### 2.2 Preprocessing & Sanitization
Before any classifier evaluates the payload, the backend preprocessor (`app/services/preprocessor.py`):
1. **Markdown Normalization:** Detects deceptive hyperlink syntax (e.g. `[paypal.com](http://evil-phish.net)`) and unmasks hidden destinations.
2. **URL Extraction & Normalization:** Extracts HTTP/HTTPS links, strips trailing punctuation, brackets, or angle brackets, normalizes hostnames to lowercase, and extracts registered domains.
3. **Sender Parsing:** Identifies `From:`, `Reply-To:`, and sender display names, separating the claimed name from the actual sending mailbox.
4. **Channel Tagging:** Auto-detects whether the payload is an Email, SMS, or Web URL based on header signatures and character patterns.

---

## 3. The 11-Stage Multi-Agent Analysis Pipeline

| Stage | Component | Technology / Method | Responsibility |
|---|---|---|---|
| **1** | **Preprocessor** | Regex, RFC Parsers, URL Normalization | Extracts plain text, URLs, sender addresses, and cleans syntax. |
| **2** | **AI Orchestrator** | Asynchronous Python dispatch | Routes extracted entities to specialized agents in parallel. |
| **3** | **Text Agent** | TF-IDF + Logistic Regression (`scikit-learn`) | Evaluates linguistic urgency, fear appeals, authority impersonation, and payment coercion. |
| **4** | **URL Agent** | XGBoost (14 PhiUSIIL structural features) | Analyzes URL length, entropy, shortening, subdomain depth, and suspicious keywords. |
| **5** | **Sender Agent** | Random Forest (`scikit-learn`) | Checks sender domain age, display name spoofing, and RFC auth signals (SPF/DKIM/DMARC). |
| **6** | **External Threat Intel** | Google Safe Browsing v4 + VirusTotal v3 | Corroborates URLs against global security engine databases with 24h MongoDB TTL caching. |
| **7** | **Incident RAG Memory** | Vector Embeddings + Cosine Similarity | Matches current threat against confirmed past attacks (Strict threshold >= 0.55). |
| **8** | **Bayesian Risk AI** | Weighted Bayesian Evidence Fusion | Combines all agent probabilities and confidence levels into an objective 0–100 base score. |
| **9** | **Attack Type Detection** | Evidence-aware classification rules | Maps threat signatures to formal categories (e.g., Credential Harvesting, Advance-Fee, BEC). |
| **10**| **Explainable AI (XAI)** | SHAP attribution & feature deltas | Explains *why* the threat scored as it did, breaking down each agent's individual contribution. |
| **11**| **Personalization & GenAI**| User Profile RAG + Multi-LLM Gateway | Injects user profile (role, services, tier) to generate tailored advice and dynamic action plans. |

---

## 4. Threat Analysis Result Content (`/analysis-result/:id`)

When an analysis is completed, the user is presented with a **comprehensive 16-section forensic security report**. Below is the detailed breakdown of what each section contains:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Section 1: Threat Verdict Banner & Dual Risk Gauge                    │
├────────────────────────────────────────────────────────────────────────┤
│  Section 2: Original Submitted Content (Monospaced Sandbox)            │
├────────────────────────────────────────────────────────────────────────┤
│  Section 3: Multi-Agent Signal Contribution Bar                        │
├────────────────────────────────────────────────────────────────────────┤
│  Section 4: Multi-Agent Evidence Breakdown Cards                       │
├────────────────────────────────────────────────────────────────────────┤
│  Section 5: Real External URL Threat Intelligence (GSB & VirusTotal)   │
├────────────────────────────────────────────────────────────────────────┤
│  Section 6: Incident Vector RAG Memory & Campaign Evolution            │
├────────────────────────────────────────────────────────────────────────┤
│  Section 7: 6-Dimension Multi-Agent Evidence Coverage Matrix           │
├────────────────────────────────────────────────────────────────────────┤
│  Section 8: Primary Risk Factors & Forensics                           │
├────────────────────────────────────────────────────────────────────────┤
│  Section 9: Personalized Recommendations ("Why This Matters to You")   │
├────────────────────────────────────────────────────────────────────────┤
│  Section 10: Dynamic Defense Action Plan (Immediate / Next / Long Term)│
├────────────────────────────────────────────────────────────────────────┤
│  Section 11: "Before You Act" Interactive Verification Checklist       │
├────────────────────────────────────────────────────────────────────────┤
│  Section 12: Personalization Context Vector Telemetry                  │
├────────────────────────────────────────────────────────────────────────┤
│  Section 13: 11-Stage Pipeline Execution Trace                         │
├────────────────────────────────────────────────────────────────────────┤
│  Section 14: Ground-Truth Analyst Feedback Loop                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Section 1: Verdict Banner & Dual Risk Gauge
- **Calculated Risk Score:** A calibrated score from `0` to `100`.
- **Severity Badge:**
  - `0 – 39`: **Safe / Low Risk** (Green) — Legitimate communication; no malicious indicators.
  - `40 – 74`: **Suspicious / Moderate Risk** (Amber) — Social engineering cues or unverified sender.
  - `75 – 100`: **High / Critical Risk** (Red) — Confirmed malicious payload or credential trap.
- **Dual Gauge Metrics:**
  - **Base Technical Risk Score:** Raw threat severity independent of the recipient.
  - **Personalized Risk Score:** Calibrated threat score factoring in the user's specific role, digital access levels, and security experience.
- **Threat Category Title:** Specific attack name (e.g. *"Internship Advance-Fee Scam"*, *"Microsoft 365 Credential Harvester"*, or *"Benign Communication"*).
- **Executive Summary:** A 2–3 sentence high-level overview explaining the primary nature of the communication and its immediate risk.

---

### Section 2: Original Submitted Content (Monospaced Sandbox)
- **Safe Isolation Container:** Displays the exact, unformatted text/payload submitted by the user in an isolated monospace code-box.
- **Payload Metadata Chips:** Highlights identified URLs, sender domains, detected communication channel, and payload character length.
- **Safety Safeguard:** Links in the sandbox are non-clickable and sanitized to prevent accidental user clicks.
- **Copy to Clipboard:** Allows one-click copying for security audit logs or ticket submissions.

---

### Section 3: Multi-Agent Signal Contribution Bar
- **Visual Bayesian Distribution Bar:** A horizontal proportional progress bar visualizing the relative contribution of each agent to the final verdict:
  - **URL Agent:** High entropy, brand keyword hijacking, redirection tricks.
  - **Text Agent:** Linguistic urgency, coercion, threat of loss, payment demands.
  - **Sender Agent:** Domain registration age, missing SPF/DKIM/DMARC records.
  - **Incident RAG:** Historical precedent correlation.

---

### Section 4: Multi-Agent Evidence Breakdown Cards
Three specialized diagnostic cards detailing the mathematical findings of each agent:
1. **Text Agent Card:**
   - Classification probability score (e.g. `0.941`).
   - Triggered lexical patterns (e.g., *"Urgency: 2-hour deadline"*, *"Financial coercion: ₹2,000 reservation fee"*).
2. **URL Agent Card:**
   - PhiUSIIL XGBoost probability score (e.g. `0.892`).
   - Structural characteristics (e.g., Shortened bit.ly URL, 4 subdomain levels, high-risk TLD).
3. **Sender Agent Card:**
   - Random Forest authenticity score (e.g. `0.785`).
   - Technical RFC authentication checks (`SPF`, `DKIM`, `DMARC`) displayed with factual statuses (`Pass`, `Fail`, `Softfail`, or `"Not provided"`).

---

### Section 5: Real External URL Threat Intelligence
- **Google Safe Browsing (GSB) v4 Status:**
  - Direct query result from Google Safe Browsing threat lists.
  - Strictly uses accurate security terminology: `"Not identified as a known Google Safe Browsing threat"` (never falsely says "Safe").
- **VirusTotal (VT) API v3 Ratio:**
  - Detection ratio (e.g. `14 / 92 security vendors flagged as malicious`).
  - When clean: `"No malicious detections reported by queried engines"`.
- **Database Caching Telemetry:**
  - Indicates whether results were fetched live or served from MongoDB cache (with 24-hour TTL).
- **Simulation Flag:** Clearly marks whether live API keys or standard simulated demo vectors were utilized.

---

### Section 6: Incident Vector RAG Memory & Tactical Evolution
- **Similarity Score:** Shows cosine similarity against the vector database of confirmed phishing campaigns.
- **Strict Relevance Threshold:** If similarity is below `0.55`, the system reports: `"No sufficiently similar historical campaign found"` rather than hallucinating false matches.
- **"What Changed? (Tactical Evolution)":** When a strong historical match is found (`>= 0.70`), this card highlights how the attacker altered their tactics:
  - *Previous Campaign:* Required wire transfer via direct bank deposit.
  - *Current Attack:* Upgraded to a deceptive Bitly payment gateway link.

---

### Section 7: 6-Dimension Evidence Coverage Matrix
A visual grid tracking the breadth and confidence of gathered intelligence across 6 core security dimensions:
1. **Text NLP Evidence** (Lexical keywords and sentiment)
2. **URL Structural Evidence** (PhiUSIIL feature matrix)
3. **Sender Authentication Evidence** (RFC headers)
4. **External Threat Intelligence** (Google Safe Browsing & VirusTotal)
5. **Incident RAG Precedent** (Historical corpus correlation)
6. **User Security Context** (Target profile alignment)

---

### Section 8: Primary Risk Factors & Forensics
- **Detailed Factor Breakdown:** Bulleted forensic points detailing the specific anomalies that triggered the score.
- **Factor Severity Ratings:** Each factor is categorized as `Critical`, `High`, `Moderate`, or `Informational`.
- **Attribution SHAP Deltas:** Shows the exact mathematical shift (`+0.35`, `+0.20`, `-0.15`) that each factor imparted onto the base risk score.

---

### Section 9: Personalized Recommendations ("Why This Matters to You")
- **Profile-Aware Context:** Explains why this specific attack is dangerous given the user's specific role (e.g., Student, Developer, Finance Officer, IT Admin).
- **Targeted Assets:** Identifies the specific platforms or accounts at risk (e.g., *"Targets your university Microsoft 365 credentials"*, *"Aims to compromise AWS IAM root access"*).
- **Personalized Risk Delta:** Explains why the user's personal risk score may be higher or lower than the generic technical score.

---

### Section 10: Dynamic Defense Action Plan
A 3-tiered, actionable roadmap tailored to the attack type:
1. **Immediate Quarantine Actions (0 – 15 Minutes):**
   - e.g., *"Do not click the link or submit candidate registration fees."*
   - e.g., *"Reset corporate SSO password immediately if credentials were entered."*
2. **Secondary Containment Steps (1 – 2 Hours):**
   - e.g., *"Forward raw email headers to your organization's security operations center (SOC)."*
   - e.g., *"Invalidate active browser sessions and inspect recent OAuth app permissions."*
3. **Long-Term Preventive Measures:**
   - e.g., *"Enroll in hardware FIDO2 / WebAuthn MFA keys to neutralize reverse-proxy phishing."*
   - e.g., *"Implement DMARC reject policies on company domains."*

---

### Section 11: "Before You Act" Interactive Verification Checklist
- An interactive, checkable list of immediate verification safeguards that the user can physically check off before making any decision regarding the message:
  - [ ] Checked sender address against authorized university domain directory
  - [ ] Verified that no official internship program demands upfront payment
  - [ ] Inspected link destination without opening browser window
  - [ ] Reported message to campus security desk

---

### Section 12: Personalization Context Vector Telemetry
- Displays the user's active context retrieved from the **User Profile RAG Semantic Memory**:
  - **User Role:** (e.g., `Final Year Student / Placement Candidate`)
  - **Security Awareness Tier:** (e.g., `Intermediate`)
  - **Monitored Services:** (e.g., `Google Workspace`, `LinkedIn`, `GitHub`)
  - **Explanation Preference:** (e.g., `Detailed Forensic Analysis`)

---

### Section 13: 11-Stage Pipeline Execution Trace
- An expandable execution log detailing the microsecond timestamp, latency, and status of each autonomous agent in the pipeline.
- Allows security auditors to inspect exactly how the AI Orchestrator dispatched tasks and aggregated evidence.

---

### Section 14: Ground-Truth Analyst Feedback Loop
- **False Positive / False Negative Reporting:** Allows users and analysts to provide ground-truth corrections (`Confirmed Phish`, `Legitimate / False Positive`, `Needs Further Investigation`).
- **Continuous Learning:** Feedback entries are persisted to the database to improve model calibration and update vector memory.

---

## 5. API Response Schema Reference (`POST /api/analyze`)

When invoking the threat analysis endpoint, the backend returns the following comprehensive JSON payload:

```json
{
  "incident_id": "inc_9f8e7d6c5b4a",
  "created_at": "2026-09-29T21:45:00Z",
  "original_content": "Congratulations! You have been selected for the Summer Analyst internship program. Pay ₹2,000 within 2 hours...",
  "preprocessor_result": {
    "channel": "email",
    "extracted_urls": ["http://bit.ly/internship-fee-2024"],
    "sender_email": "hr-verify@quick-career.org",
    "sender_name": "Quick Career Recruitment"
  },
  "risk_assessment": {
    "base_score": 91.0,
    "personalized_score": 94.0,
    "severity": "critical",
    "confidence": 0.974,
    "profile_relevance": "High vulnerability due to active internship search context."
  },
  "classification": {
    "attack_type": "Internship Advance-Fee Scam",
    "category": "Advance-Fee Fraud / Recruitment Scam",
    "summary": "High-risk recruitment phishing scam demanding upfront reservation fees under artificial urgency."
  },
  "agents_evidence": {
    "text_agent": {
      "model": "TF-IDF + Logistic Regression",
      "probability": 0.941,
      "urgency_detected": true,
      "indicators": ["2-hour deadline", "seat cancellation threat", "₹2,000 upfront fee"]
    },
    "url_agent": {
      "model": "PhiUSIIL XGBoost Classifier",
      "probability": 0.892,
      "shortened_url": true,
      "target_domain": "bit.ly",
      "external_intel": {
        "google_safe_browsing": "Not identified as a known Google Safe Browsing threat",
        "virustotal": {
          "malicious_count": 14,
          "total_engines": 92,
          "detection_ratio": "14/92"
        },
        "is_cached": true,
        "is_simulated": false
      }
    },
    "sender_agent": {
      "model": "RFC Random Forest Classifier",
      "probability": 0.785,
      "domain_age_days": 4,
      "spf": "softfail",
      "dkim": "none",
      "dmarc": "none"
    }
  },
  "incident_rag": {
    "match_found": true,
    "similarity_score": 0.91,
    "matched_title": "Campus Recruitment Advance-Fee Scheme",
    "tactical_evolution": "Switched from direct bank wire to Bitly payment gateway to bypass automated keyword scanners."
  },
  "explainable_ai": {
    "primary_factors": [
      {
        "factor": "Shortened payment redirect link",
        "severity": "critical",
        "shap_delta": 0.40
      },
      {
        "factor": "Artificial deadline (2 hours) creating coercive urgency",
        "severity": "high",
        "shap_delta": 0.35
      },
      {
        "factor": "Sender domain registered under 5 days ago",
        "severity": "high",
        "shap_delta": 0.15
      }
    ]
  },
  "personalization": {
    "user_role": "Final Year Student",
    "why_it_matters": "Students actively applying to campus placement programs are primed to trust internship notifications.",
    "targeted_assets": ["Candidate Placement Portal", "Personal UPI / Banking Account"],
    "action_plan": [
      {
        "tier": "Immediate (0-15m)",
        "step": "Do not pay the requested ₹2,000 fee or open the Bitly link."
      },
      {
        "tier": "Short Term (1-2h)",
        "step": "Cross-verify company legitimacy with your university placement cell."
      },
      {
        "tier": "Strategic",
        "step": "Submit sender email headers to campus IT security to blacklist quick-career.org."
      }
    ]
  },
  "evidence_coverage": {
    "text_nlp": 95,
    "url_structure": 90,
    "sender_auth": 85,
    "threat_intel": 90,
    "rag_memory": 91,
    "profile_context": 100
  },
  "execution_trace": [
    { "stage": "Preprocessor", "latency_ms": 12, "status": "completed" },
    { "stage": "AI Orchestrator", "latency_ms": 5, "status": "completed" },
    { "stage": "Text Agent", "latency_ms": 45, "status": "completed" },
    { "stage": "URL Agent & Threat Intel", "latency_ms": 180, "status": "completed" },
    { "stage": "Sender Agent", "latency_ms": 32, "status": "completed" },
    { "stage": "Incident RAG", "latency_ms": 68, "status": "completed" },
    { "stage": "Bayesian Risk AI", "latency_ms": 8, "status": "completed" },
    { "stage": "Explainable AI", "latency_ms": 24, "status": "completed" },
    { "stage": "Personalization & GenAI", "latency_ms": 420, "status": "completed" }
  ]
}
```

---

## 6. Security Guarantees & Non-Override Rules

1. **No External Intelligence Override:**
   - A `0 / 92` clean score on VirusTotal or Google Safe Browsing **never** marks a threat as safe if internal ML models (Text NLP, URL XGBoost, Sender Random Forest) detect high threat probabilities. Zero-day phishing campaigns routinely evade external blacklists for the first 24–48 hours.
2. **Accurate Security Terminology:**
   - External intelligence displays: *"Not identified as a known threat by queried engines"*. The system strictly refrains from stating that an external engine verified a link as *"Safe"*.
3. **No Hallucinated RAG Fallbacks:**
   - When incident cosine similarity is below `0.55`, the RAG engine explicitly outputs: *"No sufficiently similar previous incident found"*.
4. **Factual RFC Header Attribution:**
   - Missing headers in input content are reported as `"Not provided"`; the system never fabricates softfails or DKIM signatures.
5. **Dynamic Role Persona Integrity:**
   - Generic/static personas (e.g. "classified clearance holder", "nuclear engineer") are completely barred. Personalization is dynamically populated from the user's active, calibrated profile in SQLite and User Profile RAG.
