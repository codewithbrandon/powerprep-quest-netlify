import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useTrack } from '../context/TrackContext.jsx';
import { api } from '../api/client';

export default function Challenges() {
  const { track } = useTrack();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getChallenges(track).then((data) => {
      setChallenges(data);
      setLoading(false);
    });
  }, [track]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Terminal size={20} className="text-emerald-400" />
        <h1 className="text-2xl font-extrabold">DAX & Power Fx Code Playground</h1>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        Write real formulas and run them against a live mock dataset in an actual expression engine — not a quiz. Instant pass/fail feedback against the expected result.
      </p>

      {loading ? (
        <div className="text-slate-400">Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <GlassCard className="p-8 text-center text-slate-400">No challenges for this track yet.</GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <Link key={c.id} to={`/challenges/${c.id}`}>
              <GlassCard className="p-5 h-full hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    c.engine === 'dax' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'
                  }`}>
                    {c.engine === 'dax' ? 'DAX' : 'Power Fx'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-slate-400 capitalize">{c.difficulty}</span>
                </div>
                <div className="font-bold text-slate-100 flex items-center justify-between">
                  {c.title}
                  <ArrowRight size={15} className="text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 mt-1.5 line-clamp-2">{c.prompt}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
