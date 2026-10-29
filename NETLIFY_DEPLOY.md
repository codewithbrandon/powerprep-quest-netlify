# Deploying PowerPrep Quest to Netlify

This folder is adapted from the main PowerPrep Quest project specifically
for Netlify: the Express backend runs as a single Netlify Function
(`netlify/functions/api.js`, wrapped with `serverless-http`) instead of a
long-running server, and the React frontend deploys as a static site.
Netlify doesn't host databases, so you'll need a free external Postgres —
**Neon** is the natural fit and has a genuinely free tier (no credit card).

## 1. Create a free Neon Postgres database

This step is yours to do — I can't sign up for a third-party service on
your behalf.

1. Go to [neon.tech](https://neon.tech) and sign up (GitHub/Google/email all work).
2. Create a new project (any name, any region — pick one close to your team).
3. On the project dashboard, copy the **pooled** connection string (toggle
   "Pooled connection" if shown — important for serverless, since each
   function invocation can open a new connection, and the pooler prevents
   exhausting Neon's connection limit). It looks like:
   ```
   postgres://<user>:<password>@<host>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require
   ```

## 2. Create the Netlify site

```bash
npx netlify-cli login        # opens a browser — your Netlify account, not mine
npx netlify-cli init         # links this folder to a new or existing Netlify site
```

Or just drag this whole folder into the Netlify dashboard's "Deploy manually"
box at app.netlify.com — either works.

## 3. Set environment variables

In the Netlify dashboard: Site settings → Environment variables, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | the pooled Neon connection string from step 1 |
| `NODE_ENV` | `production` |

(`PGSSLMODE` should stay **unset** in production — Neon requires SSL, and
the app defaults to requiring it unless you explicitly disable it for local
dev.)

## 4. Deploy

```bash
npx netlify-cli deploy --prod
```

Netlify runs `npm run build` (builds the client, installs server deps),
publishes `client/dist`, and bundles `netlify/functions/api.js` as a
serverless function. The `netlify.toml` redirects already route `/api/*` to
that function and everything else to the SPA.

## 5. First-time database seed

The schema creates itself automatically on first function invocation
(`db.init()` runs once per cold container, cached after that). To load the
question banks, challenges, case studies, flashcards, and skill tree, run
the seed script **locally, pointed at Neon**:

```bash
cd server
DATABASE_URL="<your-neon-pooled-connection-string>" npm run seed
```

Safe to re-run — it checks for existing rows and skips if already seeded.

## Local testing before you deploy

```bash
npm run install:all
npm run db:up                 # local Postgres via Docker, for local dev only
npm run dev                   # same as the main project — localhost:5173
```

To test the actual Netlify Function wrapper locally (not just the Express
app directly), there's a small diagnostic script:

```bash
node test-function.js
```

It fires simulated Lambda-style requests straight at
`netlify/functions/api.js` — useful for catching serverless-specific issues
(cookie handling, IP detection, etc.) without needing a real Netlify deploy
to find out.

## Cost

Netlify's free tier covers this comfortably at small-team scale (100GB
bandwidth/month, 125k function invocations/month). Neon's free tier gives
0.5GB storage and enough compute for this usage pattern. **Realistic total:
$0/month** at the scale this app was built for — the tradeoff versus the
Azure path is Neon's free tier has some cold-start latency and lower
ceilings if the team grows significantly, not that it costs money sooner.
