import React from 'react';

const TONE = {
  good:    { color: '#34d399', icon: '✓' },
  bad:     { color: '#f43f5e', icon: '!' },
  warn:    { color: '#fb923c', icon: '⚠' },
  info:    { color: '#22e4ff', icon: 'i' },
  neutral: { color: '#b794ff', icon: '~' },
};

export default function PlainEnglishInsights({ insights }) {
  if (!insights || insights.length === 0) {
    return <p className="muted">Nothing notable to report. Air is steady.</p>;
  }
  return (
    <ul className="insights-list">
      {insights.map((ins, i) => {
        const t = TONE[ins.tone] || TONE.info;
        return (
          <li key={i} style={{ '--ins-color': t.color }}>
            <span className="ins-icon">{t.icon}</span>
            <span>{ins.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
