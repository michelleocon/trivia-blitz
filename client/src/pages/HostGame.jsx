import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import socket from '../socket.js';
import QRCodeDisplay from '../components/QRCodeDisplay.jsx';
import PlayerList from '../components/PlayerList.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Timer from '../components/Timer.jsx';

const API = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

/**
 * HostGame — full host-side game flow.
 *
 * Phases:
 *   'pick-quiz'       → browse & select a quiz
 *   'lobby'           → waiting room (QR + player list)
 *   'question-active' → live question with answer counter
 *   'question-ended'  → results reveal
 *   'leaderboard'     → leaderboard after each question
 *   'game-over'       → final standings
 */
export default function HostGame() {
  const location = useLocation();

  // If navigated from Quiz Library with a pre-selected quiz
  const preSelected = location.state;

  const [hostPhase, setHostPhase]         = useState('pick-quiz');
  const [quizzes, setQuizzes]             = useState([]);
  const [selectedQuiz, setSelectedQuiz]   = useState(
    preSelected?.quizId ? { id: preSelected.quizId, name: preSelected.quizName } : null
  );
  const [quizzesLoading, setQuizzesLoading] = useState(true);

  const [sessionCode, setSessionCode]     = useState('');
  const [joinUrl, setJoinUrl]             = useState('');
  const [players, setPlayers]             = useState([]);
  const [currentQuestion, setCurrentQ]   = useState(null);
  const [questionResult, setQResult]      = useState(null);
  const [leaderboard, setLeaderboard]     = useState([]);
  const [isLastQuestion, setIsLast]       = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError]                 = useState('');
  const [creating, setCreating]           = useState(false);

  // Fetch quiz list for the picker
  useEffect(() => {
    fetch(`${API}/quizzes`)
      .then(r => r.json())
      .then(data => setQuizzes(data.quizzes || []))
      .catch(() => setError('Could not load quizzes from server.'))
      .finally(() => setQuizzesLoading(false));
  }, []);

  // If a quiz was pre-selected from the library, skip straight to creating
  useEffect(() => {
    if (preSelected?.quizId) {
      createGame(preSelected.quizId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket listeners
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on('host:player-joined',   ({ players }) => setPlayers(players));
    socket.on('host:player-left',     ({ players }) => setPlayers(players));
    socket.on('host:answer-received', ({ answeredCount }) => setAnsweredCount(answeredCount));
    socket.on('game:question-end',    (data) => { setQResult(data); setHostPhase('question-ended'); });
    socket.on('game:leaderboard',     ({ leaderboard, isLastQuestion }) => { setLeaderboard(leaderboard); setIsLast(isLastQuestion); setHostPhase('leaderboard'); });
    socket.on('game:over',            ({ leaderboard }) => { setLeaderboard(leaderboard); setHostPhase('game-over'); });
    return () => {
      socket.off('host:player-joined'); socket.off('host:player-left');
      socket.off('host:answer-received'); socket.off('game:question-end');
      socket.off('game:leaderboard'); socket.off('game:over');
    };
  }, []);

  useEffect(() => {
    socket.on('game:question-start', (data) => { setCurrentQ(data); setAnsweredCount(0); setQResult(null); setHostPhase('question-active'); });
    return () => socket.off('game:question-start');
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  function createGame(quizId) {
    setCreating(true);
    setError('');
    socket.emit('host:create', { quizId }, (res) => {
      setCreating(false);
      if (res.success) {
        setSessionCode(res.code);
        setJoinUrl(res.joinUrl);
        setHostPhase('lobby');
      } else {
        setError(res.error || 'Failed to create game.');
      }
    });
  }

  const startGame       = useCallback(() => socket.emit('host:start',            { code: sessionCode }, (r) => r?.error && setError(r.error)), [sessionCode]);
  const endQuestion     = useCallback(() => socket.emit('host:end-question',     { code: sessionCode }), [sessionCode]);
  const showLeaderboard = useCallback(() => socket.emit('host:show-leaderboard', { code: sessionCode }), [sessionCode]);
  const nextQuestion    = useCallback(() => socket.emit('host:next-question',    { code: sessionCode }), [sessionCode]);

  // ── PICK QUIZ ─────────────────────────────────────────────────────────────────
  if (hostPhase === 'pick-quiz') return (
    <Screen gradient="from-gray-950 via-purple-950 to-gray-950">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="mb-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-sm">← Home</Link>
          <h1 className="text-3xl font-black text-white mt-1">🎤 Host a Game</h1>
          <p className="text-white/50 text-sm mt-1">Choose a quiz to play</p>
        </div>

        {error && <ErrorBanner message={error} />}

        {quizzesLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500/40 border-t-purple-400 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!quizzesLoading && quizzes.length === 0 && (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-4xl mb-3">🤔</p>
            <p className="text-white/60 mb-4">No quizzes found. Create one first!</p>
            <Link to="/quizzes/new" className="btn-primary">✏️ Create a Quiz</Link>
          </div>
        )}

        {/* Quiz list */}
        <div className="space-y-3 mb-6">
          {quizzes.map((quiz, i) => {
            const isSelected = selectedQuiz?.id === quiz.id;
            return (
              <button
                key={quiz.id}
                type="button"
                onClick={() => setSelectedQuiz(quiz)}
                className={`
                  w-full text-left rounded-2xl p-4 transition-all duration-200
                  border-2 hover:scale-[1.01]
                  ${isSelected
                    ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                  }
                  animate-pop-in
                `}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-lg">{quiz.name}</p>
                    <p className="text-white/50 text-sm">
                      by {quiz.creator_name} &nbsp;·&nbsp;
                      <span className="text-purple-400">{quiz.question_count} questions</span>
                    </p>
                    {quiz.description && <p className="text-white/30 text-xs mt-0.5 truncate max-w-sm">{quiz.description}</p>}
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ml-4 flex items-center justify-center
                    ${isSelected ? 'border-purple-400 bg-purple-500' : 'border-white/30'}`}>
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Link to="/quizzes/new" className="btn-secondary flex-shrink-0">+ New Quiz</Link>
          <button
            onClick={() => selectedQuiz && createGame(selectedQuiz.id)}
            disabled={!selectedQuiz || creating}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating…
              </span>
            ) : selectedQuiz ? `🚀 Host "${selectedQuiz.name}"` : 'Select a quiz first'}
          </button>
        </div>
      </div>
    </Screen>
  );

  // ── LOBBY ─────────────────────────────────────────────────────────────────────
  if (hostPhase === 'lobby') return (
    <Screen gradient="from-gray-950 via-purple-950 to-gray-950">
      <div className="w-full max-w-2xl space-y-6 animate-slide-up">
        <div className="text-center">
          <h2 className="text-2xl font-black text-white">Waiting Room</h2>
          <p className="text-white/50 text-sm">Share the code or QR to invite players</p>
        </div>
        <div className="glass rounded-3xl p-6 flex flex-col items-center">
          <QRCodeDisplay url={joinUrl} code={sessionCode} size={180} />
        </div>
        <div className="glass rounded-3xl p-6">
          <h3 className="font-bold text-white/80 mb-4">Players <span className="text-purple-400">({players.length})</span></h3>
          <PlayerList players={players} />
        </div>
        {error && <ErrorBanner message={error} />}
        <button onClick={startGame} disabled={players.length === 0} className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
          {players.length === 0 ? 'Waiting for players…' : `🚀 Start Game (${players.length} player${players.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </Screen>
  );

  // ── QUESTION ACTIVE ───────────────────────────────────────────────────────────
  if (hostPhase === 'question-active' && currentQuestion) return (
    <Screen gradient="from-gray-950 via-blue-950 to-gray-950">
      <div className="w-full max-w-2xl space-y-5 animate-pop-in">
        <ProgressBar current={currentQuestion.questionNumber} total={currentQuestion.totalQuestions} />
        <div className="glass rounded-3xl p-6 flex flex-col items-center gap-5">
          <Timer startTime={currentQuestion.startTime} timeLimit={currentQuestion.timeLimit} showTicks onExpire={() => {}} />
          <h2 className="text-2xl md:text-3xl font-black text-white text-center leading-tight">{currentQuestion.question}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, i) => <AnswerTile key={i} index={i} label={opt} />)}
        </div>
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm">Answers received</p>
            <p className="text-2xl font-black text-white">{answeredCount} <span className="text-white/40 text-lg font-normal">/ {players.length}</span></p>
          </div>
          <button onClick={endQuestion} className="btn-secondary text-sm">⏩ End Early</button>
        </div>
      </div>
    </Screen>
  );

  // ── QUESTION ENDED ────────────────────────────────────────────────────────────
  if (hostPhase === 'question-ended' && questionResult && currentQuestion) {
    const { correctIndex, explanation, answerCounts, answeredCount: totalAnswered } = questionResult;
    return (
      <Screen gradient="from-gray-950 via-blue-950 to-gray-950">
        <div className="w-full max-w-2xl space-y-5 animate-pop-in">
          <ProgressBar current={currentQuestion.questionNumber} total={currentQuestion.totalQuestions} />
          <div className="glass rounded-3xl p-6 text-center">
            <h2 className="text-xl md:text-2xl font-black text-white mb-3">{currentQuestion.question}</h2>
            {explanation && <p className="text-white/60 text-sm italic">💡 {explanation}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, i) => (
              <AnswerTile key={i} index={i} label={opt} count={answerCounts?.[i] ?? 0} correct={i === correctIndex} showResult />
            ))}
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <p className="text-white/60 text-sm">{totalAnswered} of {players.length} players answered</p>
          </div>
          <button onClick={showLeaderboard} className="btn-primary w-full">📊 Show Leaderboard</button>
        </div>
      </Screen>
    );
  }

  // ── LEADERBOARD ───────────────────────────────────────────────────────────────
  if (hostPhase === 'leaderboard') return (
    <Screen gradient="from-gray-950 via-indigo-950 to-gray-950">
      <div className="w-full max-w-xl space-y-5 animate-slide-up">
        <div className="text-center">
          <h2 className="text-3xl font-black text-white">🏆 Leaderboard</h2>
          <p className="text-white/50 text-sm">After question {currentQuestion?.questionNumber}</p>
        </div>
        <div className="glass rounded-3xl p-5"><Leaderboard entries={leaderboard} /></div>
        <button onClick={nextQuestion} className="btn-primary w-full">
          {isLastQuestion ? '🎉 See Final Results' : '▶ Next Question'}
        </button>
      </div>
    </Screen>
  );

  // ── GAME OVER ─────────────────────────────────────────────────────────────────
  if (hostPhase === 'game-over') return (
    <Screen gradient="from-gray-950 via-yellow-950 to-gray-950">
      <div className="w-full max-w-xl space-y-6 animate-pop-in text-center">
        <div>
          <div className="text-7xl mb-3">🎉</div>
          <h1 className="text-4xl font-black text-white">Game Over!</h1>
          {leaderboard[0] && <p className="text-yellow-400 text-xl font-bold mt-2">🥇 {leaderboard[0].nickname} wins! ({leaderboard[0].score.toLocaleString()} pts)</p>}
        </div>
        <div className="glass rounded-3xl p-5">
          <h3 className="font-bold text-white/70 mb-3 text-sm uppercase tracking-wider">Final Standings</h3>
          <Leaderboard entries={leaderboard} />
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setHostPhase('pick-quiz'); setPlayers([]); setSessionCode(''); setSelectedQuiz(null); }} className="btn-primary flex-1">
            🔄 New Game
          </button>
          <Link to="/" className="btn-secondary flex-1 text-center">🏠 Home</Link>
        </div>
      </div>
    </Screen>
  );

  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const ANSWER_STYLES = [
  { bg: 'bg-red-500',    icon: '▲' },
  { bg: 'bg-blue-500',   icon: '◆' },
  { bg: 'bg-yellow-500', icon: '●' },
  { bg: 'bg-green-500',  icon: '■' },
];

function AnswerTile({ index, label, correct, showResult, count }) {
  const { bg, icon } = ANSWER_STYLES[index];
  const overlay = showResult ? (correct ? 'ring-4 ring-white ring-offset-2 scale-[1.02]' : 'opacity-50') : '';
  return (
    <div className={`${bg} ${overlay} rounded-2xl p-3 md:p-4 flex items-center gap-2 transition-all`}>
      <span className="text-xl text-white/80 flex-shrink-0">{icon}</span>
      <span className="text-white font-bold text-sm md:text-base flex-1 leading-tight">{label}</span>
      {showResult && count !== undefined && <span className="bg-black/30 rounded-lg px-2 py-0.5 text-white text-sm font-bold flex-shrink-0">{count}</span>}
    </div>
  );
}

function Screen({ children, gradient }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-start md:justify-center px-4 py-6 bg-gradient-to-br ${gradient}`}>
      {children}
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm mb-4 animate-pop-in">⚠️ {message}</div>;
}
