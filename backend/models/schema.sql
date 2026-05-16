-- =========================================================================
-- Air Quality Monitoring Dashboard - Relational Schema
-- DBMS: SQLite (portable, file-based; production-equivalent DDL also valid
-- for PostgreSQL/MySQL with minor type adjustments)
-- =========================================================================

-- Locations / monitoring stations
CREATE TABLE IF NOT EXISTS locations (
    location_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    city            TEXT    NOT NULL,
    state           TEXT,
    country         TEXT    DEFAULT 'India',
    station_name   TEXT,
    latitude        REAL,
    longitude       REAL,
    source          TEXT,                       -- 'openaq' | 'cpcb' | 'manual'
    created_at      TEXT    DEFAULT (datetime('now')),
    UNIQUE (city, station_name)
);

CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- Pollutant master
CREATE TABLE IF NOT EXISTS pollutants (
    pollutant_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    code            TEXT    NOT NULL UNIQUE,    -- e.g. pm25, pm10, no2, so2, co, o3
    name            TEXT    NOT NULL,
    unit            TEXT    NOT NULL,           -- e.g. µg/m³, mg/m³, ppm
    safe_threshold  REAL,                       -- WHO/CPCB safe limit (24-hr avg)
    hazard_threshold REAL                       -- "Hazardous" cutoff
);

-- Time-series measurements (fact table)
CREATE TABLE IF NOT EXISTS measurements (
    measurement_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id     INTEGER NOT NULL,
    pollutant_id    INTEGER NOT NULL,
    value           REAL    NOT NULL,
    measured_at     TEXT    NOT NULL,           -- ISO-8601 timestamp
    source          TEXT,
    raw_payload     TEXT,                       -- JSON of original record (audit)
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (location_id)  REFERENCES locations(location_id)  ON DELETE CASCADE,
    FOREIGN KEY (pollutant_id) REFERENCES pollutants(pollutant_id) ON DELETE CASCADE,
    UNIQUE (location_id, pollutant_id, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_measurements_loc_time
    ON measurements(location_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_measurements_pollutant_time
    ON measurements(pollutant_id, measured_at);

-- Computed AQI snapshots (per location & time bucket)
CREATE TABLE IF NOT EXISTS aqi_records (
    aqi_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id     INTEGER NOT NULL,
    aqi_value       INTEGER NOT NULL,
    category        TEXT    NOT NULL,           -- Good | Satisfactory | Moderate | Poor | Very Poor | Severe
    dominant_pollutant TEXT,
    temperature     REAL,
    humidity        REAL,
    measured_at     TEXT    NOT NULL,
    created_at      TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE,
    UNIQUE (location_id, measured_at)
);

CREATE INDEX IF NOT EXISTS idx_aqi_loc_time
    ON aqi_records(location_id, measured_at);

-- Alert log (hazardous-level events)
CREATE TABLE IF NOT EXISTS alerts (
    alert_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id     INTEGER NOT NULL,
    aqi_value       INTEGER NOT NULL,
    category        TEXT    NOT NULL,
    message         TEXT,
    triggered_at    TEXT    NOT NULL,
    acknowledged    INTEGER DEFAULT 0,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(triggered_at);

-- Forecast cache (short-term predictions)
CREATE TABLE IF NOT EXISTS forecasts (
    forecast_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id     INTEGER NOT NULL,
    horizon_hours   INTEGER NOT NULL,
    aqi_predicted   REAL    NOT NULL,
    model           TEXT,                       -- 'linear_regression' | 'moving_avg' | etc.
    confidence      REAL,
    target_time     TEXT    NOT NULL,
    generated_at    TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_forecasts_loc_target
    ON forecasts(location_id, target_time);

-- ETL job audit
CREATE TABLE IF NOT EXISTS etl_runs (
    run_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at      TEXT    DEFAULT (datetime('now')),
    finished_at     TEXT,
    source          TEXT,
    records_in      INTEGER DEFAULT 0,
    records_out     INTEGER DEFAULT 0,
    status          TEXT,
    error_message   TEXT
);

-- Seed pollutant master (CPCB / WHO thresholds, 24-hr averaging)
INSERT OR IGNORE INTO pollutants (code, name, unit, safe_threshold, hazard_threshold) VALUES
    ('pm25', 'PM2.5',           'µg/m³', 60,   250),
    ('pm10', 'PM10',            'µg/m³', 100,  430),
    ('no2',  'Nitrogen Dioxide','µg/m³', 80,   400),
    ('so2',  'Sulphur Dioxide', 'µg/m³', 80,   1600),
    ('co',   'Carbon Monoxide', 'mg/m³', 2,    34),
    ('o3',   'Ozone',           'µg/m³', 100,  748),
    ('nh3',  'Ammonia',         'µg/m³', 400,  1800),
    ('temperature', 'Temperature', '°C', 0,    0),
    ('humidity',    'Humidity',    '%',  0,    0);
