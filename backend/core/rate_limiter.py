import time
import os
import threading
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException

class RateLimiter:
    """
    In-memory sliding-window rate limiter.
    Protects CPU-heavy compute routes and paid Google Gemini LLM API quotas
    from automated abuse, runaway scripts, and Denial-of-Wallet attacks.

    Features:
    - IP-keyed tracking with automatic timestamp eviction.
    - Generous limits for normal human interactive EDA workflows.
    - Local development bypass (whitelisting 127.0.0.1 and localhost)
      unless explicitly enabled for security testing.
    """
    def __init__(self, requests_limit: int, window_seconds: int = 60, bypass_loopback_in_dev: bool = True):
        self.limit = requests_limit
        self.window = window_seconds
        self.bypass_loopback_in_dev = bypass_loopback_in_dev
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = threading.Lock()

    async def __call__(self, request: Request):
        # Allow disabling loopback bypass when running automated security tests
        enforce_all = os.environ.get("ENFORCE_RATE_LIMITS", "false").lower() in ("1", "true", "yes")

        client_ip = request.client.host if request.client else "unknown"

        # In dev mode, don't throttle local developer workflows unless explicitly testing
        if self.bypass_loopback_in_dev and not enforce_all:
            if client_ip in ("127.0.0.1", "::1", "localhost", "testclient"):
                return

        now = time.time()
        with self._lock:
            # Evict timestamps older than the sliding window
            timestamps = self._requests[client_ip]
            valid_timestamps = [ts for ts in timestamps if now - ts < self.window]
            
            if len(valid_timestamps) >= self.limit:
                retry_after = int(self.window - (now - valid_timestamps[0])) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Rate limit exceeded ({self.limit} requests per {self.window}s). Please wait before retrying.",
                    headers={"Retry-After": str(max(1, retry_after))}
                )

            valid_timestamps.append(now)
            self._requests[client_ip] = valid_timestamps

# Rate limiter instances configured with generous human limits
# 30 uploads per minute per IP (ample for rapid EDA experiments)
upload_rate_limiter = RateLimiter(requests_limit=30, window_seconds=60)

# 30 narrative story generation calls per minute per IP
narrate_rate_limiter = RateLimiter(requests_limit=30, window_seconds=60)

# 60 chat queries per minute per IP (1 query per second)
chat_rate_limiter = RateLimiter(requests_limit=60, window_seconds=60)
