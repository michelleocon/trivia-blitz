import { useEffect, useState, useRef } from 'react';
import { playTick } from '../utils/sounds.js';

export default function Timer({ startTime, timeLimit, onExpire, showTicks = false }) {
  const [remaining, setRemaining] = useState(timeLimit);
  const expiredRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    expiredRef.current = false;
    function tick() {
      const elapsed = (Date.now() - startTime) / 1000;
      const left = Math.max(0, timeLimit - elapsed);
      const rounded = Math.ceil(left);
      setRemaining(rounded);
      if (showTicks && rounded <= 5 && rounded > 0) playTick();
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(intervalRef.current);
        onExpire?.();
      }
    }
    tick();
    intervalRef.current = setInterval(tick, 250);
    return () => clearInterval(intervalRef.current);
  }, [startTime, timeLimit]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = remaining / timeLimit;
  const ringColor =
    pct > 0.5  ? 'text-green-400 stroke-green-400' :
    pct > 0.25 ? 'text-yellow-400 stroke-yellow-400' :
                 'text-red-400 stroke-red-400';

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="-rotate-90 absolute" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
        <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-250 ${ringColor}`} />
      </svg>
      <span className={`relative z-10 text-3xl font-black tabular-nums ${ringColor.split(' ')[0]} ${remaining <= 5 ? 'animate-pulse' : ''}`}>
        {remaining}
      </span>
    </div>
  );
}
