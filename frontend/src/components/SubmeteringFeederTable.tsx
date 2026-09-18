import React, { useState } from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface FeederData {
  id: string;
  name: string;
  location: string;
  activeKw: number;
  currentAmps: number;
  voltage: number;
  powerFactor: number;
  status: 'normal' | 'high' | 'optimal';
  breakerState: 'CLOSED' | 'OPEN';
}

const INITIAL_FEEDERS: FeederData[] = [
  {
    id: 'fdr-01',
    name: 'Feeder A1 - Main Building Fl 1-3',
    location: 'Substation Alpha, Bay 1',
    activeKw: 342.5,
    currentAmps: 412.0,
    voltage: 480.2,
    powerFactor: 0.94,
    status: 'normal',
    breakerState: 'CLOSED',
  },
  {
    id: 'fdr-02',
    name: 'Feeder A2 - Engineering & Research Labs',
    location: 'Substation Alpha, Bay 2',
    activeKw: 285.0,
    currentAmps: 345.2,
    voltage: 479.8,
    powerFactor: 0.92,
    status: 'normal',
    breakerState: 'CLOSED',
  },
  {
    id: 'fdr-03',
    name: 'Feeder B1 - Advanced Manufacturing Facility',
    location: 'Substation Beta, Bay 1',
    activeKw: 468.2,
    currentAmps: 564.8,
    voltage: 478.9,
    powerFactor: 0.89,
    status: 'high',
    breakerState: 'CLOSED',
  },
  {
    id: 'fdr-04',
    name: 'Feeder B2 - Central HVAC & Chiller Plant',
    location: 'Central Utility Building',
    activeKw: 195.4,
    currentAmps: 236.1,
    voltage: 481.0,
    powerFactor: 0.96,
    status: 'optimal',
    breakerState: 'CLOSED',
  },
  {
    id: 'fdr-05',
    name: 'Feeder C1 - High-Performance Data Center',
    location: 'Facility C, Critical Bus',
    activeKw: 180.0,
    currentAmps: 216.5,
    voltage: 480.0,
    powerFactor: 0.98,
    status: 'optimal',
    breakerState: 'CLOSED',
  },
];

export const SubmeteringFeederTable: React.FC = () => {
  const [feeders, setFeeders] = useState<FeederData[]>(INITIAL_FEEDERS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSimulateRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setFeeders((prev) =>
        prev.map((f) => {
          const jitter = (Math.random() - 0.5) * 6;
          const newKw = Math.max(100, Math.round((f.activeKw + jitter) * 10) / 10);
          return {
            ...f,
            activeKw: newKw,
            currentAmps: Math.round(((newKw * 1000) / (Math.sqrt(3) * f.voltage * f.powerFactor)) * 10) / 10,
          };
        })
      );
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div
      id="submetering-feeder-panel"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 my-2 shadow-xl shadow-cyan-950/15"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#172738]">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Substation Feeder Telemetry & Sub-Metering
          </h3>
          <p className="text-xs text-[#94a3b8]">
            Real-time multi-circuit telemetry monitored across primary campus distribution switchgear.
          </p>
        </div>

        <button
          onClick={handleSimulateRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#122335] to-[#0c1824] text-[#cbd5e1] hover:text-white border border-[#20364d] hover:border-teal-500/40 text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : 'text-teal-400'}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      <div className="overflow-x-auto mt-3 rounded-xl border border-[#1a2d40] shadow-inner">
        <table className="w-full text-left text-xs text-[#cbd5e1] whitespace-nowrap">
          <thead className="bg-gradient-to-r from-[#0c1622] via-[#101d2d] to-[#0c1622] text-[#94a3b8] uppercase tracking-wider text-[10px] font-semibold border-b border-[#1a2d40]">
            <tr>
              <th className="py-2.5 px-3">Circuit / Feeder</th>
              <th className="py-2.5 px-3">Substation Location</th>
              <th className="py-2.5 px-3 font-mono">Active Power</th>
              <th className="py-2.5 px-3 font-mono">Current</th>
              <th className="py-2.5 px-3 font-mono">Bus Voltage</th>
              <th className="py-2.5 px-3 font-mono">Power Factor</th>
              <th className="py-2.5 px-3">Breaker</th>
              <th className="py-2.5 px-3 text-right">Operational State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152434]">
            {feeders.map((fdr) => (
              <tr key={fdr.id} className="hover:bg-[#101f30]/60 transition-colors">
                <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-400/50" />
                  <span>{fdr.name}</span>
                </td>
                <td className="py-2.5 px-3 text-[#94a3b8]">{fdr.location}</td>
                <td className="py-2.5 px-3 font-mono font-bold text-white">
                  {fdr.activeKw.toFixed(1)} kW
                </td>
                <td className="py-2.5 px-3 font-mono text-[#94a3b8]">
                  {fdr.currentAmps.toFixed(1)} A
                </td>
                <td className="py-2.5 px-3 font-mono text-[#94a3b8]">
                  {fdr.voltage.toFixed(1)} V
                </td>
                <td className="py-2.5 px-3 font-mono text-teal-300">
                  {fdr.powerFactor.toFixed(2)}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0c1825] text-teal-300 border border-[#1b344c]">
                    {fdr.breakerState}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                      fdr.status === 'optimal'
                        ? 'bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-emerald-300 border border-emerald-500/30'
                        : fdr.status === 'high'
                        ? 'bg-gradient-to-r from-amber-950/80 to-orange-950/80 text-amber-300 border border-amber-500/30'
                        : 'bg-gradient-to-r from-[#0e1d2c] to-[#0a1520] text-teal-200 border border-teal-500/20'
                    }`}
                  >
                    {fdr.status === 'high' ? (
                      <AlertCircle className="w-3 h-3 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className="capitalize">{fdr.status}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
