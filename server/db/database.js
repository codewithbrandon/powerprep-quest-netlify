const dns = require('dns');
const { Pool } = require('pg');

// Prefer IPv4 for outbound DNS resolution. Several Neon/managed-Postgres
// hosts resolve to both A and AAAA records, and broken/half-working IPv6
// paths (common on home routers) show up as "connects fine, then resets as
// soon as real data flows" — exactly a TLS handshake over Postgres.
dns.setDefaultResultOrder('ipv4first');

// node-postgres doesn't implement SCRAM channel binding, but providers like
// Neon include `channel_binding=require` in their copy-pasteable connection
// strings by default — the server then resets the connection when the
// client can't satisfy it. Strip it so Neon's string works verbatim.
function sanitizeConnectionString(raw) {
  if (!raw) return raw;
  try {
    const url = new URL(raw);
    url.searchParams.delete('channel_binding');
    return url.toString();
  } catch {
    return raw;
  }
}

const pool = new Pool({
  connectionString: sanitizeConnectionString(process.env.DATABASE_URL),
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
});

// Translate our SQLite-style @namedParam placeholders into Postgres $1, $2...
// positional placeholders, so every route can keep calling
// db.prepare(sql).run/get/all({ namedParam: value }) unchanged.
function toPositional(sql) {
  const names = [];
  const text = sql.replace(/@(\w+)/g, (_, name) => {
    let idx = names.indexOf(name);
    if (idx === -1) {
      names.push(name);
      idx = names.length - 1;
    }
    return `$${idx + 1}`;
  });
  return { text, names };
}

function buildArgs(names, params = {}) {
  return names.map((n) => {
    if (!(n in params)) throw new Error(`Missing bound parameter @${n} for query`);
    const v = params[n];
    return v === undefined ? null : v;
  });
}

const db = {
  prepare(sql) {
    const { text, names } = toPositional(sql);
    return {
      run: async (params) => {
        const res = await pool.query(text, buildArgs(names, params));
        return { lastInsertRowid: res.rows[0]?.id, rowCount: res.rowCount };
      },
      get: async (params) => {
        const res = await pool.query(text, buildArgs(names, params));
        return res.rows[0];
      },
      all: async (params) => {
        const res = await pool.query(text, buildArgs(names, params));
        return res.rows;
      },
    };
  },

  transaction(fn) {
    return async (...args) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(...args);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    };
  },

  async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS profile (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        xp INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        last_checkin TEXT,
        active_track TEXT NOT NULL DEFAULT 'PL200',
        exams_passed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        track TEXT NOT NULL,
        domain TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT NOT NULL,
        why_wrong TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'medium',
        tags TEXT NOT NULL DEFAULT '[]',
        is_gemba INTEGER NOT NULL DEFAULT 0,
        doc_link TEXT
      );

      CREATE TABLE IF NOT EXISTS question_progress (
        user_id INTEGER NOT NULL REFERENCES users(id),
        question_id INTEGER NOT NULL REFERENCES questions(id),
        attempts INTEGER NOT NULL DEFAULT 0,
        correct_attempts INTEGER NOT NULL DEFAULT 0,
        mastered INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMPTZ,
        PRIMARY KEY (user_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS case_studies (
        id SERIAL PRIMARY KEY,
        track TEXT NOT NULL,
        title TEXT NOT NULL,
        scenario TEXT NOT NULL,
        constraints TEXT NOT NULL,
        stakeholders TEXT NOT NULL DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS case_study_questions (
        id SERIAL PRIMARY KEY,
        case_study_id INTEGER NOT NULL REFERENCES case_studies(id),
        step_order INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_index INTEGER NOT NULL,
        explanation TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        track TEXT NOT NULL,
        engine TEXT NOT NULL,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        starter_code TEXT NOT NULL,
        mock_data TEXT NOT NULL,
        expected_result TEXT NOT NULL,
        hint TEXT NOT NULL,
        solution TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'medium'
      );

      CREATE TABLE IF NOT EXISTS challenge_progress (
        user_id INTEGER NOT NULL REFERENCES users(id),
        challenge_id INTEGER NOT NULL REFERENCES challenges(id),
        solved INTEGER NOT NULL DEFAULT 0,
        attempts INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, challenge_id)
      );

      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        track TEXT NOT NULL,
        category TEXT NOT NULL,
        front TEXT NOT NULL,
        back TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS flashcard_progress (
        user_id INTEGER NOT NULL REFERENCES users(id),
        flashcard_id INTEGER NOT NULL REFERENCES flashcards(id),
        ease_factor REAL NOT NULL DEFAULT 2.5,
        interval_days REAL NOT NULL DEFAULT 0,
        repetitions INTEGER NOT NULL DEFAULT 0,
        due_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_reviewed_at TIMESTAMPTZ,
        PRIMARY KEY (user_id, flashcard_id)
      );

      CREATE TABLE IF NOT EXISTS skill_nodes (
        id TEXT PRIMARY KEY,
        track TEXT NOT NULL,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        description TEXT NOT NULL,
        prerequisites TEXT NOT NULL DEFAULT '[]',
        x REAL NOT NULL DEFAULT 0,
        y REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS skill_node_awards (
        user_id INTEGER NOT NULL REFERENCES users(id),
        node_id TEXT NOT NULL REFERENCES skill_nodes(id),
        awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, node_id)
      );

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        track TEXT NOT NULL,
        score_1000 INTEGER NOT NULL,
        correct_count INTEGER NOT NULL,
        total_count INTEGER NOT NULL,
        passed INTEGER NOT NULL,
        domain_breakdown TEXT NOT NULL,
        taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  },
};

module.exports = db;
