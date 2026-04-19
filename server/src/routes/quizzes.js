/**
 * Quiz REST API routes
 *
 * GET    /api/quizzes      → list all public quizzes
 * GET    /api/quizzes/:id  → get quiz with questions
 * POST   /api/quizzes      → create quiz + questions
 * PUT    /api/quizzes/:id  → update quiz + replace questions
 * DELETE /api/quizzes/:id  → delete quiz
 */

const { Router } = require('express');
const db = require('../database');

const router = Router();

// ── Helper ────────────────────────────────────────────────────────────────────

/** Shape a stored question row into the game engine format. */
function shapeQuestion(row) {
  return {
    id:           row.id,
    question:     row.question,
    options:      [row.option_a, row.option_b, row.option_c, row.option_d],
    correctIndex: row.correct_index,
    timeLimit:    row.time_limit,
    explanation:  row.explanation || '',
  };
}

function validateQuiz({ name, creator_name, questions }) {
  if (!name?.trim())         return 'Quiz name is required.';
  if (!creator_name?.trim()) return 'Creator name is required.';
  if (!Array.isArray(questions) || questions.length === 0)
    return 'A quiz must have at least one question.';
  for (const [i, q] of questions.entries()) {
    if (!q.question?.trim())
      return `Question ${i + 1}: question text is required.`;
    if (!Array.isArray(q.options) || q.options.length !== 4)
      return `Question ${i + 1}: must have exactly 4 options.`;
    if (q.options.some(o => !o?.trim()))
      return `Question ${i + 1}: all 4 options must be filled in.`;
    const ci = Number(q.correctIndex);
    if (isNaN(ci) || ci < 0 || ci > 3)
      return `Question ${i + 1}: correctIndex must be 0, 1, 2, or 3.`;
  }
  return null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get('/', (_req, res) => {
  try {
    res.json({ quizzes: db.getPublicQuizzes() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const quiz = db.getQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });
    const questions = db.getQuestions(quiz.id).map(shapeQuestion);
    res.json({ quiz, questions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, creator_name, description = '', is_public = true, questions = [] } = req.body;
    const err = validateQuiz({ name, creator_name, questions });
    if (err) return res.status(400).json({ error: err });

    const quiz = db.createQuiz({ name: name.trim(), creator_name: creator_name.trim(), description: description.trim(), is_public });
    db.setQuestions(quiz.id, questions);
    res.status(201).json({ quiz });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const quiz = db.getQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    const { name, description = '', is_public = true, questions = [] } = req.body;
    const err = validateQuiz({ name, creator_name: quiz.creator_name, questions });
    if (err) return res.status(400).json({ error: err });

    const updated = db.updateQuiz(quiz.id, { name: name.trim(), description: description.trim(), is_public });
    db.setQuestions(quiz.id, questions);
    res.json({ quiz: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    if (!db.getQuiz(req.params.id)) return res.status(404).json({ error: 'Quiz not found.' });
    db.deleteQuiz(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.shapeQuestion = shapeQuestion;
