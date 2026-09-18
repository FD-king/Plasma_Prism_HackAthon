"""
LLM directive extractor — Groq + deterministic heuristic fallback.

Ports `Examples/server/llmExtractor.ts` from the Gemini SDK to Groq while
preserving the 8-directive enum, hour range, and per-note heuristic logic.

Never raises — if Groq is unavailable, returns nothing, or produces a
malformed shape, we fall through to the regex-based heuristic and always
return a list (possibly empty) of validated StructuredDirectives.
"""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from .directive_validator import build_context, validate_all_directives

logger = logging.getLogger(__name__)

_DEFAULT_GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


SYSTEM_PROMPT: str = """\
You are an expert energy systems microgrid operator and mathematical
programming parser.  You extract precise numerical constraints from short
operator notes for a 24-hour campus microgrid MILP optimizer.

Return STRICTLY a valid JSON array (no prose, no markdown fences).  Each
array element must have exactly these keys:
  - originalNote: string (exact input note)
  - directiveType: one of ["BATTERY_MIN_SOC", "BATTERY_MAX_SOC",
        "BATTERY_FORCE_CHARGE", "BATTERY_LOCKOUT", "GENERATOR_LOCKOUT",
        "GENERATOR_MANDATORY_RUN", "GRID_IMPORT_CAP", "LOAD_CURTAILMENT"]
  - startHour: integer 0..23
  - endHour: integer 0..23 (for overnight ranges like 22→06, endHour=6)
  - value: numeric (percent or kW; 0 for boolean-style directives)
  - unit: "%" | "kW" | "boolean"
  - reasoning: brief 1-sentence engineering justification

Mapping hints:
  - "above 60% after 17:00" / "storm reserve" / "keep battery above X%"
        → BATTERY_MIN_SOC
  - "limit charge to 200 kW" → BATTERY_FORCE_CHARGE
  - "cap grid import to 850 kW during 14:00-19:00" → GRID_IMPORT_CAP
  - "no diesel 22:00 to 06:00" / "quiet hours" → GENERATOR_LOCKOUT
  - "must run generator at 200 kW" → GENERATOR_MANDATORY_RUN
  - "curtail 100 kW" / "shed load" → LOAD_CURTAILMENT
  - "no battery 22:00 to 06:00" → BATTERY_LOCKOUT
  - "battery cap 80%" → BATTERY_MAX_SOC
"""


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def extract_and_validate_directives(
    notes: List[str], scenario
) -> List[Dict[str, Any]]:
    """Validate raw notes into StructuredDirectives ready for the solver."""
    cleaned = [n.strip() for n in (notes or []) if n and n.strip()]
    if not cleaned:
        return []

    context = build_context(scenario)

    raw_directives: List[Dict[str, Any]] = []

    # 1) LLM path
    api_key = os.getenv("GROQ_API_KEY")
    if api_key:
        try:
            llm_results = _call_groq(cleaned, scenario, api_key)
            if llm_results:
                raw_directives.extend(llm_results)
        except Exception as exc:  # noqa: BLE001
            logger.warning("LLM extractor failed (%s); using heuristic.", exc)

    # 2) Heuristic fallback (always run for any unhandled notes)
    handled_notes = {d.get("originalNote") for d in raw_directives}
    for note in cleaned:
        if note in handled_notes:
            continue
        extracted = _parse_note_heuristically(note)
        extracted["originalNote"] = note
        raw_directives.append(extracted)

    # 3) Validate
    return validate_all_directives(raw_directives, context)


# ---------------------------------------------------------------------------
# Groq call
# ---------------------------------------------------------------------------

def _call_groq(notes: List[str], scenario, api_key: str) -> Optional[List[Dict[str, Any]]]:
    from groq import Groq  # type: ignore

    batt = scenario["battery"] if isinstance(scenario, dict) else scenario.battery.model_dump()
    gen = scenario["generator"] if isinstance(scenario, dict) else scenario.generator.model_dump()
    grid = scenario["grid"] if isinstance(scenario, dict) else scenario.grid.model_dump()

    user_prompt = (
        "You are an expert energy systems microgrid operator and mathematical programming parser.\n"
        "Analyze these 1 to 3 operator notes and convert each into a structured constraint directive "
        "for a 24-hour campus Mixed-Integer Linear Program (MILP):\n\n"
        f"Campus scenario context:\n"
        f"- Battery Capacity: {batt['capacityKwh']} kWh, "
        f"Inverter Rating: {batt['maxChargePowerKw']} kW, "
        f"Min/Max SoC: {batt['minSocPercent']}%-{batt['maxSocPercent']}%\n"
        f"- Generator Capacity: {gen['maxPowerKw']} kW\n"
        f"- Grid Import Limit: {grid['maxImportKw']} kW\n\n"
        "Operator Notes:\n"
        + "\n".join(f'{i + 1}. "{n}"' for i, n in enumerate(notes))
        + "\n\nFor each note, return a structured object with:\n"
        "- originalNote: exact string of the note\n"
        "- directiveType: one of the 8 enum values\n"
        "- startHour: integer (0 to 23)\n"
        "- endHour: integer (0 to 23). For overnight (22:00→06:00) use endHour=6.\n"
        "- value: numeric value\n"
        "- unit: '%' | 'kW' | 'boolean'\n"
        "- reasoning: brief 1-sentence engineering justification.\n"
    )

    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model=_DEFAULT_GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.0,
        max_tokens=1024,
        timeout=10,
    )
    raw = completion.choices[0].message.content or "{}"
    parsed = json.loads(raw)

    # Accept either a bare array or an object containing "directives"
    if isinstance(parsed, list):
        results = parsed
    elif isinstance(parsed, dict):
        results = parsed.get("directives") or parsed.get("result") or []
    else:
        results = []

    if not isinstance(results, list):
        return None

    # Sanitize each entry
    sanitized: List[Dict[str, Any]] = []
    for entry in results:
        if not isinstance(entry, dict):
            continue
        sanitized.append({
            "originalNote": entry.get("originalNote", ""),
            "directiveType": entry.get("directiveType", ""),
            "startHour": entry.get("startHour", 0),
            "endHour": entry.get("endHour", 23),
            "value": entry.get("value", 0),
            "unit": entry.get("unit", "%"),
            "reasoning": entry.get("reasoning", ""),
        })
    return sanitized


# ---------------------------------------------------------------------------
# Heuristic fallback (port of parseNotesHeuristically)
# ---------------------------------------------------------------------------

_RANGE_RE = re.compile(
    r"(?:between|from)\s*(\d{1,2})(?::\d{2})?\s*(?:and|to|-)\s*(\d{1,2})(?::\d{2})?"
)


def _extract_time_range(text: str, default_start: int, default_end: int) -> Dict[str, int]:
    m = _RANGE_RE.search(text)
    if m:
        return {"start": int(m.group(1)), "end": int(m.group(2))}
    return {"start": default_start, "end": default_end}


def _parse_note_heuristically(note: str) -> Dict[str, Any]:
    lower = note.lower()

    # 1) Generator lockout / quiet hours
    if any(k in lower for k in ("quiet", "generator", "diesel", "genset")):
        if any(k in lower for k in ("off", "do not run", "quiet", "prohibit", "lockout", "no ")):
            times = _extract_time_range(lower, 22, 6)
            return {
                "directiveType": "GENERATOR_LOCKOUT",
                "startHour": times["start"],
                "endHour": times["end"],
                "value": 0,
                "unit": "boolean",
                "reasoning": (
                    f"Extracted generator restriction: prevent backup generator "
                    f"operation between {times['start']}:00 and {times['end']}:00."
                ),
            }

    # 2) Battery SoC minimum (storm, reserve, above X%)
    if any(k in lower for k in ("battery", "bess", "storage", "storm", "reserve", "above", "soc")):
        pct_match = re.search(r"(\d{1,3})\s*%", lower)
        soc_val = int(pct_match.group(1)) if pct_match else 60
        hour_match = re.search(r"(?:after|before|from|at)\s*(\d{1,2})(?::00)?", lower)
        start_hour = int(hour_match.group(1)) if hour_match else 17
        return {
            "directiveType": "BATTERY_MIN_SOC",
            "startHour": start_hour,
            "endHour": 23,
            "value": soc_val,
            "unit": "%",
            "reasoning": (
                f"Extracted BESS reserve constraint: keep state of charge at or above "
                f"{soc_val}% starting at hour {start_hour}:00."
            ),
        }

    # 3) Grid import cap / peak shaving
    if any(k in lower for k in ("grid", "cap", "import", "shav", "peak")):
        kw_match = re.search(r"(\d{2,4})\s*(?:kw|kwh)?", lower)
        cap_kw = int(kw_match.group(1)) if kw_match else 850
        times = _extract_time_range(lower, 14, 19)
        return {
            "directiveType": "GRID_IMPORT_CAP",
            "startHour": times["start"],
            "endHour": times["end"],
            "value": cap_kw,
            "unit": "kW",
            "reasoning": (
                f"Extracted grid import threshold: limit utility purchase to <= {cap_kw} kW "
                f"during peak window ({times['start']}:00 - {times['end']}:00)."
            ),
        }

    # 4) Default fallback
    return {
        "directiveType": "GRID_IMPORT_CAP",
        "startHour": 14,
        "endHour": 19,
        "value": 900,
        "unit": "kW",
        "reasoning": f'Extracted standard operational constraint from operator input: "{note}"',
    }
