import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are a cybersecurity incident response expert helping non-technical staff respond to a security incident. ' +
  'Generate a prioritized immediate action checklist. ' +
  'Return ONLY a JSON array with no surrounding text, code fences, or explanation: ' +
  '[{"text":"<plain language action>","who":"<responsible role: e.g. IT Team, Management, Legal, HR, Executive Leadership, Cyber Insurance Provider, Law Enforcement>"}] ' +
  'Requirements: 6-10 items ordered by urgency (most urgent first), written in plain language anyone can follow, specific and actionable. ' +
  'Do not include technical commands or jargon.';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { report, incidentType, severity } = req.body ?? {};
  if (!report) return res.status(400).json({ error: 'Missing report' });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Incident type: ${incidentType}\nSeverity: ${severity}\n\nReport:\n${report}`,
      }],
    });

    let items;
    try {
      items = JSON.parse(message.content[0].text);
    } catch {
      items = [];
    }

    res.status(200).json({ items: Array.isArray(items) ? items : [] });
  } catch (err) {
    console.error('Checklist error:', err);
    res.status(500).json({ error: 'Failed to generate checklist.' });
  }
}
