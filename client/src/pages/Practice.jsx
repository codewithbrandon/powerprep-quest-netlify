import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, RotateCcw, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import { useTrack } from '../context/TrackContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

export default function Practice() {
  const { track } = useTrack();
  const { applyProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const domainFilter = searchParams.get('domain') || '';

  const [domains, setDomains] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDomains(track).then(setDomains);
  }, [track]);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    const params = { track };
    if (domainFilter) params.domain = domainFilter;
    api.getQuestions(params).then((qs) => {
      setQuestions(qs);
      setIdx(0);
      setSelected(null);
      setResult(null);
      setScore({ correct: 0, total: 0 });
      setLoading(false);
    });
  }, [track, domainFilter]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const current = questions[idx];

  const handleSelect = (i) => {
    if (result) return;
    setSelected(i);
  };

  const handleSubmit = async () => {
    if (selected == null || !current) return;
    const res = await api.answerQuestion(current.id, selected, 'practice');
    setResult(res);
    applyProfile(res.profile);
    setScore((s) => ({ correct: s.correct + (res.correct ? 1 : 0), total: s.total + 1 }));
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      loadQuestions();
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-brand-400" />
          <h1 className="text-2xl font-extrabold">Practice Mode</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={domainFilter}
            onChange={(e) => setSearchParams(e.target.value ? { domain: e.target.value } : {})}
            className="bg-surface-600 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200"
          >
            <option value="">All Domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <button onClick={loadQuestions} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/5">
            <RotateCcw size={15} /> Shuffle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading questions...</div>
      ) : !current ? (
        <GlassCard className="p-8 text-center text-slate-400">No questions found for this filter.</GlassCard>
      ) : (
        <>
          <div className="text-sm text-slate-400">
            Session score: <span className="text-slate-200 font-semibold">{score.correct}/{score.total}</span>
          </div>
          <QuestionCard
            question={current}
            index={idx}
            total={questions.length}
            selectedIndex={selected}
            onSelect={handleSelect}
            submitted={!!result}
            result={result}
          />
          <div className="flex justify-end gap-3">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={selected == null}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl shadow-glow"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl"
              >
                Next Question <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
