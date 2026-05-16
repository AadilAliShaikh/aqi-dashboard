import React from 'react';
import { aqiColor, formatTime } from '../utils/aqi.js';

export default function ExtremesPanel({ data }) {
  if (!data) return <p className="muted">No extremes data.</p>;
  const { worst = [], best = [] } = data;

  const Row = ({ row }) => (
    <li>
      <span className="ext-aqi" style={{ color: aqiColor(row.aqi_value) }}>{row.aqi_value}</span>
      <span className="ext-cat">{row.category}</span>
      <span className="ext-dom muted">
        {row.dominant_pollutant ? row.dominant_pollutant.toUpperCase() : ''}
      </span>
      <span className="ext-time muted">{formatTime(row.measured_at)}</span>
    </li>
  );

  return (
    <div className="ext-wrap">
      <div>
        <div className="ext-title bad">Top 5 dirtiest hours</div>
        <ul className="ext-list">{worst.map((r, i) => <Row key={i} row={r} />)}</ul>
      </div>
      <div>
        <div className="ext-title good">Top 5 cleanest hours</div>
        <ul className="ext-list">{best.map((r, i) => <Row key={i} row={r} />)}</ul>
      </div>
    </div>
  );
}
