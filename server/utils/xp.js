const LEVELS = [
  { level: 1, title: 'Citizen App Apprentice', minXp: 0 },
  { level: 2, title: 'Flow Builder Novice', minXp: 500 },
  { level: 3, title: 'Canvas App Crafter', minXp: 1200 },
  { level: 4, title: 'Dataverse Defender', minXp: 2200 },
  { level: 5, title: 'Power BI Analyst-in-Training', minXp: 3500 },
  { level: 6, title: 'DAX Formula Tactician', minXp: 5200 },
  { level: 7, title: 'Security Role Strategist', minXp: 7200 },
  { level: 8, title: 'Data Modeling Specialist', minXp: 9600 },
  { level: 9, title: 'Platform Solution Consultant', minXp: 12500 },
  { level: 10, title: 'Enterprise Solution Architect', minXp: 16000 },
];

function levelForXp(xp) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
    else break;
  }
  return current;
}

function nextLevel(xp) {
  const cur = levelForXp(xp);
  return LEVELS.find((l) => l.level === cur.level + 1) || null;
}

const XP_AWARDS = {
  PRACTICE_CORRECT: 10,
  PRACTICE_INCORRECT: 2,
  EXAM_CORRECT: 15,
  CASE_STUDY_STEP: 25,
  CASE_STUDY_COMPLETE_BONUS: 100,
  CHALLENGE_SOLVED: 40,
  FLASHCARD_REVIEW: 5,
  DAILY_CHECKIN: 20,
  EXAM_PASS_BONUS: 150,
  SKILL_NODE_MASTERED: 30,
};

module.exports = { LEVELS, levelForXp, nextLevel, XP_AWARDS };
