import React from 'react';

const META = {
  live:      { color: '#34d399', label: 'LIVE',      desc: 'Real data from CPCB / OpenAQ' },
  mixed:     { color: '#fcd34d', label: 'MIXED',     desc: 'Both live and synthetic rows' },
  synthetic: { color: '#fb923c', label: 'SYNTHETIC', desc: 'Demo data only — set API keys for real numbers' },
  unknown:   { color: '#7b809f', label: 'UNKNOWN',   desc: '' },
};

export default function DataSourceBadge({ mode = 'unknown', total }) {
  const m = META[mode] || META.unknown;
  return (
    <span className="ds-badge" style={{ '--ds-color': m.color }} title={m.desc}>
      <span className="ds-dot" />
      {m.label}
      {total != null && <span className="ds-count">· {total.toLocaleString()} rows</span>}
    </span>
  );
}
