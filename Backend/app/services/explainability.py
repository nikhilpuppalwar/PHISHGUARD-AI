from typing import Dict, Any, List

class ExplainabilityEngine:
    def compute_contributions(self,
                              overall_score: float,
                              text_res: Dict[str, Any],
                              url_res: Dict[str, Any],
                              sender_res: Dict[str, Any],
                              rag_res: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Derive SHAP-style attribution deltas and percentage share for each agent.
        """
        s_url = url_res.get("risk_score", 0.0)
        s_text = text_res.get("risk_score", 0.0)
        s_sender = sender_res.get("risk_score", 0.0)
        s_rag = (rag_res.get("similarity", 0.0) * 100.0) if rag_res else 0.0

        raw_signals = {
            "url": max(1.0, s_url * 1.1),
            "text": max(1.0, s_text * 0.95),
            "sender": max(1.0, s_sender * 0.75),
            "rag": max(1.0, s_rag * 0.45)
        }

        total_sig = sum(raw_signals.values())
        percentages = {k: round((v / total_sig) * 100) for k, v in raw_signals.items()}

        # Normalize to exactly 100%
        diff = 100 - sum(percentages.values())
        if diff != 0:
            percentages["url"] += diff

        # Compute SHAP-style deltas scaled to fractional risk influence (e.g. +0.41)
        deltas = {
            "url": round((percentages["url"] / 100.0) * (overall_score / 100.0), 2),
            "text": round((percentages["text"] / 100.0) * (overall_score / 100.0), 2),
            "sender": round((percentages["sender"] / 100.0) * (overall_score / 100.0), 2),
            "rag": round((percentages["rag"] / 100.0) * (overall_score / 100.0), 2),
        }

        # Build agent detailed descriptions
        agent_details = {
            "url": {
                "agent_type": "url",
                "risk_score": s_url,
                "model_probability": url_res.get("model_probability", 0.0),
                "delta": deltas["url"],
                "indicators": url_res.get("indicators", []),
                "summary": url_res.get("summary", ""),
                "model_name": url_res.get("model_name", "XGBoost")
            },
            "text": {
                "agent_type": "text",
                "risk_score": s_text,
                "model_probability": text_res.get("model_probability", 0.0),
                "delta": deltas["text"],
                "indicators": text_res.get("indicators", []),
                "summary": text_res.get("summary", ""),
                "model_name": text_res.get("model_name", "TF-IDF + Logistic Regression")
            },
            "sender": {
                "agent_type": "sender",
                "risk_score": s_sender,
                "model_probability": sender_res.get("model_probability", 0.0),
                "delta": deltas["sender"],
                "indicators": sender_res.get("indicators", []),
                "summary": sender_res.get("summary", ""),
                "model_name": sender_res.get("model_name", "Random Forest")
            },
            "rag": {
                "agent_type": "rag",
                "risk_score": round(s_rag, 1),
                "model_probability": rag_res.get("similarity", 0.0) if rag_res else 0.0,
                "delta": deltas["rag"],
                "indicators": rag_res.get("indicators", []) if rag_res else [],
                "summary": f"{round(s_rag)}% semantic match to confirmed threat patterns." if rag_res else "No close vector match found.",
                "model_name": "ChromaDB Vector Retrieval"
            }
        }

        all_indicators = []
        for a in ["url", "text", "sender"]:
            all_indicators.extend(agent_details[a]["indicators"])

        return {
            "contributions": percentages,
            "deltas": deltas,
            "agent_details": agent_details,
            "all_indicators": list(dict.fromkeys(all_indicators))  # deduplicate preserving order
        }

explainability_engine = ExplainabilityEngine()
