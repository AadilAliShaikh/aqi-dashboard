import React from 'react';
import DataSourceBadge from './DataSourceBadge.jsx';

export default function Header({ onRefresh, refreshing, alertsCount, dataSource }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo">AQI</div>
          <div>
            <h1>Air Quality · Live Dashboard</h1>
            <p className="brand-sub">
              <span className="live-dot" />
              live · CPCB + OpenAQ · synced hourly
            </p>
          </div>
        </div>
        <div className="header-actions">
          {dataSource && <DataSourceBadge mode={dataSource.mode} total={dataSource.total} />}
          {alertsCount > 0 && (
            <span className="badge badge-danger" title="Active hazardous alerts">
              <span className="live-dot" style={{ background: 'var(--neon-red)', boxShadow: '0 0 10px var(--neon-red)' }} />
              {alertsCount} alert{alertsCount === 1 ? '' : 's'}
            </span>
          )}
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'syncing…' : 'refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}
