import React, { useState } from 'react';
import { acknowledgeAlert, dismissAllAlerts } from '../services/api.js';

/** Parse the dominant pollutant out of the alert.message field, which we
 *  format as "Hazardous air quality detected (AQI=315, dominant: pm10)". */
function pollutantFromMessage(msg = '') {
  const m = msg.match(/dominant:\s*(\w+)/i);
  return m ? m[1].toUpperCase() : null;
}

/** Strip noisy suffixes from station names so they fit on one line. */
function cleanStation(name = '', city = '') {
  let n = name;
  // Drop trailing agency tag, e.g. "R K Puram, Delhi - DPCC" → "R K Puram, Delhi"
  n = n.replace(/\s*-\s*[A-Z]{2,6}\s*$/, '');
  return n || city;
}

export default function AlertBanner({ alerts, onAllDismissed }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const visible = alerts.filter((a) => !dismissed.has(a.alert_id));
  if (visible.length === 0) return null;

  const handleAck = async (id) => {
    try { await acknowledgeAlert(id); } catch { /* ignore */ }
    setDismissed((s) => new Set([...s, id]));
  };

  const handleDismissAll = async () => {
    setBusy(true);
    try {
      await dismissAllAlerts();
      setDismissed(new Set(visible.map((a) => a.alert_id)));
      onAllDismissed?.();
    } catch { /* ignore */ }
    setBusy(false);
  };

  return (
    <div className="alert-banner">
      <div className="alert-header">
        <div>
          <div className="alert-title">
            <span className="live-dot" style={{ background: 'var(--neon-red)', boxShadow: '0 0 10px var(--neon-red)' }} />
            Hazardous spikes at {visible.length} station{visible.length === 1 ? '' : 's'}
          </div>
          <div className="alert-subtitle">
            These are individual station readings, not city-wide averages.
          </div>
        </div>
        <button className="btn-dismiss-all" onClick={handleDismissAll} disabled={busy}>
          {busy ? 'dismissing…' : 'Dismiss all'}
        </button>
      </div>
      <ul>
        {visible.slice(0, 6).map((a) => {
          const station = cleanStation(a.station_name, a.city);
          const pollutant = pollutantFromMessage(a.message);
          return (
            <li key={a.alert_id}>
              <span className="alert-city">{station}</span>
              <span className="alert-meta">
                AQI {a.aqi_value} · {a.category}
                {pollutant && <> · driven by <strong>{pollutant}</strong></>}
              </span>
              <button className="btn-link" onClick={() => handleAck(a.alert_id)}>dismiss</button>
            </li>
          );
        })}
      </ul>
      {visible.length > 6 && (
        <p className="muted" style={{ textAlign: 'left', padding: '4px 0 0' }}>
          + {visible.length - 6} more
        </p>
      )}
    </div>
  );
}
