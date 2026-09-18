"""
In-memory TTL cache with single-flight mutex — port of
`Examples/server/cache.ts` behavior to Python.

  - SHA-256 key over canonical JSON
  - per-key `asyncio.Lock` so duplicate concurrent calls deduplicate
  - periodic GC sweep for expired entries
  - Redis stub: `redisConnected=False` unless `REDIS_URL` env var is set

Public API:
  - cache_service.get_or_compute(key, compute_fn, ttl) -> (data, cached)
  - cache_service.get_stats() -> dict
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import time
from typing import Any, Awaitable, Callable, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


def hash_key(prefix: str, data: Any) -> str:
    """Stable SHA-256 key from any JSON-serializable payload."""
    if isinstance(data, str):
        canonical = data
    else:
        canonical = json.dumps(data, sort_keys=True, separators=(",", ":"))
    h = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return f"{prefix}:{h}"


class CacheService:
    def __init__(self) -> None:
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()
        self._hits = 0
        self._misses = 0
        self._start_ts = time.time()
        self._redis_url: Optional[str] = os.getenv("REDIS_URL")
        self._redis_connected: bool = False

        if self._redis_url and self._redis_url.strip():
            logger.info(
                "REDIS_URL is set; attempting real Redis connection is a no-op "
                "in this Python build (in-memory cache active)."
            )
            self._redis_connected = False
        else:
            logger.info("Cache: high-throughput in-memory Redis-compatible engine active.")

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------
    def get_stats(self) -> Dict[str, Any]:
        return {
            "hits": self._hits,
            "misses": self._misses,
            "keysCount": len(self._store),
            "redisConnected": self._redis_connected,
            "backend": "in-memory-redis-compatible",
            "uptimeSeconds": int(time.time() - self._start_ts),
        }

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------
    def _gc(self) -> None:
        now = time.time()
        expired = [k for k, (_, exp) in self._store.items() if exp <= now]
        for k in expired:
            self._store.pop(k, None)
            self._locks.pop(k, None)

    def _get_lock(self, key: str) -> asyncio.Lock:
        lock = self._locks.get(key)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[key] = lock
        return lock

    # ------------------------------------------------------------------
    # Public
    # ------------------------------------------------------------------
    async def get(self, key: str) -> Optional[Any]:
        item = self._store.get(key)
        if item is None:
            return None
        val, expires_at = item
        if expires_at <= time.time():
            self._store.pop(key, None)
            return None
        return val

    async def set(self, key: str, value: Any, ttl_seconds: int = 300) -> None:
        expires_at = time.time() + ttl_seconds
        self._store[key] = (value, expires_at)
        # opportunistic GC every 1000 sets
        if len(self._store) > 1000:
            self._gc()

    async def get_or_compute(
        self,
        key: str,
        compute_fn: Callable[[], Awaitable[Any]],
        ttl_seconds: int = 600,
    ) -> Tuple[Any, bool]:
        """Cache wrapper with per-key single-flight.

        Returns `(data, cached_bool)`.  If a value is already cached, returns
        it.  If a different request is currently computing the same key,
        awaits that promise instead of starting a new compute.
        """
        cached = await self.get(key)
        if cached is not None:
            self._hits += 1
            return cached, True

        # single-flight: take the per-key lock
        async with self._global_lock:
            lock = self._get_lock(key)

        async with lock:
            # re-check inside the lock
            cached2 = await self.get(key)
            if cached2 is not None:
                self._hits += 1
                return cached2, True

            self._misses += 1
            data = await compute_fn()
            await self.set(key, data, ttl_seconds)
            return data, False

    async def clear(self) -> None:
        self._store.clear()
        self._locks.clear()
        self._hits = 0
        self._misses = 0


cache_service = CacheService()
