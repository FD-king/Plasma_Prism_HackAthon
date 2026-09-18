"""
Directive validator — 1:1 port of `Examples/server/directiveValidator.ts`.

Validates raw LLM/heuristic output into the `StructuredDirective` shape the
MILP solver expects. Handles:
  - directiveType auto-recovery from mistyped names
  - 0..23 hour-range clamping
  - per-type value bounds (clamps generator, grid cap, SoC %, etc.)
  - cross-directive conflict resolution (min SoC > max SoC overlap)

Never raises — returns a StructuredDirective even when the input is broken,
so downstream consumers always see a uniform list of validated directives.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any, List, Literal, Optional

logger = logging.getLogger(__name__)


VALID_DIRECTIVE_TYPES = (
    "BATTERY_MIN_SOC",
    "BATTERY_MAX_SOC",
    "BATTERY_FORCE_CHARGE",
    "BATTERY_LOCKOUT",
    "GENERATOR_LOCKOUT",
    "GENERATOR_MANDATORY_RUN",
    "GRID_IMPORT_CAP",
    "LOAD_CURTAILMENT",
)


@dataclass
class DirectiveContext:
    """Subset of the scenario needed to validate directives."""

    battery_capacity_kwh: float
    battery_min_soc_percent: float
    battery_max_soc_percent: float
    battery_max_charge_kw: float
    generator_max_kw: float
    generator_min_kw: float
    grid_max_import_kw: float


def _coerce_int(v: Any, default: int) -> int:
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def _coerce_number(v: Any) -> float:
    try:
        x = float(v)
    except (TypeError, ValueError):
        return float("nan")
    return x


def _norm_type(raw_type: Any) -> tuple[Optional[str], bool]:
    """Return (normalized_type, is_valid).  Mirrors TS auto-recovery rules."""
    if raw_type is None:
        return "GRID_IMPORT_CAP", False
    norm = str(raw_type).upper().strip()
    if norm in VALID_DIRECTIVE_TYPES:
        return norm, True
    # Recovery heuristics
    if "GENERATOR" in norm and any(k in norm for k in ("OFF", "QUIET", "LOCK")):
        return "GENERATOR_LOCKOUT", False
    if "BATTERY" in norm and "MIN" in norm:
        return "BATTERY_MIN_SOC", False
    if "GRID" in norm and "CAP" in norm:
        return "GRID_IMPORT_CAP", False
    return "GRID_IMPORT_CAP", False


def validate_directive(
    raw: dict,
    context: DirectiveContext,
    index: int,
) -> dict:
    """Validate one raw directive dict. Returns a StructuredDirective dict.

    Never raises — even garbage input becomes a non-intrusive GRID_IMPORT_CAP
    that the solver can still respect without crashing.
    """
    messages: List[str] = []
    is_valid = True

    # 1) Normalize directiveType
    norm_type, type_valid = _norm_type(raw.get("directiveType"))
    if not type_valid:
        messages.append(
            f'Unrecognized directive type "{raw.get("directiveType")}". '
            f"Defaulting to non-intrusive restriction."
        )
        is_valid = False

    # 2) Hour range
    start_hour = _coerce_int(raw.get("startHour"), 0)
    end_hour = _coerce_int(raw.get("endHour"), 23)
    if start_hour < 0 or start_hour > 23:
        messages.append(
            f"Start hour {start_hour} out of 24h range (clamped to 0..23)."
        )
        start_hour = max(0, min(23, start_hour))
    if end_hour < 0 or end_hour > 23:
        messages.append(
            f"End hour {end_hour} out of 24h range (clamped to 0..23)."
        )
        end_hour = max(0, min(23, end_hour))

    # 3) Value & unit per type
    raw_unit = raw.get("unit")
    value = _coerce_number(raw.get("value"))
    unit: Literal["%", "kW", "boolean"]

    if norm_type in ("BATTERY_MIN_SOC", "BATTERY_MAX_SOC"):
        unit = "%"
        if value != value:  # NaN check
            value = 60
        if value < 0 or value > 100:
            messages.append(
                f"Battery SoC target {value}% out of physical 0-100% range. Clamped."
            )
            value = max(10, min(95, value))
        if (
            norm_type == "BATTERY_MIN_SOC"
            and value < context.battery_min_soc_percent
        ):
            messages.append(
                f"Requested min SoC ({value}%) is below hardware safe limit "
                f"({context.battery_min_soc_percent}%). Adjusted to "
                f"{context.battery_min_soc_percent}%."
            )
            value = context.battery_min_soc_percent

    elif norm_type == "BATTERY_FORCE_CHARGE":
        unit = "kW"
        if value != value:
            value = context.battery_max_charge_kw
        if value > context.battery_max_charge_kw:
            messages.append(
                f"Requested charge rate ({value} kW) exceeds maximum inverter "
                f"rating ({context.battery_max_charge_kw} kW). Clamped."
            )
            value = context.battery_max_charge_kw

    elif norm_type == "GENERATOR_LOCKOUT":
        unit = "boolean"
        value = 0

    elif norm_type == "GENERATOR_MANDATORY_RUN":
        unit = "kW"
        if value != value or value <= 0:
            value = context.generator_min_kw or 150
        if value > context.generator_max_kw:
            messages.append(
                f"Requested generator power ({value} kW) exceeds generator "
                f"capacity ({context.generator_max_kw} kW)."
            )
            value = context.generator_max_kw

    elif norm_type == "GRID_IMPORT_CAP":
        unit = "kW"
        if value != value or value < 0:
            value = 800
        if value > context.grid_max_import_kw:
            messages.append(
                f"Grid import cap ({value} kW) exceeds substation connection "
                f"limit ({context.grid_max_import_kw} kW)."
            )
            value = context.grid_max_import_kw

    elif norm_type == "LOAD_CURTAILMENT":
        unit = "kW"
        if value != value or value < 0:
            value = 100

    elif norm_type == "BATTERY_LOCKOUT":
        unit = "boolean"
        value = 0

    else:
        # Defensive — _norm_type always returns a string
        unit = raw_unit if raw_unit in ("%", "kW", "boolean") else "%"

    # 4) Build the StructuredDirective
    directive_id = f"dir-{index + 1}-{int(time.time() * 1000):x}-{index}"
    original_note = raw.get("originalNote") or "Operator manual note"
    reasoning = raw.get("reasoning") or (
        f"Converted into machine-executable directive for hours "
        f"{start_hour}:00–{end_hour}:00."
    )

    directive = {
        "id": directive_id,
        "originalNote": original_note,
        "directiveType": norm_type,
        "startHour": start_hour,
        "endHour": end_hour,
        "value": float(value),
        "unit": unit,
        "reasoning": reasoning,
        "isValid": is_valid,
        "validationMessages": messages if messages else [
            "Directive fully verified and physically consistent with campus microgrid specs."
        ],
    }
    return directive


def validate_all_directives(
    raw_directives: List[dict],
    context: DirectiveContext,
) -> List[dict]:
    """Validate a list of raw directives + resolve cross-conflicts."""
    validated = [
        validate_directive(d, context, i)
        for i, d in enumerate(raw_directives)
    ]

    # Cross-resolution: BATTERY_MIN_SOC > BATTERY_MAX_SOC overlap → reduce min
    min_soc_dirs = [d for d in validated if d["directiveType"] == "BATTERY_MIN_SOC"]
    max_soc_dirs = [d for d in validated if d["directiveType"] == "BATTERY_MAX_SOC"]

    for min_d in min_soc_dirs:
        for max_d in max_soc_dirs:
            if min_d["value"] > max_d["value"]:
                overlap = (
                    max(min_d["startHour"], max_d["startHour"])
                    <= min(min_d["endHour"], max_d["endHour"])
                )
                if overlap:
                    msgs = min_d.setdefault("validationMessages", [])
                    msgs.append(
                        f"Conflict detected: Min SoC ({min_d['value']}%) exceeds "
                        f"Max SoC ({max_d['value']}%). Lowering min SoC to "
                        f"{max_d['value']}%."
                    )
                    min_d["value"] = max_d["value"]

    return validated


def build_context(scenario) -> DirectiveContext:
    """Build a DirectiveContext from an EnergyScenario (or dict)."""
    if hasattr(scenario, "battery"):
        batt = scenario.battery
        gen = scenario.generator
        grid = scenario.grid
    else:
        batt = scenario["battery"]
        gen = scenario["generator"]
        grid = scenario["grid"]

    return DirectiveContext(
        battery_capacity_kwh=float(batt["capacityKwh"] if isinstance(batt, dict) else batt.capacityKwh),
        battery_min_soc_percent=float(batt["minSocPercent"] if isinstance(batt, dict) else batt.minSocPercent),
        battery_max_soc_percent=float(batt["maxSocPercent"] if isinstance(batt, dict) else batt.maxSocPercent),
        battery_max_charge_kw=float(batt["maxChargePowerKw"] if isinstance(batt, dict) else batt.maxChargePowerKw),
        generator_max_kw=float(gen["maxPowerKw"] if isinstance(gen, dict) else gen.maxPowerKw),
        generator_min_kw=float(gen["minPowerKw"] if isinstance(gen, dict) else gen.minPowerKw),
        grid_max_import_kw=float(grid["maxImportKw"] if isinstance(grid, dict) else grid.maxImportKw),
    )
