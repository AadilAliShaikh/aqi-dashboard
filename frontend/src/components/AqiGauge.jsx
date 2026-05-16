import React, { useEffect, useState } from 'react';
import { aqiColor, aqiCategory, healthAdvice } from '../utils/aqi.js';

/**
 * Speedometer-style AQI gauge.
 *  - 270° arc from 135° (lower-left, 7:30) clockwise through 12 to 45° (lower-right, 4:30)
 *  - Gap at the bottom (proper speedometer orientation)
 *  - Six colored segments, one per CPCB AQI category
 *  - Glowing needle dot at current value
 */

const SEGMENTS = [
  { from: 0,   to: 50,  color: '#34d399' },
  { from: 50,  to: 100, color: '#a3e635' },
  { from: 100, to: 200, color: '#fcd34d' },
  { from: 200, to: 300, color: '#fb923c' },
  { from: 300, to: 400, color: '#f43f5e' },
  { from: 400, to: 500, color: '#b91c1c' },
];

const R = 100;
const CX = 140;
const CY = 130;
const START_DEG = 135;
const END_DEG = 405;          // = 45° (lower-right), kept un-wrapped for clean math
const TOTAL = END_DEG - START_DEG; // 270

const rad = (d) => (d * Math.PI) / 180;
const point = (d) => [CX + R * Math.cos(rad(d)), CY + R * Math.sin(rad(d))];

function arcPath(fromDeg, toDeg, r = R) {
  const [sx, sy] = point(fromDeg);
  const [ex, ey] = point(toDeg);
  const sweepLen = toDeg - fromDeg;
  const largeArc = Math.abs(sweepLen) > 180 ? 1 : 0;
  const sweepFlag = sweepLen > 0 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} ${sweepFlag} ${ex} ${ey}`;
}

function valueToAngle(v) {
  const clamped = Math.max(0, Math.min(500, v));
  return START_DEG + (clamped / 500) * TOTAL;
}

export default function AqiGauge({ value, city }) {
  const safeValue = value == null ? null : Math.max(0, Math.min(500, value));
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (safeValue == null) return;
    let frame;
    const start = performance.now();
    const from = animated;
    const to = safeValue;
    const dur = 1100;
    const tick = (t) => {
      const pct = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - pct, 3);
      setAnimated(from + (to - from) * eased);
      if (pct < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeValue]);

  if (value == null) {
    return <p className="muted">No live AQI for {city}.</p>;
  }

  const currentDeg = valueToAngle(animated);
  const [nx, ny] = point(currentDeg);
  const color = aqiColor(Math.round(animated));
  const cat = aqiCategory(Math.round(animated));

  return (
    <div className="gauge-wrap">
      <svg width="100%" height="200" viewBox="0 0 280 220" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="g-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background track (subtle, full 270°) */}
        <path
          d={arcPath(START_DEG, END_DEG)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />

        {/* Six colored segments */}
        {SEGMENTS.map((s, i) => {
          const a1 = valueToAngle(s.from);
          const a2 = valueToAngle(s.to);
          return (
            <path
              key={i}
              d={arcPath(a1, a2)}
              stroke={s.color}
              strokeWidth="14"
              fill="none"
              strokeLinecap="butt"
              opacity="0.9"
            />
          );
        })}

        {/* Tick marks at category boundaries */}
        {[50, 100, 200, 300, 400].map((tickVal) => {
          const a = valueToAngle(tickVal);
          const [x1, y1] = [CX + (R - 12) * Math.cos(rad(a)), CY + (R - 12) * Math.sin(rad(a))];
          const [x2, y2] = [CX + (R + 12) * Math.cos(rad(a)), CY + (R + 12) * Math.sin(rad(a))];
          return <line key={tickVal} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(7,7,15,0.6)" strokeWidth="2" />;
        })}

        {/* Needle dot at current value */}
        <circle cx={nx} cy={ny} r="12" fill={color} filter="url(#g-glow)" opacity="0.6" />
        <circle cx={nx} cy={ny} r="9"  fill={color} stroke="#fff" strokeWidth="2.5" />

        {/* Scale labels */}
        <text x={point(valueToAngle(0))[0] - 8} y={point(valueToAngle(0))[1] + 24}   fontSize="10" fill="#7b809f" textAnchor="middle">0</text>
        <text x={point(valueToAngle(250))[0]}    y={point(valueToAngle(250))[1] - 16} fontSize="10" fill="#7b809f" textAnchor="middle">250</text>
        <text x={point(valueToAngle(500))[0] + 8} y={point(valueToAngle(500))[1] + 24} fontSize="10" fill="#7b809f" textAnchor="middle">500</text>
      </svg>

      <div className="gauge-readout">
        <div className="gauge-value" style={{ color }}>{Math.round(animated)}</div>
        <div className="gauge-label" style={{ background: `${color}22`, color, borderColor: `${color}55` }}>
          {cat}
        </div>
        <p className="gauge-advice">{healthAdvice(Math.round(animated))}</p>
      </div>
    </div>
  );
}
