function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function formatTypeLabel(value) {
  return String(value ?? 'Unknown')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const SEVERITY_EMAIL = {
  low:      { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Low' },
  medium:   { bg: '#fefce8', color: '#713f12', border: '#fde047', label: 'Medium' },
  high:     { bg: '#fff7ed', color: '#7c2d12', border: '#fdba74', label: 'High' },
  critical: { bg: '#fef2f2', color: '#7f1d1d', border: '#fca5a5', label: 'Critical' },
};

function scoreColors(score) {
  if (score >= 7) return { bg: '#dcfce7', color: '#166534' };
  if (score >= 4) return { bg: '#fef9c3', color: '#713f12' };
  return { bg: '#fee2e2', color: '#7f1d1d' };
}

const BODY_TEXT = 'margin:0 0 8px 0;font-size:14px;color:#374151;line-height:1.65;font-family:Arial,Helvetica,sans-serif;';
const LABEL_TEXT = 'margin:0 0 8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:Arial,Helvetica,sans-serif;';

function renderSection(section, index) {
  const content = section.lines.join('\n');
  const isGaps = section.title === 'Information Gaps';
  const showWarning = isGaps && isGapsMeaningful(content);

  const bodyHtml = section.lines
    .filter((l) => l.trim())
    .map((l) => `<p style="${BODY_TEXT}">${escHtml(l)}</p>`)
    .join('');

  const divider = index > 0
    ? 'border-top:1px solid #e5e7eb;margin-top:24px;padding-top:24px;'
    : '';

  if (showWarning) {
    return `
      <div style="${divider}">
        <p style="${LABEL_TEXT}color:#92400e;">⚠&nbsp; ${escHtml(section.title)}</p>
        <div style="background:#fefce8;border:1px solid #fde047;border-radius:4px;padding:14px 16px;">
          ${bodyHtml}
        </div>
      </div>`;
  }

  return `
    <div style="${divider}">
      <p style="${LABEL_TEXT}color:#1e3a5f;">${escHtml(section.title)}</p>
      ${bodyHtml}
    </div>`;
}

export function buildEmailHtml({ report, incidentType, severity, score, tip }) {
  const sv = SEVERITY_EMAIL[severity] ?? SEVERITY_EMAIL.medium;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const typeLabel = formatTypeLabel(incidentType);
  const sections = parseReport(report);

  const sectionsHtml = sections.map(renderSection).join('');

  const sc = score != null ? scoreColors(score) : null;
  const qualityHtml = sc ? `
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 32px;">
        <table cellpadding="0" cellspacing="0" width="100%" role="presentation">
          <tr>
            <td>
              <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;font-family:Arial,Helvetica,sans-serif;">Notes Quality</span>
            </td>
            <td align="right">
              <span style="display:inline-block;background:${sc.bg};color:${sc.color};border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;font-family:Arial,Helvetica,sans-serif;">${score}/10</span>
            </td>
          </tr>
          ${tip ? `
          <tr>
            <td colspan="2" style="padding-top:8px;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;font-family:Arial,Helvetica,sans-serif;"><strong style="color:#475569;">Tip:</strong> ${escHtml(tip)}</p>
            </td>
          </tr>` : ''}
        </table>
      </td>
    </tr>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Incident Report</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f1f5f9;padding:32px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.15);">

        <!-- Header -->
        <tr>
          <td style="background:#0a1628;padding:24px 32px;">
            <p style="margin:0;font-size:10px;color:#22d3ee;letter-spacing:3px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Security Operations</p>
            <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">🛡&nbsp; Incident Report Generator</p>
          </td>
        </tr>

        <!-- Severity + Metadata -->
        <tr>
          <td style="background:#0f1d35;padding:20px 32px;border-bottom:1px solid #1e3a5f;">
            <span style="display:inline-block;background:${sv.bg};color:${sv.color};border:1px solid ${sv.border};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">${sv.label}</span>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:14px;">
              <tr>
                <td style="padding-right:40px;">
                  <p style="margin:0;font-size:10px;color:#4a6080;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Incident Type</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#e2e8f0;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${escHtml(typeLabel)}</p>
                </td>
                <td>
                  <p style="margin:0;font-size:10px;color:#4a6080;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Generated</p>
                  <p style="margin:4px 0 0;font-size:14px;color:#e2e8f0;font-weight:600;font-family:Arial,Helvetica,sans-serif;">${escHtml(dateStr)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Report Body -->
        <tr>
          <td style="background:#ffffff;padding:32px;">
            ${sectionsHtml}
          </td>
        </tr>

        ${qualityHtml}

        <!-- Footer -->
        <tr>
          <td style="background:#0a1628;padding:20px 32px;border-top:1px solid #1e3a5f;">
            <p style="margin:0;font-size:11px;color:#4a6080;text-align:center;font-family:Arial,Helvetica,sans-serif;">Generated by <strong style="color:#22d3ee;">Incident Report Generator</strong></p>
            <p style="margin:8px 0 0;font-size:11px;color:#334155;text-align:center;line-height:1.55;font-family:Arial,Helvetica,sans-serif;">This report was generated with AI assistance and should be reviewed by a qualified security analyst before use in any official capacity.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
