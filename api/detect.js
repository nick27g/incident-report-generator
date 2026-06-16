import Anthropic from '@anthropic-ai/sdk';

const VALID_TYPES = ['data-breach', 'ransomware', 'phishing', 'outage', 'unauthorized-access', 'malware', 'other'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

const SYSTEM_PROMPT =
  'You are a security incident classifier. Analyze the incident notes and determine the most likely incident type and severity. ' +
  `Valid incidentType values: ${VALID_TYPES.join(', ')}. ` +
  `Valid severity values: ${VALID_SEVERITIES.join(', ')}. ` +
  'Return ONLY a JSON object with no surrounding text, markdown, or explanation: ' +
  '{"incidentType":"<type>","severity":"<severity>","reasoning":"<one sentence explaining the classification>"}';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { notes } = req.body ?? {};
  if (!notes) return res.status(400).json({ error: 'Missing notes' });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: notes }],
    });

    const result = JSON.parse(message.content[0].text);

    if (!VALID_TYPES.includes(result.incidentType)) result.incidentType = 'other';
    if (!VALID_SEVERITIES.includes(result.severity)) result.severity = 'medium';

    res.status(200).json(result);
  } catch (err) {
    console.error('Detection error:', err);
    res.status(500).json({ error: 'Detection failed' });
  }
}
