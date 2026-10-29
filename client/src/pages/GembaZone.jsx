import { useEffect, useState, useCallback } from 'react';
import { Factory, RotateCcw, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

export default function GembaZone() {
  const { applyProfile } = useProfile();
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    api.getQuestions({ gembaOnly: 'true' }).then((qs) => {
      setQuestions(qs);
      setIdx(0);
      setSelected(null);
      setResult(null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const current = questions[idx];

  const handleSubmit = async () => {
    if (selected == null || !current) return;
    const res = await api.answerQuestion(current.id, selected, 'practice');
    setResult(res);
    applyProfile(res.profile);
  };

  const handleNext = () => {
    if (idx + 1 >= questions.length) { loadQuestions(); return; }
    setIdx((i) => i + 1);
    setSelected(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Factory size={20} className="text-sky-400" />
          <h1 className="text-2xl font-extrabold">Gemba Specialization Zone</h1>
        </div>
        <button onClick={loadQuestions} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/5">
          <RotateCcw size={15} /> Shuffle
        </button>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        Real-world operational scenarios — manufacturing quality audits, defect workflows, inventory tracking, and multi-plant governance — pulled from both the PL-200 and PL-300 question banks. These test whether you can apply the platform to an actual shop floor, not just recite syntax.
      </p>

      {loading ? (
        <div className="text-slate-400">Loading scenarios...</div>
      ) : !current ? (
        <GlassCard className="p-8 text-center text-slate-400">No scenarios available.</GlassCard>
      ) : (
        <>
          <QuestionCard
            question={current}
            index={idx}
            total={questions.length}
            selectedIndex={selected}
            onSelect={(i) => !result && setSelected(i)}
            submitted={!!result}
            result={result}
          />
          <div className="flex justify-end gap-3">
            {!result ? (
              <button
                onClick={handleSubmit}
                disabled={selected == null}
                className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl shadow-glow"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl"
              >
                Next Scenario <ArrowRight size={16} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
