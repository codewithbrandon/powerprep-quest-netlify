import { useEffect, useState, useCallback } from 'react';
import { Layers, RotateCw, PartyPopper } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useTrack } from '../context/TrackContext.jsx';
import { useProfile } from '../context/ProfileContext.jsx';
import { api } from '../api/client';

const RATINGS = [
  { quality: 2, label: 'Again', color: 'bg-red-500/15 text-red-300 hover:bg-red-500/25' },
  { quality: 3, label: 'Hard', color: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' },
  { quality: 4, label: 'Good', color: 'bg-brand-500/15 text-brand-300 hover:bg-brand-500/25' },
  { quality: 5, label: 'Easy', color: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' },
];

export default function Flashcards() {
  const { track } = useTrack();
  const { applyProfile } = useProfile();
  const [cards, setCards] = useState([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewed, setReviewed] = useState(0);

  const loadCards = useCallback(() => {
    setLoading(true);
    api.getDueFlashcards(track).then((data) => {
      setCards(data);
      setIdx(0);
      setFlipped(false);
      setReviewed(0);
      setLoading(false);
    });
  }, [track]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const current = cards[idx];

  const handleRate = async (quality) => {
    const res = await api.reviewFlashcard(current.id, quality);
    applyProfile(res.profile);
    setReviewed((r) => r + 1);
    if (idx + 1 >= cards.length) {
      setCards([]);
    } else {
      setIdx((i) => i + 1);
      setFlipped(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Layers size={20} className="text-amber-400" />
          <h1 className="text-2xl font-extrabold">Flashcard Deck</h1>
        </div>
        <button onClick={loadCards} className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg hover:bg-white/5">
          <RotateCw size={15} /> Refresh Due Cards
        </button>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        Spaced repetition (SM-2) schedules cards based on how well you recall them — rate honestly and cards you struggle with come back sooner.
      </p>

      {loading ? (
        <div className="text-slate-400">Loading deck...</div>
      ) : !current ? (
        <GlassCard className="p-10 text-center">
          <PartyPopper size={36} className="mx-auto mb-3 text-amber-400" />
          <div className="font-bold text-lg mb-1">All caught up!</div>
          <div className="text-slate-400 text-sm">
            {reviewed > 0 ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'} this session.` : 'No cards are due right now — check back later.'}
          </div>
        </GlassCard>
      ) : (
        <>
          <div className="text-sm text-slate-500">Card {idx + 1} / {cards.length}</div>
          <GlassCard
            onClick={() => setFlipped((f) => !f)}
            className="p-10 min-h-[220px] flex flex-col items-center justify-center text-center cursor-pointer select-none"
          >
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-surface-600 text-slate-400 mb-4">{current.category}</span>
            <p className="text-xl font-bold text-slate-100">{flipped ? current.back : current.front}</p>
            <span className="text-xs text-slate-500 mt-6">{flipped ? 'click to flip back' : 'click to reveal answer'}</span>
          </GlassCard>

          {flipped && (
            <div className="grid grid-cols-4 gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r.quality}
                  onClick={() => handleRate(r.quality)}
                  className={`rounded-xl py-3 text-sm font-bold transition-colors ${r.color}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
