# CLAUDE.md — AI Incident Report Generator

## What This Project Is
A React/Vite web app that transforms raw, messy incident notes into structured
security incident reports using the Anthropic API. Deployed to Vercel.

Portfolio project for Nick Agin (github.com/nick27g), targeting an
AI-Enabled Solutions Developer role at HII Mission Technologies.

---

## Status
MVP is built and committed. Next step: deploy to Vercel and verify the live URL.

**Live URL:** https://incident-report-generator-ruby.vercel.app

---

## Stack
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite | Lightweight, no SSR needed |
| API proxy | Vercel Serverless Function (`/api/generate.js`) | Keeps API key server-side |
| AI | Anthropic API, Claude Sonnet (`claude-sonnet-4-6`) | Core feature |
| Styling | Tailwind CSS | Fast, consistent |
| Deploy | Vercel | Free, GitHub-connected, auto-deploy on push |

---

## Project Structure
```
incident-report-generator/
├── api/
│   └── generate.js          # Vercel Function -- Anthropic call lives here
├── src/
│   ├── App.jsx              # Main UI
│   ├── components/
│   │   ├── InputForm.jsx    # Notes textarea, type/severity selectors
│   │   └── ReportOutput.jsx # Rendered report + download button
│   └── main.jsx
├── .env                     # Local only -- never commit
├── .env.example             # Committed -- shows variable names, no values
├── .gitignore               # Must include .env
├── index.html
├── package.json
└── vite.config.js
```

---

## Environment Variables
```
# .env (local)
ANTHROPIC_API_KEY=your_key_here

# Vercel dashboard: Settings → Environment Variables
# Same key, added through the UI -- never in code
```

---

## Vercel Function Pattern
The API key never touches the browser. All Anthropic calls go through
`/api/generate.js`. The frontend POSTs to `/api/generate`.

```js
// api/generate.js
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { notes, incidentType, severity } = req.body;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a senior security analyst. Generate a structured incident
report from the raw notes provided. Format: Executive Summary, Timeline,
Affected Systems, Root Cause, Remediation Steps, Lessons Learned.
Incident type: ${incidentType}. Severity: ${severity}.
Flag any information that would normally appear in a report but is missing
from the notes.`,
    messages: [{ role: 'user', content: notes }],
  });

  res.json({ report: message.content[0].text });
}
```

---

## MVP Features
- [x] Textarea for raw notes
- [x] Incident type dropdown (data breach / ransomware / phishing / outage / unauthorized access / malware / other)
- [x] Severity selector (low / medium / high / critical)
- [x] Generate button → POST to `/api/generate`
- [x] Rendered report with section headers
- [x] Download as .md button (with YAML frontmatter: type, severity, generated date)
- [x] Copy to clipboard button
- [x] Loading state during API call (spinner + "Generating..." label)
- [x] Error state if API call fails (red inline message)
- [x] Information Gaps section rendered as yellow warning box when gaps are present

---

## Key Rules
- **API key server-side only.** If it ever appears in `src/`, that is a bug.
- **No `<form>` tags.** Use `onClick` handlers and controlled inputs.
- **Keep UI clean.** This is a portfolio piece -- plain and professional beats
  fancy and broken.
- **Handle errors visibly.** Never show a raw stack trace to the user.

---

## Local Dev
```bash
npm install
npm run dev
# App runs at http://localhost:5173
# Vercel Functions don't run locally with plain Vite
# To test the API route locally: npm install -g vercel && vercel dev
```

---

## Deploy
```bash
# First time
vercel

# After that, push to main -- Vercel auto-deploys
git push origin main
```

Add `ANTHROPIC_API_KEY` in Vercel dashboard under Project → Settings →
Environment Variables before first deploy.

---

## Known Limitations
- Claude may hallucinate specific technical details not present in the notes
- Very long notes may produce inconsistent structure
- No authentication -- anyone with the URL can use the API key quota

---

## README Checklist
- [x] What it does
- [x] Live URL
- [x] Stack and rationale
- [x] How AI is integrated + prompt design
- [x] How to run locally
- [x] How API key is protected
- [x] Known limitations
- [x] What I'd build next
