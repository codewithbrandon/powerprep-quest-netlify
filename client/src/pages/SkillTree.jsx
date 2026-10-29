import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CircleDot, CheckCircle2, Network } from 'lucide-react';
import GlassCard from '../components/GlassCard.jsx';
import { useTrack } from '../context/TrackContext.jsx';
import { api } from '../api/client';

const CELL_W = 190;
const CELL_H = 130;
const NODE_W = 160;
const NODE_H = 88;

export default function SkillTree() {
  const { track } = useTrack();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.getSkillTree(track).then((data) => {
      setNodes(data.nodes);
      setLoading(false);
    });
  }, [track]);

  if (loading) return <div className="text-slate-400">Loading skill tree...</div>;

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxX = Math.max(1, ...nodes.map((n) => n.x));
  const maxY = Math.max(1, ...nodes.map((n) => n.y));
  const width = (maxX + 1) * CELL_W;
  const height = (maxY + 1) * CELL_H;

  const center = (n) => ({ x: n.x * CELL_W + NODE_W / 2, y: n.y * CELL_H + NODE_H / 2 });

  const statusStyles = {
    locked: 'border-white/5 bg-surface-700/50 text-slate-500',
    in_progress: 'border-brand-400/50 bg-brand-500/10 text-slate-100 shadow-glow',
    mastered: 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200',
  };
  const statusIcon = { locked: Lock, in_progress: CircleDot, mastered: CheckCircle2 };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Network size={20} className="text-brand-400" />
        <h1 className="text-2xl font-extrabold">Knowledge Map</h1>
      </div>
      <p className="text-slate-400 text-sm max-w-2xl">
        Nodes unlock as you master their prerequisites. Mastery is computed live from your practice accuracy in that domain. Click an unlocked node to jump into targeted practice.
      </p>

      <GlassCard className="p-6 overflow-x-auto">
        <div className="relative" style={{ width, height, minWidth: width }}>
          <svg className="absolute inset-0 pointer-events-none" width={width} height={height}>
            {nodes.map((n) =>
              n.prerequisites.map((pid) => {
                const parent = byId.get(pid);
                if (!parent) return null;
                const p1 = center(parent);
                const p2 = center(n);
                const mastered = parent.status === 'mastered';
                return (
                  <line
                    key={`${pid}-${n.id}`}
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={mastered ? '#34d399' : '#2a2f42'}
                    strokeWidth={2}
                    strokeDasharray={mastered ? '0' : '4 4'}
                  />
                );
              })
            )}
          </svg>
          {nodes.map((n) => {
            const Icon = statusIcon[n.status];
            const clickable = n.status !== 'locked';
            return (
              <button
                key={n.id}
                disabled={!clickable}
                onClick={() => navigate(`/practice?domain=${encodeURIComponent(n.domain)}`)}
                style={{ left: n.x * CELL_W, top: n.y * CELL_H, width: NODE_W, height: NODE_H }}
                className={`absolute rounded-xl border px-3 py-2.5 text-left transition-transform ${statusStyles[n.status]} ${
                  clickable ? 'hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={14} className={n.status === 'mastered' ? 'text-emerald-400' : n.status === 'in_progress' ? 'text-brand-400' : 'text-slate-500'} />
                  <span className="text-[10px] uppercase font-bold tracking-wide opacity-70">{n.domain}</span>
                </div>
                <div className="text-sm font-bold leading-tight">{n.name}</div>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <div className="flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1.5"><Lock size={13} /> Locked</div>
        <div className="flex items-center gap-1.5"><CircleDot size={13} className="text-brand-400" /> In Progress</div>
        <div className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-emerald-400" /> Mastered</div>
      </div>
    </div>
  );
}
