import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT =
  'You are a senior security analyst writing a structured incident report from raw notes provided by a responder. ' +
  'Produce a report with these sections in order: Executive Summary, Timeline, Affected Systems, Root Cause, Remediation Steps, Lessons Learned. ' +
  "At the end include an 'Information Gaps' section listing any details missing from the notes that a complete report would need — if nothing is missing write 'None identified.' " +
  'Format each section header as ## Section Name. ' +
  'Write in professional third-person analyst voice. ' +
  'Be specific — use facts from the notes. ' +
  'If a detail is not in the notes, note it as unknown rather than guessing. ' +
  'Return ONLY the report text, no preamble, no closing remarks.';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { notes, incidentType, severity } = req.body ?? {};

  if (!notes || !incidentType || !severity) {
    return res.status(400).json({ error: 'Missing required fields: notes, incidentType, severity' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Incident type: ${incidentType}\nSeverity: ${severity}\n\nRaw notes:\n${notes}`,
        },
      ],
    });

    res.status(200).json({ report: message.content[0].text });
  } catch (err) {
    console.error('Anthropic API error:', err);
    res.status(500).json({ error: 'Failed to generate report. Please try again.' });
  }
}
