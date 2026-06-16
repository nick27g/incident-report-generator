import { useState } from 'react';
import { generateReport } from '../lib/generateReport.js';
import { detectIncident } from '../lib/detectIncident.js';
import { scoreNotes } from '../lib/scoreNotes.js';
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

function typeLabel(value) {
  return INCIDENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function InputForm({ onGenerate }) {
  const [notes, setNotes] = useState('');
  const [incidentType, setIncidentType] = useState('auto');
  const [severity, setSeverity] = useState('auto');
  const [loadingPhase, setLoadingPhase] = useState(null); // null | 'detecting' | 'generating'
  const [error, setError] = useState('');
  const [detection, setDetection] = useState(null); // { incidentType, severity, reasoning }

  const isLoading = loadingPhase !== null;

  async function handleGenerate() {
    setError('');
    setDetection(null);

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

    setLoadingPhase('generating');

    try {
      const [reportResult, scoreResult] = await Promise.allSettled([
        generateReport({ notes, incidentType: resolvedType, severity: resolvedSeverity }),
        scoreNotes(notes),
      ]);

      if (reportResult.status === 'rejected') throw reportResult.reason;

      const qualityScore = scoreResult.status === 'fulfilled' ? scoreResult.value : null;
      onGenerate(reportResult.value, resolvedType, resolvedSeverity, qualityScore);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoadingPhase(null);
    }
  }

  const baseSelectClass =
    'block w-full rounded border px-3 py-2 text-sm text-gray-800 bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  const severitySelectStyle =
    severity !== 'auto'
      ? { borderLeftWidth: '3px', borderLeftColor: SEVERITY_BORDER_COLOR[severity] }
      : {};

  const buttonLabel =
    loadingPhase === 'detecting'
      ? 'Detecting...'
      : loadingPhase === 'generating'
      ? 'Generating...'
      : 'Generate Report';

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Raw Incident Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste or type raw notes from the incident response here..."
          rows={12}
          className="block w-full resize-y rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Incident Type</label>
          <select
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            className={baseSelectClass}
            style={{ borderColor: '#d1d5db' }}
          >
            {INCIDENT_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Severity
            {severity !== 'auto' && (
              <span
                className="ml-2 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: SEVERITY_BORDER_COLOR[severity] }}
              />
            )}
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className={baseSelectClass}
            style={{ borderColor: '#d1d5db', ...severitySelectStyle }}
          >
            {SEVERITIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {detection && (
        <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            Detected:{' '}
            <span className="font-semibold">{typeLabel(detection.incidentType)}</span>
            {' · '}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityColors(detection.severity).badge}`}
            >
              {detection.severity.charAt(0).toUpperCase() + detection.severity.slice(1)}
            </span>
          </p>
          {detection.reasoning && (
            <p className="mt-1 text-xs text-blue-700">{detection.reasoning}</p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isLoading || !notes.trim()}
        className="flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading && <Spinner />}
        {buttonLabel}
      </button>
    </div>
  );
}
