import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const API = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

const BLANK_QUESTION = () => ({
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 10,
  explanation: '',
});

/**
 * CreateQuiz — handles both creating (/quizzes/new) and
 * editing (/quizzes/:id/edit) a quiz.
 */
export default function CreateQuiz() {
  const { id } = useParams();          // present when editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Quiz metadata
  const [name, setName]               = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic]       = useState(true);

  // Questions
  const [questions, setQuestions]     = useState([BLANK_QUESTION()]);

  // UI state
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(isEditing);
  const [error, setError]             = useState('');
  const [openIndex, setOpenIndex]     = useState(0); // which question is expanded

  // Load existing quiz when editing
  useEffect(() => {
    if (!isEditing) return;
    fetch(`${API}/quizzes/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.quiz) {
          setName(data.quiz.name);
          setCreatorName(data.quiz.creator_name);
          setDescription(data.quiz.description || '');
          setIsPublic(Boolean(data.quiz.is_public));
          setQuestions(data.questions.map(q => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            timeLimit: q.timeLimit,
            explanation: q.explanation || '',
          })));
        }
      })
      .catch(() => setError('Could not load quiz.'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  // ── Question helpers ────────────────────────────────────────────────────────

  function updateQuestion(index, field, value) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }

  function updateOption(qIndex, optIndex, value) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const options = [...q.options];
      options[optIndex] = value;
      return { ...q, options };
    }));
  }

  function addQuestion() {
    setQuestions(prev => [...prev, BLANK_QUESTION()]);
    setOpenIndex(questions.length); // open the new one
  }

  function removeQuestion(index) {
    if (questions.length === 1) return; // must have at least 1
    setQuestions(prev => prev.filter((_, i) => i !== index));
    setOpenIndex(Math.max(0, index - 1));
  }

  function moveQuestion(index, dir) {
    const newQ = [...questions];
    const target = index + dir;
    if (target < 0 || target >= newQ.length) return;
    [newQ[index], newQ[target]] = [newQ[target], newQ[index]];
    setQuestions(newQ);
    setOpenIndex(target);
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  async function handleSave(e) {
    e.preventDefault();
    setError('');

    const payload = {
      name: name.trim(),
      creator_name: creatorName.trim(),
      description: description.trim(),
      is_public: isPublic,
      questions,
    };

    setSaving(true);
    try {
      const url    = isEditing ? `${API}/quizzes/${id}` : `${API}/quizzes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to save quiz.');
      } else {
        navigate('/quizzes');
      }
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      <div className="w-10 h-10 border-4 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-8 bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <Link to="/quizzes" className="text-white/40 hover:text-white/70 text-sm mb-2 inline-block">
            ← Quiz Library
          </Link>
          <h1 className="text-3xl font-black text-white">
            {isEditing ? '✏️ Edit Quiz' : '✏️ Create a Quiz'}
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* ── Quiz details ── */}
          <section className="glass rounded-3xl p-6 space-y-4 animate-pop-in">
            <h2 className="text-lg font-black text-white/80 uppercase tracking-wider text-sm">Quiz Details</h2>

            <Field label="Quiz Name *">
              <input
                type="text" required maxLength={80}
                value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Science & Nature"
                className={inputClass}
              />
            </Field>

            <Field label="Your Name *">
              <input
                type="text" required maxLength={40}
                value={creatorName} onChange={e => setCreatorName(e.target.value)}
                placeholder="e.g. Michelle"
                className={inputClass}
                disabled={isEditing}
              />
              {isEditing && <p className="text-white/30 text-xs mt-1">Creator name cannot be changed after creation.</p>}
            </Field>

            <Field label="Description (optional)">
              <textarea
                maxLength={200} rows={2}
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="A short description of your quiz…"
                className={`${inputClass} resize-none`}
              />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIsPublic(p => !p)}
                className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-1 ${isPublic ? 'bg-purple-500' : 'bg-white/20'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${isPublic ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
              <span className="text-white/70 text-sm">
                {isPublic ? '🌍 Public — visible to everyone in the quiz library' : '🔒 Private — only accessible via direct link'}
              </span>
            </label>
          </section>

          {/* ── Questions ── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white/80 uppercase tracking-wider text-sm">
                Questions <span className="text-purple-400">({questions.length})</span>
              </h2>
              <button type="button" onClick={addQuestion}
                className="text-sm px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all hover:scale-[1.02]">
                + Add Question
              </button>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="glass rounded-2xl overflow-hidden animate-pop-in" style={{ animationDelay: `${qi * 40}ms` }}>

                {/* Question header (click to expand/collapse) */}
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === qi ? -1 : qi)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-purple-400 font-black text-sm flex-shrink-0">Q{qi + 1}</span>
                    <span className="text-white font-semibold truncate">
                      {q.question.trim() || <span className="text-white/30 italic">Untitled question</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="text-white/40 text-xs">{q.timeLimit}s</span>
                    <span className="text-white/40">{openIndex === qi ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded question editor */}
                {openIndex === qi && (
                  <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">

                    {/* Question text */}
                    <Field label="Question *">
                      <textarea
                        required rows={2} maxLength={300}
                        value={q.question}
                        onChange={e => updateQuestion(qi, 'question', e.target.value)}
                        placeholder="Type your question here…"
                        className={`${inputClass} resize-none`}
                      />
                    </Field>

                    {/* 4 options */}
                    <div>
                      <label className={labelClass}>Answer Options — click the circle to mark correct</label>
                      <div className="space-y-2 mt-1.5">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-3">
                            {/* Correct answer selector */}
                            <button
                              type="button"
                              onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                              className={`w-7 h-7 rounded-full border-2 flex-shrink-0 transition-all ${
                                q.correctIndex === oi
                                  ? 'bg-green-500 border-green-400 scale-110'
                                  : 'border-white/30 hover:border-white/60'
                              }`}
                              title="Mark as correct answer"
                            >
                              {q.correctIndex === oi && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
                            </button>

                            {/* Option label */}
                            <span className={`text-xs font-bold w-5 flex-shrink-0 ${
                              ['text-red-400','text-blue-400','text-yellow-400','text-green-400'][oi]
                            }`}>
                              {['A','B','C','D'][oi]}
                            </span>

                            <input
                              type="text" required maxLength={120}
                              value={opt}
                              onChange={e => updateOption(qi, oi, e.target.value)}
                              placeholder={`Option ${['A','B','C','D'][oi]}`}
                              className={`${inputClass} flex-1`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-white/30 text-xs mt-2">The highlighted circle = correct answer</p>
                    </div>

                    {/* Time limit */}
                    <Field label={`Time Limit: ${q.timeLimit} seconds`}>
                      <input
                        type="range" min={5} max={60} step={5}
                        value={q.timeLimit}
                        onChange={e => updateQuestion(qi, 'timeLimit', Number(e.target.value))}
                        className="w-full accent-purple-500"
                      />
                      <div className="flex justify-between text-white/30 text-xs mt-0.5">
                        <span>5s</span><span>60s</span>
                      </div>
                    </Field>

                    {/* Explanation */}
                    <Field label="Fun Fact / Explanation (optional)">
                      <input
                        type="text" maxLength={200}
                        value={q.explanation}
                        onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                        placeholder="Shown after the answer is revealed…"
                        className={inputClass}
                      />
                    </Field>

                    {/* Question controls */}
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={() => moveQuestion(qi, -1)} disabled={qi === 0}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-30 transition-all">
                        ↑ Up
                      </button>
                      <button type="button" onClick={() => moveQuestion(qi, 1)} disabled={qi === questions.length - 1}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-30 transition-all">
                        ↓ Down
                      </button>
                      <button type="button" onClick={() => removeQuestion(qi)} disabled={questions.length === 1}
                        className="ml-auto px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm disabled:opacity-30 transition-all">
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add question button (bottom) */}
            <button
              type="button" onClick={addQuestion}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 hover:border-purple-500/60 text-white/40 hover:text-purple-300 font-semibold transition-all hover:bg-purple-500/10"
            >
              + Add another question
            </button>
          </section>

          {/* Error */}
          {error && (
            <div className="glass rounded-xl px-5 py-4 text-red-300 text-sm animate-pop-in">
              ⚠️ {error}
            </div>
          )}

          {/* Save */}
          <div className="flex gap-3 pb-8">
            <Link to="/quizzes" className="btn-secondary flex-1 text-center">Cancel</Link>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isEditing ? '💾 Save Changes' : '🚀 Create Quiz'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ── Micro components ──────────────────────────────────────────────────────────

const inputClass = `
  w-full rounded-xl px-4 py-2.5 text-white text-sm
  bg-white/10 border border-white/20
  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
  placeholder:text-white/25
`;

const labelClass = 'block text-white/60 text-xs font-semibold uppercase tracking-wider mb-1.5';

function Field({ label, children }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}
