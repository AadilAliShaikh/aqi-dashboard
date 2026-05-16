/**
 * Global Chart.js dark-mode defaults.
 * Imported once from `main.jsx` so every chart in the app inherits these.
 *
 * IMPORTANT: we import & register Tooltip and Legend here, because their
 * `defaults` namespaces only exist once the plugin file has loaded.
 */
import { Chart as ChartJS, Tooltip, Legend } from 'chart.js';

ChartJS.register(Tooltip, Legend);

ChartJS.defaults.color = '#c2c8e0';
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.06)';

// Tooltip
if (ChartJS.defaults.plugins?.tooltip) {
  Object.assign(ChartJS.defaults.plugins.tooltip, {
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    borderWidth: 1,
    padding: 10,
    cornerRadius: 10,
    titleColor: '#ffffff',
    bodyColor: '#c2c8e0',
    titleFont: { weight: '700', size: 12 },
    bodyFont: { size: 12 },
  });
}

// Legend
if (ChartJS.defaults.plugins?.legend?.labels) {
  Object.assign(ChartJS.defaults.plugins.legend.labels, {
    color: '#c2c8e0',
    padding: 14,
    usePointStyle: true,
    pointStyle: 'circle',
  });
}

export const GRID_COLOR = 'rgba(255, 255, 255, 0.05)';
export const AXIS_COLOR = 'rgba(255, 255, 255, 0.04)';
export const TICK_COLOR = '#7b809f';

export const NEON = {
  cyan:    '#22e4ff',
  purple:  '#b794ff',
  pink:    '#f472b6',
  green:   '#4ade80',
  orange:  '#fb923c',
  red:     '#f87171',
  magenta: '#e879f9',
};

export default ChartJS;
