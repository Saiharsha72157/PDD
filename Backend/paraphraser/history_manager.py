# Backend/paraphraser/history_manager.py

import os
import json
import uuid
import datetime
import threading
from typing import List, Dict, Any, Optional

# ── Default storage path ─────────────────────────────────────────────────────
# Resolved relative to this file so the path works on any OS / cloud server.
_DEFAULT_HISTORY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "history.json",
)

# ── Module-level file lock — ensures thread-safe writes under uvicorn workers ─
_history_lock = threading.Lock()


class HistoryManager:
    """
    Manages paraphrasing history and favorites.
    Uses JSON-based local persistence with full thread safety.
    Structurally prepared for PostgreSQL/SQLAlchemy migration.
    """

    def __init__(self, filepath: str = _DEFAULT_HISTORY_PATH):
        self.filepath = filepath
        self._ensure_file_exists()

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _ensure_file_exists(self) -> None:
        if not os.path.exists(self.filepath):
            with _history_lock:
                # Double-checked locking
                if not os.path.exists(self.filepath):
                    with open(self.filepath, "w", encoding="utf-8") as f:
                        json.dump([], f)

    def _load_data(self) -> List[Dict[str, Any]]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[HistoryManager] Error loading history: {e}")
            return []

    def _save_data(self, data: List[Dict[str, Any]]) -> bool:
        try:
            with _history_lock:
                with open(self.filepath, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4)
            return True
        except Exception as e:
            print(f"[HistoryManager] Error saving history: {e}")
            return False

    # ── Public API ───────────────────────────────────────────────────────────

    def save_history(
        self,
        user_id: str,
        original_text: str,
        paraphrased_text: str,
        mode: str,
        score: float,
    ) -> Dict[str, Any]:
        """Saves a new paraphrasing record to local persistent storage."""
        data = self._load_data()
        entry = {
            "id":               uuid.uuid4().hex,
            "user_id":          user_id,
            "timestamp":        datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "original_text":    original_text.strip(),
            "paraphrased_text": paraphrased_text.strip(),
            "mode":             mode.lower().strip(),
            "score":            round(score, 1),
            "favorite":         False,
        }
        data.append(entry)
        self._save_data(data)
        return entry

    def get_history(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves history records sorted by timestamp descending, optionally filtered by user_id."""
        data = self._load_data()
        if user_id:
            data = [x for x in data if x.get("user_id") == user_id]
        return sorted(data, key=lambda x: x.get("timestamp", ""), reverse=True)

    def delete_history(self, entry_id: str) -> bool:
        """Deletes a history record by unique identifier."""
        data = self._load_data()
        filtered = [x for x in data if x.get("id") != entry_id]
        if len(filtered) < len(data):
            self._save_data(filtered)
            return True
        return False

    def toggle_favorite(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Toggles the favorite state of a history entry by unique identifier."""
        data = self._load_data()
        updated_entry = None
        for x in data:
            if x.get("id") == entry_id:
                x["favorite"] = not x.get("favorite", False)
                updated_entry = x
                break
        if updated_entry:
            self._save_data(data)
            return updated_entry
        return None

    def favorite_history(self, entry_id: str) -> bool:
        """Sets the favorite status of a history entry to True."""
        data = self._load_data()
        found = False
        for x in data:
            if x.get("id") == entry_id:
                x["favorite"] = True
                found = True
                break
        if found:
            self._save_data(data)
        return found

    def unfavorite_history(self, entry_id: str) -> bool:
        """Sets the favorite status of a history entry to False."""
        data = self._load_data()
        found = False
        for x in data:
            if x.get("id") == entry_id:
                x["favorite"] = False
                found = True
                break
        if found:
            self._save_data(data)
        return found

    def get_favorites(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves all starred favorite records sorted by timestamp descending."""
        data = self._load_data()
        favorites = [x for x in data if x.get("favorite", False)]
        if user_id:
            favorites = [x for x in favorites if x.get("user_id") == user_id]
        return sorted(favorites, key=lambda x: x.get("timestamp", ""), reverse=True)


# =====================================================================
# FUTURE-READY ARCHITECTURE FOR POSTGRESQL & ENTERPRISE CLOUD MIGRATION
# =====================================================================
"""
When migrating to PostgreSQL, replace HistoryManager._load_data() and
._save_data() with the SQLAlchemy session-based equivalents below.

--- PostgreSQL SQL DDL Schema ---

CREATE TABLE paraphrase_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    original_text TEXT NOT NULL,
    paraphrased_text TEXT NOT NULL,
    mode VARCHAR(50) NOT NULL,
    score NUMERIC(3, 1) NOT NULL,
    favorite BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paraphrase_history_user      ON paraphrase_history(user_id);
CREATE INDEX idx_paraphrase_history_timestamp ON paraphrase_history(timestamp DESC);
CREATE INDEX idx_paraphrase_history_favorite  ON paraphrase_history(user_id) WHERE favorite = TRUE;
"""
