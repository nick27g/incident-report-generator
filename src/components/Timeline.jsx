import { useState, useRef } from 'react';

function parseTimelineEntries(report) {
  if (!report) return [];
  const lines = report.split('\n');
  let inTimeline = false;
  const entries = [];

  for (const line of lines) {
    if (line.startsWith('## Timeline')) { inTimeline = true; continue; }
    if (line.startsWith('## ') && inTimeline) break;
    if (!inTimeline || !line.trim()) continue;

    const match =
      line.match(/^(.+?)\s+[–—-]\s+(.+)$/) ||
      line.match(/^(\d{1,2}[:/]\d{2}(?:[:/]\d{2})?(?:\s*[AP]M)?)\s+(.+)$/i);

    if (match) {
      entries.push({ id: `init-${entries.length}`, timestamp: match[1].trim(), description: match[2].trim() });
    } else {
      entries.push({ id: `init-${entries.length}`, timestamp: '', description: line.trim() });
    }
  }

  return entries;
}

export default function Timeline({ report }) {
  const [entries, setEntries] = useState(() => parseTimelineEntries(report));
  const [newTimestamp, setNewTimestamp] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [copied, setCopied] = useState(false);
  const copyBtnRef = useRef(null);

  function handleAdd() {
    if (!newDesc.trim()) return;
    setEntries((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, timestamp: newTimestamp.trim(), description: newDesc.trim() },
    ]);
    setNewTimestamp('');
    setNewDesc('');
  }

  function handleRemove(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCopy() {
    const text = entries
      .map((e) => (e.timestamp ? `${e.timestamp} — ${e.description}` : e.description))
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const inputStyle = {
    background: '#0d1829',
    border: '1px solid #1a2e4a',
    color: '#cbd5e1',
    borderRadius: '4px',
    padding: '6px 10px',
    fontSize: '12px',
    outline: 'none',
  };

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
          ◈ Incident Timeline
        </span>
        <span className="h-px flex-1" style={{ background: '#0f2040' }} />
        {entries.length > 0 && (
          <button
            ref={copyBtnRef}
            onClick={handleCopy}
            className="text-xs text-slate-500 hover:text-slate-300"
            style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            {copied ? 'Copied!' : 'Copy timeline'}
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {entries.length === 0 ? (
          <p className="text-xs text-slate-600 mb-4">
            No timeline events were extracted from the notes. Add them manually below.
          </p>
        ) : (
          <div className="relative mb-4 ml-2">
            {/* Vertical line */}
            <div
              className="absolute left-0 top-0 bottom-0 w-px"
              style={{ background: '#1a2e4a', marginLeft: '7px' }}
            />

            <div className="space-y-4">
              {entries.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-4 group">
                  {/* Dot */}
                  <div
                    className="relative mt-1 h-3.5 w-3.5 flex-shrink-0 rounded-full"
                    style={{
                      background: '#020917',
                      border: '2px solid #22d3ee',
                      zIndex: 1,
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    {entry.timestamp && (
                      <p
                        className="font-bold text-cyan-500"
                        style={{ fontSize: '9px', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}
                      >
                        {entry.timestamp}
                      </p>
                    )}
                    <p className="text-sm text-slate-300">{entry.description}</p>
                  </div>

                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="flex-shrink-0 text-slate-700 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                    style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add event form */}
        <div className="flex gap-2 mt-2">
          <input
            value={newTimestamp}
            onChange={(e) => setNewTimestamp(e.target.value)}
            placeholder="Time / date"
            style={{ ...inputStyle, width: '130px', flexShrink: 0 }}
            onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
            onBlur={(e) => (e.target.style.borderColor = '#1a2e4a')}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Describe the event..."
            style={{ ...inputStyle, flex: 1 }}
            onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
            onBlur={(e) => (e.target.style.borderColor = '#1a2e4a')}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <button
            onClick={handleAdd}
            disabled={!newDesc.trim()}
            className="flex-shrink-0 rounded px-3 py-1.5 text-xs font-bold text-slate-900 disabled:opacity-30"
            style={{ background: '#22d3ee', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
