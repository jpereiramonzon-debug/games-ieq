/** Shared pieces of Esther's challenges: feedback sounds, panels, conversations and clue-based placement. */
import { useMemo, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { buzz, starsOf, type GameProps } from '../pixel/stage';
import { Portrait } from '../pixel/Dialog';
import type { ThemeId, TimeOfDay } from '../platform/level';
import { useEstherScene, type Actor } from './scene';
import { ESPEAK } from './content';

export const rnd = (n: number) => Math.floor(Math.random() * n);
/** Test hook (development only): exposes a challenge's answer to the automated tests. */
export const dev = (k: string, v: unknown) => {
  if (import.meta.env.DEV) {
    const w = window as unknown as { __ester?: Record<string, unknown> };
    w.__ester = { ...w.__ester, [k]: v };
  }
};
export const shuffle = <T,>(a: readonly T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
export const ok = () => {
  engine.playNote(79, 'bell', 0, 0.25);
  buzz(20);
};
export const bad = () => {
  engine.sfx('bonk');
  buzz([30, 30, 30]);
};
export const tick = () => engine.playNote(64 + rnd(5), 'pluck', 0, 0.18);
export const win = () => {
  engine.sfx('yay');
  buzz([40, 30, 80]);
};

/** Logical (canvas) coordinates of a pointer on a stretched pixel canvas. */
export const toLogical = (cv: HTMLCanvasElement, e: { clientX: number; clientY: number }) => {
  const r = cv.getBoundingClientRect();
  return [((e.clientX - r.left) * cv.width) / r.width, ((e.clientY - r.top) * cv.height) / r.height] as const;
};

/** Parchment panel for a challenge, leaving room for the exit/music buttons on the left. */
export const Box = ({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) => (
  <div
    className={cx(
      'rpg-frame rpg-text absolute bottom-2 left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-[max(0.5rem,env(safe-area-inset-right))] top-2 mx-auto flex flex-col gap-1.5 overflow-hidden p-2 short:gap-1 short:p-1.5',
      narrow ? 'max-w-2xl' : 'max-w-4xl',
      className,
    )}
  >
    {children}
  </div>
);
export const Head = ({ left, right }: { left: ReactNode; right?: ReactNode }) => (
  <span className="flex shrink-0 items-center justify-between gap-2 pr-11 text-sm leading-tight text-[#ffe08a]">
    <span>{left}</span>
    <span className="shrink-0">{right}</span>
  </span>
);

// ------------------------------------------------------------------ conversations

export interface Step {
  who: keyof typeof ESPEAK;
  q: string;
  opts: { t: string; ok?: boolean; why?: string; reply?: string }[];
}

/** A conversation in several steps: wrong answers explain why and let you try again. */
export function makeConversation(theme: ThemeId, time: TimeOfDay, actors: Actor[], steps: Step[]) {
  return function Conversation({ paused, onWin }: GameProps) {
    const cv = useEstherScene(theme, time, actors);
    const [k, setK] = useState(0);
    const [miss, setMiss] = useState(0);
    const [why, setWhy] = useState<string | null>(null);
    const [reply, setReply] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const order = useMemo(() => steps.map((s) => shuffle(s.opts)), []);
    if (paused) return <canvas ref={cv} className="pixelated absolute inset-0 h-full w-full" aria-hidden />;
    const st = steps[k];
    const sp = ESPEAK[st.who];
    return (
      <>
        <canvas ref={cv} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
        <div className="rpg-frame rpg-text absolute bottom-2 left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-[max(0.5rem,env(safe-area-inset-right))] mx-auto flex max-h-[calc(100%-1rem)] max-w-3xl flex-col gap-1 overflow-y-auto p-2">
          <div className="flex items-start gap-2">
            <Portrait look={sp.look} mood={why ? 'sad' : 'neutral'} bg={sp.bg} className="h-12 w-12 short:h-10 short:w-10" />
            <p className="text-base leading-snug short:text-sm">
              <span className="block text-xs text-[#ffe08a]">
                {sp.name} · {k + 1}/{steps.length}
              </span>
              {reply ?? why ?? st.q}
            </p>
          </div>
          {reply ? (
            <button
              className="rpg-wood px-3 py-1.5 text-base"
              onClick={() => {
                setReply(null);
                setWhy(null);
                if (k + 1 < steps.length) setK(k + 1);
                else {
                  setDone(true);
                  win();
                  window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 300);
                }
              }}
            >
              Continuar ▶
            </button>
          ) : (
            order[k].map((o) => (
              <button
                key={o.t}
                disabled={done}
                className="rpg-wood px-3 py-1 text-left text-sm leading-snug"
                onClick={() => {
                  if (o.ok) {
                    ok();
                    setWhy(null);
                    setReply(o.reply ?? '“Isso mesmo.”');
                  } else {
                    bad();
                    setMiss((m) => m + 1);
                    setWhy(o.why ?? 'Pense de novo no que a história conta.');
                  }
                }}
              >
                {o.t}
              </button>
            ))
          )}
        </div>
      </>
    );
  };
}

// ------------------------------------------------------------------ placement with clues

export interface Clue {
  text: string;
  test: (pos: number[]) => boolean;
}

/** Positions are slot indices of a rows×cols grid; `pos[item]` is where the item is. */
export function placementClues(names: string[], rows: number, cols: number, answer: number[], forced: Clue[], maxClues: number, labels: { row?: string[]; col?: string[] } = {}) {
  const n = names.length;
  const R = (p: number) => Math.floor(p / cols);
  const C = (p: number) => p % cols;
  const pool: Clue[] = [];
  for (let a = 0; a < n; a++) {
    const pa = answer[a];
    if (rows > 1 && labels.row) pool.push({ text: `${names[a]} fica ${labels.row[R(pa)]}.`, test: (p) => R(p[a]) === R(pa) });
    if (labels.col) {
      pool.push({ text: `${names[a]} fica ${labels.col[C(pa)]}.`, test: (p) => C(p[a]) === C(pa) });
      const other = (C(pa) + 1 + rnd(cols - 1)) % cols;
      pool.push({ text: `${names[a]} não fica ${labels.col[other]}.`, test: (p) => C(p[a]) !== other });
    }
    for (let b = 0; b < n; b++) {
      if (a === b) continue;
      const pb = answer[b];
      if (R(pa) === R(pb) && C(pa) === C(pb) - 1) pool.push({ text: `${names[a]} fica logo à esquerda de ${names[b]}.`, test: (p) => R(p[a]) === R(p[b]) && C(p[a]) === C(p[b]) - 1 });
      if (C(pa) < C(pb) && a < b) pool.push({ text: `${names[a]} fica mais à esquerda que ${names[b]}.`, test: (p) => C(p[a]) < C(p[b]) });
      if (rows > 1 && C(pa) === C(pb) && R(pa) < R(pb)) pool.push({ text: `${names[a]} fica atrás de ${names[b]}.`, test: (p) => C(p[a]) === C(p[b]) && R(p[a]) < R(p[b]) });
      if (Math.abs(C(pa) - C(pb)) + Math.abs(R(pa) - R(pb)) > 1 && a < b) pool.push({ text: `${names[a]} e ${names[b]} não ficam lado a lado.`, test: (p) => Math.abs(C(p[a]) - C(p[b])) + Math.abs(R(p[a]) - R(p[b])) > 1 });
    }
  }
  // All arrangements of n items in rows*cols slots (n! * ... small: up to 6 in 6).
  const slots = rows * cols;
  const all: number[][] = [];
  const walk = (cur: number[], used: boolean[]) => {
    if (cur.length === n) return void all.push([...cur]);
    for (let s = 0; s < slots; s++)
      if (!used[s]) {
        used[s] = true;
        cur.push(s);
        walk(cur, used);
        cur.pop();
        used[s] = false;
      }
  };
  walk([], []);
  const chosen = [...forced];
  let alive = all.filter((p) => chosen.every((c) => c.test(p)));
  for (const c of shuffle(pool)) {
    if (alive.length <= 1) break;
    const next = alive.filter((p) => c.test(p));
    if (next.length < alive.length) {
      chosen.push(c);
      alive = next;
    }
  }
  // Drop redundant clues (keeping the forced ones), down to a readable list.
  for (let i = chosen.length - 1; i >= forced.length; i--) {
    const without = chosen.filter((_, k) => k !== i);
    if (all.filter((p) => without.every((c) => c.test(p))).length === 1) chosen.splice(i, 1);
  }
  return { clues: chosen.slice(0, Math.max(maxClues, chosen.length)), unique: alive.length === 1 };
}

/** Grid placement puzzle UI: tap an item, then a slot. Clues show ✔ live (except on hard). */
export function Placement({
  items,
  rows,
  cols,
  clues,
  slotLabel,
  live,
  onSolved,
  title,
}: {
  items: { name: string; icon: ReactNode }[];
  rows: number;
  cols: number;
  clues: Clue[];
  slotLabel?: (s: number) => string;
  live: boolean;
  onSolved: (checks: number) => void;
  title: string;
}) {
  const [pos, setPos] = useState<(number | null)[]>(() => items.map(() => null));
  const [sel, setSel] = useState<number | null>(null);
  const [checks, setChecks] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const full = pos.every((p) => p !== null);
  dev('place', { n: items.length, slots: rows * cols, clues });
  const put = (slot: number) => {
    if (won) return;
    const here = pos.findIndex((p) => p === slot);
    if (sel === null) {
      if (here >= 0) setSel(here);
      return;
    }
    const np = [...pos];
    if (here >= 0) np[here] = pos[sel];
    np[sel] = slot;
    setPos(np);
    setSel(null);
    tick();
  };
  const check = () => {
    setChecks((c) => c + 1);
    const broken = clues.filter((c) => !c.test(pos as number[]));
    if (!full) return setMsg('Coloque todos os itens primeiro.');
    if (broken.length === 0) {
      setWon(true);
      win();
      setMsg('Tudo no lugar certo!');
      window.setTimeout(() => onSolved(checks), 900);
    } else {
      bad();
      setMsg(`${broken.length} pista${broken.length > 1 ? 's' : ''} ainda não ${broken.length > 1 ? 'estão' : 'está'} certa${broken.length > 1 ? 's' : ''}.`);
    }
  };
  return (
    <div className="flex min-h-0 flex-1 gap-2">
      <ul className="flex w-[42%] min-w-0 flex-col gap-0.5 overflow-y-auto text-xs leading-snug sm:text-sm">
        <li className="text-[#ffe08a]">{title}</li>
        {clues.map((c) => {
          const known = live && full ? c.test(pos as number[]) : null;
          return (
            <li key={c.text} className="flex gap-1">
              <span className="w-3 shrink-0">{known === null ? '•' : known ? <Check size={12} className="text-[#2a8a3a]" /> : <X size={12} className="text-[#c8321f]" />}</span>
              {c.text}
            </li>
          );
        })}
      </ul>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0,1fr))` }}>
          {Array.from({ length: rows * cols }, (_, s) => {
            const it = pos.findIndex((p) => p === s);
            return (
              <button
                key={s}
                data-slot={s}
                onClick={() => put(s)}
                className={cx(
                  'relative flex min-h-0 flex-col items-center justify-center rounded-sm border-2 border-dashed border-[#8a6a3a] bg-[#f4e4c0]/60 p-0.5 text-[10px] leading-tight text-[#3a2414]',
                  it >= 0 && 'border-solid bg-[#f4e4c0]',
                  it >= 0 && sel === it && 'outline outline-2 outline-[#ffe08a]',
                )}
                aria-label={`${slotLabel?.(s) ?? `Lugar ${s + 1}`}${it >= 0 ? `: ${items[it].name}` : ''}`}
              >
                {it >= 0 ? (
                  <>
                    <span className="text-lg leading-none short:text-base">{items[it].icon}</span>
                    <span className="line-clamp-2 text-center">{items[it].name}</span>
                  </>
                ) : (
                  <span className="opacity-60">{slotLabel?.(s) ?? s + 1}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((it, i) =>
            pos[i] === null ? (
              <button key={it.name} data-item={i} onClick={() => (setSel(i), tick())} className={cx('rpg-wood flex items-center gap-1 px-1.5 py-0.5 text-xs', sel === i && 'outline outline-2 outline-[#ffe08a] brightness-110')}>
                <span>{it.icon}</span>
                {it.name}
              </button>
            ) : null,
          )}
        </div>
        <span className="flex items-center gap-2">
          <span className="flex-1 text-xs leading-tight">{msg ?? (sel !== null ? `Agora toque num lugar para ${items[sel].name}.` : 'Toque num item e depois num lugar.')}</span>
          <button disabled={won} className="rpg-wood px-3 py-1 text-sm" onClick={check}>
            Conferir
          </button>
        </span>
      </div>
    </div>
  );
}

export const starsByMiss = (miss: number, n = 1) => starsOf(1 - miss / (n + 2));
