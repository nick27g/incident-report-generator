import { useState } from 'react';
import { generateReport } from '../lib/generateReport.js';
import { detectIncident } from '../lib/detectIncident.js';
import { scoreNotes } from '../lib/scoreNotes.js';
import { fetchPlainEnglish } from '../lib/fetchPlainEnglish.js';
import { fetchChecklist } from '../lib/fetchChecklist.js';
import { fetchRoles } from '../lib/fetchRoles.js';
import { getSeverityColors, SEVERITY_BORDER_COLOR } from '../lib/severity.js';

const INCIDENT_TYPES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'data-breach', label: 'Data Breach' },
  { value: 'ransomware', label: 'Ransomware' },
  { value: 'phishing', label: 'Phishing' },
  { value: 'outage', label: 'Outage' },
  { value: 'unauthorized-access', label: 'Unauthorized Access' },
  { value: 'malware', label: 'Malware' },
  { value: 'other', label: 'Other' },
];

const SEVERITIES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const BUTTON_LABELS = {
  detecting: 'Detecting...',
  generating: 'Generating Report...',
  analyzing: 'Analyzing...',
};

function typeLabel(value) {
  return INCIDENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function FieldLabel({ children }) {
  return (
    <label
      className="mb-2 block font-semibold text-slate-500"
      style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
    >
      {children}
    </label>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function InputForm({ onGenerate }) {
  const [notes, setNotes] = useState('');
  const [incidentType, setIncidentType] = useState('auto');
  const [severity, setSeverity] = useState('auto');
  const [loadingPhase, setLoadingPhase] = useState(null);
  const [error, setError] = useState('');
  const [detection, setDetection] = useState(null);

  const isLoading = loadingPhase !== null;

  async function handleGenerate() {
    setError('');
    setDetection(null);

    // Phase 1: Auto-detect
    let resolvedType = incidentType !== 'auto' ? incidentType : null;
    let resolvedSeverity = severity !== 'auto' ? severity : null;

    if (!resolvedType || !resolvedSeverity) {
      setLoadingPhase('detecting');
      try {
        const result = await detectIncident(notes);
        if (!resolvedType) resolvedType = result.incidentType;
        if (!resolvedSeverity) resolvedSeverity = result.severity;
        setDetection(result);
      } catch {
        if (!resolvedType) resolvedType = 'other';
        if (!resolvedSeverity) resolvedSeverity = 'medium';
      }
    }

    // Phase 2: Generate report + score (parallel)
    setLoadingPhase('generating');
    let reportText = null;
    let qualityScore = null;

    try {
      const [reportResult, scoreResult] = await Promise.allSettled([
        generateReport({ notes, incidentType: resolvedType, severity: resolvedSeverity }),
        scoreNotes(notes),
      ]);
      if (reportResult.status === 'rejected') throw reportResult.reason;
      reportText = reportResult.value;
      qualityScore = scoreResult.status === 'fulfilled' ? scoreResult.value : null;
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setLoadingPhase(null);
      return;
    }

    // Phase 3: Supplementary analysis (parallel, all fail-safe)
    setLoadingPhase('analyzing');

    const [peResult, clResult, roResult] = await Promise.allSettled([
      fetchPlainEnglish(reportText),
      fetchChecklist({ report: reportText, incidentType: resolvedType, severity: resolvedSeverity }),
      fetchRoles({ incidentType: resolvedType, severity: resolvedSeverity }),
    ]);

    setLoadingPhase(null);

    onGenerate({
      report: reportText,
      incidentType: resolvedType,
      severity: resolvedSeverity,
      qualityScore,
      plainEnglish: peResult.status === 'fulfilled' ? peResult.value : null,
      checklist: clResult.status === 'fulfilled' ? clResult.value : null,
      roles: roResult.status === 'fulfilled' ? roResult.value : null,
    });
  }

  const selectStyle = {
    background: '#0d1829',
    border: '1px solid #1a2e4a',
    color: '#cbd5e1',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const severitySelectStyle =
    severity !== 'auto'
      ? { ...selectStyle, borderLeftWidth: '3px', borderLeftColor: SEVERITY_BORDER_COLOR[severity] }
      : selectStyle;

  const buttonLabel = BUTTON_LABELS[loadingPhase] ?? 'Generate Report';

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Raw Incident Notes</FieldLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste or type raw notes from the incident response here..."
          rows={12}
          className="block w-full resize-y text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
          style={{
            background: '#0d1829',
            border: '1px solid #1a2e4a',
            borderRadius: '4px',
            padding: '12px',
            lineHeight: '1.65',
            fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#22d3ee')}
          onBlur={(e) => (e.target.style.borderColor = '#1a2e4a')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Incident Type</FieldLabel>
          <div className="relative">
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              style={selectStyle}
            >
              {INCIDENT_TYPES.map(({ value, label }) => (
                <option key={value} value={value} style={{ background: '#0d1829' }}>
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <FieldLabel>
            Severity
            {severity !== 'auto' && (
              <span
                className="ml-2 inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: SEVERITY_BORDER_COLOR[severity], verticalAlign: 'middle' }}
              />
            )}
          </FieldLabel>
          <div className="relative">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={severitySelectStyle}
            >
              {SEVERITIES.map(({ value, label }) => (
                <option key={value} value={value} style={{ background: '#0d1829' }}>
                  {label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {detection && (
        <div
          className="rounded px-4 py-3"
          style={{ background: '#071524', border: '1px solid #1a4a6e' }}
        >
          <div className="mb-2 flex items-center gap-3">
            <span
              className="font-bold text-cyan-500"
              style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
            >
              ◈ AI Detection
            </span>
            <span className="h-px flex-1" style={{ background: '#0f2f4a' }} />
          </div>
          <p className="text-sm font-semibold text-slate-100">
            {typeLabel(detection.incidentType)}
            {' · '}
            <span
              className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-bold ${getSeverityColors(detection.severity).badge}`}
            >
              {detection.severity.charAt(0).toUpperCase() + detection.severity.slice(1)}
            </span>
          </p>
          {detection.reasoning && (
            <p className="mt-1.5 text-xs text-slate-500">{detection.reasoning}</p>
          )}
        </div>
      )}

      {error && (
        <div
          className="rounded px-4 py-3 text-sm text-red-400"
          style={{ background: '#1a0a0a', border: '1px solid #4a1515' }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isLoading || !notes.trim()}
        className="flex items-center gap-2.5 rounded px-6 py-2.5 text-sm font-bold text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: '#22d3ee',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '11px',
        }}
        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#67e8f9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#22d3ee'; }}
      >
        {isLoading && <Spinner />}
        {buttonLabel}
      </button>
    </div>
  );
}
