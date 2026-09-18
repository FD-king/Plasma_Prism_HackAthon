"""Manually exercise every frontend -> backend code path that the React UI hits."""
from __future__ import annotations

import json
import os
import sys
import time
import requests

BASE = os.getenv("BASE_URL", "http://127.0.0.1:8000")

PRESETS = [
    "Storm alert: maintain battery storage above 60% after 17:00 as backup reserve.",
    "Quiet hours: do not run diesel backup generator between 22:00 and 06:00.",
    "Peak demand avoidance: cap grid import to 850 kW between 14:00 and 19:00.",
]


def banner(s):
    print()
    print("=" * 72)
    print(s)
    print("=" * 72)


def show(label, r):
    print(f"\n>>> {label}  [HTTP {r.status_code}, {len(r.content)}B, {r.elapsed.total_seconds() * 1000:.0f}ms]")
    if not r.ok:
        print("  ! error body:", r.text[:300])
        return
    body = r.json()
    if isinstance(body, dict) and "success" in body:
        print("  success:", body.get("success"))
        print("  meta:", body.get("meta"))
        if body.get("data"):
            d = body["data"]
            print("  solver:", d.get("solverStatus"))
            print("  cacheStatus:", d.get("cacheStatus"))
            print("  executionTimeMs:", d.get("executionTimeMs"))
            print("  totals:", {k: round(v, 2) if isinstance(v, (int, float)) else v for k, v in d["totals"].items()})
            print("  directivesApplied:", len(d["directivesApplied"]))
            for x in d["directivesApplied"]:
                print(f"    - {x['directiveType']} h={x['startHour']:02d}-{x['endHour']:02d} val={x['value']} unit={x['unit']} valid={x['isValid']}")
            print("  hourlyPlan rows:", len(d["hourlyPlan"]))
            print("  hourlyPlan[0]:", d["hourlyPlan"][0])
            print("  hourlyPlan[18] (peak):", d["hourlyPlan"][18])
    else:
        print("  raw:", json.dumps(body)[:400])


def main():
    s = requests.Session()

    # 1. GET /api/health  (used by App.tsx on mount, Header pill)
    banner("1. GET /api/health  [App.tsx mount + Header pill]")
    show("first call", s.get(f"{BASE}/api/health"))

    # 2. GET /api/scenarios/default
    banner("2. GET /api/scenarios/default  [backend canonical scenario]")
    show("default scenario", s.get(f"{BASE}/api/scenarios/default"))

    # 3. POST /api/optimize — initial mount
    banner("3. POST /api/optimize  [App.tsx initial mount with 3 presets]")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": PRESETS})
    show("initial solve (forceRefresh=false)", r)

    # 4. POST /api/optimize — same call again -> should HIT cache
    banner("4. POST /api/optimize  [same payload => should be HIT]")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": PRESETS})
    show("cached repeat", r)
    assert r.json()["data"]["cacheStatus"] == "HIT", "expected HIT"
    assert r.json()["meta"]["cached"] is True, "expected cached=true"

    # 5. POST /api/optimize — forceRefresh=true (the Refresh button)
    banner("5. POST /api/optimize forceRefresh=true  [the Refresh button]")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": PRESETS, "forceRefresh": True})
    show("forceRefresh", r)

    # 6. POST /api/optimize — empty notes (FilterBar dataMode switch scenario)
    banner("6. POST /api/optimize empty notes  [edge case]")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": []})
    show("empty notes", r)

    # 7. POST /api/optimize — garbage single note (LLM + heuristic path)
    banner("7. POST /api/optimize garbage note  [heuristic fallback]")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": ["asdfghjkl nonsense qwerty ☃"]})
    show("garbage note", r)

    # 8. POST /api/optimize — every directive type manually
    banner("8. POST /api/optimize custom directives (all 8 types)")
    custom = [
        "Maintain battery above 80% after 16:00",
        "Limit charge to 200 kW from 10:00 to 14:00",
        "No battery operation between 23:00 and 04:00",
        "Mandatory generator run at 200 kW from 18:00 to 21:00",
        "Cap grid import to 600 kW between 15:00 and 20:00",
        "Curtail 100 kW load between 17:00 and 19:00",
    ]
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": custom, "forceRefresh": True})
    show("all-types custom", r)

    # 9. POST /api/optimize — custom scenario override (frontend sends scenario too)
    banner("9. POST /api/optimize custom scenario  [partial override]")
    custom_scenario = {
        "battery": {"capacityKwh": 1500, "initialSocPercent": 30, "maxSocPercent": 90},
        "name": "Custom scenario override",
    }
    r = s.post(f"{BASE}/api/optimize", json={"scenario": custom_scenario, "operatorNotes": PRESETS, "forceRefresh": True})
    show("custom scenario", r)

    # 10. POST /api/benchmark with various concurrency values (slider 2..50)
    banner("10. POST /api/benchmark  [slider, every concurrency step]")
    for c in (2, 4, 8, 10, 16, 32, 50):
        r = s.post(f"{BASE}/api/benchmark", json={"concurrency": c})
        body = r.json()
        assert body["success"], body
        print(f"  concurrency={c:>2}  HTTP {r.status_code}  avg={body['averageLatencyMs']}ms  total={body['totalElapsedMs']}ms  hitRate={body['cacheHitRate']}  n={len(body['individualLatencies'])}")

    # 11. POST /api/benchmark — invalid concurrency (should clamp or 422)
    banner("11. POST /api/benchmark invalid concurrency values")
    for c in (1, 51, -5, 0):
        r = s.post(f"{BASE}/api/benchmark", json={"concurrency": c})
        print(f"  concurrency={c}  HTTP {r.status_code}  body[:200]={r.text[:200]}")

    # 12. POST /api/optimize invalid payload (missing fields, bad types)
    banner("12. POST /api/optimize malformed payload")
    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": "not a list"})
    print(f"  bad notes type  HTTP {r.status_code}  body[:300]={r.text[:300]}")

    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": PRESETS, "scenario": {"hourly": []}})
    print(f"  empty hourly    HTTP {r.status_code}  body[:300]={r.text[:300]}")

    r = s.post(f"{BASE}/api/optimize", json={"operatorNotes": PRESETS, "scenario": {"battery": {"capacityKwh": -100}}})
    print(f"  bad battery     HTTP {r.status_code}  body[:300]={r.text[:300]}")

    # 13. GET /api/redis-stats
    banner("13. GET /api/redis-stats  [optional backend endpoint]")
    show("redis-stats", s.get(f"{BASE}/api/redis-stats"))

    # 14. GET /api/download-zip — this is what Header.tsx links to. EXPECT 404.
    banner("14. GET /api/download-zip  [Header.tsx link, likely broken]")
    r = s.get(f"{BASE}/api/download-zip")
    print(f"  HTTP {r.status_code}  body[:300]={r.text[:300]}")

    print()
    print("=" * 72)
    print("DONE")
    print("=" * 72)


if __name__ == "__main__":
    main()
