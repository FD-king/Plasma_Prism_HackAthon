import React from 'react';
import { Filter, ChevronDown, Sparkles } from 'lucide-react';

interface FilterBarProps {
  filterType: string;
  setFilterType: (v: string) => void;
  selectedDevice: string;
  setSelectedDevice: (v: string) => void;
  dataMode: string;
  setDataMode: (v: string) => void;
  timePeriod: string;
  setTimePeriod: (v: string) => void;
  onApply: () => void;
  isLoading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterType,
  setFilterType,
  selectedDevice,
  setSelectedDevice,
  dataMode,
  setDataMode,
  timePeriod,
  setTimePeriod,
  onApply,
  isLoading,
}) => {
  return (
    <div
      id="filter-toolbar"
      className="bg-gradient-to-r from-[#0e1724]/90 via-[#0a131f]/90 to-[#09101a]/90 border border-[#1c2c40]/80 rounded-xl p-3.5 shadow-xl shadow-cyan-950/10 my-2"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        {/* 1. Filter Type */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-type-select" className="text-xs text-[#94a3b8] font-medium flex items-center gap-1">
            <span>Filter Type</span>
          </label>
          <div className="relative">
            <select
              id="filter-type-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none bg-gradient-to-b from-[#131f2f] to-[#0d1622] border border-[#22364e] hover:border-[#325175] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 pr-8 cursor-pointer transition-all shadow-inner"
            >
              <option value="Individual Device">Individual Device</option>
              <option value="Campus Overall">Campus Overall</option>
              <option value="Battery Storage (BESS)">Battery Storage (BESS)</option>
              <option value="Solar PV + Microgrid">Solar PV + Microgrid</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-teal-400/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2. Select Device */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="select-device-select" className="text-xs text-[#94a3b8] font-medium">
            Select Device
          </label>
          <div className="relative">
            <select
              id="select-device-select"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full appearance-none bg-gradient-to-b from-[#131f2f] to-[#0d1622] border border-[#22364e] hover:border-[#325175] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 pr-8 cursor-pointer transition-all shadow-inner"
            >
              <option value="Main Building - Floor 1 Building A">
                ⚡ Main Building - Floor 1 Building A
              </option>
              <option value="Manufacturing Facility Block B">
                🏭 Manufacturing Facility Block B
              </option>
              <option value="Campus BESS 2000 kWh Battery">
                🔋 Campus BESS 2000 kWh Battery
              </option>
              <option value="Solar PV Array 650 kW">
                ☀️ Solar PV Array 650 kW
              </option>
              <option value="All Campus Feeders Aggregate">
                🌐 All Campus Feeders Aggregate
              </option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-teal-400/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 3. Data Mode */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="data-mode-select" className="text-xs text-[#94a3b8] font-medium">
            Data Mode
          </label>
          <div className="relative">
            <select
              id="data-mode-select"
              value={dataMode}
              onChange={(e) => setDataMode(e.target.value)}
              className="w-full appearance-none bg-gradient-to-b from-[#131f2f] to-[#0d1622] border border-[#22364e] hover:border-[#325175] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 pr-8 cursor-pointer transition-all shadow-inner"
            >
              <option value="Real-Time">Real-Time Telemetry</option>
              <option value="MILP Optimization">MILP Optimization</option>
              <option value="Scenario Simulation">Scenario Simulation</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-teal-400/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 4. Time Period */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="time-period-select" className="text-xs text-[#94a3b8] font-medium">
            Time Period
          </label>
          <div className="relative">
            <select
              id="time-period-select"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full appearance-none bg-gradient-to-b from-[#131f2f] to-[#0d1622] border border-[#22364e] hover:border-[#325175] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400 pr-8 cursor-pointer transition-all shadow-inner"
            >
              <option value="Today">Today (24 Hours Horizon)</option>
              <option value="Next 24 Hours">Next 24 Hours Horizon</option>
              <option value="Peak Window (14:00 - 19:00)">Peak Tariff Window</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-teal-400/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 5. Apply Filter Button */}
        <div className="flex flex-col">
          <button
            id="apply-filter-btn"
            onClick={onApply}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs py-2.5 px-4 rounded-lg transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Updating...' : 'Apply Filter'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
