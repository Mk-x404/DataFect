import time
import uuid
import threading
from typing import Dict, Optional, Tuple
import pandas as pd

class SessionStore:
    """
    Thread-safe, ephemeral in-memory session store for uploaded datasets.
    Provides complete multi-tenant data isolation by assigning a cryptographically
    unique UUID4 session_id to each upload and binding it to the authenticated user's ID.

    Includes automatic TTL cleanup (pruning datasets inactive for > 1 hour)
    and an intelligent backward-compatible fallback to ensure existing tests
    and single-user workflows continue seamlessly.
    """
    def __init__(self, ttl_seconds: int = 3600):
        # Store mapping: session_id -> (DataFrame, owner_user_id, last_accessed_timestamp)
        self._store: Dict[str, Tuple[pd.DataFrame, Optional[int], float]] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds
        self._latest_session_id: Optional[str] = None

    def set(self, df: pd.DataFrame, owner_id: Optional[int] = None) -> str:
        """Stores a DataFrame bound to the owner_id and returns a unique session_id."""
        with self._lock:
            self._cleanup_locked()
            session_id = str(uuid.uuid4())
            # Store a copy to avoid external mutation
            self._store[session_id] = (df.copy(), owner_id, time.time())
            self._latest_session_id = session_id
            return session_id

    def get(self, session_id: Optional[str] = None, caller_id: Optional[int] = None) -> Optional[pd.DataFrame]:
        """
        Retrieves the isolated DataFrame for the given session_id.
        Strictly enforces tenant ownership:
        - If session has an owner_id, caller_id MUST match owner_id.
        - If caller_id does not match, access is strictly denied (IDOR prevention).
        - If session_id is None, only permits fallback if caller owns the latest session.
        """
        with self._lock:
            target_id = session_id or self._latest_session_id
            if not target_id or target_id not in self._store:
                return None

            df, owner_id, ts = self._store[target_id]

            # Enforce zero-trust ownership:
            # If the session has an owner, caller MUST provide matching identity
            if owner_id is not None:
                if caller_id is None or caller_id != owner_id:
                    return None

            # If caller is authenticated, verify they don't get someone else's unowned/fallback session
            if caller_id is not None and owner_id is None:
                # Disallow accessing unowned data if caller identity is present
                return None

            if time.time() - ts > self._ttl:
                del self._store[target_id]
                if self._latest_session_id == target_id:
                    self._latest_session_id = None
                return None

            # Refresh last-accessed timestamp
            self._store[target_id] = (df, owner_id, time.time())
            return df

    def get_latest(self) -> Optional[pd.DataFrame]:
        """Explicit backward-compatible fallback for callers without session_id."""
        return self.get(None)

    def _cleanup_locked(self):
        """Internal cleanup of expired sessions."""
        now = time.time()
        expired = [k for k, (_, _, ts) in self._store.items() if now - ts > self._ttl]
        for k in expired:
            del self._store[k]
        if self._latest_session_id and self._latest_session_id not in self._store:
            # Pick the most recent remaining session if any
            if self._store:
                self._latest_session_id = max(self._store.keys(), key=lambda k: self._store[k][2])
            else:
                self._latest_session_id = None

    def clear(self):
        """Clear all active sessions (useful for tests)."""
        with self._lock:
            self._store.clear()
            self._latest_session_id = None

# Global thread-safe session store instance
session_store = SessionStore()
