import React from 'react';
import { DEVICE_BREAKDOWN_DATA } from '../data/defaultScenario';
import { PieChart } from 'lucide-react';

export const EnergyConsumptionOverview: React.FC = () => {
  const totalKwh = 15417;

  // Calculate SVG Donut slice paths
  const radius = 72;
  const innerRadius = 46;
  const cx = 100;
  const cy = 100;

  // Gradients for slices
  const sliceGradients = [
    { id: 'grad-0', from: '#10b981', to: '#06b6d4' },
    { id: 'grad-1', from: '#0d9488', to: '#14b8a6' },
    { id: 'grad-2', from: '#0284c7', to: '#38bdf8' },
    { id: 'grad-3', from: '#6366f1', to: '#818cf8' },
    { id: 'grad-4', from: '#8b5cf6', to: '#a78bfa' },
  ];

  let cumulativeAngle = 0;
  const slices = DEVICE_BREAKDOWN_DATA.map((item, index) => {
    const fraction = item.kwh / totalKwh;
    const sliceAngle = fraction * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const ix1 = cx + innerRadius * Math.cos(startRad);
    const iy1 = cy + innerRadius * Math.sin(startRad);
    const ix2 = cx + innerRadius * Math.cos(endRad);
    const iy2 = cy + innerRadius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      L ${ix2} ${iy2}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}
      Z
    `;

    return {
      ...item,
      pathData,
      gradientId: sliceGradients[index % sliceGradients.length].id,
      fromColor: sliceGradients[index % sliceGradients.length].from,
      toColor: sliceGradients[index % sliceGradients.length].to,
    };
  });

  return (
    <div
      id="energy-consumption-overview-card"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 flex flex-col justify-between shadow-xl shadow-cyan-950/15"
    >
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-teal-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Energy Consumption Overview
          </h2>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Real-time proportional consumption distribution across all operational campus circuits
        </p>
      </div>

      {/* Donut Chart with Gradient Slices and Centered Total */}
      <div className="flex flex-col items-center justify-center my-4 relative">
        <svg viewBox="0 0 200 200" className="w-52 h-52 -rotate-90 filter drop-shadow-[0_0_12px_rgba(20,184,166,0.15)]">
          <defs>
            {sliceGradients.map((g) => (
              <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={g.from} />
                <stop offset="100%" stopColor={g.to} />
              </linearGradient>
            ))}
          </defs>
          {slices.map((slice, idx) => (
            <path
              key={idx}
              d={slice.pathData}
              fill={`url(#${slice.gradientId})`}
              stroke="#080e16"
              strokeWidth="2.5"
              className="hover:opacity-90 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <title>{`${slice.name}: ${slice.kwh.toLocaleString()} kWh (${slice.percentage}%)`}</title>
            </path>
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-2xl font-black text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
            {totalKwh.toLocaleString()}
          </span>
          <span className="text-[11px] text-[#94a3b8] font-medium leading-tight">
            Total kWh Today
          </span>
        </div>

        {/* Donut Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 mt-3 px-2 text-[11px] text-[#94a3b8]">
          {slices.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-[#09121d]/80 px-2 py-0.5 rounded-full border border-[#1a2d40]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: `linear-gradient(135deg, ${d.fromColor}, ${d.toColor})` }}
              />
              <span className="truncate max-w-[120px] text-slate-300">{d.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Device Status Breakdown List with Gradient Accents */}
      <div className="pt-3 border-t border-[#172738] flex flex-col gap-2">
        <div className="text-xs font-semibold text-[#94a3b8] mb-0.5 flex items-center justify-between">
          <span>Key Feeder Loads</span>
          <span className="text-[10px] text-teal-400 font-mono">STATUS: OPTIMAL</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1.5 hover:bg-[#101e2e]/60 px-2 rounded-lg transition-colors border border-transparent hover:border-[#1e344d]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-[#e2e8f0]">Device 1 - Main Building</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-white font-mono">2,400 kWh</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1.5 hover:bg-[#101e2e]/60 px-2 rounded-lg transition-colors border border-transparent hover:border-[#1e344d]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 shadow-sm shadow-teal-400/50" />
            <span className="text-[#e2e8f0]">Device 2 - Manufacturing</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-white font-mono">4,567 kWh</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs py-1.5 hover:bg-[#101e2e]/60 px-2 rounded-lg transition-colors border border-transparent hover:border-[#1e344d]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 shadow-sm shadow-cyan-400/50" />
            <span className="text-[#e2e8f0]">Device 3 - Research Labs</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="text-white font-mono">1,890 kWh</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
