import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Network, BookOpen, Clock3, FileText, Terminal, Layers, Factory, Zap, CalendarCheck, LogOut,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrack, TRACKS } from '../context/TrackContext.jsx';
import XPBar from './XPBar.jsx';
import StreakBadge from './StreakBadge.jsx';
import { api } from '../api/client';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/skill-tree', label: 'Skill Tree', icon: Network },
  { to: '/practice', label: 'Practice Mode', icon: BookOpen },
  { to: '/exam', label: 'Timed Exam', icon: Clock3 },
  { to: '/case-studies', label: 'Case Studies', icon: FileText },
  { to: '/challenges', label: 'Code Playground', icon: Terminal },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/gemba', label: 'Gemba Zone', icon: Factory },
];

export default function Sidebar() {
  const { profile, applyProfile } = useProfile();
  const { user, logout } = useAuth();
  const { track, setTrack } = useTrack();

  const handleCheckin = async () => {
    const result = await api.checkin();
    applyProfile(result.profile);
  };

  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = profile?.lastCheckin === today;

  return (
    <aside className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 md:left-0 border-r border-white/5 bg-surface-800/80 backdrop-blur-xl z-20">
      <div className="px-5 pt-6 pb-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center shadow-glow">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <div className="font-extrabold text-lg leading-tight">PowerPrep</div>
          <div className="text-[11px] text-slate-400 tracking-wide -mt-0.5">QUEST</div>
        </div>
      </div>

      <div className="px-4 mb-4 grid grid-cols-2 gap-1.5 rounded-xl bg-surface-600/60 p-1">
        {Object.values(TRACKS).map((t) => (
          <button
            key={t.code}
            onClick={() => setTrack(t.code)}
            className={`rounded-lg py-1.5 text-sm font-semibold transition-colors ${
              track === t.code ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <StreakBadge streak={profile?.streak || 0} />
          <button
            onClick={handleCheckin}
            disabled={checkedInToday}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              checkedInToday
                ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                : 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25 ring-1 ring-brand-500/30'
            }`}
          >
            <CalendarCheck size={14} />
            {checkedInToday ? 'Checked In' : 'Check In'}
          </button>
        </div>
        <XPBar profile={profile} />
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-200 truncate">{user?.displayName}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="flex-shrink-0 p-2 rounded-lg text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
