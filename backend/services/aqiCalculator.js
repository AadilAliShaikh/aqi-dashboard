/**
 * AQI Calculation per Indian CPCB methodology.
 * Reference: https://app.cpcbccr.com/ccr_docs/About_AQI.pdf
 *
 * Sub-index = piecewise-linear interpolation across CONCENTRATION and AQI breakpoints.
 * Overall AQI = max sub-index across pollutants.
 *
 * The previous implementation used disjoint integer bands ([0,30],[31,60],...)
 * leaving GAPS at decimal boundaries (a value like 40.5 NO₂ matched no band and
 * fell through to 500). This version uses contiguous breakpoint arrays — the
 * upper bound of one band equals the lower bound of the next.
 */

// 7-point arrays: [BP0, BP1, BP2, BP3, BP4, BP5, BP6]
// covering 6 bands: [BP0..BP1], [BP1..BP2], ..., [BP5..BP6]
// mapped to AQI: [0, 50, 100, 200, 300, 400, 500]
const AQI = [0, 50, 100, 200, 300, 400, 500];

const BREAKPOINTS = {
  pm25: [0, 30,  60,  90,  120, 250, 500],
  pm10: [0, 50,  100, 250, 350, 430, 600],
  no2:  [0, 40,  80,  180, 280, 400, 600],
  so2:  [0, 40,  80,  380, 800, 1600, 2400],
  co:   [0, 1.0, 2.0, 10,  17,  34,   50],   // mg/m³
  o3:   [0, 50,  100, 168, 208, 748, 1000],
  nh3:  [0, 200, 400, 800, 1200, 1800, 2400],
};

function subIndex(pollutant, concentration) {
  const bp = BREAKPOINTS[pollutant];
  if (!bp || concentration == null || isNaN(concentration)) return null;
  const v = Math.max(0, Number(concentration));

  for (let i = 0; i < bp.length - 1; i++) {
    if (v <= bp[i + 1]) {
      // band [bp[i], bp[i+1]] → AQI [AQI[i], AQI[i+1]]
      const ratio = (v - bp[i]) / (bp[i + 1] - bp[i]);
      return Math.round(AQI[i] + ratio * (AQI[i + 1] - AQI[i]));
    }
  }
  return AQI[AQI.length - 1]; // clamp at 500
}

function categorize(aqi) {
  if (aqi == null) return 'Unknown';
  if (aqi <= 50)  return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

/**
 * @param {Object} pollutantValues  { pm25: 80, pm10: 130, no2: 40, ... }
 * @returns {{aqi: number, category: string, dominantPollutant: string, subIndices: object}}
 */
function calculateAQI(pollutantValues = {}) {
  const subIndices = {};
  let maxIdx = -1;
  let dominant = null;

  for (const [code, value] of Object.entries(pollutantValues)) {
    const si = subIndex(code, value);
    if (si == null) continue;
    subIndices[code] = si;
    if (si > maxIdx) {
      maxIdx = si;
      dominant = code;
    }
  }

  if (maxIdx < 0) {
    return { aqi: null, category: 'Unknown', dominantPollutant: null, subIndices };
  }

  return {
    aqi: maxIdx,
    category: categorize(maxIdx),
    dominantPollutant: dominant,
    subIndices,
  };
}

const CATEGORY_COLOR = {
  Good: '#009966',
  Satisfactory: '#A6CE39',
  Moderate: '#FFDE33',
  Poor: '#FF9933',
  'Very Poor': '#CC0033',
  Severe: '#7E0023',
  Unknown: '#9CA3AF',
};

module.exports = { calculateAQI, categorize, subIndex, CATEGORY_COLOR };
