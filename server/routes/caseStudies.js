const express = require('express');
const db = require('../db/database');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const track = req.query.track;
    const sql = track ? 'SELECT * FROM case_studies WHERE track = @track' : 'SELECT * FROM case_studies';
    const rows = await db.prepare(sql).all(track ? { track } : {});
    res.json(rows.map((r) => ({
      id: r.id,
      track: r.track,
      title: r.title,
      scenario: r.scenario,
      constraints: JSON.parse(r.constraints),
      stakeholders: JSON.parse(r.stakeholders),
    })));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const cs = await db.prepare('SELECT * FROM case_studies WHERE id = @id').get({ id: req.params.id });
    if (!cs) return res.status(404).json({ error: 'Not found' });
    const questions = await db.prepare('SELECT * FROM case_study_questions WHERE case_study_id = @id ORDER BY step_order').all({ id: cs.id });
    res.json({
      id: cs.id,
      track: cs.track,
      title: cs.title,
      scenario: cs.scenario,
      constraints: JSON.parse(cs.constraints),
      stakeholders: JSON.parse(cs.stakeholders),
      questions: questions.map((q) => ({
        id: q.id,
        step_order: q.step_order,
        question_text: q.question_text,
        options: JSON.parse(q.options),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:caseId/questions/:questionId/answer', async (req, res, next) => {
  try {
    const q = await db.prepare('SELECT * FROM case_study_questions WHERE id = @id AND case_study_id = @caseId').get({
      id: req.params.questionId,
      caseId: req.params.caseId,
    });
    if (!q) return res.status(404).json({ error: 'Not found' });
    const isCorrect = Number(req.body.selectedIndex) === q.correct_index;
    const xpAwarded = isCorrect ? XP_AWARDS.CASE_STUDY_STEP : 0;
    if (xpAwarded) await addXp(req.userId, xpAwarded);
    res.json({
      correct: isCorrect,
      correctIndex: q.correct_index,
      explanation: q.explanation,
      xpAwarded,
      profile: toClientProfile(await getProfileRow(req.userId)),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:caseId/complete', async (req, res, next) => {
  try {
    await addXp(req.userId, XP_AWARDS.CASE_STUDY_COMPLETE_BONUS);
    res.json({ xpAwarded: XP_AWARDS.CASE_STUDY_COMPLETE_BONUS, profile: toClientProfile(await getProfileRow(req.userId)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
