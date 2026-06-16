import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are a communication specialist helping non-technical business stakeholders understand a cybersecurity incident. ' +
  'Rewrite the following security incident report as a plain English summary for a business owner or manager with no technical background. ' +
  'Use simple, everyday words. Avoid jargon. If you must use a technical term, briefly explain it in parentheses immediately after. ' +
  'Write at roughly an 8th grade reading level. Answer exactly three things in order: ' +
  '1) What happened? 2) How serious is it? 3) What needs to happen right now? ' +
  'Maximum 150 words. Return ONLY the summary text — no headers, no labels, no bullet points, no preamble.';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { report } = req.body ?? {};
  if (!report) return res.status(400).json({ error: 'Missing report' });

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: report }],
    });
    res.status(200).json({ summary: message.content[0].text });
  } catch (err) {
    console.error('Plain English error:', err);
    res.status(500).json({ error: 'Failed to generate plain English summary.' });
  }
}
