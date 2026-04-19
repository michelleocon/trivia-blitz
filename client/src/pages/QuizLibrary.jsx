import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:3001/api';

export default function QuizLibrary() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchQuizzes(); }, []);

  async function fetchQuizzes() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/quizzes`);
      const data = await res.json();
      setQuizzes(data.quizzes || []);
    } catch {
      setError('Could not load quizzes. Is the server running?');
    } finally {
      setLoading(false);
    }
  }

  async function deleteQuiz(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch(`${API}/quizzes/${id}`, { method: 'DELETE' });
      setQuizzes(q => q.filter(q => q.id !== id));
    } catch {
      alert('Failed to delete quiz.');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div>
            <Link to="/" className="text-white/40 hover:text-white/70 text-sm mb-2 inline-block">← Home</Link>
            <h1 className="text-4xl font-black text-white">📚 Quiz Library</h1>
            <p className="text-white/50 mt-1">Browse, create, and manage your quizzes</p>
          </div>
          <Link
            to="/quizzes/new"
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            ✏️ Create Quiz
          </Link>
        </div>

        {/* States */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500/40 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading quizzes…</p>
          </div>
        )}

        {error && (
          <div className="glass rounded-2xl px-5 py-4 text-red-300 text-center mb-6">⚠️ {error}</div>
        )}

        {!loading && quizzes.length === 0 && !error && (
          <div className="text-center py-20 animate-slide-up">
            <div className="text-6xl mb-4">🤔</div>
            <p className="text-white/60 text-lg mb-6">No quizzes yet — be the first to create one!</p>
            <Link to="/quizzes/new" className="btn-primary">✏️ Create a Quiz</Link>
          </div>
        )}

        {/* Quiz grid */}
        <div className="space-y-4">
          {quizzes.map((quiz, i) => (
            <div
              key={quiz.id}
              className="glass rounded-2xl p-5 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-white truncate">{quiz.name}</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex-shrink-0">
                      Public
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-0.5">
                    by <span className="text-white/70">{quiz.creator_name}</span>
                    &nbsp;·&nbsp;
                    <span className="text-purple-400 font-semibold">{quiz.question_count} question{quiz.question_count !== 1 ? 's' : ''}</span>
                  </p>
                  {quiz.description && (
                    <p className="text-white/40 text-sm mt-1 line-clamp-2">{quiz.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => navigate('/host', { state: { quizId: quiz.id, quizName: quiz.name } })}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all hover:scale-[1.02]"
                  >
                    🎮 Host
                  </button>
                  <Link
                    to={`/quizzes/${quiz.id}/edit`}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold text-center transition-all hover:scale-[1.02]"
                  >
                    ✏️ Edit
                  </Link>
                  <button
                    onClick={() => deleteQuiz(quiz.id, quiz.name)}
                    disabled={deleting === quiz.id}
                    className="px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                  >
                    {deleting === quiz.id ? '…' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
