const express = require('express');
const db = require('../db/database');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();

function parseQuestion(row, { includeAnswer } = {}) {
  const base = {
    id: row.id,
    track: row.track,
    domain: row.domain,
    question_text: row.question_text,
    options: JSON.parse(row.options),
    difficulty: row.difficulty,
    tags: JSON.parse(row.tags),
    is_gemba: !!row.is_gemba,
    doc_link: row.doc_link,
  };
  if (includeAnswer) {
    base.correct_index = row.correct_index;
    base.explanation = row.explanation;
    base.why_wrong = JSON.parse(row.why_wrong);
  }
  return base;
}

router.get('/', async (req, res, next) => {
  try {
    const { track, domain, gembaOnly, limit } = req.query;
    let sql = 'SELECT * FROM questions WHERE 1=1';
    const params = {};
    if (track) { sql += ' AND track = @track'; params.track = track; }
    if (domain) { sql += ' AND domain = @domain'; params.domain = domain; }
    if (gembaOnly === 'true') { sql += ' AND is_gemba = 1'; }
    const rows = await db.prepare(sql).all(params);
    const shuffled = rows.sort(() => Math.random() - 0.5);
    const limited = limit ? shuffled.slice(0, Number(limit)) : shuffled;
    res.json(limited.map((r) => parseQuestion(r)));
  } catch (err) {
    next(err);
  }
});

router.get('/domains', async (req, res, next) => {
  try {
    const { track } = req.query;
    const rows = await db.prepare('SELECT DISTINCT domain FROM questions WHERE track = @track').all({ track: track || 'PL200' });
    res.json(rows.map((r) => r.domain));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT * FROM questions WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(parseQuestion(row));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/answer', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT * FROM questions WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    const userId = req.userId;
    const { selectedIndex, mode } = req.body;
    const isCorrect = Number(selectedIndex) === row.correct_index;

    const progress = await db.prepare('SELECT * FROM question_progress WHERE user_id = @userId AND question_id = @id').get({ userId, id: row.id });
    const attempts = (progress?.attempts || 0) + 1;
    const correctAttempts = (progress?.correct_attempts || 0) + (isCorrect ? 1 : 0);
    const mastered = correctAttempts >= 2 && correctAttempts / attempts >= 0.7 ? 1 : progress?.mastered || 0;
    await db.prepare(`
      INSERT INTO question_progress (user_id, question_id, attempts, correct_attempts, mastered, last_attempt_at)
      VALUES (@userId, @id, @attempts, @correctAttempts, @mastered, NOW())
      ON CONFLICT(user_id, question_id) DO UPDATE SET
        attempts = @attempts, correct_attempts = @correctAttempts, mastered = @mastered, last_attempt_at = NOW()
    `).run({ userId, id: row.id, attempts, correctAttempts, mastered });

    const xpAward = isCorrect ? (mode === 'exam' ? XP_AWARDS.EXAM_CORRECT : XP_AWARDS.PRACTICE_CORRECT) : XP_AWARDS.PRACTICE_INCORRECT;
    await addXp(userId, xpAward);

    res.json({
      correct: isCorrect,
      correctIndex: row.correct_index,
      explanation: row.explanation,
      whyWrong: JSON.parse(row.why_wrong),
      docLink: row.doc_link,
      xpAwarded: xpAward,
      profile: toClientProfile(await getProfileRow(userId)),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
