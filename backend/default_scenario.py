"""
Canonical 24-hour campus microgrid scenario — exact port of
`Examples/src/data/defaultScenario.ts` from the React frontend.

This is the source-of-truth scenario merged into every `/api/optimize` request
when the client supplies only a partial `scenario` payload.
"""

from __future__ import annotations

from typing import List

from .models import EnergyScenario, HourlyInput


DEFAULT_CAMPUS_SCENARIO: EnergyScenario = EnergyScenario(
    scenarioId="campus-central-24h",
    name="Central Campus Microgrid (Main & Manufacturing Nodes)",
    description=(
        "24-hour operational load with commercial manufacturing, "
        "office blocks, BESS, and rooftop PV."
    ),
    battery={
        "capacityKwh": 2000,
        "maxChargePowerKw": 500,
        "maxDischargePowerKw": 500,
        "initialSocPercent": 50,
        "minSocPercent": 15,
        "maxSocPercent": 95,
        "roundTripEfficiency": 0.92,
        "degradationCostPerKwh": 0.012,
    },
    generator={
        "maxPowerKw": 600,
        "fuelCostPerKwh": 0.28,
        "minPowerKw": 0,
        "startupCost": 15,
    },
    grid={
        "maxImportKw": 1500,
        "peakDemandChargeRate": 12.50,  # $12.50 per peak kW in 24h cycle
    },
    hourly=[
        {"hour": 0,  "timeLabel": "00:00", "gridPrice": 0.082, "campusDemand": 780,  "solarForecast": 0},
        {"hour": 1,  "timeLabel": "01:00", "gridPrice": 0.078, "campusDemand": 720,  "solarForecast": 0},
        {"hour": 2,  "timeLabel": "02:00", "gridPrice": 0.075, "campusDemand": 690,  "solarForecast": 0},
        {"hour": 3,  "timeLabel": "03:00", "gridPrice": 0.074, "campusDemand": 660,  "solarForecast": 0},
        {"hour": 4,  "timeLabel": "04:00", "gridPrice": 0.074, "campusDemand": 650,  "solarForecast": 0},
        {"hour": 5,  "timeLabel": "05:00", "gridPrice": 0.085, "campusDemand": 710,  "solarForecast": 0},
        {"hour": 6,  "timeLabel": "06:00", "gridPrice": 0.140, "campusDemand": 850,  "solarForecast": 15},
        {"hour": 7,  "timeLabel": "07:00", "gridPrice": 0.165, "campusDemand": 980,  "solarForecast": 75},
        {"hour": 8,  "timeLabel": "08:00", "gridPrice": 0.180, "campusDemand": 1120, "solarForecast": 190},
        {"hour": 9,  "timeLabel": "09:00", "gridPrice": 0.190, "campusDemand": 1180, "solarForecast": 340},
        {"hour": 10, "timeLabel": "10:00", "gridPrice": 0.185, "campusDemand": 1140, "solarForecast": 480},
        {"hour": 11, "timeLabel": "11:00", "gridPrice": 0.180, "campusDemand": 1170, "solarForecast": 590},
        {"hour": 12, "timeLabel": "12:00", "gridPrice": 0.195, "campusDemand": 1210, "solarForecast": 640},
        {"hour": 13, "timeLabel": "13:00", "gridPrice": 0.220, "campusDemand": 1230, "solarForecast": 610},
        {"hour": 14, "timeLabel": "14:00", "gridPrice": 0.320, "campusDemand": 1240, "solarForecast": 510},
        {"hour": 15, "timeLabel": "15:00", "gridPrice": 0.340, "campusDemand": 1210, "solarForecast": 380},
        {"hour": 16, "timeLabel": "16:00", "gridPrice": 0.360, "campusDemand": 1190, "solarForecast": 220},
        {"hour": 17, "timeLabel": "17:00", "gridPrice": 0.380, "campusDemand": 1260, "solarForecast": 90},
        {"hour": 18, "timeLabel": "18:00", "gridPrice": 0.395, "campusDemand": 1350, "solarForecast": 10},
        {"hour": 19, "timeLabel": "19:00", "gridPrice": 0.360, "campusDemand": 1280, "solarForecast": 0},
        {"hour": 20, "timeLabel": "20:00", "gridPrice": 0.310, "campusDemand": 1190, "solarForecast": 0},
        {"hour": 21, "timeLabel": "21:00", "gridPrice": 0.180, "campusDemand": 1050, "solarForecast": 0},
        {"hour": 22, "timeLabel": "22:00", "gridPrice": 0.120, "campusDemand": 940,  "solarForecast": 0},
        {"hour": 23, "timeLabel": "23:00", "gridPrice": 0.095, "campusDemand": 840,  "solarForecast": 0},
    ],
)


DEFAULT_PRESET_NOTES: List[str] = [
    "Storm alert: maintain battery storage above 60% after 17:00 as backup reserve.",
    "Quiet hours: do not run diesel backup generator between 22:00 and 06:00.",
    "Peak demand avoidance: cap grid import to 850 kW between 14:00 and 19:00.",
]


def merge_scenario(partial: dict | None) -> EnergyScenario:
    """Merge a partial scenario dict with the default scenario.

    The TS server does this on every /api/optimize call; we replicate so the
    backend behaves identically when clients send `{scenario: {hourly: [...]}}`
    or omit the scenario entirely.
    """
    base = DEFAULT_CAMPUS_SCENARIO.model_dump()
    if not partial:
        return EnergyScenario(**base)

    def _merge(top_key: str) -> dict:
        sub = dict(base[top_key])
        if isinstance(partial.get(top_key), dict):
            sub.update(partial[top_key])
        return sub

    merged: dict = {
        "scenarioId": partial.get("scenarioId") or base["scenarioId"],
        "name": partial.get("name") or base["name"],
        "description": partial.get("description") or base["description"],
        "battery": _merge("battery"),
        "generator": _merge("generator"),
        "grid": _merge("grid"),
    }

    hourly = partial.get("hourly")
    if isinstance(hourly, list) and len(hourly) == 24:
        merged["hourly"] = hourly
    else:
        merged["hourly"] = base["hourly"]

    return EnergyScenario(**merged)
