import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { GRID_COLOR, TICK_COLOR } from '../utils/chartTheme.js';
import { aqiColor } from '../utils/aqi.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function HourlyPattern({ data }) {
  if (!data || data.length === 0) return <p className="muted">No hourly pattern data.</p>;
  const labels = data.map((r) => `${String(r.hour).padStart(2,'0')}h`);
  const values = data.map((r) => r.avg_aqi);
  const colors = values.map((v) => aqiColor(Math.round(v)));

  return (
    <div className="chart-wrap-sm">
      <Bar
        data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] }}
        options={{
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` AQI ${c.parsed.y}` } } },
          scales: {
            y: { beginAtZero: true, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
            x: { grid: { display: false }, ticks: { color: TICK_COLOR, maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } },
          },
        }}
      />
    </div>
  );
}
