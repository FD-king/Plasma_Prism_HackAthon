import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, NavTabId } from './components/Sidebar';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { MetricCards } from './components/MetricCards';
import { EnergyConsumptionOverview } from './components/EnergyConsumptionOverview';
import { MaxVsActualDemand } from './components/MaxVsActualDemand';
import { SubmeteringFeederTable } from './components/SubmeteringFeederTable';
import { OperatorDirectivesPanel } from './components/OperatorDirectivesPanel';
import { OptimizationResultsSummary } from './components/OptimizationResultsSummary';
import { PowerFlowCharts } from './components/PowerFlowCharts';
import { HourlyDispatchTable } from './components/HourlyDispatchTable';
import { ApiDocsAndBenchmark } from './components/ApiDocsAndBenchmark';
import { MicrogridTopology } from './components/MicrogridTopology';
import { DEFAULT_CAMPUS_SCENARIO, DEFAULT_PRESET_NOTES } from './data/defaultScenario';
import {
  EnergyScenario,
  OptimizationResult,
} from './types/energy';
import {
  LayoutGrid,
  Sliders,
  BarChart3,
  FileCode,
  Layers,
  Sparkles,
  ScrollText,
  Monitor,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [viewMode, setViewMode] = useState<'continuous' | 'paginated'>('continuous');

  // Filter toolbar state
  const [filterType, setFilterType] = useState('Individual Device');
  const [selectedDevice, setSelectedDevice] = useState('Main Building - Floor 1 Building A');
  const [dataMode, setDataMode] = useState('Real-Time');
  const [timePeriod, setTimePeriod] = useState('Today');

  // Operator Notes & Optimization state
  const [notes, setNotes] = useState<string[]>(DEFAULT_PRESET_NOTES);
  const [scenario, setScenario] = useState<EnergyScenario>(DEFAULT_CAMPUS_SCENARIO);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [redisConnected, setRedisConnected] = useState(false);

  const mainScrollRef = useRef<HTMLElement>(null);

  // Fetch initial optimization on load
  const runOptimization = async (forceRefresh = false) => {
    setIsSolving(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          operatorNotes: notes,
          forceRefresh,
        }),
      });

      const response = await res.json();
      if (response.success && response.data) {
        setOptimizationResult(response.data);
        setRedisConnected(response.meta?.redisActive || false);
      }
    } catch (err) {
      console.error('Failed to run optimization:', err);
    } finally {
      setIsSolving(false);
    }
  };

  useEffect(() => {
    runOptimization(false);

    // Check health & redis status
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => {
        if (d?.cache?.redisConnected !== undefined) {
          setRedisConnected(d.cache.redisConnected);
        }
      })
      .catch(() => {});
  }, []);

  const handleApplyFilter = () => {
    if (dataMode === 'MILP Optimization' && !optimizationResult) {
      runOptimization(false);
    }
  };

  // Smooth scroll to section in continuous mode or switch tab
  const handleSelectTab = (tab: NavTabId) => {
    setActiveTab(tab);
    if (viewMode === 'continuous') {
      const targetElement = document.getElementById(`section-${tab}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Scroll spy for continuous mode
  useEffect(() => {
    if (viewMode !== 'continuous') return;

    const scrollContainer = mainScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const sections: NavTabId[] = ['dashboard', 'milp', 'dispatch', 'api', 'topology'];
      const scrollPos = scrollContainer.scrollTop + 140;

      for (const sectionId of sections) {
        const el = document.getElementById(`section-${sectionId}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveTab(sectionId);
            break;
          }
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070e0c] text-[#e2e8f0] font-sans antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onSelectTab={handleSelectTab} isContinuous={viewMode === 'continuous'} />

      {/* 2. Main Scrollable Container */}
      <main
        ref={mainScrollRef}
        className="flex-1 h-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-8 flex flex-col gap-5 scroll-smooth"
      >
        {/* Top Header - Branded PRISMA */}
        <Header
          redisConnected={redisConnected}
          lastExecutionMs={optimizationResult?.executionTimeMs}
        />

        {/* Continuous Flow Navigation Bar & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1612] border border-[#163327] px-3.5 py-2.5 rounded-xl text-xs">
          {/* Quick Page Jump Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleSelectTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#153427] text-[#34d399] border border-[#235841] shadow-sm'
                  : 'text-[#8ca398] hover:text-white hover:bg-[#0e221b]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>1. Overview Dashboard</span>
            </button>

            <button
              onClick={() => handleSelectTab('milp')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === 'milp'
                  ? 'bg-[#153427] text-[#34d399] border border-[#235841] shadow-sm'
                  : 'text-[#8ca398] hover:text-white hover:bg-[#0e221b]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>2. Operator & MILP Studio</span>
            </button>

            <button
              onClick={() => handleSelectTab('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === 'dispatch'
                  ? 'bg-[#153427] text-[#34d399] border border-[#235841] shadow-sm'
                  : 'text-[#8ca398] hover:text-white hover:bg-[#0e221b]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>3. Dispatch & Analytics</span>
            </button>

            <button
              onClick={() => handleSelectTab('api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === 'api'
                  ? 'bg-[#153427] text-[#34d399] border border-[#235841] shadow-sm'
                  : 'text-[#8ca398] hover:text-white hover:bg-[#0e221b]'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>4. HTTPS API & Benchmark</span>
            </button>

            <button
              onClick={() => handleSelectTab('topology')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeTab === 'topology'
                  ? 'bg-[#153427] text-[#34d399] border border-[#235841] shadow-sm'
                  : 'text-[#8ca398] hover:text-white hover:bg-[#0e221b]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5. Microgrid Topology</span>
            </button>
          </div>

          {/* Continuous vs Focused Page Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] text-[#6e8a7c] hidden md:inline">Mode:</span>
            <div className="bg-[#07130f] border border-[#163327] p-0.5 rounded-lg flex items-center text-[11px]">
              <button
                onClick={() => setViewMode('continuous')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'continuous'
                    ? 'bg-[#153427] text-[#34d399] font-semibold shadow-sm'
                    : 'text-[#8ca398] hover:text-white'
                }`}
                title="Continuous unified scrolling flow across all sections"
              >
                <ScrollText className="w-3 h-3" />
                <span>Continuous Flow</span>
              </button>
              <button
                onClick={() => setViewMode('paginated')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'paginated'
                    ? 'bg-[#153427] text-[#34d399] font-semibold shadow-sm'
                    : 'text-[#8ca398] hover:text-white'
                }`}
                title="Single page focus mode"
              >
                <Monitor className="w-3 h-3" />
                <span>Single Page</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <FilterBar
          filterType={filterType}
          setFilterType={setFilterType}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          dataMode={dataMode}
          setDataMode={setDataMode}
          timePeriod={timePeriod}
          setTimePeriod={setTimePeriod}
          onApply={handleApplyFilter}
          isLoading={isSolving}
        />

        {/* =========================================================
            PAGE 1: Real-Time Energy Dashboard
           ========================================================= */}
        {(viewMode === 'continuous' || activeTab === 'dashboard') && (
          <section id="section-dashboard" className="flex flex-col gap-4 scroll-mt-6">
            <div className="flex items-center justify-between pb-1 border-b border-[#142d22]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Page 1: Real-Time Energy Telemetry & Campus Overview
                </h2>
              </div>
              <span className="text-xs text-[#6e8a7c] font-mono">LIVE SCADA STREAM</span>
            </div>

            {/* Top 4 Metric KPI Cards - matching mockup */}
            <MetricCards
              dataMode={dataMode}
              totals={optimizationResult?.totals}
              cacheHit={optimizationResult?.cacheStatus === 'HIT'}
            />

            {/* Mockup Middle Grid: Energy Consumption Overview & Max vs Actual Demand */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-5 flex flex-col">
                <EnergyConsumptionOverview />
              </div>
              <div className="lg:col-span-7 flex flex-col">
                <MaxVsActualDemand
                  hourlyPlan={optimizationResult?.hourlyPlan}
                  showOptimizedOverlay={dataMode === 'MILP Optimization'}
                />
              </div>
            </div>

            {/* Real-Time Substation Feeder Telemetry Table */}
            <SubmeteringFeederTable />
          </section>
        )}

        {/* =========================================================
            PAGE 2: MILP Optimization & Operator Directives Studio
           ========================================================= */}
        {(viewMode === 'continuous' || activeTab === 'milp') && (
          <section id="section-milp" className="flex flex-col gap-4 scroll-mt-6 mt-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#142d22]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Page 2: MILP Optimization & Operator Directives Studio
                </h2>
              </div>
              <span className="text-xs text-[#6e8a7c] font-mono">LLM CONSTRAINT TRANSLATION &lt; 30s</span>
            </div>

            <OperatorDirectivesPanel
              notes={notes}
              setNotes={setNotes}
              directives={optimizationResult?.directivesApplied || []}
              onSolve={runOptimization}
              isSolving={isSolving}
              executionTimeMs={optimizationResult?.executionTimeMs}
              cacheHit={optimizationResult?.cacheStatus === 'HIT'}
            />
          </section>
        )}

        {/* =========================================================
            PAGE 3: Hourly Dispatch Schedule & Analytics
           ========================================================= */}
        {(viewMode === 'continuous' || activeTab === 'dispatch') && (
          <section id="section-dispatch" className="flex flex-col gap-4 scroll-mt-6 mt-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#142d22]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Page 3: 24-Hour Dispatch Plan & Power Flow Analytics
                </h2>
              </div>
              <span className="text-xs text-[#6e8a7c] font-mono">OPTIMAL ECONOMIC DISPATCH</span>
            </div>

            {/* Summary Totals Cards */}
            {optimizationResult && (
              <OptimizationResultsSummary totals={optimizationResult.totals} />
            )}

            {/* Power Flow Balance & Battery SoC Trajectory Charts */}
            {optimizationResult && (
              <PowerFlowCharts
                hourlyPlan={optimizationResult.hourlyPlan}
                totals={optimizationResult.totals}
              />
            )}

            {/* 24-Hour Dispatch Table */}
            {optimizationResult && (
              <HourlyDispatchTable hourlyPlan={optimizationResult.hourlyPlan} />
            )}
          </section>
        )}

        {/* =========================================================
            PAGE 4: Public HTTPS API & Redis Benchmark
           ========================================================= */}
        {(viewMode === 'continuous' || activeTab === 'api') && (
          <section id="section-api" className="flex flex-col gap-4 scroll-mt-6 mt-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#142d22]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Page 4: Public HTTPS API & Redis Concurrency Engine
                </h2>
              </div>
              <span className="text-xs text-[#6e8a7c] font-mono">POST /api/optimize • REDIS CACHED</span>
            </div>

            <ApiDocsAndBenchmark />
          </section>
        )}

        {/* =========================================================
            PAGE 5: Microgrid Assets & Physical Topology
           ========================================================= */}
        {(viewMode === 'continuous' || activeTab === 'topology') && (
          <section id="section-topology" className="flex flex-col gap-4 scroll-mt-6 mt-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#142d22]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#a7f3d0]">
                  Page 5: Microgrid Physical Assets & Tariff Topology
                </h2>
              </div>
              <span className="text-xs text-[#6e8a7c] font-mono">BESS • SOLAR PV • DIESEL • TOU MATRIX</span>
            </div>

            <MicrogridTopology />
          </section>
        )}

        {/* Unified Footer */}
        <footer className="mt-8 pt-4 pb-6 border-t border-[#142820] text-center text-xs text-[#6e8a7c] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="font-semibold text-white">PRISMA</span>
            <span>— Campus Energy Mixed-Integer Linear Program (MILP) Dispatch System</span>
          </div>
          <span className="font-mono text-[11px] text-[#8ca398]">
            Public Endpoint: <strong className="text-emerald-400">POST /api/optimize</strong> • Guaranteed &lt; 30s Execution
          </span>
        </footer>
      </main>
    </div>
  );
}
