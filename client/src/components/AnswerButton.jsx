const CONFIGS = [
  { color: 'bg-red-500    hover:bg-red-400',    icon: '▲' },
  { color: 'bg-blue-500   hover:bg-blue-400',   icon: '◆' },
  { color: 'bg-yellow-500 hover:bg-yellow-400', icon: '●' },
  { color: 'bg-green-500  hover:bg-green-400',  icon: '■' },
];

export default function AnswerButton({ index, label, selected, disabled, correct, onClick }) {
  const cfg = CONFIGS[index];
  let overlayClass = '';
  if (correct === true)  overlayClass = '!bg-green-500 ring-4 ring-green-300 ring-offset-2 ring-offset-transparent';
  if (correct === false) overlayClass = '!bg-gray-600 opacity-60';
  const selectedClass = selected && correct === null ? 'ring-4 ring-white ring-offset-2' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center gap-3 rounded-2xl px-4 py-4 md:py-5
        text-left text-white font-bold text-base md:text-lg
        transition-all duration-200 shadow-lg
        ${cfg.color} ${overlayClass} ${selectedClass}
        ${disabled && correct === null ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${!disabled && correct === null ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
        animate-pop-in
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="text-2xl leading-none select-none flex-shrink-0">{cfg.icon}</span>
      <span className="flex-1 leading-snug">{label}</span>
      {correct === true  && <span className="text-2xl">✓</span>}
      {correct === false && <span className="text-2xl">✗</span>}
    </button>
  );
}
