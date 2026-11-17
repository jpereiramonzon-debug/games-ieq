import type { ReactNode } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useT } from '../i18n';
import { useStore } from '../store';

export function GameShell({ id, title, score, onBack, children }: { id: string; title: string; score?: ReactNode; onBack: () => void; children: ReactNode }) {
  const t = useT();
  const best = useStore((s) => s.best[id] ?? 0);
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 animate-rise">
      <header className="flex items-center gap-3">
        <button onClick={onBack} aria-label={t('game.back')} className="grid h-11 w-11 place-items-center rounded-full bg-white/8 hover:bg-white/15">
          <ArrowLeft size={20} />
        </button>
        <h2 className="flex-1 text-xl font-semibold">{title}</h2>
        {score !== undefined && <span className="rounded-xl bg-accent/15 px-3 py-1.5 font-semibold tabular-nums text-accent">{score}</span>}
        <span className="flex items-center gap-1 text-sm tabular-nums text-muted" title={t('game.best')}>
          <Trophy size={15} /> {best}
        </span>
      </header>
      {children}
    </div>
  );
}

export function BigButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-black active:scale-[0.98]">
      {children}
    </button>
  );
}

export function Result({ score, label, record, children }: { score: ReactNode; label: string; record: boolean; children?: ReactNode }) {
  const t = useT();
  return (
    <div className="rounded-3xl border border-line bg-surface p-6 text-center animate-pop">
      <p className="text-sm uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-7xl font-semibold tabular-nums">{score}</p>
      {record && <p className="mt-2 font-semibold text-good">★ {t('game.record')}</p>}
      {children}
    </div>
  );
}
