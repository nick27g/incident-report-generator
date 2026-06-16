import { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ReportOutput from './components/ReportOutput.jsx';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 text-cyan-400">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 003 12c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

const EMPTY_META = {
  incidentType: '',
  severity: '',
  qualityScore: null,
  plainEnglish: null,
  checklist: null,
  roles: null,
};

export default function App() {
  const [report, setReport] = useState('');
  const [meta, setMeta] = useState(EMPTY_META);

  function handleGenerate({ report: reportText, incidentType, severity, qualityScore, plainEnglish, checklist, roles }) {
    setReport(reportText);
    setMeta({ incidentType, severity, qualityScore, plainEnglish, checklist, roles });
  }

  return (
    <div className="min-h-screen" style={{ background: '#020917' }}>
      <header
        style={{
          background: 'linear-gradient(180deg, #050d1e 0%, #080f22 100%)',
          borderBottom: '1px solid #0f2040',
        }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-lg p-2.5"
              style={{ background: '#0a1e38', border: '1px solid #1a4080' }}
            >
              <ShieldIcon />
            </div>
            <div>
              <h1
                className="text-sm font-bold text-white"
                style={{ letterSpacing: '0.22em', textTransform: 'uppercase' }}
              >
                Incident Report Generator
              </h1>
              <p
                className="text-cyan-400"
                style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '2px' }}
              >
                AI-Powered Security Analysis
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            <span
              className="text-slate-500"
              style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase' }}
            >
              System Online
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <InputForm onGenerate={handleGenerate} />
        <ReportOutput
          report={report}
          incidentType={meta.incidentType}
          severity={meta.severity}
          qualityScore={meta.qualityScore}
          plainEnglish={meta.plainEnglish}
          checklist={meta.checklist}
          roles={meta.roles}
        />
      </main>
    </div>
  );
}
