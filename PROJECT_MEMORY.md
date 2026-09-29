# Project Memory

## Current Status
- Core Multi-Agent Detection Pipeline (Text TF-IDF+LR, URL XGBoost, Sender Random Forest) operational
- **Real External URL Threat Intelligence Engine (Spec Compliance: Google Safe Browsing v4 + VirusTotal API v3)** fully integrated into URL AI Agent
- **URL Evidence Fusion Pipeline**: Combines structural URL analysis + 14-feature PhiUSIIL XGBoost ML + Google Safe Browsing + VirusTotal + LLM reasoning into unified URL Evidence Object
- **MongoDB Primary Application Database & Threat Intelligence Cache**: Persistent storage and 24-hour TTL caching in `url_threat_checks` collection with URL normalization and SHA-256 hashing
- **Bayesian Risk AI & Explainable AI (XAI) Corroboration**: Fuses external reputation with internal ML without unilateral override (0 external detections strictly never marks a threat safe)
- **11-Stage Autonomous Multi-Agent Pipeline Visualization** on submission screen (Input Processing → AI Orchestrator → Text/URL/Sender Agents → External URL Intel → Incident RAG → Risk AI → Explainable AI → Personalization → Generative AI)
- **Dedicated External Threat Intelligence Result Card & Enriched URL Agent Panel**: Adheres strictly to security wording requirements ("Not identified as a known Google Safe Browsing threat", "No malicious detections reported by queried engines", "Demo Mode — Simulated")
- **Dynamic GenAI Conversational User Profiling System fully implemented and operational** (Spec compliance: `PhishGuard_AI_Dynamic_Conversational_Profile_Spec.md`)
- **Dedicated User Profile RAG Semantic Memory Layer (`app/services/user_profile_rag.py`)** decoupled from Incident RAG
- **Lightweight Profile History Tracking (`profile_history` database table & API endpoints)** active with UI timeline
- **Dimension-Based Security Completeness Engine** (Identity, Role, Communication, Activities, Services, Security Awareness, Explanation Preference, Threat Context) with "Complete Profile with AI"
- **Natural-Language Profile Assistant ("Edit Profile with AI")** with structured extraction, diff preview confirmation, and instant DB/RAG/UI synchronization
- Unified Single-Input Threat Studio working with live entity extraction (Text, URLs, Sender headers, Channel)
- Multi-Provider LLM Gateway (Gemini, Groq, OpenRouter, Anthropic Claude, OpenAI, Ollama, HuggingFace) integrated with 100% offline fallback
- Protected JWT Authentication, Onboarding flow, Attack Glossary, Incident History & Telemetry Analytics operational
- Preprocessor and URL parsing sanitization (markdown normalization, bracket stripping, safe domain parsing) completed

## Completed Work

### 2026-09-16
- Initialized React 19 + Vite frontend with Tailwind CSS (Deep Navy `#0B1220` cybersecurity aesthetic)
- Built FastAPI backend architecture (`app/main.py`, routers, config, SQLite SQLAlchemy ORM)
- Trained and integrated ML models:
  - Text Agent: TF-IDF + Logistic Regression (`saved_models/text_agent_tfidf_lr.pkl`)
  - URL Agent: XGBoost on 14 high-signal PhiUSIIL features (`saved_models/url_agent_xgboost.pkl`)
  - Sender Agent: Random Forest on 7 header & authentication features (`saved_models/sender_agent_random_forest.pkl`)
- Implemented Bayesian Risk Fusion Engine (calibrated 0–100 risk score, confidence, severity)
- Implemented Explainability Engine (SHAP deltas, agent contribution breakdown, risk indicators)
- Implemented Incident Memory RAG service (vector similarity matching with confirmed incidents)
- Created Conversational Profiling Engine (adaptive role-based onboarding questionnaire, 'Other' input normalization, freeform natural language profile editing)
- Developed Multi-Provider LLM Gateway with round-trip latency testing (Gemini, Groq, OpenRouter, Anthropic, OpenAI, Ollama, HuggingFace) + deterministic offline fallback
- Built full Frontend suite:
  - Landing Page with academic capstone credentials
  - Authentication (Login, Sign-Up, Password Reset)
  - Interactive Onboarding Interview (`OnboardingPage.jsx`)
  - Single-Input Threat Studio & Analysis Result Page (`RiskGauge`, `SignalBar`, `AgentDeltaCard`, `ActionPlanList`)
  - Incident History & Feedback Modal (ground-truth learning loop)
  - Telemetry Analytics Dashboard (Recharts metrics)
  - Attack Type Glossary workspace (`GlossaryPage.jsx`)
  - Profile Settings page with LLM provider management and conversational profile editor

### 2026-09-29
- Enhanced `preprocessor.py` with markdown link normalization (`[text](url)` and `[display](mailto:...)`)
- Resolved bare email domain false positive URL parsing in preprocessor
- Added resilient bracket/punctuation stripping and fallback URL parsing in `url_agent.py` to prevent malformed URL exceptions
- Updated branding and metadata to "MDM - Generative AI Capstone Project" across Navbar, Landing Page, and components
- Resolved Incident History query serialization issue (`?channel=undefined&severity=undefined`) returning verified incidents
- **Implemented Complete Dynamic Conversational User Profiling System (`PhishGuard_AI_Dynamic_Conversational_Profile_Spec.md`)**:
  - **Database Model & Migration**: Added `ProfileHistory` table (`history_id`, `user_id`, `change_type`, `field_name`, `old_value`, `new_value`, `title`, `description`, `source`, `created_at`) with foreign key to `users`.
  - **User Profile RAG Semantic Memory (`app/services/user_profile_rag.py`)**: Built dedicated semantic memory store decoupled from Incident RAG. Translates user role, ecosystem platforms, online habits, security tier, and risk exposures into high-density semantic memory vectors.
  - **Threat Analysis Context Retrieval**: Integrated `user_profile_rag.retrieve_relevant_user_context` in `orchestrator.py` and `genai_service.py` to supply relevant user context to the Personalization AI during phishing scans without artificially altering underlying Bayesian threat scores.
  - **Dimension-Based Completeness**: Replaced question counting with 8 security dimensions (Identity, Role, Communication, Activities, Services, Security Awareness, Explanation Preference, Threat Context) in `profiling_service.py` and `/api/profile/completeness`.
  - **Natural-Language Profile Assistant**: Implemented `POST /api/profile/assistant` and `POST /api/profile/assistant/confirm` supporting natural updates (e.g., "I changed my role to Software Developer", "Add AWS and GitHub to my services", "Remove Instagram", "I don't use online banking"). Added ambiguity detection and structured change previews.
  - **Dynamic Profile & Settings UI (`ProfileSettingsPage.jsx`)**:
    - Removed hard-coded/fake values; missing fields render as `"Not configured"` or `"Not provided"` (subtle italic).
    - Dimension-based completeness chip display with **"Complete Profile with AI"** action button.
    - Added dedicated **Profile Change History** timeline card showing recorded changes, dates, and sources.
    - Dynamic **Threat Exposure & Contextual Memory** card tailored to user role.
    - Enhanced conversational assistant modal with live diff preview cards, prompt suggestions, and real-time state synchronization.
  - **Enhanced Onboarding Wizard (`OnboardingPage.jsx`)**: Added support for scale questions (1–5), multi-choice, yes/no, and a conversational freeform chat input bar, with live telemetry showing dual persistence (Database + User Profile RAG).
- **Implemented Real External URL Threat Intelligence System (Google Safe Browsing & VirusTotal v3)**:
  - **Google Safe Browsing Service (`app/services/google_safe_browsing.py`)**: Google Safe Browsing API v4 client with timeout handling, rate-limit resilience, safe demo simulation for testing domains, and strict security wording ("Not identified as a known Google Safe Browsing threat", never "Safe").
  - **VirusTotal Service (`app/services/virustotal.py`)**: VirusTotal API v3 integration using `x-apikey` header, URL-safe base64 URL ID calculation, malicious engine detection ratio calculation, and strict 0-detection phrasing ("No malicious detections reported by the queried engines", never "Safe").
  - **URL Threat Intelligence Coordinator (`app/services/url_threat_intelligence.py`)**: URL normalization (lowercase hostname, scheme guarantee, default port stripping, fragment removal), stable SHA-256 hashing, MongoDB cache verification with 24-hour TTL, and parallel non-blocking execution of GSB and VT lookups via thread pools.
  - **Primary MongoDB Database Persistence (`app/database_mongo.py`)**: `url_threat_checks` collection storing normalized threat documents, internal analysis (XGBoost score & structural indicators), external intelligence, agent reasoning, and risk score without exposing API keys or credentials.
  - **Upgraded URL AI Agent (`app/services/url_agent.py`)**: Full URL Evidence Fusion combining deep structural analysis (protocol, IPv4 vs domain, shortening, high-abuse TLDs, subdomains, credential keywords) + 14-dimensional PhiUSIIL XGBoost ML classifier + Google Safe Browsing + VirusTotal + LLM reasoning into a unified `URL Evidence Object`.
  - **Bayesian Risk AI & Explainable AI Corroboration (`risk_engine.py` & `explainability.py`)**: Fuses external reputation corroboration with internal ML without unilateral override; 0 external detections never reduces internal ML threat probability; adds SHAP deltas and explicit external intelligence indicators in forensic attributions.
  - **Threat Intel API Endpoints (`app/routes/analyze.py`)**: Added `GET /api/threat-intel/status` and `POST /api/threat-intel/check` alongside primary `POST /api/analyze`.
  - **Frontend External Threat Intelligence Card (`ExternalThreatIntelligence.jsx`)**: Renders GSB status, VT detection ratio, checked timestamp, MongoDB cache indicator, and clearly labeled `Demo Mode — Simulated` badge.
  - **Frontend URL Agent Panel (`AgentDeltaCard.jsx`)**: Upgraded to show URL ML diagnostics (model, probability), External Intelligence corroboration (GSB, VT), and agent interpretation.
  - **11-Stage Pipeline Visualization (`SubmitAnalysisPage.jsx`)**: Animated multi-agent execution pipeline display during threat analysis.
  - **Automated Verification**: Complete 20-point test suite (`test_url_threat_intel_full.py`) passing 100% and Vite frontend building cleanly.

- Verification and end-to-end testing of dynamic conversational profiling and personalization workflows
- Final polish of user security context injection in GenAI explanation templates

### 2026-09-29 (Analyze Threat Master Spec & Workflow Implementation)
- **Original Submitted Content Sandboxed Rendering (`OriginalSubmittedContent.jsx`)**: Prominently displays unaltered user input near report top, with monospace syntax styling, expand/collapse (>350 chars), copy-to-clipboard, and header/URL metadata pills.
- **Evidence-Aware Attack Classification (`genai_service.py`)**: Fixed low-risk categorization: score < 40 strictly displays *"No significant phishing attack detected"* (never forced into a phishing category); medium risk (40-74) displays *"Suspicious / Possible Social Engineering"*; high risk (>=75) classifies specific categories.
- **Independent Structured Agent Evidence Snippets**:
  - `Text Agent`: TF-IDF + Logistic Regression probability, confidence, triggered lexical indicators (urgency, payment, credential harvesting).
  - `Sender Agent`: Strictly evaluates provided RFC headers; missing SPF/DKIM/DMARC returned as `"Not provided"`; zero fabricated auth softfails.
  - `URL Agent`: PhiUSIIL 14-feature XGBoost ML probability, structural characteristics, GSB and VirusTotal external threat intel.
- **Incident Memory RAG Integrity & Evolution Comparison (`rag_service.py` & `WhatChangedComparison.jsx`)**:
  - Enforced strict 0.55 similarity threshold; completely eliminated random fallback incidents.
  - Returns *"No sufficiently similar previous incident found"* when below threshold.
  - Automatically computes *"What Changed? (Tactical Campaign Evolution)"* for strong matches (>=0.70).
- **Bayesian Risk Engine & Profile Relevance (`risk_engine.py`)**: Computes objective `base_score`, `personalized_score`, and `profile_relevance` without arbitrary LLM score overrides.
- **Dynamic Defense Action Plan & Persona Elimination (`genai_service.py` & `ActionPlanList.jsx`)**: Completely removed hardcoded persona references ("nuclear scientist", "sensitive clearance", static roles); dynamically tailors response steps based on user's active role, activities, and security awareness.
- **Personalization Context Panel & "Why This Matters to You" (`PersonalizationContextPanel.jsx`)**: Renders active role, online activities, security awareness, past incidents, explanation preference, and contextual relevance.
- **Interactive Verification Checklist (`BeforeYouActChecklist.jsx`)**: Checkable immediate validation safeguards before acting on messages.
- **6-Dimension Evidence Coverage Matrix (`EvidenceCoverageCard.jsx`)**: Visualizes multi-agent coverage across Text, URL, Sender, External Intel, Incident RAG, and Profile Context.
- **11-Stage Pipeline Execution Trace (`AgentAnalysisTrace.jsx`)**: Expandable trace detailing each execution stage from raw ingestion to dynamic action plan generation.
- **MongoDB Persistence (`database_mongo.py` & `orchestrator.py`)**: Full persistence of incident documents into MongoDB `incidents` collection, including original content, structured agent results, RAG results, risk score, classification, explainability, personalization, and execution trace.
- **Complete 16-Section Report Layout (`AnalysisResultPage.jsx`)**: Converted report page to the production 16-section structure per Master Spec §18.
- **Generative AI Output Layer Audit & Implementation (`genai_service.py`, `llm_gateway.py`, `PersonalizedRecommendationsCard.jsx`)**:
  - Implemented the 3 core Generative AI capabilities:
    1. **Evidence-Grounded Explanation**: Structured into Overall Finding, Why Flagged (numbered list), Evidence by Agent (Text, URL, Sender), Incident Memory Context, and Risk Interpretation. Communicates using user's explanation preference (Simple, Balanced, Technical).
    2. **Dynamic Action Plan**: Tactical operational response steps calibrated to risk severity and attack type (internship scam, credential phishing, invoice fraud, banking, delivery scam, legitimate).
    3. **Personalized Recommendations**: Dedicated capability deriving recommendations from the authenticated user's profile context (Role, Industry, Online Activities, Security Awareness).
  - **Structured Evidence Contract**: Prepares structured JSON containing multi-agent ML probabilities, external intel, and user context for the Multi-Provider LLM Gateway.
  - **Prompt Injection Defense**: Untrusted payload text is wrapped with `wrap_untrusted` to prevent prompt injection execution.
  - **Multi-Provider LLM Gateway & Deterministic Fallback**: Supports live inference via active LLM provider (Gemini, Groq, Claude, OpenAI, Ollama) and automatically falls back to a high-grade deterministic synthesis on network/provider failure or invalid JSON.
  - **Comprehensive Verification Suite (`test_genai_output_layer.py`)**: All 11 test cases (A through K) passed with 100% success.
- **Automated Verification**: End-to-end backend tests (`test_analyze_threat_workflow.py` and `test_genai_output_layer.py`) passed 100% and frontend built cleanly (`npm run build`).

## Pending
- Fine-grained evaluation metrics reporting per dataset source (PhiUSIIL, CEAS_08, Nazario, Enron, SpamAssasin)
- Expansion of persistent RAG vector storage with ChromaDB disk persistence
- Real-time attachment analysis (e.g. malicious PDF/Office document heuristics)
- Automated email client extension/plugin (e.g., Gmail/Outlook add-in)
- Exportable threat incident forensic PDF report generator

## Important Decisions
- **Dual Persistence Architecture (Spec §10, §11, §12)**:
  - **Database (SQLite `phishguard.db`)**: Source of truth for current structured state (`user_profiles`, `profile_history`, timestamps, completeness score).
  - **User Profile RAG (`app/services/user_profile_rag.py`)**: Dedicated semantic memory layer storing validated context chunks and history evolutions.
  - **Incident RAG (`app/services/rag_service.py`)**: Logically separate vector store for historical threat and attack cases.
- **Personalization Guardrail (Spec §20)**: Personalization AI customizes explanations, action plans, and relevance, but **NEVER** overrides or alters the underlying threat risk score calculated by the ML models and Bayesian Risk AI.
- **Whitelisted Schema Validation (Spec §9, §22)**: LLM profile extractions and assistant commands must pass schema whitelist validation (`ALLOWED_PROFILE_FIELDS` and `ALLOWED_OPERATIONS`) before database persistence. No passwords, OTPs, API keys, or financial credentials are ever collected or stored.
- **UI Truth in State (Spec §16)**: Missing profile fields are explicitly displayed as `"Not provided"` or `"Not configured"` rather than filled with assumed/fake values or treated as confirmed inactive.

## Changes / Modifications
- Upgraded `UserProfile` lifecycle with `ProfileHistory` change auditing and `user_profile_rag` synchronization
- Upgraded `api.profile` endpoints in `Frontend/src/api/client.js` to include `/completeness`, `/history`, `/assistant`, and `/assistant/confirm`
- Expanded `OnboardingPage.jsx` with scale, yes/no, and direct conversational free-text answer bar
- Upgraded `ProfileSettingsPage.jsx` to render dimension completeness, history timeline, role-based threat exposure, and assistant preview confirmation

## Known Issues
- Ollama local endpoint requires local Ollama instance running at `http://127.0.0.1:11434`
- Some raw email pastes with non-standard header formats may fall back to body text without sender metadata

## Do Not Change
- Multi-agent ensemble pipeline flow (Preprocessor -> Text/URL/Sender Agents -> RAG -> Bayesian Fusion -> SHAP Explainability -> GenAI Action Plan)
- Logical separation between User Profile RAG (user identity & security context) and Incident RAG (threat patterns)
- 14-feature vector schema for URL XGBoost agent
- Offline fallback generation logic (must always function without external LLM API keys)
- Personalization constraint: never let user role or awareness reduce or increase raw evidence-based threat risk scores
