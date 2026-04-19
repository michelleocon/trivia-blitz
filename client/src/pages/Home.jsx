import { useNavigate, Link } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      <div className="text-center mb-12 animate-slide-up">
        <div className="text-7xl mb-4">🎮</div>
        <h1 className="text-5xl md:text-7xl font-black mb-3 text-gradient">
          Trivia Blitz
        </h1>
        <p className="text-white/60 text-lg md:text-xl max-w-md mx-auto">
          Real-time multiplayer trivia. Create a game, invite friends, and battle for the top spot!
        </p>
      </div>

      {/* Main action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl animate-pop-in">
        <button
          onClick={() => navigate('/host')}
          className="group flex flex-col items-center gap-3 rounded-3xl p-8
            bg-gradient-to-br from-purple-600 to-purple-800
            hover:from-purple-500 hover:to-purple-700
            shadow-2xl shadow-purple-500/30
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="text-5xl group-hover:animate-wiggle">🎤</span>
          <div className="text-center">
            <p className="text-2xl font-black text-white">Host a Game</p>
            <p className="text-purple-200 text-sm mt-1">Pick a quiz &amp; invite players</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/join')}
          className="group flex flex-col items-center gap-3 rounded-3xl p-8
            bg-gradient-to-br from-pink-600 to-rose-700
            hover:from-pink-500 hover:to-rose-600
            shadow-2xl shadow-pink-500/30
            transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="text-5xl group-hover:animate-wiggle">🙋</span>
          <div className="text-center">
            <p className="text-2xl font-black text-white">Join a Game</p>
            <p className="text-pink-200 text-sm mt-1">Enter a code or scan a QR code</p>
          </div>
        </button>
      </div>

      {/* Quiz library link */}
      <Link
        to="/quizzes"
        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl
          bg-white/10 border border-white/20 hover:bg-white/20
          text-white font-semibold transition-all duration-200 hover:scale-[1.02]
          animate-pop-in"
        style={{ animationDelay: '150ms' }}
      >
        📚 Quiz Library — browse &amp; create quizzes
      </Link>

      <p className="mt-8 text-white/20 text-sm">No account needed · Works on any device</p>
    </div>
  );
}
