"""
Pydantic models — strict mirror of the React frontend's TypeScript contracts
defined in `Examples/src/types/energy.ts`.

Every field name is preserved 1:1 so JSON serialization round-trips exactly
against what the React client expects.  Field units are documented inline.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-specs
# ---------------------------------------------------------------------------


class HourlyInput(BaseModel):
    """One row of the 24-hour campus profile."""

    hour: int = Field(..., ge=0, le=23, description="Hour of day, 0..23")
    timeLabel: str = Field(..., description='e.g. "00:00", "13:00"')
    gridPrice: float = Field(..., ge=0.0, description="$/kWh")
    campusDemand: float = Field(..., ge=0.0, description="kW")
    solarForecast: float = Field(0.0, ge=0.0, description="kW")
    generatorAvailable: Optional[bool] = True


class BatterySystemSpecs(BaseModel):
    """Battery / BESS hardware envelope."""

    capacityKwh: float = Field(..., gt=0.0, description="Total capacity, kWh")
    maxChargePowerKw: float = Field(..., gt=0.0, description="Inverter charge rating, kW")
    maxDischargePowerKw: float = Field(..., gt=0.0, description="Inverter discharge rating, kW")
    initialSocPercent: float = Field(..., ge=0.0, le=100.0, description="Starting SoC, %")
    minSocPercent: float = Field(15.0, ge=0.0, le=100.0, description="Hardware-safe minimum SoC, %")
    maxSocPercent: float = Field(95.0, ge=0.0, le=100.0, description="Hardware-safe maximum SoC, %")
    roundTripEfficiency: float = Field(0.92, gt=0.0, le=1.0, description="Round-trip η")
    degradationCostPerKwh: float = Field(0.012, ge=0.0, description="$/kWh throughput")


class GeneratorSpecs(BaseModel):
    """Diesel/gas backup generator envelope."""

    maxPowerKw: float = Field(..., gt=0.0, description="Nameplate, kW")
    fuelCostPerKwh: float = Field(..., ge=0.0, description="$/kWh")
    minPowerKw: float = Field(0.0, ge=0.0, description="Min stable load when running, kW")
    startupCost: float = Field(0.0, ge=0.0, description="$ per start event")


class GridSpecs(BaseModel):
    """Utility interconnect + demand charge."""

    maxImportKw: float = Field(..., gt=0.0, description="Substation limit, kW")
    peakDemandChargeRate: float = Field(..., ge=0.0, description="$/kW peak (24h cycle)")


# ---------------------------------------------------------------------------
# Top-level scenario
# ---------------------------------------------------------------------------


class EnergyScenario(BaseModel):
    """Complete campus microgrid description for a single 24h dispatch."""

    scenarioId: Optional[str] = None
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    battery: BatterySystemSpecs
    generator: GeneratorSpecs
    grid: GridSpecs
    hourly: List[HourlyInput] = Field(..., min_length=24, max_length=24)


# ---------------------------------------------------------------------------
# Directives
# ---------------------------------------------------------------------------


DirectiveTypeLiteral = Literal[
    "BATTERY_MIN_SOC",
    "BATTERY_MAX_SOC",
    "BATTERY_FORCE_CHARGE",
    "BATTERY_LOCKOUT",
    "GENERATOR_LOCKOUT",
    "GENERATOR_MANDATORY_RUN",
    "GRID_IMPORT_CAP",
    "LOAD_CURTAILMENT",
]

DirectiveUnitLiteral = Literal["%", "kW", "boolean"]

DIRECTIVE_TYPES: tuple[str, ...] = (
    "BATTERY_MIN_SOC",
    "BATTERY_MAX_SOC",
    "BATTERY_FORCE_CHARGE",
    "BATTERY_LOCKOUT",
    "GENERATOR_LOCKOUT",
    "GENERATOR_MANDATORY_RUN",
    "GRID_IMPORT_CAP",
    "LOAD_CURTAILMENT",
)


class StructuredDirective(BaseModel):
    """One operator-derived MILP constraint after validation."""

    id: str
    originalNote: str
    directiveType: DirectiveTypeLiteral
    startHour: int = Field(..., ge=0, le=23)
    endHour: int = Field(..., ge=0, le=23)
    value: float
    unit: DirectiveUnitLiteral
    reasoning: str
    isValid: bool
    validationMessages: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Per-hour output
# ---------------------------------------------------------------------------


class HourlyPlanItem(BaseModel):
    """One hour of the optimized schedule."""

    hour: int
    timeLabel: str
    gridPrice: float
    campusDemandKw: float
    solarForecastKw: float
    solarUsedKw: float
    solarCurtailedKw: float
    gridImportKw: float
    batteryChargeKw: float
    batteryDischargeKw: float
    batterySocPercent: float
    generatorKw: float
    netCost: float


# ---------------------------------------------------------------------------
# Totals
# ---------------------------------------------------------------------------


class OptimizationTotals(BaseModel):
    """16-field aggregate summary — must match TS contract exactly."""

    baselineCost: float
    optimizedCost: float
    savingsAmount: float
    savingsPercent: float
    baselinePeakGridKw: float
    optimizedPeakGridKw: float
    peakReductionKw: float
    peakReductionPercent: float
    totalSolarGeneratedKwh: float
    totalSolarUsedKwh: float
    totalBatteryThroughputKwh: float
    totalGeneratorOutputKwh: float
    gridEnergyCost: float
    generatorFuelCost: float
    batteryDegradationCost: float
    peakDemandChargeCost: float


# ---------------------------------------------------------------------------
# Outer result envelope
# ---------------------------------------------------------------------------


class OptimizationResult(BaseModel):
    scenarioName: str
    timestamp: str
    hourlyPlan: List[HourlyPlanItem]
    totals: OptimizationTotals
    directivesApplied: List[StructuredDirective]
    solverStatus: Literal["OPTIMAL", "SUBOPTIMAL", "FEASIBLE"]
    executionTimeMs: int
    cacheStatus: Literal["HIT", "MISS"]
    requestId: str


# ---------------------------------------------------------------------------
# Request / response payloads
# ---------------------------------------------------------------------------


class OptimizationRequestPayload(BaseModel):
    scenario: Optional[EnergyScenario] = None
    operatorNotes: List[str] = Field(default_factory=list)
    forceRefresh: bool = False


class ResponseMeta(BaseModel):
    cached: bool
    responseTimeMs: int
    requestId: str
    redisActive: bool
    timestamp: str


class OptimizationResponsePayload(BaseModel):
    success: bool
    data: Optional[OptimizationResult] = None
    error: Optional[str] = None
    meta: ResponseMeta


# ---------------------------------------------------------------------------
# Health + benchmark
# ---------------------------------------------------------------------------


class CacheStats(BaseModel):
    hits: int
    misses: int
    keysCount: int
    redisConnected: bool
    backend: str
    uptimeSeconds: int


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    cache: CacheStats
    concurrencySupported: bool
    maxExecutionGuaranteeSeconds: int


class BenchmarkRequest(BaseModel):
    concurrency: int = Field(10, ge=2, le=50)
    operatorNotes: Optional[List[str]] = None
    scenario: Optional[EnergyScenario] = None


class BenchmarkIndividualLatency(BaseModel):
    index: int
    durationMs: int
    cached: bool
    savingsPercent: float


class BenchmarkResponse(BaseModel):
    success: bool
    concurrencyCount: int
    totalElapsedMs: int
    averageLatencyMs: int
    cacheHitRate: str
    individualLatencies: List[BenchmarkIndividualLatency]


class DefaultScenarioResponse(BaseModel):
    success: bool
    scenario: EnergyScenario
    defaultNotes: List[str]
