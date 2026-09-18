import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';
import { HourlyPlanItem } from '../types/energy';

interface MaxVsActualDemandProps {
  hourlyPlan?: HourlyPlanItem[];
  showOptimizedOverlay?: boolean;
}

export const MaxVsActualDemand: React.FC<MaxVsActualDemandProps> = ({
  hourlyPlan,
  showOptimizedOverlay = true,
}) => {
  const [showOptLine, setShowOptLine] = useState(true);

  // Format data for chart
  const data = (hourlyPlan || []).map((h) => ({
    time: h.timeLabel,
    actualDemand: h.campusDemandKw,
    optimizedGrid: h.gridImportKw,
    solarUsed: h.solarUsedKw,
    maxDemandLimit: 1200,
  }));

  return (
    <div
      id="max-vs-actual-demand-card"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 flex flex-col justify-between shadow-xl shadow-cyan-950/15"
    >
      {/* Card Header & Controls */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <h2 className="text-base font-bold text-white tracking-tight">
                Max vs Actual Demand
              </h2>
            </div>
            <p className="text-xs text-[#94a3b8] mt-1">
              Real-time telemetry of peak power demand against 24-hour campus baseline
            </p>
          </div>

          {showOptimizedOverlay && hourlyPlan && (
            <button
              id="toggle-opt-line-btn"
              onClick={() => setShowOptLine(!showOptLine)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shadow-sm ${
                showOptLine
                  ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border-teal-500/40 shadow-teal-500/10'
                  : 'bg-[#101b27] text-[#64748b] border-[#1d2d3e]'
              }`}
            >
              {showOptLine ? '✓ MILP Peak Shaving Active' : '+ Show MILP Overlay'}
            </button>
          )}
        </div>

        {/* Top 3 Summary Metrics in Gradient Container */}
        <div className="flex items-center justify-around my-4 py-2.5 bg-gradient-to-r from-[#0a121d] via-[#101c2c] to-[#0a121d] border border-[#1d3248] rounded-xl shadow-inner">
          <div className="text-center">
            <div className="text-lg md:text-xl font-extrabold text-white tracking-tight font-mono">
              1,058 kW
            </div>
            <div className="text-[11px] text-[#94a3b8]">Avg 24h Demand</div>
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-[#223b56] to-transparent" />
          <div className="text-center">
            <div className="text-lg md:text-xl font-extrabold text-white tracking-tight font-mono">
              1,350 kW
            </div>
            <div className="text-[11px] text-amber-400/90 font-medium">Unmitigated Peak</div>
          </div>
          <div className="h-8 w-[1px] bg-gradient-to-b from-transparent via-[#223b56] to-transparent" />
          <div className="text-center">
            <div className="text-lg md:text-xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tight font-mono">
              88.5%
            </div>
            <div className="text-[11px] text-teal-400 font-medium">Grid Efficiency</div>
          </div>
        </div>
      </div>

      {/* 24-Hour Curve Chart */}
      <div className="h-60 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#162738" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#334f6e"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              interval={1}
            />
            <YAxis
              stroke="#334f6e"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              domain={[0, 1500]}
              ticks={[0, 350, 700, 1050, 1400]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#09121d] border border-[#1e3852] p-3 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                      <p className="font-bold text-white mb-1.5 border-b border-[#1b2f44] pb-1">Hour {label}</p>
                      <p className="text-teal-400 flex items-center justify-between gap-4">
                        <span>Actual Demand:</span>
                        <span className="font-mono font-bold">{payload[0]?.value} kW</span>
                      </p>
                      {payload[1] && (
                        <p className="text-cyan-400 flex items-center justify-between gap-4">
                          <span>MILP Grid Import:</span>
                          <span className="font-mono font-bold">{payload[1]?.value} kW</span>
                        </p>
                      )}
                      <p className="text-rose-400 text-[10px] mt-1 pt-1 border-t border-[#1b2f44] flex justify-between">
                        <span>Threshold Ceiling:</span>
                        <span className="font-mono">1,200 kW</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Threshold Max Demand dashed reference line */}
            <ReferenceLine
              y={1200}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Actual Demand Line (Luminous Emerald-Teal Curve) */}
            <Line
              type="monotone"
              dataKey="actualDemand"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#14b8a6', stroke: '#080e16', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#5eead4' }}
            />

            {/* Optimized Grid Import (Cyan Shaved Peak Curve) */}
            {showOptimizedOverlay && showOptLine && (
              <Line
                type="monotone"
                dataKey="optimizedGrid"
                stroke="#06b6d4"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 2.5, fill: '#38bdf8' }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend with Gradient Badges */}
      <div className="flex items-center justify-center gap-5 text-xs text-[#94a3b8] mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-[#09121c] px-2.5 py-1 rounded-full border border-[#1a2d40]">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400" />
          <span className="text-teal-300 font-medium">Actual Demand</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#09121c] px-2.5 py-1 rounded-full border border-[#1a2d40]">
          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500" />
          <span className="text-rose-400 font-medium">1,200 kW Max Cap</span>
        </div>

        {showOptimizedOverlay && showOptLine && (
          <div className="flex items-center gap-1.5 bg-[#09121c] px-2.5 py-1 rounded-full border border-[#1a2d40]">
            <span className="w-3.5 h-0.5 border-t-2 border-dashed border-cyan-400" />
            <span className="text-cyan-300 font-medium">MILP Optimized Grid Import</span>
          </div>
        )}
      </div>

      {/* Demand Analysis Footer Table */}
      <div className="pt-3 border-t border-[#172738] flex flex-col gap-1.5 text-xs">
        <div className="font-semibold text-[#94a3b8] mb-0.5">Peak Demand Analysis</div>

        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#94a3b8]">Peak Coincident Hour</span>
          <span className="font-medium text-white font-mono">18:00 (1,350 kW Demand)</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#94a3b8]">Low Base Hour</span>
          <span className="font-medium text-white font-mono">04:00 (650 kW Demand)</span>
        </div>

        <div className="flex items-center justify-between py-0.5">
          <span className="text-[#94a3b8]">Peak Demand Variance</span>
          <span className="font-medium text-teal-300 font-mono">700 kW (58.3% Swing)</span>
        </div>
      </div>
    </div>
  );
};
