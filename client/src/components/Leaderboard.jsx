const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries = [], highlightId, showTrophies = true, maxVisible = 10 }) {
  const visible = entries.slice(0, maxVisible);
  return (
    <div className="w-full space-y-2">
      {visible.map((entry, i) => {
        const isMe = entry.id === highlightId;
        const medal = showTrophies && entry.rank <= 3 ? MEDALS[entry.rank - 1] : null;
        return (
          <div key={entry.id}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 animate-slide-up
              ${isMe ? 'bg-yellow-400/20 border-2 border-yellow-400 shadow-lg shadow-yellow-400/20' : 'bg-white/10 border border-white/10'}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-xl w-8 text-center flex-shrink-0">
              {medal ?? <span className="text-white/50 text-base font-bold">#{entry.rank}</span>}
            </span>
            <span className={`flex-1 font-semibold truncate ${isMe ? 'text-yellow-300' : 'text-white'}`}>
              {entry.nickname}
              {isMe && <span className="ml-2 text-xs text-yellow-400 font-normal">(you)</span>}
            </span>
            <span className={`font-black tabular-nums text-lg ${isMe ? 'text-yellow-300' : 'text-white'}`}>
              {entry.score.toLocaleString()}
            </span>
          </div>
        );
      })}
      {entries.length > maxVisible && (
        <p className="text-center text-white/40 text-sm pt-1">+{entries.length - maxVisible} more players</p>
      )}
      {entries.length === 0 && (
        <p className="text-center text-white/40 py-8">No players yet.</p>
      )}
    </div>
  );
}
