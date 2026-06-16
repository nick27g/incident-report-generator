# Incident Report Generator

A dark-themed, AI-powered web app that transforms raw, unstructured incident-response notes into a complete security incident report package — including a plain-English executive summary, an interactive remediation checklist, a stakeholder notification guide, and an interactive incident timeline. Built as a portfolio project targeting an AI-Enabled Solutions Developer role at HII Mission Technologies.

**Live demo:** https://incident-report-generator-ruby.vercel.app

---

<!-- Screenshot: add screenshot here -->

---

## Features

**Core report generation**
- Paste raw notes, select incident type and severity, click Generate
- Claude produces a structured 7-section report: Executive Summary, Timeline, Affected Systems, Root Cause, Remediation Steps, Lessons Learned, Information Gaps
- Information Gaps section highlighted as a warning box when meaningful gaps are detected

**AI auto-detection**
- Both dropdowns default to "Auto-detect"
- A fast Claude call classifies the incident type and severity from the raw notes before the main report runs
- Detected values shown in a live alert banner with a one-sentence reasoning explanation

**Plain English executive card**
- A separate Claude call rewrites the report in plain language for non-technical business stakeholders
- ~150 words, 8th-grade reading level, answers: what happened, how serious is it, what needs to happen now

**Remediation checklist**
- Claude generates a prioritised list of 6–10 immediate action items with responsible roles (IT Team, Management, Legal, etc.)
- Interactive checkboxes with completion counter — check off items as you work through them
- Role labels are color-coded by function

**Severity color coding**
- Low → green, Medium → amber, High → orange, Critical → red
- Applied to the severity dropdown, auto-detection banner, and report header badge
- One-sentence plain-English explainer of business impact appears under the badge

**Glossary tooltips**
- 24 common security terms (ransomware, phishing, lateral movement, CVE, MFA, etc.) are automatically detected in the report text
- Hovering shows a plain-English definition in a dark popover
- Terms are marked with a subtle dotted underline

**Incident timeline builder**
- Timeline section from the generated report is pre-populated as a vertical timeline
- Add custom events with a timestamp and description field
- Delete individual entries, copy the full timeline as plain text

**Who Needs to Know**
- Claude identifies 5–8 stakeholder roles based on incident type and severity
- Each role includes a one-sentence note on what their involvement should be
- Role icons mapped by function

**Quality score**
- A parallel Claude call scores the raw notes 1–10 for completeness
- Score badge in the report header (green/amber/red by threshold)
- One-line tip on what detail would most improve the next report

**Email delivery**
- Enter an email address and send the full report via Resend
- HTML email includes: severity badge, incident metadata, plain-English summary, report body with Information Gaps warning box, remediation checklist, who-needs-to-know section, quality score
- Plain text fallback included; HTML build failure degrades gracefully

**Export options**
- Copy as Markdown
- Copy as plain text (markdown stripped)
- Download as `.md` (with YAML frontmatter: type, severity, generated date)
- Download as `.txt`

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite | Lightweight SPA, fast iteration |
| Styling | Tailwind CSS v4 + inline styles | Utility classes for layout; inline styles for dynamic dark-theme color values |
| AI | Anthropic API — `claude-sonnet-4-6` | Powers all seven Claude calls |
| API proxy | Vercel Serverless Functions | Both API keys stay server-side; never reach the browser |
| Email | Resend | Transactional email with a fully inline-CSS HTML template |
| Deploy | Vercel | GitHub-connected, auto-deploy on push to main |

---

## How It Works

```
User submits notes
       │
       ▼
Phase 1 ── /api/detect           → classify incident type + severity (if auto)
       │
       ▼
Phase 2 ── /api/generate  ┐      → structured 7-section report
           /api/score      ┘      → notes quality score           (parallel)
       │
       ▼
Phase 3 ── /api/plain-english  ┐  → plain English summary
           /api/checklist      ├  → action checklist              (parallel)
           /api/roles          ┘  → stakeholder list
       │
       ▼
All results delivered together → ReportOutput renders every card
```

Every Phase 3 call is wrapped in `Promise.allSettled` with individual try/catch blocks. If any single supplementary call fails, that card is silently omitted and the rest of the output is unaffected.

---

## API Key Security

Neither `ANTHROPIC_API_KEY` nor `RESEND_API_KEY` ever touches the browser. Both are read from `process.env` inside Vercel serverless functions. Locally they live in `.env`, which is in `.gitignore`. In production they are set through the Vercel dashboard under **Project → Settings → Environment Variables**.

---

## Running Locally

Vercel Functions do not run under plain `vite dev`. Use the Vercel CLI:

```bash
npm install
npm install -g vercel

cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY and RESEND_API_KEY

vercel dev
# App + all API routes available at http://localhost:3000
```

---

## Known Limitations

- No authentication — anyone with the live URL can consume API key quota
- The checklist and roles calls return JSON; a malformed Claude response causes that card to fail silently
- Email delivery to arbitrary addresses requires a Resend-verified sending domain (the current `onboarding@resend.dev` sender only delivers to the Resend account owner)
- Vercel free-tier cold starts add a few seconds of latency on the first request after inactivity
- No rate limiting on any endpoint

---

## Built By

**Nick Ghuneim** — [github.com/nick27g](https://github.com/nick27g)
