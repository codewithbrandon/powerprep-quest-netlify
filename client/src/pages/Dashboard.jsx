import { Link } from 'react-router-dom';
import { BookOpen, Clock3, FileText, Terminal, Layers, Factory, Trophy, Flame, Target, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import XPBar from '../components/XPBar.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { useTrack, TRACKS } from '../context/TrackContext.jsx';

const ACTIONS = [
  { to: '/practice', label: 'Practice Mode', desc: 'Instant feedback with Microsoft Learn explanations', icon: BookOpen, accent: 'from-brand-500 to-brand-600' },
  { to: '/exam', label: 'Timed Exam Simulator', desc: '50-question mock exam, 700/1000 to pass', icon: Clock3, accent: 'from-red-500 to-orange-500' },
  { to: '/case-studies', label: 'Case Study Simulator', desc: 'Multi-step architectural design scenarios', icon: FileText, accent: 'from-violet-500 to-purple-600' },
  { to: '/challenges', label: 'DAX / Power Fx Playground', desc: 'Write real formulas, run them for real', icon: Terminal, accent: 'from-emerald-500 to-teal-600' },
  { to: '/flashcards', label: 'Flashcard Deck', desc: 'Spaced-repetition high-yield terms', icon: Layers, accent: 'from-amber-500 to-yellow-500' },
  { to: '/gemba', label: 'Gemba Specialization Zone', desc: 'Real-world manufacturing operational scenarios', icon: Factory, accent: 'from-sky-500 to-blue-600' },
];

export default function Dashboard() {
  const { profile } = useProfile();
  const { track } = useTrack();
  const trackInfo = TRACKS[track];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">Welcome back, Apprentice.</h1>
        <p className="text-slate-400 mt-1">
          Currently training for <span className="font-semibold text-brand-300">{trackInfo.name}</span> — {trackInfo.fullName}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3 text-slate-400 text-sm font-semibold">
            <Trophy size={16} /> Mastery Progress
          </div>
          <XPBar profile={profile} />
        </GlassCard>
        <GlassCard className="p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold">
            <Flame size={16} /> Streak
          </div>
          <div className="text-3xl font-extrabold mt-2">{profile?.streak || 0} days</div>
          <div className="text-xs text-slate-500 mt-1">{profile?.examsPassed || 0} mock exam{profile?.examsPassed === 1 ? '' : 's'} passed</div>
        </GlassCard>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target size={18} className="text-brand-400" />
          <h2 className="font-bold text-lg">Study Modes</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ACTIONS.map((a) => (
            <Link key={a.to} to={a.to} className="group">
              <GlassCard className="p-5 h-full transition-transform group-hover:-translate-y-0.5 group-hover:shadow-glow">
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.accent} flex items-center justify-center mb-3`}>
                    <a.icon size={20} className="text-white" />
                  </div>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all mt-1" />
                </div>
                <div className="font-bold text-slate-100">{a.label}</div>
                <div className="text-sm text-slate-400 mt-1">{a.desc}</div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
