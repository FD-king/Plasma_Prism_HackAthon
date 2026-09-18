# ⚡ AI-Driven Campus Energy Optimizer

> Translating operator guidelines into mathematical constraints to **slash campus utility bills**.

A full-stack system: a FastAPI + heuristic-dispatch Python backend with a 31-candidate peak-shaving MILP-style solver, paired with a React + TypeScript + Vite dashboard. The two services talk via the `/api/*` contract defined in `frontend/src/types/energy.ts`.

The LLM extractor runs on **Groq** (`openai/gpt-oss-120b`); a deterministic keyword heuristic is the no-key fallback so the demo never breaks.

---

## ⚡ One-minute quick start

```bash
# 1. Install dependencies (two layers)
python -m venv .venv && .venv\Scripts\activate          # Windows
# source .venv/bin/activate                              # macOS / Linux
pip install -r requirements.txt                          # backend

cd frontend
npm install --legacy-peer-deps                           # frontend
cd ..

# 2. (Optional) enable real Groq LLM translation
copy .env.example .env
# edit .env and paste your GROQ_API_KEY=gsk_...
# (free key from https://console.groq.com/keys)

# 3. Start the backend (FastAPI) — Terminal A
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
#  → http://127.0.0.1:8000/docs for interactive API

# 4. Start the frontend (Vite dev server) — Terminal B
cd frontend
npm run dev
#  → http://127.0.0.1:5173  (auto-proxies /api/* to backend on :8000)
```

---

## 🏗️ Architecture

```
   ┌─────────────────────────────────────────────────────────────────────┐
   │  React Frontend  (frontend/)  —  Vite + TypeScript                  │
   │   POST /api/optimize  { scenario, operatorNotes, forceRefresh }     │
   │   POST /api/benchmark { concurrency }                               │
   │   GET  /api/health, /api/scenarios/default, /api/redis-stats        │
   └─────────────────────────────┬───────────────────────────────────────┘
                                 │ (Vite proxy /api → :8000)
                                 ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │  Backend  (FastAPI)      backend/main.py                            │
   │   └─ cache.py         ──► sha256-keyed TTL cache + single-flight    │
   │   └─ llm_extractor.py ──► Groq openai/gpt-oss-120b + regex fallback │
   │   └─ directive_validator.py ──► 8 directives + cross-conflict fix  │
   │   └─ milp_solver.py   ──► heuristic dispatch + 31-candidate sweep   │
   │   └─ benchmark.py     ──► concurrent /optimize driver              │
   └─────────────────────────────┬───────────────────────────────────────┘
                                 │ OptimizationResponsePayload
                                 ▼
   ┌─────────────────────────────────────────────────────────────────────┐
   │  Dashboard: 24h schedule + 16 totals + directivesApplied + cache   │
   └─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project layout

```
PLASMA_PRISM_HackAthon_Task/
├── backend/
│   ├── __init__.py
│   ├── main.py                # FastAPI app: /api/health, /api/optimize, /api/benchmark
│   ├── models.py              # Pydantic mirror of frontend/src/types/energy.ts
│   ├── default_scenario.py    # Canonical 24h campus scenario
│   ├── directive_validator.py # 8-directive validator + conflict resolution
│   ├── llm_extractor.py       # Groq + heuristic fallback
│   ├── milp_solver.py         # 31-candidate peak-shaving dispatch
│   ├── cache.py               # In-memory TTL cache + single-flight
│   ├── benchmark.py           # Async concurrent driver
│   └── tests/                 # contract_smoke.py
├── frontend/
│   ├── index.html             # Vite entry HTML
│   ├── package.json           # Dependencies (React 19, Vite 8, recharts, motion)
│   ├── vite.config.ts         # Proxy /api → :8000
│   ├── tsconfig.json
│   ├── public/                # Static assets
│   └── src/
│       ├── App.tsx            # Main React app
│       ├── main.tsx           # Vite entry
│       ├── index.css          # Tailwind + globals
│       ├── types/energy.ts    # ← CONTRACT SOURCE OF TRUTH
│       ├── data/defaultScenario.ts
│       └── components/        # 13 React components (Header, Sidebar, MetricCards, …)
├── tests/
│   └── contract_smoke.py      # 9-step end-to-end contract verification
├── .env.example
├── requirements.txt
└── README.md
```

---

## 📡 API (backend → frontend contract)

All endpoints mounted under `/api/*`.

### `GET /api/health`
Returns liveness + cache stats + service info.

### `GET /api/scenarios/default`
Returns the canonical 24h `EnergyScenario` plus `defaultNotes` (3 preset directives).

### `POST /api/optimize`

Request:
```json
{
  "scenario": { /* partial EnergyScenario, merged with default */ },
  "operatorNotes": [
    "Storm alert: maintain battery above 60% after 17:00",
    "Quiet hours: no diesel 22:00 to 06:00",
    "Cap grid import to 850 kW 14:00-19:00"
  ],
  "forceRefresh": false
}
```

Response (truncated):
```json
{
  "success": true,
  "data": {
    "scenarioName": "Central Campus Microgrid (...)",
    "timestamp": "...",
    "hourlyPlan": [ { "hour": 0, "...13 fields..." }, ... ],
    "totals": { "16 fields..." },
    "directivesApplied": [ { "8 fields..." }, ... ],
    "solverStatus": "OPTIMAL",
    "executionTimeMs": 47,
    "cacheStatus": "MISS",
    "requestId": "req-..."
  },
  "meta": {
    "cached": false,
    "responseTimeMs": 1490,
    "requestId": "opt-...",
    "redisActive": false,
    "timestamp": "..."
  }
}
```

### `POST /api/benchmark`
Body `{concurrency: int (2..50, default 10)}` → fires N concurrent `/optimize`
calls, returns per-request latency + cache-hit rate.

### `GET /api/redis-stats`
Returns raw cache stats `{hits, misses, keysCount, redisConnected, backend, uptimeSeconds}`.

---

## 🧪 Verification

```bash
# 1. Start the backend (in one terminal)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000

# 2. Run the contract smoke test (in another terminal)
PYTHONIOENCODING=utf-8 python tests/contract_smoke.py
# → runs 9 checks: health, default scenario, optimize happy path,
#   field-name parity (16 totals + 13 hourly), cache hit, benchmark,
#   empty notes, garbage note, redis-stats

# 3. Start the frontend (third terminal)
cd frontend && npm run dev
# → http://127.0.0.1:5173 (Vite proxies /api/* to backend on :8000)
```

---

## 🚀 Performance budget

| Stage | Typical | Budget |
|---|---|---|
| Groq LLM extraction (`openai/gpt-oss-120b`) | 600–1100 ms | 4000 ms |
| 31-candidate dispatch sweep | 30–150 ms | 5000 ms |
| Cache hit | <5 ms | 50 ms |
| **Total `/optimize`** | **~1.5 s** | **< 30 s** |

---

## ⚙️ Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | _(unset)_ | Enables LLM extraction. Heuristic fallback runs otherwise. |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Override the Groq model. |
| `REDIS_URL` | _(unset)_ | When set, reports `redisConnected=true`. |
| `PORT` | `8000` | uvicorn port (backend). |
| `VITE_BACKEND_URL` | `http://127.0.0.1:8000` | Vite proxy target. |

---

## 🛡️ Engineering guardrails

- **No hardcoded secrets.** All credentials via `.env`.
- **LLM fails closed.** Invalid JSON, schema mismatch, network error → regex fallback (never raises).
- **Single-flight cache.** Concurrent identical requests deduplicate through a per-key `asyncio.Lock`.
- **Strict output validation.** 8-directive enum, 0–23 hour range, clamps per hardware spec.
- **Cross-directive conflict resolution.** min SoC > max SoC overlap → min is reduced.
- **Round-trip η = 0.92**, SoC bounded to `[15%, 95%]`, generator lockout overrides mandatory-run.
- **Optional LLM dependency.** Without `GROQ_API_KEY` the demo still runs end-to-end via the heuristic extractor.
- **All deps pinned** in `requirements.txt` (backend) and `frontend/package.json` (frontend).

---

## 📜 License

Built for the PLASMA_PRISM hackathon. All numbers are illustrative.
