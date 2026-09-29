import os
import re
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.user import UserProfile, ProfileHistory
from app.models.submission import Submission

# Try importing chromadb for vector persistence; fallback to memory vector index
try:
    import chromadb
    from chromadb.config import Settings
    CHROMA_AVAILABLE = True
except Exception:
    CHROMA_AVAILABLE = False


class UserProfileRAGService:
    """
    Dedicated User Profile RAG Semantic Memory Layer (Spec Section 11, 12, 19, 31, 32).
    Distinct from Incident RAG:
      - Incident RAG: Answers 'What previous threats or incidents are similar?'
      - User Profile RAG: Answers 'Who is this user and what relevant security context do we know?'
    """

    def __init__(self, persist_dir: str = "storage/user_profile_rag"):
        self.persist_dir = persist_dir
        self.client = None
        self._memory_cache: Dict[str, List[Dict[str, Any]]] = {}

        if CHROMA_AVAILABLE:
            try:
                os.makedirs(self.persist_dir, exist_ok=True)
                self.client = chromadb.PersistentClient(path=self.persist_dir)
            except Exception as e:
                print(f"[UserProfileRAG] ChromaDB initialization notice: {e}. Using resilient in-memory semantic index.")
                self.client = None

    def _get_or_create_collection(self, user_id: str):
        if not self.client:
            return None
        safe_id = f"user_profile_{re.sub(r'[^a-zA-Z0-9_-]', '_', user_id)}"[:63]
        try:
            return self.client.get_or_create_collection(
                name=safe_id,
                metadata={"hnsw:space": "cosine", "user_id": user_id}
            )
        except Exception as e:
            print(f"[UserProfileRAG] Chroma collection fetch error: {e}")
            return None

    def build_profile_semantic_chunks(self, profile: UserProfile, history: List[ProfileHistory] = None) -> List[Dict[str, Any]]:
        """
        Converts structured profile and meaningful changes into high-density semantic context chunks.
        Excludes raw UI telemetry; stores only security-relevant context.
        """
        chunks = []

        # 1. Identity & Role Context
        role = profile.role or "Student"
        ind = f" in {profile.industry}" if profile.industry else ""
        org = f" at a {profile.organization_type}" if profile.organization_type else ""
        chunks.append({
            "id": "role_identity",
            "category": "role",
            "text": f"User is a {role}{ind}{org}. Primary security posture and attack targets correspond to a {role}.",
            "keywords": [role.lower(), "role", "identity", "profession", "occupation"]
        })

        # 2. Digital Services & Platforms
        services = profile.common_services or []
        if services:
            services_str = ", ".join(services)
            chunks.append({
                "id": "common_services",
                "category": "services",
                "text": f"User actively uses and monitors accounts on: {services_str}. Lookalikes or lures impersonating these services pose a higher direct threat.",
                "keywords": [s.lower() for s in services] + ["service", "platform", "account", "login", "sso"]
            })

        # 3. Online Activities & Communication
        activities = profile.online_activities or []
        comms = profile.common_communication_types or []
        if activities or comms:
            act_str = ", ".join(activities) if activities else "General web use"
            comm_str = ", ".join(comms) if comms else "Standard email"
            chunks.append({
                "id": "activities_communication",
                "category": "activities",
                "text": f"User regular online activities: {act_str}. Common communication channels: {comm_str}.",
                "keywords": [a.lower() for a in activities] + [c.lower() for c in comms] + ["activity", "communication", "channel", "messages"]
            })

        # 4. Security Calibration & Preferences
        awareness = profile.security_awareness or "Beginner"
        exp = profile.technical_experience or "Intermediate"
        style = profile.preferred_explanation_style or "Simple"
        chunks.append({
            "id": "security_calibration",
            "category": "calibration",
            "text": f"Security awareness level is {awareness}. Technical experience is {exp}. The user prefers {style} security explanations and actionable next steps.",
            "keywords": [awareness.lower(), exp.lower(), style.lower(), "awareness", "explanation", "preference"]
        })

        # 5. Financial & Enterprise Risk Exposure
        risk_flags = []
        if profile.banking_usage:
            risk_flags.append("Frequently conducts online banking and financial transactions.")
        if profile.online_shopping:
            risk_flags.append("Regularly uses e-commerce, shopping portals, and receives delivery/order tracking updates.")
        if profile.work_email_usage:
            risk_flags.append("Actively uses corporate or institutional work email with external communications.")
        
        if risk_flags:
            chunks.append({
                "id": "risk_exposures",
                "category": "risk_exposure",
                "text": " ".join(risk_flags),
                "keywords": ["banking", "bank", "financial", "shopping", "ecommerce", "package", "delivery", "order", "work email", "corporate"]
            })

        # 6. Custom Context / User Notes
        if profile.custom_information and isinstance(profile.custom_information, dict):
            custom_texts = []
            for k, v in profile.custom_information.items():
                if v and isinstance(v, (str, list)):
                    custom_texts.append(f"{k.replace('_', ' ').title()}: {v}")
            if custom_texts:
                chunks.append({
                    "id": "custom_context",
                    "category": "custom",
                    "text": "User custom security context: " + "; ".join(custom_texts),
                    "keywords": ["custom", "context", "notes"] + re.findall(r"\w+", " ".join(custom_texts).lower())
                })

        # 7. Meaningful Profile Change History (Lightweight semantic memory)
        if history:
            history_snippets = [h.description for h in history[:5] if h.description]
            if history_snippets:
                chunks.append({
                    "id": "profile_history",
                    "category": "history",
                    "text": "Recent profile context evolution: " + "; ".join(history_snippets),
                    "keywords": ["change", "history", "evolution", "update"] + re.findall(r"\w+", " ".join(history_snippets).lower())
                })

        return chunks

    def sync_user_profile_memory(self, user_id: str, profile: UserProfile, db: Optional[Session] = None):
        """
        Synchronizes database state with User Profile RAG memory.
        Invoked on onboarding completion, manual edits, or AI assistant updates.
        """
        history = []
        if db:
            history = db.query(ProfileHistory).filter(
                ProfileHistory.user_id == user_id
            ).order_by(ProfileHistory.created_at.desc()).limit(10).all()

        chunks = self.build_profile_semantic_chunks(profile, history)
        self._memory_cache[user_id] = chunks

        # Persist to ChromaDB collection if available
        coll = self._get_or_create_collection(user_id)
        if coll and chunks:
            try:
                # Clear previous profile chunks
                existing = coll.get()
                if existing and existing.get("ids"):
                    coll.delete(ids=existing["ids"])
                
                coll.add(
                    ids=[c["id"] for c in chunks],
                    documents=[c["text"] for c in chunks],
                    metadatas=[{"category": c["category"], "user_id": user_id} for c in chunks]
                )
            except Exception as e:
                print(f"[UserProfileRAG] Error syncing to Chroma: {e}")

    def retrieve_relevant_user_context(
        self,
        user_id: str,
        query_text: str,
        urls: Optional[List[str]] = None,
        sender: Optional[str] = None,
        db: Optional[Session] = None,
        max_chunks: int = 3
    ) -> Dict[str, Any]:
        """
        Section 19 & 30: Retrieves ONLY relevant user context for threat personalization.
        Does not send the entire profile unnecessarily.
        """
        # Ensure we have the profile
        profile = None
        if db:
            profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()

        if not profile:
            return {
                "role": "General User",
                "security_awareness": "Beginner",
                "explanation_style": "Simple",
                "relevant_snippets": [],
                "matched_services": [],
                "matched_activities": [],
                "is_relevant_exposure": False,
                "context_summary": "Standard profile context.",
                "formatted_for_prompt": "User role: General User (Beginner awareness)."
            }

        # Retrieve chunks (cache or fresh build)
        chunks = self._memory_cache.get(user_id)
        if not chunks:
            history = []
            if db:
                history = db.query(ProfileHistory).filter(ProfileHistory.user_id == user_id).order_by(ProfileHistory.created_at.desc()).limit(10).all()
            chunks = self.build_profile_semantic_chunks(profile, history)
            self._memory_cache[user_id] = chunks

        combined_input = (query_text or "") + " " + " ".join(urls or []) + " " + (sender or "")
        input_lower = combined_input.lower()
        input_words = set(re.findall(r"\w+", input_lower))

        # Score relevance of each semantic chunk
        scored_chunks = []
        matched_services = []
        matched_activities = []

        # Check direct service overlaps
        for s in (profile.common_services or []):
            if s.lower() in input_lower:
                matched_services.append(s)

        # Check direct activity overlaps
        for a in (profile.online_activities or []):
            if any(term in input_lower for term in a.lower().split()):
                matched_activities.append(a)

        for c in chunks:
            keywords = c.get("keywords", [])
            matches = sum(1 for kw in keywords if kw in input_lower or kw in input_words)
            
            # Boost category if matches services or activities
            score = matches
            if c["category"] == "services" and matched_services:
                score += 5
            if c["category"] == "activities" and matched_activities:
                score += 4
            if c["category"] == "risk_exposure":
                if any(w in input_lower for w in ["bank", "wire", "invoice", "payment", "card", "account", "login", "password"]):
                    score += 4
            if c["category"] == "role":
                # Role is always foundational baseline context
                score += 1

            scored_chunks.append((score, c))

        # Sort by relevance
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_chunks = [item[1]["text"] for item in scored_chunks[:max_chunks]]

        # Construct structured concise summary for Personalization AI
        role = profile.role or "Student"
        awareness = profile.security_awareness or "Beginner"
        style = profile.preferred_explanation_style or "Simple"

        is_relevant_exposure = len(matched_services) > 0 or len(matched_activities) > 0 or any(x[0] >= 3 for x in scored_chunks)

        prompt_lines = [
            f"User Role: {role}",
            f"Security Awareness Level: {awareness}",
            f"Preferred Explanation Style: {style}"
        ]
        if matched_services:
            prompt_lines.append(f"Direct Monitored Ecosystem Overlap: {', '.join(matched_services)}")
        if top_chunks:
            prompt_lines.append("Relevant Contextual Security Memory:")
            for snip in top_chunks:
                prompt_lines.append(f"• {snip}")

        formatted_prompt = "\n".join(prompt_lines)

        return {
            "role": role,
            "security_awareness": awareness,
            "explanation_style": style,
            "relevant_snippets": top_chunks,
            "matched_services": matched_services,
            "matched_activities": matched_activities,
            "is_relevant_exposure": is_relevant_exposure,
            "context_summary": f"{role} ({awareness}) | Relevant matches: {', '.join(matched_services + matched_activities) if (matched_services or matched_activities) else 'General'}",
            "formatted_for_prompt": formatted_prompt
        }


# Singleton export
user_profile_rag = UserProfileRAGService()
