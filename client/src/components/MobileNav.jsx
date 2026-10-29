import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Network, BookOpen, Clock3, FileText, Terminal, Layers, Factory, Zap, LogOut,
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTrack, TRACKS } from '../context/TrackContext.jsx';
import StreakBadge from './StreakBadge.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/skill-tree', label: 'Tree', icon: Network },
  { to: '/practice', label: 'Practice', icon: BookOpen },
  { to: '/exam', label: 'Exam', icon: Clock3 },
  { to: '/case-studies', label: 'Cases', icon: FileText },
  { to: '/challenges', label: 'Code', icon: Terminal },
  { to: '/flashcards', label: 'Cards', icon: Layers },
  { to: '/gemba', label: 'Gemba', icon: Factory },
];

export default function MobileNav() {
  const { profile } = useProfile();
  const { logout } = useAuth();
  const { track, setTrack } = useTrack();

  return (
    <div className="md:hidden">
      <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-2 px-3 py-2.5 bg-surface-800/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-400 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-sm">PowerPrep</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-600/60 rounded-lg p-1">
          {Object.values(TRACKS).map((t) => (
            <button
              key={t.code}
              onClick={() => setTrack(t.code)}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                track === t.code ? 'bg-brand-600 text-white' : 'text-slate-400'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge streak={profile?.streak || 0} />
          <button onClick={logout} className="p-1.5 rounded-lg text-slate-500 hover:text-red-300">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 inset-x-0 z-30 flex overflow-x-auto bg-surface-800/95 backdrop-blur-xl border-t border-white/5 px-1 py-1.5 gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium flex-shrink-0 ${
                isActive ? 'text-brand-300 bg-brand-500/10' : 'text-slate-500'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
