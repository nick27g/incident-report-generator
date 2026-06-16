export async function fetchChecklist({ report, incidentType, severity }) {
  const res = await fetch('/api/checklist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report, incidentType, severity }),
  });
  if (!res.ok) throw new Error('Failed to fetch checklist');
  const data = await res.json();
  return data.items ?? [];
}
