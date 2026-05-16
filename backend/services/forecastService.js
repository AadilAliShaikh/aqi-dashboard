const db = require('../config/db');

/**
 * Short-term AQI forecasting.
 *
 * Two complementary models:
 *  1. Linear regression on the last N AQI points (trend extrapolation).
 *  2. Exponential moving average (smoothed baseline).
 *
 * Final prediction = 0.6 * linear + 0.4 * EMA, clamped to [0, 500].
 * Confidence is computed from R² of the linear fit on the sample.
 */

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  points.forEach(([x, y]) => {
    sumX += x; sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  });
  const meanX = sumX / n;
  const meanY = sumY / n;
  const denom = sumX2 - n * meanX * meanX;
  if (denom === 0) return null;
  const slope = (sumXY - n * meanX * meanY) / denom;
  const intercept = meanY - slope * meanX;

  const ssTot = sumY2 - n * meanY * meanY;
  let ssRes = 0;
  points.forEach(([x, y]) => {
    const pred = slope * x + intercept;
    ssRes += (y - pred) ** 2;
  });
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

function ema(values, alpha = 0.4) {
  if (!values.length) return null;
  let v = values[0];
  for (let i = 1; i < values.length; i += 1) v = alpha * values[i] + (1 - alpha) * v;
  return v;
}

const fetchHistory = db.prepare(`
  SELECT aqi_value, measured_at
  FROM aqi_records
  WHERE location_id = ?
  ORDER BY measured_at DESC
  LIMIT ?
`);

const insertForecast = db.prepare(`
  INSERT INTO forecasts (location_id, horizon_hours, aqi_predicted, model, confidence, target_time)
  VALUES (?, ?, ?, ?, ?, ?)
`);

/**
 * @param {number} locationId
 * @param {number} horizonHours  e.g. 6 -> forecast next 6 hours
 * @param {number} window         number of historical points to use
 */
function forecastForLocation(locationId, horizonHours = 6, window = 48) {
  const rowsDesc = fetchHistory.all(locationId, window);
  if (rowsDesc.length < 3) {
    return { error: 'Insufficient history to forecast (need >= 3 points)' };
  }
  const rows = rowsDesc.slice().reverse();
  const baseTime = new Date(rows[0].measured_at).getTime();

  const points = rows.map((r) => [
    (new Date(r.measured_at).getTime() - baseTime) / 3_600_000,
    r.aqi_value,
  ]);
  const values = rows.map((r) => r.aqi_value);

  const lr = linearRegression(points);
  const emaVal = ema(values);

  const lastX = points[points.length - 1][0];
  const series = [];
  for (let h = 1; h <= horizonHours; h += 1) {
    const x = lastX + h;
    const linearPred = lr ? lr.slope * x + lr.intercept : values[values.length - 1];
    const blended = 0.6 * linearPred + 0.4 * emaVal;
    const clamped = Math.max(0, Math.min(500, Math.round(blended)));
    const targetTime = new Date(baseTime + x * 3_600_000).toISOString();

    series.push({
      horizon: h,
      target_time: targetTime,
      aqi_predicted: clamped,
      model: 'linear+ema',
      confidence: lr ? Number(lr.r2.toFixed(3)) : 0,
    });

    insertForecast.run(locationId, h, clamped, 'linear+ema', lr?.r2 || 0, targetTime);
  }

  return {
    location_id: locationId,
    horizonHours,
    historyPoints: rows.length,
    model: 'linear+ema',
    r2: lr ? Number(lr.r2.toFixed(3)) : null,
    forecast: series,
  };
}

module.exports = { forecastForLocation, linearRegression, ema };
