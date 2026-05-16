/* AQI category metadata — dark-theme palette */

export const AQI_CATEGORIES = [
  { label: 'Good',         color: '#34d399', from: 0,   to: 50  },
  { label: 'Satisfactory', color: '#a3e635', from: 51,  to: 100 },
  { label: 'Moderate',     color: '#fcd34d', from: 101, to: 200 },
  { label: 'Poor',         color: '#fb923c', from: 201, to: 300 },
  { label: 'Very Poor',    color: '#f43f5e', from: 301, to: 400 },
  { label: 'Severe',       color: '#b91c1c', from: 401, to: 500 },
];

export function aqiColor(value) {
  if (value == null) return '#7b809f';
  const c = AQI_CATEGORIES.find((b) => value >= b.from && value <= b.to);
  return c ? c.color : '#b91c1c';
}

export function aqiCategory(value) {
  if (value == null) return 'Unknown';
  const c = AQI_CATEGORIES.find((b) => value >= b.from && value <= b.to);
  return c ? c.label : 'Severe';
}

export function healthAdvice(value) {
  if (value == null) return '';
  if (value <= 50)  return 'Air quality is satisfactory; outdoor activity is safe.';
  if (value <= 100) return 'Minor breathing discomfort for sensitive individuals.';
  if (value <= 200) return 'Sensitive groups should limit prolonged outdoor exertion.';
  if (value <= 300) return 'Breathing discomfort for most on prolonged exposure.';
  if (value <= 400) return 'Respiratory illness on prolonged exposure. Mask up outdoors.';
  return 'Health emergency. Stay indoors. N95 mandatory outdoors.';
}

export function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}
