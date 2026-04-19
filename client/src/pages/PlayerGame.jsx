import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import socket from '../socket.js';
import AnswerButton from '../components/AnswerButton.jsx';
import Leaderboard from '../components/Leaderboard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Timer from '../components/Timer.jsx';
import { playCorrect, playWrong, playWinner } from '../utils/sounds.js';

export default function PlayerGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state;

  useEffect(() => {
    if (!stateData?.player || !stateData?.code) navigate('/join', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stateData?.player) return null;

  const { player, code } = stateData;

  const [phase, setPhase]             = useState('lobby');
  const [currentQuestion, setCurrentQ]= useState(null);
  const [selectedIndex, setSelected]  = useState(null);
  const [answerResult, setResult]     = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore]         = useState(0);
  const [isLastQuestion, setIsLast]   = useState(false);
  const timerRef = useRef(0);

  useEffect(() => {
    if (phase !== 'question' || !currentQuestion) return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - currentQuestion.startTime) / 1000;
      timerRef.current = Math.max(0, currentQuestion.timeLimit - elapsed);
    }, 200);
    return () => clearInterval(id);
  }, [phase, currentQuestion]);

  useEffect(() => {
    socket.on('game:question-start', (data) => { setCurrentQ(data); setSelected(null); setResult(null); setPhase('question'); });
    socket.on('game:question-end', ({ correctIndex, playerResults }) => {
      const myResult = playerResults.find((r) => r.playerId === player.id);
      if (myResult) { setResult({ isCorrect: myResult.isCorrect, points: myResult.pointsEarned, correctIndex }); setMyScore(myResult.totalScore); myResult.isCorrect ? playCorrect() : playWrong(); }
      else { setResult({ isCorrect: false, points: 0, correctIndex, didNotAnswer: true }); }
      setPhase('question-result');
    });
    socket.on('game:leaderboard', ({ leaderboard, isLastQuestion }) => { setLeaderboard(leaderboard); setIsLast(isLastQuestion); setPhase('leaderboard'); });
    socket.on('game:over', ({ leaderboard }) => { setLeaderboard(leaderboard); const e = leaderboard.find((e) => e.id === player.id); if (e?.rank === 1) playWinner(); setPhase('game-over'); });
    socket.on('game:host-disconnected', () => setPhase('disconnected'));
    return () => {
      socket.off('game:question-start');
      socket.off('game:question-end');
      socket.off('game:leaderboard');
      socket.off('game:over');
      socket.off('game:host-disconnected');
    };
  }, [player.id]);

  function submitAnswer(index) {
    if (selectedIndex !== null) return;
    setSelected(index);
    setPhase('answer-wait');
    socket.emit('player:answer', { code, answerIndex: index, timeRemaining: timerRef.current });
  }

  if (phase === 'lobby') return (
    <Screen gradient="from-gray-950 via-purple-950 to-gray-950">
      <div className="text-center animate-slide-up max-w-sm">
        <div className="text-7xl mb-4">⏳</div>
        <h2 className="text-3xl font-black text-white mb-2">Get Ready!</h2>
        <p className="text-white/60 mb-6">Waiting for the host to start the game…</p>
        <div className="glass rounded-2xl px-6 py-4 inline-block">
          <p className="text-white/50 text-sm uppercase tracking-wider">Playing as</p>
          <p className="text-2xl font-black text-white">{player.nickname}</p>
        </div>
        <div className="flex justify-center gap-2 mt-8">
          {[0,1,2].map((i) => <div key={i} className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 200}ms` }} />)}
        </div>
      </div>
    </Screen>
  );

  if ((phase === 'question' || phase === 'answer-wait') && currentQuestion) {
    const answered = phase === 'answer-wait';
    return (
      <Screen gradient="from-gray-950 via-blue-950 to-gray-950">
        <div className="w-full max-w-lg space-y-4 animate-pop-in">
          <ProgressBar current={currentQuestion.questionNumber} total={currentQuestion.totalQuestions} />
          <div className="glass rounded-3xl p-5 flex flex-col items-center gap-4 text-center">
            <Timer startTime={currentQuestion.startTime} timeLimit={currentQuestion.timeLimit} showTicks onExpire={() => {}} />
            <h2 className="text-xl md:text-2xl font-black text-white leading-tight">{currentQuestion.question}</h2>
          </div>
          {answered && (
            <div className="glass rounded-2xl px-4 py-3 text-center animate-pop-in">
              <p className="text-white font-semibold">✅ Answer locked in! Waiting for results…</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, i) => (
              <AnswerButton key={i} index={i} label={opt} selected={selectedIndex === i} disabled={answered} correct={null} onClick={() => submitAnswer(i)} />
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === 'question-result' && answerResult) {
    const { isCorrect, points, correctIndex, didNotAnswer } = answerResult;
    return (
      <Screen gradient={isCorrect ? 'from-gray-950 via-green-950 to-gray-950' : 'from-gray-950 via-red-950 to-gray-950'}>
        <div className="w-full max-w-lg space-y-5 animate-pop-in text-center">
          <div className={`rounded-3xl p-8 ${isCorrect ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'}`}>
            <div className="text-7xl mb-4">{didNotAnswer ? '⏰' : isCorrect ? '✅' : '❌'}</div>
            <h2 className="text-3xl font-black text-white mb-1">{didNotAnswer ? "Time's Up!" : isCorrect ? 'Correct!' : 'Wrong!'}</h2>
            {isCorrect && <p className="text-green-300 text-xl font-bold">+{points.toLocaleString()} points</p>}
            {didNotAnswer && <p className="text-white/60 text-sm mt-1">You didn't answer in time</p>}
          </div>
          {currentQuestion && (
            <div className="glass rounded-2xl p-5">
              <p className="text-white/60 text-sm mb-3">Correct answer was:</p>
              <div className={`rounded-xl px-4 py-3 font-bold text-white text-lg ${['bg-red-500','bg-blue-500','bg-yellow-500','bg-green-500'][correctIndex]}`}>
                {currentQuestion.options[correctIndex]}
              </div>
            </div>
          )}
          <div className="glass rounded-2xl px-6 py-4">
            <p className="text-white/50 text-sm">Your total score</p>
            <p className="text-4xl font-black text-white">{myScore.toLocaleString()}</p>
          </div>
          <p className="text-white/40 text-sm">Waiting for the leaderboard…</p>
        </div>
      </Screen>
    );
  }

  if (phase === 'leaderboard') {
    const myEntry = leaderboard.find((e) => e.id === player.id);
    return (
      <Screen gradient="from-gray-950 via-indigo-950 to-gray-950">
        <div className="w-full max-w-lg space-y-5 animate-slide-up">
          <div className="text-center">
            <h2 className="text-3xl font-black text-white">🏆 Leaderboard</h2>
            {myEntry && <p className="text-white/60 mt-1">You're in <span className="text-yellow-400 font-bold">#{myEntry.rank}</span> place!</p>}
          </div>
          <div className="glass rounded-3xl p-5"><Leaderboard entries={leaderboard} highlightId={player.id} /></div>
          {!isLastQuestion && <p className="text-center text-white/40 text-sm">Next question coming up…</p>}
        </div>
      </Screen>
    );
  }

  if (phase === 'game-over') {
    const myEntry = leaderboard.find((e) => e.id === player.id);
    const isWinner = myEntry?.rank === 1;
    return (
      <Screen gradient="from-gray-950 via-yellow-950 to-gray-950">
        <div className="w-full max-w-lg space-y-6 animate-pop-in text-center">
          <div>
            <div className="text-7xl mb-3">{isWinner ? '🏆' : '🎮'}</div>
            <h1 className="text-4xl font-black text-white">Game Over!</h1>
            {myEntry && <p className="text-yellow-400 text-xl font-bold mt-2">{isWinner ? 'You won! 🎉' : `You finished #${myEntry.rank}`}</p>}
          </div>
          <div className="glass rounded-3xl p-5">
            <h3 className="font-bold text-white/70 mb-3 text-sm uppercase tracking-wider">Final Standings</h3>
            <Leaderboard entries={leaderboard} highlightId={player.id} />
          </div>
          <div className="flex gap-3">
            <Link to="/join" className="btn-primary flex-1 text-center">🔄 Play Again</Link>
            <Link to="/"    className="btn-secondary flex-1 text-center">🏠 Home</Link>
          </div>
        </div>
      </Screen>
    );
  }

  if (phase === 'disconnected') return (
    <Screen gradient="from-gray-950 to-gray-950">
      <div className="text-center animate-pop-in max-w-sm">
        <div className="text-7xl mb-4">😔</div>
        <h2 className="text-2xl font-black text-white mb-2">Host Disconnected</h2>
        <p className="text-white/50 mb-6">The game host has left. Thanks for playing!</p>
        <Link to="/" className="btn-primary">← Back to Home</Link>
      </div>
    </Screen>
  );

  return null;
}

function Screen({ children, gradient = 'from-gray-950 to-gray-950' }) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 py-6 bg-gradient-to-br ${gradient}`}>
      {children}
    </div>
  );
}
