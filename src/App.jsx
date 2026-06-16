import { useState } from 'react';
import InputForm from './components/InputForm.jsx';
import ReportOutput from './components/ReportOutput.jsx';

export default function App() {
  const [report, setReport] = useState('');
  const [meta, setMeta] = useState({ incidentType: '', severity: '', qualityScore: null });

  function handleGenerate(reportText, incidentType, severity, qualityScore) {
    setReport(reportText);
    setMeta({ incidentType, severity, qualityScore });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 px-6 py-4 shadow">
        <h1 className="text-lg font-semibold text-white tracking-tight">
          Incident Report Generator
        </h1>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <InputForm onGenerate={handleGenerate} />
        <ReportOutput
          report={report}
          incidentType={meta.incidentType}
          severity={meta.severity}
          qualityScore={meta.qualityScore}
        />
      </main>
    </div>
  );
}
