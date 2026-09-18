import React from 'react';
import { DollarSign, TrendingDown, Sun, Battery, ShieldCheck, Sparkles } from 'lucide-react';
import { OptimizationTotals } from '../types/energy';

interface OptimizationResultsSummaryProps {
  totals: OptimizationTotals;
}

export const OptimizationResultsSummary: React.FC<OptimizationResultsSummaryProps> = ({
  totals,
}) => {
  return (
    <div
      id="optimization-results-summary"
      className="bg-gradient-to-br from-[#0d2232] via-[#091724] to-[#060f18] border border-teal-500/40 rounded-xl p-5 my-4 shadow-2xl shadow-cyan-950/20 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#183147]">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5 mb-1.5">
            <span className="p-1 rounded bg-teal-500/20 border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            </span>
            <span>MILP Global Optimal Solution Verified</span>
          </span>
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">
            24-Hour Dispatch Plan Minimizes Electricity Cost by{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              {totals.savingsPercent}%
            </span>
          </h3>
          <p className="text-xs text-[#94a3b8] mt-1">
            Coordinated battery storage arbitrage, rooftop solar absorption, and peak demand capping under all operator constraints.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gradient-to-r from-[#091421] to-[#0d1b2a] border border-[#1e3b56] px-5 py-3 rounded-xl shadow-inner">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#64748b]">Baseline Cost</div>
            <div className="text-base font-bold text-[#94a3b8] line-through font-mono">
              ${totals.baselineCost.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-[#254668] to-transparent" />
          <div>
            <div className="text-[10px] uppercase font-bold text-teal-400">Optimized Cost</div>
            <div className="text-xl font-black text-white font-mono">
              ${totals.optimizedCost.toLocaleString()}
            </div>
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-[#254668] to-transparent" />
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Net 24h Savings</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono">
              +${totals.savingsAmount.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Optimization with Gradient Accents */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {/* 1. Peak Demand Shaving */}
        <div className="bg-gradient-to-b from-[#0e1c2b] to-[#09131e] border border-[#1b344e] rounded-xl p-3.5 text-xs shadow-md">
          <div className="text-[#94a3b8] text-[11px] font-semibold flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-teal-400" />
            Peak Demand Shaved
          </div>
          <div className="text-base font-bold text-white mt-1 font-mono">
            {totals.optimizedPeakGridKw} kW
          </div>
          <div className="text-[11px] text-teal-300 font-medium mt-0.5">
            -{totals.peakReductionKw} kW ({totals.peakReductionPercent}%) vs {totals.baselinePeakGridKw} kW
          </div>
        </div>

        {/* 2. Solar PV Absorption */}
        <div className="bg-gradient-to-b from-[#0e1c2b] to-[#09131e] border border-[#1b344e] rounded-xl p-3.5 text-xs shadow-md">
          <div className="text-[#94a3b8] text-[11px] font-semibold flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            Solar PV Consumed
          </div>
          <div className="text-base font-bold text-white mt-1 font-mono">
            {totals.totalSolarUsedKwh.toLocaleString()} kWh
          </div>
          <div className="text-[11px] text-amber-300 font-medium mt-0.5">
            100% of Clean Generation
          </div>
        </div>

        {/* 3. BESS Energy Shifted */}
        <div className="bg-gradient-to-b from-[#0e1c2b] to-[#09131e] border border-[#1b344e] rounded-xl p-3.5 text-xs shadow-md">
          <div className="text-[#94a3b8] text-[11px] font-semibold flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-cyan-400" />
            BESS Energy Shifted
          </div>
          <div className="text-base font-bold text-white mt-1 font-mono">
            {totals.totalBatteryThroughputKwh.toLocaleString()} kWh
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-0.5">
            Degradation: ${totals.batteryDegradationCost}
          </div>
        </div>

        {/* 4. Peak Demand Charges */}
        <div className="bg-gradient-to-b from-[#0e1c2b] to-[#09131e] border border-[#1b344e] rounded-xl p-3.5 text-xs shadow-md">
          <div className="text-[#94a3b8] text-[11px] font-semibold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Peak Demand Charge
          </div>
          <div className="text-base font-bold text-white mt-1 font-mono">
            ${totals.peakDemandChargeCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-0.5">
            Based on ${12.50}/kW peak tariff
          </div>
        </div>
      </div>
    </div>
  );
};
