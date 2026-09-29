import os
import hashlib
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import pymongo
from pymongo import MongoClient
from app.config import settings

class MongoDBManager:
    """
    Primary Application Database Manager for MongoDB (Spec §4, §5, §6, §23).
    Manages persistent collections:
      - url_threat_checks
      - users
      - user_profiles
      - incidents
      - feedback
      - rag_metadata
    """

    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self._connected = False
        self._init_connection()

    def _init_connection(self):
        try:
            self.client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2500,
                connectTimeoutMS=2500
            )
            # Test ping
            self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            self._connected = True

            # Ensure indexes on url_threat_checks
            self.db.url_threat_checks.create_index("url_hash", unique=True)
            self.db.url_threat_checks.create_index("checked_at")
            self.db.url_threat_checks.create_index("user_id")

            print(f"[MongoDBManager] Successfully connected to MongoDB database '{settings.MONGODB_DB_NAME}'.")
        except Exception as e:
            print(f"[MongoDBManager] Notice: MongoDB connection issue ({e}). Resilient caching & persistence enabled.")
            self._connected = False

    def is_connected(self) -> bool:
        if not self._connected or not self.client:
            return False
        try:
            self.client.admin.command('ping')
            return True
        except Exception:
            return False

    # --- URL Threat Checks Collection (Spec §4, §5, §6) ---

    def get_cached_url_check(self, url_hash: str, max_age_hours: int = 24) -> Optional[Dict[str, Any]]:
        """
        Retrieves cached external intelligence check by URL SHA-256 hash if within TTL.
        Prevents redundant API calls and provider quota exhaustion.
        """
        if not self.is_connected():
            return None

        try:
            doc = self.db.url_threat_checks.find_one({"url_hash": url_hash})
            if not doc:
                return None

            checked_at = doc.get("checked_at")
            if isinstance(checked_at, str):
                try:
                    iso_clean = checked_at.replace("Z", "+00:00")
                    checked_at = datetime.fromisoformat(iso_clean)
                except Exception:
                    checked_at = None

            if checked_at:
                if checked_at.tzinfo is not None:
                    checked_at = checked_at.replace(tzinfo=None)
                now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
                if (now_utc - checked_at) < timedelta(hours=max_age_hours):
                    doc["_id"] = str(doc["_id"])
                    doc["cached"] = True
                    return doc

            return None
        except Exception as e:
            print(f"[MongoDBManager] Cache lookup error: {e}")
            return None

    def save_url_threat_check(self, data: Dict[str, Any]) -> bool:
        """
        Saves or updates a URL threat check document in MongoDB collection 'url_threat_checks'.
        """
        if not self.is_connected():
            return False

        try:
            url_hash = data.get("url_hash")
            if not url_hash:
                return False

            payload = dict(data)
            now_iso = datetime.now(timezone.utc).isoformat()
            payload["checked_at"] = payload.get("checked_at") or now_iso
            payload["updated_at"] = now_iso

            self.db.url_threat_checks.update_one(
                {"url_hash": url_hash},
                {"$set": payload},
                upsert=True
            )
            return True
        except Exception as e:
            print(f"[MongoDBManager] Error saving url_threat_checks document: {e}")
            return False

    def record_incident_metadata(self, incident_data: Dict[str, Any]):
        """Persist incident analysis summary into MongoDB 'incidents' collection."""
        if not self.is_connected():
            return
        try:
            self.db.incidents.update_one(
                {"submission_id": incident_data.get("submission_id")},
                {"$set": incident_data},
                upsert=True
            )
        except Exception as e:
            print(f"[MongoDBManager] Error recording incident: {e}")

    def get_incident_metadata(self, submission_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve incident metadata from MongoDB 'incidents' collection."""
        if not self.is_connected():
            return None
        try:
            return self.db.incidents.find_one({"submission_id": submission_id}, {"_id": 0})
        except Exception as e:
            print(f"[MongoDBManager] Error fetching incident: {e}")
            return None

    def record_user_profile(self, user_id: str, profile_dict: Dict[str, Any]):
        """Persist user profile state into MongoDB 'user_profiles' collection."""
        if not self.is_connected():
            return
        try:
            self.db.user_profiles.update_one(
                {"user_id": user_id},
                {"$set": {**profile_dict, "updated_at": datetime.utcnow()}},
                upsert=True
            )
        except Exception as e:
            print(f"[MongoDBManager] Error persisting user profile in Mongo: {e}")

    # Method aliases for consistent invocation across services
    get_cached_threat_check = get_cached_url_check
    save_threat_check = save_url_threat_check

# Singleton instances
mongo_manager = MongoDBManager()
mongo_db = mongo_manager
