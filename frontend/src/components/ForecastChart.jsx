import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { aqiColor } from '../utils/aqi.js';
import { GRID_COLOR, TICK_COLOR, NEON } from '../utils/chartTheme.js';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, Filler);

export default function ForecastChart({ forecast }) {
  if (!forecast || !forecast.forecast) {
    return <p className="muted">{forecast?.error || 'Forecast incoming — need more data first.'}</p>;
  }

  const points = forecast.forecast.map((f) => ({ x: new Date(f.target_time), y: f.aqi_predicted }));

  return (
    <div>
      <div className="meta-line">
        <span className="pill">{forecast.model}</span>
        <span>history points · <strong style={{ color: 'white' }}>{forecast.historyPoints}</strong></span>
        {forecast.r2 != null && (
          <span>confidence (R²) · <strong style={{ color: 'white' }}>{forecast.r2}</strong></span>
        )}
      </div>
      <div className="chart-wrap">
        <Line
          data={{
            datasets: [{
              label: 'Predicted AQI',
              data: points,
              borderColor: NEON.purple,
              borderDash: [8, 5],
              backgroundColor: (ctx) => {
                const c = ctx.chart.ctx;
                const area = ctx.chart.chartArea;
                if (!area) return 'rgba(183,148,255,0.15)';
                const g = c.createLinearGradient(0, area.top, 0, area.bottom);
                g.addColorStop(0, 'rgba(244,114,182,0.3)');
                g.addColorStop(1, 'rgba(183,148,255,0)');
                return g;
              },
              fill: true,
              tension: 0.3,
              pointBackgroundColor: points.map((p) => aqiColor(p.y)),
              pointBorderColor: '#fff',
              pointBorderWidth: 1.5,
              pointRadius: 5,
              pointHoverRadius: 8,
              borderWidth: 2.5,
            }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { type: 'time', time: { unit: 'hour' },
                   grid: { color: GRID_COLOR, drawBorder: false },
                   ticks: { color: TICK_COLOR } },
              y: { beginAtZero: true, suggestedMax: 500,
                   grid: { color: GRID_COLOR, drawBorder: false },
                   ticks: { color: TICK_COLOR, stepSize: 100 } },
            },
          }}
        />
      </div>
    </div>
  );
}
