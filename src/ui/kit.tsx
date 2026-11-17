import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export function Card({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-3xl border border-line bg-surface p-4 sm:p-5', className)}>
      {(title || action) && (
        <header className="mb-3 flex min-h-8 items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  display,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  display?: string;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="text-ink/90">{label}</span>
        <span className="tabular-nums text-muted">{display ?? `${Math.round(p)}%`}</span>
      </span>
      <input
        type="range"
        className="slider mt-1"
        style={{ '--p': `${p}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx('flex rounded-2xl bg-black/35 p-1', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-h-10 min-w-0 flex-1 truncate rounded-xl px-1.5 text-[13px] font-medium transition-colors min-[400px]:text-sm',
            o.value === value ? 'bg-raised text-ink shadow-sm ring-1 ring-white/10' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-sm">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <span className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-white/15')}>
        <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white transition-all', checked ? 'left-6' : 'left-1')} />
      </span>
    </button>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  // Keep one listener for the sheet's lifetime: re-adding it on every render would drop
  // the Escape press whenever another key handler re-renders the app mid-event.
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-surface [animation:sheet-up_.25s_ease-out] sm:rounded-3xl">
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="grid h-11 w-11 place-items-center rounded-full bg-white/5 text-muted hover:text-ink">
            <X size={20} />
          </button>
        </header>
        <div className="space-y-5 overflow-y-auto px-5 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Quick light-up for pads: runs outside React so rapid taps never wait on a render. */
export function flash(el: Element | null, scale = 0.94) {
  el?.animate(
    [
      { transform: `scale(${scale})`, filter: 'brightness(1.9)' },
      { transform: 'scale(1)', filter: 'brightness(1)' },
    ],
    { duration: 380, easing: 'ease-out' },
  );
}

/** Live result of a CSS media query. */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (fn) => {
      const m = window.matchMedia(query);
      m.addEventListener('change', fn);
      return () => m.removeEventListener('change', fn);
    },
    () => window.matchMedia(query).matches,
  );
}
