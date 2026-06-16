export default function ExecutiveCard({ summary }) {
  if (!summary) return null;

  return (
    <div
      className="rounded"
      style={{ background: '#060f22', border: '1px solid #1a4a6e' }}
    >
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: '1px solid #0f2f4a' }}
      >
        <span
          className="font-bold text-cyan-400"
          style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          ◈ Plain English Summary
        </span>
        <span className="h-px flex-1" style={{ background: '#0f2f4a' }} />
        <span className="text-xs text-slate-600">for non-technical stakeholders</span>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm leading-relaxed text-slate-200" style={{ lineHeight: '1.75' }}>
          {summary}
        </p>
      </div>
    </div>
  );
}
