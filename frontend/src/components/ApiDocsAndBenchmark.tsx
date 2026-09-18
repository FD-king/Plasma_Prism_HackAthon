import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Activity,
  Terminal,
} from 'lucide-react';

export const ApiDocsAndBenchmark: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [concurrency, setConcurrency] = useState(10);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const curlCommand = `curl -X POST "https://ais-dev-dxnx4xw6eerzez3fln57va-284975905594.asia-east1.run.app/api/optimize" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operatorNotes": [
      "Storm alert: maintain battery storage above 60% after 17:00.",
      "Quiet hours: do not run diesel backup generator between 22:00 and 06:00.",
      "Peak demand avoidance: cap grid import to 850 kW between 14:00 and 19:00."
    ]
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency }),
      });
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  return (
    <div
      id="api-docs-benchmark-container"
      className="bg-gradient-to-br from-[#0f1b29]/95 via-[#0b1420]/95 to-[#070d15]/95 border border-[#1d3047]/80 rounded-xl p-5 my-4 shadow-xl shadow-cyan-950/15"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#172738]">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Public HTTPS API & Redis Concurrency Engine
            </h3>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Production-grade RESTful interface supporting concurrent requests, LLM constraint translation, and single-flight Redis caching under 30 seconds per request.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/15 text-teal-300 border border-teal-500/35 shadow-sm">
            POST /api/optimize
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
        {/* Left: cURL & API Specs */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              cURL Request Example
            </span>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-[11px] text-teal-300 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded bg-[#101f30] border border-[#1c3650]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-teal-400" />}
              <span>{copied ? 'Copied!' : 'Copy cURL'}</span>
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-[#1e344d] shadow-md">
            <div className="bg-gradient-to-r from-[#0d1c2b] via-[#102438] to-[#0d1c2b] px-3 py-1.5 border-b border-[#1e344d] flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-[10px] text-[#64748b] ml-2 font-mono">bash &middot; curl</span>
            </div>
            <pre className="bg-[#070e17] p-3 text-[11px] font-mono text-teal-200/90 overflow-x-auto leading-relaxed">
              {curlCommand}
            </pre>
          </div>

          {/* Response Headers & Schema Specs */}
          <div className="bg-gradient-to-b from-[#0e1a27] to-[#09121d] border border-[#1b344d] rounded-xl p-3.5 text-xs flex flex-col gap-2 shadow-inner">
            <div className="font-semibold text-white text-xs">Response Headers & Guarantees:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#94a3b8]">
              <div>
                <code className="text-teal-300">X-Cache-Status</code>: HIT | MISS
              </div>
              <div>
                <code className="text-teal-300">X-Response-Time-Ms</code>: &lt; 30,000ms
              </div>
              <div>
                <code className="text-teal-300">X-Request-Id</code>: opt-uuid-v4
              </div>
              <div>
                <code className="text-teal-300">Redis-Deduplication</code>: Active
              </div>
            </div>
          </div>
        </div>

        {/* Right: High-Volume Operational Stress Tester */}
        <div className="bg-gradient-to-b from-[#0e1a27] to-[#09121d] border border-[#1b344d] rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                Live Concurrency Stress Benchmark
              </span>
              <span className="text-[10px] text-teal-300 font-mono bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                Single-Flight Shield
              </span>
            </div>

            <p className="text-xs text-[#94a3b8] mb-3 leading-relaxed">
              Simulate high-volume operational tasks by firing multiple concurrent HTTPS requests to the optimization engine to verify Redis cache hit rate and execution times.
            </p>

            <div className="flex items-center gap-3 mb-4 bg-[#070e17] p-2.5 rounded-lg border border-[#142638]">
              <label htmlFor="concurrency-range" className="text-xs text-[#94a3b8] font-medium">
                Concurrent Solves:
              </label>
              <input
                id="concurrency-range"
                type="range"
                min="2"
                max="50"
                step="2"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="flex-1 accent-teal-400"
              />
              <span className="font-mono font-extrabold text-xs text-teal-300 w-9 text-right">
                {concurrency}x
              </span>
            </div>

            <button
              onClick={runBenchmark}
              disabled={isRunningBenchmark}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-teal-500/25 disabled:opacity-50 cursor-pointer"
            >
              {isRunningBenchmark ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing {concurrency} Concurrent Solves...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute {concurrency} Concurrent API Requests</span>
                </>
              )}
            </button>
          </div>

          {/* Benchmark Results */}
          {benchmarkResult && (
            <div className="mt-4 pt-3 border-t border-[#172738] text-xs">
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-[#070e17] border border-[#1b344d] p-2.5 rounded-xl">
                  <div className="text-[10px] text-[#94a3b8]">Total Time</div>
                  <div className="text-sm font-bold text-white font-mono">
                    {benchmarkResult.totalElapsedMs}ms
                  </div>
                </div>
                <div className="bg-[#070e17] border border-[#1b344d] p-2.5 rounded-xl">
                  <div className="text-[10px] text-[#94a3b8]">Avg Latency</div>
                  <div className="text-sm font-bold text-teal-300 font-mono">
                    {benchmarkResult.averageLatencyMs}ms
                  </div>
                </div>
                <div className="bg-[#070e17] border border-[#1b344d] p-2.5 rounded-xl">
                  <div className="text-[10px] text-[#94a3b8]">Cache Hit Rate</div>
                  <div className="text-sm font-bold text-cyan-300 font-mono">
                    {benchmarkResult.cacheHitRate}
                  </div>
                </div>
              </div>

              {/* Sparkline bars of latencies with gradients */}
              <div className="flex items-end gap-1 h-14 w-full bg-[#050b12] p-1.5 rounded-xl border border-[#142638]">
                {benchmarkResult.individualLatencies?.map((item: any, i: number) => {
                  const maxDuration = Math.max(
                    ...benchmarkResult.individualLatencies.map((x: any) => x.durationMs),
                    10
                  );
                  const heightPercent = Math.max(15, (item.durationMs / maxDuration) * 100);
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t transition-all ${
                        item.cached ? 'bg-gradient-to-t from-emerald-500 to-teal-400' : 'bg-gradient-to-t from-cyan-500 to-sky-400'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`Request #${item.index}: ${item.durationMs}ms (${item.cached ? 'Redis Hit' : 'Fresh Compute'})`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-[#64748b] mt-1 font-mono">
                <span>Req #1</span>
                <span>Req #{concurrency}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
