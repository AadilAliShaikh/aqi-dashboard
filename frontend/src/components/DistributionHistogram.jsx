import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from 'chart.js';
import { GRID_COLOR, TICK_COLOR } from '../utils/chartTheme.js';
import { aqiColor } from '../utils/aqi.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export default function DistributionHistogram({ data }) {
  if (!data || data.length === 0) return <p className="muted">No distribution data.</p>;
  const labels = data.map((d) => d.range);
  const values = data.map((d) => d.readings);
  const colors = data.map((d) => aqiColor(d.bin_start + 25));

  return (
    <div className="chart-wrap-sm">
      <Bar
        data={{ labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 6, borderSkipped: false }] }}
        options={{
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} readings · ${data[c.dataIndex].category}` } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: GRID_COLOR }, ticks: { color: TICK_COLOR } },
            x: { grid: { display: false }, ticks: { color: TICK_COLOR } },
          },
        }}
      />
    </div>
  );
}
