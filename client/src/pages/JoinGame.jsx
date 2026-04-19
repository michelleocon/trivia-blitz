import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import socket from '../socket.js';

export default function JoinGame() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();

  const [code, setCode]         = useState(urlCode ? urlCode.toUpperCase() : '');
  const [nickname, setNickname] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, []);

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    if (!code.trim())     return setError('Please enter a session code.');
    if (!nickname.trim()) return setError('Please enter a nickname.');
    setLoading(true);
    socket.emit(
      'player:join',
      { code: code.trim().toUpperCase(), nickname: nickname.trim() },
      (response) => {
        setLoading(false);
        if (response.success) {
          navigate('/play', { state: { player: response.player, code: code.trim().toUpperCase() } });
        } else {
          setError(response.error || 'Could not join game.');
        }
      }
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-950 via-pink-950 to-gray-950">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🙋</div>
          <h1 className="text-3xl font-black text-white">Join a Game</h1>
          <p className="text-white/50 text-sm mt-1">Enter your details to jump in</p>
        </div>

        <form onSubmit={handleJoin} className="glass rounded-3xl p-6 space-y-4">
          <div>
            <label className="block text-white/70 text-sm font-semibold mb-1.5 uppercase tracking-wider">
              Session Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              readOnly={!!urlCode}
              placeholder="e.g. ABC123"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.2em] text-white bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-white/25 placeholder:text-base placeholder:tracking-normal"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm font-semibold mb-1.5 uppercase tracking-wider">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter a cool name…"
              maxLength={20}
              className="w-full rounded-xl px-4 py-3 text-white text-lg font-semibold bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder:text-white/25"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-3 text-red-300 text-sm animate-pop-in">
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Joining…
              </span>
            ) : 'Join Game 🚀'}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
