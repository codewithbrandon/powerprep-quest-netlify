import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useTrack } from '../context/TrackContext.jsx';
import { api } from '../api/client';

export default function CaseStudies() {
  const { track } = useTrack();
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCaseStudies(track).then((data) => {
      setStudies(data);
      setLoading(false);
    });
  }, [track]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-violet-400" />
        <h1 className="text-2xl font-extrabold">Case Study Simulator</h1>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        Multi-step scenarios mirroring the real exam format: a client scenario, competing stakeholder requirements, a constraint checklist, and a sequence of architectural design decisions.
      </p>

      {loading ? (
        <div className="text-slate-400">Loading case studies...</div>
      ) : studies.length === 0 ? (
        <GlassCard className="p-8 text-center text-slate-400">No case studies for this track yet.</GlassCard>
      ) : (
        <div className="grid gap-4">
          {studies.map((cs) => (
            <Link key={cs.id} to={`/case-studies/${cs.id}`}>
              <GlassCard className="p-6 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-lg mb-2">{cs.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{cs.scenario}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                      <Users size={13} /> {cs.stakeholders.length} stakeholders · {cs.constraints.length} constraints
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-500 flex-shrink-0 mt-1" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
