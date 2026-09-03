import os
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logger = logging.getLogger("datafect-security")

class StructuredLogger:
    """
    Structured JSON logger for Zero-Trust observability.
    Emits machine-parsable JSON events containing correlation IDs,
    client IP, authenticated user identity, and action metadata.
    Automatically scrubs and redacts sensitive parameters.
    """
    SENSITIVE_KEYS = {"password", "token", "secret", "api_key", "authorization", "cookie"}

    @classmethod
    def _sanitize(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return {
                k: "[REDACTED]" if any(s in k.lower() for s in cls.SENSITIVE_KEYS) else cls._sanitize(v)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [cls._sanitize(x) for x in data]
        return data

    @classmethod
    def log(
        cls,
        level: str,
        event: str,
        request_id: Optional[str] = None,
        user_id: Optional[int] = None,
        client_ip: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": level.upper(),
            "event": event,
            "request_id": request_id,
            "user_id": user_id,
            "client_ip": client_ip,
            "metadata": cls._sanitize(details or {})
        }
        json_str = json.dumps(entry)
        if level.upper() in ("ERROR", "CRITICAL"):
            logger.error(json_str)
        elif level.upper() == "WARNING":
            logger.warning(json_str)
        else:
            logger.info(json_str)
