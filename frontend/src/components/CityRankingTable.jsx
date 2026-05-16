import React from 'react';
import { aqiColor, aqiCategory } from '../utils/aqi.js';

export default function CityRankingTable({ data, onSelect }) {
  if (!data || data.length === 0) return <p className="muted">No ranking data.</p>;
  return (
    <table className="rank-table">
      <thead>
        <tr>
          <th>#</th>
          <th>City</th>
          <th>Avg</th>
          <th>Peak</th>
          <th>Severe hrs</th>
        </tr>
      </thead>
      <tbody>
        {data.map((r, i) => {
          const color = aqiColor(Math.round(r.avg_aqi));
          return (
            <tr key={r.city} onClick={() => onSelect?.(r.city)} className="rank-row">
              <td>{String(i + 1).padStart(2, '0')}</td>
              <td>
                <strong>{r.city}</strong>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  <span className="chip" style={{ '--chip-color': color, padding: '2px 8px', fontSize: 10 }}>
                    {aqiCategory(Math.round(r.avg_aqi))}
                  </span>
                </div>
              </td>
              <td style={{ color, fontWeight: 600 }}>{r.avg_aqi}</td>
              <td>{r.peak_aqi}</td>
              <td>{r.hazardous_hours}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
