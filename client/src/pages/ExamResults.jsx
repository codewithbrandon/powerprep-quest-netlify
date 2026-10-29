import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, XCircle, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useProfile } from '../context/ProfileContext.jsx';

export default function ExamResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { fireConfetti } = useProfile();
  const [expanded, setExpanded] = useState(null);
  const result = state?.result;

  useEffect(() => {
    if (result?.passed) fireConfetti();
  }, [result, fireConfetti]);

  if (!result) {
    return (
      <GlassCard className="p-8 text-center text-slate-400">
        No exam results to show. <button onClick={() => navigate('/exam')} className="text-brand-300 font-semibold ml-1">Take an exam</button>
      </GlassCard>
    );
  }

  const domains = Object.entries(result.domainBreakdown);

  return (
    <div className="space-y-6">
      <GlassCard className={`p-8 text-center ${result.passed ? 'ring-1 ring-emerald-500/40' : 'ring-1 ring-red-500/40'}`}>
        <Trophy size={40} className={`mx-auto mb-3 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`} />
        <div className="text-4xl font-black">{result.score1000} <span className="text-lg text-slate-500">/ 1000</span></div>
        <div className={`mt-2 inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
          result.passed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
        }`}>
          {result.passed ? 'PASS' : 'NOT YET — keep training'}
        </div>
        <div className="text-sm text-slate-400 mt-3">
          {result.correctCount} / {result.total} correct · Passing score {result.passScore}/1000 · +{result.xpAwarded} XP earned
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-bold mb-4">Domain Readiness Report</h2>
        <div className="space-y-3">
          {domains.map(([domain, stats]) => {
            const pct = Math.round((stats.correct / stats.total) * 100);
            return (
              <div key={domain}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-300">{domain}</span>
                  <span className="text-slate-500">{stats.correct}/{stats.total} ({pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-surface-600 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${pct >= 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-bold mb-4">Review Every Question</h2>
        <div className="space-y-2">
          {result.perQuestion.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-white/5">
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {q.isCorrect ? (
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm text-slate-300 flex-1 truncate">{i + 1}. {q.question_text}</span>
                {expanded === i ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
              </button>
              {expanded === i && (
                <div className="px-4 pb-4 space-y-2">
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      className={`text-sm rounded-lg px-3 py-2 ${
                        oi === q.correctIndex
                          ? 'bg-emerald-500/10 text-emerald-200'
                          : oi === q.selectedIndex
                          ? 'bg-red-500/10 text-red-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </div>
                  ))}
                  <p className="text-sm text-slate-400 pt-1">{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex gap-3">
        <button onClick={() => navigate('/exam')} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold px-5 py-3 rounded-xl">
          Take Another Mock Exam
        </button>
        <button onClick={() => navigate('/practice')} className="flex-1 bg-surface-600 text-slate-200 font-bold px-5 py-3 rounded-xl">
          Target Weak Domains
        </button>
      </div>
    </div>
  );
}
