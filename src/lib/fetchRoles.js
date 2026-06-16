export async function fetchRoles({ incidentType, severity }) {
  const res = await fetch('/api/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incidentType, severity }),
  });
  if (!res.ok) throw new Error('Failed to fetch roles');
  const data = await res.json();
  return data.roles ?? [];
}
