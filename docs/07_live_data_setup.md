# Switching from Synthetic to Live Data

Your dashboard currently shows **synthetic seed data** (made-up but realistic) — that's why it doesn't match the AQI you see on government / commercial portals. Here's how to switch to real, live numbers.

---

## Why the mismatch?

When you ran `npm run seed`, it generated 30 days of plausible AQI values for 8 cities using a math model (baseline + diurnal pattern + noise). It looks like real data but it isn't tied to actual atmospheric readings.

To get **real** values matching CPCB / airnow / OpenAQ portals, you need to:

1. Get free API keys (steps below)
2. Wipe the synthetic data
3. Pull live data

---

## Step 1 — Get API keys (both are FREE)

### A. CPCB feed via data.gov.in *(Indian Government, recommended for India)*

1. Go to **https://data.gov.in/user/register** and create a free account.
2. Verify your email.
3. Visit your profile → **"API Key"** (or directly https://data.gov.in/my-account).
4. Copy the API key (long alphanumeric string).

> **Shortcut**: The `.env.example` already has data.gov.in's **public sample key**
> (`579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b`). It works for a few
> requests/hour but is shared and rate-limited. Get your own for reliable use.

### B. OpenAQ v3 *(global, free)*

1. Go to **https://explore.openaq.org/register**.
2. Sign up (Google / email).
3. Visit https://explore.openaq.org/account/api-keys.
4. Click "Create API Key", copy it.

---

## Step 2 — Configure `.env`

In the `backend/` folder:

```powershell
copy .env.example .env
notepad .env
```

Edit the file so it has your keys:

```env
PORT=5000
NODE_ENV=development

DB_PATH=./data/airquality.db

OPENAQ_API_BASE=https://api.openaq.org/v3
OPENAQ_API_KEY=PASTE_YOUR_OPENAQ_KEY_HERE

CPCB_API_BASE=https://api.data.gov.in/resource
CPCB_RESOURCE_ID=3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69
CPCB_API_KEY=PASTE_YOUR_DATAGOVIN_KEY_HERE

INGEST_CRON=0 */1 * * *
DEFAULT_CITIES=Delhi,Mumbai,Bengaluru,Kolkata,Chennai,Hyderabad,Pune,Lucknow

CORS_ORIGIN=http://localhost:5173
```

Save the file.

---

## Step 3 — Reset the synthetic data & pull live data

```powershell
cd backend
npm run reset      # wipes synthetic measurements, AQI, alerts, locations
npm run ingest     # pulls fresh CPCB + OpenAQ data into the DB
```

If the dev server is running, it will auto-pick up the new data. Otherwise:

```powershell
npm run dev
```

In the dashboard header you'll now see the data-source badge change from
`SYNTHETIC` (orange) to `LIVE` (green).

---

## Step 4 — Keep it fresh

The backend has a cron job (`INGEST_CRON=0 */1 * * *` → every hour) that
automatically pulls new data. You can also trigger it manually any time from
the **Refresh** button in the dashboard header, or via:

```powershell
curl -X POST http://localhost:5000/api/etl/run
```

---

## Verification

After `npm run ingest`, check:

```powershell
curl http://localhost:5000/api/insights/data-source
```

You should see:

```json
{
  "total": 1234,
  "live_count": 1234,
  "synthetic_count": 0,
  "mode": "live",
  "by_source": [{ "source": "cpcb", "n": 1234 }]
}
```

Or visit http://localhost:5173 — the badge in the top-right will read **LIVE**.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Badge stays on SYNTHETIC after ingest | Did `npm run reset` first? Synthetic rows persist otherwise. |
| `CPCB_API_KEY not set` warning in console | Edit `.env`, don't just touch `.env.example`. |
| Empty data after ingest | data.gov.in's CPCB feed sometimes lags 1–2 hours; try `npm run ingest` again in 30 min. |
| `429 Too Many Requests` | The public sample key is rate-limited. Get your own free key. |
| Dashboard still shows old data | Click **Refresh** in the header — the page caches API responses for ~10s. |

---

## Want even more accuracy?

Wire up extra sources by adding a new adapter file in `backend/services/` and
calling it from `etlService.runFullPipeline()`. The integration pattern is the
same shape as `cpcbService.js` and `openAQService.js`:

```js
async function fetchRealtime({ cities }) {
  // call external API
  // return [{ city, pollutant, value, measuredAt, source }, ...]
}
```

The ETL layer handles the rest (dedupe via `UNIQUE` constraint, AQI computation, alert emission).
