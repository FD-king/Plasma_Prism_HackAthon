"""AI-Driven Campus Energy Optimizer — backend package.

Public surface for the FastAPI app mounted under `/api/*`.  Mirrors the
React frontend at `Examples/src/App.tsx`.
"""

__version__ = "2.0.0"

from .cache import cache_service, hash_key
from .default_scenario import DEFAULT_CAMPUS_SCENARIO, DEFAULT_PRESET_NOTES, merge_scenario
from .directive_validator import validate_all_directives, validate_directive
from .llm_extractor import extract_and_validate_directives
from .milp_solver import solve_microgrid_milp
from .models import (
    EnergyScenario,
    HourlyPlanItem,
    OptimizationRequestPayload,
    OptimizationResponsePayload,
    OptimizationResult,
    OptimizationTotals,
    StructuredDirective,
)
