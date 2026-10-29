import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Lightbulb, Eye, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

function MockTable({ name, rows }) {
  const cols = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="mb-4">
      <div className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{name}</div>
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-surface-600">
              {cols.map((c) => (
                <th key={c} className="px-3 py-1.5 text-left font-semibold text-slate-300">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5">
                {cols.map((c) => (
                  <td key={c} className="px-3 py-1.5 text-slate-400">{String(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applyProfile, fireConfetti } = useProfile();
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState(null);
  const [solution, setSolution] = useState(null);

  useEffect(() => {
    api.getChallenge(id).then((c) => {
      setChallenge(c);
      setCode(c.starter_code);
      setRunResult(null);
      setHint(null);
      setSolution(null);
    });
  }, [id]);

  if (!challenge) return <div className="text-slate-400">Loading challenge...</div>;

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await api.runChallenge(challenge.id, code);
      setRunResult(res);
      if (res.xpAwarded > 0) fireConfetti();
      if (res.profile) applyProfile(res.profile);
    } finally {
      setRunning(false);
    }
  };

  const handleHint = async () => setHint((await api.getChallengeHint(challenge.id)).hint);
  const handleSolution = async () => setSolution((await api.getChallengeSolution(challenge.id)).solution);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/challenges')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} /> Back to Challenges
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          challenge.engine === 'dax' ? 'bg-amber-500/15 text-amber-300' : 'bg-sky-500/15 text-sky-300'
        }`}>
          {challenge.engine === 'dax' ? 'DAX' : 'Power Fx'}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-surface-600 text-slate-400 capitalize">{challenge.difficulty}</span>
      </div>
      <h1 className="text-2xl font-extrabold">{challenge.title}</h1>
      <p className="text-slate-300 leading-relaxed">{challenge.prompt}</p>

      <GlassCard className="p-5">
        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">Mock Data</div>
        {challenge.engine === 'dax' ? (
          <MockTable name={challenge.mock_data.primaryTable} rows={challenge.mock_data.rows} />
        ) : (
          Object.entries(challenge.mock_data.tables).map(([name, rows]) => <MockTable key={name} name={name} rows={rows} />)
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <div className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wide">
          {challenge.engine === 'dax' ? 'DAX Formula' : 'Power Fx Formula'}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={4}
          className="w-full code-font text-sm bg-surface-900 border border-white/10 rounded-xl p-4 text-emerald-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          spellCheck={false}
        />
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold px-4 py-2 rounded-xl disabled:opacity-50"
          >
            <Play size={15} /> {running ? 'Running...' : 'Run Formula'}
          </button>
          <button onClick={handleHint} className="flex items-center gap-1.5 text-sm font-semibold text-amber-300 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20">
            <Lightbulb size={15} /> Hint
          </button>
          <button onClick={handleSolution} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 px-3 py-2 rounded-xl bg-surface-600 hover:bg-surface-700">
            <Eye size={15} /> Reveal Solution
          </button>
        </div>

        {hint && (
          <div className="mt-3 text-sm text-amber-200 bg-amber-500/10 rounded-lg px-4 py-3 flex gap-2">
            <Lightbulb size={16} className="flex-shrink-0 mt-0.5" /> {hint}
          </div>
        )}
        {solution && (
          <div className="mt-3 text-sm code-font text-slate-300 bg-surface-900 rounded-lg px-4 py-3">{solution}</div>
        )}

        {runResult && (
          <div className={`mt-4 rounded-xl p-4 border ${
            !runResult.success ? 'border-red-500/40 bg-red-500/10' : runResult.matches ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10'
          }`}>
            {!runResult.success ? (
              <div className="flex items-start gap-2 text-red-300">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Formula Error</div>
                  <div className="text-sm font-mono mt-1">{runResult.error}</div>
                </div>
              </div>
            ) : runResult.matches ? (
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Correct! Result: {JSON.stringify(runResult.result)}</div>
                  {runResult.xpAwarded > 0 && <div className="text-sm mt-1">+{runResult.xpAwarded} XP earned</div>}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-300">
                <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Formula ran, but result doesn't match yet</div>
                  <div className="text-sm font-mono mt-1">Your result: {JSON.stringify(runResult.result)}</div>
                  <div className="text-sm font-mono">Expected: {JSON.stringify(runResult.expected)}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
