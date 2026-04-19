/**
 * GameManager — in-memory game session manager.
 * Loads questions from the JSON store by quizId.
 */

const db = require('./database');
const { shapeQuestion } = require('./routes/quizzes');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

class GameManager {
  constructor() {
    this.sessions = new Map();
  }

  generateCode() {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return this.sessions.has(code) ? this.generateCode() : code;
  }

  createSession(hostSocketId, quizId = null) {
    // Use provided quizId or fall back to first quiz
    const targetId = quizId ?? db.getPublicQuizzes()[0]?.id;
    if (!targetId) throw new Error('No quizzes found. Please create a quiz first.');

    const quiz = db.getQuiz(targetId);
    if (!quiz) throw new Error('Quiz not found.');

    const rawQuestions = db.getQuestions(targetId);
    if (rawQuestions.length === 0) throw new Error('This quiz has no questions yet.');

    const questions = rawQuestions.map(shapeQuestion);
    const code = this.generateCode();

    const session = {
      code,
      hostSocketId,
      quizId:    targetId,
      quizName:  quiz.name,
      players:   new Map(),
      state:     'lobby',
      currentQuestionIndex: -1,
      currentAnswers: new Map(),
      questions,
      timer:     null,
      createdAt: Date.now(),
    };

    this.sessions.set(code, session);
    console.log(`[GameManager] Session ${code} — quiz: "${quiz.name}" (${questions.length} Qs)`);
    return session;
  }

  getSession(code) {
    return this.sessions.get(code ? code.toUpperCase() : '');
  }

  getCurrentQuestion(session) {
    return session.questions[session.currentQuestionIndex];
  }

  startQuestionTimer(io, session, code) {
    if (session.timer) { clearTimeout(session.timer); session.timer = null; }
    const question = this.getCurrentQuestion(session);
    session.timer = setTimeout(() => {
      if (session.state === 'question') this.endQuestion(io, session, code);
    }, question.timeLimit * 1000);
  }

  endQuestion(io, session, code) {
    if (session.state !== 'question') return;
    if (session.timer) { clearTimeout(session.timer); session.timer = null; }
    session.state = 'question-ended';

    const question = this.getCurrentQuestion(session);
    const playerResults = [...session.players.values()].map((player) => {
      const answer = session.currentAnswers.get(player.id);
      return {
        playerId:     player.id,
        nickname:     player.nickname,
        answerIndex:  answer ? answer.answerIndex : null,
        isCorrect:    answer ? answer.isCorrect : false,
        pointsEarned: answer ? answer.points : 0,
        totalScore:   player.score,
      };
    });

    const answerCounts = new Array(4).fill(0);
    for (const ans of session.currentAnswers.values()) {
      if (ans.answerIndex !== null && ans.answerIndex >= 0) answerCounts[ans.answerIndex]++;
    }

    io.to(code).emit('game:question-end', {
      correctIndex:  question.correctIndex,
      explanation:   question.explanation || null,
      playerResults,
      answerCounts,
      answeredCount: session.currentAnswers.size,
      totalPlayers:  session.players.size,
    });
  }

  getLeaderboard(session) {
    return [...session.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((player, i) => ({ rank: i + 1, id: player.id, nickname: player.nickname, score: player.score }));
  }

  cleanupSession(code) {
    const s = this.sessions.get(code);
    if (s?.timer) clearTimeout(s.timer);
    setTimeout(() => { this.sessions.delete(code); }, 10_000);
  }
}

module.exports = new GameManager();
