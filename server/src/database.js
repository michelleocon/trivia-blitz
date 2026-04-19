/**
 * JSON file-based data store — no native dependencies needed.
 *
 * Data lives in: <project-root>/data/trivia.json
 * Created automatically on first run with a default quiz.
 *
 * Schema (stored as JSON):
 * {
 *   nextQuizId:     number,
 *   nextQuestionId: number,
 *   quizzes:   [ { id, name, creator_name, description, is_public, created_at } ],
 *   questions: [ { id, quiz_id, question, option_a-d, correct_index, time_limit, explanation, order_index } ]
 * }
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE  = path.join(DATA_DIR, 'trivia.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Load / save ───────────────────────────────────────────────────────────────

function load() {
  if (!fs.existsSync(DB_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return null; }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Initialise store ──────────────────────────────────────────────────────────

let store = load();

if (!store) {
  store = { nextQuizId: 1, nextQuestionId: 1, quizzes: [], questions: [] };

  // Seed default quiz
  const quizId = store.nextQuizId++;
  store.quizzes.push({
    id: quizId,
    name: 'General Knowledge',
    creator_name: 'Trivia Blitz',
    description: 'A classic mix of trivia across science, history, art, and more!',
    is_public: true,
    created_at: new Date().toISOString(),
  });

  const seedQuestions = [
    ["What is the capital of France?",              "London","Berlin","Paris","Madrid",                    2, 10, "Paris has been the capital of France since 987 AD."],
    ["Which planet is known as the Red Planet?",    "Venus","Mars","Jupiter","Saturn",                     1, 10, "Mars appears red due to iron oxide on its surface."],
    ["What is 2 to the power of 10?",              "512","1,024","2,048","256",                            1, 15, "2¹⁰ = 1,024 — why 1 KB is roughly 1,000 bytes."],
    ["Who painted the Mona Lisa?",                 "Michelangelo","Van Gogh","Picasso","Leonardo da Vinci",3, 10, "Leonardo da Vinci painted it between 1503 and 1519."],
    ["What is the chemical symbol for gold?",      "Go","Gd","Au","Ag",                                   2, 10, "Au comes from the Latin 'Aurum', meaning gold."],
    ["How many sides does a hexagon have?",        "5","6","7","8",                                        1, 10, "Hexa- is Greek for six."],
    ["What year did World War II end?",            "1943","1944","1945","1946",                            2, 15, "V-E Day in May, V-J Day in September 1945."],
    ["Which element has atomic number 1?",         "Helium","Oxygen","Carbon","Hydrogen",                  3, 10, "Hydrogen is the lightest and most abundant element."],
    ["What is the largest ocean on Earth?",        "Atlantic","Indian","Pacific","Arctic",                 2, 10, "The Pacific covers more than 30% of Earth's surface."],
    ["What language were first iPhone apps in?",   "Swift","Java","Objective-C","C++",                     2, 15, "Objective-C was the primary iOS language until Swift in 2014."],
  ];

  seedQuestions.forEach(([question, a, b, c, d, correctIndex, timeLimit, explanation], i) => {
    store.questions.push({
      id:            store.nextQuestionId++,
      quiz_id:       quizId,
      question,
      option_a:      a,
      option_b:      b,
      option_c:      c,
      option_d:      d,
      correct_index: correctIndex,
      time_limit:    timeLimit,
      explanation,
      order_index:   i,
    });
  });

  save(store);
  console.log('[DB] Created trivia.json with default quiz.');
}

// ── Public API ────────────────────────────────────────────────────────────────

const db = {
  // Quizzes
  getPublicQuizzes() {
    const quizzes = store.quizzes.filter(q => q.is_public);
    return quizzes.map(q => ({
      ...q,
      question_count: store.questions.filter(qu => qu.quiz_id === q.id).length,
    })).sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getQuiz(id) {
    return store.quizzes.find(q => q.id === Number(id)) || null;
  },

  createQuiz({ name, creator_name, description = '', is_public = true }) {
    const quiz = {
      id:           store.nextQuizId++,
      name,
      creator_name,
      description,
      is_public:    Boolean(is_public),
      created_at:   new Date().toISOString(),
    };
    store.quizzes.push(quiz);
    save(store);
    return quiz;
  },

  updateQuiz(id, { name, description, is_public }) {
    const quiz = store.quizzes.find(q => q.id === Number(id));
    if (!quiz) return null;
    if (name        !== undefined) quiz.name        = name;
    if (description !== undefined) quiz.description = description;
    if (is_public   !== undefined) quiz.is_public   = Boolean(is_public);
    save(store);
    return quiz;
  },

  deleteQuiz(id) {
    const nid = Number(id);
    store.quizzes   = store.quizzes.filter(q => q.id !== nid);
    store.questions = store.questions.filter(q => q.quiz_id !== nid);
    save(store);
  },

  // Questions
  getQuestions(quizId) {
    return store.questions
      .filter(q => q.quiz_id === Number(quizId))
      .sort((a, b) => a.order_index - b.order_index);
  },

  setQuestions(quizId, questions) {
    // Remove existing questions for this quiz
    store.questions = store.questions.filter(q => q.quiz_id !== Number(quizId));
    // Insert new ones
    questions.forEach((q, i) => {
      store.questions.push({
        id:            store.nextQuestionId++,
        quiz_id:       Number(quizId),
        question:      q.question,
        option_a:      q.options[0] ?? '',
        option_b:      q.options[1] ?? '',
        option_c:      q.options[2] ?? '',
        option_d:      q.options[3] ?? '',
        correct_index: Number(q.correctIndex ?? 0),
        time_limit:    Number(q.timeLimit ?? 10),
        explanation:   q.explanation ?? '',
        order_index:   i,
      });
    });
    save(store);
  },
};

module.exports = db;
