// The configured Express app, with no listener attached. Used directly by
// index.js for local dev, and wrapped with serverless-http inside
// netlify/functions/api.js for the Netlify deployment — so routes and
// middleware never drift between the two run modes.
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRouter = require('./routes/auth');
const { requireAuth } = require('./middleware/requireAuth');
const { router: profileRouter } = require('./routes/profile');
const questionsRouter = require('./routes/questions');
const examRouter = require('./routes/exam');
const caseStudiesRouter = require('./routes/caseStudies');
const challengesRouter = require('./routes/challenges');
const flashcardsRouter = require('./routes/flashcards');
const skillTreeRouter = require('./routes/skillTree');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1); // behind Netlify's / Azure's reverse proxy & TLS terminator
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: isProd ? false : true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // Falls back to a shared bucket if a proxy/runtime ever hands us a request
  // with no resolvable IP, instead of throwing — seen in some serverless
  // environments depending on the event shape they hand to Express.
  keyGenerator: (req) => req.ip || 'unknown',
  message: { error: 'Too many attempts. Please try again in a few minutes.' },
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authLimiter, authRouter);

// Everything below requires a valid session.
app.use('/api', requireAuth);

app.use('/api/profile', profileRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/exam', examRouter);
app.use('/api/case-studies', caseStudiesRouter);
app.use('/api/challenges', challengesRouter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/skill-tree', skillTreeRouter);

// Only relevant for local/Azure single-process mode — on Netlify, static
// files are served by Netlify itself, not by this function.
if (isProd && process.env.NETLIFY !== 'true') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Central error handler — every route above forwards failures via next(err).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
