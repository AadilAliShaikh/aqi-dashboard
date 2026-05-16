import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js';
import { GRID_COLOR, TICK_COLOR, NEON } from '../utils/chartTheme.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function PollutantBarChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="muted">No pollutant data.</p>;
  }
  const labels = data.map((d) => `${d.name}`);
  const avg = data.map((d) => d.avg_value);
  const peak = data.map((d) => d.peak_value);
  const safe = data.map((d) => d.safe_threshold);

  const chartData = {
    labels,
    datasets: [
      { label: 'Average', data: avg,  backgroundColor: NEON.cyan,   borderRadius: 8, borderSkipped: false },
      { label: 'Peak',    data: peak, backgroundColor: NEON.pink,   borderRadius: 8, borderSkipped: false },
      { label: 'Safe limit', data: safe, backgroundColor: 'rgba(74,222,128,0.55)',
        borderColor: NEON.green, borderWidth: 1.5, borderRadius: 8, borderSkipped: false },
    ],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10 } },
    },
    scales: {
      y: { beginAtZero: true,
           grid: { color: GRID_COLOR, drawBorder: false },
           ticks: { color: TICK_COLOR } },
      x: { grid: { display: false }, ticks: { color: TICK_COLOR } },
    },
  };
  return <div className="chart-wrap"><Bar data={chartData} options={options} /></div>;
}
