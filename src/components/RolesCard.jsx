const ROLE_ICONS = {
  'it':        '⚙',
  'ciso':      '🛡',
  'security':  '🛡',
  'legal':     '⚖',
  'hr':        '👥',
  'executive': '📋',
  'leadership':'📋',
  'ceo':       '📋',
  'insurance': '📄',
  'law enf':   '🚔',
  'fbi':       '🚔',
  'public':    '📢',
  'pr':        '📢',
  'finance':   '💰',
};

function roleIcon(role) {
  const lower = (role ?? '').toLowerCase();
  for (const [key, icon] of Object.entries(ROLE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '◈';
}

export default function RolesCard({ roles }) {
  if (!roles || roles.length === 0) return null;

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
          ◈ Who Needs to Know
        </span>
        <span className="h-px flex-1" style={{ background: '#0f2040' }} />
        <span className="text-xs text-slate-600">{roles.length} stakeholders</span>
      </div>

      <div className="divide-y" style={{ borderColor: '#0f2040' }}>
        {roles.map((r, i) => (
          <div key={i} className="flex items-start gap-4 px-5 py-4">
            <span className="flex-shrink-0 text-base" style={{ lineHeight: '1.4' }}>
              {roleIcon(r.role)}
            </span>
            <div className="min-w-0">
              <p
                className="font-bold text-slate-100"
                style={{ fontSize: '13px', marginBottom: '3px' }}
              >
                {r.role}
              </p>
              <p className="text-xs leading-relaxed text-slate-400">{r.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
