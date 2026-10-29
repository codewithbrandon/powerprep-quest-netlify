# PowerPrep Quest

A gamified study app for the Microsoft **PL-200** (Power Platform Functional Consultant) and **PL-300** (Power BI Data Analyst) certification exams, built for a whole team to use with their own accounts and progress.

**This is the Netlify-targeted copy of the project.** The backend runs as a
single Netlify Function (`netlify/functions/api.js`) instead of a
long-running server, and the database is Neon (free-tier serverless
Postgres) instead of a dedicated server. See
[`NETLIFY_DEPLOY.md`](./NETLIFY_DEPLOY.md) for the deploy steps.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS, Lucide icons, canvas-confetti
- **Backend:** Express app (`server/app.js`) shared between local dev (`server/index.js`) and the Netlify Function (`netlify/functions/api.js`, via `serverless-http`) — session-cookie auth, scrypt password hashing, no third-party identity dependency
- **Database:** PostgreSQL — local dev via Docker, [Neon](https://neon.tech) free tier in production

## Quick Start (local dev)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running (for local Postgres).

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

This brings up a local Postgres container, seeds it (first run only), then starts the API on `http://localhost:3001` and the Vite dev server on `http://localhost:5173`. Open the client URL, sign up with any email/password, and go.

To reseed from scratch: `docker compose down -v` (wipes the local DB volume), then `npm run dev` again.

## Deploying to Netlify

See [`NETLIFY_DEPLOY.md`](./NETLIFY_DEPLOY.md) for the full runbook — creating a free Neon database, setting environment variables, and deploying. Realistic cost at this app's scale: **$0/month** on both Netlify's and Neon's free tiers.

## What's inside

- **Accounts:** each person signs up with their own email/password; all XP, streaks, mastery, and exam history are scoped per-user.
- **Dual tracks:** switch between PL-200 and PL-300 from the sidebar at any time.
- **Gamification:** XP, 10 leveling titles (Citizen App Apprentice → Enterprise Solution Architect), daily check-in streaks, confetti on level-ups and exam passes.
- **Interactive skill tree:** per-domain nodes unlock based on each user's live practice accuracy.
- **DAX / Power Fx playground:** a real hand-rolled expression interpreter (`server/engine/`) executes your formulas against mock data — not pattern matching.
- **Case Study Simulator:** 2 full multi-step scenarios with stakeholders, constraints, and architectural decisions.
- **Timed Exam Simulator:** 50-question mock exam, 90-minute countdown, flag-for-review, 700/1000 passing score, full domain breakdown.
- **Flashcards:** SM-2 spaced repetition over 40 high-yield terms/functions, per-user scheduling.
- **Gemba Specialization Zone:** real-world manufacturing/operations scenarios pulled from both question banks.

## Content

- 31 PL-200 questions, 30 PL-300 questions (`server/db/data/`)
- 10 DAX/Power Fx coding challenges, verified against the real engine
- 2 full case studies (12 step-questions total)
- 40 flashcards, 20 skill tree nodes

## Security notes

- Passwords are hashed with Node's built-in `crypto.scrypt` — no plaintext storage, no third-party auth dependency.
- Sessions are random 256-bit tokens stored server-side (`sessions` table), not JWTs — revoking a session (logout) is an immediate DB delete.
- Auth endpoints are rate-limited (20 req / 15 min per IP) against brute-force attempts.
- `helmet` sets standard security headers; cookies are `httpOnly` always and `Secure` in production (HTTPS-only).
- There's no "forgot password" flow yet — if your team needs that, or wants SSO against your Microsoft Entra ID tenant instead of local passwords, that's a scoped follow-up, not a default here.
