"""
End-to-end contract smoke test for the new `/api/*` endpoints.

Validates that the Python backend mirrors the React frontend's TypeScript
contract (`Examples/src/types/energy.ts`) field-for-field.

Requires the FastAPI server to be running on http://127.0.0.1:8000.

  python tests/contract_smoke.py        # uses default BASE_URL
  BASE_URL=http://localhost:9000 python tests/contract_smoke.py
"""

from __future__ import annotations

import json
import os
import sys
import time

import requests

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")

EXPECTED_TOTALS_FIELDS = sorted([
    "baselineCost",
    "optimizedCost",
    "savingsAmount",
    "savingsPercent",
    "baselinePeakGridKw",
    "optimizedPeakGridKw",
    "peakReductionKw",
    "peakReductionPercent",
    "totalSolarGeneratedKwh",
    "totalSolarUsedKwh",
    "totalBatteryThroughputKwh",
    "totalGeneratorOutputKwh",
    "gridEnergyCost",
    "generatorFuelCost",
    "batteryDegradationCost",
    "peakDemandChargeCost",
])

EXPECTED_HOURLY_FIELDS = sorted([
    "hour",
    "timeLabel",
    "gridPrice",
    "campusDemandKw",
    "solarForecastKw",
    "solarUsedKw",
    "solarCurtailedKw",
    "gridImportKw",
    "batteryChargeKw",
    "batteryDischargeKw",
    "batterySocPercent",
    "generatorKw",
    "netCost",
])


def _hdr(label: str) -> None:
    print()
    print("=" * 70)
    print(f"  {label}")
    print("=" * 70)


def _ok(msg: str) -> None:
    print(f"  ✓  {msg}")


def _fail(msg: str) -> None:
    print(f"  ✗  {msg}")
    sys.exit(1)


def main() -> None:
    session = requests.Session()
    session.headers["Content-Type"] = "application/json"

    # 1) Health -----------------------------------------------------------
    _hdr("1. GET /api/health")
    r = session.get(f"{BASE_URL}/api/health", timeout=10)
    assert r.status_code == 200, f"status={r.status_code} body={r.text}"
    body = r.json()
    assert body["status"] == "healthy", f"status={body['status']}"
    assert "cache" in body, "missing cache block"
    assert body["cache"]["backend"].startswith("in-memory"), body["cache"]
    assert body["maxExecutionGuaranteeSeconds"] == 30, body["maxExecutionGuaranteeSeconds"]
    _ok(f"healthy + cache stats present (hits={body['cache']['hits']} misses={body['cache']['misses']})")

    # 2) Default scenario -------------------------------------------------
    _hdr("2. GET /api/scenarios/default")
    r = session.get(f"{BASE_URL}/api/scenarios/default", timeout=10)
    assert r.status_code == 200, f"status={r.status_code} body={r.text}"
    body = r.json()
    assert body["success"] is True
    scen = body["scenario"]
    assert scen["scenarioId"] == "campus-central-24h", scen["scenarioId"]
    assert scen["battery"]["capacityKwh"] == 2000
    assert scen["generator"]["maxPowerKw"] == 600
    assert scen["grid"]["maxImportKw"] == 1500
    assert scen["grid"]["peakDemandChargeRate"] == 12.50
    assert len(scen["hourly"]) == 24
    assert len(body["defaultNotes"]) >= 3
    _ok(f"canonical scenario + {len(body['defaultNotes'])} default notes returned")

    # 3) Optimize happy path ---------------------------------------------
    _hdr("3. POST /api/optimize (3 preset notes)")
    payload = {
        "operatorNotes": body["defaultNotes"],
    }
    t0 = time.time()
    r = session.post(f"{BASE_URL}/api/optimize", data=json.dumps(payload), timeout=60)
    elapsed_ms = int((time.time() - t0) * 1000)
    assert r.status_code == 200, f"status={r.status_code} body={r.text}"
    resp = r.json()
    assert resp["success"] is True
    assert resp["data"] is not None, resp
    data = resp["data"]
    assert len(data["hourlyPlan"]) == 24, f"hourlyPlan length={len(data['hourlyPlan'])}"
    assert data["totals"]["optimizedCost"] > 0
    assert data["totals"]["baselineCost"] > 0
    assert len(data["directivesApplied"]) >= 3, f"applied={len(data['directivesApplied'])}"
    assert data["solverStatus"] in ("OPTIMAL", "SUBOPTIMAL", "FEASIBLE")
    assert resp["meta"]["responseTimeMs"] < 30_000
    _ok(
        f"OPTIMAL={data['solverStatus']} cost=${data['totals']['optimizedCost']:.2f} "
        f"savings={data['totals']['savingsPercent']:.1f}% wall={elapsed_ms}ms"
    )

    # 4) Field-name parity -----------------------------------------------
    _hdr("4. Field-name parity (16 totals + 13 hourly fields)")
    got_totals = sorted(data["totals"].keys())
    got_hourly = sorted(data["hourlyPlan"][0].keys())
    assert got_totals == EXPECTED_TOTALS_FIELDS, f"got {got_totals}"
    assert got_hourly == EXPECTED_HOURLY_FIELDS, f"got {got_hourly}"
    _ok("all 16 totals + 13 hourly field names match TS contract exactly")

    # 5) Cache hit -------------------------------------------------------
    _hdr("5. Cache hit on identical POST")
    r2 = session.post(f"{BASE_URL}/api/optimize", data=json.dumps(payload), timeout=60)
    assert r2.status_code == 200, r2.text
    resp2 = r2.json()
    assert resp2["meta"]["cached"] is True, f"meta={resp2['meta']}"
    assert resp2["data"]["cacheStatus"] == "HIT"
    _ok(f"cache HIT (responseTime={resp2['meta']['responseTimeMs']}ms)")

    # 6) Benchmark -------------------------------------------------------
    _hdr("6. POST /api/benchmark {concurrency: 8}")
    r3 = session.post(
        f"{BASE_URL}/api/benchmark",
        data=json.dumps({"concurrency": 8}),
        timeout=60,
    )
    assert r3.status_code == 200, r3.text
    bench = r3.json()
    assert bench["success"] is True
    assert bench["concurrencyCount"] == 8
    assert bench["averageLatencyMs"] >= 0
    assert len(bench["individualLatencies"]) == 8
    _ok(
        f"avg={bench['averageLatencyMs']}ms total={bench['totalElapsedMs']}ms "
        f"hitRate={bench['cacheHitRate']}"
    )

    # 7) Edge case: empty notes ------------------------------------------
    _hdr("7. POST /api/optimize (empty operatorNotes)")
    r4 = session.post(
        f"{BASE_URL}/api/optimize",
        data=json.dumps({"operatorNotes": []}),
        timeout=60,
    )
    assert r4.status_code == 200, r4.text
    resp4 = r4.json()
    assert resp4["success"] is True
    assert len(resp4["data"]["directivesApplied"]) == 0
    assert len(resp4["data"]["hourlyPlan"]) == 24
    _ok("empty notes → 0 directives, 24h plan returned")

    # 8) Edge case: garbage note → validation recovery -------------------
    _hdr("8. POST /api/optimize (garbage note)")
    r5 = session.post(
        f"{BASE_URL}/api/optimize",
        data=json.dumps({"operatorNotes": ["☃ random nonsense ☃"]}),
        timeout=60,
    )
    assert r5.status_code == 200, r5.text
    resp5 = r5.json()
    assert resp5["success"] is True
    # Heuristic fallback always returns ≥1 directive (with default GRID_IMPORT_CAP)
    assert len(resp5["data"]["directivesApplied"]) >= 1
    _ok(f"garbage → {len(resp5['data']['directivesApplied'])} fallback directive(s)")

    # 9) Redis stats -----------------------------------------------------
    _hdr("9. GET /api/redis-stats")
    r6 = session.get(f"{BASE_URL}/api/redis-stats", timeout=5)
    assert r6.status_code == 200, r6.text
    stats = r6.json()
    assert "hits" in stats and "misses" in stats and "keysCount" in stats
    _ok(f"hits={stats['hits']} misses={stats['misses']} keys={stats['keysCount']}")

    print()
    print("=" * 70)
    print("  ✅  All 9 contract checks passed.")
    print("=" * 70)


if __name__ == "__main__":
    main()
