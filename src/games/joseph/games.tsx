/**
 * José do Egito — chapter challenges. Each one is a small logic or planning
 * puzzle generated per difficulty and solvable by construction:
 * sheaves/stars toggle puzzle, desert water-path planning, a storeroom Latin
 * square, a moral choice, a deduction hunt for clues in the cell, dream
 * interpretation, harvest planning, granary logistics and the seating of the
 * brothers by birth order.
 */
import { useMemo, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { drawPerson, shade, type Look } from '../pixel/person';
import { buzz, byDiff, Retry as RetryBase, Stage, starsOf, useStage, type GameProps } from '../pixel/stage';
import { XLOOKS } from './content';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={XLOOKS.jose} />;
const rnd = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const ok = () => {
  engine.playNote(79, 'bell', 0, 0.25);
  buzz(20);
};
const bad = () => {
  engine.sfx('bonk');
  buzz([30, 30, 30]);
};
const tick = () => engine.playNote(64 + rnd(5), 'pluck', 0, 0.18);

// ------------------------------------------------------------------ scenery

type SceneKind = 'field' | 'sky' | 'desert' | 'house' | 'prison' | 'throne' | 'granary' | 'hall';

/** Painted backdrop for each chapter, cached once per width. */
function useScene(kind: SceneKind, people: [Look, number, 'left' | 'right' | 'down'][] = []) {
  const cache = useRef<{ w: number; c: HTMLCanvasElement } | null>(null);
  return useStage((ctx, w, _dt, t) => {
    if (!cache.current || cache.current.w !== w) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = 180;
      paintScene(c.getContext('2d')!, w, kind);
      cache.current = { w, c };
    }
    ctx.drawImage(cache.current.c, 0, 0);
    if (kind === 'sky')
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,230,${0.4 + 0.4 * Math.sin(t * 2 + i)})`;
        ctx.fillRect((i * 71) % w, (i * 37) % 110, 1, 1);
      }
    if (kind === 'prison' || kind === 'throne' || kind === 'house' || kind === 'hall')
      for (const x of [w * 0.12, w * 0.88]) {
        const g = ctx.createRadialGradient(x, 50, 2, x, 50, 40);
        g.addColorStop(0, 'rgba(255,190,90,0.35)');
        g.addColorStop(1, 'rgba(255,190,90,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 40, 10, 80, 80);
        ctx.fillStyle = '#ff8a2a';
        ctx.fillRect(x - 2, 44 + Math.sin(t * 12 + x), 4, 5);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(x - 1, 46, 2, 3);
      }
    for (const [lk, x, d] of people) drawPerson(ctx, lk, x * w, 170, d, Math.floor(t * 2 + x * 10) % 2 ? 0 : 0);
  });
}

function paintScene(ctx: CanvasRenderingContext2D, w: number, kind: SceneKind) {
  const r = (x: number, y: number, ww: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(h));
  };
  const grad = (a: string, b: string, h = 180) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  const hills = (base: number, amp: number, col: string, f: number) => {
    ctx.fillStyle = col;
    for (let x = 0; x < w; x++) {
      const y = base - amp * Math.abs(Math.sin(x * f + base));
      ctx.fillRect(x, y, 1, 180 - y);
    }
  };
  /** Golden Egyptian wall with a coloured meander band (as in the tomb reference). */
  const egyptWall = (block: string, mortar: string) => {
    r(0, 0, w, 180, block);
    for (let y = 0; y < 180; y += 12) {
      r(0, y, w, 1, mortar);
      for (let x = ((y / 12) % 2) * 12; x < w; x += 24) r(x, y, 1, 12, mortar);
    }
    for (const by of [20, 120]) {
      r(0, by, w, 10, '#f0d080');
      for (let x = 0; x < w; x += 8) {
        r(x, by + 2, 6, 6, ['#2a5aa8', '#3a9a6a', '#c8503a'][(x / 8) % 3]);
        r(x + 2, by + 4, 2, 2, '#f0d080');
      }
      r(0, by + 10, w, 1, shade(block, -0.35));
    }
  };
  if (kind === 'field') {
    grad('#7ab8e0', '#cfe6f0', 120);
    hills(96, 22, '#8aa860', 0.02);
    hills(118, 12, '#6a8a44', 0.035);
    r(0, 120, w, 60, '#c8a850');
    for (let x = 0; x < w; x += 6) r(x, 120 + ((x * 7) % 50), 1, 3, '#a88a38');
  } else if (kind === 'sky') {
    grad('#0a0e24', '#2a2a5a');
    hills(150, 16, '#141a30', 0.02);
  } else if (kind === 'desert') {
    grad('#e8a860', '#f8dca8', 120);
    ctx.fillStyle = '#fff0c0';
    ctx.beginPath();
    ctx.arc(w * 0.8, 40, 16, 0, Math.PI * 2);
    ctx.fill();
    hills(110, 18, '#e0b070', 0.015);
    hills(130, 12, '#d0a060', 0.03);
    r(0, 140, w, 40, '#c89850');
  } else if (kind === 'house' || kind === 'granary') {
    egyptWall('#d8a84a', '#a8782a');
    r(0, 150, w, 30, '#8a6424');
    r(0, 150, w, 2, '#e8c060');
    if (kind === 'granary')
      for (let x = 30; x < w; x += 90) {
        r(x, 60, 40, 60, '#a87a30');
        ctx.fillStyle = '#c89a40';
        ctx.beginPath();
        ctx.arc(x + 20, 60, 20, Math.PI, 0);
        ctx.fill();
        r(x + 14, 100, 12, 20, '#4a3010');
      }
  } else if (kind === 'prison') {
    r(0, 0, w, 180, '#3a3430');
    for (let y = 0; y < 180; y += 14) for (let x = ((y / 14) % 2) * 14; x < w; x += 28) r(x + 1, y + 1, 26, 12, (x + y) % 3 ? '#4a423c' : '#544a42');
    r(w * 0.45, 12, 40, 26, '#1a1614');
    for (let k = 0; k < 4; k++) r(w * 0.45 + 4 + k * 10, 12, 3, 26, '#6a6a74');
    r(0, 150, w, 30, '#2a2420');
  } else if (kind === 'throne' || kind === 'hall') {
    r(0, 0, w, 180, kind === 'throne' ? '#3a2e4c' : '#4a3a28');
    for (let x = 10; x < w; x += 70) {
      r(x, 0, 18, 150, '#e8dcc0');
      r(x + 13, 0, 5, 150, '#c8b898');
      r(x - 3, 0, 24, 8, '#e8b830');
      r(x - 3, 142, 24, 8, '#e8b830');
      for (let y = 30; y < 140; y += 22) r(x + 2, y, 14, 2, '#3a6ab8');
    }
    r(0, 150, w, 30, kind === 'throne' ? '#5a4a6a' : '#6a5030');
    r(0, 150, w, 2, '#e8b830');
  }
}

// ------------------------------------------------------------------ shared UI

const Box = ({ children, className, narrow }: { children: React.ReactNode; className?: string; narrow?: boolean }) => (
  <div className={cx('rpg-frame rpg-text absolute inset-x-2 bottom-2 top-14 mx-auto flex flex-col gap-1.5 p-2', narrow ? 'max-w-2xl' : 'max-w-4xl', className)}>{children}</div>
);
const Head = ({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) => (
  <span className="flex items-center justify-between gap-2 text-sm text-[#ffe08a]">
    <span>{left}</span>
    <span>{right}</span>
  </span>
);

/** Multiple choice moral decision: wrong answers explain and let you try again. */
export function makeChoice(scene: SceneKind, people: [Look, number, 'left' | 'right' | 'down'][], q: string, opts: { t: string; ok?: boolean; why?: string }[]) {
  return function Choice({ paused, onWin }: GameProps) {
    const cv = useScene(scene, people);
    const order = useMemo(() => shuffle(opts), []);
    const [miss, setMiss] = useState(0);
    const [why, setWhy] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    if (paused) return <Stage cv={cv} />;
    return (
      <>
        <Stage cv={cv} />
        <div className="rpg-frame rpg-text absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl flex-col gap-1.5 p-2">
          <p className="text-lg leading-snug">{why ?? q}</p>
          {order.map((o) => (
            <button
              key={o.t}
              disabled={done}
              className="rpg-wood px-3 py-1.5 text-left text-base"
              onClick={() => {
                if (o.ok) {
                  ok();
                  setDone(true);
                  engine.sfx('yay');
                  window.setTimeout(() => onWin(miss === 0 ? 3 : miss === 1 ? 2 : 1), 500);
                } else {
                  bad();
                  setMiss((m) => m + 1);
                  setWhy(o.why ?? 'Pense de novo: o que agrada a Deus?');
                }
              }}
            >
              {o.t}
            </button>
          ))}
        </div>
      </>
    );
  };
}

/** Link each symbol to its meaning. */
export function makeMatch(scene: SceneKind, people: [Look, number, 'left' | 'right' | 'down'][], title: string, pairs: [string, string][], decoys: string[]) {
  return function Match({ paused, onWin, diff = 1 }: GameProps) {
    const cv = useScene(scene, people);
    const meanings = useMemo(() => shuffle([...pairs.map((p) => p[1]), ...decoys.slice(0, byDiff(diff, [0, 2, decoys.length]))]), [diff]);
    const [sel, setSel] = useState<number | null>(null);
    const [done, setDone] = useState<Record<number, string>>({});
    const [miss, setMiss] = useState(0);
    const [msg, setMsg] = useState<string | null>(null);
    if (paused) return <Stage cv={cv} />;
    const pick = (m: string) => {
      if (sel === null) return setMsg('Toque primeiro num símbolo do sonho.');
      if (pairs[sel][1] === m) {
        ok();
        const nd = { ...done, [sel]: m };
        setDone(nd);
        setSel(null);
        setMsg('Isso mesmo!');
        if (Object.keys(nd).length === pairs.length) {
          engine.sfx('yay');
          window.setTimeout(() => onWin(starsOf(1 - miss / (pairs.length + 1))), 600);
        }
      } else {
        bad();
        setMiss((x) => x + 1);
        setMsg('Não é esse o sentido. Leia o símbolo de novo.');
      }
    };
    return (
      <>
        <Stage cv={cv} />
        <Box>
          <Head left={title} right={`Erros: ${miss}`} />
          <div className="flex min-h-0 flex-1 gap-2">
            <div className="flex flex-1 flex-col gap-1 overflow-auto">
              {pairs.map(([s], i) => (
                <button
                  key={s}
                  disabled={!!done[i]}
                  onClick={() => (setSel(i), tick())}
                  className={cx('rpg-wood px-2 py-1 text-left text-sm', sel === i && 'outline outline-2 outline-[#ffe08a]', done[i] && 'opacity-60')}
                >
                  {s}
                  {done[i] && <span className="block text-xs text-[#9af06a]">→ {done[i]}</span>}
                </button>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-auto">
              {meanings.map((m) => (
                <button
                  key={m}
                  disabled={Object.values(done).includes(m)}
                  onClick={() => pick(m)}
                  className={cx('rounded-sm border-2 border-[#5b3a1e] bg-[#f4e4c0] px-2 py-1 text-left text-sm text-[#3a2414]', Object.values(done).includes(m) && 'opacity-40')}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm">{msg}</span>
        </Box>
      </>
    );
  };
}

// ------------------------------------------------------------------ 1. dreams

/** Lights-out: tapping a tile flips it and its orthogonal neighbours. All must bow. */
function makeBow(kind: 'sheaf' | 'star') {
  return function Bow({ paused, onWin, diff = 1 }: GameProps) {
    const cv = useScene(kind === 'sheaf' ? 'field' : 'sky', kind === 'sheaf' ? [[XLOOKS.jose, 0.08, 'right']] : []);
    const [R, C, K] = byDiff(diff, [
      [3, 3, 3],
      [3, 4, 5],
      [4, 4, 7],
    ]);
    const center = Math.floor(R / 2) * C + Math.floor(C / 2) - (R % 2 ? 0 : 0);
    const make = () => {
      // Start solved (all bowed = true) and apply K distinct random taps.
      const g = Array(R * C).fill(true);
      const taps = shuffle([...Array(R * C).keys()].filter((i) => i !== center)).slice(0, K);
      for (const i of taps) flip(g, i);
      if (g.every(Boolean)) return make();
      return g;
    };
    function flip(g: boolean[], i: number) {
      const r = Math.floor(i / C);
      const c = i % C;
      for (const [dr, dc] of [
        [0, 0],
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
        const j = nr * C + nc;
        if (j !== center) g[j] = !g[j];
      }
    }
    const [g, setG] = useState(make);
    const start = useRef(g);
    const [moves, setMoves] = useState(0);
    const [won, setWon] = useState(false);
    if (paused) return <Stage cv={cv} />;
    const tap = (i: number) => {
      if (i === center || won) return;
      const n = [...g];
      flip(n, i);
      setG(n);
      setMoves((m) => m + 1);
      tick();
      if (n.every(Boolean)) {
        setWon(true);
        engine.sfx('yay');
        buzz([40, 30, 80]);
        window.setTimeout(() => onWin(moves + 1 <= K ? 3 : moves + 1 <= K * 2 ? 2 : 1), 700);
      }
    };
    const icon = (i: number, b: boolean) => {
      if (kind === 'sheaf') return i === center ? '🌾' : b ? <span className="inline-block rotate-[35deg]">🌾</span> : '🌾';
      if (i === center) return '⭐';
      const sun = 0;
      const moon = C - 1;
      const s = i === sun ? '☀️' : i === moon ? '🌙' : '✦';
      return b ? <span className="inline-block rotate-[25deg] opacity-80">{s}</span> : s;
    };
    return (
      <>
        <Stage cv={cv} />
        <Box narrow className="items-center">
          <Head left={kind === 'sheaf' ? 'Feixes: todos inclinados diante do de José' : 'Céu: sol, lua e estrelas inclinados'} right={`Toques: ${moves} (ideal ≤ ${K})`} />
          <div className="grid flex-1 gap-1.5" style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 3.6rem))` }}>
            {g.map((b, i) => (
              <button
                key={i}
                onClick={() => tap(i)}
                aria-label={i === center ? 'José' : b ? 'Inclinado' : 'De pé'}
                className={cx(
                  'grid aspect-square place-items-center rounded-sm border-[3px] text-2xl transition',
                  i === center
                    ? 'border-[#e8b830] bg-[#f0d080]'
                    : b
                      ? 'border-[#3a8a3a] bg-[#5a7a3a]'
                      : kind === 'sheaf'
                        ? 'border-[#5b3a1e] bg-[#c8a050]'
                        : 'border-[#3a3a6a] bg-[#2a2a5a]',
                )}
              >
                {icon(i, b)}
              </button>
            ))}
          </div>
          <span className="flex w-full items-center gap-2 text-xs">
            <span className="flex-1">Toque num {kind === 'sheaf' ? 'feixe' : 'astro'}: ele e os vizinhos (cima, baixo, lados) mudam. Verde = inclinado.</span>
            <button className="rpg-wood px-3 py-1 text-sm" onClick={() => (setG(start.current), setMoves(0))}>
              Recomeçar
            </button>
          </span>
        </Box>
      </>
    );
  };
}
export const Sheaves = makeBow('sheaf');
export const Stars = makeBow('star');

// ------------------------------------------------------------------ 2. desert caravan

type Cell = '.' | '#' | 'o' | 's';
const COST: Record<Cell, number> = { '.': 1, '#': 99, o: 1, s: 2 };

/** Shortest number of moves from start to goal given water capacity (0 = impossible). */
function solveDesert(grid: Cell[][], cap: number, useOasis = true) {
  const R = grid.length;
  const C = grid[0].length;
  const seen = new Set<string>();
  const q: [number, number, number, number][] = [[R - 1, 0, cap, 0]];
  while (q.length) {
    const [r, c, w, d] = q.shift()!;
    if (r === 0 && c === C - 1) return d;
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || grid[nr][nc] === '#') continue;
      let nw = w - COST[grid[nr][nc]];
      if (nw < 0) continue;
      if (grid[nr][nc] === 'o' && useOasis) nw = cap;
      if (nw === 0 && !(nr === 0 && nc === C - 1)) continue;
      const k = `${nr},${nc},${nw}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nr, nc, nw, d + 1]);
    }
  }
  return 0;
}

function makeDesert(diff: number) {
  const [R, C, cap, rocks, oases, scorp] = byDiff(diff, [
    [5, 7, 7, 6, 2, 2],
    [6, 8, 7, 10, 2, 4],
    [6, 10, 7, 14, 2, 6],
  ]);
  for (let tries = 0; tries < 2000; tries++) {
    const g: Cell[][] = Array.from({ length: R }, () => Array<Cell>(C).fill('.'));
    const free = shuffle([...Array(R * C).keys()].filter((i) => i !== (R - 1) * C && i !== C - 1));
    let k = 0;
    const put = (n: number, t: Cell) => {
      for (let j = 0; j < n; j++) {
        const i = free[k++];
        g[Math.floor(i / C)][i % C] = t;
      }
    };
    put(rocks, '#');
    put(oases, 'o');
    put(scorp, 's');
    const best = solveDesert(g, cap);
    if (best && !solveDesert(g, cap, false)) return { g, best, cap };
  }
  throw new Error('desert');
}

export function Desert({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('desert');
  const [lv, setLv] = useState(() => makeDesert(diff));
  const [pos, setPos] = useState<[number, number]>([lv.g.length - 1, 0]);
  const [water, setWater] = useState(lv.cap);
  const [steps, setSteps] = useState(0);
  const [lost, setLost] = useState(false);
  const [won, setWon] = useState(false);
  const R = lv.g.length;
  const C = lv.g[0].length;
  const restart = (fresh = false) => {
    const l = fresh ? makeDesert(diff) : lv;
    setLv(l);
    setPos([l.g.length - 1, 0]);
    setWater(l.cap);
    setSteps(0);
    setLost(false);
  };
  if (paused) return <Stage cv={cv} />;
  const go = (r: number, c: number) => {
    if (won || lost) return;
    if (Math.abs(r - pos[0]) + Math.abs(c - pos[1]) !== 1) return;
    const t = lv.g[r][c];
    if (t === '#') return bad();
    let w = water - COST[t];
    setSteps((s) => s + 1);
    setPos([r, c]);
    if (t === 's') {
      engine.sfx('hurt');
      buzz(40);
    } else tick();
    if (r === 0 && c === C - 1 && w >= 0) {
      setWater(w);
      setWon(true);
      engine.sfx('yay');
      window.setTimeout(() => onWin(steps + 1 <= lv.best ? 3 : steps + 1 <= lv.best + 4 ? 2 : 1), 700);
      return;
    }
    if (t === 'o') {
      w = lv.cap;
      engine.playNote(84, 'bell', 0, 0.3);
    }
    setWater(Math.max(0, w));
    if (w <= 0) setLost(true);
  };
  return (
    <>
      <Stage cv={cv} />
      <Box narrow className="items-center">
        <Head
          left={
            <>
              Água: <span className="text-[#7ab4ff]">{'💧'.repeat(water)}</span>
              <span className="opacity-40">{'💧'.repeat(Math.max(0, lv.cap - water))}</span>
            </>
          }
          right={`Passos: ${steps} (melhor: ${lv.best})`}
        />
        <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 2.6rem))`, gridTemplateRows: `repeat(${R}, minmax(0, 1fr))` }}>
          {lv.g.flatMap((row, r) =>
            row.map((t, c) => {
              const here = pos[0] === r && pos[1] === c;
              const adj = Math.abs(r - pos[0]) + Math.abs(c - pos[1]) === 1 && t !== '#';
              return (
                <button
                  key={`${r},${c}`}
                  onClick={() => go(r, c)}
                  aria-label={here ? 'Caravana' : t === '#' ? 'Rocha' : t === 'o' ? 'Oásis' : t === 's' ? 'Escorpiões' : 'Areia'}
                  className={cx(
                    'grid place-items-center rounded-sm border-2 text-lg leading-none',
                    t === '#' ? 'border-[#5a4a3a] bg-[#7a6a5a]' : t === 'o' ? 'border-[#2a6a3a] bg-[#5ab06a]' : 'border-[#a87a40] bg-[#e8c080]',
                    adj && 'outline outline-2 outline-[#ffe08a]',
                  )}
                >
                  {here ? '🐪' : r === 0 && c === C - 1 ? '🏛️' : r === R - 1 && c === 0 ? '⛺' : t === '#' ? '🪨' : t === 'o' ? '🌴' : t === 's' ? '🦂' : ''}
                </button>
              );
            }),
          )}
        </div>
        <span className="flex w-full items-center gap-2 text-xs">
          <span className="flex-1">Toque numa casa vizinha para andar. Areia gasta 1 água, escorpiões gastam 2, o oásis enche os odres. Chegue ao templo do Egito (🏛️).</span>
          <button className="rpg-wood px-3 py-1 text-sm" onClick={() => restart()}>
            Recomeçar
          </button>
        </span>
      </Box>
      {lost && <Retry text="A água acabou no deserto. Planeje o caminho passando pelos oásis antes de os odres esvaziarem." onRetry={() => restart()} />}
    </>
  );
}

// ------------------------------------------------------------------ 3. storeroom (Latin square)

const GOODS = ['🌾', '🍷', '🫒', '🧵', '🍯'];
const GOOD_NAMES = ['Trigo', 'Vinho', 'Azeite', 'Linho', 'Mel'];

function makeSquare(n: number, holes: number) {
  const rows = shuffle([...Array(n).keys()]);
  const cols = shuffle([...Array(n).keys()]);
  const sym = shuffle([...Array(n).keys()]);
  const sol = rows.map((r) => cols.map((c) => sym[(r + c) % n]));
  const given = sol.map((row) => row.map(() => true));
  for (const i of shuffle([...Array(n * n).keys()]).slice(0, holes)) given[Math.floor(i / n)][i % n] = false;
  return { sol, given };
}

export function Storeroom({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('house', [[XLOOKS.potifar, 0.06, 'right']]);
  const [n, holes] = byDiff(diff, [
    [3, 4],
    [4, 9],
    [5, 15],
  ]);
  const [{ sol, given }] = useState(() => makeSquare(n, holes));
  const [g, setG] = useState<(number | null)[][]>(() => sol.map((row, r) => row.map((v, c) => (given[r][c] ? v : null))));
  const [taps, setTaps] = useState(0);
  const [won, setWon] = useState(false);
  if (paused) return <Stage cv={cv} />;
  const clash = (r: number, c: number) => {
    const v = g[r][c];
    if (v === null) return false;
    return g[r].some((x, k) => k !== c && x === v) || g.some((row, k) => k !== r && row[c] === v);
  };
  const tap = (r: number, c: number) => {
    if (given[r][c] || won) return;
    const cur = g[r][c];
    const nv = cur === null ? 0 : cur + 1 >= n ? null : cur + 1;
    const ng = g.map((row) => [...row]);
    ng[r][c] = nv;
    setG(ng);
    setTaps((t) => t + 1);
    tick();
    const full = ng.every((row) => row.every((x) => x !== null));
    const valid = full && ng.every((row) => new Set(row).size === n) && [...Array(n).keys()].every((c2) => new Set(ng.map((row) => row[c2])).size === n);
    if (valid) {
      setWon(true);
      engine.sfx('yay');
      buzz([40, 30, 80]);
      window.setTimeout(() => onWin(taps + 1 <= holes * 2 ? 3 : taps + 1 <= holes * 4 ? 2 : 1), 700);
    }
  };
  return (
    <>
      <Stage cv={cv} />
      <Box narrow className="items-center">
        <Head left="Depósito de Potifar: um de cada em cada linha e coluna" right={`Toques: ${taps}`} />
        <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 3.2rem))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` }}>
          {g.flatMap((row, r) =>
            row.map((v, c) => (
              <button
                key={`${r},${c}`}
                onClick={() => tap(r, c)}
                aria-label={v === null ? 'Vazio' : GOOD_NAMES[v]}
                className={cx(
                  'grid place-items-center rounded-sm border-[3px] text-2xl',
                  given[r][c] ? 'border-[#8a6424] bg-[#c8a060]' : 'border-[#5b3a1e] bg-[#f4e4c0]',
                  clash(r, c) && 'bg-[#e88a7a]',
                )}
              >
                {v === null ? '' : GOODS[v]}
              </button>
            )),
          )}
        </div>
        <span className="text-xs">
          Produtos:{' '}
          {GOODS.slice(0, n)
            .map((s, i) => `${s} ${GOOD_NAMES[i]}`)
            .join(' · ')}
          . Vermelho = repetido na linha ou coluna.
        </span>
      </Box>
    </>
  );
}

export const Temptation = makeChoice(
  'house',
  [
    [XLOOKS.esposa, 0.4, 'right'],
    [XLOOKS.joseServo, 0.6, 'left'],
  ],
  'A esposa de Potifar o agarra pela capa: “Fica comigo!” O que José faz?',
  [
    { t: 'Diz não, deixa a capa na mão dela e foge.', ok: true },
    { t: 'Fica, afinal ninguém vai ver.', why: 'Deus vê tudo. José não quis pecar contra Deus nem trair a confiança do seu senhor.' },
    { t: 'Promete pensar no assunto amanhã.', why: 'Adiar a tentação é brincar com ela. A Bíblia diz: fugi da tentação!' },
    { t: 'Conta uma mentira para ganhar tempo.', why: 'José era fiel e verdadeiro, mesmo quando isso lhe custou caro.' },
  ],
);

// ------------------------------------------------------------------ 4. prison

/** Deduction hunt: find the hidden clues; empty stones show how many clues touch them. */
export function Clues({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('prison', [
    [XLOOKS.copeiro, 0.08, 'right'],
    [XLOOKS.padeiro, 0.92, 'left'],
  ]);
  const [R, C, K, extra] = byDiff(diff, [
    [4, 4, 2, 99],
    [4, 6, 3, 8],
    [5, 7, 4, 10],
  ]);
  const CLUES = ['🍇 Uma videira com três ramos', '🍷 O copo do Faraó', '🧺 Três cestos de pão', '🦅 Aves sobre o cesto'];
  const [hid] = useState(() => new Set(shuffle([...Array(R * C).keys()]).slice(0, K)));
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [lost, setLost] = useState(false);
  const [won, setWon] = useState(false);
  const found = [...open].filter((i) => hid.has(i)).length;
  const wasted = open.size - found;
  const budget = extra === 99 ? Infinity : extra + K;
  const count = (i: number) => {
    const r = Math.floor(i / C);
    const c = i % C;
    let n = 0;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) if ((dr || dc) && r + dr >= 0 && r + dr < R && c + dc >= 0 && c + dc < C && hid.has((r + dr) * C + c + dc)) n++;
    return n;
  };
  if (paused) return <Stage cv={cv} />;
  const tap = (i: number) => {
    if (open.has(i) || lost || won) return;
    const no = new Set(open).add(i);
    setOpen(no);
    if (hid.has(i)) {
      ok();
      if ([...no].filter((x) => hid.has(x)).length === K) {
        setWon(true);
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf(1 - (no.size - K) / (R * C - K))), 900);
      }
    } else {
      engine.drum('tom', 0, 0.4);
      if (no.size >= budget && [...no].filter((x) => hid.has(x)).length < K) setLost(true);
    }
  };
  return (
    <>
      <Stage cv={cv} />
      <Box narrow className="items-center">
        <Head left={`Pistas: ${found}/${K}`} right={budget === Infinity ? `Pedras viradas: ${open.size}` : `Pedras que pode virar: ${Math.max(0, budget - open.size)}`} />
        <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${C}, minmax(0, 2.8rem))`, gridTemplateRows: `repeat(${R}, minmax(0, 1fr))` }}>
          {[...Array(R * C).keys()].map((i) => {
            const o = open.has(i);
            const h = hid.has(i);
            return (
              <button
                key={i}
                onClick={() => tap(i)}
                className={cx(
                  'grid place-items-center rounded-sm border-[3px] text-lg',
                  o ? (h ? 'border-[#e8b830] bg-[#f0d080]' : 'border-[#3a3430] bg-[#2a2420]') : 'border-[#2a2420] bg-[#6a5e54]',
                )}
              >
                {o ? h ? CLUES[[...hid].indexOf(i) % CLUES.length].slice(0, 2) : <span className={cx(count(i) ? 'text-[#ffe08a]' : 'opacity-40')}>{count(i)}</span> : ''}
              </button>
            );
          })}
        </div>
        <span className="text-xs">
          Vire as pedras soltas. O número diz quantas pistas estão encostadas (inclusive na diagonal). {wasted > 0 && `Viradas sem pista: ${wasted}.`}
        </span>
        {found > 0 && (
          <span className="text-xs text-[#ffe08a]">
            Achadas:{' '}
            {[...hid]
              .filter((i) => open.has(i))
              .map((i) => CLUES[[...hid].indexOf(i) % CLUES.length])
              .join(' · ')}
          </span>
        )}
      </Box>
      {lost && (
        <Retry
          text="O carcereiro está voltando! Use os números: um 0 quer dizer que nenhuma pedra ao redor esconde pista."
          onRetry={() => {
            setOpen(new Set());
            setLost(false);
          }}
        />
      )}
    </>
  );
}

export const Interpret = makeMatch(
  'prison',
  [
    [XLOOKS.copeiro, 0.08, 'right'],
    [XLOOKS.joseServo, 0.5, 'down'],
    [XLOOKS.padeiro, 0.92, 'left'],
  ],
  'Interprete os sonhos: toque num símbolo e depois no significado',
  [
    ['🍇 Os três ramos da videira', 'Três dias'],
    ['🍷 Espremer as uvas no copo do Faraó', 'O copeiro voltará a servir o Faraó'],
    ['🧺 Os três cestos de pão', 'Três dias (para o padeiro)'],
    ['🦅 As aves comendo do cesto', 'O padeiro não será restaurado'],
  ],
  ['Três anos de colheita', 'O copeiro será promovido a general', 'O padeiro abrirá uma padaria', 'Três semanas de festa'],
);

// ------------------------------------------------------------------ 5. Pharaoh

export const PharaohDream = makeMatch(
  'throne',
  [
    [XLOOKS.farao, 0.12, 'right'],
    [XLOOKS.joseServo, 0.88, 'left'],
  ],
  'O sonho do Faraó: ligue cada símbolo ao seu sentido',
  [
    ['🐄 Sete vacas gordas', 'Sete anos de fartura'],
    ['🐂 Sete vacas magras', 'Sete anos de fome'],
    ['🌾 Sete espigas cheias', 'Fartura (o mesmo sonho repetido)'],
    ['🥀 Sete espigas mirradas', 'Fome (o mesmo sonho repetido)'],
    ['🔁 O sonho veio duas vezes', 'Deus vai fazer isso em breve'],
  ],
  ['Sete dias de chuva', 'Uma guerra contra os vizinhos', 'O rio Nilo vai secar para sempre'],
);

/** Plan the seven years of plenty: how much grain to store each year. */
export function Harvest({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('granary', [[XLOOKS.joseEgito, 0.5, 'down']]);
  const [eat, famine, room, spare] = byDiff(diff, [
    [3, 2, 4, 5],
    [3, 3, 2, 7],
    [4, 3, 0, 9],
  ]);
  const need = famine * 7;
  /** The granary holds a little more than the famine needs; extra grain would rot. */
  const cap = need + room;
  const plan = useMemo(() => {
    const extra = Array(7).fill(0);
    for (let k = 0; k < need + spare; k++) extra[rnd(7)]++;
    return extra.map((e) => eat + e);
  }, [eat, need, spare]);
  const [store, setStore] = useState<number[]>(() => Array(7).fill(0));
  const [sim, setSim] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const total = store.reduce((a, b) => a + b, 0);
  if (paused) return <Stage cv={cv} />;
  const set = (i: number, d: number) => {
    if (sim !== null) return;
    const v = Math.max(0, Math.min(plan[i] - eat, store[i] + d));
    if (store[i] + d > plan[i] - eat) {
      bad();
      setMsg(`No ano ${i + 1} o povo precisa comer ${eat} medidas. Não dá para guardar mais.`);
    } else tick();
    setStore(store.map((x, k) => (k === i ? v : x)));
  };
  const run = () => {
    setTries((t) => t + 1);
    if (total > cap) {
      bad();
      return setMsg(`O celeiro só comporta ${cap} medidas! Guardar ${total} faz o trigo estragar. Deixe o resto para o povo comer.`);
    }
    setSim(0);
    let left = total;
    let y = 0;
    const step = () => {
      y++;
      left -= famine;
      setSim(y);
      if (left < 0) {
        bad();
        setMsg(`Faltou trigo no ${y}º ano de fome! Guarde mais nos anos de fartura.`);
        window.setTimeout(() => setSim(null), 900);
        return;
      }
      engine.playNote(60 + y * 2, 'bell', 0, 0.2);
      if (y === 7) {
        engine.sfx('yay');
        buzz([40, 30, 80]);
        setMsg('O celeiro durou os sete anos de fome!');
        window.setTimeout(() => onWin(tries === 0 ? 3 : tries === 1 ? 2 : 1), 900);
        return;
      }
      window.setTimeout(step, 380);
    };
    window.setTimeout(step, 300);
  };
  const left = sim === null ? total : total - sim * famine;
  return (
    <>
      <Stage cv={cv} />
      <Box>
        <Head left={`Fome: ${famine} por ano × 7 = ${need} · celeiro comporta ${cap}`} right={`No celeiro: ${Math.max(0, left)}`} />
        <div className="grid flex-1 grid-cols-7 gap-1">
          {plan.map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded-sm border-2 border-[#5b3a1e] bg-[#f4e4c0] p-1 text-[#3a2414]">
              <span className="text-xs">Ano {i + 1}</span>
              <span className="text-sm">🌾 {h}</span>
              <button className="rpg-wood w-full text-sm" onClick={() => set(i, 1)} aria-label={`Guardar mais no ano ${i + 1}`}>
                +
              </button>
              <span className="text-lg">{store[i]}</span>
              <button className="rpg-wood w-full text-sm" onClick={() => set(i, -1)} aria-label={`Guardar menos no ano ${i + 1}`}>
                −
              </button>
              <span className="text-[10px]">come {h - store[i]}</span>
            </div>
          ))}
        </div>
        <div className="flex h-4 gap-0.5" aria-label="Anos de fome">
          {[...Array(7).keys()].map((k) => (
            <span key={k} className={cx('flex-1 rounded-sm', sim !== null && k < sim ? (total - (k + 1) * famine >= 0 ? 'bg-[#8af06a]' : 'bg-[#e84a3a]') : 'bg-[#5a4a3a]')} />
          ))}
        </div>
        <span className="flex items-center gap-2">
          <span className="flex-1 text-sm">{msg ?? `Cada ano o povo come pelo menos ${eat}. Guardado: ${total}/${need}.`}</span>
          <button disabled={sim !== null} className={cx('rpg-wood px-3 py-1 text-base', total >= need && 'animate-blink text-[#ffe08a]')} onClick={run}>
            Ver os anos de fome
          </button>
        </span>
      </Box>
    </>
  );
}

// ------------------------------------------------------------------ 6. governor: granaries

const REGIONS = ['Canaã', 'Midiã', 'Edom', 'Moabe', 'Síria', 'Gósen', 'Tebas', 'Mênfis', 'Líbia', 'Arábia'];

function makeGranary(diff: number) {
  const [G, N, slack] = byDiff(diff, [
    [2, 5, 4],
    [3, 7, 1],
    [3, 9, 0],
  ]);
  const reqs = shuffle(REGIONS)
    .slice(0, N)
    .map((r) => ({ region: r, amount: 2 + rnd(6) }));
  // Distribute requests among granaries to fix the stocks (solvable by construction).
  const stock = Array(G).fill(0);
  reqs.forEach((q, i) => (stock[i < G ? i : rnd(G)] += q.amount));
  return { reqs, stock: stock.map((s) => s + slack) };
}

export function Granary({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('granary', [[XLOOKS.joseEgito, 0.92, 'left']]);
  const [lv, setLv] = useState(() => makeGranary(diff));
  const [hist, setHist] = useState<number[]>([]);
  const [undos, setUndos] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const stock = lv.stock.map((s, g) => s - hist.reduce((a, gg, i) => a + (gg === g ? lv.reqs[i].amount : 0), 0));
  const cur = hist.length;
  const stuck = cur < lv.reqs.length && stock.every((s) => s < lv.reqs[cur].amount);
  if (paused) return <Stage cv={cv} />;
  const send = (g: number) => {
    if (won || cur >= lv.reqs.length) return;
    if (stock[g] < lv.reqs[cur].amount) {
      bad();
      return setMsg(`O celeiro ${g + 1} só tem ${stock[g]}. Escolha outro, ou desfaça e planeje.`);
    }
    engine.drum('tom', 0, 0.5);
    const h = [...hist, g];
    setHist(h);
    setMsg(null);
    if (h.length === lv.reqs.length) {
      setWon(true);
      engine.sfx('yay');
      buzz([40, 30, 80]);
      window.setTimeout(() => onWin(undos === 0 ? 3 : undos <= 2 ? 2 : 1), 700);
    }
  };
  return (
    <>
      <Stage cv={cv} />
      <Box>
        <Head left="Fila das caravanas (atenda na ordem)" right={`Desfeitos: ${undos}`} />
        <div className="flex flex-wrap gap-1">
          {lv.reqs.map((q, i) => (
            <span
              key={q.region}
              className={cx(
                'rounded-sm border-2 px-2 py-0.5 text-sm',
                i < cur
                  ? 'border-[#3a6a3a] bg-[#5a8a4a] opacity-60'
                  : i === cur
                    ? 'animate-blink border-[#e8b830] bg-[#f0d080] text-[#3a2414]'
                    : 'border-[#5b3a1e] bg-[#f4e4c0] text-[#3a2414]',
              )}
            >
              {q.region}: {q.amount} 🌾{i < cur && ` ← ${hist[i] + 1}`}
            </span>
          ))}
        </div>
        <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${lv.stock.length}, minmax(0, 1fr))` }}>
          {stock.map((s, g) => (
            <button
              key={g}
              onClick={() => send(g)}
              className={cx(
                'rpg-wood flex flex-col items-center justify-center gap-1 p-1',
                cur < lv.reqs.length && s >= lv.reqs[cur].amount && 'outline outline-2 outline-[#ffe08a]',
              )}
            >
              <span className="text-sm">Celeiro {g + 1}</span>
              <span className="text-2xl">🏺 {s}</span>
              <span className="h-2 w-full rounded-sm bg-[#3a2414]">
                <span className="block h-2 rounded-sm bg-[#e8b830]" style={{ width: `${(s / lv.stock[g]) * 100}%` }} />
              </span>
            </button>
          ))}
        </div>
        <span className="flex items-center gap-2">
          <span className="flex-1 text-sm">
            {stuck ? 'Nenhum celeiro consegue atender este pedido. Desfaça e tente outra distribuição!' : (msg ?? 'Toque no celeiro que vai atender o pedido em destaque.')}
          </span>
          <button
            className={cx('rpg-wood px-3 py-1 text-sm', stuck && 'animate-blink text-[#ffe08a]')}
            onClick={() => {
              if (!hist.length) return;
              setHist(hist.slice(0, -1));
              setUndos((u) => u + 1);
            }}
          >
            Desfazer
          </button>
          <button
            className="rpg-wood px-3 py-1 text-sm"
            onClick={() => {
              setHist([]);
              setUndos((u) => u + 1);
              setLv({ ...lv });
            }}
          >
            Recomeçar
          </button>
        </span>
      </Box>
    </>
  );
}

// ------------------------------------------------------------------ 7. reunion

const BROTHERS = ['Rúben', 'Simeão', 'Levi', 'Judá', 'Dã', 'Naftali', 'Gade', 'Aser', 'Issacar', 'Zebulom', 'Benjamim'];

export function Seats({ paused, onWin, diff = 1 }: GameProps) {
  const cv = useScene('hall', [[XLOOKS.joseEgito, 0.5, 'down']]);
  const n = byDiff(diff, [4, 6, 8]);
  const [answer] = useState(() => {
    const idx = shuffle([...Array(BROTHERS.length - 1).keys()])
      .slice(0, n - 1)
      .sort((a, b) => a - b);
    return [...idx.map((i) => BROTHERS[i]), 'Benjamim'];
  });
  const clues = useMemo(() => {
    const c = answer.slice(0, -1).map((b, i) => (diff === 2 && i % 2 ? `${answer[i + 1]} é o próximo depois de ${b}.` : `${b} nasceu logo antes de ${answer[i + 1]}.`));
    return shuffle([...c, 'Benjamim é o caçula: senta no último lugar.']);
  }, [answer, diff]);
  const [order, setOrder] = useState(() => {
    let o = shuffle(answer);
    while (o.every((b, i) => b === answer[i])) o = shuffle(answer);
    return o;
  });
  const [sel, setSel] = useState<number | null>(null);
  const [checks, setChecks] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  if (paused) return <Stage cv={cv} />;
  const tap = (i: number) => {
    if (won) return;
    if (sel === null) return setSel(i);
    const o = [...order];
    [o[sel], o[i]] = [o[i], o[sel]];
    setOrder(o);
    setSel(null);
    tick();
  };
  const check = () => {
    const right = order.filter((b, i) => b === answer[i]).length;
    setChecks((c) => c + 1);
    if (right === n) {
      setWon(true);
      engine.sfx('yay');
      buzz([40, 30, 80]);
      setHint('Os irmãos se olham espantados: como esse egípcio sabia a ordem?');
      window.setTimeout(() => onWin(checks === 0 ? 3 : checks <= 2 ? 2 : 1), 1400);
    } else {
      bad();
      setHint(`${right} de ${n} estão no lugar certo.`);
    }
  };
  return (
    <>
      <Stage cv={cv} />
      <Box>
        <Head left="Pistas" right={`Conferências: ${checks}`} />
        <ul className="grid gap-x-3 text-xs sm:grid-cols-2">
          {clues.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {order.map((b, i) => (
            <button
              key={i}
              onClick={() => tap(i)}
              className={cx('rpg-wood flex flex-col items-center justify-center p-1 text-xs sm:text-sm', sel === i && 'outline outline-2 outline-[#ffe08a] brightness-110')}
            >
              <span className="opacity-70">{i + 1}º</span>
              {b}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-2">
          <span className="flex-1 text-sm">{hint ?? 'Toque em dois lugares para trocar. 1º = o mais velho.'}</span>
          <button disabled={won} className="rpg-wood px-3 py-1 text-base" onClick={check}>
            Conferir
          </button>
        </span>
      </Box>
    </>
  );
}

export const Reveal = makeChoice(
  'hall',
  [
    [XLOOKS.juda, 0.3, 'right'],
    [XLOOKS.benjamim, 0.4, 'right'],
    [XLOOKS.joseEgito, 0.7, 'left'],
  ],
  'Judá se ofereceu como escravo no lugar de Benjamim. Os irmãos mudaram. O que José diz?',
  [
    { t: '“Eu sou José, vosso irmão. Deus me enviou adiante de vós.”', ok: true },
    { t: '“Agora todos vocês serão meus escravos, como me venderam!”', why: 'José podia se vingar, mas escolheu perdoar. O perdão quebra o ciclo do mal.' },
    { t: '“Levem o trigo e nunca mais voltem.”', why: 'José amava a família. Esconder-se para sempre não traria a reconciliação.' },
    { t: 'Ficar calado e deixar Benjamim como escravo.', why: 'Os irmãos já tinham provado o arrependimento. Era a hora de se revelar.' },
  ],
);
