export default function ProgressBar({ current, total }) {
  const pct = (current / total) * 100;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/50 mb-1">
        <span>Question {current} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
