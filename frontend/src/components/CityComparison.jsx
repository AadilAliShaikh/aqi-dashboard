import React, { useEffect, useState } from 'react';
import { aqiColor, aqiCategory } from '../utils/aqi.js';
import { fetchComparison } from '../services/api.js';

export default function CityComparison({ cities, defaultA = 'Delhi', defaultB = 'Mumbai', days = 7 }) {
  const [a, setA] = useState(defaultA);
  const [b, setB] = useState(defaultB);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchComparison({ cities: `${a},${b}`, days })
      .then((r) => mounted && setRows(r.data || []))
      .catch(() => mounted && setRows([]))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [a, b, days]);

  return (
    <div className="compare-wrap">
      <div className="compare-pickers">
        <select value={a} onChange={(e) => setA(e.target.value)}>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="compare-vs">vs</span>
        <select value={b} onChange={(e) => setB(e.target.value)}>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="muted">Comparing…</p>
      ) : rows.length < 2 ? (
        <p className="muted">Not enough data for both cities.</p>
      ) : (
        <div className="compare-cards">
          {rows.map((r) => {
            const color = aqiColor(Math.round(r.avg_aqi));
            return (
              <div key={r.city} className="compare-card" style={{ '--cmp-color': color }}>
                <div className="compare-city">{r.city}</div>
                <div className="compare-aqi">{r.avg_aqi}</div>
                <div className="compare-cat">{aqiCategory(Math.round(r.avg_aqi))}</div>
                <div className="compare-stats">
                  <span>peak <strong>{r.peak_aqi}</strong></span>
                  <span>min <strong>{r.min_aqi}</strong></span>
                  <span>safe <strong>{r.safe_hours}h</strong></span>
                  <span>hazardous <strong>{r.hazardous_hours}h</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
