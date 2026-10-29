const express = require('express');
const db = require('../db/database');
const { runDax } = require('../engine/daxEngine');
const { runPowerFx } = require('../engine/powerFxEngine');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function parseChallenge(row) {
  return {
    id: row.id,
    track: row.track,
    engine: row.engine,
    title: row.title,
    prompt: row.prompt,
    starter_code: row.starter_code,
    mock_data: JSON.parse(row.mock_data),
    difficulty: row.difficulty,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const { track } = req.query;
    const sql = track ? 'SELECT * FROM challenges WHERE track = @track' : 'SELECT * FROM challenges';
    const rows = await db.prepare(sql).all(track ? { track } : {});
    res.json(rows.map(parseChallenge));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT * FROM challenges WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(parseChallenge(row));
  } catch (err) {
    next(err);
  }
});

router.get('/:id/hint', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT hint FROM challenges WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ hint: row.hint });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/solution', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT solution FROM challenges WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ solution: row.solution });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/run', async (req, res, next) => {
  try {
    const row = await db.prepare('SELECT * FROM challenges WHERE id = @id').get({ id: req.params.id });
    if (!row) return res.status(404).json({ error: 'Not found' });
    const userId = req.userId;
    const { code } = req.body;
    const mockData = JSON.parse(row.mock_data);
    const expected = JSON.parse(row.expected_result);

    let runResult;
    if (row.engine === 'dax') {
      runResult = runDax(code, mockData.rows, mockData.primaryTable);
    } else {
      runResult = runPowerFx(code, mockData.tables);
    }

    if (!runResult.success) {
      return res.json({ ran: true, success: false, error: runResult.error });
    }

    const matches = deepEqual(runResult.result, expected);
    const existing = await db.prepare('SELECT * FROM challenge_progress WHERE user_id = @userId AND challenge_id = @id').get({ userId, id: row.id });
    const alreadySolved = !!existing?.solved;
    const nowSolved = matches || alreadySolved ? 1 : 0;

    await db.prepare(`
      INSERT INTO challenge_progress (user_id, challenge_id, solved, attempts) VALUES (@userId, @id, @solved, 1)
      ON CONFLICT(user_id, challenge_id) DO UPDATE SET attempts = challenge_progress.attempts + 1, solved = @solved
    `).run({ userId, id: row.id, solved: nowSolved });

    let xpAwarded = 0;
    if (matches && !alreadySolved) {
      xpAwarded = XP_AWARDS.CHALLENGE_SOLVED;
      await addXp(userId, xpAwarded);
    }

    res.json({
      ran: true,
      success: true,
      result: runResult.result,
      expected,
      matches,
      xpAwarded,
      profile: toClientProfile(await getProfileRow(userId)),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
