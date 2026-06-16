import { Resend } from 'resend';
import { buildEmailHtml } from '../src/lib/buildEmailHtml.js';

// Update FROM_ADDRESS to a verified sender domain once your domain is verified in Resend.
// The default onboarding@resend.dev only delivers to the Resend account owner's email.
const FROM_ADDRESS = 'onboarding@resend.dev';

function formatTypeLabel(value) {
  return String(value ?? 'Unknown')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toPlainText(report) {
  return report
    .replace(/^## (.+)$/gm, (_, h) => h.toUpperCase())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, report, incidentType, severity, score, tip, plainEnglish, checklist, roles } = req.body ?? {};

  if (!email || !report) {
    return res.status(400).json({ error: 'Missing required fields: email, report' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const typeLabel = formatTypeLabel(incidentType);
    const severityLabel = (severity ?? 'unknown').charAt(0).toUpperCase() + (severity ?? '').slice(1);

    let html;
    try {
      html = buildEmailHtml({ report, incidentType, severity, score, tip, plainEnglish, checklist, roles });
    } catch (htmlErr) {
      console.error('HTML email build failed, falling back to plain text:', htmlErr);
    }

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: email,
      subject: `Incident Report — ${typeLabel} · ${severityLabel} · ${dateStr}`,
      text: toPlainText(report),
      ...(html ? { html } : {}),
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email. Please try again.' });
  }
}
