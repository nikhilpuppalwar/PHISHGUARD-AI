# 🛡️ PhishGuard AI

> **Personalized Multi-Agent Phishing Detection & Explainable Threat Risk Analysis Platform Using Generative AI**

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![XGBoost](https://img.shields.io/badge/XGBoost-111111?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)

---

## 📌 Overview

**PhishGuard AI** is an advanced cybersecurity platform that safeguards users against sophisticated social engineering, spear-phishing, invoice fraud, and credential harvesting threats. Rather than relying on generic blacklists or monolithic heuristics, PhishGuard AI leverages a **multi-agent ensemble** combined with **contextual conversational profiling** to deliver personalized risk assessments and role-tailored defense action plans.

---

## 🚀 Key Features

### 1. Multi-Agent Detection Ensemble
- **Text Agent (`TF-IDF + Logistic Regression`)**: Evaluates linguistic urgency, coercive incentives, financial baiting, and psychological pressure.
- **URL Agent (`XGBoost Classifier`)**: Extracts and computes 14 high-signal structural, domain, and token features based on the PhiUSIIL 54-feature benchmark.
- **Sender Agent (`Random Forest Classifier`)**: Analyzes 7 engineered authentication features including display-name spoofing, SPF/DKIM/DMARC headers, domain age, and reply-to mismatches.
- **Incident Memory RAG**: Vector similarity search matching incoming threats against past confirmed incident vectors.
- **Bayesian Risk Fusion Engine**: Harmonizes multi-agent probabilities into a single calibrated risk score (0–100) with confidence bounds.
- **Explainable AI (SHAP Deltas)**: Calculates forensic contribution deltas (+/-) for every agent to ensure transparent decision-making.

### 2. Conversational AI User Profiling
- **Dynamic Onboarding Interview**: The AI conducts an interactive, adaptive interview starting with *"What best describes your role?"* and generates subsequent questions based on the user's specific context.
- **Multi-Type Question Support**: Supports single-choice, multiple-choice, yes/no, and freeform text.
- **"Other" / Custom Input Normalization**: Automatically presents a custom text input whenever "Other" is chosen and normalizes the information into the user's profile.
- **Natural Language Profile Modification**: Users can speak naturally (*"I changed my role to Software Developer and started using AWS"*, *"Remove Instagram from my platforms"*), and the AI automatically converts requests into validated, structured updates.
- **Profile Memory Integration**: Incoming phishing threats are cross-referenced with the user's active accounts and platforms (e.g. Google, GitHub, University SSO) to flag personalized targeted deception.

### 3. Unified Single-Input Threat Studio
- **Automatic Multi-Entity Extraction**: Users paste raw inbound text, email headers, SMS messages, or URLs into a single unified textarea.
- The preprocessor automatically extracts clean text, embedded URLs, sender headers, channel, and heuristic indicators in real time.

### 4. Multi-Provider LLM Gateway
- Connect your choice of leading AI providers with live round-trip latency testing:
  - **Google Gemini** (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`)
  - **Groq LPU** (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `gemma2-9b-it`)
  - **OpenRouter** (`anthropic/claude-3.5-sonnet`, `meta-llama/llama-3.3-70b-instruct`, `deepseek/deepseek-r1`)
  - **Anthropic Claude** (`claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`, `claude-3-opus-20240229`)
  - **ChatGPT / OpenAI** (`gpt-4o`, `gpt-4o-mini`, `o1-mini`)
  - **Ollama (Local LLM)** (`llama3.2`, `mistral`, `phi3` — 100% offline, zero data leakage)
  - **Hugging Face Inference** (`meta-llama/Llama-3.2-3B-Instruct`, `mistralai/Mistral-7B-Instruct-v0.3`)
- **Database Credential Persistence**: Securely stores API credentials with masked keys and allows one-click model activation.
- **100% Offline Guarantee**: The platform functions seamlessly offline without an API key using the built-in deterministic contextual generation engine.

---

## 🛠️ Architecture

```
                    ┌─────────────────────────┐
                    │   Unified Input Studio  │
                    └────────────┬────────────┘
                                 │ Raw Content
                                 ▼
                    ┌─────────────────────────┐
                    │  Preprocessor & Extractor│
                    └────────────┬────────────┘
                                 │ Clean Text, URLs, Sender
                                 ▼
                    ┌─────────────────────────┐
                    │      AI Orchestrator    │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│    Text Agent    │   │    URL Agent     │   │   Sender Agent   │
│  (TF-IDF + LR)   │   │(XGBoost / PhiUS) │   │ (Random Forest)  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │ Agent Signals
                                ▼
                    ┌─────────────────────────┐
                    │    Incident RAG Memory  │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Bayesian Risk AI Fusion │
                    └────────────┬────────────┘
                                 │ Overall Score (0-100)
                                 ▼
                    ┌─────────────────────────┐
                    │ Explainable AI (SHAP)   │
                    └────────────┬────────────┘
                                 │ Agent Deltas & Indicators
                                 ▼
                    ┌─────────────────────────┐
                    │ Personalized GenAI / LLM│◄── User Profile Context
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  Action Plan & Triage   │
                    └─────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS (Deep Navy `#0B1220` security aesthetic)
- **Icons**: Lucide React
- **Charts & Telemetry**: Recharts

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: SQLAlchemy + SQLite (`phishguard.db`)
- **Machine Learning**: Scikit-Learn (`RandomForestClassifier`, `LogisticRegression`), XGBoost
- **Vector / RAG Search**: ChromaDB / cosine keyword similarity

---

## 🏃 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/nikhilpuppalwar/PHISHGUARD-AI.git
cd PHISHGUARD-AI
```

### 2. Backend Setup
```bash
cd Backend
pip install -r requirements.txt
python migrate_profile.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs on `http://127.0.0.1:8000` (Swagger UI at `/docs`)*

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
npm run dev
```
*Frontend runs on `http://127.0.0.1:5173`*

### 4. Default Demo Account
- **Email**: `alex.rivera@university.edu`
- **Password**: `Password123!`
*(Or register a new account to test the Conversational Profiling Onboarding)*

---

## 📄 License
This project is licensed under the MIT License.
