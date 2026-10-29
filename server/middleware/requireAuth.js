const db = require('../db/database');

const COOKIE_NAME = 'pp_session';

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = await db.prepare(`
      SELECT s.user_id, u.email, u.display_name
      FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = @token AND s.expires_at > NOW()
    `).get({ token });

    if (!session) return res.status(401).json({ error: 'Not authenticated' });

    req.userId = session.user_id;
    req.user = { id: session.user_id, email: session.email, displayName: session.display_name };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, COOKIE_NAME };
