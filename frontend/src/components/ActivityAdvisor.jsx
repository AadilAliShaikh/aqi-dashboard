import React from 'react';
import { activityAdvice } from '../utils/advice.js';

export default function ActivityAdvisor({ aqi }) {
  const a = activityAdvice(aqi);
  return (
    <div className="advisor" style={{ '--ad-color': a.color }}>
      <div className="advisor-icon">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2.5" />
          <path d="M9 22l1.5-6 -2-3 3-4 3 2 3 0" />
        </svg>
      </div>
      <div>
        <div className="advisor-question">can I exercise outside?</div>
        <div className="advisor-verdict">{a.go}</div>
        <div className="advisor-reason">{a.reason}</div>
      </div>
    </div>
  );
}
