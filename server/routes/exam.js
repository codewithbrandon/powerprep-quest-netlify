const express = require('express');
const db = require('../db/database');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();
const EXAM_LENGTH = 50;
const PASS_SCORE = 700;

router.get('/start', async (req, res, next) => {
  try {
    const track = req.query.track || 'PL200';
    const rows = await db.prepare('SELECT * FROM questions WHERE track = @track').all({ track });
    const shuffled = [...rows].sort(() => Math.random() - 0.5);
    // Real exams have exactly 50 questions; if the bank has fewer unique
    // questions than that, we reuse (reshuffled) items to always hand back a
    // full 50-item simulation rather than silently shrinking the exam.
    const selected = [];
    while (selected.length < EXAM_LENGTH) {
      for (const r of shuffled) {
        if (selected.length >= EXAM_LENGTH) break;
        selected.push(r);
      }
    }
    res.json({
      track,
      passScore: PASS_SCORE,
      totalQuestions: selected.length,
      questions: selected.map((r) => ({
        id: r.id,
        domain: r.domain,
        question_text: r.question_text,
        options: JSON.parse(r.options),
        difficulty: r.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/submit', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { track, answers, flagged, timeTakenSeconds } = req.body;
    const ids = Object.keys(answers).map(Number);
    const rows = await db.prepare('SELECT * FROM questions WHERE track = @track').all({ track });
    const byId = new Map(rows.map((r) => [r.id, r]));

    const perQuestion = [];
    const domainTally = {};
    let correctCount = 0;

    for (const id of ids) {
      const row = byId.get(id);
      if (!row) continue;
      const selectedIndex = answers[id];
      const isCorrect = Number(selectedIndex) === row.correct_index;
      if (isCorrect) correctCount += 1;
      domainTally[row.domain] = domainTally[row.domain] || { correct: 0, total: 0 };
      domainTally[row.domain].total += 1;
      if (isCorrect) domainTally[row.domain].correct += 1;

      perQuestion.push({
        id: row.id,
        domain: row.domain,
        question_text: row.question_text,
        options: JSON.parse(row.options),
        correctIndex: row.correct_index,
        selectedIndex,
        isCorrect,
        explanation: row.explanation,
        whyWrong: JSON.parse(row.why_wrong),
        flagged: !!(flagged || []).includes(id),
      });

      const progress = await db.prepare('SELECT * FROM question_progress WHERE user_id = @userId AND question_id = @id').get({ userId, id });
      const attempts = (progress?.attempts || 0) + 1;
      const correctAttempts = (progress?.correct_attempts || 0) + (isCorrect ? 1 : 0);
      const mastered = correctAttempts >= 2 && correctAttempts / attempts >= 0.7 ? 1 : progress?.mastered || 0;
      await db.prepare(`
        INSERT INTO question_progress (user_id, question_id, attempts, correct_attempts, mastered, last_attempt_at)
        VALUES (@userId, @id, @attempts, @correctAttempts, @mastered, NOW())
        ON CONFLICT(user_id, question_id) DO UPDATE SET
          attempts = @attempts, correct_attempts = @correctAttempts, mastered = @mastered, last_attempt_at = NOW()
      `).run({ userId, id, attempts, correctAttempts, mastered });
    }

    const total = ids.length;
    const score1000 = total ? Math.round((correctCount / total) * 1000) : 0;
    const passed = score1000 >= PASS_SCORE;

    await db.prepare(`
      INSERT INTO exam_attempts (user_id, track, score_1000, correct_count, total_count, passed, domain_breakdown)
      VALUES (@userId, @track, @score, @correct, @total, @passed, @breakdown)
    `).run({
      userId,
      track,
      score: score1000,
      correct: correctCount,
      total,
      passed: passed ? 1 : 0,
      breakdown: JSON.stringify(domainTally),
    });

    let xpAwarded = correctCount * XP_AWARDS.EXAM_CORRECT;
    if (passed) {
      xpAwarded += XP_AWARDS.EXAM_PASS_BONUS;
      await db.prepare('UPDATE profile SET exams_passed = exams_passed + 1 WHERE user_id = @userId').run({ userId });
    }
    await addXp(userId, xpAwarded);

    res.json({
      score1000,
      passed,
      passScore: PASS_SCORE,
      correctCount,
      total,
      timeTakenSeconds,
      domainBreakdown: domainTally,
      perQuestion,
      xpAwarded,
      profile: toClientProfile(await getProfileRow(userId)),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const userId = req.userId;
    const track = req.query.track;
    const rows = track
      ? await db.prepare('SELECT * FROM exam_attempts WHERE user_id = @userId AND track = @track ORDER BY taken_at DESC LIMIT 20').all({ userId, track })
      : await db.prepare('SELECT * FROM exam_attempts WHERE user_id = @userId ORDER BY taken_at DESC LIMIT 20').all({ userId });
    res.json(rows.map((r) => ({ ...r, domain_breakdown: JSON.parse(r.domain_breakdown) })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
