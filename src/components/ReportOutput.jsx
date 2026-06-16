import { useRef, useState } from 'react';
import { emailReport } from '../lib/emailReport.js';
import { getSeverityColors } from '../lib/severity.js';
import { GLOSSARY, GLOSSARY_TERMS, GLOSSARY_REGEX_SRC } from '../lib/glossary.js';
import ExecutiveCard from './ExecutiveCard.jsx';
import RemediationChecklist from './RemediationChecklist.jsx';
import Timeline from './Timeline.jsx';
import RolesCard from './RolesCard.jsx';

// ─── Severity ────────────────────────────────────────────────────────────────

const SEVERITY_EXPLAINERS = {
  low:      'This issue is minor and can be addressed during normal working hours.',
  medium:   'This issue needs attention today and should be escalated to your IT team.',
  high:     'This is a serious incident — stop normal operations and focus your team on containment immediately.',
  critical: 'This is a full emergency. Contain systems now, notify leadership, and consider calling external incident response support.',
};

// ─── Report parsing ───────────────────────────────────────────────────────────

function parseReport(text) {
  const sections = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { title: line.slice(3).trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

function isGapsMeaningful(content) {
  const t = content.trim().toLowerCase();
  return t.length > 0 && !t.startsWith('none identified');
}

function toPlainText(report) {
  return report
    .replace(/^## (.+)$/gm, (_, h) => h.toUpperCase())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Glossary tooltips ────────────────────────────────────────────────────────

function GlossaryTerm({ term, definition }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ borderBottom: '1px dotted #22d3ee', cursor: 'help', color: 'inherit' }}>
        {term}
      </span>
      {visible && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            zIndex: 50,
            marginBottom: '6px',
            display: 'block',
            background: '#0a1e38',
            border: '1px solid #1a4080',
            borderRadius: '4px',
            padding: '10px 12px',
            minWidth: '220px',
            maxWidth: '300px',
            whiteSpace: 'normal',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: '#22d3ee', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>
            {term}
          </span>
          <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.55' }}>
            {definition}
          </span>
        </span>
      )}
    </span>
  );
}

function tokenizeLine(text) {
  const regex = new RegExp(GLOSSARY_REGEX_SRC, 'gi');
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const matched = match[0];
    const key = GLOSSARY_TERMS.find((t) => t.toLowerCase() === matched.toLowerCase());
    parts.push({ term: matched, definition: GLOSSARY[key] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function SectionBody({ lines }) {
  return (
    <div className="mt-2 space-y-1.5">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1.5" />
        ) : (
          <p key={i} className="text-sm leading-relaxed text-slate-300">
            {tokenizeLine(line).map((part, j) =>
              typeof part === 'string' ? (
                part
              ) : (
                <GlossaryTerm key={j} term={part.term} definition={part.definition} />
              )
            )}
          </p>
        )
      )}
    </div>
  );
}

// ─── Quality score ────────────────────────────────────────────────────────────

function scoreColorStyle(score) {
  if (score >= 7) return { background: '#052e16', color: '#4ade80', border: '1px solid #166534' };
  if (score >= 4) return { background: '#2d1a00', color: '#fbbf24', border: '1px solid #92400e' };
  return { background: '#2d0a0a', color: '#f87171', border: '1px solid #7f1d1d' };
}

// ─── Email section ────────────────────────────────────────────────────────────

function EmailSection({ report, incidentType, severity, qualityScore, plainEnglish, checklist, roles }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    setSending(true);
    setStatus(null);
    try {
      await emailReport({
        email, report, incidentType, severity,
        score: qualityScore?.score,
        tip: qualityScore?.tip,
        plainEnglish,
        checklist,
        roles,
      });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded p-4" style={{ background: '#0a1424', border: '1px solid #1a2e4a' }}>
      <p
        className="mb-3 font-semibold text-slate-500"
        style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
      >
        Email This Report
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus(null); }}
          placeholder="you@example.com"
          className="flex-1 rounded text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
          style={{ background: '#0d1829', border: '1px solid #1a2e4a', padding: '7px 12px' }}
          onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
          onBlur={(e) => (e.target.style.borderColor = '#1a2e4a')}
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="rounded px-4 py-1.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: '#0891b2' }}
          onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = '#06b6d4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0891b2'; }}
        >
          {sending ? 'Sending...' : 'Send to my email'}
        </button>
      </div>
      {status === 'success' && <p className="mt-2 text-xs text-green-400">Report sent successfully.</p>}
      {status === 'error' && <p className="mt-2 text-xs text-red-400">{errorMsg}</p>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ReportOutput({ report, incidentType, severity, qualityScore, plainEnglish, checklist, roles }) {
  const copyMdBtnRef = useRef(null);
  const copyTxtBtnRef = useRef(null);

  if (!report) return null;

  const sections = parseReport(report);
  const severityColors = getSeverityColors(severity);
  const severityLabel = severity ? severity.charAt(0).toUpperCase() + severity.slice(1) : '';

  function makeDownload(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function timestampedFilename(ext) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `incident-report-${ts}.${ext}`;
  }

  function flashBtn(ref, original) {
    const btn = ref.current;
    if (!btn) return;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = original; }, 1500);
  }

  function handleCopyMd() {
    navigator.clipboard.writeText(report).then(() => flashBtn(copyMdBtnRef, 'Copy Markdown'));
  }

  function handleCopyTxt() {
    navigator.clipboard.writeText(toPlainText(report)).then(() => flashBtn(copyTxtBtnRef, 'Copy plain text'));
  }

  function handleDownloadMd() {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const header = `---\ntype: ${incidentType}\nseverity: ${severity}\ngenerated: ${dateStr}\n---\n\n`;
    makeDownload(header + report, timestampedFilename('md'), 'text/markdown');
  }

  function handleDownloadTxt() {
    makeDownload(toPlainText(report), timestampedFilename('txt'), 'text/plain');
  }

  const exportBtnStyle = {
    background: '#0d1829',
    border: '1px solid #1a2e4a',
    color: '#94a3b8',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
  };

  const hoverExport = (e, on) => {
    e.currentTarget.style.color = on ? '#e2e8f0' : '#94a3b8';
    e.currentTarget.style.borderColor = on ? '#2a4060' : '#1a2e4a';
  };

  return (
    <div className="mt-10 space-y-4">

      {/* ── Report header bar ── */}
      <div className="pb-4" style={{ borderBottom: '1px solid #0f2040' }}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="font-bold text-slate-500"
            style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
          >
            Generated Report
          </span>
          <span className="h-px flex-1" style={{ background: '#0f2040' }} />
          {severity && (
            <span className={`rounded border px-2.5 py-0.5 text-xs font-bold ${severityColors.badge}`}>
              {severityLabel}
            </span>
          )}
          {qualityScore && (
            <span className="rounded px-2.5 py-0.5 text-xs font-bold" style={scoreColorStyle(qualityScore.score)}>
              QUALITY {qualityScore.score}/10
            </span>
          )}
        </div>

        {/* Feature 3: Severity explainer */}
        {severity && SEVERITY_EXPLAINERS[severity] && (
          <p className="mt-2 text-xs text-slate-500" style={{ lineHeight: '1.55' }}>
            {SEVERITY_EXPLAINERS[severity]}
          </p>
        )}

        {qualityScore?.tip && (
          <p className="mt-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Analyst tip:</span> {qualityScore.tip}
          </p>
        )}
      </div>

      {/* ── Feature 1: Plain English Executive Card ── */}
      <ExecutiveCard summary={plainEnglish} />

      {/* ── Feature 2: Remediation Checklist ── */}
      <RemediationChecklist items={checklist} />

      {/* ── Feature 5: Timeline ── */}
      <Timeline report={report} />

      {/* ── Feature 6: Who Needs to Know ── */}
      <RolesCard roles={roles} />

      {/* ── Technical Report ── */}
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span
            className="font-bold text-slate-600"
            style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
          >
            Technical Report
          </span>
          <div className="flex flex-wrap gap-2">
            <button ref={copyMdBtnRef} onClick={handleCopyMd} style={exportBtnStyle}
              onMouseEnter={(e) => hoverExport(e, true)} onMouseLeave={(e) => hoverExport(e, false)}>
              Copy Markdown
            </button>
            <button ref={copyTxtBtnRef} onClick={handleCopyTxt} style={exportBtnStyle}
              onMouseEnter={(e) => hoverExport(e, true)} onMouseLeave={(e) => hoverExport(e, false)}>
              Copy plain text
            </button>
            <button onClick={handleDownloadMd} style={exportBtnStyle}
              onMouseEnter={(e) => hoverExport(e, true)} onMouseLeave={(e) => hoverExport(e, false)}>
              Download .md
            </button>
            <button onClick={handleDownloadTxt} style={exportBtnStyle}
              onMouseEnter={(e) => hoverExport(e, true)} onMouseLeave={(e) => hoverExport(e, false)}>
              Download .txt
            </button>
          </div>
        </div>

        <div className="rounded" style={{ background: '#0a1424', border: '1px solid #1a2e4a' }}>
          {sections.map((section, i) => {
            const content = section.lines.join('\n');
            const isGaps = section.title === 'Information Gaps';
            const showWarning = isGaps && isGapsMeaningful(content);

            return (
              <div
                key={i}
                className="px-6 py-5"
                style={i > 0 ? { borderTop: '1px solid #0f2040' } : {}}
              >
                <p
                  className="font-bold text-cyan-500"
                  style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: '2px' }}
                >
                  {section.title}
                </p>
                {showWarning ? (
                  <div className="mt-2 rounded p-3" style={{ background: '#1a1000', border: '1px solid #4a3000' }}>
                    <SectionBody lines={section.lines} />
                  </div>
                ) : (
                  <SectionBody lines={section.lines} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Email ── */}
      <EmailSection
        report={report}
        incidentType={incidentType}
        severity={severity}
        qualityScore={qualityScore}
        plainEnglish={plainEnglish}
        checklist={checklist}
        roles={roles}
      />
    </div>
  );
}
