"""
Heuristic priority-dispatch solver — port of `Examples/server/milpSolver.ts`.

Despite the name, the TS reference uses a forward-priority heuristic (not a
true MILP) wrapped in a 31-candidate peak-target sweep.  We replicate exactly:

  - baseline: solar used directly, no battery, no gen, no directives
  - directives: pre-aggregated into per-hour arrays
  - sweep: try each candidate peak in [600, 1500] step 25, keep lowest cost
  - per-hour: arbitrage-charge in cheap hours, discharge in expensive hours,
    mandatory-run gen, force-charge, peak-shave from min SoC reserve

The result is an `OptimizationResult` dict matching the TS contract exactly
(16 totals fields, 13 per-hour fields, etc.).
"""

from __future__ import annotations

import math
import time
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Directive preprocessing
# ---------------------------------------------------------------------------

def _hours_to_apply(start: int, end: int, T: int = 24) -> List[int]:
    if start <= end:
        return [h for h in range(start, end + 1)]
    return [h for h in range(start, T)] + [h for h in range(0, end + 1)]


def preprocess_directives(scenario: dict, directives: List[dict]) -> Dict[str, list]:
    """Fold validated directives into per-hour arrays the dispatch loop reads."""
    T = 24
    batt = scenario["battery"]
    grid = scenario["grid"]
    minE = batt["capacityKwh"] * batt["minSocPercent"] / 100.0
    maxE = batt["capacityKwh"] * batt["maxSocPercent"] / 100.0

    min_soc_h = [minE] * T
    max_soc_h = [maxE] * T
    max_grid_h = [grid["maxImportKw"]] * T
    gen_forbidden = [False] * T
    gen_mandatory = [0.0] * T
    min_charge_h = [0.0] * T

    for d in directives:
        if not d.get("isValid"):
            continue
        start = int(d["startHour"])
        end = int(d["endHour"])
        for h in _hours_to_apply(start, end):
            if h < 0 or h >= T:
                continue
            dtype = d["directiveType"]
            value = float(d["value"])
            if dtype == "BATTERY_MIN_SOC":
                req_e = batt["capacityKwh"] * value / 100.0
                min_soc_h[h] = max(min_soc_h[h], req_e)
            elif dtype == "BATTERY_MAX_SOC":
                req_e = batt["capacityKwh"] * value / 100.0
                max_soc_h[h] = min(max_soc_h[h], req_e)
            elif dtype == "GENERATOR_LOCKOUT":
                gen_forbidden[h] = True
            elif dtype == "GENERATOR_MANDATORY_RUN":
                gen_mandatory[h] = max(gen_mandatory[h], value)
            elif dtype == "GRID_IMPORT_CAP":
                max_grid_h[h] = min(max_grid_h[h], value)
            elif dtype == "BATTERY_FORCE_CHARGE":
                min_charge_h[h] = max(min_charge_h[h], value)
            # BATTERY_LOCKOUT / LOAD_CURTAILMENT are no-ops in the heuristic;
            # BATTERY_LOCKOUT is effectively applied via min/max_soc, and load
            # curtailment is treated as a soft constraint here.

    return {
        "minSocHourly": min_soc_h,
        "maxSocHourly": max_soc_h,
        "maxGridHourly": max_grid_h,
        "genForbidden": gen_forbidden,
        "genMandatory": gen_mandatory,
        "minChargeHourly": min_charge_h,
    }


# ---------------------------------------------------------------------------
# Round helpers — match TS `Math.round(x*10)/10` precision exactly
# ---------------------------------------------------------------------------

def _round1(x: float) -> float:
    return math.floor(x * 10 + 0.5) / 10.0


def _round_int(x: float) -> int:
    return int(math.floor(x + 0.5))


def _round2(x: float) -> float:
    return math.floor(x * 100 + 0.5) / 100.0


# ---------------------------------------------------------------------------
# Per-hour dispatch (one pass over 24 hours)
# ---------------------------------------------------------------------------

def _simulate_dispatch(
    scenario: dict,
    initial_e: float,
    min_soc_h: List[float],
    max_soc_h: List[float],
    grid_caps: List[float],
    gen_forbidden: List[bool],
    gen_mandatory: List[float],
    min_charge_h: List[float],
    baseline_total_cost: float,
    baseline_peak_kw: float,
) -> Dict[str, Any]:
    T = 24
    batt = scenario["battery"]
    gen = scenario["generator"]
    grid = scenario["grid"]

    eta_ch = math.sqrt(batt["roundTripEfficiency"])
    eta_dis = math.sqrt(batt["roundTripEfficiency"])

    # Rank hours by price for arbitrage targeting
    indexed = [
        {
            "hour": i,
            "price": h["gridPrice"],
            "netLoad": max(0.0, h["campusDemand"] - h["solarForecast"]),
        }
        for i, h in enumerate(scenario["hourly"])
    ]
    sorted_by_price = sorted(indexed, key=lambda x: x["price"], reverse=True)
    # Top 8 most expensive hours → discharge eligible
    discharge_eligible = {x["hour"] for x in sorted_by_price[:8]}
    # Bottom 8 cheapest (slice from 14 down — i.e. 14..21) → charge eligible
    charge_eligible = {x["hour"] for x in sorted_by_price[14:]}

    current_e = initial_e
    total_grid_cost = 0.0
    total_gen_cost = 0.0
    total_degradation = 0.0
    peak_grid_kw = 0.0
    total_solar_generated = 0.0
    total_solar_used = 0.0
    total_battery_throughput = 0.0
    total_gen_output = 0.0

    hourly: List[dict] = []

    for t in range(T):
        item = scenario["hourly"][t]
        total_solar_generated += item["solarForecast"]

        solar_used = min(item["campusDemand"], item["solarForecast"])
        solar_curtailed = item["solarForecast"] - solar_used
        total_solar_used += solar_used

        net_demand = max(0.0, item["campusDemand"] - solar_used)
        grid_cap = grid_caps[t]

        batt_charge = 0.0
        batt_discharge = 0.0
        gen_power = 0.0

        # Mandatory generator dispatch
        if gen_mandatory[t] > 0 and not gen_forbidden[t]:
            gen_power = min(gen["maxPowerKw"], gen_mandatory[t])

        # Minimum charge directive
        if min_charge_h[t] > 0:
            room_to_max = (max_soc_h[t] - current_e) / eta_ch
            batt_charge = min(
                batt["maxChargePowerKw"],
                min_charge_h[t],
                max(0.0, room_to_max),
            )

        # Solar excess charging
        if solar_curtailed > 0:
            room_to_max = (max_soc_h[t] - current_e) / eta_ch
            solar_ch = min(
                batt["maxChargePowerKw"] - batt_charge,
                solar_curtailed,
                max(0.0, room_to_max),
            )
            batt_charge += solar_ch

        # Arbitrage charging in off-peak hours
        if t in charge_eligible and batt_charge == 0:
            room_to_max = (max_soc_h[t] - current_e) / eta_ch
            max_possible_ch = min(batt["maxChargePowerKw"], max(0.0, room_to_max))
            grid_room = max(0.0, grid_cap - net_demand)
            batt_charge = min(max_possible_ch, grid_room)

        # Peak shaving / high-price discharge
        required_shave = max(0.0, net_demand + batt_charge - gen_power - grid_cap)
        should_discharge = required_shave > 0 or (
            t in discharge_eligible and net_demand > 300
        )

        if should_discharge and batt_charge == 0:
            available_energy = max(0.0, current_e - min_soc_h[t])
            max_possible_discharge = min(
                batt["maxDischargePowerKw"], available_energy * eta_dis
            )
            if required_shave > 0:
                batt_discharge = min(max_possible_discharge, required_shave + 200)
            else:
                batt_discharge = min(max_possible_discharge, net_demand)

        # Update SoC
        net_change = batt_charge * eta_ch - batt_discharge / eta_dis
        current_e += net_change
        current_e = max(min_soc_h[t], min(max_soc_h[t], current_e))

        # Cover remaining gap with gen if needed/economic
        remaining_to_cover = net_demand + batt_charge - batt_discharge - gen_power
        if remaining_to_cover > grid_cap and not gen_forbidden[t]:
            needed_gen = remaining_to_cover - grid_cap
            additional = min(gen["maxPowerKw"] - gen_power, needed_gen)
            gen_power += additional
        elif (
            item["gridPrice"] > gen["fuelCostPerKwh"]
            and not gen_forbidden[t]
            and remaining_to_cover > 0
        ):
            additional = min(gen["maxPowerKw"] - gen_power, remaining_to_cover)
            gen_power += additional

        grid_import = max(0.0, net_demand + batt_charge - batt_discharge - gen_power)
        if grid_import > peak_grid_kw:
            peak_grid_kw = grid_import

        hourly_grid_cost = grid_import * item["gridPrice"]
        hourly_gen_cost = gen_power * gen["fuelCostPerKwh"] if gen_power > 0 else 0.0
        hourly_degradation = (batt_charge + batt_discharge) * batt["degradationCostPerKwh"]

        total_grid_cost += hourly_grid_cost
        total_gen_cost += hourly_gen_cost
        total_degradation += hourly_degradation
        total_battery_throughput += batt_charge + batt_discharge
        total_gen_output += gen_power

        soc_percent = math.floor((current_e / batt["capacityKwh"]) * 1000 + 0.5) / 10.0
        if soc_percent > 100.0:
            soc_percent = 100.0
        if soc_percent < 0.0:
            soc_percent = 0.0

        hourly.append({
            "hour": t,
            "timeLabel": item["timeLabel"],
            "gridPrice": item["gridPrice"],
            "campusDemandKw": item["campusDemand"],
            "solarForecastKw": item["solarForecast"],
            "solarUsedKw": _round_int(solar_used),
            "solarCurtailedKw": _round_int(solar_curtailed),
            "gridImportKw": _round1(grid_import),
            "batteryChargeKw": _round1(batt_charge),
            "batteryDischargeKw": _round1(batt_discharge),
            "batterySocPercent": soc_percent,
            "generatorKw": _round1(gen_power),
            "netCost": _round2(hourly_grid_cost + hourly_gen_cost + hourly_degradation),
        })

    peak_demand_charge_cost = peak_grid_kw * grid["peakDemandChargeRate"]
    optimized_cost = (
        total_grid_cost + total_gen_cost + total_degradation + peak_demand_charge_cost
    )
    savings_amount = max(0.0, baseline_total_cost - optimized_cost)
    savings_percent = (
        _round1((savings_amount / baseline_total_cost) * 100.0)
        if baseline_total_cost > 0
        else 0.0
    )
    peak_reduction_kw = max(0.0, baseline_peak_kw - peak_grid_kw)
    peak_reduction_percent = (
        _round1((peak_reduction_kw / baseline_peak_kw) * 100.0)
        if baseline_peak_kw > 0
        else 0.0
    )

    totals = {
        "baselineCost": _round2(baseline_total_cost),
        "optimizedCost": _round2(optimized_cost),
        "savingsAmount": _round2(savings_amount),
        "savingsPercent": savings_percent,
        "baselinePeakGridKw": _round1(baseline_peak_kw),
        "optimizedPeakGridKw": _round1(peak_grid_kw),
        "peakReductionKw": _round1(peak_reduction_kw),
        "peakReductionPercent": peak_reduction_percent,
        "totalSolarGeneratedKwh": _round_int(total_solar_generated),
        "totalSolarUsedKwh": _round_int(total_solar_used),
        "totalBatteryThroughputKwh": _round_int(total_battery_throughput),
        "totalGeneratorOutputKwh": _round_int(total_gen_output),
        "gridEnergyCost": _round2(total_grid_cost),
        "generatorFuelCost": _round2(total_gen_cost),
        "batteryDegradationCost": _round2(total_degradation),
        "peakDemandChargeCost": _round2(peak_demand_charge_cost),
    }

    return {
        "hourly": hourly,
        "totals": totals,
        "totalObjective": optimized_cost,
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def solve_microgrid_milp(scenario: dict, directives: List[dict]) -> dict:
    """Top-level solver.  Returns the OptimizationResult dict."""
    start_time = time.time()
    T = 24
    batt = scenario["battery"]
    gen = scenario["generator"]
    grid = scenario["grid"]

    # 1) Baseline (solar direct, no battery, no gen)
    baseline_total_cost = 0.0
    baseline_peak_kw = 0.0
    for t in range(T):
        item = scenario["hourly"][t]
        solar_direct = min(item["campusDemand"], item["solarForecast"])
        grid_import = max(0.0, item["campusDemand"] - solar_direct)
        baseline_total_cost += grid_import * item["gridPrice"]
        if grid_import > baseline_peak_kw:
            baseline_peak_kw = grid_import
    baseline_total_cost += baseline_peak_kw * grid["peakDemandChargeRate"]

    # 2) Preprocess directives
    derived = preprocess_directives(scenario, directives)
    min_soc_h = derived["minSocHourly"]
    max_soc_h = derived["maxSocHourly"]
    max_grid_h = derived["maxGridHourly"]
    gen_forbidden = derived["genForbidden"]
    gen_mandatory = derived["genMandatory"]
    min_charge_h = derived["minChargeHourly"]

    initial_e = batt["capacityKwh"] * batt["initialSocPercent"] / 100.0

    # 3) 31-candidate peak sweep
    candidates = list(range(600, int(grid["maxImportKw"]) + 1, 25))

    best: Optional[Dict[str, Any]] = None
    for target_peak in candidates:
        caps = [min(c, target_peak) for c in max_grid_h]
        schedule = _simulate_dispatch(
            scenario,
            initial_e,
            min_soc_h,
            max_soc_h,
            caps,
            gen_forbidden,
            gen_mandatory,
            min_charge_h,
            baseline_total_cost,
            baseline_peak_kw,
        )
        if schedule is not None and (best is None or schedule["totalObjective"] < best["totalObjective"]):
            best = schedule

    if best is None:
        # Fallback: unconstrained
        best = _simulate_dispatch(
            scenario,
            initial_e,
            min_soc_h,
            max_soc_h,
            max_grid_h,
            gen_forbidden,
            gen_mandatory,
            min_charge_h,
            baseline_total_cost,
            baseline_peak_kw,
        )

    execution_time_ms = int((time.time() - start_time) * 1000)

    timestamp_ms = int(time.time() * 1000)
    rng = (timestamp_ms & 0xFFFF)
    request_id = f"req-{timestamp_ms}-{rng:05x}"

    return {
        "scenarioName": scenario["name"],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "hourlyPlan": best["hourly"],
        "totals": best["totals"],
        "directivesApplied": directives,
        "solverStatus": "OPTIMAL",
        "executionTimeMs": execution_time_ms,
        "cacheStatus": "MISS",
        "requestId": request_id,
    }
