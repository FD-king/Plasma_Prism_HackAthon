"""
Concurrent benchmark driver — port of the `/api/benchmark` handler from
`Examples/server.ts`.  Fires N=concurrency*4 simultaneous `/optimize` calls
through the cache layer to measure throughput under Redis-style deduplication.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List

from .cache import cache_service, hash_key
from .llm_extractor import extract_and_validate_directives
from .milp_solver import solve_microgrid_milp


async def _one_optimize(scenario: Dict[str, Any], notes: List[str], idx: int) -> Dict[str, Any]:
    t0 = time.time()
    cache_key = hash_key("opt:v1", {"scenario": scenario, "notes": notes})

    async def compute():
        directives = await asyncio.to_thread(extract_and_validate_directives, notes, scenario)
        result = await asyncio.to_thread(solve_microgrid_milp, scenario, directives)
        return result

    data, cached = await cache_service.get_or_compute(cache_key, compute, ttl_seconds=600)
    duration_ms = int((time.time() - t0) * 1000)
    return {
        "index": idx,
        "durationMs": duration_ms,
        "cached": cached,
        "savingsPercent": float(data.get("totals", {}).get("savingsPercent", 0.0)),
    }


async def run_benchmark(concurrency: int, scenario: Dict[str, Any], notes: List[str]) -> Dict[str, Any]:
    concurrency = max(2, min(50, concurrency))
    start = time.time()
    tasks = [_one_optimize(scenario, notes, i + 1) for i in range(concurrency)]
    results = await asyncio.gather(*tasks)
    total_ms = int((time.time() - start) * 1000)
    avg_ms = int(sum(r["durationMs"] for r in results) / max(1, len(results)))
    hits = sum(1 for r in results if r["cached"])
    hit_rate_pct = round((hits / max(1, len(results))) * 100)
    return {
        "success": True,
        "concurrencyCount": concurrency,
        "totalElapsedMs": total_ms,
        "averageLatencyMs": avg_ms,
        "cacheHitRate": f"{hit_rate_pct}%",
        "individualLatencies": results,
    }
