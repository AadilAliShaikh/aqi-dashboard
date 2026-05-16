import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AQI_CATEGORIES } from '../utils/aqi.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLOR_MAP = Object.fromEntries(AQI_CATEGORIES.map((c) => [c.label, c.color]));

export default function CategoryDonut({ data }) {
  if (!data || data.length === 0) return <p className="muted">No data.</p>;
  const labels = data.map((d) => d.category);
  const values = data.map((d) => d.readings);
  const colors = labels.map((l) => COLOR_MAP[l] || '#7b809f');

  return (
    <div className="chart-wrap-sm">
      <Doughnut
        data={{
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderColor: 'rgba(7,7,15,1)',
            borderWidth: 3,
            hoverOffset: 8,
            spacing: 2,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, boxHeight: 10, padding: 12 },
            },
          },
        }}
      />
    </div>
  );
}
