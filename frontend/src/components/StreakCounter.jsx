import React from 'react';

const KIND_META = {
  safe:      { color: '#34d399', label: 'safe-air days in a row',     icon: '✓' },
  moderate:  { color: '#fcd34d', label: 'moderate-air days in a row', icon: '~' },
  hazardous: { color: '#f43f5e', label: 'hazardous days in a row',    icon: '!' },
  none:      { color: '#7b809f', label: 'no data',                    icon: '?' },
};

export default function StreakCounter({ data }) {
  if (!data) return <p className="muted">No streak data.</p>;
  const meta = KIND_META[data.kind] || KIND_META.none;
  return (
    <div className="streak" style={{ '--streak-color': meta.color }}>
      <div className="streak-icon">{meta.icon}</div>
      <div className="streak-value">{data.streak}</div>
      <div className="streak-label">{meta.label}</div>
      {data.latest_day_avg != null && (
        <div className="streak-sub muted">today's avg · AQI {data.latest_day_avg}</div>
      )}
    </div>
  );
}
