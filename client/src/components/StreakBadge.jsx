import { Flame } from 'lucide-react';

export default function StreakBadge({ streak }) {
  const active = streak > 0;
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
        active ? 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30' : 'bg-surface-600 text-slate-500'
      }`}
    >
      <Flame size={16} className={active ? 'fill-orange-400 text-orange-400' : ''} />
      {streak} day{streak === 1 ? '' : 's'}
    </div>
  );
}
