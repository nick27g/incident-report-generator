# CLAUDE.md — AI Incident Report Generator

## What This Project Is

A React/Vite web app that transforms raw, messy incident-response notes into
structured security incident reports using the Anthropic API. The app runs a
multi-stage AI pipeline: auto-classify the incident, generate the technical
report, score the notes quality, then in parallel produce a plain-English
executive summary, a prioritised action checklist, and a stakeholder
notification list. All AI calls are proxied through Vercel serverless functions
so the API key never reaches the browser.

Portfolio project for Nick Ghuneim (github.com/nick27g), targeting an
AI-Enabled Solutions Developer role at HII Mission Technologies.

**Live URL:** https://incident-report-generator-ruby.vercel.app

---

## Status

MVP complete and deployed. All planned features are built and pushed.

---

## Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React + Vite | Lightweight SPA, no SSR needed |
| Styling | Tailwind CSS v4 + inline styles | Utility classes for layout, inline styles for dynamic dark-theme colors |
| AI | Anthropic API — `claude-sonnet-4-6` | All seven Claude calls use this model |
| API proxy | Vercel Serverless Functions (`/api/*.js`) | Keeps both API keys off the client |
| Email | Resend SDK | Transactional HTML email with inline-CSS template |
| Deploy | Vercel | GitHub-connected, auto-deploy on push to main |

---

## Project Structure

```
incident-report-generator/
├── api/
│   ├── generate.js        # Main report generation (max_tokens: 1500)
│   ├── detect.js          # Auto-classify incident type + severity (max_tokens: 100)
│   ├── score.js           # Score notes quality 1-10 (max_tokens: 100)
│   ├── plain-english.js   # Plain English executive summary (max_tokens: 400)
│   ├── checklist.js       # Immediate action checklist as JSON (max_tokens: 400)
│   ├── roles.js           # Stakeholder notification list as JSON (max_tokens: 400)
│   └── email.js           # Send report via Resend; builds HTML email
├── src/
│   ├── App.jsx            # Root: holds report + meta state, composes layout
│   ├── main.jsx
│   ├── index.css          # @import tailwindcss; dark body background
│   ├── components/
│   │   ├── InputForm.jsx       # Notes textarea, dropdowns, 3-phase loading
│   │   ├── ExecutiveCard.jsx   # Plain English summary card
│   │   ├── RemediationChecklist.jsx  # Interactive checklist with checkboxes
│   │   ├── Timeline.jsx        # Vertical timeline, add/delete/copy events
│   │   ├── RolesCard.jsx       # Who Needs to Know card
│   │   └── ReportOutput.jsx    # Composes all output cards + technical report
│   └── lib/
│       ├── generateReport.js   # Fetch helper → /api/generate
│       ├── detectIncident.js   # Fetch helper → /api/detect
│       ├── scoreNotes.js       # Fetch helper → /api/score
│       ├── fetchPlainEnglish.js # Fetch helper → /api/plain-english
│       ├── fetchChecklist.js   # Fetch helper → /api/checklist
│       ├── fetchRoles.js       # Fetch helper → /api/roles
│       ├── emailReport.js      # Fetch helper → /api/email
│       ├── buildEmailHtml.js   # Builds inline-CSS HTML email string (server + client)
│       ├── glossary.js         # 24 term/definition pairs + pre-built regex
│       └── severity.js         # Severity color classes + hex values
├── .env                   # Local only — never commit
├── .env.example           # Committed — shows variable names, no values
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## Environment Variables

```bash
# .env (local — never committed)
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...

# Vercel dashboard: Project → Settings → Environment Variables
# Add the same two keys through the UI — never write them to any file
```

---

## API Routes

| Route | Input | Output | Purpose |
|-------|-------|--------|---------|
| `POST /api/generate` | `{ notes, incidentType, severity }` | `{ report: string }` | Main 7-section incident report |
| `POST /api/detect` | `{ notes }` | `{ incidentType, severity, reasoning }` | Auto-classify incident from raw notes |
| `POST /api/score` | `{ notes }` | `{ score: number, tip: string }` | Rate notes quality 1–10 |
| `POST /api/plain-english` | `{ report }` | `{ summary: string }` | Rewrite report for non-technical audience |
| `POST /api/checklist` | `{ report, incidentType, severity }` | `{ items: [{text, who}] }` | Prioritised action checklist |
| `POST /api/roles` | `{ incidentType, severity }` | `{ roles: [{role, note}] }` | Stakeholder notification list |
| `POST /api/email` | `{ email, report, incidentType, severity, score, tip, plainEnglish, checklist, roles }` | `{ success: true }` | Send HTML email via Resend |

---

## Generation Pipeline

```
User submits notes
       │
       ▼
Phase 1 ── /api/detect (if either dropdown is "Auto-detect")
       │    → resolves incidentType + severity
       ▼
Phase 2 ── /api/generate  ┐ (parallel)
           /api/score      ┘
       │    → resolves report text + quality score
       ▼
Phase 3 ── /api/plain-english  ┐
           /api/checklist      ├ (parallel, all fail-safe)
           /api/roles          ┘
       │    → resolves supplementary cards
       ▼
onGenerate callback → App state → ReportOutput renders all cards
```

---

## Key Rules

- **API key server-side only.** `ANTHROPIC_API_KEY` and `RESEND_API_KEY` must
  never appear in any file under `src/`. If either shows up there, that is a bug.
- **No `<form>` tags.** Use `onClick` handlers and controlled inputs throughout.
- **Every Claude call is wrapped in try/catch.** If a supplementary call fails,
  the corresponding card is silently omitted — never break the main report.
- **Never show raw stack traces.** All errors surface as readable inline messages.
- **Dark theme only.** No light mode toggle. All color values are inline styles
  or Tailwind dark-appropriate classes — never hardcode light backgrounds.

---

## Local Dev

```bash
npm install

# Vercel CLI is required — plain vite dev does not run the API routes
npm install -g vercel

# Copy env template and fill in your keys
cp .env.example .env
# edit .env: set ANTHROPIC_API_KEY and RESEND_API_KEY

vercel dev
# Frontend + all API routes available at http://localhost:3000
```

---

## Deploy

```bash
# First time
vercel

# All subsequent deployments: just push to main
git push origin main
# Vercel auto-deploys on every push
```

Set `ANTHROPIC_API_KEY` and `RESEND_API_KEY` in Vercel dashboard under
**Project → Settings → Environment Variables** before the first deploy.

For email delivery to arbitrary addresses (not just the Resend account owner),
update `FROM_ADDRESS` in `api/email.js` to a sender on a verified domain.

---

## Known Limitations

- No authentication — anyone with the URL can consume API key quota.
- Very long or disorganised notes can produce inconsistent report structure.
- The `checklist` and `roles` Claude calls must return valid JSON; malformed
  responses are caught and silently dropped.
- Email delivery to arbitrary addresses requires a Resend-verified sending domain
  (currently set to `onboarding@resend.dev` which only delivers to the account owner).
- Vercel free-tier cold starts add latency on the first request after inactivity.
- No rate limiting — the endpoints are open.
