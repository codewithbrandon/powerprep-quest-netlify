import { CheckCircle2, XCircle, ExternalLink, Flag, Factory } from 'lucide-react';
import GlassCard from './GlassCard.jsx';

export default function QuestionCard({
  question,
  index,
  total,
  selectedIndex,
  onSelect,
  submitted,
  result,
  showFlag,
  flagged,
  onToggleFlag,
  locked = false,
}) {
  if (!question) return null;

  return (
    <GlassCard className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {index != null && (
            <span className="text-xs font-semibold text-slate-500">Question {index + 1}{total ? ` / ${total}` : ''}</span>
          )}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300">{question.domain}</span>
          {question.is_gemba && (
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
              <Factory size={12} /> Gemba
            </span>
          )}
          {question.difficulty && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-600 text-slate-400 capitalize">{question.difficulty}</span>
          )}
        </div>
        {showFlag && (
          <button
            onClick={onToggleFlag}
            className={`flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 transition-colors ${
              flagged ? 'bg-amber-500/20 text-amber-300' : 'bg-surface-600 text-slate-500 hover:text-slate-300'
            }`}
          >
            <Flag size={13} className={flagged ? 'fill-amber-300' : ''} /> {flagged ? 'Flagged' : 'Flag'}
          </button>
        )}
      </div>

      <p className="text-lg font-semibold text-slate-100 mb-6 leading-relaxed">{question.question_text}</p>

      <div className="space-y-2.5">
        {question.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const isCorrectAnswer = submitted && result?.correctIndex === i;
          const isWrongSelected = submitted && isSelected && !isCorrectAnswer;

          let cls = 'border-white/10 hover:border-brand-400/50 hover:bg-white/5';
          if (!submitted && isSelected) cls = 'border-brand-400 bg-brand-500/10 ring-1 ring-brand-400/50';
          if (submitted && isCorrectAnswer) cls = 'border-emerald-400/60 bg-emerald-500/10';
          if (isWrongSelected) cls = 'border-red-400/60 bg-red-500/10';

          return (
            <button
              key={i}
              disabled={locked || submitted}
              onClick={() => onSelect(i)}
              className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all flex items-start gap-3 ${cls} ${
                locked || submitted ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full border border-white/15 flex items-center justify-center text-xs font-bold text-slate-400 mt-0.5">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-slate-200">{opt}</span>
              {submitted && isCorrectAnswer && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />}
              {isWrongSelected && <XCircle size={18} className="text-red-400 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      {submitted && result && (
        <div className="mt-6 rounded-xl border border-white/10 bg-surface-700/60 p-5 space-y-3">
          <div className={`flex items-center gap-2 font-bold ${result.correct ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.correct ? 'Correct!' : 'Not quite.'}
            {typeof result.xpAwarded === 'number' && <span className="text-xs text-slate-400 font-normal">+{result.xpAwarded} XP</span>}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.explanation}</p>
          {result.whyWrong && (
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {question.options.map((opt, i) => (
                <div key={i} className="text-xs text-slate-400 flex gap-2">
                  <span className="font-bold text-slate-500 flex-shrink-0">{String.fromCharCode(65 + i)}.</span>
                  <span>{result.whyWrong[i]}</span>
                </div>
              ))}
            </div>
          )}
          {(result.docLink || question.doc_link) && (
            <a
              href={result.docLink || question.doc_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200"
            >
              Microsoft Learn documentation <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </GlassCard>
  );
}
