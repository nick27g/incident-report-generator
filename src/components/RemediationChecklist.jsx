import { useState } from 'react';

const WHO_COLORS = {
  'it team':             { bg: '#0c1f3a', text: '#60a5fa' },
  'management':          { bg: '#1a1200', text: '#fbbf24' },
  'legal':               { bg: '#1a0a2e', text: '#c084fc' },
  'hr':                  { bg: '#0f1a10', text: '#4ade80' },
  'executive leadership':{ bg: '#1a0a00', text: '#fb923c' },
  'cyber insurance':     { bg: '#0f1f1a', text: '#34d399' },
  'law enforcement':     { bg: '#1a0a0a', text: '#f87171' },
};

function whoStyle(who) {
  const key = (who ?? '').toLowerCase();
  for (const [pattern, style] of Object.entries(WHO_COLORS)) {
    if (key.includes(pattern)) return style;
  }
  return { bg: '#0f1829', text: '#94a3b8' };
}

export default function RemediationChecklist({ items }) {
  const [checked, setChecked] = useState({});

  if (!items || items.length === 0) return null;

  const completedCount = Object.values(checked).filter(Boolean).length;

  function toggle(i) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div
      className="rounded"
      style={{ background: '#060f22', border: '1px solid #1a2e4a' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid #0f2040' }}
      >
        <span
          className="font-bold text-cyan-400"
          style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          ◈ What To Do Right Now
        </span>
        <span className="h-px flex-1" style={{ background: '#0f2040' }} />
        <span className="text-xs text-slate-600">
          {completedCount}/{items.length} complete
        </span>
      </div>

      <div className="divide-y" style={{ borderColor: '#0f2040' }}>
        {items.map((item, i) => {
          const done = !!checked[i];
          const wStyle = whoStyle(item.who);
          return (
            <div
              key={i}
              className="flex items-start gap-4 px-5 py-4 transition-opacity"
              style={{ opacity: done ? 0.45 : 1, cursor: 'pointer' }}
              onClick={() => toggle(i)}
            >
              {/* Checkbox */}
              <div
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded"
                style={{
                  border: done ? '2px solid #22d3ee' : '2px solid #1a3a5a',
                  background: done ? '#22d3ee' : 'transparent',
                }}
              >
                {done && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#020917" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-bold"
                    style={{ color: '#1e3a5f' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p
                    className="text-sm text-slate-200"
                    style={{ textDecoration: done ? 'line-through' : 'none', color: done ? '#4a6080' : '#cbd5e1' }}
                  >
                    {item.text}
                  </p>
                </div>
                <span
                  className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: wStyle.bg, color: wStyle.text }}
                >
                  {item.who}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
