import React from 'react';
import { vulnerableGroupRisk, riskColor } from '../utils/advice.js';

export default function HealthRiskPanel({ aqi }) {
  if (aqi == null) return <p className="muted">Need current AQI.</p>;
  const rows = vulnerableGroupRisk(aqi);
  return (
    <ul className="risk-list">
      {rows.map((r) => (
        <li key={r.who}>
          <span className="risk-dot" style={{ background: riskColor(r.risk), boxShadow: `0 0 10px ${riskColor(r.risk)}` }} />
          <div>
            <div className="risk-who">{r.who} <span className="risk-level" style={{ color: riskColor(r.risk) }}>· {r.risk} risk</span></div>
            <div className="risk-advice">{r.advice}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
