const express = require('express');
const db = require('../db/database');
const { levelForXp, nextLevel, XP_AWARDS, LEVELS } = require('../utils/xp');

const router = express.Router();

async function getProfileRow(userId) {
  return db.prepare('SELECT * FROM profile WHERE user_id = @userId').get({ userId });
}

function toClientProfile(row) {
  const lvl = levelForXp(row.xp);
  const nxt = nextLevel(row.xp);
  return {
    xp: row.xp,
    level: lvl.level,
    levelTitle: lvl.title,
    streak: row.streak,
    lastCheckin: row.last_checkin,
    activeTrack: row.active_track,
    examsPassed: row.exams_passed,
    nextLevel: nxt ? { level: nxt.level, title: nxt.title, xpNeeded: nxt.minXp - row.xp, minXp: nxt.minXp } : null,
    currentLevelMinXp: lvl.minXp,
    allLevels: LEVELS,
  };
}

async function addXp(userId, amount) {
  await db.prepare('UPDATE profile SET xp = xp + @amount WHERE user_id = @userId').run({ amount, userId });
  return getProfileRow(userId);
}

router.get('/', async (req, res, next) => {
  try {
    res.json(toClientProfile(await getProfileRow(req.userId)));
  } catch (err) {
    next(err);
  }
});

router.post('/track', async (req, res, next) => {
  try {
    const { track } = req.body;
    if (!['PL200', 'PL300'].includes(track)) return res.status(400).json({ error: 'Invalid track' });
    await db.prepare('UPDATE profile SET active_track = @track WHERE user_id = @userId').run({ track, userId: req.userId });
    res.json(toClientProfile(await getProfileRow(req.userId)));
  } catch (err) {
    next(err);
  }
});

router.post('/checkin', async (req, res, next) => {
  try {
    const row = await getProfileRow(req.userId);
    const today = new Date().toISOString().slice(0, 10);
    if (row.last_checkin === today) {
      return res.json({ alreadyCheckedIn: true, profile: toClientProfile(row) });
    }
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = row.last_checkin === yesterday ? row.streak + 1 : 1;
    const bonus = Math.min(newStreak, 10) * 5;
    await db.prepare('UPDATE profile SET streak = @streak, last_checkin = @today, xp = xp + @xp WHERE user_id = @userId').run({
      streak: newStreak,
      today,
      xp: XP_AWARDS.DAILY_CHECKIN + bonus,
      userId: req.userId,
    });
    res.json({
      alreadyCheckedIn: false,
      xpAwarded: XP_AWARDS.DAILY_CHECKIN + bonus,
      profile: toClientProfile(await getProfileRow(req.userId)),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = { router, addXp, toClientProfile, getProfileRow };
