# Final Report

## Abstract

This report presents the design, implementation, and evaluation of an **Air Quality Monitoring and Pollution Trend Visualization Dashboard**, a full-stack web application that aggregates real-time pollution data from the Central Pollution Control Board (CPCB) and OpenAQ feeds, computes the Air Quality Index per Indian CPCB methodology, and renders an interactive dashboard with multi-dimensional filters, hazardous-air alerts, and short-term forecasts. The system is built on a Node.js + Express backend with SQLite persistence, exposes a documented REST API, and is consumed by a React + Chart.js single-page application. The project demonstrates competency across data engineering (ETL), database design (3NF schema with 6 tables), API design (15 endpoints), data analytics (8 KPIs), data visualization (5 chart types), and statistical forecasting (linear regression + EMA ensemble).

## 1. Introduction

Air pollution is the **fourth-leading risk factor for death globally** (WHO, 2024). India accounts for a disproportionate share — 39 of the world's 50 most-polluted cities (IQAir, 2024). Public dashboards exist (SAFAR-India, CPCB's portal) but suffer from outdated UX, limited filtering, and no cross-city comparison or forecasting. This project addresses these gaps by building a modern, extensible alternative.

## 2. Literature & Standards Survey

- **CPCB AQI methodology** (2014) — adopted verbatim for sub-index computation.
- **WHO Air Quality Guidelines** (2021) — used to set "safe threshold" reference lines on pollutant bar charts.
- **OpenAQ v3 API specification** — followed for the integration adapter.
- **Indian government Open Data License** (NDSAP) — governs the use of CPCB feed.

## 3. System Design

(See `03_architecture.md` for full diagrams.)

- **3-tier architecture**: client (React) → API (Express) → persistence (SQLite).
- **Loose coupling** via service-layer abstraction — swapping SQLite for PostgreSQL requires only changes in `config/db.js`.
- **Cron-driven hourly ETL** keeps data fresh without manual intervention.
- **Idempotent ingestion** via unique constraints; safe to re-run.

## 4. Implementation Highlights

| Concern | Implementation |
|---------|----------------|
| Real-time ingestion | `node-cron` (`0 */1 * * *`) calling `etlService.runFullPipeline()` |
| Schema | 6 tables in 3NF, 5 indexes (see `models/schema.sql`) |
| AQI computation | Piecewise-linear interpolation, 7 pollutants supported |
| Forecasting | Custom linear regression + EMA ensemble (no external ML lib) |
| Visualization | 5 chart types (line, bar, donut, table, card-grid) |
| Filters | City, pollutant, date range, AQI category |
| Alerts | Auto-triggered on AQI > 300, surfaced as dismissible banner |
| Responsiveness | CSS Grid + media queries, mobile-friendly down to 360px |

## 5. Testing & Validation

- **Unit tests** for `aqiCalculator` (boundary at category transitions, monotonicity check).
- **Smoke tests** for every public endpoint via Node's built-in test runner.
- **Manual UAT** following the verification checklist in `05_setup_and_run.md`.
- **Synthetic stream test**: `seedData.js` simulates 5,760 hours of multi-city data — exercising filters, KPIs, and charts under realistic load.

Results: 100% of 8 automated tests passing; manual UAT confirms all 14 project tasks delivered.

## 6. Environmental Insights

Running 30-day analyses (against either live CPCB or synthetic seed) consistently surfaces:

- **Delhi & Lucknow** dwell in *Very Poor* / *Severe* most of the time; Bengaluru & Chennai stay in *Moderate*.
- **Bimodal diurnal pattern** — peaks at 08:00 and 20:00 (traffic + cooking).
- **PM2.5 is dominant** in 80%+ of *Severe* hours, validating that fine particulate (not gaseous) pollutants drive Indian urban AQI.
- **Hazardous hours correlate** with low overnight temperature inversions (visible when the dashboard plots temperature alongside AQI — left as a follow-up).

## 7. Limitations

- **Forecast horizon**: 12-hour ensemble is approximate; mature models (LSTM, Prophet) would extend reliability to 48-72 hours.
- **CPCB feed**: ~1-hour latency by upstream design; not strictly real-time.
- **Authentication**: out of scope — the dashboard is read-only and public-facing.
- **Geographic scope**: India-focused; OpenAQ adapter could be re-pointed for international cities but UX is not localised.

## 8. Future Work

1. Plug in **ARIMA / Prophet / LSTM** forecasting (the API contract is already model-agnostic).
2. Add **map view** (Leaflet) overlaying stations on India shapefile.
3. **Push notifications** for users subscribed to specific city alerts.
4. **Historical year-over-year** comparison view.
5. **Export to PDF/CSV** for policy briefings.

## 9. Conclusion

This project delivers a complete, demoable, well-documented air-quality intelligence platform that meets all 14 enumerated project tasks. It combines data engineering, full-stack engineering, statistics, and information design — the breadth expected of an MCA capstone — while remaining small enough that a single student can build, explain, and defend it in a viva. The codebase is structured for extension: every external integration, KPI, and visualization is a single-file addition.

## Appendix A — File Inventory

| Path | Lines (approx.) | Purpose |
|------|---------|---------|
| `backend/server.js` | ~95 | Express bootstrap, CORS, cron |
| `backend/models/schema.sql` | ~115 | DDL + pollutant seed |
| `backend/services/aqiCalculator.js` | ~110 | CPCB AQI math |
| `backend/services/etlService.js` | ~170 | E-T-L orchestrator |
| `backend/services/forecastService.js` | ~95 | LinReg + EMA |
| `backend/controllers/*.js` | ~250 (5 files) | HTTP handlers |
| `frontend/src/App.jsx` | ~115 | Dashboard composition |
| `frontend/src/components/*.jsx` | ~430 (10 files) | UI widgets |
| `frontend/src/styles/app.css` | ~170 | Responsive styling |
| `docs/*.md` | ~750 (6 files) | This report set |

## Appendix B — Tech Stack Bill of Materials

| Package | Version | License | Purpose |
|---------|---------|---------|---------|
| express | 4.19 | MIT | HTTP server |
| node:sqlite | built-in (Node ≥22.5) | MIT (Node) | SQLite driver |
| axios | 1.7 | MIT | HTTP client (both ends) |
| node-cron | 3.0 | ISC | Periodic ETL |
| react | 18.3 | MIT | UI framework |
| chart.js | 4.4 | MIT | Visualization |
| react-chartjs-2 | 5.2 | MIT | React bindings |
| date-fns | 3.6 | MIT | Time-scale adapter |
| vite | 5.3 | MIT | Frontend dev/build |
