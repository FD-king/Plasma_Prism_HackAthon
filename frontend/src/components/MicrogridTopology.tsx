import React, { useState } from 'react';
import {
  Battery,
  Sun,
  Zap,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Layers,
} from 'lucide-react';

export const MicrogridTopology: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<'bess' | 'solar' | 'generator' | 'grid'>('bess');

  return (
    <div
      id="microgrid-topology-container"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 my-4 shadow-xl shadow-cyan-950/15"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#172738]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Microgrid Physical Assets & Tariff Matrix Topology
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Real-time physical specifications, inverter conversion efficiencies, degradation costs, and utility tariff tiers powering the MILP formulation.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#0c1624] via-[#101d2d] to-[#0c1624] border border-[#1d334b] p-1 rounded-xl text-xs shadow-inner">
          <button
            onClick={() => setSelectedAsset('bess')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedAsset === 'bess'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-[#8ca398] hover:text-white'
            }`}
          >
            BESS Storage
          </button>
          <button
            onClick={() => setSelectedAsset('solar')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedAsset === 'solar'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-[#8ca398] hover:text-white'
            }`}
          >
            Solar PV Array
          </button>
          <button
            onClick={() => setSelectedAsset('generator')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedAsset === 'generator'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-[#8ca398] hover:text-white'
            }`}
          >
            Diesel Backup
          </button>
          <button
            onClick={() => setSelectedAsset('grid')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              selectedAsset === 'grid'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/15 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-[#8ca398] hover:text-white'
            }`}
          >
            Tariff & Grid
          </button>
        </div>
      </div>

      {/* Dynamic Asset Detailed View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Left 2 Cols: Main Asset Detail Specs */}
        <div className="lg:col-span-2 bg-gradient-to-b from-[#0e1a27] to-[#09121d] border border-[#1b344d] rounded-xl p-4 shadow-md">
          {selectedAsset === 'bess' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950/80 to-blue-950/80 border border-cyan-800/40 text-cyan-300 shadow-sm">
                    <Battery className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Lithium Iron Phosphate (LFP) BESS</h4>
                    <p className="text-[11px] text-[#94a3b8]">Containerized Energy Storage System (Substation Node 1)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-teal-300 border border-teal-500/30">
                  ONLINE • 99.4% HEALTH
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Usable Capacity</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">2,000 kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Max Charge / Disch</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">500 kW (0.25C)</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Round-Trip Efficiency</span>
                  <p className="text-base font-bold text-teal-300 font-mono mt-0.5">88.5% (η)</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Reserve Floor (SoC min)</span>
                  <p className="text-base font-bold text-amber-400 font-mono mt-0.5">20.0% (400 kWh)</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Degradation Cost</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.024 / kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Inverter Topology</span>
                  <p className="text-base font-bold text-cyan-300 font-mono mt-0.5">Four-Quadrant Bi-Dir</p>
                </div>
              </div>

              <div className="text-xs text-[#94a3b8] leading-relaxed pt-2 border-t border-[#162738]">
                <strong className="text-teal-300">MILP Formulation Guarantee:</strong> Enforces state-of-charge continuity constraint <code className="text-white font-mono">SoC[t] = SoC[t-1] + (P_ch[t]*η - P_dis[t]/η)*Δt</code>, preventing simultaneous charge and discharge through binary decision variables.
              </div>
            </div>
          )}

          {selectedAsset === 'solar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-950/80 to-yellow-950/80 border border-amber-800/40 text-amber-300 shadow-sm">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Campus Rooftop & Canopy Solar PV</h4>
                    <p className="text-[11px] text-[#94a3b8]">Bifacial Monocrystalline Array with String Optimizers</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-teal-300 border border-teal-500/30">
                  ONLINE • 100% ABSORBED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Peak Nameplate DC</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">650 kWp</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Inverter AC Capacity</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">580 kW AC</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Today Expected Energy</span>
                  <p className="text-base font-bold text-amber-300 font-mono mt-0.5">3,280 kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Orientation & Tilt</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">180° S / 22° Tilt</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Curtailment Penalty</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.00 (Zero Waste)</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Inverter Efficiency</span>
                  <p className="text-base font-bold text-teal-300 font-mono mt-0.5">97.8% CEC</p>
                </div>
              </div>

              <div className="text-xs text-[#94a3b8] leading-relaxed pt-2 border-t border-[#162738]">
                <strong className="text-amber-300">Solar Arbitrage Priority:</strong> The MILP engine channels mid-day peak solar directly into the campus base load, diverting all surplus into BESS storage to avoid exporting power at non-remunerative feed-in tariffs.
              </div>
            </div>
          )}

          {selectedAsset === 'generator' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-950/80 to-amber-950/80 border border-orange-800/40 text-orange-300 shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Tier 4 Final Diesel Backup Generator</h4>
                    <p className="text-[11px] text-[#94a3b8]">Standby Emergency GenSet with Sound Attenuation Enclosure</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-[#112334] to-[#0c1825] text-cyan-300 border border-[#1e3c5a]">
                  STANDBY • READY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Continuous Rating</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">500 kW / 625 kVA</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Marginal Fuel Cost</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.320 / kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Start-up Overhead</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$45.00 / start</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Min Stable Loading</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">150 kW (30%)</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Ramping Rate</span>
                  <p className="text-base font-bold text-teal-300 font-mono mt-0.5">50 kW / minute</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-[#94a3b8] uppercase font-semibold">Quiet Hours Enforcement</span>
                  <p className="text-base font-bold text-orange-300 font-mono mt-0.5">22:00 - 06:00 (Muted)</p>
                </div>
              </div>

              <div className="text-xs text-[#94a3b8] leading-relaxed pt-2 border-t border-[#162738]">
                <strong className="text-orange-300">Cost-Curve Logic:</strong> Due to fuel costs ($0.32/kWh), the MILP only dispatches the generator when utility tariff exceeds $0.32/kWh AND battery reserves are prioritized for subsequent emergency or peak hours.
              </div>
            </div>
          )}

          {selectedAsset === 'grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-950/80 to-teal-950/80 border border-teal-800/40 text-teal-300 shadow-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Utility Interconnection & Tariff Structure</h4>
                    <p className="text-[11px] text-[#94a3b8]">Commercial TOU-8-R Rate Schedule with Peak Demand Surcharges</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-teal-300 border border-teal-500/30">
                  1,500 kVA INTERCONNECT
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-teal-400 uppercase font-semibold">Super Off-Peak (00-06)</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.065 / kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-teal-400 uppercase font-semibold">Off-Peak (06-12)</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.082 / kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-amber-400 uppercase font-semibold">Mid-Peak (12-16, 21-24)</span>
                  <p className="text-base font-bold text-white font-mono mt-0.5">$0.165 / kWh</p>
                </div>
                <div className="bg-[#070e17] border border-[#162738] p-3 rounded-xl">
                  <span className="text-[10px] text-rose-400 uppercase font-semibold">On-Peak (16-21)</span>
                  <p className="text-base font-bold text-rose-300 font-mono mt-0.5">$0.380 / kWh</p>
                </div>
              </div>

              <div className="text-xs text-[#94a3b8] leading-relaxed pt-2 border-t border-[#162738]">
                <strong className="text-teal-300">Demand Charge Penalty:</strong> $12.50 per kW of maximum coincident 15-minute rolling average. By flattening the peak demand below 850 kW, PRISMA saves significant monthly utility surcharges.
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Operational Constraints & Health */}
        <div className="bg-gradient-to-b from-[#0e1a27] to-[#09121d] border border-[#1b344d] rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Telemetry Health & Redis Status
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#142638]">
                <span className="text-[#94a3b8]">Active Microgrid Node</span>
                <span className="font-mono text-white">Central Campus Sub 01</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#142638]">
                <span className="text-[#94a3b8]">MILP Solver Kernel</span>
                <span className="font-mono text-teal-300">Simplex + Branch & Bound</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#142638]">
                <span className="text-[#94a3b8]">Redis Deduplication</span>
                <span className="font-mono text-teal-300">Single-Flight Enabled</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-[#142638]">
                <span className="text-[#94a3b8]">LLM Constraint Parser</span>
                <span className="font-mono text-cyan-300">Gemini 3.8 Flash</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[#94a3b8]">Max Response Bound</span>
                <span className="font-mono text-white">&lt; 30,000 ms SLA</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#142638]">
            <div className="bg-gradient-to-r from-[#0b211a] to-[#091a22] border border-teal-500/30 p-2.5 rounded-xl text-[11px] text-teal-200 flex items-center gap-2 shadow-sm">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All IEEE 1547-2018 interconnection and grid safety limits verified.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
