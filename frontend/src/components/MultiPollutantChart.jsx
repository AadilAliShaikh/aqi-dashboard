import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { NEON, GRID_COLOR, TICK_COLOR } from '../utils/chartTheme.js';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

const COLORS = {
  pm25: NEON.cyan,
  pm10: NEON.purple,
  no2:  NEON.pink,
  so2:  NEON.orange,
  co:   NEON.magenta,
  o3:   NEON.green,
};

export default function MultiPollutantChart({ data }) {
  const datasets = useMemo(() => {
    if (!data || data.length === 0) return [];
    const byCode = {};
    for (const r of data) {
      byCode[r.code] = byCode[r.code] || { name: r.name, code: r.code, unit: r.unit, points: [] };
      byCode[r.code].points.push({ x: new Date(r.day), y: r.avg_value });
    }
    return Object.values(byCode).map((d) => ({
      label: d.name,
      data: d.points,
      borderColor: COLORS[d.code] || '#7b809f',
      backgroundColor: 'transparent',
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    }));
  }, [data]);

  if (datasets.length === 0) return <p className="muted">No multi-pollutant data.</p>;

  return (
    <div className="chart-wrap">
      <Line
        data={{ datasets }}
        options={{
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'bottom' } },
          scales: {
            x: { type: 'time', time: { unit: 'day' }, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
            y: { beginAtZero: true, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
          },
        }}
      />
    </div>
  );
}
