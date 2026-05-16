# Air Quality Monitoring and Pollution Trend Visualization Dashboard

> MCA Capstone Project — **Plag Pro, Noida** (Enrolled 02-Mar-2026)

A full-stack web application that ingests real-time air-quality data from
**CPCB (data.gov.in)** and **OpenAQ v3**, computes the Air Quality Index per
Indian CPCB methodology, and presents an interactive dashboard with KPIs,
filters, hazardous-air alerts, and short-term forecasts.

---

## Project Tasks → Where Implemented

| # | Project Task | Location |
|---|--------------|----------|
| 1 | Collect AQI / PM2.5 / PM10 / CO / NO₂ / SO₂ / O₃ / temp / humidity | `backend/services/cpcbService.js`, `openAQService.js` |
| 2 | Clean & preprocess (missing values, outliers, units) | `backend/services/etlService.js` — `transform()` |
| 3 | Relational schema (location + time-series) | `backend/models/schema.sql` |
| 4 | ER diagram + system architecture | `docs/02_er_diagram.md`, `docs/03_architecture.md` |
| 5 | ETL pipeline | `backend/services/etlService.js`, `scripts/runIngest.js` |
| 6 | Backend REST APIs (Node.js Express) | `backend/server.js`, `routes/*`, `controllers/*` |
| 7 | KPIs (avg AQI, peak hours, trends, safe vs hazardous) | `backend/controllers/kpiController.js` |
| 8 | Interactive dashboard (React + Chart.js) | `frontend/src/App.jsx` + components |
| 9 | Filters (city, date, pollutant, AQI category) | `frontend/src/components/Filters.jsx` |
| 10 | Hazardous-air alert visualization | `frontend/src/components/AlertBanner.jsx` + `backend/controllers/alertController.js` |
| 11 | Short-term AQI forecasting | `backend/services/forecastService.js` |
| 12 | Responsive UI | `frontend/src/styles/app.css` (CSS Grid + media queries) |
| 13 | System testing | `backend/tests/smoke.test.js` |
| 14 | Documentation | `docs/01..06` + this README |

---

## Quick Start

### 1) Backend (Node.js Express + SQLite)

```powershell
cd backend
copy .env.example .env       # paste your CPCB / OpenAQ keys (optional)
npm install
npm run seed                 # OPTIONAL: load 30 days × 8 cities of synthetic data
npm run dev                  # http://localhost:5000
```

### 2) Frontend (React + Vite + Chart.js)

```powershell
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend.

### 3) Verify

```powershell
curl http://localhost:5000/api/health
```

Then open the dashboard at **http://localhost:5173**.

### 4) Switch to live data (real AQI from CPCB / OpenAQ)

The dashboard ships with synthetic seed data so you can demo immediately. To
get real numbers matching public portals, follow **[docs/07_live_data_setup.md](docs/07_live_data_setup.md)** —
get free API keys, run `npm run reset && npm run ingest`, and the "DATA SOURCE"
badge in the header flips from **SYNTHETIC** to **LIVE**.

---

## Repository Layout

```
MCA-Project/
├── backend/        Node.js + Express + SQLite + ETL + cron + forecasting
├── frontend/       React + Vite + Chart.js dashboard
├── docs/           Project overview, ER diagram, architecture, methodology, setup, final report
└── README.md       (you are here)
```

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Node.js 22.5+, Express 4, `node:sqlite` (built-in), axios, node-cron |
| Frontend | React 18, Vite 5, Chart.js 4 (react-chartjs-2), axios |
| Database | SQLite (WAL mode), 6 tables in 3NF, 5 indexes |
| Data Sources | CPCB (data.gov.in), OpenAQ v3, synthetic fallback |
| Forecasting | Linear regression + EMA ensemble (in-house, no ML lib) |
| Testing | Node.js built-in test runner |

---

## Key Features

- **AQI computation per CPCB methodology** — piecewise-linear sub-index formula with `max` aggregation; 7 pollutants supported.
- **Hourly ETL pipeline** — cron-driven extract/transform/load with idempotent inserts and full audit log.
- **Interactive dashboard** — 5 chart types, drill-down by clicking city cards or ranking rows.
- **Multi-axis filters** — city, pollutant, time range, AQI category.
- **Hazardous-air alerts** — auto-flagged at AQI > 300, surfaced as a dismissible banner.
- **Short-term forecasts** — 12-hour AQI prediction with confidence (R²) and visual differentiation from observed data.
- **Responsive** — works from 360px mobile to 1400px desktop.

---

## Documentation Map

| Doc | Audience | Content |
|-----|----------|---------|
| [01_project_overview](docs/01_project_overview.md) | Evaluator | Problem, objectives, scope, deliverables matrix |
| [02_er_diagram](docs/02_er_diagram.md) | Reviewer | ER diagram (ASCII + Mermaid), normalization, indexing |
| [03_architecture](docs/03_architecture.md) | Engineer | Layered architecture, data flow, API surface, tech rationale |
| [04_methodology](docs/04_methodology.md) | Examiner | Data sources, AQI math, ETL design, forecasting model, KPI definitions, viz choices, testing strategy |
| [05_setup_and_run](docs/05_setup_and_run.md) | Anyone running it | Prerequisites, commands, verification checklist, troubleshooting |
| [06_final_report](docs/06_final_report.md) | Viva committee | Abstract → conclusion, insights, limitations, future work, file inventory, BoM |

---

## Screenshots / Demo Tips

After `npm run seed && npm run dev` on backend, then `npm run dev` on frontend:

1. **Top of dashboard** — 7 KPI cards (avg AQI, peak, min, safe/hazardous hours, peak hour, days recorded).
2. **AQI trend chart** — observe the diurnal pattern (08:00 & 20:00 peaks).
3. **Pollutant bar chart** — green "Safe limit" bar makes WHO/CPCB exceedance obvious at a glance.
4. **Category donut** — proportion of hours in each AQI band for selected city.
5. **City ranking** — Delhi & Lucknow at the top (highest avg AQI).
6. **Forecast chart** — dashed purple line for next 12h, color-coded by predicted category.
7. **Alert banner** — appears when any city seeded a "Severe" AQI moment in the last 72 hours.

---

## Testing

```powershell
cd backend
npm test
```

All 8 tests should pass: API smoke tests + AQI calculation unit tests.

---

## License

MIT — see individual files for attribution. Built for MCA evaluation; data subject to CPCB / OpenAQ terms.

---

## Acknowledgements

- **Central Pollution Control Board, India** — data feed and AQI methodology.
- **OpenAQ Foundation** — public air-quality data infrastructure.
- **WHO Air Quality Guidelines (2021)** — reference thresholds.
- Plag Pro, Noida — MCA programme.
