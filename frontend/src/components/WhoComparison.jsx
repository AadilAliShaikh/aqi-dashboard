import React from 'react';

/**
 * Shows "PM2.5 is X× WHO safe limit" for each pollutant.
 * Helps non-technical users understand magnitude.
 */
export default function WhoComparison({ data }) {
  if (!data || data.length === 0) return <p className="muted">No pollutant data.</p>;
  return (
    <div className="who-list">
      {data.map((d) => {
        const over = d.times_over;
        const color = over == null ? '#7b809f'
          : over <= 1   ? '#34d399'
          : over <= 3   ? '#fcd34d'
          : over <= 7   ? '#fb923c'
          : over <= 15  ? '#f43f5e'
          : '#b91c1c';
        return (
          <div key={d.code} className="who-row" style={{ '--who-color': color }}>
            <div className="who-label">{d.label}</div>
            <div className="who-bar-track">
              <div className="who-bar-fill" style={{ width: `${Math.min(100, ((over || 0) / 20) * 100)}%` }} />
            </div>
            <div className="who-multiplier">
              {over == null ? '—' : over <= 1 ? <span style={{ color }}>within limit</span> : <><strong>{over}×</strong> over</>}
            </div>
            <div className="who-detail">
              {d.value} / {d.who_limit} <span className="muted">{d.period}</span>
            </div>
          </div>
        );
      })}
      <div className="who-footnote">
        Compared to WHO 2021 air quality guidelines. <strong>1×</strong> is the safe limit — anything higher is unsafe over time.
      </div>
    </div>
  );
}
