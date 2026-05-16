# Setup & Run Guide

## Prerequisites
- **Node.js ≥ 22.5** (uses Node's built-in `node:sqlite` — no native compile, no Visual Studio Build Tools required)
- **npm ≥ 9**
- Optional: API keys for live data
  - CPCB (data.gov.in): https://data.gov.in/user/register
  - OpenAQ v3: https://explore.openaq.org/register

## 1. Backend

```powershell
cd backend
copy .env.example .env        # then edit .env to paste your API keys
npm install
npm run seed                  # OPTIONAL: load 30 days of synthetic data for 8 cities
npm run dev                   # starts on http://localhost:5000
```

Health check:

```powershell
curl http://localhost:5000/api/health
```

To trigger a manual data pull from CPCB + OpenAQ:

```powershell
curl -X POST http://localhost:5000/api/etl/run
```

The cron job inside `server.js` will also run every hour (`INGEST_CRON` in `.env`).

## 2. Frontend

```powershell
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:5000`, so no CORS headache during development.

## 3. Verification Checklist

- [ ] `http://localhost:5000/api/health` → `{ status: "ok", measurements: N }`
- [ ] `http://localhost:5000/api/locations/cities` → list of seeded cities
- [ ] `http://localhost:5173` loads dashboard with KPI cards
- [ ] Filters update charts
- [ ] Alert banner appears if any AQI > 300 was seeded
- [ ] Forecast chart renders 12-hour prediction

## 4. Running Tests

```powershell
cd backend
npm test                      # smoke + unit tests
```

## 5. Common Issues

| Symptom | Fix |
|---------|-----|
| `OPENAQ_API_KEY not set` warning | Add a key to `.env` or rely on CPCB / synthetic data. |
| Empty dashboard | Run `npm run seed` in `backend/`, then refresh the UI. |
| Old `better-sqlite3` build error | This project no longer uses `better-sqlite3` — it uses Node's built-in `node:sqlite`. If you still see this, you have an outdated `package.json`; pull latest and run `npm install` again. |
| Port 5000 already in use | Change `PORT` in `backend/.env`. |
| CORS errors in browser | Confirm `CORS_ORIGIN=http://localhost:5173` in backend `.env`. |

## 6. Project Layout

```
MCA-Project/
├── backend/                  Node.js Express API + SQLite + ETL + forecast
│   ├── config/db.js
│   ├── controllers/
│   ├── routes/
│   ├── services/             aqiCalculator, etlService, forecastService, cpcb, openaq
│   ├── models/schema.sql
│   ├── scripts/              initDB, seedData, runIngest
│   ├── tests/smoke.test.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/                 React + Vite + Chart.js
│   ├── src/
│   │   ├── components/       Header, Filters, KpiRow, charts, AlertBanner …
│   │   ├── services/api.js
│   │   ├── utils/aqi.js
│   │   ├── styles/app.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/favicon.svg
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   ├── 01_project_overview.md
│   ├── 02_er_diagram.md
│   ├── 03_architecture.md
│   ├── 04_methodology.md
│   ├── 05_setup_and_run.md
│   └── 06_final_report.md
└── README.md
```
