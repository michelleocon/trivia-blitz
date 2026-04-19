const TILE_COLORS = [
  'bg-purple-600', 'bg-pink-600',   'bg-blue-600',  'bg-green-600',
  'bg-yellow-600', 'bg-red-600',    'bg-indigo-600','bg-orange-600',
  'bg-teal-600',   'bg-rose-600',   'bg-cyan-600',  'bg-lime-600',
];

function getColor(nickname) {
  let hash = 0;
  for (const ch of nickname) hash = (hash * 31 + ch.charCodeAt(0)) % TILE_COLORS.length;
  return TILE_COLORS[hash];
}

export default function PlayerList({ players = [] }) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <p className="text-4xl mb-2">👀</p>
        <p>Waiting for players to join…</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {players.map((player, i) => (
        <div key={player.id}
          className={`${getColor(player.nickname)} rounded-xl px-3 py-2 text-sm font-bold text-white shadow-md animate-pop-in truncate max-w-[130px]`}
          style={{ animationDelay: `${i * 40}ms` }}
          title={player.nickname}
        >
          {player.nickname}
        </div>
      ))}
    </div>
  );
}
