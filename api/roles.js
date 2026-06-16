import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are a cybersecurity incident response coordinator. ' +
  'Based on the incident type and severity, identify which roles and stakeholders need to be notified or involved in the response. ' +
  'Return ONLY a JSON array with no surrounding text, code fences, or explanation: ' +
  '[{"role":"<role title>","note":"<one sentence: what this person needs to do or why they must be involved>"}] ' +
  'Include 5-8 roles ordered by priority of notification. Be specific about what each role needs to do in this incident.';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { incidentType, severity } = req.body ?? {};
  if (!incidentType || !severity) return res.status(400).json({ error: 'Missing incidentType or severity' });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Incident type: ${incidentType}\nSeverity: ${severity}`,
      }],
    });

    let roles;
    try {
      roles = JSON.parse(message.content[0].text);
    } catch {
      roles = [];
    }

    res.status(200).json({ roles: Array.isArray(roles) ? roles : [] });
  } catch (err) {
    console.error('Roles error:', err);
    res.status(500).json({ error: 'Failed to generate role notifications.' });
  }
}
