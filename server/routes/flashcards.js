const express = require('express');
const db = require('../db/database');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();

const WITH_PROGRESS_SELECT = `
  SELECT f.id, f.track, f.category, f.front, f.back,
    COALESCE(fp.ease_factor, 2.5) as ease_factor,
    COALESCE(fp.interval_days, 0) as interval_days,
    COALESCE(fp.repetitions, 0) as repetitions,
    COALESCE(fp.due_at, NOW()) as due_at
  FROM flashcards f
  LEFT JOIN flashcard_progress fp ON fp.flashcard_id = f.id AND fp.user_id = @userId
`;

// Simplified SM-2 spaced-repetition algorithm.
function sm2(card, quality) {
  let { ease_factor: ef, interval_days: interval, repetitions: reps } = card;
  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 6;
    else interval = Math.round(interval * ef);
    reps += 1;
  }
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;
  return { ease_factor: ef, interval_days: interval, repetitions: reps };
}

router.get('/', async (req, res, next) => {
  try {
    const { track } = req.query;
    const rows = await db.prepare(`${WITH_PROGRESS_SELECT} WHERE f.track = @track`).all({ userId: req.userId, track: track || 'PL200' });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/due', async (req, res, next) => {
  try {
    const { track } = req.query;
    const rows = await db.prepare(`
      ${WITH_PROGRESS_SELECT}
      WHERE f.track = @track AND COALESCE(fp.due_at, NOW()) <= NOW()
      ORDER BY due_at ASC
    `).all({ userId: req.userId, track: track || 'PL200' });
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/review', async (req, res, next) => {
  try {
    const userId = req.userId;
    const flashcardId = Number(req.params.id);
    const card = await db.prepare('SELECT * FROM flashcards WHERE id = @id').get({ id: flashcardId });
    if (!card) return res.status(404).json({ error: 'Not found' });

    const existing = await db.prepare('SELECT * FROM flashcard_progress WHERE user_id = @userId AND flashcard_id = @id').get({ userId, id: flashcardId });
    const baseline = existing || { ease_factor: 2.5, interval_days: 0, repetitions: 0 };
    const quality = Number(req.body.quality);
    const { ease_factor, interval_days, repetitions } = sm2(baseline, quality);
    const dueAt = new Date(Date.now() + interval_days * 24 * 60 * 60 * 1000);

    await db.prepare(`
      INSERT INTO flashcard_progress (user_id, flashcard_id, ease_factor, interval_days, repetitions, due_at, last_reviewed_at)
      VALUES (@userId, @id, @ef, @interval, @reps, @dueAt, NOW())
      ON CONFLICT(user_id, flashcard_id) DO UPDATE SET
        ease_factor = @ef, interval_days = @interval, repetitions = @reps, due_at = @dueAt, last_reviewed_at = NOW()
    `).run({
      userId,
      id: flashcardId,
      ef: ease_factor,
      interval: interval_days,
      reps: repetitions,
      dueAt,
    });

    const xpAwarded = quality >= 3 ? XP_AWARDS.FLASHCARD_REVIEW : 0;
    if (xpAwarded) await addXp(userId, xpAwarded);

    res.json({ nextIntervalDays: interval_days, xpAwarded, profile: toClientProfile(await getProfileRow(userId)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
