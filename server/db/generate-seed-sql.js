// Produces a single, self-contained seed.sql (schema + all content) that can
// be pasted directly into Neon's web SQL Editor — no local DB driver/network
// connection required at all. Run with: node db/generate-seed-sql.js
const fs = require('fs');
const path = require('path');

const pl200Questions = require('./data/pl200Questions');
const pl300Questions = require('./data/pl300Questions');
const challenges = require('./data/challenges');
const caseStudies = require('./data/caseStudies');
const flashcards = require('./data/flashcards');
const skillNodes = require('./data/skillTree');

function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}
function sqlInt(value) {
  return Number(value);
}

const schema = `
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
`;

const lines = [];
lines.push('-- PowerPrep Quest — full seed (schema + content). Safe to run multiple');
lines.push('-- times; guarded by a row-count check at the end of the script.');
lines.push('BEGIN;');
lines.push(schema);

lines.push(`-- Bail out early if already seeded, without erroring the whole script.`);
lines.push(`DO $$`);
lines.push(`BEGIN`);
lines.push(`  IF (SELECT COUNT(*) FROM questions) > 0 THEN`);
lines.push(`    RAISE NOTICE 'Already seeded — skipping. Truncate the tables first if you want to reseed.';`);
lines.push(`  ELSE`);
lines.push(`    -- questions`);

function questionInsert(q, track) {
  return `    INSERT INTO questions (track, domain, question_text, options, correct_index, explanation, why_wrong, difficulty, tags, is_gemba, doc_link) VALUES (${sqlStr(track)}, ${sqlStr(q.domain)}, ${sqlStr(q.question_text)}, ${sqlStr(JSON.stringify(q.options))}, ${sqlInt(q.correct_index)}, ${sqlStr(q.explanation)}, ${sqlStr(JSON.stringify(q.why_wrong))}, ${sqlStr(q.difficulty)}, ${sqlStr(JSON.stringify(q.tags || []))}, ${q.is_gemba ? 1 : 0}, ${sqlStr(q.doc_link || null)});`;
}
for (const q of pl200Questions) lines.push(questionInsert(q, 'PL200'));
for (const q of pl300Questions) lines.push(questionInsert(q, 'PL300'));

lines.push(`    -- challenges`);
for (const c of challenges) {
  lines.push(`    INSERT INTO challenges (track, engine, title, prompt, starter_code, mock_data, expected_result, hint, solution, difficulty) VALUES (${sqlStr(c.track)}, ${sqlStr(c.engine)}, ${sqlStr(c.title)}, ${sqlStr(c.prompt)}, ${sqlStr(c.starter_code)}, ${sqlStr(c.mock_data)}, ${sqlStr(c.expected_result)}, ${sqlStr(c.hint)}, ${sqlStr(c.solution)}, ${sqlStr(c.difficulty)});`);
}

lines.push(`    -- case studies (explicit ids so case_study_questions can reference them)`);
caseStudies.forEach((cs, idx) => {
  const id = idx + 1;
  lines.push(`    INSERT INTO case_studies (id, track, title, scenario, constraints, stakeholders) VALUES (${id}, ${sqlStr(cs.track)}, ${sqlStr(cs.title)}, ${sqlStr(cs.scenario)}, ${sqlStr(cs.constraints)}, ${sqlStr(cs.stakeholders)});`);
  cs.questions.forEach((q, qIdx) => {
    lines.push(`    INSERT INTO case_study_questions (case_study_id, step_order, question_text, options, correct_index, explanation) VALUES (${id}, ${qIdx + 1}, ${sqlStr(q.question_text)}, ${sqlStr(JSON.stringify(q.options))}, ${sqlInt(q.correct_index)}, ${sqlStr(q.explanation)});`);
  });
});
lines.push(`    PERFORM setval(pg_get_serial_sequence('case_studies', 'id'), (SELECT COALESCE(MAX(id), 1) FROM case_studies));`);

lines.push(`    -- flashcards`);
for (const f of flashcards) {
  lines.push(`    INSERT INTO flashcards (track, category, front, back) VALUES (${sqlStr(f.track)}, ${sqlStr(f.category)}, ${sqlStr(f.front)}, ${sqlStr(f.back)});`);
}

lines.push(`    -- skill tree nodes`);
for (const n of skillNodes) {
  lines.push(`    INSERT INTO skill_nodes (id, track, name, domain, description, prerequisites, x, y) VALUES (${sqlStr(n.id)}, ${sqlStr(n.track)}, ${sqlStr(n.name)}, ${sqlStr(n.domain)}, ${sqlStr(n.description)}, ${sqlStr(JSON.stringify(n.prerequisites))}, ${n.x}, ${n.y});`);
}

lines.push(`  END IF;`);
lines.push(`END $$;`);
lines.push('COMMIT;');

const outPath = path.join(__dirname, 'seed.sql');
fs.writeFileSync(outPath, lines.join('\n') + '\n', 'utf8');
console.log(`Wrote ${outPath} (${lines.length} lines, ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
