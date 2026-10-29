require('dotenv').config();
const db = require('./database');
const pl200Questions = require('./data/pl200Questions');
const pl300Questions = require('./data/pl300Questions');
const challenges = require('./data/challenges');
const caseStudies = require('./data/caseStudies');
const flashcards = require('./data/flashcards');
const skillNodes = require('./data/skillTree');

async function seed() {
  await db.init();

  const existing = (await db.prepare('SELECT COUNT(*) as c FROM questions').get()).c;
  if (Number(existing) > 0) {
    console.log(`[seed] Database already has ${existing} questions — skipping seed. Drop the tables to reseed.`);
    return;
  }

  const insertQuestion = db.prepare(`
    INSERT INTO questions (track, domain, question_text, options, correct_index, explanation, why_wrong, difficulty, tags, is_gemba, doc_link)
    VALUES (@track, @domain, @question_text, @options, @correct_index, @explanation, @why_wrong, @difficulty, @tags, @is_gemba, @doc_link)
  `);

  const seedQuestions = async (list, track) => {
    for (const q of list) {
      await insertQuestion.run({
        track,
        domain: q.domain,
        question_text: q.question_text,
        options: JSON.stringify(q.options),
        correct_index: q.correct_index,
        explanation: q.explanation,
        why_wrong: JSON.stringify(q.why_wrong),
        difficulty: q.difficulty,
        tags: JSON.stringify(q.tags || []),
        is_gemba: q.is_gemba ? 1 : 0,
        doc_link: q.doc_link || null,
      });
    }
  };

  await seedQuestions(pl200Questions, 'PL200');
  await seedQuestions(pl300Questions, 'PL300');
  console.log(`[seed] Inserted ${pl200Questions.length} PL-200 + ${pl300Questions.length} PL-300 questions.`);

  const insertChallenge = db.prepare(`
    INSERT INTO challenges (track, engine, title, prompt, starter_code, mock_data, expected_result, hint, solution, difficulty)
    VALUES (@track, @engine, @title, @prompt, @starter_code, @mock_data, @expected_result, @hint, @solution, @difficulty)
  `);
  for (const c of challenges) await insertChallenge.run(c);
  console.log(`[seed] Inserted ${challenges.length} DAX/Power Fx challenges.`);

  const insertCaseStudy = db.prepare(`
    INSERT INTO case_studies (track, title, scenario, constraints, stakeholders)
    VALUES (@track, @title, @scenario, @constraints, @stakeholders) RETURNING id
  `);
  const insertCaseStudyQuestion = db.prepare(`
    INSERT INTO case_study_questions (case_study_id, step_order, question_text, options, correct_index, explanation)
    VALUES (@case_study_id, @step_order, @question_text, @options, @correct_index, @explanation)
  `);
  for (const cs of caseStudies) {
    const info = await insertCaseStudy.run({
      track: cs.track,
      title: cs.title,
      scenario: cs.scenario,
      constraints: cs.constraints,
      stakeholders: cs.stakeholders,
    });
    for (const [idx, q] of cs.questions.entries()) {
      await insertCaseStudyQuestion.run({
        case_study_id: info.lastInsertRowid,
        step_order: idx + 1,
        question_text: q.question_text,
        options: JSON.stringify(q.options),
        correct_index: q.correct_index,
        explanation: q.explanation,
      });
    }
  }
  console.log(`[seed] Inserted ${caseStudies.length} case studies with their step questions.`);

  const insertFlashcard = db.prepare(`
    INSERT INTO flashcards (track, category, front, back) VALUES (@track, @category, @front, @back)
  `);
  for (const f of flashcards) await insertFlashcard.run(f);
  console.log(`[seed] Inserted ${flashcards.length} flashcards.`);

  const insertSkillNode = db.prepare(`
    INSERT INTO skill_nodes (id, track, name, domain, description, prerequisites, x, y)
    VALUES (@id, @track, @name, @domain, @description, @prerequisites, @x, @y)
  `);
  for (const n of skillNodes) {
    await insertSkillNode.run({
      id: n.id,
      track: n.track,
      name: n.name,
      domain: n.domain,
      description: n.description,
      prerequisites: JSON.stringify(n.prerequisites),
      x: n.x,
      y: n.y,
    });
  }
  console.log(`[seed] Inserted ${skillNodes.length} skill tree nodes.`);
  console.log('[seed] Done.');
}

seed()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
