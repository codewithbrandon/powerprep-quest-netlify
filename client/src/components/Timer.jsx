import { useEffect, useRef, useState } from 'react';
import { Clock3 } from 'lucide-react';

export default function Timer({ totalSeconds, onExpire, running = true }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const low = remaining < 300;

  return (
    <div className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono font-bold text-sm ${
      low ? 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30 animate-pulse-slow' : 'bg-surface-600 text-slate-200'
    }`}>
      <Clock3 size={16} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
