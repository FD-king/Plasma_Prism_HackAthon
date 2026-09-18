import React from 'react';
import { Database, Zap, Download } from 'lucide-react';

interface HeaderProps {
  redisConnected: boolean;
  cacheHitCount?: number;
  lastExecutionMs?: number;
}

export const Header: React.FC<HeaderProps> = ({
  redisConnected,
  lastExecutionMs,
}) => {
  return (
    <header
      id="main-app-header"
      className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1b293b]/70"
    >
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[1px] shadow-lg shadow-teal-500/20">
              <div className="w-full h-full bg-[#080d14] rounded-[7px] flex items-center justify-center">
                <Zap className="w-4 h-4 text-teal-300" />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              PRISMA
            </h1>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-teal-300 border border-teal-500/30 tracking-wider shadow-sm">
            ENERGY INTELLIGENCE
          </span>
        </div>
        <p className="text-xs md:text-sm text-[#94a3b8] mt-1">
          Campus Microgrid Mixed-Integer Linear Program (MILP) Dispatch & Optimization Console
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Redis Cache Status Pill with Gradient */}
        <div
          id="redis-status-pill"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#0d1f2d] to-[#0a1824] border border-[#1e3a4f] text-[#cbd5e1] shadow-sm shadow-cyan-950/20"
          title="Redis caching enabled for concurrent sub-second requests"
        >
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>Cache: <strong className="font-semibold text-teal-300">{redisConnected ? 'Redis Cluster' : 'In-Memory Redis'}</strong></span>
          {lastExecutionMs !== undefined && (
            <span className="text-cyan-300 text-[11px] font-mono ml-1 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40">
              {lastExecutionMs}ms
            </span>
          )}
        </div>

        {/* Download Frontend ZIP Button */}
        <a
          id="download-frontend-zip-button"
          href="/api/download-zip"
          download="prisma-energy-frontend.zip"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-500/25 via-teal-500/25 to-cyan-500/20 hover:from-emerald-500/35 hover:via-teal-500/35 hover:to-cyan-500/30 text-teal-200 border border-teal-500/40 hover:border-teal-400/60 shadow-sm transition-all cursor-pointer"
          title="Download the full frontend codebase as a ZIP archive"
        >
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span>Download Frontend ZIP</span>
        </a>

        {/* Real-time Monitoring Active Badge with Gradient Pulse */}
        <div
          id="monitoring-status-badge"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-[#07241d]/90 via-[#0b2923]/90 to-[#07221e]/90 border border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">Real-time monitoring active</span>
        </div>
      </div>
    </header>
  );
};
