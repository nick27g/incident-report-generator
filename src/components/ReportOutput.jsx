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

function scoreColorClass(score) {
  if (score >= 7) return 'bg-green-100 text-green-800';
  if (score >= 4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function SectionBody({ lines }) {
  return (
    <div className="mt-1 space-y-1 text-sm text-gray-700">
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i}>{line}</p>
        )
      )}
    </div>
  );
}

function EmailSection({ report, incidentType, severity }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    setSending(true);
    setStatus(null);
    try {
      await emailReport({ email, report, incidentType, severity });
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-4 rounded border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">Email this report</h3>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus(null); }}
          placeholder="you@example.com"
          className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={sending || !email.trim()}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send to my email'}
        </button>
      </div>
      {status === 'success' && (
        <p className="mt-2 text-sm text-green-700">Report sent successfully.</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
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

  function handleCopyMd() {
    navigator.clipboard.writeText(report).then(() => {
      const btn = copyMdBtnRef.current;
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  function handleCopyTxt() {
    navigator.clipboard.writeText(toPlainText(report)).then(() => {
      const btn = copyTxtBtnRef.current;
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  function handleDownloadMd() {
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const header = `---\ntype: ${incidentType}\nseverity: ${severity}\ngenerated: ${dateStr}\n---\n\n`;
    makeDownload(header + report, timestampedFilename('md'), 'text/markdown');
  }

  function handleDownloadTxt() {
    makeDownload(toPlainText(report), timestampedFilename('txt'), 'text/plain');
  }

  const btnClass =
    'rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50';

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900">Generated Report</h2>
          {severity && (
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityColors.badge}`}>
              {severityLabel}
            </span>
          )}
          {qualityScore && (
            <div className="flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${scoreColorClass(qualityScore.score)}`}>
                Notes quality: {qualityScore.score}/10
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button ref={copyMdBtnRef} onClick={handleCopyMd} className={btnClass}>
            Copy Markdown
          </button>
          <button ref={copyTxtBtnRef} onClick={handleCopyTxt} className={btnClass}>
            Copy plain text
          </button>
          <button onClick={handleDownloadMd} className={btnClass}>
            Download .md
          </button>
          <button onClick={handleDownloadTxt} className={btnClass}>
            Download .txt
          </button>
        </div>
      </div>

      {qualityScore?.tip && (
        <p className="mb-3 text-xs text-gray-500">
          <span className="font-medium">Tip:</span> {qualityScore.tip}
        </p>
      )}

      <div className="rounded border border-gray-200 bg-white p-6">
        {sections.map((section, i) => {
          const content = section.lines.join('\n');
          const isGaps = section.title === 'Information Gaps';
          const showWarning = isGaps && isGapsMeaningful(content);

          return (
            <div key={i} className={i > 0 ? 'mt-6' : ''}>
              <h3 className="font-bold text-gray-900">{section.title}</h3>
              {showWarning ? (
                <div className="mt-2 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                  <SectionBody lines={section.lines} />
                </div>
              ) : (
                <SectionBody lines={section.lines} />
              )}
            </div>
          );
        })}
      </div>

      <EmailSection report={report} incidentType={incidentType} severity={severity} />
    </div>
  );
}
