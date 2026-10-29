const express = require('express');
const db = require('../db/database');
const { addXp, toClientProfile, getProfileRow } = require('./profile');
const { XP_AWARDS } = require('../utils/xp');

const router = express.Router();
const MASTERY_THRESHOLD = 0.6;

async function computeDomainMastery(userId, track, domain) {
  const rows = await db.prepare(`
    SELECT COALESCE(qp.mastered, 0) as mastered
    FROM questions q
    LEFT JOIN question_progress qp ON qp.question_id = q.id AND qp.user_id = @userId
    WHERE q.track = @track AND q.domain = @domain
  `).all({ userId, track, domain });
  if (!rows.length) return { ratio: 0 };
  const masteredCount = rows.filter((r) => r.mastered).length;
  return { ratio: masteredCount / rows.length };
}

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const track = req.query.track || 'PL200';
    const nodes = await db.prepare('SELECT * FROM skill_nodes WHERE track = @track').all({ track });
    const statusMap = new Map();

    // Nodes are authored in prerequisite order; two passes safely covers any ordering.
    for (let pass = 0; pass < 2; pass += 1) {
      for (const node of nodes) {
        const prereqs = JSON.parse(node.prerequisites);
        const prereqsMet = prereqs.every((p) => statusMap.get(p) === 'mastered');
        if (!prereqsMet) {
          statusMap.set(node.id, 'locked');
          continue;
        }
        const { ratio } = await computeDomainMastery(userId, track, node.domain);
        statusMap.set(node.id, ratio >= MASTERY_THRESHOLD ? 'mastered' : 'in_progress');
      }
    }

    let newlyMastered = 0;
    for (const node of nodes) {
      if (statusMap.get(node.id) !== 'mastered') continue;
      const already = await db.prepare('SELECT 1 FROM skill_node_awards WHERE user_id = @userId AND node_id = @nodeId').get({ userId, nodeId: node.id });
      if (!already) {
        await db.prepare('INSERT INTO skill_node_awards (user_id, node_id) VALUES (@userId, @nodeId)').run({ userId, nodeId: node.id });
        newlyMastered += 1;
      }
    }
    if (newlyMastered > 0) await addXp(userId, newlyMastered * XP_AWARDS.SKILL_NODE_MASTERED);

    const result = nodes.map((n) => ({
      id: n.id,
      track: n.track,
      name: n.name,
      domain: n.domain,
      description: n.description,
      prerequisites: JSON.parse(n.prerequisites),
      x: n.x,
      y: n.y,
      status: statusMap.get(n.id),
    }));

    res.json({ nodes: result, profile: toClientProfile(await getProfileRow(userId)) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
