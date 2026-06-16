export async function fetchPlainEnglish(report) {
  const res = await fetch('/api/plain-english', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ report }),
  });
  if (!res.ok) throw new Error('Failed to fetch plain English summary');
  const data = await res.json();
  return data.summary;
}
