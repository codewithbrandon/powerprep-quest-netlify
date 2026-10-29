const express = require('express');
const db = require('../db/database');
const { hashPassword, verifyPassword, generateSessionToken } = require('../utils/auth');
const { COOKIE_NAME } = require('../middleware/requireAuth');

const router = express.Router();
const SESSION_DAYS = 30;

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

async function createSession(userId) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (@token, @userId, @expiresAt)').run({
    token,
    userId,
    expiresAt,
  });
  return token;
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body || {};
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'Email and a password of at least 8 characters are required.' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await db.prepare('SELECT id FROM users WHERE email = @email').get({ email: normalizedEmail });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

    const passwordHash = hashPassword(password);
    const name = (displayName || '').trim() || normalizedEmail.split('@')[0];

    const info = await db.prepare(`
      INSERT INTO users (email, display_name, password_hash) VALUES (@email, @displayName, @passwordHash) RETURNING id
    `).run({ email: normalizedEmail, displayName: name, passwordHash });
    const userId = info.lastInsertRowid;

    await db.prepare('INSERT INTO profile (user_id) VALUES (@userId)').run({ userId });

    const token = await createSession(userId);
    setSessionCookie(res, token);
    res.status(201).json({ user: { id: userId, email: normalizedEmail, displayName: name } });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db.prepare('SELECT * FROM users WHERE email = @email').get({ email: normalizedEmail });
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = await createSession(user.id);
    setSessionCookie(res, token);
    res.json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) await db.prepare('DELETE FROM sessions WHERE token = @token').run({ token });
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = await db.prepare(`
      SELECT u.id, u.email, u.display_name FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = @token AND s.expires_at > NOW()
    `).get({ token });

    if (!session) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: { id: session.id, email: session.email, displayName: session.display_name } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
