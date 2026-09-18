export interface HourlyInput {
  hour: number; // 0 to 23
  timeLabel: string; // e.g. "00:00", "01:00", ..., "23:00"
  gridPrice: number; // $/kWh
  campusDemand: number; // kW
  solarForecast: number; // kW
  generatorAvailable?: boolean;
}

export interface BatterySystemSpecs {
  capacityKwh: number; // e.g. 2000 kWh
  maxChargePowerKw: number; // e.g. 500 kW
  maxDischargePowerKw: number; // e.g. 500 kW
  initialSocPercent: number; // e.g. 50%
  minSocPercent: number; // e.g. 15%
  maxSocPercent: number; // e.g. 95%
  roundTripEfficiency: number; // e.g. 0.90 (90%)
  degradationCostPerKwh: number; // e.g. $0.015 / kWh
}

export interface GeneratorSpecs {
  maxPowerKw: number; // e.g. 600 kW
  fuelCostPerKwh: number; // e.g. $0.26 / kWh
  minPowerKw: number; // e.g. 100 kW minimum stable load if running, or 0
  startupCost: number; // e.g. $20
}

export interface GridSpecs {
  maxImportKw: number; // e.g. 1500 kW
  peakDemandChargeRate: number; // $/kW peak in 24h period, e.g. $12.00
}

export interface EnergyScenario {
  scenarioId?: string;
  name: string;
  description?: string;
  battery: BatterySystemSpecs;
  generator: GeneratorSpecs;
  grid: GridSpecs;
  hourly: HourlyInput[];
}

export type DirectiveType =
  | 'BATTERY_MIN_SOC'
  | 'BATTERY_MAX_SOC'
  | 'BATTERY_FORCE_CHARGE'
  | 'BATTERY_LOCKOUT'
  | 'GENERATOR_LOCKOUT'
  | 'GENERATOR_MANDATORY_RUN'
  | 'GRID_IMPORT_CAP'
  | 'LOAD_CURTAILMENT';

export interface StructuredDirective {
  id: string;
  originalNote: string;
  directiveType: DirectiveType;
  startHour: number; // 0 - 23
  endHour: number; // 0 - 23
  value: number; // e.g. 60 (for 60% or 600 kW)
  unit: '%' | 'kW' | 'boolean';
  reasoning: string;
  isValid: boolean;
  validationMessages?: string[];
}

export interface HourlyPlanItem {
  hour: number;
  timeLabel: string;
  gridPrice: number;
  campusDemandKw: number;
  solarForecastKw: number;
  solarUsedKw: number;
  solarCurtailedKw: number;
  gridImportKw: number;
  batteryChargeKw: number;
  batteryDischargeKw: number;
  batterySocPercent: number;
  generatorKw: number;
  netCost: number;
}

export interface OptimizationTotals {
  baselineCost: number;
  optimizedCost: number;
  savingsAmount: number;
  savingsPercent: number;
  baselinePeakGridKw: number;
  optimizedPeakGridKw: number;
  peakReductionKw: number;
  peakReductionPercent: number;
  totalSolarGeneratedKwh: number;
  totalSolarUsedKwh: number;
  totalBatteryThroughputKwh: number;
  totalGeneratorOutputKwh: number;
  gridEnergyCost: number;
  generatorFuelCost: number;
  batteryDegradationCost: number;
  peakDemandChargeCost: number;
}

export interface OptimizationResult {
  scenarioName: string;
  timestamp: string;
  hourlyPlan: HourlyPlanItem[];
  totals: OptimizationTotals;
  directivesApplied: StructuredDirective[];
  solverStatus: 'OPTIMAL' | 'SUBOPTIMAL' | 'FEASIBLE';
  executionTimeMs: number;
  cacheStatus: 'HIT' | 'MISS';
  requestId: string;
}

export interface OptimizationRequestPayload {
  scenario?: Partial<EnergyScenario>;
  operatorNotes: string[];
  forceRefresh?: boolean;
}

export interface OptimizationResponsePayload {
  success: boolean;
  data?: OptimizationResult;
  error?: string;
  meta: {
    cached: boolean;
    responseTimeMs: number;
    requestId: string;
    redisActive: boolean;
    timestamp: string;
  };
}
