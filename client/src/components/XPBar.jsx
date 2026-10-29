export default function XPBar({ profile }) {
  if (!profile) return null;
  const { xp, currentLevelMinXp, nextLevel } = profile;
  const span = nextLevel ? nextLevel.minXp - currentLevelMinXp : 1;
  const progressed = xp - currentLevelMinXp;
  const pct = nextLevel ? Math.min(100, Math.round((progressed / span) * 100)) : 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-medium text-slate-200">Lv.{profile.level} {profile.levelTitle}</span>
        <span>{xp.toLocaleString()} XP</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-surface-600 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {nextLevel && (
        <div className="text-[11px] text-slate-500 mt-1">{nextLevel.xpNeeded.toLocaleString()} XP to {nextLevel.title}</div>
      )}
    </div>
  );
}
