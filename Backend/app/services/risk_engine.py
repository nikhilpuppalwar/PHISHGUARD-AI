from typing import Dict, Any, List, Tuple

class RiskEngine:
    def __init__(self):
        # Configurable baseline weights for multi-agent evidence fusion
        self.w_url = 0.40
        self.w_text = 0.35
        self.w_sender = 0.15
        self.w_rag = 0.10

    def compute_risk(self,
                     text_res: Dict[str, Any],
                     url_res: Dict[str, Any],
                     sender_res: Dict[str, Any],
                     rag_res: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Synthesize multi-agent evidence into composite threat score (0-100),
        categorical severity, and statistical confidence.
        """
        score_text = text_res.get("risk_score", 0.0)
        score_url = url_res.get("risk_score", 0.0)
        score_sender = sender_res.get("risk_score", 0.0)
        score_rag = (rag_res.get("similarity", 0.0) * 100.0) if rag_res else 0.0

        # Dynamic weight normalization based on available signals
        # If no URL exists, reallocate URL weight to text and sender
        has_url = score_url > 0.0 or len(url_res.get("indicators", [])) > 0
        has_sender = score_sender > 0.0

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

        # Composite weighted score
        composite_score = (
            (score_url * eff_w_url) +
            (score_text * eff_w_text) +
            (score_sender * eff_w_sender) +
            (score_rag * eff_w_rag)
        )

        # Non-linear boost for multi-signal convergence (if both text and URL or sender are high)
        high_signals = sum(1 for s in [score_text, score_url, score_sender] if s >= 70.0)
        if high_signals >= 2:
            composite_score = min(98.5, composite_score * 1.15)
        elif high_signals == 0 and composite_score < 40.0:
            composite_score = max(5.0, composite_score * 0.85)

        composite_score = round(composite_score, 1)

        # Severity categorization
        if composite_score >= 75.0:
            severity = "High Risk"
        elif composite_score >= 40.0:
            severity = "Medium Risk"
        else:
            severity = "Low Risk"

        # Statistical confidence estimation (based on signal convergence and indicator volume)
        indicator_count = (
            len(text_res.get("indicators", [])) +
            len(url_res.get("indicators", [])) +
            len(sender_res.get("indicators", []))
        )
        base_conf = 0.75 + min(0.22, indicator_count * 0.04)
        confidence = round(base_conf, 3)

        # Risk Factors
        risk_factors = []
        for ind in text_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "text", "weight": 0.88})
        for ind in url_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "url", "weight": 0.94})
        for ind in sender_res.get("indicators", []):
            risk_factors.append({"factor": ind, "agent": "sender", "weight": 0.82})

        return {
            "overall_score": composite_score,
            "severity": severity,
            "confidence": confidence,
            "risk_factors": risk_factors,
            "effective_weights": {
                "url": round(eff_w_url, 3),
                "text": round(eff_w_text, 3),
                "sender": round(eff_w_sender, 3),
                "rag": round(eff_w_rag, 3)
            }
        }

risk_engine = RiskEngine()
