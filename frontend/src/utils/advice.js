/**
 * Plain-English health & activity recommendations from an AQI value.
 * Tuned to be normie-friendly: short sentences, concrete actions.
 */

export function activityAdvice(aqi) {
  if (aqi == null) return { go: '—', reason: 'No data.', color: '#7b809f' };
  if (aqi <= 50)  return { go: 'go for it',    reason: 'Air is clean. Run, jog, picnic — anything.',                 color: '#34d399' };
  if (aqi <= 100) return { go: 'mostly fine',  reason: 'Light outdoor activity is OK. Sensitive folks take it easy.', color: '#a3e635' };
  if (aqi <= 200) return { go: 'limit it',     reason: 'Skip heavy workouts outside. A short walk is OK.',            color: '#fcd34d' };
  if (aqi <= 300) return { go: 'stay indoors', reason: 'Avoid running, jogging, sports. Mask if you must go out.',    color: '#fb923c' };
  if (aqi <= 400) return { go: 'don\'t',       reason: 'Air is hazardous. Stay inside, run an air purifier.',         color: '#f43f5e' };
  return              { go: 'health emergency', reason: 'Severe pollution. Indoors only. N95 mandatory if outside.',  color: '#b91c1c' };
}

export function maskAdvice(aqi) {
  if (aqi == null) return { mask: 'No data', detail: '', color: '#7b809f' };
  if (aqi <= 100) return { mask: 'No mask needed',      detail: 'Air is OK for most people.',            color: '#34d399' };
  if (aqi <= 200) return { mask: 'Cloth mask is fine',  detail: 'Filter dust if you cycle/walk a lot.',  color: '#fcd34d' };
  if (aqi <= 300) return { mask: 'Surgical mask',       detail: 'Cuts coarse particles meaningfully.',   color: '#fb923c' };
  if (aqi <= 400) return { mask: 'N95 / FFP2 outdoors', detail: 'Cloth and surgical aren\'t enough.',    color: '#f43f5e' };
  return            { mask: 'N95 mandatory',           detail: 'Stay indoors when possible.',           color: '#b91c1c' };
}

export function vulnerableGroupRisk(aqi) {
  const level = (low, mid, high) => aqi <= 100 ? low : aqi <= 200 ? mid : high;
  return [
    { who: 'Kids',     risk: level('low', 'moderate', 'high'), advice: aqi <= 100 ? 'Outdoor play is fine.' : aqi <= 200 ? 'Limit outdoor play to short windows.' : 'Indoor play only.' },
    { who: 'Elderly',  risk: level('low', 'moderate', 'high'), advice: aqi <= 100 ? 'No restrictions.' : aqi <= 200 ? 'Skip morning walks.' : 'Stay indoors. Mask up if going out.' },
    { who: 'Asthma',   risk: level('low', 'high',     'severe'), advice: aqi <= 100 ? 'Keep inhaler handy.' : aqi <= 200 ? 'Use preventer. Avoid exertion.' : 'Stay indoors. Have rescue inhaler ready.' },
    { who: 'Pregnant', risk: level('low', 'moderate', 'high'), advice: aqi <= 100 ? 'Normal activity.' : aqi <= 200 ? 'Avoid traffic-heavy areas.' : 'Indoors with purifier; mask outdoors.' },
    { who: 'Heart',    risk: level('low', 'high',     'severe'), advice: aqi <= 100 ? 'No restrictions.' : aqi <= 200 ? 'Light activity only.' : 'Indoors. Mask + purifier.' },
  ];
}

const RISK_COLOR = {
  low: '#34d399', moderate: '#fcd34d', high: '#fb923c', severe: '#f43f5e',
};
export const riskColor = (level) => RISK_COLOR[level] || '#7b809f';
