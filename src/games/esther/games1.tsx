/**
 * Esther, chapters 1-5: the market of Susa (hidden objects), the torn letter
 * (fragments by their torn edges), the garden path (memory), Hegai's shelves
 * (logic), the royal seals (sequence memory), the two doorkeepers (deduction),
 * the cipher of the decree, the seals of the letters (forgery), Hatach's route
 * (turn-based stealth plan) and Esther's answer to Mordecai (conversation).
 * Every puzzle is generated per difficulty and solvable by construction.
 */
import { useEffect, useRef, useState } from 'react';
import { cx } from '../../ui/kit';
import { engine } from '../../audio/engine';
import { byDiff, useStage, type GameProps } from '../pixel/stage';
import { drawBackdrop } from '../platform/sky';
import { CAST, frame, poseFor, renderPose, type CharSpec } from '../platform/rig';
import { drawActors, useEstherScene } from './scene';
import { bad, Box, dev, Head, makeConversation, ok, Placement, placementClues, rnd, shuffle, starsByMiss, tick, toLogical, win } from './kit';

// ------------------------------------------------------------------ pixel icons

export type Icon = 'figo' | 'cantaro' | 'rolo' | 'tamara' | 'lamparina' | 'veu' | 'anel' | 'pao' | 'roma' | 'peixe' | 'sandalia' | 'cesto' | 'especiaria' | 'taca';
export const ICON_NAME: Record<Icon, string> = {
  figo: 'Figos',
  cantaro: 'Cântaro',
  rolo: 'Rolo de escrita',
  tamara: 'Tâmaras',
  lamparina: 'Lamparina',
  veu: 'Véu azul',
  anel: 'Anel',
  pao: 'Pão',
  roma: 'Romã',
  peixe: 'Peixe seco',
  sandalia: 'Sandálias',
  cesto: 'Cesto',
  especiaria: 'Saco de especiarias',
  taca: 'Taça de prata',
};

/** Small pixel icon centred at (x, y), about 10 px. */
export function drawIcon(ctx: CanvasRenderingContext2D, k: Icon, x: number, y: number) {
  const r = (a: number, b: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h);
  };
  const o = '#2a1a10';
  switch (k) {
    case 'figo':
      for (const [a, b] of [[-4, 0], [0, -2], [2, 1]]) {
        r(a - 1, b - 1, 5, 5, o);
        r(a, b, 3, 3, '#7a3a6a');
        r(a + 1, b - 2, 1, 1, '#4a8a3a');
      }
      break;
    case 'cantaro':
      r(-3, -5, 6, 1, o);
      r(-4, -4, 8, 9, o);
      r(-3, -4, 6, 8, '#c8783a');
      r(-3, -4, 2, 8, '#e09858');
      r(3, -3, 2, 3, o);
      break;
    case 'rolo':
      r(-5, -3, 10, 6, o);
      r(-4, -2, 8, 4, '#f0e4c0');
      r(-5, -4, 2, 8, '#a87a3a');
      r(3, -4, 2, 8, '#a87a3a');
      r(-2, -1, 4, 1, '#8a6a4a');
      break;
    case 'tamara':
      for (let i = 0; i < 4; i++) {
        r(-4 + i * 2, -1 + (i % 2) * 2, 3, 4, o);
        r(-4 + i * 2, -1 + (i % 2) * 2, 2, 3, '#8a4a1e');
      }
      r(-1, -4, 1, 3, '#5a8a3a');
      break;
    case 'lamparina':
      r(-5, 0, 10, 4, o);
      r(-4, 0, 8, 3, '#c8983a');
      r(3, -1, 2, 2, o);
      r(3, -4, 2, 3, '#ff8a2a');
      r(4, -3, 1, 1, '#ffe066');
      break;
    case 'veu':
      r(-5, -4, 10, 9, o);
      r(-4, -3, 8, 7, '#3a6ad8');
      r(-4, -3, 8, 1, '#8ab0f0');
      r(-2, 0, 1, 4, '#2a4a9a');
      r(1, -1, 1, 5, '#2a4a9a');
      break;
    case 'anel':
      r(-3, -3, 6, 6, '#e8b830');
      r(-2, -2, 4, 4, 'rgba(0,0,0,0)');
      ctx.clearRect(Math.round(x - 1), Math.round(y - 1), 2, 2);
      r(-1, -5, 2, 2, '#c83030');
      break;
    case 'pao':
      r(-5, -2, 10, 5, o);
      r(-4, -2, 8, 4, '#d8a050');
      r(-3, -1, 1, 1, '#f0d090');
      r(0, -1, 1, 1, '#f0d090');
      r(3, -1, 1, 1, '#f0d090');
      break;
    case 'roma':
      r(-4, -3, 8, 7, o);
      r(-3, -3, 6, 6, '#c8302a');
      r(-2, -2, 2, 2, '#f07060');
      r(-1, -5, 2, 2, '#8a2a1a');
      break;
    case 'peixe':
      r(-5, -2, 8, 4, o);
      r(-4, -1, 7, 2, '#a8a8b8');
      r(3, -2, 2, 4, '#8a8a98');
      r(-3, -1, 1, 1, o);
      break;
    case 'sandalia':
      r(-5, 0, 10, 3, o);
      r(-4, 1, 8, 1, '#a86a3a');
      r(-2, -2, 1, 3, '#6a4424');
      r(1, -2, 1, 3, '#6a4424');
      break;
    case 'cesto':
      r(-5, -2, 10, 6, o);
      r(-4, -1, 8, 4, '#c8a050');
      for (let i = -4; i < 4; i += 2) r(i, -1, 1, 4, '#a87a30');
      r(-3, -5, 6, 1, '#a87a30');
      break;
    case 'especiaria':
      r(-4, -3, 8, 8, o);
      r(-3, -2, 6, 6, '#c89a5a');
      r(-3, -4, 6, 2, '#e8603a');
      r(-1, -3, 2, 1, '#ffa040');
      break;
    case 'taca':
      r(-4, -4, 8, 4, o);
      r(-3, -4, 6, 3, '#d8d8e8');
      r(-1, 0, 2, 3, '#b8b8c8');
      r(-3, 3, 6, 1, '#b8b8c8');
      break;
  }
}

// ------------------------------------------------------------------ 1A. market of Susa (hidden objects)

const ICONS = Object.keys(ICON_NAME) as Icon[];

export function Market({ paused, onWin, diff = 1 }: GameProps) {
  const nT = byDiff(diff, [4, 6, 8]);
  const total = byDiff(diff, [18, 26, 34]);
  const [setup] = useState(() => {
    const types = shuffle(ICONS);
    const targets = types.slice(0, nT);
    const decoyTypes = types.slice(nT);
    // Slots on three stall shelves, spread across the view.
    const slots: [number, number][] = [];
    for (const y of [92, 118, 144]) for (let k = 0; k < 14; k++) slots.push([0.06 + k * 0.067 + (y === 118 ? 0.03 : 0), y]);
    const spots = shuffle(slots).slice(0, total);
    const things = spots.map(([x, y], i) => ({ x, y, k: i < nT ? targets[i] : decoyTypes[rnd(decoyTypes.length)] }));
    return { targets, things };
  });
  dev('market', setup);
  const [found, setFound] = useState<Icon[]>([]);
  const [miss, setMiss] = useState(0);
  const [flash, setFlash] = useState<{ x: number; y: number; good: boolean; t: number } | null>(null);
  const done = found.length === nT;
  const cv = useStage((ctx, w, _dt, t) => {
    drawBackdrop(ctx, w, 180, 'persia', 'dawn', t, 200);
    // Stalls with awnings.
    for (let s = 0; s < 4; s++) {
      const x0 = (s / 4) * w;
      const sw = w / 4;
      ctx.fillStyle = ['#c83a2a', '#2a6ab0', '#e8b830', '#3a8a5a'][s];
      ctx.fillRect(x0 + 2, 64, sw - 4, 10);
      for (let k = 0; k < sw - 4; k += 8) {
        ctx.fillStyle = '#f4ecd8';
        ctx.fillRect(x0 + 2 + k, 64, 4, 10);
      }
      ctx.fillStyle = '#6a4424';
      ctx.fillRect(x0 + 3, 74, 3, 90);
      ctx.fillRect(x0 + sw - 6, 74, 3, 90);
    }
    for (const y of [98, 124, 150]) {
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(0, y, w, 4);
      ctx.fillStyle = '#8a5a30';
      ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = '#a88a5a';
    ctx.fillRect(0, 164, w, 16);
    for (const th of setup.things) if (!found.includes(th.k) || !setup.targets.includes(th.k)) drawIcon(ctx, th.k, th.x * w, th.y);
    drawActors(ctx, w, [{ id: 'ester', x: 0.06, anim: 'think' }], t, 176);
    const age = performance.now() / 1000 - (flash?.t ?? 0);
    if (flash && age < 0.6) {
      ctx.strokeStyle = flash.good ? '#7af0a0' : '#ff5a4a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(flash.x, flash.y, 8 + age * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || done) return;
    const [x, y] = toLogical(e.currentTarget, e);
    const w = e.currentTarget.width;
    const hit = setup.things.find((th) => Math.abs(th.x * w - x) < 9 && Math.abs(th.y - y) < 9);
    const tt = performance.now() / 1000;
    if (hit && setup.targets.includes(hit.k) && !found.includes(hit.k)) {
      ok();
      const nf = [...found, hit.k];
      setFound(nf);
      setFlash({ x: hit.x * w, y: hit.y, good: true, t: tt });
      if (nf.length === nT) {
        win();
        window.setTimeout(() => onWin(starsByMiss(miss, 2)), 700);
      }
    } else {
      bad();
      setMiss((m) => m + 1);
      setFlash({ x, y, good: false, t: tt });
    }
  };
  return (
    <>
      <canvas ref={cv} onPointerDown={tap} className="pixelated absolute inset-0 h-full w-full touch-none" aria-label="Mercado de Susã" />
      {!paused && (
        <div className="rpg-frame rpg-text pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-14 top-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 py-1 text-xs sm:text-sm">
          <span className="text-[#ffe08a]">Lista de Mordecai:</span>
          {setup.targets.map((k) => (
            <span key={k} className={cx(found.includes(k) && 'line-through opacity-50')}>
              {ICON_NAME[k]}
            </span>
          ))}
          <span className="ml-auto text-[#ffb0a0]">Erros: {miss}</span>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 1B. the torn letter

const LETTERS = [
  ['Paz a ti,', 'vizinho Simei.', 'Envio figos', 'e tâmaras', 'para a tua mesa.', 'Que o Deus', 'de Israel', 'guarde a tua casa.'],
  ['Shalom,', 'amigo Natã.', 'Hadassa leva', 'este bilhete', 'e um cântaro', 'de azeite.', 'O Senhor', 'te abençoe.'],
];

export function TornLetter({ paused, onWin, diff = 1 }: GameProps) {
  const n = byDiff(diff, [4, 6, 8]);
  const cvs = useEstherScene('persia', 'day', [
    { id: 'ester', x: 0.12, anim: 'read' },
    { id: 'aldeao', x: 0.9, left: true },
  ]);
  const [{ words, tears, start }] = useState(() => {
    const src = LETTERS[rnd(LETTERS.length)];
    // Merge words into n fragments.
    const per = src.length / n;
    const words = Array.from({ length: n }, (_, i) => src.slice(Math.round(i * per), Math.round((i + 1) * per)).join(' '));
    const tears = Array.from({ length: n - 1 }, () => Array.from({ length: 6 }, () => 2 + rnd(9)));
    let start = shuffle([...words.keys()]);
    while (start.every((v, i) => v === i)) start = shuffle([...words.keys()]);
    return { words, tears, start };
  });
  const [order, setOrder] = useState(start);
  dev('torn', { order });
  const [sel, setSel] = useState<number | null>(null);
  const [checks, setChecks] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const clip = (piece: number) => {
    const L = piece > 0 ? tears[piece - 1] : null;
    const R = piece < n - 1 ? tears[piece] : null;
    const pts: string[] = [];
    // Top-left to top-right, down the right edge, bottom, up the left edge.
    pts.push(`${L ? L[0] : 0}% 0%`);
    pts.push(`${R ? 100 - 12 + R[0] : 100}% 0%`);
    if (R) R.forEach((d, k) => pts.push(`${100 - 12 + d}% ${((k + 0.5) / 6) * 100}%`));
    pts.push(`${R ? 100 - 12 + R[5] : 100}% 100%`);
    pts.push(`${L ? L[5] : 0}% 100%`);
    if (L) [...L].reverse().forEach((d, k) => pts.push(`${d}% ${((5 - k + 0.5) / 6) * 100}%`));
    return `polygon(${pts.join(',')})`;
  };
  const tap = (i: number) => {
    if (won) return;
    if (sel === null) return setSel(i), tick();
    const o = [...order];
    [o[sel], o[i]] = [o[i], o[sel]];
    setOrder(o);
    setSel(null);
    tick();
  };
  const check = () => {
    const right = order.filter((v, i) => v === i).length;
    setChecks((c) => c + 1);
    if (right === n) {
      setWon(true);
      win();
      setMsg(`“${words.join(' ')}”`);
      window.setTimeout(() => onWin(checks === 0 ? 3 : checks <= 2 ? 2 : 1), 1600);
    } else {
      bad();
      setMsg(`${right} de ${n} pedaços estão no lugar. Olhe as bordas rasgadas!`);
    }
  };
  const cols = n > 4 ? Math.ceil(n / 2) : n;
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box narrow>
          <Head left="O bilhete rasgado" right={`Conferências: ${checks}`} />
          <div className="grid min-h-0 flex-1 gap-y-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {order.map((piece, i) => (
              <button
                key={i}
                onClick={() => tap(i)}
                className={cx('relative min-h-0 -mx-[2px] text-[#3a2414] transition', sel === i && '-translate-y-1 drop-shadow-[0_0_4px_#ffe08a]')}
                aria-label={`Pedaço ${i + 1}: ${words[piece]}`}
              >
                <span
                  className="flex h-full items-center justify-center bg-[#f4e8c8] px-3 text-center text-sm leading-tight short:text-xs"
                  style={{ clipPath: clip(piece), backgroundImage: 'repeating-linear-gradient(0deg,#0000 0 9px,#c8b08a55 9px 10px)' }}
                >
                  {words[piece]}
                </span>
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2">
            <span className="flex-1 text-xs leading-tight sm:text-sm">{msg ?? 'O primeiro pedaço tem a borda esquerda reta; o último, a direita.'}</span>
            <button disabled={won} className="rpg-wood px-3 py-1 text-sm" onClick={check}>
              Conferir
            </button>
          </span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 2A. the garden path (memory)

function makePath(R: number, C: number, minLen: number) {
  for (;;) {
    const start: [number, number] = [R - 1, 0];
    const goal: [number, number] = [0, C - 1];
    const path: [number, number][] = [start];
    const seen = new Set([start.join()]);
    let [r, c] = start;
    let guard = 0;
    while ((r !== goal[0] || c !== goal[1]) && guard++ < 200) {
      const opts = ([[-1, 0], [0, 1], [1, 0], [0, -1]] as const)
        .map(([dr, dc]) => [r + dr, c + dc] as [number, number])
        .filter(([a, b]) => a >= 0 && b >= 0 && a < R && b < C && !seen.has(`${a},${b}`))
        // Avoid touching the path (keeps it a clean corridor).
        .filter(([a, b]) => path.slice(0, -1).every(([pr, pc]) => Math.abs(pr - a) + Math.abs(pc - b) > 1));
      if (!opts.length) break;
      const toward = opts.filter(([a, b]) => a < r || b > c);
      const pick = Math.random() < 0.6 && toward.length ? toward[rnd(toward.length)] : opts[rnd(opts.length)];
      [r, c] = pick;
      path.push(pick);
      seen.add(pick.join());
    }
    if (r === goal[0] && c === goal[1] && path.length >= minLen) return path;
  }
}

export function GardenPath({ paused, onWin, diff = 1 }: GameProps) {
  const [R, C] = byDiff(diff, [
    [4, 5],
    [5, 6],
    [5, 7],
  ] as [[number, number], [number, number], [number, number]]);
  const [path] = useState(() => makePath(R, C, byDiff(diff, [7, 10, 13])));
  const cvs = useEstherScene('garden', 'day', [{ id: 'serva', x: 0.08 }]);
  const [show, setShow] = useState(-1);
  const [step, setStep] = useState(1);
  dev('garden', { path, C, showing: show >= 0 });
  const [replays, setReplays] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const timer = useRef(0);
  const play = () => {
    window.clearInterval(timer.current);
    setStep(1);
    setShow(0);
    let k = 0;
    timer.current = window.setInterval(() => {
      k++;
      if (k <= path.length) {
        setShow(k);
        engine.playNote(60 + (k % 8) * 2, 'pluck', 0, 0.15);
      } else {
        window.clearInterval(timer.current);
        window.setTimeout(() => setShow(-1), byDiff(diff, [900, 500, 250]));
      }
    }, byDiff(diff, [420, 340, 280]));
  };
  useEffect(() => {
    if (!paused) play();
    return () => window.clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  const idx = (r: number, c: number) => path.findIndex(([a, b]) => a === r && b === c);
  const tap = (r: number, c: number) => {
    if (won || show >= 0) return;
    const [pr, pc] = path[step - 1];
    if (Math.abs(pr - r) + Math.abs(pc - c) !== 1) return setMsg('Ande uma casa de cada vez, a partir de onde está.');
    if (idx(r, c) === step) {
      tick();
      const ns = step + 1;
      setStep(ns);
      setMsg(null);
      if (ns === path.length) {
        setWon(true);
        win();
        setMsg('Você chegou ao pavilhão!');
        window.setTimeout(() => onWin(replays === 0 ? 3 : replays <= 2 ? 2 : 1), 900);
      }
    } else {
      bad();
      setReplays((x) => x + 1);
      setMsg('Esse não é o caminho! A serva mostra de novo.');
      window.setTimeout(play, 700);
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box narrow>
          <Head left={show >= 0 ? 'Observe o caminho...' : 'Refaça o caminho'} right={`Repetições: ${replays}`} />
          <div className="mx-auto grid min-h-0 w-full max-w-md flex-1 gap-0.5" style={{ gridTemplateColumns: `repeat(${C}, minmax(0,1fr))`, gridTemplateRows: `repeat(${R}, minmax(0,1fr))` }}>
            {Array.from({ length: R * C }, (_, k) => {
              const r = Math.floor(k / C);
              const c = k % C;
              const i = idx(r, c);
              const lit = (show >= 0 && i >= 0 && i < show) || (i >= 0 && i < step);
              const start = r === R - 1 && c === 0;
              const goal = r === 0 && c === C - 1;
              return (
                <button
                  key={k}
                  onClick={() => tap(r, c)}
                  className={cx(
                    'grid min-h-0 place-items-center rounded-sm border text-xs',
                    lit ? 'border-[#a89a80] bg-[#e8dcc0]' : 'border-[#2e6a2a] bg-[#4a9a3a]',
                    !lit && (r + c) % 3 === 0 && 'bg-[#3e8a32]',
                  )}
                  aria-label={start ? 'Portão' : goal ? 'Pavilhão' : `Canteiro ${r + 1}, ${c + 1}`}
                >
                  {start ? '🚪' : goal ? '⛲' : !lit && (r * 7 + c * 3) % 5 === 0 ? '🌸' : ''}
                </button>
              );
            })}
          </div>
          <span className="text-xs leading-tight sm:text-sm">{msg ?? 'Toque nas casas vizinhas, uma por vez, do portão ao pavilhão.'}</span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 2B. Hegai's shelves (logic placement)

const PREP = [
  { name: 'Óleo de mirra', icon: '🫙' },
  { name: 'Perfume', icon: '🌺' },
  { name: 'Véu de linho', icon: '🧣' },
  { name: 'Colar de ouro', icon: '📿' },
  { name: 'Pente de marfim', icon: '🪮' },
];

export function Shelves({ paused, onWin, diff = 1 }: GameProps) {
  const n = byDiff(diff, [4, 5, 5]);
  const cvs = useEstherScene('susa', 'day', [{ id: 'hegai', x: 0.9, left: true }]);
  const [{ items, clues }] = useState(() => {
    const items = PREP.slice(0, n);
    for (;;) {
      const answer = shuffle([...items.keys()]);
      if (answer[0] > answer[1]) continue; // myrrh before perfume (Esther 2:12)
      const forced = [{ text: 'O óleo de mirra vem antes do perfume (primeiro os seis meses de mirra).', test: (p: number[]) => p[0] < p[1] }];
      const names = items.map((i) => (i.name === 'Perfume' ? 'o perfume' : `o ${i.name.toLowerCase()}`).replace('o véu', 'o véu').replace('o óleo', 'o óleo'));
      const res = placementClues(names.map((s) => s[0].toUpperCase() + s.slice(1)), 1, n, answer, forced, 0, { col: Array.from({ length: n }, (_, k) => `na prateleira ${k + 1}`) });
      if (res.unique && res.clues.length <= n + 1) return { items, clues: res.clues };
    }
  });
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="As prateleiras de Hegai" right={diff === 2 ? 'Sem dicas ao vivo' : ''} />
          <Placement title="Pistas de Hegai:" items={items} rows={1} cols={n} clues={clues} slotLabel={(s) => `Prateleira ${s + 1}`} live={diff < 2} onSolved={(c) => onWin(c === 0 ? 3 : c <= 2 ? 2 : 1)} />
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 3A. the royal seals (sequence memory)

const SEALS = [
  { sym: '🦁', name: 'Leão', c: '#c8902a', note: 60 },
  { sym: '🌙', name: 'Lua', c: '#3a5ab0', note: 64 },
  { sym: '☀️', name: 'Sol', c: '#e8b830', note: 67 },
  { sym: '🌿', name: 'Palma', c: '#3a8a5a', note: 72 },
  { sym: '⭐', name: 'Estrela', c: '#8a2a8a', note: 69 },
  { sym: '🏛️', name: 'Coluna', c: '#8a7458', note: 62 },
];

export function RoyalSeals({ paused, onWin, diff = 1 }: GameProps) {
  const nS = byDiff(diff, [4, 5, 6]);
  const [from, to] = byDiff(diff, [
    [3, 5],
    [4, 6],
    [5, 8],
  ] as [[number, number], [number, number], [number, number]]);
  const cvs = useEstherScene('susa', 'sunset', [
    { id: 'ester', x: 0.1, who: 'ester' },
    { id: 'hegai', x: 0.9, left: true, who: 'hegai' },
  ]);
  const [seq] = useState(() => Array.from({ length: to }, () => rnd(nS)));
  const [len, setLen] = useState(from);
  dev('seals', { seq, len, showing: () => showingRef.current });
  const showingRef = useRef(true);
  const [lit, setLit] = useState<number | null>(null);
  const [showing, setShowing] = useState(true);
  showingRef.current = showing;
  const [input, setInput] = useState<number[]>([]);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const timers = useRef<number[]>([]);
  const show = (L: number) => {
    timers.current.forEach(window.clearTimeout);
    setShowing(true);
    setInput([]);
    const gap = byDiff(diff, [700, 560, 460]);
    seq.slice(0, L).forEach((s, k) => {
      timers.current.push(
        window.setTimeout(() => {
          setLit(s);
          engine.playNote(SEALS[s].note, 'bell', 0, 0.3);
        }, 600 + k * gap),
      );
      timers.current.push(window.setTimeout(() => setLit(null), 600 + k * gap + gap * 0.6));
    });
    timers.current.push(window.setTimeout(() => setShowing(false), 600 + L * gap));
  };
  useEffect(() => {
    if (!paused) show(len);
    return () => timers.current.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);
  const press = (s: number) => {
    if (showing || won) return;
    engine.playNote(SEALS[s].note, 'bell', 0, 0.25);
    setLit(s);
    window.setTimeout(() => setLit(null), 180);
    const ni = [...input, s];
    if (seq[ni.length - 1] !== s) {
      bad();
      setMiss((m) => m + 1);
      setMsg('Ordem errada! Observe de novo.');
      window.setTimeout(() => show(len), 800);
      return;
    }
    setInput(ni);
    if (ni.length === len) {
      if (len === to) {
        setWon(true);
        win();
        setMsg('O cerimonial está perfeito!');
        window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 800);
      } else {
        ok();
        setMsg('Muito bem! A próxima sequência é maior.');
        setLen(len + 1);
        window.setTimeout(() => show(len + 1), 900);
      }
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box narrow>
          <Head left={showing ? 'Observe os selos...' : `Sua vez: ${input.length}/${len}`} right={`Rodada ${len - from + 1}/${to - from + 1} · erros ${miss}`} />
          <div className="mx-auto grid min-h-0 w-full max-w-md flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${Math.ceil(nS / 2)}, minmax(0,1fr))`, gridTemplateRows: 'repeat(2, minmax(0,1fr))' }}>
            {SEALS.slice(0, nS).map((s, k) => (
              <button
                key={s.name}
                onClick={() => press(k)}
                aria-label={`Selo ${s.name}`}
                className={cx('grid min-h-0 place-items-center rounded-full border-4 border-[#5b3a1e] text-3xl transition short:text-2xl', lit === k ? 'scale-110 brightness-150' : 'opacity-80')}
                style={{ background: `radial-gradient(circle, ${s.c}, #2a1a10)`, boxShadow: lit === k ? `0 0 16px ${s.c}` : undefined }}
              >
                {s.sym}
              </button>
            ))}
          </div>
          <span className="text-xs sm:text-sm">{msg ?? 'Repita a ordem em que os selos acenderam.'}</span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 3B. the two doorkeepers (deduction)

type Guard = { helmet: number; tunic: number; beard: boolean; shield: boolean; sash: boolean };
const HELMET = [
  ['#e0b030', 'capacete dourado'],
  ['#a8aab8', 'capacete de prata'],
  ['#3a5ab0', 'capacete azul'],
];
const TUNIC = [
  ['#2a5a9a', 'túnica azul'],
  ['#a83a2a', 'túnica vermelha'],
  ['#3a7a4a', 'túnica verde'],
];

function guardSpec(g: Guard): CharSpec {
  return {
    ...CAST.persa,
    tunic: TUNIC[g.tunic][0],
    headColor: HELMET[g.helmet][0],
    beard: g.beard ? 'short' : undefined,
    props: g.shield ? ['spear', 'shield'] : ['spear'],
    sash: g.sash ? '#e8d8b0' : undefined,
  };
}

function GuardPic({ g }: { g: Guard }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.putImageData(renderPose(guardSpec(g), poseFor('persa', 'idleFront', 0)), 0, 0);
  }, [g]);
  return <canvas ref={ref} width={36} height={44} className="pixelated h-full max-h-full w-auto" aria-hidden />;
}

const describe = (g: Guard, keys: (keyof Guard)[]) =>
  keys
    .map((k) =>
      k === 'helmet' ? `usava ${HELMET[g.helmet][1]}` : k === 'tunic' ? `vestia ${TUNIC[g.tunic][1]}` : k === 'beard' ? (g.beard ? 'tinha barba' : 'não tinha barba') : k === 'shield' ? (g.shield ? 'carregava escudo' : 'não tinha escudo') : g.sash ? 'usava faixa clara no peito' : 'não usava faixa',
    )
    .join(' e ');

export function Doorkeepers({ paused, onWin, diff = 1 }: GameProps) {
  const n = byDiff(diff, [6, 8, 10]);
  const cvs = useEstherScene('persia', 'sunset', [{ id: 'mordecai', x: 0.1, anim: 'think', who: 'mordecai' }]);
  const [{ guards, culprits, clues }] = useState(() => {
    for (;;) {
      const seen = new Set<string>();
      const guards: Guard[] = [];
      while (guards.length < n) {
        const g = { helmet: rnd(3), tunic: rnd(3), beard: Math.random() < 0.5, shield: Math.random() < 0.5, sash: Math.random() < 0.5 };
        const k = JSON.stringify(g);
        if (!seen.has(k)) seen.add(k), guards.push(g);
      }
      const culprits = shuffle([...guards.keys()]).slice(0, 2);
      const keys: (keyof Guard)[] = ['helmet', 'tunic', 'beard', 'shield', 'sash'];
      const clues: string[] = [];
      let okAll = true;
      for (const [k, name] of culprits.map((c, i) => [c, i ? 'Teres' : 'Bigtã'] as const)) {
        // Smallest set of facts that singles this guard out.
        let best: (keyof Guard)[] | null = null;
        for (let mask = 1; mask < 32; mask++) {
          const ks = keys.filter((_, b) => mask & (1 << b));
          if (best && ks.length >= best.length) continue;
          const same = guards.filter((g) => ks.every((q) => g[q] === guards[k][q]));
          if (same.length === 1) best = ks;
        }
        if (!best || best.length < byDiff(diff, [1, 2, 2])) {
          okAll = false;
          break;
        }
        clues.push(`${name} ${describe(guards[k], best)}.`);
      }
      if (okAll) return { guards, culprits, clues };
    }
  });
  dev('doors', { culprits });
  const [sel, setSel] = useState<number[]>([]);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const accuse = () => {
    if (sel.length !== 2) return setMsg('Escolha exatamente dois porteiros.');
    if (culprits.every((c) => sel.includes(c))) {
      setWon(true);
      win();
      setMsg('Eram eles! Mordecai conta tudo à rainha Ester.');
      window.setTimeout(() => onWin(miss === 0 ? 3 : miss === 1 ? 2 : 1), 1000);
    } else {
      bad();
      setMiss((m) => m + 1);
      const wrong = sel.filter((s) => !culprits.includes(s)).length;
      setMsg(wrong === 2 ? 'Nenhum dos dois combina com o que Mordecai ouviu.' : 'Um deles está certo, o outro não. Releia as pistas.');
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="O que Mordecai ouviu:" right={`Erros: ${miss}`} />
          <ul className="shrink-0 text-xs leading-snug sm:text-sm">
            {clues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
          <div className="grid min-h-0 flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${Math.ceil(n / (n > 6 ? 2 : 1))}, minmax(0,1fr))` }}>
            {guards.map((g, k) => (
              <button
                key={k}
                onClick={() => {
                  if (won) return;
                  tick();
                  setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : s.length < 2 ? [...s, k] : [s[1], k]));
                }}
                className={cx('flex min-h-0 flex-col items-center justify-end rounded-sm border-2 bg-[#f4e4c0]/70 p-0.5', sel.includes(k) ? 'border-[#c8321f] bg-[#ffd8c8]' : 'border-[#8a6a3a]')}
                aria-label={`Porteiro ${k + 1}`}
                aria-pressed={sel.includes(k)}
              >
                <GuardPic g={g} />
                <span className="text-[10px] text-[#3a2414]">{k + 1}</span>
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2">
            <span className="flex-1 text-xs leading-tight sm:text-sm">{msg ?? 'Toque nos dois porteiros suspeitos.'}</span>
            <button disabled={won} className="rpg-wood px-3 py-1 text-sm" onClick={accuse}>
              Denunciar
            </button>
          </span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 4A. the cipher of the decree

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const enc = (s: string, k: number) => s.replace(/[A-Z]/g, (ch) => ABC[(ABC.indexOf(ch) + k) % 26]);
const DECREE = ['DESTRUIR TODOS OS JUDEUS', 'NO DIA TREZE DO MES DE ADAR', 'E SAQUEAR OS SEUS BENS'];

export function Cipher({ paused, onWin, diff = 1 }: GameProps) {
  const lines = byDiff(diff, [[DECREE[1]], [DECREE[0], DECREE[1]], DECREE]);
  const cvs = useEstherScene('persia', 'day', [
    { id: 'mordecai', x: 0.08, anim: 'read', who: 'mordecai' },
    { id: 'hama', x: 0.92, left: true, who: 'hama' },
  ]);
  const [keys] = useState(() => lines.map(() => (diff === 0 ? CIPHER_EASY_KEY : 3 + rnd(20))));
  const sameKey = diff < 2;
  dev('cipher', { keys, sameKey });
  const [shift, setShift] = useState(() => lines.map(() => 0));
  const [miss, setMiss] = useState(0);
  const [stage, setStage] = useState<'decode' | 'ask' | 'done'>('decode');
  const [msg, setMsg] = useState<string | null>(null);
  const key = (i: number) => (sameKey ? keys[0] : keys[i]);
  const shown = (i: number) => enc(enc(lines[i], key(i)), (26 - shift[sameKey ? 0 : i]) % 26);
  const turn = (i: number, d: number) => {
    tick();
    setShift((s) => s.map((v, k) => (k === (sameKey ? 0 : i) ? (v + d + 26) % 26 : v)));
  };
  const decoded = lines.every((_, i) => shift[sameKey ? 0 : i] === key(i));
  const claim = () => {
    if (decoded) {
      ok();
      setStage('ask');
      setMsg(null);
    } else {
      bad();
      setMiss((m) => m + 1);
      setMsg('Ainda não dá para ler. Gire a roda até surgirem palavras.');
    }
  };
  const ASK = [
    { t: 'Adar, o 12º mês', ok: true },
    { t: 'Nisã, o 1º mês' },
    { t: 'Tebete, o 10º mês' },
    { t: 'Sivã, o 3º mês' },
  ];
  const [opts] = useState(() => shuffle(ASK));
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="A cópia do decreto" right={`Erros: ${miss}`} />
          {stage === 'decode' ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5 overflow-y-auto">
                {lines.map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {(!sameKey || i === 0) && (
                      <button className="rpg-wood h-9 w-9 shrink-0 text-lg" onClick={() => turn(i, -1)} aria-label="Girar para trás">
                        ⟲
                      </button>
                    )}
                    {sameKey && i > 0 && <span className="w-9 shrink-0" />}
                    <span className="flex min-w-0 flex-1 flex-wrap justify-center gap-[2px] rounded-sm bg-[#2a1a10] p-1 font-mono text-sm tracking-wider text-[#f4e4c0] short:text-xs">
                      {shown(i)
                        .split(' ')
                        .map((w, k) => (
                          <span key={k} className="px-0.5">
                            {w}
                          </span>
                        ))}
                    </span>
                    {(!sameKey || i === 0) ? (
                      <button className="rpg-wood h-9 w-9 shrink-0 text-lg" onClick={() => turn(i, 1)} aria-label="Girar para a frente">
                        ⟳
                      </button>
                    ) : (
                      <span className="w-9 shrink-0" />
                    )}
                  </div>
                ))}
                <p className="text-center text-xs opacity-80">
                  Roda: A → {ABC[shift[0]]}
                  {!sameKey && lines.length > 1 && ' (cada linha tem a sua roda)'}
                  {diff === 0 && ' · Dica: a chave tem algo a ver com o número de letras de “PUR”... vezes dois, mais um.'}
                </p>
              </div>
              <span className="flex items-center gap-2">
                <span className="flex-1 text-xs leading-tight sm:text-sm">{msg ?? 'Gire a roda: cada letra anda uma casa no alfabeto.'}</span>
                <button className="rpg-wood px-3 py-1 text-sm" onClick={claim}>
                  Decifrei
                </button>
              </span>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              <p className="rounded-sm bg-[#2a1a10] p-1.5 text-center font-mono text-sm text-[#9af06a]">{lines.join(' · ')}</p>
              <p className="text-sm">{msg ?? 'Segundo o decreto, em que mês seria o ataque?'}</p>
              <div className="grid grid-cols-2 gap-1">
                {opts.map((o) => (
                  <button
                    key={o.t}
                    disabled={stage === 'done'}
                    className="rpg-wood px-2 py-1 text-sm"
                    onClick={() => {
                      if (o.ok) {
                        setStage('done');
                        win();
                        setMsg('Adar: o mês tirado pela sorte, o Pur (Ester 3:7).');
                        window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 1300);
                      } else {
                        bad();
                        setMiss((m) => m + 1);
                        setMsg('Leia de novo a linha decifrada.');
                      }
                    }}
                  >
                    {o.t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Box>
      )}
    </>
  );
}
// Keep the hint truthful: on easy the key is always 3*2+1 = 7.
export const CIPHER_EASY_KEY = 7;

// ------------------------------------------------------------------ 4B. letters and seals (forgery)

type Seal = { shape: number; color: number; sym: number };
const SHAPES = ['circle', 'square', 'hex', 'drop'] as const;
const SCOL = ['#c8302a', '#2a5ab0', '#2a8a4a', '#c8902a'];
const SCOL_NAME = ['vermelho', 'azul', 'verde', 'dourado'];
const SSYM = ['✡', '🌴', '🦁', '⚘'];
const SENDERS = ['Mordecai', 'Anciãos de Susã', 'Hatá', 'Família de Jair', 'Mercador Natã'];

function SealIcon({ s, size = 28 }: { s: Seal; size?: number }) {
  const shape = SHAPES[s.shape];
  const fill = SCOL[s.color];
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden className="shrink-0">
      {shape === 'circle' && <circle cx="10" cy="10" r="9" fill={fill} stroke="#2a1a10" />}
      {shape === 'square' && <rect x="1.5" y="1.5" width="17" height="17" fill={fill} stroke="#2a1a10" />}
      {shape === 'hex' && <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" fill={fill} stroke="#2a1a10" />}
      {shape === 'drop' && <path d="M10 1 C16 8 18 12 10 19 C2 12 4 8 10 1Z" fill={fill} stroke="#2a1a10" />}
      <text x="10" y="14" fontSize="10" textAnchor="middle" fill="#fff">
        {SSYM[s.sym]}
      </text>
    </svg>
  );
}

export function Letters({ paused, onWin, diff = 1 }: GameProps) {
  const nS = byDiff(diff, [3, 4, 5]);
  const cvs = useEstherScene('susa', 'day', [{ id: 'hegai', x: 0.92, left: true }]);
  const [{ seals, letters, fake }] = useState(() => {
    const used = new Set<string>();
    const seals: Seal[] = [];
    while (seals.length < nS) {
      const s = { shape: rnd(4), color: rnd(4), sym: rnd(4) };
      // Seals of different senders differ in at least two details.
      if (seals.some((o) => +(o.shape !== s.shape) + +(o.color !== s.color) + +(o.sym !== s.sym) < 2)) continue;
      if (!used.has(JSON.stringify(s))) used.add(JSON.stringify(s)), seals.push(s);
    }
    const letters = shuffle(seals.map((s, i) => ({ from: i, seal: s })));
    // The forgery copies one sender's seal with one detail wrong.
    const victim = rnd(nS);
    const f = { ...seals[victim] };
    const which = rnd(3);
    if (which === 0) f.shape = (f.shape + 1 + rnd(3)) % 4;
    else if (which === 1) f.color = (f.color + 1 + rnd(3)) % 4;
    else f.sym = (f.sym + 1 + rnd(3)) % 4;
    const fakeIdx = rnd(letters.length + 1);
    letters.splice(fakeIdx, 0, { from: -1, seal: f });
    return { seals, letters, fake: fakeIdx };
  });
  dev('letters', { letters: letters.map((l) => l.from), fake });
  const [assign, setAssign] = useState<Record<number, number>>({});
  const [sel, setSel] = useState<number | null>(null);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const pickSender = (s: number) => {
    if (sel === null) return setMsg('Toque primeiro numa carta.');
    tick();
    setAssign((a) => ({ ...a, [sel]: s }));
    setSel(null);
  };
  const check = () => {
    if (Object.keys(assign).length < letters.length) return setMsg('Decida o remetente de todas as cartas (ou marque a falsa).');
    const wrong = letters.filter((l, i) => (i === fake ? assign[i] !== -1 : assign[i] !== l.from)).length;
    if (wrong === 0) {
      setWon(true);
      win();
      setMsg('Tudo certo! A carta falsa foi descoberta.');
      window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 1 ? 2 : 1), 1000);
    } else {
      bad();
      setMiss((m) => m + 1);
      setMsg(`${wrong} carta${wrong > 1 ? 's' : ''} com remetente errado. Compare forma, cor e símbolo.`);
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="Selos conhecidos" right={`Erros: ${miss}`} />
          <div className="flex shrink-0 flex-wrap gap-1">
            {seals.map((s, i) => (
              <button key={i} onClick={() => pickSender(i)} className="rpg-wood flex items-center gap-1 px-1.5 py-0.5 text-xs">
                <SealIcon s={s} size={22} />
                {SENDERS[i]}
              </button>
            ))}
            <button onClick={() => pickSender(-1)} className="flex items-center gap-1 rounded-sm border-2 border-[#c8321f] bg-[#ffd8c8] px-1.5 py-0.5 text-xs text-[#7a1a10]">
              ✖ Carta falsa
            </button>
          </div>
          <div className="grid min-h-0 flex-1 gap-1 overflow-y-auto" style={{ gridTemplateColumns: `repeat(${Math.min(letters.length, 3)}, minmax(0,1fr))` }}>
            {letters.map((l, i) => (
              <button
                key={i}
                onClick={() => (setSel(i), tick())}
                className={cx('flex items-center gap-1.5 rounded-sm border-2 bg-[#f4e8c8] p-1 text-left text-xs text-[#3a2414]', sel === i ? 'border-[#ffe08a] outline outline-2 outline-[#ffe08a]' : 'border-[#8a6a3a]')}
              >
                <SealIcon s={l.seal} />
                <span className="leading-tight">
                  Carta {i + 1}
                  <span className="block opacity-80">{assign[i] === undefined ? '— remetente?' : assign[i] === -1 ? '✖ falsa' : `de ${SENDERS[assign[i]]}`}</span>
                </span>
              </button>
            ))}
          </div>
          <span className="flex items-center gap-2">
            <span className="flex-1 text-xs leading-tight sm:text-sm">{msg ?? `Toque numa carta e depois no remetente (forma, cor e símbolo: ${SCOL_NAME.join(', ')}).`}</span>
            <button disabled={won} className="rpg-wood px-3 py-1 text-sm" onClick={check}>
              Conferir
            </button>
          </span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 5A. Hatach's route (turn-based stealth)

type Pt = [number, number];
interface Route {
  R: number;
  C: number;
  walls: Set<string>;
  guards: { path: Pt[] }[];
  budget: number;
}
const gPos = (g: { path: Pt[] }, t: number) => {
  const n = g.path.length;
  const per = 2 * (n - 1);
  const k = t % per;
  return g.path[k < n ? k : per - k];
};
const gDir = (g: { path: Pt[] }, t: number): Pt => {
  const a = gPos(g, t);
  const b = gPos(g, t + 1);
  return [Math.sign(b[0] - a[0]), Math.sign(b[1] - a[1])];
};
function seen(rt: Route, t: number, [r, c]: Pt, reach: number) {
  for (const g of rt.guards) {
    const [gr, gc] = gPos(g, t);
    if (gr === r && gc === c) return true;
    const [dr, dc] = gDir(g, t);
    for (let k = 1; k <= reach; k++) {
      const p = `${gr + dr * k},${gc + dc * k}`;
      if (rt.walls.has(p)) break;
      if (gr + dr * k === r && gc + dc * k === c) return true;
    }
  }
  return false;
}
function solveRoute(rt: Route, reach: number, start: Pt, goal: Pt, maxT: number) {
  let front = new Set([start.join()]);
  for (let t = 0; t < maxT; t++) {
    const next = new Set<string>();
    for (const s of front) {
      const [r, c] = s.split(',').map(Number);
      for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rt.R || nc >= rt.C || rt.walls.has(`${nr},${nc}`)) continue;
        if (seen(rt, t + 1, [nr, nc], reach)) continue;
        if (nr === goal[0] && nc === goal[1]) return t + 1;
        next.add(`${nr},${nc}`);
      }
    }
    front = next;
  }
  return -1;
}

/** Moves (dr, dc) of a safe route, for the automated test. */
function planRoute(rt: Route, reach: number, start: Pt, goal: Pt, maxT: number): Pt[] | null {
  let front = new Map<string, Pt[]>([[start.join(), []]]);
  for (let t = 0; t < maxT; t++) {
    const next = new Map<string, Pt[]>();
    for (const [s, moves] of front) {
      const [r, c] = s.split(',').map(Number);
      for (const [dr, dc] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as Pt[]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rt.R || nc >= rt.C || rt.walls.has(`${nr},${nc}`)) continue;
        if (seen(rt, t + 1, [nr, nc], reach)) continue;
        const mv = [...moves, [dr, dc] as Pt];
        if (nr === goal[0] && nc === goal[1]) return mv;
        if (!next.has(`${nr},${nc}`)) next.set(`${nr},${nc}`, mv);
      }
    }
    front = next;
  }
  return null;
}

export function HatachRoute({ paused, onWin, diff = 1 }: GameProps) {
  const [R, C, nG] = byDiff(diff, [
    [5, 7, 2],
    [6, 8, 3],
    [6, 9, 4],
  ] as [[number, number, number], [number, number, number], [number, number, number]]);
  const reach = byDiff(diff, [1, 2, 2]);
  const start: Pt = [R - 1, 0];
  const goal: Pt = [0, C - 1];
  const [rt] = useState(() => {
    for (;;) {
      const walls = new Set<string>();
      for (let k = 0; k < Math.round(R * C * 0.12); k++) {
        const r = rnd(R);
        const c = rnd(C);
        if ((r === start[0] && c === start[1]) || (r === goal[0] && c === goal[1])) continue;
        walls.add(`${r},${c}`);
      }
      const guards: { path: Pt[] }[] = [];
      for (let g = 0; g < nG; g++) {
        const horiz = Math.random() < 0.5;
        const len = 3 + rnd(3);
        const r0 = horiz ? 1 + rnd(R - 2) : rnd(R - len + 1);
        const c0 = horiz ? rnd(C - len + 1) : 1 + rnd(C - 2);
        const path: Pt[] = Array.from({ length: len }, (_, k) => (horiz ? [r0, c0 + k] : [r0 + k, c0]));
        if (path.some(([r, c]) => walls.has(`${r},${c}`))) continue;
        guards.push({ path });
      }
      if (guards.length < nG) continue;
      const rt: Route = { R, C, walls, guards, budget: 0 };
      if (seen(rt, 0, start, reach)) continue;
      const best = solveRoute(rt, reach, start, goal, 40);
      if (best < 0 || best < R + C - 2) continue;
      rt.budget = best + byDiff(diff, [6, 3, 1]);
      return rt;
    }
  });
  dev('route', { plan: () => planRoute(rt, reach, start, goal, rt.budget) });
  const [pos, setPos] = useState<Pt>(start);
  const [t, setT] = useState(0);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const caught = useRef(false);
  const cell = 20;
  const ox = (w: number) => Math.round((w - C * cell) / 2);
  const oy = Math.round((176 - R * cell) / 2) + 2;
  const view = useRef({ pos, t, won });
  view.current = { pos, t, won };
  const cv = useStage((ctx, w, _dt, time) => {
    const { pos, t } = view.current;
    drawBackdrop(ctx, w, 180, 'garden', 'sunset', time, 80);
    ctx.fillStyle = 'rgba(20,12,8,0.35)';
    ctx.fillRect(0, 0, w, 180);
    const X = ox(w);
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        const x = X + c * cell;
        const y = oy + r * cell;
        ctx.fillStyle = (r + c) % 2 ? '#d8ccb0' : '#c8bc9e';
        ctx.fillRect(x, y, cell - 1, cell - 1);
        if (rt.walls.has(`${r},${c}`)) {
          ctx.fillStyle = '#3a7a2e';
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, cell / 2 - 1, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5aa04a';
          ctx.fillRect(x + 5, y + 5, 4, 3);
        }
      }
    // Guard sight (next turn), then guards.
    for (const g of rt.guards) {
      const [gr, gc] = gPos(g, t);
      const [dr, dc] = gDir(g, t);
      ctx.fillStyle = 'rgba(255,80,60,0.32)';
      for (let k = 1; k <= reach; k++) {
        const r = gr + dr * k;
        const c = gc + dc * k;
        if (rt.walls.has(`${r},${c}`) || r < 0 || c < 0 || r >= R || c >= C) break;
        ctx.fillRect(X + c * cell, oy + r * cell, cell - 1, cell - 1);
      }
      ctx.drawImage(frame('persa', 'idle', Math.floor(time * 4) % 4, dc < 0), X + gc * cell - 4, oy + gr * cell - 12, 27, 33);
    }
    ctx.font = '12px serif';
    ctx.fillText('🏛', X + start[1] * cell + 3, oy + start[0] * cell + 14);
    ctx.fillText('🚪', X + goal[1] * cell + 3, oy + goal[0] * cell + 14);
    ctx.drawImage(frame('hegai', 'walk', Math.floor(time * 8) % 6), X + pos[1] * cell - 4, oy + pos[0] * cell - 12, 27, 33);
  });
  const move = (dr: number, dc: number) => {
    if (paused || won || caught.current) return;
    const nr = pos[0] + dr;
    const nc = pos[1] + dc;
    if (nr < 0 || nc < 0 || nr >= R || nc >= C || rt.walls.has(`${nr},${nc}`)) return bad();
    const nt = t + 1;
    tick();
    setPos([nr, nc]);
    setT(nt);
    if (seen(rt, nt, [nr, nc], reach)) {
      caught.current = true;
      bad();
      setMiss((m) => m + 1);
      setMsg('Um guarda viu Hatá! Ele volta ao começo.');
      window.setTimeout(() => {
        caught.current = false;
        setPos(start);
        setT(0);
      }, 900);
      return;
    }
    if (nr === goal[0] && nc === goal[1]) {
      setWon(true);
      win();
      setMsg('Hatá chegou a Mordecai com o recado!');
      window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 900);
      return;
    }
    if (nt >= rt.budget) {
      caught.current = true;
      bad();
      setMiss((m) => m + 1);
      setMsg('O tempo acabou: a porta da cidade fechou. Tente um caminho mais curto.');
      window.setTimeout(() => {
        caught.current = false;
        setPos(start);
        setT(0);
      }, 1100);
    }
  };
  const tapBoard = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = toLogical(e.currentTarget, e);
    const c = Math.floor((x - ox(e.currentTarget.width)) / cell);
    const r = Math.floor((y - oy) / cell);
    const dr = r - pos[0];
    const dc = c - pos[1];
    if (Math.abs(dr) + Math.abs(dc) === 1) move(dr, dc);
    else if (dr === 0 && dc === 0) move(0, 0);
  };
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      const m: Record<string, Pt> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], ' ': [0, 0] };
      if (m[e.key]) {
        e.preventDefault();
        move(...m[e.key]);
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  });
  const pad = 'rpg-wood grid h-11 w-11 place-items-center text-lg short:h-10 short:w-10';
  return (
    <>
      <canvas ref={cv} onPointerDown={tapBoard} className="pixelated absolute inset-0 h-full w-full touch-none" aria-label="Pátio do palácio" />
      {!paused && (
        <>
          <div className="rpg-frame rpg-text pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] top-2 px-2 py-1 text-xs sm:text-sm">
            Passos: {t}/{rt.budget} · pegos: {miss}
            <span className="block max-w-[14rem] text-[11px] leading-tight opacity-90">{msg ?? 'Vermelho = onde os guardas olham no próximo passo.'}</span>
          </div>
          <div className="absolute bottom-2 right-[max(0.5rem,env(safe-area-inset-right))] grid grid-cols-3 gap-1">
            <span />
            <button className={pad} onClick={() => move(-1, 0)} aria-label="Cima">
              ▲
            </button>
            <span />
            <button className={pad} onClick={() => move(0, -1)} aria-label="Esquerda">
              ◀
            </button>
            <button className={cx(pad, 'text-xs')} onClick={() => move(0, 0)} aria-label="Esperar">
              ⏳
            </button>
            <button className={pad} onClick={() => move(0, 1)} aria-label="Direita">
              ▶
            </button>
            <span />
            <button className={pad} onClick={() => move(1, 0)} aria-label="Baixo">
              ▼
            </button>
            <span />
          </div>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 5B. Esther's answer (conversation)

export const EstherAnswer = makeConversation(
  'garden',
  'sunset',
  [
    { id: 'esterRainha', x: 0.2, who: 'rainha' },
    { id: 'hegai', x: 0.78, left: true, who: 'hata' },
  ],
  [
    {
      who: 'hata',
      q: 'Mordecai pede que entres ao rei para suplicar pelo teu povo. O que respondes a ele?',
      opts: [
        {
          t: '“Todos sabem: quem entra ao rei sem ser chamado morre, a não ser que ele estenda o cetro de ouro. E eu não fui chamada há trinta dias.”',
          ok: true,
          reply: 'Hatá levou as palavras de Ester a Mordecai (Ester 4:11-12).',
        },
        { t: '“Eu sou a rainha: posso entrar quando quiser.”', why: 'A lei valia até para a rainha: entrar sem ser chamado podia custar a vida (Ester 4:11).' },
        { t: '“Isso não é problema meu. Estou segura no palácio.”', why: 'Ester amava o seu povo. Ela não respondeu com indiferença: explicou o risco que corria.' },
      ],
    },
    {
      who: 'mordecai',
      q: '“Se te calares agora, de outra parte virá socorro aos judeus... e quem sabe se para um tempo como este chegaste ao reino?” O que esta frase quer dizer?',
      opts: [
        { t: 'Que Deus pode ter colocado Ester no palácio exatamente para aquele momento.', ok: true, reply: 'Ester entendeu que tinha uma responsabilidade (Ester 4:14).' },
        { t: 'Que Ester deve fugir do palácio.', why: 'Mordecai não pediu fuga: pediu coragem para agir no lugar em que ela estava.' },
        { t: 'Que ninguém pode ajudar os judeus.', why: 'Ao contrário: Mordecai confiava que o socorro viria, de um jeito ou de outro.' },
      ],
    },
    {
      who: 'hata',
      q: 'Qual é a decisão da rainha?',
      opts: [
        { t: '“Jejuai por mim três dias. Eu e as minhas servas também. Depois irei ao rei; se perecer, pereci.”', ok: true, reply: 'Coragem com humildade: antes de agir, Ester buscou a Deus com o seu povo (Ester 4:16).' },
        { t: '“Vou hoje mesmo, sem me preparar.”', why: 'Ester preparou-se com jejum e oração antes do momento decisivo.' },
        { t: '“Vou pedir a Hamã que desista.”', why: 'Hamã era o autor do plano. Ester decidiu ir ao rei, que tinha autoridade.' },
      ],
    },
  ],
);

