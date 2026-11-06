import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Layers, TrendingUp, Scale, Box, Shapes, Sigma, Target, Infinity as InfinityIcon, GitBranch, Mountain, type LucideIcon } from 'lucide-react';
import { CH_ICON } from '../data/atlas';

const ICONS: Record<string, LucideIcon> = { Layers, TrendingUp, Scale, Box, Shapes, Sigma, Target, Infinity: InfinityIcon, GitBranch, Mountain };
export const ChapterIcon = ({ id, className = 'w-5 h-5' }: { id: number; className?: string }) => {
  const I = ICONS[CH_ICON[id]] ?? Sigma;
  return <I className={className} aria-hidden />;
};

export function PageHeader({ eyebrow, title, desc, right }: { eyebrow?: string; title: string; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-bold tracking-[0.18em] uppercase text-gold mb-1">{eyebrow}</p>}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brandtext leading-tight">{title}</h1>
        {desc && <p className="mt-2 text-muted max-w-3xl">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

export function ProgressRing({ value, size = 96, stroke = 9, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Progreso'}: ${Math.round(v)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--lav)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gold)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - v / 100) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-bold text-brandtext">{Math.round(v)}%</span>
    </div>
  );
}

export function Bar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 rounded-full bg-lav overflow-hidden ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div className="h-full bg-gradient-to-r from-violet to-gold rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }} transition={{ duration: 0.7 }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; icon?: ReactNode }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto pb-1 border-b border-line">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${value === t.id ? 'text-brandtext' : 'text-muted hover:text-fg'}`}>
          {t.icon}{t.label}
          {value === t.id && <motion.span layoutId="tab-underline" className="absolute left-2 right-2 -bottom-px h-0.5 bg-gold rounded" />}
        </button>
      ))}
    </div>
  );
}

export const Empty = ({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) => (
  <div className="card p-10 text-center text-muted">
    <div className="mx-auto mb-3 grid place-items-center w-12 h-12 rounded-full bg-lav text-brandtext">{icon}</div>
    <p className="font-semibold text-fg">{title}</p>
    <div className="mt-1 text-sm">{children}</div>
  </div>
);

export const Spinner = ({ label = 'Cargando…' }: { label?: string }) => (
  <div className="flex items-center gap-3 p-8 text-muted" role="status"><span className="w-5 h-5 rounded-full border-2 border-violet border-t-transparent animate-spin" />{label}</div>
);

export const levelColor = (l: number) => (l <= 2 ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : l <= 4 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-rose-500/15 text-rose-700 dark:text-rose-300');
