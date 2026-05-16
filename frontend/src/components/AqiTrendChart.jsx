import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { aqiColor } from '../utils/aqi.js';
import { GRID_COLOR, TICK_COLOR } from '../utils/chartTheme.js';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

export default function AqiTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="muted">No AQI history available.</p>;
  }
  const points = data.map((r) => ({ x: new Date(r.measured_at), y: r.aqi_value }));

  const chartData = {
    datasets: [{
      label: 'AQI',
      data: points,
      borderColor: '#22e4ff',
      backgroundColor: (ctx) => {
        const chart = ctx.chart;
        const { ctx: c, chartArea } = chart;
        if (!chartArea) return 'rgba(34,228,255,0.15)';
        const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, 'rgba(183,148,255,0.35)');
        g.addColorStop(0.5, 'rgba(34,228,255,0.15)');
        g.addColorStop(1, 'rgba(34,228,255,0)');
        return g;
      },
      fill: true,
      tension: 0.35,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointBackgroundColor: points.map((p) => aqiColor(p.y)),
      pointBorderColor: '#fff',
      pointBorderWidth: 1.5,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: (ctx) => ` AQI ${ctx.parsed.y}` },
      },
    },
    scales: {
      x: {
        type: 'time', time: { unit: 'day' },
        grid: { color: GRID_COLOR, drawBorder: false },
        ticks: { color: TICK_COLOR },
      },
      y: {
        beginAtZero: true, suggestedMax: 500,
        grid: { color: GRID_COLOR, drawBorder: false },
        ticks: { color: TICK_COLOR, stepSize: 100 },
      },
    },
  };
  return <div className="chart-wrap"><Line data={chartData} options={options} /></div>;
}
