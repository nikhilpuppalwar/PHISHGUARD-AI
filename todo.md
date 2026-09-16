# PhishGuard AI — TODO / Task Backlog

**Version:** 1.0
**Status:** New — no prior version existed
**Related documents:** `prd.md`, `flow_and_system_architecture.md`, `trd.md`, `database.md`

Status legend: `[x]` Completed · `[~]` In Progress · `[ ]` Planned — matches `trd.md` §16. Update checkboxes as work actually lands; do not mark a phase complete ahead of implementation and testing.

> **Project status reset:** implementation has not started yet. All phases below begin from `[ ]` Planned, with **Phase 1 as the current/starting phase**. Update this file as each phase is actually built and tested — do not pre-mark future phases.

---

## Phase 1 — Authentication + Basic Dashboard 🟡 Starting Now
- [ ] User registration / login
- [ ] Password hashing (hash + salt)
- [ ] Password reset / forgot-password flow (FR-17) — verified channel (email link/OTP), no user-enumeration leakage
- [ ] Session handling
- [ ] Basic dashboard shell
- [ ] Landing page (public, pre-login)

## Phase 2 — User Profile Onboarding ⬜ Planned
- [ ] Conversational profiling questions (role, communication types, awareness level, explanation preference)
- [ ] Persist profile to `user_profiles` table (`database.md` §3.2)
- [ ] Load existing profile on login

## Phase 3 — Text Agent + Text ML ⬜ Planned
- [ ] TF-IDF + Logistic Regression pipeline
- [ ] **Train on the full consolidated corpus** (`phishing_email.csv`, `CEAS_08.csv`, `Enron.csv`, `SpamAssasin.csv`, `Ling.csv`) rather than a single source — see Data & ML Backlog below
- [ ] Add SMS-channel model/branch trained on `spam_sms.csv`
- [ ] Record model version + metrics in `model_versions` table

## Phase 4 — URL Agent + URL ML ⬜ Planned
- [ ] Finalize feature engineering from PhiUSIIL's 55-column schema (`DATASET_INFO.md` §1.1)
- [ ] Train XGBoost model
- [ ] Evaluate (precision, recall, F1, confusion matrix, ROC-AUC) — do not report until measured
- [ ] Use the correct PhiUSIIL split from the start (`1`=Phishing 134,850 / `0`=Legitimate 100,945)
- [ ] Register model in `model_versions`

## Phase 5 — Sender Agent ⬜ Planned
- [ ] Assemble labeled sender-feature dataset (engineered from `CEAS_08`, `Nazario`, `Nigerian_Fraud`, `SpamAssasin` header fields + confirmed incidents) — register in `datasets` as `ds_sender_features`
- [ ] Engineer sender features: sender/domain relationship, display-name vs. domain consistency, reply-to mismatch, authentication results, domain reputation
- [ ] Train Random Forest model on the assembled dataset
- [ ] Evaluate (precision, recall, F1, confusion matrix) — do not report until measured
- [ ] Add lightweight rule/heuristic fallback for when a required sender feature is missing from the input
- [ ] Wire `agent_results` (agent_type = `sender`) with populated `model_id` + `model_probability`
- [ ] Register model in `model_versions`

## Phase 6 — AI Orchestrator ⬜ Planned
- [ ] LangGraph workflow: dispatch Text/URL/Sender agents in parallel
- [ ] Collect agent outputs into `combined_evidence` shape (`database.md` §5)
- [ ] Error handling / partial-evidence handling (e.g. URL missing from an SMS submission)
- [ ] Pass combined evidence downstream to RAG + Risk AI

## Phase 7 — Phishing RAG + User Profile RAG ⬜ Planned
- [ ] Stand up ChromaDB collections: `user_profile_vectors`, `incident_vectors` (`database.md` §6)
- [ ] Choose and pin MiniLM / Sentence-Transformer embedding model
- [ ] Seed `incident_vectors` from confirmed incidents only — **never from held-out test data**
- [ ] Implement Top-K retrieval query path
- [ ] Store `embedding_id` back onto `incidents` rows for traceability

## Phase 8 — Risk AI ⬜ Planned
- [ ] Define initial (documented-as-provisional) weighting of text/URL/sender/RAG signals
- [ ] Validate weights experimentally rather than assuming them
- [ ] Persist to `risk_assessments` (score, severity, confidence, risk_factors)
- [ ] Add regression tests for risk-score consistency on repeated/similar inputs

## Phase 9 — Explainable AI + Attack Type Detection ⬜ Planned
- [ ] Agent-contribution breakdown
- [ ] Detected-indicator listing
- [ ] SHAP-style factor attribution
- [ ] Populate `attack_types` lookup table (Internship Scam, Credential Phishing, Invoice Fraud, Advance-Fee Scam, Generic Phishing, etc.)
- [ ] Attack-type classifier/heuristic + confidence
- [ ] Persist to `explanations` + link `final_results.attack_type_id`
- [ ] Build Attack Type Glossary screen (FR-18), sourced from the `attack_types` lookup table

## Phase 10 — Personalization + GenAI ⬜ Planned
- [ ] Prompt construction grounded strictly in structured evidence (no fabricated evidence)
- [ ] Provider-independent LLM integration (OpenAI / Gemini / Claude / Ollama)
- [ ] Personalization rules keyed off `user_profiles` (role, awareness level, explanation style)
- [ ] Generate explanation + risk summary + action plan
- [ ] Persist to `final_results`, including `llm_provider` / `llm_model` for auditability

## Phase 11 — Feedback + Similar Incident Analysis ⬜ Planned
- [ ] Feedback capture UI (`confirmed_phishing / confirmed_legitimate / incorrect / unsure`)
- [ ] Persist to `feedback` table
- [ ] On confirmation, create/update an `incidents` row and re-index into `incident_vectors`
- [ ] Feed feedback signal back into future personalization (not automatic model retraining without review)

## Phase 12 — Evaluation + Final UI Polish ⬜ Planned
- [ ] Full evaluation pass per `trd.md` §15 (ML, RAG, explainability, end-to-end)
- [ ] Per-source-dataset breakdown of text-model metrics, not just combined
- [ ] UI polish: risk dashboard, explanation view, action-plan view, feedback flow
- [ ] Final documentation pass — confirm `prd.md`, `flow_and_system_architecture.md`, `trd.md`, `database.md` all match the shipped implementation

---

## Data & ML Backlog (cross-phase)

These items come out of the dataset audit (`DATASET_INFO.md`) and apply across Phases 3–12 rather than to a single phase:

- [ ] **Fix broken `spam_sms.csv` rows** — concatenate `v2` with `Unnamed: 2/3/4` overflow columns before cleaning (unescaped-comma artifact).
- [ ] **Track dataset provenance per record** — keep a `source_dataset` field through preprocessing so per-source evaluation stays possible (`trd.md` §5.1).
- [ ] **Handle class imbalance** — stratified splitting (or focal loss) for `spam_sms.csv` (13.4% positive) and any future use of `enron_data_fraud_labeled_.csv` (2.9% positive).
- [ ] **Treat `Nazario.csv` and `Nigerian_Fraud.csv` as positive-only sets** — use for augmentation/recall stress-testing, not as standalone binary-classifier training data.
- [ ] **Explicitly exclude `enron_data_fraud_labeled_.csv` from the core phishing pipeline** — different label semantics (corporate fraud/POI, not phishing), huge size, heavy imbalance. Track it in `datasets` with `role = future_out_of_scope` only.
- [ ] **Extract header-derived features** (`CEAS_08`, `Nazario`, `Nigerian_Fraud`, `SpamAssasin` all expose `sender`/`receiver`/`urls`) as the primary training source for the Sender Agent's Random Forest model, pending a dedicated, purpose-built sender-labeled dataset.
- [ ] **Populate the `datasets` table** with the seed rows in `database.md` §7 before first model training run.
- [ ] **Register every trained model** in `model_versions` with real, measured metrics — never placeholder numbers.
- [ ] **Correct the PhiUSIIL legitimate/phishing split** everywhere it still appears reversed (older slides/docs said 134,850 legitimate / 100,945 phishing — the verified split is the opposite).

---

## Documentation Backlog

- [ ] Keep `prd.md`, `flow_and_system_architecture.md`, `trd.md`, `database.md` in sync as implementation progresses — update the phase table in `trd.md` §16 and the checkboxes above together.
- [ ] Once Risk AI weights are validated (Phase 8), replace "provisional" language in `trd.md` §8 with the finalized formula.
- [ ] Once real evaluation numbers exist (any phase), add them to `trd.md` §15 and remove any "example" framing from the presentation/demo screens described in `flow_and_system_architecture.md` §12.
- [ ] Once the Sender Agent's Random Forest model is trained and evaluated, add real metrics to `trd.md` §5.3/§15 and `database.md` §3.14 (`model_versions.metrics`) together — not one without the other.
