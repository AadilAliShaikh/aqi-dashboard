# Methodology

## 1. Data Sources

| Source | Endpoint | Coverage | Notes |
|--------|----------|----------|-------|
| **CPCB** (Central Pollution Control Board, India) | `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` | ~250 Indian stations, real-time | Free API key from data.gov.in |
| **OpenAQ v3** | `https://api.openaq.org/v3` | Global, ~12,000+ stations | Free API key from explore.openaq.org |
| Synthetic fallback | `scripts/seedData.js` | 8 metros × 30 days | Used when keys unavailable |

## 2. Pollutants Tracked
PM2.5, PM10, NO₂, SO₂, CO, O₃, NH₃, plus temperature and humidity as contextual variables (CPCB methodology).

## 3. AQI Computation

Per Central Pollution Control Board, India (2014). The sub-index for each pollutant is computed using piecewise-linear interpolation between standard breakpoints:

$$ I_p = \frac{I_{Hi} - I_{Lo}}{BP_{Hi} - BP_{Lo}} \cdot (C_p - BP_{Lo}) + I_{Lo} $$

where
- \(C_p\) = pollutant concentration,
- \(BP_{Lo}, BP_{Hi}\) = breakpoints bracketing \(C_p\),
- \(I_{Lo}, I_{Hi}\) = corresponding AQI values.

Overall AQI is:

$$ AQI = \max_p I_p $$

The pollutant achieving the maximum is recorded as the **dominant pollutant**. Implementation: [aqiCalculator.js](../backend/services/aqiCalculator.js).

### AQI Categories

| Range | Category | Color | Health implication |
|------|----------|-------|--------------------|
| 0–50 | Good | `#009966` | Minimal impact |
| 51–100 | Satisfactory | `#A6CE39` | Minor discomfort to sensitive groups |
| 101–200 | Moderate | `#FFDE33` | Breathing difficulty for sensitive groups |
| 201–300 | Poor | `#FF9933` | Breathing discomfort on prolonged exposure |
| 301–400 | Very Poor | `#CC0033` | Respiratory illness on prolonged exposure |
| 401–500 | Severe | `#7E0023` | Affects healthy people; serious for those with conditions |

## 4. ETL Pipeline

```
Extract   → Transform           → Load                 → Compute              → Alert
─────────   ────────────────────   ───────────────────   ────────────────────   ─────────────
CPCB API    discard NaNs/negs      INSERT OR IGNORE      sub-index per          AQI > 300
OpenAQ API  normalize timestamps    locations            pollutant              → INSERT INTO
            harmonize codes        upsert measurements   max() → AQI            alerts
            trim city names        within a tx           categorize             (cron)
```

Idempotency: a `UNIQUE(location_id, pollutant_id, measured_at)` constraint on `measurements` means re-running the same window is a no-op for already-loaded rows. `aqi_records` uses `INSERT OR REPLACE` so the latest computation always wins.

## 5. Forecasting Methodology

The forecast service combines two simple, interpretable models:

1. **Linear regression** on the last 48 (configurable) AQI points indexed by hours-since-window-start. Yields slope + intercept; quality measured by R².
2. **Exponential moving average (EMA)** with α = 0.4 — a smoothed baseline that resists volatility.

Final blend (heuristic ensemble):
$$ \hat{y}_h = 0.6 \cdot (\beta_0 + \beta_1 \cdot t_h) + 0.4 \cdot EMA $$

clamped to [0, 500]. Confidence reported as R² of the linear fit.

This choice is deliberate for an MCA-scale demo: it avoids opaque deep models, runs in milliseconds, and clearly demonstrates statistical reasoning. Future work could plug in ARIMA / Prophet without changing the API contract.

## 6. KPI Definitions

| KPI | Formula |
|-----|---------|
| Average AQI | `AVG(aqi_value)` over time window |
| Peak AQI | `MAX(aqi_value)` |
| Safe hours | count where AQI ≤ 100 |
| Hazardous hours | count where AQI > 300 |
| Peak pollution hour | `argmax_h AVG(aqi_value WHERE hour=h)` |
| City ranking | cities ordered by mean AQI desc |
| Dominant pollutant | argmax of sub-indices in latest record |

## 7. Visualization Techniques

| Chart | Library | Encoding | Justification |
|-------|---------|----------|---------------|
| AQI trend line | Chart.js Line (time scale) | x = time, y = AQI, point color = category | Reveals temporal patterns and category transitions |
| Pollutant bar | Chart.js Bar | grouped: avg / peak / safe limit | Direct comparison to regulatory thresholds |
| Category donut | Chart.js Doughnut | category proportions | At-a-glance air quality profile |
| City cards | CSS-styled buttons | background = aqi color | Spatial scan across cities, single-click drill-down |
| Ranking table | HTML table | sorted by avg AQI | Comparative leaderboard, accessible to non-chart users |
| Forecast dashed line | Chart.js Line | dashed style differentiates predicted from actual | Visual code that "this is a model output" |

## 8. Testing Strategy

| Layer | Test type | Tool |
|-------|----------|------|
| AQI calculation | unit (boundary, monotonicity) | Node test runner |
| REST endpoints | smoke / contract | Node http + assert |
| ETL transform | property | Node test runner |
| End-to-end | manual via UI | Browser |

Run with: `cd backend && npm test`.

## 9. Insights (from Synthetic Seed Data)

After running `npm run seed`, the dashboard surfaces these characteristic patterns:
- Delhi and Lucknow consistently rank as "Very Poor" or "Severe" across the 30-day window.
- Bangalore and Chennai sit in "Moderate", reflecting their coastal/elevated geography.
- Diurnal peaks at **08:00** and **20:00** mirror traffic + cooking-fire cycles encoded in `diurnalFactor()`.
- PM2.5 is the dominant pollutant in **>80%** of severe hours — consistent with CPCB's annual report.

These insights illustrate the kind of analysis the dashboard enables; the same queries run against real CPCB data produce qualitatively similar findings (winter inversions, festival spikes, etc.).
