import { useRef, useState } from 'react';
import { emailReport } from '../lib/emailReport.js';
import { getSeverityColors } from '../lib/severity.js';

function parseReport(text) {
  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: line.slice(3).trim(), lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }
  if (currentSection) sections.push(currentSection);

  return sections;
}

function isGapsMeaningful(content) {
  const trimmed = content.trim().toLowerCase();
  return trimmed.length > 0 && !trimmed.startsWith('none identified');
}

function toPlainText(report) {
  return report
    .replace(/^## (.+)$/gm, (_, h) => h.toUpperCase())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function scoreColorStyle(score) {
  if (score >= 7) return { background: '#052e16', color: '#4ade80', border: '1px solid #166534' };
  if (score >= 4) return { background: '#2d1a00', color: '#fbbf24', border: '1px solid #92400e' };
  return { background: '#2d0a0a', color: '#f87171', border: '1px solid #7f1d1d' };
}

function SectionBody({ lines }) {
  return (
    <div className="mt-2 space-y-1.5">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-1.5" />
        ) : (
          <p key={i} className="text-sm leading-relaxed text-slate-300">{line}</p>
        )
      )}
    </div>
  );
}

function EmailSection({ report, incidentType, severity, qualityScore }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    setSending(true);
    setStatus(null);
    try {
      await emailReport({
        email,
        report,
        incidentType,
        severity,
        score: qualityScore?.score,
        tip: qualityScore?.tip,
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
    <div
      className="mt-4 rounded p-4"
      style={{ background: '#0a1424', border: '1px solid #1a2e4a' }}
    >
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
          style={{
            background: '#0d1829',
            border: '1px solid #1a2e4a',
            padding: '7px 12px',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
          onBlur={(e) => (e.target.style.borderColor = '#1a2e4a')}
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="rounded px-4 py-1.5 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: '#0891b2' }}
          onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = '#06b6d4'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0891b2'; }}
        >
          {sending ? 'Sending...' : 'Send to my email'}
        </button>
      </div>
      {status === 'success' && (
        <p className="mt-2 text-xs text-green-400">Report sent successfully.</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}

export default function ReportOutput({ report, incidentType, severity, qualityScore }) {
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

  return (
    <div className="mt-10">
      {/* Header bar */}
      <div
        className="mb-1 flex flex-wrap items-center gap-3 pb-4"
        style={{ borderBottom: '1px solid #0f2040' }}
      >
        <span
          className="font-bold text-slate-500"
          style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase' }}
        >
          Generated Report
        </span>
        <span className="h-px flex-1" style={{ background: '#0f2040' }} />

        {severity && (
          <span
            className={`rounded border px-2.5 py-0.5 text-xs font-bold ${severityColors.badge}`}
          >
            {severityLabel}
          </span>
        )}

        {qualityScore && (
          <span
            className="rounded px-2.5 py-0.5 text-xs font-bold"
            style={scoreColorStyle(qualityScore.score)}
          >
            QUALITY {qualityScore.score}/10
          </span>
        )}
      </div>

      {qualityScore?.tip && (
        <p className="mb-4 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Analyst tip:</span> {qualityScore.tip}
        </p>
      )}

      {/* Export buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button ref={copyMdBtnRef} onClick={handleCopyMd} style={exportBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#2a4060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2e4a'; }}
        >
          Copy Markdown
        </button>
        <button ref={copyTxtBtnRef} onClick={handleCopyTxt} style={exportBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#2a4060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2e4a'; }}
        >
          Copy plain text
        </button>
        <button onClick={handleDownloadMd} style={exportBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#2a4060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2e4a'; }}
        >
          Download .md
        </button>
        <button onClick={handleDownloadTxt} style={exportBtnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#2a4060'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#1a2e4a'; }}
        >
          Download .txt
        </button>
      </div>

      {/* Report document */}
      <div
        className="rounded"
        style={{ background: '#0a1424', border: '1px solid #1a2e4a' }}
      >
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
                <div
                  className="mt-2 rounded p-3"
                  style={{ background: '#1a1000', border: '1px solid #4a3000' }}
                >
                  <SectionBody lines={section.lines} />
                </div>
              ) : (
                <SectionBody lines={section.lines} />
              )}
            </div>
          );
        })}
      </div>

      <EmailSection
        report={report}
        incidentType={incidentType}
        severity={severity}
        qualityScore={qualityScore}
      />
    </div>
  );
}
