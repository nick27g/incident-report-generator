import { Resend } from 'resend';

// Update FROM_ADDRESS to a verified sender domain once your domain is verified in Resend.
// The default onboarding@resend.dev only delivers to the Resend account owner's email.
const FROM_ADDRESS = 'onboarding@resend.dev';

function formatTypeLabel(value) {
  return value.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, report, incidentType, severity } = req.body ?? {};

  if (!email || !report) {
    return res.status(400).json({ error: 'Missing required fields: email, report' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const typeLabel = formatTypeLabel(incidentType ?? 'unknown');
    const severityLabel = (severity ?? 'unknown').charAt(0).toUpperCase() + (severity ?? '').slice(1);

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Incident Report — ${typeLabel} · ${severityLabel} · ${dateStr}`,
      text: report,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}
