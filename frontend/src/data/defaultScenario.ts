import { EnergyScenario } from '../types/energy';

export const DEFAULT_CAMPUS_SCENARIO: EnergyScenario = {
  scenarioId: 'campus-central-24h',
  name: 'Central Campus Microgrid (Main & Manufacturing Nodes)',
  description: '24-hour operational load with commercial manufacturing, office blocks, BESS, and rooftop PV.',
  battery: {
    capacityKwh: 2000,
    maxChargePowerKw: 500,
    maxDischargePowerKw: 500,
    initialSocPercent: 50,
    minSocPercent: 15,
    maxSocPercent: 95,
    roundTripEfficiency: 0.92,
    degradationCostPerKwh: 0.012,
  },
  generator: {
    maxPowerKw: 600,
    fuelCostPerKwh: 0.28,
    minPowerKw: 0,
    startupCost: 15,
  },
  grid: {
    maxImportKw: 1500,
    peakDemandChargeRate: 12.50, // $12.50 per peak kW in 24h cycle
  },
  hourly: [
    { hour: 0,  timeLabel: '00:00', gridPrice: 0.082, campusDemand: 780,  solarForecast: 0 },
    { hour: 1,  timeLabel: '01:00', gridPrice: 0.078, campusDemand: 720,  solarForecast: 0 },
    { hour: 2,  timeLabel: '02:00', gridPrice: 0.075, campusDemand: 690,  solarForecast: 0 },
    { hour: 3,  timeLabel: '03:00', gridPrice: 0.074, campusDemand: 660,  solarForecast: 0 },
    { hour: 4,  timeLabel: '04:00', gridPrice: 0.074, campusDemand: 650,  solarForecast: 0 }, // Low demand point from mockup (650 kW)
    { hour: 5,  timeLabel: '05:00', gridPrice: 0.085, campusDemand: 710,  solarForecast: 0 },
    { hour: 6,  timeLabel: '06:00', gridPrice: 0.140, campusDemand: 850,  solarForecast: 15 },
    { hour: 7,  timeLabel: '07:00', gridPrice: 0.165, campusDemand: 980,  solarForecast: 75 },
    { hour: 8,  timeLabel: '08:00', gridPrice: 0.180, campusDemand: 1120, solarForecast: 190 },
    { hour: 9,  timeLabel: '09:00', gridPrice: 0.190, campusDemand: 1180, solarForecast: 340 },
    { hour: 10, timeLabel: '10:00', gridPrice: 0.185, campusDemand: 1140, solarForecast: 480 },
    { hour: 11, timeLabel: '11:00', gridPrice: 0.180, campusDemand: 1170, solarForecast: 590 },
    { hour: 12, timeLabel: '12:00', gridPrice: 0.195, campusDemand: 1210, solarForecast: 640 },
    { hour: 13, timeLabel: '13:00', gridPrice: 0.220, campusDemand: 1230, solarForecast: 610 },
    { hour: 14, timeLabel: '14:00', gridPrice: 0.320, campusDemand: 1240, solarForecast: 510 }, // On-peak pricing starts
    { hour: 15, timeLabel: '15:00', gridPrice: 0.340, campusDemand: 1210, solarForecast: 380 },
    { hour: 16, timeLabel: '16:00', gridPrice: 0.360, campusDemand: 1190, solarForecast: 220 },
    { hour: 17, timeLabel: '17:00', gridPrice: 0.380, campusDemand: 1260, solarForecast: 90 },
    { hour: 18, timeLabel: '18:00', gridPrice: 0.395, campusDemand: 1350, solarForecast: 10 }, // Peak demand point from mockup (1350 kW)
    { hour: 19, timeLabel: '19:00', gridPrice: 0.360, campusDemand: 1280, solarForecast: 0 },
    { hour: 20, timeLabel: '20:00', gridPrice: 0.310, campusDemand: 1190, solarForecast: 0 },
    { hour: 21, timeLabel: '21:00', gridPrice: 0.180, campusDemand: 1050, solarForecast: 0 },
    { hour: 22, timeLabel: '22:00', gridPrice: 0.120, campusDemand: 940,  solarForecast: 0 },
    { hour: 23, timeLabel: '23:00', gridPrice: 0.095, campusDemand: 840,  solarForecast: 0 },
  ],
};

export const DEFAULT_PRESET_NOTES = [
  'Storm alert: maintain battery storage above 60% after 17:00 as backup reserve.',
  'Quiet hours: do not run diesel backup generator between 22:00 and 06:00.',
  'Peak demand avoidance: cap grid import to 850 kW between 14:00 and 19:00.',
];

export const DEVICE_BREAKDOWN_DATA = [
  { name: 'Device 1 - Main Building', kwh: 2400, color: '#10b981', percentage: 15.6 },
  { name: 'Device 2 - Manufacturing', kwh: 4567, color: '#059669', percentage: 29.6 },
  { name: 'Device 3 - Office Block', kwh: 1890, color: '#047857', percentage: 12.3 },
  { name: 'Equipment', kwh: 3120, color: '#065f46', percentage: 20.2 },
  { name: 'HVAC Systems', kwh: 2240, color: '#064e3b', percentage: 14.5 },
  { name: 'Lighting', kwh: 1200, color: '#022c22', percentage: 7.8 },
];
