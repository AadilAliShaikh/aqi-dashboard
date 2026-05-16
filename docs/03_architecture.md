# System Architecture

## High-Level View

```
+-------------------------+      +--------------------------+      +---------------------+
|                         |      |                          |      |                     |
|   External Data Feeds   |      |     Backend (Node.js)    |      |   Frontend (React)  |
|                         |      |                          |      |                     |
| - CPCB / data.gov.in    +----->|  ETL Service (cron 1hr)  +----->|  Vite + Chart.js    |
| - OpenAQ v3 API         |      |    extract → transform   |      |  REST consumer      |
|                         |      |    → load → AQI calc     |      |  (axios)            |
+-------------------------+      |                          |      |                     |
                                 |  Express REST API        |<-----+                     |
                                 |    /locations            |      |  Filters / Charts   |
                                 |    /air-quality          |      |  Alerts / Forecast  |
                                 |    /kpi/*                |      |                     |
                                 |    /forecast/:city       |      +---------------------+
                                 |    /alerts/*             |
                                 |                          |
                                 |  Forecast Service        |
                                 |    (LinReg + EMA)        |
                                 |                          |
                                 |  SQLite (WAL)            |
                                 +--------------------------+
```

## Layered Decomposition

| Layer | Module(s) | Responsibility |
|-------|-----------|----------------|
| **Presentation** | `frontend/src/components/*` | Render dashboard, capture user filters, format human-readable output (colors, advice). |
| **API / Controller** | `backend/routes/*`, `controllers/*` | HTTP entry points, validation, response shaping. |
| **Service** | `services/etlService.js`, `forecastService.js`, `aqiCalculator.js` | Pure business logic, no HTTP coupling. |
| **Integration** | `services/cpcbService.js`, `services/openAQService.js` | Adapter to external APIs (encapsulates auth, pagination, normalization). |
| **Persistence** | `models/schema.sql`, `config/db.js` | DDL, prepared statements, transactions. |

## Data Flow (one ingestion cycle)

1. `cron` triggers `etlService.runFullPipeline()` every hour (configurable).
2. **Extract** — pulls latest records from CPCB and OpenAQ.
3. **Transform** — discards NaNs/negatives, normalizes timestamps to ISO 8601, harmonizes pollutant codes (`PM2.5` → `pm25`).
4. **Load** — inserts into `locations` (idempotent) + `measurements` (UNIQUE on `(location, pollutant, timestamp)` prevents duplicates).
5. **Compute** — for each touched location, fetch last hour of pollutant values, run CPCB sub-index formulae → `aqi_records`.
6. **Alert** — if AQI > 300, emit row into `alerts`.
7. **Audit** — every run logged in `etl_runs` with `status` and counts.

## API Surface (REST)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Liveness + DB row count |
| GET | `/api/locations` | All monitoring stations |
| GET | `/api/locations/cities` | Distinct city list (for filter dropdown) |
| GET | `/api/air-quality` | Raw measurements with optional filters |
| GET | `/api/air-quality/latest` | Latest AQI per location |
| GET | `/api/air-quality/trends` | Daily averages for a pollutant in a city |
| GET | `/api/air-quality/aqi-trend` | Hourly AQI series for a city |
| GET | `/api/kpi/summary` | Avg/peak/min AQI, safe vs hazardous hours |
| GET | `/api/kpi/pollutant-breakdown` | Avg/peak per pollutant w.r.t. safe threshold |
| GET | `/api/kpi/category-distribution` | Donut data (Good/Moderate/…/Severe counts) |
| GET | `/api/kpi/city-ranking` | Cities ranked by avg AQI |
| GET | `/api/forecast/:city` | Next-N-hours AQI forecast |
| GET | `/api/alerts/active` | Unacknowledged alerts |
| POST | `/api/alerts/:id/acknowledge` | Dismiss an alert |
| POST | `/api/etl/run` | Manually trigger ETL |

## Technology Choices — Rationale

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Node.js + Express | Lightweight, async I/O for API calls, large package ecosystem. |
| DB | SQLite via Node's built-in `node:sqlite` | Zero-setup, file-based, fully ACID, no native compile step (Node 22.5+). Ideal for an MCA-scale demo; SQL is production-equivalent for PostgreSQL/MySQL with minor type tweaks. |
| Frontend | React 18 + Vite | Standard SPA framework with fast HMR build tooling. |
| Charts | Chart.js + react-chartjs-2 | Mature, declarative, supports time-series, donut, bar in one library. |
| Scheduling | `node-cron` | Cron-syntax scheduling inside the process — no external scheduler needed for demo. |

## Non-Functional Considerations
- **Performance**: indexed time-range queries; prepared statements; WAL journal mode for concurrent read/write.
- **Reliability**: ETL wrapped in a SQLite transaction → all-or-nothing batch insertion.
- **Extensibility**: integration adapters (`*Service.js`) keep external API quirks isolated; adding a new feed (e.g., AirVisual) is one file.
- **Observability**: `etl_runs` table doubles as an audit log; `morgan` logs every HTTP request.
- **Security**: CORS scoped to the dev origin; `.env` excluded from git; API keys never inlined; SQL via parameterized statements (no string concatenation).
