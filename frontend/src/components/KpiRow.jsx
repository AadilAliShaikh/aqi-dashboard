import React from 'react';
import { aqiColor, aqiCategory } from '../utils/aqi.js';

function Card({ label, value, sub, color }) {
  return (
    <div className="kpi" style={color ? { '--kpi-color': color } : null}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value ?? '—'}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export default function KpiRow({ summary, peakHour, city }) {
  if (!summary) return <div className="muted">No data for {city}.</div>;
  const {
    avg_aqi, peak_aqi, min_aqi, days_recorded,
    safe_hours, hazardous_hours, total_readings,
  } = summary;
  const safePct = total_readings ? Math.round((safe_hours / total_readings) * 100) : 0;
  const hazardPct = total_readings ? Math.round((hazardous_hours / total_readings) * 100) : 0;

  return (
    <section className="kpi-row">
      <Card
        label={`Avg AQI · ${city}`}
        value={avg_aqi}
        sub={avg_aqi != null ? aqiCategory(Math.round(avg_aqi)) : ''}
        color={aqiColor(Math.round(avg_aqi || 0))}
      />
      <Card label="Peak AQI" value={peak_aqi}
            sub={peak_aqi != null ? aqiCategory(peak_aqi) : ''}
            color={aqiColor(peak_aqi)} />
      <Card label="Best moment" value={min_aqi}
            sub={min_aqi != null ? aqiCategory(min_aqi) : ''}
            color={aqiColor(min_aqi)} />
      <Card label="Safe hours" value={safe_hours ?? 0}
            sub={`${safePct}% of ${total_readings ?? 0}`}
            color="#34d399" />
      <Card label="Hazardous hours" value={hazardous_hours ?? 0}
            sub={`${hazardPct}% of ${total_readings ?? 0}`}
            color="#f87171" />
      <Card label="Peak hour"
            value={peakHour?.hour ? `${peakHour.hour}:00` : '—'}
            sub={peakHour ? `avg AQI ${peakHour.avg_aqi}` : ''}
            color="#b794ff" />
      <Card label="Days tracked" value={days_recorded}
            sub="in selected range"
            color="#22e4ff" />
    </section>
  );
}
