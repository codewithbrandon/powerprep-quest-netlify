import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, ShieldAlert, ArrowRight, CheckCircle2, XCircle, PartyPopper } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

export default function CaseStudyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applyProfile, fireConfetti } = useProfile();
  const [cs, setCs] = useState(null);
  const [stage, setStage] = useState('brief');
  const [stepIdx, setStepIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    api.getCaseStudy(id).then(setCs);
  }, [id]);

  if (!cs) return <div className="text-slate-400">Loading case study...</div>;

  const step = cs.questions[stepIdx];

  const handleSubmit = async () => {
    const res = await api.answerCaseStudyQuestion(cs.id, step.id, selected);
    setResult(res);
    applyProfile(res.profile);
    if (res.correct) setCorrectCount((c) => c + 1);
  };

  const handleNext = async () => {
    if (stepIdx + 1 >= cs.questions.length) {
      const res = await api.completeCaseStudy(cs.id);
      applyProfile(res.profile);
      fireConfetti();
      setStage('complete');
      return;
    }
    setStepIdx((i) => i + 1);
    setSelected(null);
    setResult(null);
  };

  if (stage === 'brief') {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-2xl font-extrabold">{cs.title}</h1>
        <GlassCard className="p-6">
          <h2 className="font-bold text-sm uppercase tracking-wide text-slate-500 mb-3">Scenario</h2>
          <p className="text-slate-200 leading-relaxed whitespace-pre-line">{cs.scenario}</p>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 mb-3">
            <Users size={14} /> Stakeholders
          </h2>
          <div className="space-y-3">
            {cs.stakeholders.map((s, i) => (
              <div key={i} className="text-sm">
                <span className="font-bold text-slate-200">{s.name}</span>
                <span className="text-slate-500"> — {s.role}</span>
                <p className="text-slate-400 mt-0.5">{s.ask}</p>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="flex items-center gap-2 font-bold text-sm uppercase tracking-wide text-slate-500 mb-3">
            <ShieldAlert size={14} /> Constraints Checklist
          </h2>
          <ul className="space-y-2">
            {cs.constraints.map((c, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <CheckCircle2 size={15} className="text-brand-400 flex-shrink-0 mt-0.5" /> {c}
              </li>
            ))}
          </ul>
        </GlassCard>
        <button
          onClick={() => setStage('questions')}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-500 text-white font-bold px-5 py-3 rounded-xl shadow-glow flex items-center justify-center gap-2"
        >
          Begin Design Questions <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <GlassCard className="p-10 text-center max-w-xl mx-auto">
        <PartyPopper size={40} className="mx-auto mb-3 text-amber-400" />
        <h1 className="text-2xl font-extrabold mb-2">Case Study Complete</h1>
        <p className="text-slate-400 mb-4">You scored {correctCount} / {cs.questions.length} on the design decisions for {cs.title}.</p>
        <button onClick={() => navigate('/case-studies')} className="bg-gradient-to-r from-brand-600 to-brand-500 text-white font-bold px-5 py-3 rounded-xl">
          Back to Case Studies
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">{cs.title}</h1>
        <span className="text-sm text-slate-500">Step {stepIdx + 1} / {cs.questions.length}</span>
      </div>
      <GlassCard className="p-6 md:p-8">
        <p className="text-lg font-semibold text-slate-100 mb-6 leading-relaxed">{step.question_text}</p>
        <div className="space-y-2.5">
          {step.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrectAnswer = result && result.correctIndex === i;
            const isWrongSelected = result && isSelected && !isCorrectAnswer;
            let cls = 'border-white/10 hover:border-brand-400/50 hover:bg-white/5';
            if (!result && isSelected) cls = 'border-brand-400 bg-brand-500/10 ring-1 ring-brand-400/50';
            if (isCorrectAnswer) cls = 'border-emerald-400/60 bg-emerald-500/10';
            if (isWrongSelected) cls = 'border-red-400/60 bg-red-500/10';
            return (
              <button
                key={i}
                disabled={!!result}
                onClick={() => setSelected(i)}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all flex items-start gap-3 ${cls}`}
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-xs font-bold text-slate-400 mt-0.5">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-slate-200">{opt}</span>
                {isCorrectAnswer && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
                {isWrongSelected && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        {result && (
          <div className="mt-6 rounded-xl border border-white/10 bg-surface-700/60 p-5">
            <div className={`flex items-center gap-2 font-bold mb-2 ${result.correct ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {result.correct ? 'Correct architectural decision.' : 'Not the best decision here.'}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
          </div>
        )}
      </GlassCard>
      <div className="flex justify-end">
        {!result ? (
          <button
            onClick={handleSubmit}
            disabled={selected == null}
            className="bg-gradient-to-r from-violet-600 to-purple-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl"
          >
            Submit Decision
          </button>
        ) : (
          <button onClick={handleNext} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold px-5 py-2.5 rounded-xl">
            {stepIdx + 1 >= cs.questions.length ? 'Finish Case Study' : 'Next Step'} <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
