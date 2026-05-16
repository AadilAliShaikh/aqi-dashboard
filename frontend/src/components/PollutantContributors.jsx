import React from 'react';

const POLLUTANT_NAMES = {
  pm25: 'PM2.5', pm10: 'PM10', no2: 'NO₂', so2: 'SO₂', co: 'CO', o3: 'O₃', nh3: 'NH₃',
};

const POLLUTANT_SOURCE = {
  pm25: 'vehicles, cooking fires, industry',
  pm10: 'construction, road dust, pollen',
  no2:  'traffic emissions',
  so2:  'coal-fired industry',
  co:   'vehicle exhaust',
  o3:   'sunlight + traffic chemistry',
  nh3:  'agriculture, fertilizers',
};

export default function PollutantContributors({ data }) {
  if (!data || data.length === 0) return <p className="muted">No data.</p>;
  const total = data.reduce((s, r) => s + r.readings, 0);
  return (
    <ul className="contrib-list">
      {data.map((r) => {
        const pct = total ? Math.round((r.readings / total) * 100) : 0;
        return (
          <li key={r.code}>
            <div className="contrib-head">
              <strong>{POLLUTANT_NAMES[r.code] || r.code}</strong>
              <span className="contrib-pct">{pct}%</span>
            </div>
            <div className="contrib-bar">
              <div className="contrib-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="contrib-src muted">{POLLUTANT_SOURCE[r.code] || ''}</div>
          </li>
        );
      })}
    </ul>
  );
}
