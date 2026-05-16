import React, { useState, useMemo } from 'react';
import { aqiColor, aqiCategory, formatTime, healthAdvice } from '../utils/aqi.js';

const CATEGORIES = ['All', 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'];

export default function AqiOverviewGrid({ latest, onSelect }) {
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    if (!latest) return [];
    if (filter === 'All') return latest;
    return latest.filter((r) => (r.category || aqiCategory(r.aqi_value)) === filter);
  }, [latest, filter]);

  if (!latest || latest.length === 0) {
    return <p className="muted">No data yet — hit refresh or seed the DB.</p>;
  }

  return (
    <div>
      <div className="category-chips">
        {CATEGORIES.map((cat) => {
          const active = cat === filter;
          const color = cat === 'All' ? '#b794ff' : aqiColor(cat === 'Good' ? 25 : cat === 'Satisfactory' ? 75 : cat === 'Moderate' ? 150 : cat === 'Poor' ? 250 : cat === 'Very Poor' ? 350 : 450);
          return (
            <button
              key={cat}
              className={`chip-btn ${active ? 'chip-btn-active' : ''}`}
              style={{ '--chip-c': color }}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="muted">No cities currently in <strong>{filter}</strong>.</p>
      ) : (
        <div className="city-grid">
          {filtered.map((row) => {
            const color = aqiColor(row.aqi_value);
            const category = row.category || aqiCategory(row.aqi_value);
            return (
              <button
                key={row.city}
                className="city-card"
                style={{ '--city-color': color }}
                onClick={() => onSelect?.(row.city)}
                title={healthAdvice(row.aqi_value)}
              >
                <div className="city-name">{row.city}</div>
                <div className="city-aqi">{row.aqi_value}</div>
                <span className="city-cat">{category}</span>
                <div className="city-dom">
                  {row.dominant_pollutant
                    ? `dominant · ${row.dominant_pollutant.toUpperCase()}`
                    : ''}
                </div>
                <div className="city-time">
                  {row.stations != null && (
                    <>{row.stations} station{row.stations === 1 ? '' : 's'} · </>
                  )}
                  {formatTime(row.measured_at)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
