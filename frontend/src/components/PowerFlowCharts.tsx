import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Download, Battery, Zap } from 'lucide-react';
import { HourlyPlanItem, OptimizationTotals } from '../types/energy';

interface PowerFlowChartsProps {
  hourlyPlan: HourlyPlanItem[];
  totals?: OptimizationTotals | null;
}

export const PowerFlowCharts: React.FC<PowerFlowChartsProps> = ({
  hourlyPlan,
  totals,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'balance' | 'battery' | 'cost'>('balance');

  // Prepare data for power balance stacked chart
  const balanceData = hourlyPlan.map((h) => ({
    time: h.timeLabel,
    gridImport: Math.round(h.gridImportKw),
    solarUsed: Math.round(h.solarUsedKw),
    batteryDischarge: Math.round(h.batteryDischargeKw),
    batteryCharge: Math.round(h.batteryChargeKw),
    generator: Math.round(h.generatorKw),
    campusDemand: Math.round(h.campusDemandKw),
    soc: h.batterySocPercent,
    gridPrice: h.gridPrice,
  }));

  // Prepare cumulative cost comparison
  let cumBaseline = 0;
  let cumOptimized = 0;
  const costData = hourlyPlan.map((h) => {
    const baseHourCost = h.campusDemandKw * h.gridPrice;
    cumBaseline += baseHourCost;
    cumOptimized += h.netCost;
    return {
      time: h.timeLabel,
      baselineCum: Math.round(cumBaseline),
      optimizedCum: Math.round(cumOptimized),
      hourlySavings: Math.round((baseHourCost - h.netCost) * 10) / 10,
    };
  });

  // Export CSV handler
  const handleExportCSV = () => {
    if (!hourlyPlan || hourlyPlan.length === 0) return;

    const headers = [
      'Hour',
      'Time',
      'Grid_Tariff_USD_per_kWh',
      'Campus_Demand_kW',
      'Solar_Generation_kW',
      'BESS_Charge_kW',
      'BESS_Discharge_kW',
      'BESS_SoC_Percent',
      'Generator_Output_kW',
      'Net_Grid_Import_kW',
      'Hourly_Cost_USD',
    ];

    const rows = hourlyPlan.map((h) => [
      h.hour,
      h.timeLabel,
      h.gridPrice.toFixed(4),
      h.campusDemandKw,
      h.solarUsedKw,
      h.batteryChargeKw,
      h.batteryDischargeKw,
      h.batterySocPercent,
      h.generatorKw,
      h.gridImportKw,
      h.netCost.toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PRISMA_24h_Dispatch_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="power-flow-analytics-card"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 my-4 shadow-xl shadow-cyan-950/15"
    >
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#172738]">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" />
            Power Balance & Dispatch Analytics
          </h3>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Synchronized generation mix, battery state-of-charge trajectory, and cumulative cost curve.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gradient-to-r from-[#0c1624] via-[#101d2d] to-[#0c1624] border border-[#1d334b] p-1 rounded-xl flex items-center gap-1 text-xs shadow-inner">
            <button
              onClick={() => setActiveChartTab('balance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeChartTab === 'balance'
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-[#8ca398] hover:text-white'
              }`}
            >
              Power Mix Balance
            </button>
            <button
              onClick={() => setActiveChartTab('battery')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeChartTab === 'battery'
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-[#8ca398] hover:text-white'
              }`}
            >
              BESS SoC Curve
            </button>
            <button
              onClick={() => setActiveChartTab('cost')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeChartTab === 'cost'
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-[#8ca398] hover:text-white'
              }`}
            >
              Cost Trajectory
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#122335] to-[#0c1824] text-teal-300 hover:text-white border border-[#20364d] hover:border-teal-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            title="Download CSV Dispatch Table"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Chart View 1: Power Balance Stacked Area Chart */}
      {activeChartTab === 'balance' && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 text-xs flex-wrap gap-2">
            <span className="text-[#94a3b8]">
              Supply Generation Mix (kW) meeting Total Campus Demand
            </span>
            <div className="flex items-center gap-3 text-[11px] flex-wrap">
              <span className="flex items-center gap-1.5 text-teal-300 bg-[#09121c] px-2 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
                Grid Import
              </span>
              <span className="flex items-center gap-1.5 text-amber-300 bg-[#09121c] px-2 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
                Solar PV
              </span>
              <span className="flex items-center gap-1.5 text-cyan-300 bg-[#09121c] px-2 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400" />
                BESS Discharge
              </span>
              <span className="flex items-center gap-1.5 text-orange-300 bg-[#09121c] px-2 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-orange-400 to-rose-400" />
                Generator
              </span>
              <span className="flex items-center gap-1.5 text-white bg-[#09121c] px-2 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-white" />
                Campus Demand
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={balanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGrid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#162738" vertical={false} />
                <XAxis dataKey="time" stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="bg-[#09121d] border border-[#1e3852] p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                          <p className="font-bold text-white mb-1.5 border-b border-[#1b2f44] pb-1">Hour {label}</p>
                          <p className="text-white flex justify-between gap-4">
                            <span>Campus Demand:</span>
                            <span className="font-mono font-bold">{dataPoint.campusDemand} kW</span>
                          </p>
                          <p className="text-teal-400 flex justify-between gap-4">
                            <span>Grid Import:</span>
                            <span className="font-mono font-semibold">{dataPoint.gridImport} kW</span>
                          </p>
                          <p className="text-amber-400 flex justify-between gap-4">
                            <span>Solar Output:</span>
                            <span className="font-mono font-semibold">{dataPoint.solarUsed} kW</span>
                          </p>
                          <p className="text-cyan-400 flex justify-between gap-4">
                            <span>BESS Discharge:</span>
                            <span className="font-mono font-semibold">{dataPoint.batteryDischarge} kW</span>
                          </p>
                          {dataPoint.batteryCharge > 0 && (
                            <p className="text-blue-400 flex justify-between gap-4">
                              <span>BESS Charging:</span>
                              <span className="font-mono font-semibold">+{dataPoint.batteryCharge} kW</span>
                            </p>
                          )}
                          {dataPoint.generator > 0 && (
                            <p className="text-orange-400 flex justify-between gap-4">
                              <span>Generator:</span>
                              <span className="font-mono font-semibold">{dataPoint.generator} kW</span>
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="solarUsed" stackId="1" stroke="#f59e0b" fill="url(#colorSolar)" />
                <Area type="monotone" dataKey="batteryDischarge" stackId="1" stroke="#06b6d4" fill="url(#colorBattery)" />
                <Area type="monotone" dataKey="generator" stackId="1" stroke="#f97316" fill="url(#colorGen)" />
                <Area type="monotone" dataKey="gridImport" stackId="1" stroke="#10b981" fill="url(#colorGrid)" />
                <Line type="monotone" dataKey="campusDemand" stroke="#ffffff" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart View 2: Battery State-of-Charge Trajectory */}
      {activeChartTab === 'battery' && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 text-xs flex-wrap gap-2">
            <span className="text-[#94a3b8]">
              Battery SoC Trajectory & Reserve Limits (20% Reserve Floor, 95% Absorption Ceiling)
            </span>
            <span className="text-teal-300 font-semibold flex items-center gap-1 bg-[#09121c] px-2.5 py-0.5 rounded-full border border-[#1a2d40]">
              <Battery className="w-3.5 h-3.5 text-teal-400" /> 2,000 kWh Installed BESS
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162738" vertical={false} />
                <XAxis dataKey="time" stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} ticks={[0, 20, 40, 60, 80, 100]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#09121d] border border-[#1e3852] p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                          <p className="font-bold text-white mb-1 border-b border-[#1b2f44] pb-1">Time {label}</p>
                          <p className="text-teal-400 flex justify-between gap-4">
                            <span>Battery SoC:</span>
                            <span className="font-mono font-bold text-sm">{d.soc}%</span>
                          </p>
                          <p className="text-[#94a3b8] flex justify-between gap-4">
                            <span>Stored Energy:</span>
                            <span className="font-mono font-semibold">{Math.round((d.soc / 100) * 2000)} kWh</span>
                          </p>
                          <p className="text-cyan-400 flex justify-between gap-4">
                            <span>Flow State:</span>
                            <span className="font-mono font-semibold">
                              {d.batteryCharge > 0 ? `Charging (+${d.batteryCharge} kW)` : d.batteryDischarge > 0 ? `Discharging (-${d.batteryDischarge} kW)` : 'Idle'}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={20} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Reserve Limit (20%)', fill: '#ef4444', fontSize: 10 }} />
                <ReferenceLine y={95} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: 'Charge Cap (95%)', fill: '#38bdf8', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#14b8a6', stroke: '#080e16' }}
                  activeDot={{ r: 5, fill: '#5eead4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart View 3: Cumulative Cost Curve */}
      {activeChartTab === 'cost' && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2 text-xs flex-wrap gap-2">
            <span className="text-[#94a3b8]">
              Cumulative Electricity Cost: Baseline ($) vs. MILP Optimal ($)
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-[#94a3b8] bg-[#09121c] px-2.5 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-3 h-0.5 bg-[#94a3b8]" /> Baseline (Unmanaged)
              </span>
              <span className="flex items-center gap-1.5 text-teal-300 font-semibold bg-[#09121c] px-2.5 py-0.5 rounded-full border border-[#1a2d40]">
                <span className="w-3 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400" /> PRISMA Solution
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={costData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#162738" vertical={false} />
                <XAxis dataKey="time" stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#334f6e" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      const diff = d.baselineCum - d.optimizedCum;
                      return (
                        <div className="bg-[#09121d] border border-[#1e3852] p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                          <p className="font-bold text-white mb-1 border-b border-[#1b2f44] pb-1">Time {label}</p>
                          <p className="text-[#94a3b8] flex justify-between gap-4">
                            <span>Baseline Total:</span>
                            <span className="font-mono">${d.baselineCum.toLocaleString()}</span>
                          </p>
                          <p className="text-teal-400 flex justify-between gap-4 font-semibold">
                            <span>MILP Optimized:</span>
                            <span className="font-mono">${d.optimizedCum.toLocaleString()}</span>
                          </p>
                          <p className="text-emerald-300 font-bold flex justify-between gap-4 pt-1 border-t border-[#1b2f44]">
                            <span>Accrued Savings:</span>
                            <span className="font-mono">+${diff.toLocaleString()}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="baselineCum" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="optimizedCum" stroke="#10b981" strokeWidth={2.5} dot={{ r: 2.5, fill: '#14b8a6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
