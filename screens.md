# PhishGuard AI — Screens

**Version:** 1.0
**Status:** New — no prior version existed
**Related documents:** `prd.md`, `flow_and_system_architecture.md`, `trd.md`, `database.md`, `todo.md`

This document enumerates the application's screens, derived from the functional requirements in `prd.md` and the Frontend Responsibilities in `trd.md` §2. It is the reference for frontend scope — every screen below maps to at least one FR, API endpoint, or data entity so nothing here is speculative UI.

---

## 1. Screen Inventory

| # | Screen | Access | Primary FR(s) |
|---|---|---|---|
| 1 | Landing Page | Public | — (entry point) |
| 2 | Sign Up | Public | FR-01 |
| 3 | Login | Public | FR-01 |
| 4 | Password Reset / Forgot Password | Public (email-verified) | FR-17 |
| 5 | Onboarding / Conversational Profiling | Authenticated, first login | FR-02 |
| 6 | Dashboard (Home) | Authenticated | FR-01 |
| 7 | Submit Suspicious Content | Authenticated | FR-03, FR-04 |
| 8 | Analysis Result | Authenticated | FR-10–FR-15 |
| 9 | Incident History | Authenticated | derived from FR-09, FR-15 |
| 10 | Analytics / Risk Trends | Authenticated | derived from stored `risk_assessments` |
| 11 | Profile / Settings | Authenticated | FR-02, FR-13 |
| 12 | Attack Type Glossary | Authenticated (or public reference) | FR-18 |

**Total: 12 screens.**

---

## 2. Screen Detail

### 2.1 Landing Page
- **Purpose:** Public entry point — explains what PhishGuard AI does and drives Sign Up / Login.
- **Key components:** product pitch, "how it works" summary (Understand → Analyze → Retrieve → Assess → Explain → Personalize → Guide → Learn), CTA buttons.
- **Data/API:** none (static/marketing content).
- **Notes:** Should stay lightweight — no user data, no auth required.

### 2.2 Sign Up
- **Purpose:** Account creation.
- **Key components:** email, password, confirm password, terms acknowledgment.
- **Data/API:** `POST /auth/register` → `users` (`database.md` §3.1).
- **Notes:** Password hashed (hash + salt) before storage; never logged in plaintext.

### 2.3 Login
- **Purpose:** Authentication.
- **Key components:** email, password, "forgot password" link.
- **Data/API:** `POST /auth/login` → `sessions` (`database.md` §3.3).

### 2.4 Password Reset / Forgot Password
- **Purpose:** Let a user recover access without exposing account existence.
- **Key components:** step 1 — enter email; step 2 — check-your-email state; step 3 — reset-link/OTP entry + new password.
- **Data/API:** new logical endpoints — `POST /auth/password-reset/request`, `POST /auth/password-reset/confirm`. Add to `trd.md` §13 when implemented.
- **Notes (FR-17):** always return the same "if this email exists, we've sent a link" response regardless of whether the account exists, to avoid user-enumeration leakage. Reset tokens should be short-lived and single-use.

### 2.5 Onboarding / Conversational Profiling
- **Purpose:** Build the user's security profile through guided questions.
- **Key components:** chat-style or stepped form covering preferred name, role, common communication types, security-awareness level, preferred explanation style.
- **Data/API:** `POST /profile/onboarding` → `user_profiles` (`database.md` §3.2); profile is also embedded into `user_profile_vectors` (§6.1).
- **Notes:** Shown once, on first login (per Core User Journey step 2 in `prd.md` §5); skippable/editable later from Profile/Settings.

### 2.6 Dashboard (Home)
- **Purpose:** Landing view after login — orientation + quick actions.
- **Key components:** quick-submit shortcut, recent analysis results (last N), risk-trend summary widget, profile completeness prompt if onboarding was skipped.
- **Data/API:** `GET /incidents` (recent), `GET /analysis/{id}` (most recent).

### 2.7 Submit Suspicious Content
- **Purpose:** Entry point for a new analysis.
- **Key components:** channel selector (email / SMS / URL), text/URL input, optional sender/subject fields, submit action.
- **Data/API:** `POST /analyze` → `submissions` (`database.md` §3.4), triggers the pipeline in `flow_and_system_architecture.md` §3.
- **Notes:** Input is sanitized and treated as untrusted per `trd.md` §14; submitted URLs are never executed.

### 2.8 Analysis Result
- **Purpose:** Present the full outcome of one analysis.
- **Key components (per `flow_and_system_architecture.md` §12):**
  - Phishing Risk score + severity + confidence
  - Attack Type (links to Attack Type Glossary, §2.12)
  - Major Indicators
  - Similar Incident match
  - Explanation (Explainable AI breakdown: agent contribution, detected indicators, RAG evidence, risk factors)
  - Personalized Action Plan
  - Feedback control (`confirmed_phishing / confirmed_legitimate / incorrect / unsure`)
- **Data/API:** `GET /analysis/{id}` reading `risk_assessments`, `explanations`, `final_results`; `POST /feedback` → `feedback` (`database.md` §3.11).
- **Notes:** All numeric values shown must be real outputs of the pipeline, never hard-coded placeholders (`prd.md` §9).

### 2.9 Incident History
- **Purpose:** Let a user browse past submissions and results.
- **Key components:** list/table of past submissions (date, channel, risk score, severity, attack type), filter by severity/date, link into Analysis Result (§2.8).
- **Data/API:** `GET /incidents`.

### 2.10 Analytics / Risk Trends
- **Purpose:** Visualize risk patterns over time (this is why React Charts is in the stack — `trd.md` §2).
- **Key components:** risk-score-over-time chart, breakdown by attack type, breakdown by channel (email/SMS/URL).
- **Data/API:** aggregated from `risk_assessments` + `final_results`.
- **Notes:** Optional for MVP if time-constrained, but explicitly supported by the chosen frontend stack.

### 2.11 Profile / Settings
- **Purpose:** View and edit stored profile; account settings.
- **Key components:** editable profile fields (role, communication types, security-awareness level, preferred explanation style), change-password action, account/session management.
- **Data/API:** `PUT /profile` → `user_profiles`.

### 2.12 Attack Type Glossary
- **Purpose:** Reference page explaining each attack category so a result can be understood independent of a specific analysis.
- **Key components:** list of attack types (e.g. Internship Scam, Credential Phishing, Invoice Fraud, Advance-Fee Scam, Generic Phishing) each with a plain-language description and example indicators.
- **Data/API:** reads the `attack_types` lookup table (`database.md` §3.9).
- **Notes (FR-18):** content should stay in sync with whatever categories Attack Type Detection (FR-12) actually produces — don't document a category the classifier can't output, and don't let the classifier silently introduce a category that isn't documented here.

---

## 3. Out of Scope for Now

Considered but intentionally not included as screens yet:

| Idea | Why deferred |
|---|---|
| Security Awareness Quiz | Declined for this pass — was in the original blueprint's later-MVP list, not a current FR. Revisit once core detection (Phases 3–9) is stable. |
| Model & Dataset Status page | Useful for demo/evaluation but not tied to a current FR; consider adding once `model_versions` has real, measured metrics (`todo.md` Phase 12). |
| Admin/moderation console | No multi-tenant/admin role defined in `prd.md` §4 (Target Users). |
| Notifications | No requirement yet for proactive alerts outside of an active analysis. |

---

## 4. Cross-Reference

Every screen above should trace to:
1. A functional requirement in `prd.md` §6, and
2. An API endpoint in `trd.md` §13, and
3. A table/entity in `database.md` §3.

If a screen is added later that doesn't trace to at least one of these, add the missing FR/endpoint/table first — don't let the UI get ahead of the documented system.
