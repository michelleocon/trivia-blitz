/**
 * Kahoot Clone — Express + Socket.io Server
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const gameManager = require('./gameManager');
const quizRoutes = require('./routes/quizzes');

const app = express();
const httpServer = http.createServer(app);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// ── REST API ──────────────────────────────────────────────────────────────────
app.use('/api/quizzes', quizRoutes);
app.get('/health', (_req, res) => res.json({ status: 'ok', sessions: gameManager.sessions.size }));

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // HOST: Create a new game session
  socket.on('host:create', ({ quizId } = {}, callback) => {
    try {
      const session = gameManager.createSession(socket.id, quizId || null);
      socket.join(session.code);
      socket.join(`host:${session.code}`);
      socket.data.gameCode = session.code;
      socket.data.isHost = true;

      callback({
        success: true,
        code: session.code,
        quizName: session.quizName,
        joinUrl: `${CLIENT_URL}/join/${session.code}`,
      });
    } catch (err) {
      console.error('[host:create]', err.message);
      callback({ success: false, error: err.message });
    }
  });

  // HOST: Start the game
  socket.on('host:start', ({ code }, callback) => {
    try {
      const session = gameManager.getSession(code);
      if (!session) throw new Error('Session not found.');
      if (session.hostSocketId !== socket.id) throw new Error('Not authorised as host.');
      if (session.state !== 'lobby') throw new Error('Game has already started.');
      if (session.players.size === 0) throw new Error('No players have joined yet.');

      session.state = 'question';
      session.currentQuestionIndex = 0;
      session.currentAnswers = new Map();

      const question = gameManager.getCurrentQuestion(session);
      io.to(code).emit('game:question-start', {
        questionNumber: 1,
        totalQuestions: session.questions.length,
        question: question.question,
        options: question.options,
        timeLimit: question.timeLimit,
        startTime: Date.now(),
      });
      gameManager.startQuestionTimer(io, session, code);
      if (callback) callback({ success: true });
    } catch (err) {
      console.error('[host:start]', err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // HOST: Manually end current question
  socket.on('host:end-question', ({ code }, callback) => {
    try {
      const session = gameManager.getSession(code);
      if (!session) throw new Error('Session not found.');
      if (session.hostSocketId !== socket.id) throw new Error('Not authorised.');
      gameManager.endQuestion(io, session, code);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // HOST: Show leaderboard
  socket.on('host:show-leaderboard', ({ code }, callback) => {
    try {
      const session = gameManager.getSession(code);
      if (!session) throw new Error('Session not found.');
      if (session.hostSocketId !== socket.id) throw new Error('Not authorised.');
      const leaderboard = gameManager.getLeaderboard(session);
      session.state = 'leaderboard';
      io.to(code).emit('game:leaderboard', {
        leaderboard,
        isLastQuestion: session.currentQuestionIndex >= session.questions.length - 1,
      });
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // HOST: Next question or end game
  socket.on('host:next-question', ({ code }, callback) => {
    try {
      const session = gameManager.getSession(code);
      if (!session) throw new Error('Session not found.');
      if (session.hostSocketId !== socket.id) throw new Error('Not authorised.');

      const nextIndex = session.currentQuestionIndex + 1;
      if (nextIndex >= session.questions.length) {
        session.state = 'finished';
        io.to(code).emit('game:over', { leaderboard: gameManager.getLeaderboard(session) });
        gameManager.cleanupSession(code);
      } else {
        session.state = 'question';
        session.currentQuestionIndex = nextIndex;
        session.currentAnswers = new Map();
        const question = gameManager.getCurrentQuestion(session);
        io.to(code).emit('game:question-start', {
          questionNumber: nextIndex + 1,
          totalQuestions: session.questions.length,
          question: question.question,
          options: question.options,
          timeLimit: question.timeLimit,
          startTime: Date.now(),
        });
        gameManager.startQuestionTimer(io, session, code);
      }
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // PLAYER: Join a game
  socket.on('player:join', ({ code, nickname }, callback) => {
    try {
      if (!code || !nickname) throw new Error('Code and nickname are required.');
      if (nickname.trim().length < 1) throw new Error('Nickname cannot be empty.');
      if (nickname.trim().length > 20) throw new Error('Nickname must be 20 characters or fewer.');

      const session = gameManager.getSession(code);
      if (!session) throw new Error('Game not found. Check your code and try again.');
      if (session.state !== 'lobby') throw new Error('This game has already started.');

      const taken = [...session.players.values()].some(
        (p) => p.nickname.toLowerCase() === nickname.trim().toLowerCase()
      );
      if (taken) throw new Error('That nickname is already taken — pick another!');

      const player = { id: socket.id, nickname: nickname.trim(), score: 0, answers: [] };
      session.players.set(socket.id, player);
      socket.join(code);
      socket.data.gameCode = code;
      socket.data.isHost = false;

      io.to(`host:${code}`).emit('host:player-joined', { players: getPlayerList(session) });
      callback({ success: true, player: { id: socket.id, nickname: player.nickname } });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  // PLAYER: Submit answer
  socket.on('player:answer', ({ code, answerIndex, timeRemaining }, callback) => {
    try {
      const session = gameManager.getSession(code);
      if (!session) throw new Error('Session not found.');
      if (session.state !== 'question') throw new Error('Not accepting answers right now.');

      const player = session.players.get(socket.id);
      if (!player) throw new Error('You are not in this game.');
      if (session.currentAnswers.has(socket.id)) {
        if (callback) callback({ success: false, error: 'Already answered.' });
        return;
      }

      const question = gameManager.getCurrentQuestion(session);
      const isCorrect = answerIndex === question.correctIndex;
      const clampedTime = Math.max(0, Math.min(timeRemaining, question.timeLimit));
      const points = isCorrect ? Math.round(1000 + 500 * (clampedTime / question.timeLimit)) : 0;

      session.currentAnswers.set(socket.id, { answerIndex, isCorrect, points, timeRemaining: clampedTime });
      player.score += points;
      player.answers.push({ answerIndex, isCorrect, points });

      io.to(`host:${code}`).emit('host:answer-received', {
        answeredCount: session.currentAnswers.size,
        totalPlayers: session.players.size,
      });

      if (session.currentAnswers.size >= session.players.size) {
        setTimeout(() => gameManager.endQuestion(io, session, code), 600);
      }

      if (callback) callback({ success: true, isCorrect, points });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Disconnection
  socket.on('disconnect', () => {
    const { gameCode, isHost } = socket.data || {};
    if (!gameCode) return;
    const session = gameManager.getSession(gameCode);
    if (!session) return;
    if (isHost) {
      io.to(gameCode).emit('game:host-disconnected');
      gameManager.cleanupSession(gameCode);
    } else {
      session.players.delete(socket.id);
      io.to(`host:${gameCode}`).emit('host:player-left', { playerId: socket.id, players: getPlayerList(session) });
    }
  });
});

function getPlayerList(session) {
  return [...session.players.values()].map((p) => ({ id: p.id, nickname: p.nickname, score: p.score }));
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`   Client URL: ${CLIENT_URL}`);
});
