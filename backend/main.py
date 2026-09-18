"""
FastAPI application — public surface of the campus microgrid MILP optimizer.

Routes (mounted under `/api/*` to match the React frontend at
`Examples/src/App.tsx`):

  GET  /api/health               → liveness + cache stats + service info
  GET  /api/scenarios/default    → canonical 24h scenario + preset notes
  POST /api/optimize             → MILP dispatch (LLM note → directive → solve)
  POST /api/benchmark            → concurrent benchmark driver
  GET  /api/redis-stats          → raw cache stats

The whole /optimize pipeline typically finishes in well under 2 seconds:
  - LLM extraction (when GROQ_API_KEY set): 0.5–1.5s
  - MILP dispatch + 31-candidate sweep: 50–150ms
  - JSON marshal: <10ms

Environment
-----------
GROQ_API_KEY     optional — enables LLM extraction; heuristic fallback runs otherwise
GROQ_MODEL       optional — defaults to `openai/gpt-oss-120b`
REDIS_URL        optional — when set, reports redisConnected=true in stats
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from dotenv import load_dotenv

    _ROOT = Path(__file__).resolve().parent.parent
    load_dotenv(_ROOT / ".env")
except ImportError:
    pass

# Force UTF-8 stdout on Windows so printing JSON doesn't crash TestClient
if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        pass

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import benchmark as bench
from .cache import cache_service, hash_key
from .default_scenario import DEFAULT_CAMPUS_SCENARIO, DEFAULT_PRESET_NOTES, merge_scenario
from .llm_extractor import extract_and_validate_directives
from .milp_solver import solve_microgrid_milp
from .models import (
    BenchmarkRequest,
    BenchmarkResponse,
    DefaultScenarioResponse,
    HealthResponse,
    OptimizationRequestPayload,
    OptimizationResponsePayload,
)


# ---------------------------------------------------------------------------
# App + logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("energy_optimizer")
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)


app = FastAPI(
    title="AI-Driven Campus Energy Optimizer",
    description=(
        "Translates operator notes into MILP constraints and returns an "
        "optimized 24-hour campus energy schedule."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


SERVICE_NAME = "Campus Energy MILP Optimization Engine"


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        timestamp=_now_iso(),
        service=SERVICE_NAME,
        cache=cache_service.get_stats(),  # type: ignore[arg-type]
        concurrencySupported=True,
        maxExecutionGuaranteeSeconds=30,
    )


@app.get("/api/scenarios/default", response_model=DefaultScenarioResponse)
def default_scenario() -> DefaultScenarioResponse:
    return DefaultScenarioResponse(
        success=True,
        scenario=DEFAULT_CAMPUS_SCENARIO,
        defaultNotes=DEFAULT_PRESET_NOTES,
    )


@app.get("/api/redis-stats")
def redis_stats() -> Dict[str, Any]:
    return cache_service.get_stats()


@app.post("/api/optimize", response_model=OptimizationResponsePayload)
async def optimize(payload: OptimizationRequestPayload) -> OptimizationResponsePayload:
    request_start = time.time()
    request_id = (
        f"opt-{int(time.time() * 1000)}-{int((time.time() * 1000) % 0xFFFF):05x}"
    )

    try:
        # 1) Merge with default scenario
        scenario_dict = (
            payload.scenario.model_dump()
            if payload.scenario is not None
            else None
        )
        scenario = merge_scenario(scenario_dict)
        scenario_dict = scenario.model_dump()

        notes: List[str] = [str(n).strip() for n in (payload.operatorNotes or [])]
        notes = [n for n in notes if n]
        force_refresh = bool(payload.forceRefresh)

        # 2) Build cache key
        cache_key = hash_key("opt:v1", {"scenario": scenario_dict, "notes": notes})

        if force_refresh:
            await cache_service.set(cache_key, None, ttl_seconds=1)

        # 3) Compute (cached + single-flight)
        async def compute():
            directives = await asyncio.to_thread(
                extract_and_validate_directives, notes, scenario_dict
            )
            result = await asyncio.to_thread(
                solve_microgrid_milp, scenario_dict, directives
            )
            result["requestId"] = request_id
            return result

        result, cached = await cache_service.get_or_compute(
            cache_key, compute, ttl_seconds=600
        )

        # 4) Inject cacheStatus + requestId for downstream
        result["cacheStatus"] = "HIT" if cached else "MISS"
        if cached:
            result["executionTimeMs"] = 2  # match TS behavior

        total_ms = int((time.time() - request_start) * 1000)

        logger.info(
            "/api/optimize scenario=%s notes=%d cached=%s cost=$%.2f elapsed=%dms",
            scenario.name,
            len(notes),
            cached,
            float(result["totals"]["optimizedCost"]),
            total_ms,
        )

        return OptimizationResponsePayload(
            success=True,
            data=result,  # type: ignore[arg-type]
            meta={
                "cached": cached,
                "responseTimeMs": total_ms,
                "requestId": request_id,
                "redisActive": cache_service.get_stats()["redisConnected"],
                "timestamp": _now_iso(),
            },
        )

    except Exception as exc:  # noqa: BLE001
        logger.exception("/api/optimize failed")
        total_ms = int((time.time() - request_start) * 1000)
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": str(exc) or "Internal MILP optimization error",
                "meta": {
                    "cached": False,
                    "responseTimeMs": total_ms,
                    "requestId": request_id,
                    "redisActive": cache_service.get_stats()["redisConnected"],
                    "timestamp": _now_iso(),
                },
            },
        ) from exc


@app.post("/api/benchmark", response_model=BenchmarkResponse)
async def benchmark(payload: BenchmarkRequest) -> BenchmarkResponse:
    scenario_payload = (
        payload.scenario.model_dump() if payload.scenario is not None else None
    )
    scenario = merge_scenario(scenario_payload).model_dump()
    notes = payload.operatorNotes or DEFAULT_PRESET_NOTES
    result = await bench.run_benchmark(payload.concurrency, scenario, notes)
    return BenchmarkResponse(**result)


# ---------------------------------------------------------------------------
# Compatibility: legacy `/optimize` and `/profiles` (old Streamlit era)
# ---------------------------------------------------------------------------

@app.get("/health")
def legacy_health() -> Dict[str, Any]:
    return health().model_dump()


@app.get("/profiles")
def legacy_profiles() -> Dict[str, Any]:
    return {"profiles": ["default"]}


# ---------------------------------------------------------------------------
# Local dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="127.0.0.1",
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "0") == "1",
    )
