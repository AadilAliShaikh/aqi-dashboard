import React from 'react';
import { maskAdvice } from '../utils/advice.js';

export default function MaskAdvisor({ aqi }) {
  const m = maskAdvice(aqi);
  return (
    <div className="advisor" style={{ '--ad-color': m.color }}>
      <div className="advisor-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11c0-3 1-5 4-5 2 0 2 1 4 1s2-1 4-1c3 0 4 2 4 5v3c0 3-1 5-4 5-2 0-2-1-4-1s-2 1-4 1c-3 0-4-2-4-5z" />
          <path d="M8 13h8M8 16h8" />
        </svg>
      </div>
      <div>
        <div className="advisor-question">should I wear a mask?</div>
        <div className="advisor-verdict">{m.mask}</div>
        <div className="advisor-reason">{m.detail}</div>
      </div>
    </div>
  );
}
