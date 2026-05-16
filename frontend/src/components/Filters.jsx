import React from 'react';

const DAYS = [1, 3, 7, 14, 30, 90];

export default function Filters({ cities, filters, onChange }) {
  return (
    <section className="filters card">
      <div className="filter-group">
        <label>City</label>
        <select value={filters.city} onChange={(e) => onChange({ city: e.target.value })}>
          {cities.length === 0 && <option value="Delhi">Delhi</option>}
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label>Range</label>
        <select value={filters.days} onChange={(e) => onChange({ days: Number(e.target.value) })}>
          {DAYS.map((d) => <option key={d} value={d}>Last {d}d</option>)}
        </select>
      </div>
    </section>
  );
}
