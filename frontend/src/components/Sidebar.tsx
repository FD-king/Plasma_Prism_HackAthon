import React from 'react';
import {
  Zap,
  LayoutGrid,
  BarChart3,
  Sliders,
  FileCode,
  Layers,
  User,
} from 'lucide-react';

export type NavTabId = 'dashboard' | 'milp' | 'dispatch' | 'api' | 'topology';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isContinuous?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside
      id="main-sidebar"
      className="w-16 md:w-20 bg-gradient-to-b from-[#090e17] via-[#070c13] to-[#05080e] border-r border-[#1a293b]/70 flex flex-col items-center py-5 justify-between select-none z-30 shrink-0 shadow-xl"
    >
      {/* Top Brand Logo */}
      <div className="flex flex-col items-center gap-7 w-full">
        <button
          id="brand-logo-btn"
          onClick={() => onSelectTab('dashboard')}
          className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-[1px] shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 group"
          title="PRISMA Energy Intelligence Platform"
        >
          <div className="w-full h-full bg-[#080d14] rounded-[11px] flex items-center justify-center group-hover:bg-[#0c1520] transition-colors">
            <Zap className="w-5 h-5 text-teal-300 fill-teal-400/30 group-hover:scale-110 transition-transform" />
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="flex flex-col items-center gap-3 w-full px-2" aria-label="Main Navigation">
          <button
            id="nav-dashboard-btn"
            onClick={() => onSelectTab('dashboard')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/10 text-teal-300 shadow-md border border-teal-500/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0f1724]'
            }`}
            title="Real-Time Energy Dashboard"
          >
            <LayoutGrid className="w-5 h-5" />
            {activeTab === 'dashboard' && (
              <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r shadow-sm shadow-emerald-400" />
            )}
          </button>

          <button
            id="nav-milp-btn"
            onClick={() => onSelectTab('milp')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
              activeTab === 'milp'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/10 text-teal-300 shadow-md border border-teal-500/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0f1724]'
            }`}
            title="MILP Optimizer & Operator Directives Studio"
          >
            <Sliders className="w-5 h-5" />
            {activeTab === 'milp' && (
              <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r shadow-sm shadow-emerald-400" />
            )}
          </button>

          <button
            id="nav-dispatch-btn"
            onClick={() => onSelectTab('dispatch')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
              activeTab === 'dispatch'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/10 text-teal-300 shadow-md border border-teal-500/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0f1724]'
            }`}
            title="Hourly Dispatch Plan & Analytics"
          >
            <BarChart3 className="w-5 h-5" />
            {activeTab === 'dispatch' && (
              <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r shadow-sm shadow-emerald-400" />
            )}
          </button>

          <button
            id="nav-api-btn"
            onClick={() => onSelectTab('api')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
              activeTab === 'api'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/10 text-teal-300 shadow-md border border-teal-500/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0f1724]'
            }`}
            title="Public HTTPS API & Redis Benchmark"
          >
            <FileCode className="w-5 h-5" />
            {activeTab === 'api' && (
              <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r shadow-sm shadow-emerald-400" />
            )}
          </button>

          <button
            id="nav-topology-btn"
            onClick={() => onSelectTab('topology')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
              activeTab === 'topology'
                ? 'bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/10 text-teal-300 shadow-md border border-teal-500/30'
                : 'text-[#64748b] hover:text-[#94a3b8] hover:bg-[#0f1724]'
            }`}
            title="Microgrid Topology & Asset Specs"
          >
            <Layers className="w-5 h-5" />
            {activeTab === 'topology' && (
              <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-gradient-to-b from-emerald-400 to-teal-400 rounded-r shadow-sm shadow-emerald-400" />
            )}
          </button>
        </nav>
      </div>

      {/* Bottom Profile Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          id="user-profile-icon-btn"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#64748b] hover:text-[#cbd5e1] hover:bg-[#0f1724] transition-colors"
          title="PRISMA System Operator"
        >
          <User className="w-5 h-5" />
        </button>

        <div
          id="user-avatar-initials"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#122335] to-[#0b1724] border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center tracking-wider shadow-inner shadow-teal-950/50"
          title="PRISMA Operator Console"
        >
          PR
        </div>
      </div>
    </aside>
  );
};
