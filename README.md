# Incident Report Generator

A web app that turns raw, unstructured incident-response notes into a formatted security incident report using Claude AI. Built as a portfolio project targeting an AI-Enabled Solutions Developer role at HII Mission Technologies.

**Live:** https://incident-report-generator-ruby.vercel.app

---

## What It Does

Paste messy notes from an active or post-mortem incident response. Select the incident type and severity. Click **Generate Report**. The app sends the notes to Claude and returns a professionally structured report with these sections:

- Executive Summary
- Timeline
- Affected Systems
- Root Cause
- Remediation Steps
- Lessons Learned
- Information Gaps *(highlighted in yellow if the notes are missing details a complete report would need)*

From there you can copy the report to the clipboard or download it as a `.md` file with a metadata header (type, severity, generated date).

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite | Lightweight SPA, no SSR needed; fast dev iteration |
| Styling | Tailwind CSS v4 | Utility-first, consistent design without a component library |
| API proxy | Vercel Serverless Function (`/api/generate.js`) | Keeps the Anthropic API key off the client entirely |
| AI | Anthropic API — `claude-sonnet-4-6` | Best balance of output quality and latency for structured document generation |
| Deploy | Vercel | Free tier, GitHub-connected, zero-config for both static assets and serverless functions |

---

## How the AI Is Integrated

The frontend never calls the Anthropic API directly. It POSTs `{ notes, incidentType, severity }` to `/api/generate`, which is a Vercel serverless function that:

1. Validates the request body.
2. Instantiates the Anthropic client using a server-side environment variable.
3. Sends the notes as the user message, with a fixed system prompt that instructs Claude to produce the seven-section report format in professional third-person analyst voice.
4. Returns the raw markdown report string to the browser.

The system prompt enforces structure (section headers as `## Section Name`), voice, and a strict rule against guessing — if a fact is not in the notes, Claude must label it as unknown. The "Information Gaps" section is a deliberate prompt feature that surfaces what a real analyst would flag as missing.

---

## Running Locally

Vercel Functions don't run with plain `vite dev`. Use the Vercel CLI to get both the frontend and the API route running together:

```bash
npm install
npm install -g vercel

# Add your key to .env (see .env.example)
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...

vercel dev
# App + API available at http://localhost:3000
```

---

## How the API Key Is Protected

The `ANTHROPIC_API_KEY` is read from `process.env` inside the serverless function — it never appears in any file served to the browser. Locally it lives in `.env`, which is listed in `.gitignore`. In production it is set through the Vercel dashboard under **Project → Settings → Environment Variables** and is never written to the repository.

---

## Known Limitations

- No authentication — anyone with the URL can consume the API key quota.
- Very long or disorganized notes may produce inconsistent section structure.
- Claude may note details as "unknown" even when they are implied by context, because the prompt instructs it not to guess.
- The Vercel free tier cold-starts the serverless function on the first request after inactivity; first-load generation may take a few extra seconds.

---

## What I'd Build Next

- Rate limiting on the serverless function to protect quota.
- Optional severity badge / classification header in the downloaded report.
- Support for pasting multiple note sources and having Claude reconcile them.
- A history panel (localStorage) so previously generated reports are recoverable.
