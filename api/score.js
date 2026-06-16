import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are evaluating the quality of raw incident response notes for completeness. ' +
  'Score them 1–10 based on how much useful detail they provide for writing a complete incident report. ' +
  '1–3: Very sparse. 4–6: Adequate but missing key details. 7–9: Good. 10: Comprehensive. ' +
  'Return ONLY a JSON object with no surrounding text: ' +
  '{"score":<number>,"tip":"<one sentence on the single most important missing detail that would most improve the next report>"}';

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
    res.status(200).json(result);
  } catch (err) {
    console.error('Score error:', err);
    res.status(500).json({ error: 'Scoring failed' });
  }
}
