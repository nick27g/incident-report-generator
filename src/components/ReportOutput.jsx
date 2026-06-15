import { useRef } from 'react';

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

export default function ReportOutput({ report, incidentType, severity }) {
  const copyBtnRef = useRef(null);

  if (!report) return null;

  const sections = parseReport(report);

  function handleCopy() {
    navigator.clipboard.writeText(report).then(() => {
      const btn = copyBtnRef.current;
      if (!btn) return;
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    });
  }

  function handleDownload() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const header = `---\ntype: ${incidentType}\nseverity: ${severity}\ngenerated: ${dateStr}\n---\n\n`;
    const blob = new Blob([header + report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${timestamp}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const btnClass =
    'rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50';

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Generated Report</h2>
        <div className="flex gap-2">
          <button ref={copyBtnRef} onClick={handleCopy} className={btnClass}>
            Copy to clipboard
          </button>
          <button onClick={handleDownload} className={btnClass}>
            Download .md
          </button>
        </div>
      </div>

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
    </div>
  );
}
