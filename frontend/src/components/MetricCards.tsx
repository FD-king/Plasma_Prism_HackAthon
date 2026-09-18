import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Zap, BatteryCharging } from 'lucide-react';
import { OptimizationTotals } from '../types/energy';

interface MetricCardsProps {
  dataMode: string;
  totals?: OptimizationTotals | null;
  cacheHit?: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  dataMode,
  totals,
  cacheHit,
}) => {
  const isOptimizedMode = dataMode === 'MILP Optimization' && totals;

  return (
    <div
      id="top-kpi-metrics-grid"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-2"
    >
      {/* CARD 1: KVA / Cost */}
      <div
        id="metric-card-kva"
        className="relative overflow-hidden bg-gradient-to-br from-[#0f1c2b]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 hover:border-[#2d4b70] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-cyan-950/15 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
        
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
            {isOptimizedMode ? 'OPT COST' : 'KVA APPARENT'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-teal-300 border border-teal-500/30">
            {isOptimizedMode ? 'optimized' : 'normal'}
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            {isOptimizedMode ? (
              <span className="bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
                ${totals?.optimizedCost.toLocaleString()}
              </span>
            ) : (
              <>
                <span>1,245.6</span>
                <span className="text-xs font-normal text-[#94a3b8]">kVA</span>
              </>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {isOptimizedMode ? 'Total 24h Microgrid Cost' : 'Campus Apparent Power'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-teal-300 font-medium">
          {isOptimizedMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-${totals?.savingsAmount.toLocaleString()} ({totals?.savingsPercent}%)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-teal-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+5.2% vs yesterday</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: KWH / Energy Consumption */}
      <div
        id="metric-card-kwh"
        className="relative overflow-hidden bg-gradient-to-br from-[#0f1c2b]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 hover:border-[#2d4b70] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-cyan-950/15 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
            {isOptimizedMode ? 'NET IMPORT' : 'KWH ENERGY'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isOptimizedMode
              ? 'bg-gradient-to-r from-teal-950/80 to-cyan-950/80 text-cyan-300 border border-cyan-500/30'
              : 'bg-gradient-to-r from-amber-950/80 to-yellow-950/80 text-amber-300 border border-amber-500/30'
          }`}>
            {isOptimizedMode ? 'shaved' : 'high load'}
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            {isOptimizedMode ? (
              <>
                <span>10,854.2</span>
                <span className="text-xs font-normal text-[#94a3b8]">kWh</span>
              </>
            ) : (
              <>
                <span>8,932.4</span>
                <span className="text-xs font-normal text-[#94a3b8]">kWh</span>
              </>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {isOptimizedMode ? 'Net Grid Energy Imported' : 'Daily Energy Consumption'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-cyan-300 font-medium">
          {isOptimizedMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <Zap className="w-3.5 h-3.5" />
              <span>100% Solar Absorbed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12.8% on peak</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 3: KVAR / Peak Grid Demand */}
      <div
        id="metric-card-kvar"
        className="relative overflow-hidden bg-gradient-to-br from-[#0f1c2b]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 hover:border-[#2d4b70] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-cyan-950/15 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
            {isOptimizedMode ? 'PEAK GRID' : 'KVAR REAC'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-sky-950/80 to-blue-950/80 text-sky-300 border border-sky-500/30">
            {isOptimizedMode ? 'capped' : 'normal'}
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            {isOptimizedMode ? (
              <>
                <span>{totals?.optimizedPeakGridKw}</span>
                <span className="text-xs font-normal text-[#94a3b8]">kW</span>
              </>
            ) : (
              <>
                <span>342.1</span>
                <span className="text-xs font-normal text-[#94a3b8]">kVAR</span>
              </>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {isOptimizedMode ? 'Max Peak Coincident Grid kW' : 'Reactive Power Demand'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs font-medium">
          {isOptimizedMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-{totals?.peakReductionKw} kW ({totals?.peakReductionPercent}%)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-2.1% low lagging</span>
            </div>
          )}
        </div>
      </div>

      {/* CARD 4: PF / Redis Cache Status */}
      <div
        id="metric-card-pf"
        className="relative overflow-hidden bg-gradient-to-br from-[#0f1c2b]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 hover:border-[#2d4b70] rounded-xl p-4 flex flex-col justify-between transition-all duration-200 shadow-xl shadow-cyan-950/15 group"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-[#94a3b8] uppercase">
            {isOptimizedMode ? 'REDIS ENGINE' : 'POWER FACTOR'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-teal-300 border border-teal-500/30">
            optimal
          </span>
        </div>

        <div className="my-2.5">
          <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            {isOptimizedMode ? (
              <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent font-mono">
                {cacheHit ? 'CACHE HIT' : 'SOLVED'}
              </span>
            ) : (
              <>
                <span>0.92</span>
                <span className="text-xs font-normal text-teal-400">lag</span>
              </>
            )}
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            {isOptimizedMode ? 'Sub-Second Concurrency Cache' : 'System-Wide Power Factor'}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#94a3b8] font-medium">
          {isOptimizedMode ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-teal-300">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>{totals?.totalBatteryThroughputKwh} kWh Shifted</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-400">
              <Minus className="w-3.5 h-3.5" />
              <span>0.0% variance</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
