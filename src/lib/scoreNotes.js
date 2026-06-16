export async function scoreNotes(notes) {
  const res = await fetch('/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  if (!res.ok) throw new Error('Scoring failed');
  return res.json();
}
