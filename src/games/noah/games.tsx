/** Playable chapters of the story of Noah. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { drawPerson } from '../pixel/person';
import { burst, buzz, byDiff, starsOf, Panel, Retry as RetryBase, Stage, stepParts, useKeys, useStage, type GameProps, type Part } from '../pixel/stage';
import * as SC from '../david/scenes';
import { NLOOKS } from './content';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={NLOOKS.noe} />;
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** The ark: `built` 0..1 shows how many planks are on. */
function drawArk(ctx: CanvasRenderingContext2D, x: number, y: number, built = 1, pitch = 1, tilt = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(tilt);
  const W = 120;
  const rows = 7;
  // Ribs first.
  for (let k = -5; k <= 5; k++) rect(ctx, k * 11 - 1, -34, 2, 34, '#5a3a1e');
  for (let r = 0; r < rows; r++) {
    if (r / rows >= built) break;
    const yy = -4 - r * 5;
    const ww = W - (rows - r) * 3;
    rect(ctx, -ww / 2 - 1, yy - 1, ww + 2, 6, '#2a1a10');
    rect(ctx, -ww / 2, yy, ww, 4, pitch > 0.5 ? '#4a3220' : '#9a6a3a');
    rect(ctx, -ww / 2, yy, ww, 1, pitch > 0.5 ? '#6a4a30' : '#c08a4a');
  }
  if (built >= 1) {
    // House on the deck with a door and a window.
    rect(ctx, -38, -58, 76, 24, '#2a1a10');
    rect(ctx, -37, -57, 74, 22, pitch > 0.5 ? '#5a3e26' : '#a87a44');
    rect(ctx, -42, -62, 84, 6, '#3a2414');
    rect(ctx, 20, -48, 10, 13, '#1a0e08');
    rect(ctx, -16, -54, 20, 4, '#1a0e08');
  }
  ctx.restore();
}

// ================================================================ 1. Building the ark

export function BuildArk({ paused, onWin, diff = 1 }: GameProps) {
  const NEED = byDiff(diff, [5, 7, 9]);
  const HALF = byDiff(diff, [0.11, 0.085, 0.065]);
  const PITCH: [number, number] = byDiff(diff, [[0.55, 0.9], [0.62, 0.84], [0.68, 0.8]]);
  const misses = useRef(0);
  const [planks, setPlanks] = useState(0);
  const [phase, setPhase] = useState<'hammer' | 'quiz' | 'pitch' | 'done'>('hammer');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pitch, setPitch] = useState(0);
  const [, setF] = useState(0);
  const holding = useRef(false);
  const zone = useRef(0.5);
  const t0 = useRef(performance.now());
  const parts = useRef<Part[]>([]);
  const cv = useStage((ctx, w, dt, t) => {
    if (!paused && phase === 'pitch' && holding.current) setPitch((p) => Math.min(1.2, p + dt * 0.5));
    if (!paused && phase !== 'done') setF((f) => f + 1);
    SC.sky(ctx, w, ['#86c0e4', '#a2d0ea', '#bedcee', '#d8eaf0'], 90);
    SC.hills(ctx, w, 96, '#8aa868', 10, 0.04, 2);
    rect(ctx, 0, 120, w, 60, '#b89a62');
    for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, 122 + ((i * 29) % 56), 2, 1, '#a4864e');
    for (let k = 0; k < 5; k++) rect(ctx, 14 + k * 9, 160 - k * 3, 30, 4, '#8a5a30');
    drawArk(ctx, w * 0.55, 140, planks / NEED, phase === 'done' ? 1 : pitch > 0.6 ? 1 : 0);
    drawPerson(ctx, NLOOKS.noe, w * 0.22, 170, 'right', 0);
    drawPerson(ctx, NLOOKS.sem, w * 0.84, 168, 'left', Math.floor(t * 4) % 2);
    drawPerson(ctx, NLOOKS.vizinho, w * 0.95, 160, 'left', 0);
    parts.current = stepParts(parts.current, dt);
    SC.particlesDraw(ctx, parts.current);
  });
  const el = (performance.now() - t0.current) / 1000;
  const p = (el * (byDiff(diff, [0.7, 0.85, 1]) + planks * 0.12)) % 2;
  const pos = p < 1 ? p : 2 - p;
  const hit = () => {
    if (paused || phase !== 'hammer') return;
    const ok = Math.abs(pos - zone.current) < HALF;
    if (ok) {
      engine.drum('snare', 0, 0.9);
      buzz(20);
      const n = planks + 1;
      setPlanks(n);
      burst(parts.current, 180, 120, '#c08a4a', 8);
      setMsg({ text: ['Bem pregado!', 'Firme!', 'Isso!'][n % 3], ok: true });
      zone.current = 0.2 + Math.random() * 0.6;
      t0.current = performance.now() - Math.random() * 500;
      if (n >= NEED) window.setTimeout(() => setPhase('quiz'), 400);
    } else {
      engine.sfx('bonk');
      buzz([30, 30, 30]);
      misses.current += 1;
      // On hard a crooked nail costs a plank.
      if (diff === 2 && planks > 0) setPlanks(planks - 1);
      setMsg({ text: diff === 2 ? 'Prego torto! A tábua caiu...' : 'Prego torto! Na parte verde...', ok: false });
    }
  };
  const release = () => {
    if (!holding.current) return;
    holding.current = false;
    if (pitch >= PITCH[0] && pitch <= PITCH[1]) {
      setPhase('done');
      engine.sfx('yay');
      window.setTimeout(() => onWin(starsOf(1 - misses.current * 0.15)), 1000);
    } else {
      engine.sfx('bonk');
      misses.current += 1;
      setMsg({ text: pitch < PITCH[0] ? 'Pouco betume, ainda vaza!' : 'Betume demais, escorreu tudo!', ok: false });
      setPitch(0);
    }
  };
  useKeys(
    (k) => {
      if (k !== ' ' && k !== 'enter' && k !== 'z' && k !== 'e') return;
      if (phase === 'hammer') hit();
      else if (phase === 'pitch') ((holding.current = true), setPitch(0));
    },
    (k) => (k === ' ' || k === 'enter' || k === 'z' || k === 'e') && release(),
  );
  return (
    <>
      <Stage cv={cv} />
      {!paused && phase === 'hammer' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-xl flex-col gap-2">
          <Panel className="text-base">
            Tábuas: {planks}/{NEED}
            {msg && <span className={cx('ml-2', msg.ok ? 'text-[#b8f07a]' : 'text-[#ffb08a]')}>{msg.text}</span>}
          </Panel>
          <div className="relative h-8 border-[3px] border-[#3a2414] bg-[#c08a4a]">
            <div className="absolute inset-y-0 bg-[#6aaa3a]" style={{ left: `${(zone.current - HALF) * 100}%`, width: `${HALF * 200}%` }} />
            <div className="absolute -top-2 bottom-[-0.5rem] w-1.5 -translate-x-1/2 border border-[#3a2414] bg-white" style={{ left: `${pos * 100}%` }} />
          </div>
          <button onPointerDown={(e) => (e.preventDefault(), hit())} className="rpg-wood rpg-text h-14 touch-none text-2xl active:translate-y-0.5">
            Martelar!
          </button>
        </div>
      )}
      {!paused && phase === 'quiz' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-xl flex-col gap-1.5">
          <Panel className="text-base">{msg && !msg.ok ? msg.text : 'A estrutura está pronta. Mas qual era a medida que Deus mandou? (Preste atenção nas falas!)'}</Panel>
          {['300 × 50 × 30 côvados', '100 × 100 × 10 côvados', '500 × 30 × 50 côvados']
            .map((o, i) => ({ o, i, k: (i * 2 + 1) % 3 }))
            .sort((a, b) => a.k - b.k)
            .map(({ o, i }) => (
              <button
                key={o}
                onClick={() => {
                  if (i === 0) {
                    engine.playNote(76, 'bell', 0, 0.3);
                    setMsg(null);
                    setPhase('pitch');
                  } else {
                    engine.sfx('bonk');
                    misses.current += 2;
                    setMsg({ text: 'Não... a arca ficaria torta! Lembre: trezentos de comprido.', ok: false });
                  }
                }}
                className="rpg-wood rpg-text h-11 text-lg"
              >
                {o}
              </button>
            ))}
        </div>
      )}
      {!paused && phase === 'pitch' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-xl flex-col gap-2">
          <Panel className="text-base">{msg && !msg.ok ? msg.text : 'Segure para passar o betume. Solte na faixa escura.'}</Panel>
          <div className="relative h-6 border-[3px] border-[#3a2414] bg-[#4a4250]">
            <div className="absolute inset-y-0 bg-[#2a1a10]/70" style={{ left: `${PITCH[0] * 100}%`, width: `${(PITCH[1] - PITCH[0]) * 100}%` }} />
            <div className="h-full bg-[#6a4a30]" style={{ width: `${Math.min(100, pitch * 100)}%` }} />
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setMsg(null);
              setPitch(0);
              holding.current = true;
            }}
            onPointerUp={release}
            onPointerCancel={release}
            className="rpg-wood rpg-text h-14 touch-none text-xl"
          >
            Passar betume (segure)
          </button>
        </div>
      )}
    </>
  );
}

// ================================================================ 2. Two by two (memory)

type Animal = 'lion' | 'sheep' | 'elephant' | 'giraffe' | 'camel' | 'dove' | 'bear' | 'rabbit';
const ALL_ANIMALS: Animal[] = ['lion', 'sheep', 'elephant', 'giraffe', 'camel', 'dove', 'bear', 'rabbit'];
const ANIMAL_NAME: Record<Animal, string> = { lion: 'Leões', sheep: 'Ovelhas', elephant: 'Elefantes', giraffe: 'Girafas', camel: 'Camelos', dove: 'Pombas', bear: 'Ursos', rabbit: 'Coelhos' };

function drawAnimal(ctx: CanvasRenderingContext2D, a: Animal, x: number, y: number, step = 0) {
  if (a === 'lion') return SC.lion(ctx, x, y, step, false);
  if (a === 'bear') return SC.lion(ctx, x, y, step, false, false, true);
  if (a === 'rabbit') {
    SC.blob(ctx, x, y - 5, 6, 4, '#c8b8a8');
    SC.blob(ctx, x + 5, y - 8, 3.5, 3, '#c8b8a8');
    rect(ctx, x + 4, y - 16, 2, 6, '#b8a898');
    rect(ctx, x + 7, y - 15, 2, 6, '#b8a898');
    rect(ctx, x + 7, y - 9, 1, 1, '#1a1a1a');
    rect(ctx, x - 7, y - 7, 3, 3, '#f4f0e8');
    return;
  }
  if (a === 'sheep') return SC.sheep(ctx, x, y, step, false);
  if (a === 'elephant') {
    for (const lx of [-8, -3, 4, 9]) rect(ctx, x + lx - 1, y - 7, 4, 7 - (step % 2 && lx % 2 ? 1 : 0), '#6a6a72');
    SC.blob(ctx, x, y - 12, 13, 8, '#8a8a94');
    SC.blob(ctx, x + 12, y - 15, 6, 6, '#8a8a94');
    rect(ctx, x + 16, y - 14, 2, 10, '#7a7a84');
    rect(ctx, x + 9, y - 20, 4, 7, '#7a7a84');
    rect(ctx, x + 14, y - 17, 1, 1, '#1a1a1a');
    rect(ctx, x + 15, y - 11, 3, 1, '#f4f0e0');
    return;
  }
  if (a === 'giraffe') {
    for (const lx of [-5, -1, 3, 7]) rect(ctx, x + lx, y - 10, 2, 10, '#c8963a');
    SC.blob(ctx, x + 1, y - 13, 8, 5, '#e8b850');
    rect(ctx, x + 6, y - 34, 3, 22, '#e8b850');
    SC.blob(ctx, x + 9, y - 35, 4, 3, '#e8b850');
    for (let k = 0; k < 6; k++) rect(ctx, x - 4 + (k % 3) * 4, y - 15 + Math.floor(k / 3) * 3, 2, 2, '#9a6a24');
    rect(ctx, x + 10, y - 36, 1, 1, '#1a1a1a');
    rect(ctx, x + 6, y - 39, 1, 3, '#7a5a24');
    return;
  }
  if (a === 'camel') {
    for (const lx of [-7, -3, 4, 8]) rect(ctx, x + lx, y - 9, 2, 9, '#a87a44');
    SC.blob(ctx, x, y - 13, 10, 5, '#c89a5a');
    SC.blob(ctx, x - 3, y - 18, 4, 4, '#c89a5a');
    SC.blob(ctx, x + 4, y - 18, 4, 4, '#c89a5a');
    rect(ctx, x + 9, y - 22, 3, 10, '#c89a5a');
    SC.blob(ctx, x + 13, y - 22, 4, 2.5, '#c89a5a');
    rect(ctx, x + 14, y - 23, 1, 1, '#1a1a1a');
    return;
  }
  // Dove.
  SC.blob(ctx, x, y - 8, 6, 4, '#f4f4f8');
  SC.blob(ctx, x + 5, y - 11, 3, 3, '#f4f4f8');
  rect(ctx, x + 8, y - 11, 2, 1, '#e8a040');
  rect(ctx, x + 6, y - 12, 1, 1, '#1a1a1a');
  rect(ctx, x - 6, y - 10 - (step % 2) * 3, 6, 2, '#d8d8e0');
}

function AnimalIcon({ a }: { a: Animal }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 44, 44);
    drawAnimal(ctx, a, 20, a === 'giraffe' ? 42 : 34);
  }, [a]);
  return <canvas ref={ref} width={44} height={44} className="pixelated h-full max-h-full w-full min-h-0 object-contain" aria-label={ANIMAL_NAME[a]} />;
}

export function Pairs({ paused, onWin, diff = 1 }: GameProps) {
  const ANIMALS = useMemo(() => ALL_ANIMALS.slice(0, byDiff(diff, [6, 8, 8])), [diff]);
  const MISSES = byDiff(diff, [99, 14, 10]);
  const [run, setRun] = useState(0);
  const deck = useMemo(
    () => [...ANIMALS, ...ANIMALS].map((a, i) => ({ a, id: i })).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ANIMALS, run],
  );
  const [peek, setPeek] = useState(false);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Animal[]>([]);
  const [tries, setTries] = useState(0);
  const walking = useRef<{ a: Animal; t: number }[]>([]);
  const misses = tries - found.length;
  // A short look at all the cards when it starts (none on hard).
  useEffect(() => {
    if (paused) return;
    const ms = byDiff(diff, [2200, 1200, 0]);
    if (!ms) return;
    setPeek(true);
    const id = window.setTimeout(() => setPeek(false), ms);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, run]);
  const cv = useStage((ctx, w, dt, t) => {
    SC.sky(ctx, w, ['#8a9ab0', '#9aaabe', '#aabaca', '#bccad6'], 90);
    SC.hills(ctx, w, 100, '#7a9a58', 10, 0.04, 2);
    rect(ctx, 0, 124, w, 56, '#9a8a5a');
    drawArk(ctx, w * 0.75, 150, 1, 1);
    // Ramp and the animals walking up two by two.
    ctx.strokeStyle = '#5a3a1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.75 + 25, 102);
    ctx.lineTo(w * 0.45, 170);
    ctx.stroke();
    for (const wk of walking.current) {
      wk.t += dt * 0.35;
      const k = Math.min(1, wk.t);
      const x = w * 0.45 + (w * 0.3 + 25) * k;
      const y = 170 - 68 * k;
      if (k < 1) {
        drawAnimal(ctx, wk.a, x - 8, y, Math.floor(t * 6));
        drawAnimal(ctx, wk.a, x + 6, y - 3, Math.floor(t * 6) + 1);
      }
    }
    drawPerson(ctx, NLOOKS.noe, w * 0.36, 174, 'right', 0);
  });
  const flip = (i: number) => {
    if (paused || peek || open.length >= 2 || open.includes(i) || found.includes(deck[i].a) || misses >= MISSES) return;
    engine.playNote(72 + i, 'pluck', 0, 0.2);
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setTries((x) => x + 1);
      const [a, b] = next.map((k) => deck[k].a);
      window.setTimeout(() => {
        if (a === b) {
          engine.sfx('coin');
          buzz(25);
          walking.current.push({ a, t: 0 });
          const f = [...found, a];
          setFound(f);
          if (f.length === ANIMALS.length) {
            engine.sfx('yay');
            window.setTimeout(() => onWin(starsOf(1 - (tries + 1 - f.length) / (ANIMALS.length * 1.2))), 1600);
          }
        } else engine.sfx('bonk');
        setOpen([]);
      }, a === b ? 300 : 800);
    }
  };
  return (
    <>
      <Stage cv={cv} />
      {!paused && (
        <>
          <Panel className="pointer-events-none absolute left-14 top-2 text-base">
            Pares na arca: {found.length}/{ANIMALS.length} · erros: {misses}
            {MISSES < 99 && `/${MISSES}`}
          </Panel>
          <div
            className="absolute bottom-2 left-[max(3.5rem,calc(env(safe-area-inset-left)+3rem))] top-14 grid w-[min(52%,24rem)] grid-cols-4 gap-1.5"
            style={{ gridTemplateRows: `repeat(${Math.ceil(deck.length / 4)}, minmax(0, 1fr))` }}
          >
            {deck.map((c, i) => {
              const shown = peek || open.includes(i) || found.includes(c.a);
              return (
                <button
                  key={c.id}
                  onClick={() => flip(i)}
                  aria-label={shown ? ANIMAL_NAME[c.a] : 'Carta virada'}
                  className={cx('rpg-wood grid min-h-0 place-items-center overflow-hidden p-1 transition', shown ? 'bg-[#ead8b2]' : 'hover:brightness-110', found.includes(c.a) && 'opacity-60')}
                >
                  {shown ? <AnimalIcon a={c.a} /> : <span className="rpg-text text-2xl text-[#ffe08a]">?</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
      {misses >= MISSES && found.length < ANIMALS.length && (
        <Retry
          text="Muitas cartas erradas! Memorize onde cada bicho apareceu antes de virar a próxima."
          onRetry={() => {
            setFound([]);
            setOpen([]);
            setTries(0);
            walking.current = [];
            setRun((r) => r + 1);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 3. The flood

export function Flood({ paused, onWin, diff = 1 }: GameProps) {
  const HITS = byDiff(diff, [4, 3, 2]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { tilt: 0, vel: 0, drift: 0.2, time: 0, big: 0, warn: 0, flash: 0, hits: 0, won: false };
  }
  const DUR = byDiff(diff, [35, 40, 45]);
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.won;
    if (live) {
      s.time += dt;
      if (Math.random() < dt * 0.9) s.drift = (Math.random() - 0.5) * byDiff(diff, [1.3, 1.7, 2.1]);
      s.warn -= dt;
      if (s.warn < -2.5 - Math.random() * 3) {
        s.warn = 1;
        s.big = Math.random() < 0.5 ? -1 : 1;
      }
      if (s.warn <= 0 && s.big) {
        s.vel += s.big * byDiff(diff, [1.1, 1.45, 1.8]);
        s.big = 0;
        engine.drum('kick', 0, 0.8);
      }
      s.vel += (s.drift + s.tilt * 1.2) * dt;
      s.vel *= 0.985;
      s.tilt += s.vel * dt;
      if (Math.abs(s.tilt) > 1) {
        s.hits += 1;
        s.tilt = 0;
        s.vel = 0;
        engine.sfx('hurt');
        buzz([80, 40, 80]);
        if (s.hits >= HITS) setLost(true);
      }
      if (Math.random() < dt * 0.3) s.flash = 0.2;
      s.flash = Math.max(0, s.flash - dt);
      if (s.time >= DUR && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(s.hits === 0 ? 3 : s.hits === 1 ? 2 : 1), 900);
      }
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    SC.sky(ctx, w, ['#2a3040', '#343a4c', '#3e4658', '#4a5264'], 120);
    for (let k = 0; k < 80; k++) rect(ctx, (k * 37 + t * 90) % w, (k * 23 + t * 300) % 180, 1, 5, 'rgba(200,210,230,0.5)');
    // Waves.
    for (let x = 0; x < w; x++) {
      const top = 128 + Math.sin(x * 0.05 + t * 2) * 5 + Math.sin(x * 0.11 - t * 3) * 3;
      rect(ctx, x, top, 1, 180 - top, '#2a4a6a');
      rect(ctx, x, top, 1, 2, '#6a8aaa');
    }
    drawArk(ctx, w * 0.5, 134 + Math.sin(t * 2) * 2, 1, 1, st.current.tilt * 0.35);
    if (s.warn > 0 && s.warn < 1) {
      ctx.font = '10px "Pixelify Sans", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe066';
      ctx.fillText(s.big > 0 ? 'Onda vindo da esquerda! ▶' : '◀ Onda vindo da direita!', w / 2, 40);
    }
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 2.5})`;
      ctx.fillRect(0, 0, w, 180);
    }
  });
  const nudge = (d: number) => {
    if (paused || lost) return;
    st.current.vel += d * 0.5;
    engine.drum('tom', 0, 0.25);
  };
  useKeys((k) => {
    if (k === 'arrowleft' || k === 'a') nudge(-1);
    if (k === 'arrowright' || k === 'd') nudge(1);
  });
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">Dia {Math.min(40, Math.floor((s.time / DUR) * 40) + 1)} de 40</Panel>
            <Panel className="text-base">Sustos: {s.hits}/{HITS}</Panel>
          </div>
          <div className="pointer-events-none absolute left-1/2 top-14 w-48 -translate-x-1/2">
            <div className="relative h-4 border-2 border-[#3a2414] bg-[#4a4250]">
              <div className="absolute inset-y-0 left-[30%] right-[30%] bg-[#6aaa3a]/50" />
              <div className={cx('absolute -top-1 bottom-[-0.25rem] w-1.5 -translate-x-1/2 bg-white', Math.abs(s.tilt) > 0.6 && 'bg-[#ff4a3a]')} style={{ left: `${50 + Math.max(-1, Math.min(1, s.tilt)) * 50}%` }} />
            </div>
          </div>
          {[-1, 1].map((d) => (
            <button
              key={d}
              onPointerDown={(e) => (e.preventDefault(), nudge(d))}
              className={cx(
                'rpg-wood rpg-text absolute bottom-4 h-20 w-24 touch-none text-3xl',
                d < 0 ? 'left-[max(1rem,env(safe-area-inset-left))]' : 'right-[max(1rem,env(safe-area-inset-right))]',
                s.tilt * -d > 0.45 && 'animate-blink text-[#ffe08a]',
              )}
            >
              {d < 0 ? '◀' : '▶'}
            </button>
          ))}
        </>
      )}
      {lost && (
        <Retry
          text="A arca balançou demais! Equilibre para o lado contrário da inclinação."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 4. The dove

export function Dove({ paused, onWin, diff = 1 }: GameProps) {
  const LIVES = byDiff(diff, [4, 3, 2]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { y: 90, vy: 0, dist: 0, lives: LIVES, inv: 0, obs: [] as { x: number; gap: number; size: number }[], next: 1, won: false, started: false, gust: 0, parts: [] as Part[] };
  }
  const GOAL = 100;
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.won && s.started;
    if (live) {
      s.vy += 220 * dt;
      s.y += s.vy * dt;
      s.dist += dt * 2.6;
      s.inv = Math.max(0, s.inv - dt);
      s.next -= dt;
      if (s.next <= 0 && s.dist < GOAL - 6) {
        s.obs.push({ x: w + 20, gap: 50 + Math.random() * 80, size: byDiff(diff, [68, 56, 48]) - Math.min(14, s.dist * 0.14) });
        s.next = byDiff(diff, [1.8, 1.5, 1.25]);
      }
      for (const o of s.obs) o.x -= byDiff(diff, [56, 64, 74]) * dt;
      // Gusts of wind on harder levels.
      if (diff > 0 && Math.random() < dt * byDiff(diff, [0, 0.25, 0.45])) {
        s.vy += (Math.random() - 0.5) * 120;
        s.gust = 0.6;
      }
      s.gust = Math.max(0, s.gust - dt);
      s.obs = s.obs.filter((o) => o.x > -40);
      const dx = w * 0.28;
      const hit = s.y < 8 || s.y > 168 || s.obs.some((o) => Math.abs(o.x - dx) < 16 && (s.y < o.gap - o.size / 2 || s.y > o.gap + o.size / 2));
      if (hit && s.inv <= 0) {
        s.lives -= 1;
        s.inv = 1.4;
        s.vy = -60;
        s.y = Math.max(20, Math.min(150, s.y));
        engine.sfx('hurt');
        buzz([60, 30, 60]);
        if (s.lives <= 0) setLost(true);
      }
      if (s.dist >= GOAL && !s.won) {
        s.won = true;
        engine.sfx('yay');
        burst(s.parts, w * 0.28, s.y, '#8ac858', 16);
        window.setTimeout(() => onWin(starsOf(s.lives / LIVES)), 1200);
      }
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    SC.sky(ctx, w, ['#7a9ab8', '#8aaac6', '#9abad2', '#accadc'], 180);
    // Flood water with mountain tops slowly appearing.
    const lvl = 160 - Math.min(20, s.dist * 0.2);
    for (let k = 0; k < 4; k++) {
      const mx = ((k * 140 - s.dist * 6) % (w + 140)) + w + 20 - 140;
      ctx.fillStyle = '#6a7a5a';
      ctx.beginPath();
      ctx.moveTo(mx - 40, lvl + 2);
      ctx.lineTo(mx, lvl - 18 - (s.dist / GOAL) * 14);
      ctx.lineTo(mx + 40, lvl + 2);
      ctx.fill();
    }
    rect(ctx, 0, lvl, w, 180 - lvl, '#3a6a9a');
    for (let x = 0; x < w; x += 6) rect(ctx, x, lvl + Math.round(Math.sin(x * 0.2 + t * 3)), 4, 1, '#8ab8e0');
    // Rain clouds from above and below the dove's path.
    for (const o of s.obs) {
      const top = o.gap - o.size / 2;
      const bottom = o.gap + o.size / 2;
      SC.blob(ctx, o.x, top - 20, 18, 22, '#5a6070');
      for (let k = 0; k < 4; k++) rect(ctx, o.x - 10 + k * 6, top + 2 + ((t * 60 + k * 9) % 10), 1, 4, '#c8d8e8');
      SC.blob(ctx, o.x, bottom + 26, 18, 26, '#5a6070');
    }
    if (s.dist >= GOAL - 8) {
      // The olive tree on a hill.
      const tx = w * 0.75 + (GOAL - s.dist) * 20;
      rect(ctx, tx - 2, lvl - 24, 4, 24, '#5a3a1e');
      SC.blob(ctx, tx, lvl - 30, 14, 9, '#6a8a3a');
    }
    if (!(s.inv > 0 && Math.floor(t * 16) % 2)) {
      ctx.save();
      ctx.translate(Math.round(w * 0.28), Math.round(s.y));
      ctx.scale(1.4, 1.4);
      SC.blob(ctx, 0, 0, 6, 4, '#f4f4f8');
      SC.blob(ctx, 5, -3, 3, 3, '#f4f4f8');
      rect(ctx, 8, -3, 2, 1, '#e8a040');
      rect(ctx, 6, -4, 1, 1, '#1a1a1a');
      rect(ctx, -6, -2 - (Math.floor(t * 10) % 2) * 4, 7, 2, '#d8d8e0');
      if (s.won) rect(ctx, 9, -2, 4, 2, '#6aaa3a');
      ctx.restore();
    }
    SC.particlesDraw(ctx, s.parts);
  });
  const flap = () => {
    const s = st.current;
    if (paused || lost || s.won) return;
    s.started = true;
    s.vy = -88;
    engine.playNote(88, 'bell', 0, 0.08);
  };
  useKeys((k) => (k === ' ' || k === 'enter' || k === 'arrowup' || k === 'w' || k === 'z') && flap());
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Voo
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#8ac858]" style={{ width: `${Math.min(100, s.dist)}%` }} />
              </span>
            </Panel>
            <Panel className="text-base">{'♥'.repeat(Math.max(0, s.lives))}</Panel>
          </div>
          <button aria-label="Bater as asas" onPointerDown={(e) => (e.preventDefault(), flap())} className="absolute inset-0 top-12 touch-none" />
          <span className={cx('rpg-text pointer-events-none absolute right-6 opacity-90', s.started ? 'bottom-4 text-sm' : 'bottom-1/3 animate-blink text-xl')}>Toque na tela para voar</span>
        </>
      )}
      {lost && (
        <Retry
          text="A pomba se molhou na chuva! Toques curtos e calmos mantêm o voo no meio."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 5. The rainbow (Simon)

const RAINBOW = ['#e83a3a', '#f08a2a', '#f0d040', '#5ac04a', '#3a8ad8', '#4a4ab8', '#8a4ac8'];
const NOTES = [60, 62, 64, 65, 67, 69, 71];

export function Rainbow({ paused, onWin, diff = 1 }: GameProps) {
  const STEP = byDiff(diff, [650, 520, 420]);
  const mistakes = useRef(0);
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [input, setInput] = useState<number[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [busy, setBusy] = useState(true);
  const [painted, setPainted] = useState(0);
  const [msg, setMsg] = useState('Observe as cores...');
  const timers = useRef<number[]>([]);
  const ROUNDS = byDiff(diff, [3, 4, 5]);
  const play = (s: number[]) => {
    setBusy(true);
    setInput([]);
    setMsg('Observe as cores...');
    timers.current.forEach(clearTimeout);
    timers.current = [];
    s.forEach((c, k) => {
      timers.current.push(
        window.setTimeout(() => {
          setShowing(c);
          engine.playNote(NOTES[c], 'bell', 0, 0.3);
        }, 700 + k * STEP),
        window.setTimeout(() => setShowing(null), 700 + k * STEP + STEP * 0.62),
      );
    });
    timers.current.push(window.setTimeout(() => (setBusy(false), setMsg('Sua vez! Repita as cores.')), 700 + s.length * STEP));
  };
  useEffect(() => {
    if (paused) return;
    const s = Array.from({ length: 3 + round * 2 }, () => Math.floor(Math.random() * 7));
    setSeq(s);
    play(s);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, paused]);
  const cv = useStage((ctx, w, dt, t) => {
    SC.sky(ctx, w, ['#8ac0e4', '#a2d0ea', '#bcdcee', '#d4e8f0'], 120);
    // The rainbow, painted band by band.
    const bands = Math.min(7, painted + (showing !== null ? 0 : 0));
    for (let i = 0; i < bands; i++) {
      ctx.strokeStyle = RAINBOW[i];
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w * 0.5, 150, 110 - i * 4, Math.PI, 0);
      ctx.stroke();
    }
    if (showing !== null) {
      ctx.strokeStyle = RAINBOW[showing];
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(w * 0.5, 150, 90, Math.PI, 0);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    SC.hills(ctx, w, 130, '#6a8a4a', 14, 0.03, 2);
    rect(ctx, 0, 140, w, 40, '#7a9a4a');
    drawArk(ctx, w * 0.8, 136, 1, 1, -0.08);
    // Altar with smoke.
    rect(ctx, w * 0.32 - 10, 150, 20, 12, '#8a8278');
    rect(ctx, w * 0.32 - 10, 150, 20, 2, '#a8a094');
    for (let k = 0; k < 5; k++) rect(ctx, w * 0.32 - 2 + Math.sin(t * 2 + k) * 3, 146 - ((t * 14 + k * 9) % 40), 3, 3, `rgba(220,220,220,${0.5 - k * 0.08})`);
    drawPerson(ctx, NLOOKS.noe, w * 0.42, 172, 'left', 0);
    drawPerson(ctx, NLOOKS.esposa, w * 0.5, 172, 'up', 0);
    drawPerson(ctx, NLOOKS.sem, w * 0.56, 174, 'up', 0);
    void dt;
  });
  const tap = (c: number) => {
    if (paused || busy) return;
    engine.playNote(NOTES[c], 'bell', 0, 0.3);
    const next = [...input, c];
    if (seq[next.length - 1] !== c) {
      engine.sfx('bonk');
      buzz([30, 30, 30]);
      mistakes.current += 1;
      setMsg('Não era essa cor... veja de novo.');
      window.setTimeout(() => play(seq), 600);
      return;
    }
    setInput(next);
    if (next.length === seq.length) {
      buzz(25);
      const p = Math.min(7, painted + (round === ROUNDS - 1 ? 7 : 2 + round));
      setPainted(p);
      if (round + 1 >= ROUNDS) {
        setPainted(7);
        setMsg('O arco da aliança!');
        engine.sfx('yay');
        setBusy(true);
        window.setTimeout(() => onWin(mistakes.current === 0 ? 3 : mistakes.current <= 2 ? 2 : 1), 1500);
      } else {
        setMsg('Muito bem! Mais cores...');
        setBusy(true);
        window.setTimeout(() => setRound((r) => r + 1), 800);
      }
    }
  };
  return (
    <>
      <Stage cv={cv} />
      {!paused && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-2xl flex-col gap-1.5">
          <Panel className="text-center text-base">
            Rodada {round + 1}/{ROUNDS} · {msg}
          </Panel>
          <div className="grid grid-cols-7 gap-1">
            {RAINBOW.map((c, i) => (
              <button
                key={c}
                onClick={() => tap(i)}
                aria-label={`Cor ${i + 1}`}
                className={cx('h-14 border-[3px] border-[#3a2414] transition', showing === i && 'scale-110 brightness-150', busy && 'opacity-80')}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
