# Project Overview

## Title
**Air Quality Monitoring and Pollution Trend Visualization Dashboard**

## Institution
Plag Pro, Noida — MCA Programme (enrolled 2026-03-02)

## Problem Statement
Indian cities consistently rank among the world's most polluted, yet end-users and policy-makers lack a unified, interactive view of pollution data spanning multiple cities, pollutants, and time periods. Government feeds (CPCB) publish raw real-time numbers, but they are not aggregated, contextualized, or visualized at a granularity that supports rapid decision-making.

## Objectives
1. Build an **interactive dashboard** that visualizes AQI, pollutant concentrations, and trends across Indian cities and configurable time windows.
2. Integrate **real-time public data sources** (CPCB feed via data.gov.in, OpenAQ v3 API).
3. Provide **analytical KPIs** — average AQI, peak pollution hours, safe vs hazardous day counts, dominant pollutants.
4. Surface **short-term forecasts** for proactive decision-making.
5. Raise **alerts** when AQI crosses the hazardous threshold (>300).
6. Document a **complete end-to-end system** (data → DB → API → UI) for academic evaluation.

## Scope
- **In scope**: data ingestion, storage, REST API, dashboard UI, KPIs, filters, alerts, basic forecasting, documentation.
- **Out of scope**: production-grade authentication, multi-tenant deployment, ML model training pipelines, mobile app.

## Stakeholders
| Role | Interest |
|------|----------|
| General public | Real-time awareness of local air quality |
| Researchers / students | Historical trends, cross-city comparisons |
| Policy makers | Identifying chronic vs episodic pollution hotspots |
| Project evaluator (MCA) | Demonstrated engineering + analytics competence |

## Deliverables (mapped to project tasks)
| # | Task | Deliverable |
|---|------|-------------|
| 1 | Data collection | `backend/services/cpcbService.js`, `backend/services/openAQService.js` |
| 2 | Cleaning & preprocessing | `etlService.transform()` |
| 3 | Relational schema | `backend/models/schema.sql` |
| 4 | ER diagram & architecture | `docs/02_er_diagram.md`, `docs/03_architecture.md` |
| 5 | ETL pipeline | `backend/services/etlService.js`, `scripts/runIngest.js` |
| 6 | Backend APIs | `backend/server.js`, `backend/routes/*` |
| 7 | KPIs | `backend/controllers/kpiController.js` |
| 8 | Interactive dashboard | `frontend/src/App.jsx` + components |
| 9 | Filters | `frontend/src/components/Filters.jsx` |
| 10 | Alerts | `backend/controllers/alertController.js`, `AlertBanner.jsx` |
| 11 | Forecasting | `backend/services/forecastService.js` |
| 12 | Responsive UI | `frontend/src/styles/app.css` (CSS Grid + media queries) |
| 13 | Testing | `backend/tests/smoke.test.js` |
| 14 | Documentation | `docs/*.md` |
