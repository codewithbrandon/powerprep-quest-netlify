import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock3, Flag, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import QuestionCard from '../components/QuestionCard.jsx';
import Timer from '../components/Timer.jsx';
import { useTrack, TRACKS } from '../context/TrackContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

const EXAM_SECONDS = 90 * 60;

export default function TimedExam() {
  const { track } = useTrack();
  const { applyProfile } = useProfile();
  const navigate = useNavigate();
  const [stage, setStage] = useState('intro'); // intro | running | submitting
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [idx, setIdx] = useState(0);
  const [startedAt, setStartedAt] = useState(null);

  const startExam = async () => {
    const data = await api.startExam(track);
    setQuestions(data.questions);
    setAnswers({});
    setFlagged(new Set());
    setIdx(0);
    setStartedAt(Date.now());
    setStage('running');
  };

  const submit = async () => {
    setStage('submitting');
    const timeTakenSeconds = Math.round((Date.now() - startedAt) / 1000);
    const res = await api.submitExam({
      track,
      answers,
      flagged: [...flagged],
      timeTakenSeconds,
    });
    applyProfile(res.profile);
    navigate('/exam/results', { state: { result: res } });
  };

  const toggleFlag = (id) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (stage === 'intro') {
    const info = TRACKS[track];
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-2">
          <Clock3 size={20} className="text-red-400" />
          <h1 className="text-2xl font-extrabold">Timed Exam Simulator</h1>
        </div>
        <GlassCard className="p-6 space-y-4">
          <h2 className="font-bold text-lg">{info.name} Mock Exam</h2>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• 50 questions drawn from the {info.name} question bank</li>
            <li>• 90-minute countdown timer — the exam auto-submits at 00:00</li>
            <li>• Flag any question for review and jump around freely before submitting</li>
            <li>• Passing score: <span className="font-bold text-emerald-400">700 / 1000</span></li>
            <li>• Full domain-by-domain readiness report after submission</li>
          </ul>
          <button
            onClick={startExam}
            className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold px-5 py-3 rounded-xl shadow-glow"
          >
            Begin Mock Exam
          </button>
        </GlassCard>
      </div>
    );
  }

  if (stage === 'submitting') {
    return <div className="text-slate-400">Scoring your exam...</div>;
  }

  const current = questions[idx];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 sticky top-0 md:top-0 z-10 bg-surface-900/80 backdrop-blur py-2 -mx-1 px-1">
        <div className="text-sm text-slate-400">
          Answered <span className="text-slate-200 font-semibold">{Object.keys(answers).length}</span> / {questions.length}
        </div>
        <Timer totalSeconds={EXAM_SECONDS} onExpire={submit} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => {
          const answered = answers[q.id] != null;
          const isFlagged = flagged.has(q.id);
          const isCurrent = i === idx;
          return (
            <button
              key={q.id}
              onClick={() => setIdx(i)}
              className={`relative w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center ${
                isCurrent ? 'ring-2 ring-brand-400' : ''
              } ${answered ? 'bg-brand-500/30 text-brand-200' : 'bg-surface-600 text-slate-500'}`}
            >
              {i + 1}
              {isFlagged && <Flag size={9} className="absolute -top-1 -right-1 fill-amber-400 text-amber-400" />}
            </button>
          );
        })}
      </div>

      <QuestionCard
        question={current}
        index={idx}
        total={questions.length}
        selectedIndex={answers[current.id] ?? null}
        onSelect={(i) => setAnswers((a) => ({ ...a, [current.id]: i }))}
        submitted={false}
        showFlag
        flagged={flagged.has(current.id)}
        onToggleFlag={() => toggleFlag(current.id)}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            className="flex items-center gap-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-surface-600 text-slate-300 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={idx === questions.length - 1}
            className="flex items-center gap-1 text-sm font-semibold px-4 py-2.5 rounded-xl bg-surface-600 text-slate-300 disabled:opacity-30"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
        <button
          onClick={submit}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-glow"
        >
          <Send size={16} /> Submit Exam
        </button>
      </div>
    </div>
  );
}
