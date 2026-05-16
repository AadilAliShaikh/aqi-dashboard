import React, { useMemo } from 'react';
import { aqiColor, aqiCategory } from '../utils/aqi.js';

/**
 * GitHub-contribution-style grid: rows = hours (0-23), cols = days.
 * Cell color encodes the avg AQI for that day×hour.
 */
export default function HourlyHeatmap({ data }) {
  const { matrix, days, hours } = useMemo(() => {
    if (!data || data.length === 0) return { matrix: {}, days: [], hours: [] };
    const dayList = Array.from(new Set(data.map((r) => r.day))).sort();
    const m = {};
    for (const r of data) {
      m[r.day] = m[r.day] || {};
      m[r.day][r.hour] = r.avg_aqi;
    }
    return { matrix: m, days: dayList, hours: Array.from({ length: 24 }, (_, i) => i) };
  }, [data]);

  if (days.length === 0) return <p className="muted">No heatmap data.</p>;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-grid" style={{ gridTemplateColumns: `48px repeat(${days.length}, 1fr)` }}>
        <div />
        {days.map((d) => (
          <div key={d} className="heatmap-day-label" title={d}>
            {d.slice(8)}
          </div>
        ))}
        {hours.map((h) => (
          <React.Fragment key={h}>
            <div className="heatmap-hour-label">{String(h).padStart(2,'0')}h</div>
            {days.map((d) => {
              const v = matrix[d]?.[h];
              return (
                <div
                  key={`${d}-${h}`}
                  className="heatmap-cell"
                  style={{ background: v == null ? 'rgba(255,255,255,0.03)' : aqiColor(Math.round(v)) }}
                  title={v == null ? `${d} ${h}h — no data` : `${d} ${h}h — AQI ${Math.round(v)} (${aqiCategory(Math.round(v))})`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Cleaner</span>
        <span className="heatmap-legend-bar" />
        <span>Dirtier</span>
      </div>
    </div>
  );
}
