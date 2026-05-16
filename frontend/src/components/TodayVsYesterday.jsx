import React from 'react';
import { aqiColor, aqiCategory } from '../utils/aqi.js';

export default function TodayVsYesterday({ data }) {
  if (!data || data.today == null) return <p className="muted">Need at least one day of data.</p>;
  const { today, yesterday, last_week, diff, pct, trend } = data;

  /** Headline string built carefully to avoid "same as than yesterday" grammar bug. */
  let headline;
  let arrow = '→';
  let color = '#fcd34d';
  if (pct == null || yesterday == null) {
    headline = 'no yesterday data yet';
    color = '#7b809f';
  } else if (trend === 'better') {
    headline = `${Math.abs(pct)}% better than yesterday`;
    arrow = '↓';
    color = '#34d399';
  } else if (trend === 'worse') {
    headline = `${Math.abs(pct)}% worse than yesterday`;
    arrow = '↑';
    color = '#f43f5e';
  } else {
    headline = 'same as yesterday';
    arrow = '≈';
    color = '#fcd34d';
  }

  return (
    <div className="t-v-y">
      <div className="t-v-y-main">
        <div className="t-v-y-arrow" style={{ color }}>{arrow}</div>
        <div>
          <div className="t-v-y-pct" style={{ color }}>{headline}</div>
          <div className="t-v-y-sub">cron will fill gaps automatically</div>
        </div>
      </div>
      <div className="t-v-y-grid">
        <div>
          <div className="t-v-y-label">today</div>
          <div className="t-v-y-num" style={{ color: aqiColor(today) }}>{today}</div>
          <div className="t-v-y-cat">{aqiCategory(today)}</div>
        </div>
        <div>
          <div className="t-v-y-label">yesterday</div>
          <div className="t-v-y-num" style={{ color: aqiColor(yesterday) }}>{yesterday ?? '—'}</div>
          <div className="t-v-y-cat">{yesterday ? aqiCategory(yesterday) : ''}</div>
        </div>
        <div>
          <div className="t-v-y-label">last week</div>
          <div className="t-v-y-num" style={{ color: aqiColor(last_week) }}>{last_week ?? '—'}</div>
          <div className="t-v-y-cat">{last_week ? aqiCategory(last_week) : ''}</div>
        </div>
      </div>
    </div>
  );
}
