from typing import Dict, Any, List, Tuple, Optional

class RiskEngine:
    """
    Bayesian Evidence Fusion Engine (Spec §10, §27).
    Fuses:
    - Text Agent ML (TF-IDF + Logistic Regression)
    - URL Agent (XGBoost ML + Structural Analysis)
    - External Threat Intelligence (Google Safe Browsing + VirusTotal)
    - Sender Agent ML (Random Forest Classifier)
    - Incident Memory RAG (ChromaDB similarity)

    Enforces transparent, deterministic scoring. No single provider unilaterally
    dictates the score, and 0 external detections never marks a threat as safe.
    """

    def __init__(self):
        # Baseline weights across multi-agent evidence streams
        self.w_url = 0.40
        self.w_text = 0.35
        self.w_sender = 0.15
        self.w_rag = 0.10

    def compute_risk(self,
                     text_res: Dict[str, Any],
                     url_res: Dict[str, Any],
                     sender_res: Dict[str, Any],
                     rag_res: Optional[Dict[str, Any]] = None,
                     user_profile: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Synthesize multi-agent and external threat intelligence evidence into
        a transparent composite score (0-100), categorical severity, and confidence.
        """
        score_text = text_res.get("risk_score", 0.0)
        score_url = url_res.get("risk_score", 0.0)
        score_sender = sender_res.get("risk_score", 0.0)
        score_rag = (rag_res.get("similarity", 0.0) * 100.0) if rag_res else 0.0

        # Extract external threat intelligence signals
        external_intel = url_res.get("external_threat_intel") or {}
        gsb = external_intel.get("google_safe_browsing", {})
        vt = external_intel.get("virustotal", {})

        has_url = score_url > 0.0 or len(url_res.get("indicators", [])) > 0
        has_sender = score_sender > 0.0

        # Dynamic weight normalization based on available channels
        if not has_url and has_sender:
            eff_w_text = 0.65
            eff_w_sender = 0.25
            eff_w_url = 0.0
            eff_w_rag = 0.10
        elif not has_url and not has_sender:
            eff_w_text = 0.85
            eff_w_sender = 0.0
            eff_w_url = 0.0
            eff_w_rag = 0.15
        else:
            eff_w_url = self.w_url
            eff_w_text = self.w_text
            eff_w_sender = self.w_sender
            eff_w_rag = self.w_rag

        total_weight = eff_w_url + eff_w_text + eff_w_sender + eff_w_rag
        eff_w_url /= total_weight
        eff_w_text /= total_weight
        eff_w_sender /= total_weight
        eff_w_rag /= total_weight

        # Composite base weighted score
        composite_score = (
            (score_url * eff_w_url) +
            (score_text * eff_w_text) +
            (score_sender * eff_w_sender) +
            (score_rag * eff_w_rag)
        )

        # Multi-signal convergence boost
        high_signals = sum(1 for s in [score_text, score_url, score_sender] if s >= 70.0)
        if high_signals >= 2:
            composite_score = min(98.5, composite_score * 1.15)
        elif high_signals == 0 and composite_score < 40.0:
            composite_score = max(5.0, composite_score * 0.85)

        # External Threat Intelligence Corroboration (Spec §10)
        # External APIs provide corroborative evidence without unilaterally controlling the decision
        intel_boost = 0.0
        if gsb.get("known_threat"):
            intel_boost += 8.0

        vt_mal = vt.get("malicious", 0)
        if vt_mal >= 5:
            intel_boost += 10.0
        elif vt_mal >= 2:
            intel_boost += 6.0
        elif vt_mal == 1:
            intel_boost += 3.0

        if intel_boost > 0:
            composite_score = min(99.0, composite_score + intel_boost)

        composite_score = round(composite_score, 1)

        # Severity categorization
        if composite_score >= 75.0:
            severity = "High Risk"
        elif composite_score >= 40.0:
            severity = "Medium Risk"
        else:
            severity = "Low Risk"

        # Statistical confidence estimation
        indicator_count = (
            len(text_res.get("indicators", [])) +
            len(url_res.get("indicators", [])) +
            len(sender_res.get("indicators", []))
        )
        base_conf = 0.75 + min(0.22, indicator_count * 0.04)
        if gsb.get("checked") or vt.get("checked"):
            base_conf = min(0.98, base_conf + 0.05)
        confidence = round(base_conf, 3)

        # Structured Risk Factors
        risk_factors = []
        for ind in text_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "text", "weight": 0.88})
        for ind in url_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "url", "weight": 0.94})
        for ind in sender_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "sender", "weight": 0.82})

        # Add external intelligence specific factors if present
        if gsb.get("known_threat"):
            types_str = ", ".join(gsb.get("threat_types", [])) or "Threat"
            risk_factors.append({
                "factor": f"Google Safe Browsing: Confirmed malicious threat ({types_str})",
                "agent": "external_intel",
                "weight": 0.98
            })
        if vt_mal > 0:
            risk_factors.append({
                "factor": f"VirusTotal: {vt_mal} of {vt.get('total_engines', 0)} security engines flagged malicious",
                "agent": "external_intel",
                "weight": 0.95
            })

        # Spec §4 & §10: Profile relevance assessment
        profile_relevance = "GENERAL"
        indicators_combined = " ".join([rf["factor"].lower() for rf in risk_factors]) + " " + text_res.get("summary", "").lower()
        if user_profile:
            role_str = str(user_profile.get("role", "")).lower()
            services = [s.lower() for s in user_profile.get("common_services", [])]
            activities = [a.lower() for a in user_profile.get("online_activities", [])]
            
            # Check if threat touches user's active domain or services
            matched_profile = False
            if "student" in role_str and any(k in indicators_combined for k in ["internship", "campus", "student", "placement", "academic"]):
                matched_profile = True
            elif any(s in indicators_combined for s in services if len(s) > 2):
                matched_profile = True
            elif any(a in indicators_combined for a in activities if len(a) > 2):
                matched_profile = True
            elif user_profile.get("matched_services"):
                matched_profile = True

            if matched_profile and composite_score >= 35.0:
                profile_relevance = "HIGH"
            elif composite_score >= 35.0:
                profile_relevance = "MODERATE"
            else:
                profile_relevance = "LOW (Benign content)"

        # Spec §4, §10, §18: Calibrated Personalized Risk Score
        base_score = composite_score
        personalized_score = base_score
        if user_profile and base_score >= 20.0:
            awareness_str = str(user_profile.get("security_awareness", "")).lower()
            
            # 1. Profile Demographic & Service Targeting Delta
            if profile_relevance == "HIGH":
                personalized_score += 10.0
            elif profile_relevance == "MODERATE":
                personalized_score += 0.0
            elif "low" in profile_relevance.lower():
                personalized_score -= 3.0

            # 2. Security Awareness & Technical Experience Calibration
            if any(term in awareness_str for term in ["beginner", "1", "2"]):
                personalized_score += 4.0
            elif any(term in awareness_str for term in ["intermediate", "3"]):
                personalized_score += 2.0
            elif any(term in awareness_str for term in ["advanced", "expert", "4", "5"]):
                personalized_score -= 4.0

            personalized_score = round(max(5.0, min(99.0, personalized_score)), 1)

        # Set overall_score to personalized_score if profile exists, else base_score
        overall_score = personalized_score if user_profile else base_score

        # Recalibrate severity for overall score
        if overall_score >= 75.0:
            final_severity = "High Risk"
        elif overall_score >= 40.0:
            final_severity = "Medium Risk"
        else:
            final_severity = "Low Risk"

        return {
            "overall_score": overall_score,
            "base_score": base_score,
            "personalized_score": personalized_score,
            "severity": final_severity,
            "confidence": confidence,
            "profile_relevance": profile_relevance,
            "risk_factors": risk_factors,
            "effective_weights": {
                "url": round(eff_w_url, 3),
                "text": round(eff_w_text, 3),
                "sender": round(eff_w_sender, 3),
                "rag": round(eff_w_rag, 3)
            }
        }

risk_engine = RiskEngine()
