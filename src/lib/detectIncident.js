export async function detectIncident(notes) {
  const res = await fetch('/api/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });

  if (!res.ok) throw new Error('Detection failed');
  return res.json();
}
