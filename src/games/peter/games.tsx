/** Playable chapters of the story of Peter. */
import { useEffect, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Portrait } from '../pixel/Dialog';
import { heroFace } from '../pixel/heroes';
import { drawPerson, type Look } from '../pixel/person';
import { Qte } from '../pixel/Qte';
import { burst, buzz, byDiff, starsOf, Panel, Retry as RetryBase, Stage, stepParts, useKeys, useStage, type GameProps, type Part } from '../pixel/stage';
import { Lanes, type Note } from '../david/games';
import * as SC from '../david/scenes';
import { ACCUSE, DENY, LOVE, LOVE_FIX, PSPEAK } from './content';
import { PLOOKS } from './looks';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={PLOOKS.pedro} />;
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Lake of Galilee: sky, hills, water surface at `sea`, underwater below. */
function lake(ctx: CanvasRenderingContext2D, w: number, t: number, sea: number, night = 0, storm = 0) {
  const sky = night > 0.5 ? ['#1a2440', '#26345a', '#344470', '#465888'] : storm ? ['#4a5468', '#5a6478', '#6a7488', '#7a8498'] : ['#f0b880', '#f4c890', '#bcd8ee', '#a8d0ea'];
  SC.sky(ctx, w, sky, sea);
  SC.hills(ctx, w, sea - 4, night > 0.5 ? '#2a3a40' : '#6a8a58', 10, 0.03, 1, sea);
  for (let y = sea; y < 180; y++) {
    const k = (y - sea) / (180 - sea);
    rect(ctx, 0, y, w, 1, night > 0.5 ? (k < 0.1 ? '#2a4a6a' : '#1a2e4a') : k < 0.08 ? '#6aaad0' : k < 0.5 ? '#3a7ab0' : '#2a5a8a');
  }
  for (let i = 0; i < 24; i++) {
    const x = (i * 47 + t * (storm ? 40 : 8)) % (w + 20) - 10;
    rect(ctx, x, sea + 1 + (i % 3) * 2, 6 + (i % 4) * 2, 1, storm ? '#c8d8e8' : '#9ccae8');
  }
}

function boat(ctx: CanvasRenderingContext2D, x: number, y: number, sink = 0) {
  const Y = y + sink;
  rect(ctx, x - 26, Y - 2, 52, 3, '#2a1a10');
  ctx.fillStyle = '#2a1a10';
  ctx.beginPath();
  ctx.moveTo(x - 28, Y - 2);
  ctx.lineTo(x + 28, Y - 2);
  ctx.lineTo(x + 20, Y + 8);
  ctx.lineTo(x - 20, Y + 8);
  ctx.fill();
  ctx.fillStyle = '#8a5a30';
  ctx.beginPath();
  ctx.moveTo(x - 25, Y - 1);
  ctx.lineTo(x + 25, Y - 1);
  ctx.lineTo(x + 18, Y + 6);
  ctx.lineTo(x - 18, Y + 6);
  ctx.fill();
  rect(ctx, x - 25, Y - 1, 50, 1, '#b07a44');
  rect(ctx, x - 2, Y - 40, 2, 38, '#3a2414');
  rect(ctx, x, Y - 38, 14, 22, '#e8dcc0');
  rect(ctx, x + 12, Y - 38, 2, 22, '#c8bca0');
}

function fish(ctx: CanvasRenderingContext2D, x: number, y: number, left: boolean, gold = false, s = 1) {
  const c = gold ? '#e8c040' : '#8ab0c8';
  rect(ctx, x - 4 * s, y - 2 * s, 8 * s, 4 * s, '#1a2a3a');
  rect(ctx, x - 3 * s, y - 1 * s, 6 * s, 2 * s, c);
  const tx = left ? x + 4 * s : x - 6 * s;
  rect(ctx, tx, y - 2 * s, 2 * s, 4 * s, gold ? '#c89a20' : '#6a90a8');
  rect(ctx, left ? x - 3 * s : x + 2 * s, y - 1 * s, 1, 1, '#1a1a1a');
  if (gold && Math.random() < 0.15) rect(ctx, x - 1, y - 4, 1, 1, '#ffffff');
}

// ================================================================ 1. The miraculous catch

export function NetCast({ paused, onWin, diff = 1 }: GameProps) {
  const NEED = byDiff(diff, [3, 4, 5]);
  const CASTS = byDiff(diff, [14, 10, 8]);
  const TOL = byDiff(diff, [26, 19, 14]);
  const [haul, setHaul] = useState(false);
  const [hauls, setHauls] = useState(0);
  const [casts, setCasts] = useState(CASTS);
  const [msg, setMsg] = useState<string | null>(null);
  const st = useRef({ sx: 0, sy: 128, ph: 0, net: 0, caught: 0, parts: [] as Part[], w: 320, t: 0 });
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    s.t = t;
    // The school changes speed and depth unpredictably; it only counts when inside the ring.
    if (!paused && !haul) s.ph += dt * (0.7 + Math.sin(t * 0.37) * 0.45 + Math.sin(t * 1.3) * 0.25) * byDiff(diff, [0.9, 1.15, 1.4]);
    s.sx = w * 0.5 + Math.sin(s.ph) * w * 0.3;
    s.sy = 128 + Math.sin(s.ph * 2.1 + 1) * byDiff(diff, [6, 14, 22]);
    const sy = s.sy;
    s.net = Math.max(0, s.net - dt);
    lake(ctx, w, t, 74);
    const bx = w * 0.5;
    boat(ctx, bx, 74, Math.min(6, hauls * 2));
    drawPerson(ctx, PLOOKS.pedro, bx - 8, 72 + Math.min(6, hauls * 2), 'right', 0);
    drawPerson(ctx, PLOOKS.andre, bx - 18, 72 + Math.min(6, hauls * 2), 'right', 0);
    drawPerson(ctx, PLOOKS.jesus, bx + 16, 72 + Math.min(6, hauls * 2), 'left', 0);
    // Target ring on the right of the boat.
    const tx = w * 0.72;
    const ty = 128;
    ctx.strokeStyle = 'rgba(255,240,180,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(tx, ty, TOL - 2, 0, Math.PI * 2);
    ctx.stroke();
    for (let k = 0; k < 12; k++) fish(ctx, s.sx + Math.cos(k * 1.7 + t) * 10, sy + Math.sin(k * 2.3 + t * 1.3) * 6, Math.cos(t * 0.9) < 0);
    if (s.net > 0) {
      ctx.strokeStyle = '#e8dcc0';
      for (let k = -3; k <= 3; k++) {
        ctx.beginPath();
        ctx.moveTo(tx + k * 5, ty - 20);
        ctx.lineTo(tx + k * 6, ty + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(tx - 18, ty + k * 5);
        ctx.lineTo(tx + 18, ty + k * 5);
        ctx.stroke();
      }
    }
    s.parts = stepParts(s.parts, dt, 60);
    SC.particlesDraw(ctx, s.parts);
  });
  const cast = () => {
    const s = st.current;
    if (paused || haul || casts <= 0) return;
    s.net = 0.6;
    engine.playNote(62, 'pluck', 0, 0.3);
    const left = casts - 1;
    setCasts(left);
    const inRing = Math.hypot(s.sx - s.w * 0.72, s.sy - 128) < TOL;
    if (inRing) {
      setMsg('Pegou o cardume! Puxe!');
      buzz(30);
      window.setTimeout(() => setHaul(true), 400);
    } else {
      setMsg(left > 0 ? 'Nada... espere o cardume entrar no círculo.' : 'Acabaram as forças para lançar...');
      engine.sfx('bonk');
      buzz([30, 30, 30]);
    }
  };
  useKeys((k) => (k === ' ' || k === 'enter' || k === 'z' || k === 'e') && cast());
  return (
    <>
      <Stage cv={cv} />
      {!paused && !haul && (
        <>
          <Panel className="pointer-events-none absolute left-14 top-2 text-base">
            Redes cheias: {hauls}/{NEED} · Lances: {casts}
            {msg && <span className="ml-2 text-[#ffe08a]">{msg}</span>}
          </Panel>
          <button
            onPointerDown={(e) => (e.preventDefault(), cast())}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Lançar
            <span className="text-xs">a rede</span>
          </button>
        </>
      )}
      {!paused && !haul && casts <= 0 && hauls < NEED && (
        <Retry
          text="Os braços cansaram antes de encher as redes. Observe o cardume: ele muda de velocidade e de fundura. Lance só quando estiver dentro do círculo."
          onRetry={() => {
            setCasts(CASTS);
            setHauls(0);
            setMsg(null);
          }}
        />
      )}
      {!paused && haul && (
        <Qte
          kind="mash"
          title="Puxe a rede!"
          hint="Está pesada! Toque sem parar!"
          look={PLOOKS.pedro}
          img={heroFace('pedro')}
          times={byDiff(diff, [8, 11, 13])}
          seconds={3.2}
          button="Puxar!"
          onDone={(ok) => {
            setHaul(false);
            setMsg(ok ? 'Que peixaria!' : 'A rede escapou! Lance de novo.');
            if (!ok) return;
            const n = hauls + 1;
            setHauls(n);
            const s = st.current;
            burst(s.parts, s.w * 0.72, 110, '#9cc8e8', 20);
            engine.sfx('coin');
            if (n >= NEED) window.setTimeout(() => onWin(starsOf((casts / CASTS) * 1.6)), 700);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 2. Walking on the water

export function WaterWalk({ paused, onWin, diff = 1 }: GameProps) {
  const WIN = byDiff(diff, [30, 22, 15]);
  const LOSS = byDiff(diff, [26, 34, 42]);
  const [sunk, setSunk] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { x: 0, walking: false, faith: 100, sink: 0, waves: [] as { x: number; done: boolean }[], next: 2, flash: 0, parts: [] as Part[], won: false, msg: '', msgT: 0, w: 320 };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    const start = w * 0.2;
    const goal = w * 0.8;
    if (!s.x) s.x = start;
    const live = !paused && !sunk && !s.won;
    if (live) {
      if (s.walking) s.x = Math.min(goal, s.x + 16 * dt);
      s.next -= dt;
      if (s.next <= 0) {
        s.waves.push({ x: -20, done: false });
        s.next = byDiff(diff, [2.8, 2.2, 1.7]) + Math.random() * byDiff(diff, [1.8, 1.4, 1.1]);
        // On hard, sometimes two waves come close together.
        if (diff === 2 && Math.random() < 0.3) s.waves.push({ x: -60, done: false });
      }
      for (const wv of s.waves) {
        wv.x += 70 * dt;
        if (!wv.done && wv.x > s.x + 10) {
          wv.done = true;
          s.faith -= LOSS;
          s.sink = Math.min(14, s.sink + 5);
          engine.sfx('hurt');
          buzz([60, 30, 60]);
          s.msg = 'Ele olhou para o vento e teve medo!';
          s.msgT = 1.5;
          if (s.faith <= 0) {
            setSunk(true);
            engine.sfx('sad');
          }
        }
      }
      s.waves = s.waves.filter((wv) => wv.x < w + 30);
      s.sink = Math.max(0, s.sink - dt * 2);
      s.msgT = Math.max(0, s.msgT - dt);
      if (Math.random() < dt * 0.25) s.flash = 0.15;
      s.flash = Math.max(0, s.flash - dt);
      if (s.x >= goal && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf(s.faith / 100)), 900);
      }
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    lake(ctx, w, t, 104, 0, 1);
    for (let k = 0; k < 60; k++) rect(ctx, (k * 37 + t * 120) % w, (k * 23 + t * 260) % 180, 1, 4, 'rgba(220,230,240,0.5)');
    boat(ctx, start - 20, 104);
    // Jesus standing on the water, glowing softly.
    ctx.fillStyle = 'rgba(255,240,190,0.25)';
    ctx.beginPath();
    ctx.arc(goal + 10, 88, 20, 0, Math.PI * 2);
    ctx.fill();
    drawPerson(ctx, PLOOKS.jesus, goal + 10, 104, 'left', 0);
    for (const wv of s.waves) {
      ctx.fillStyle = '#e8f0f8';
      ctx.beginPath();
      ctx.moveTo(wv.x - 18, 106);
      ctx.quadraticCurveTo(wv.x - 4, 86, wv.x + 8, 92);
      ctx.lineTo(wv.x + 4, 106);
      ctx.fill();
      ctx.fillStyle = '#5a8ab8';
      ctx.beginPath();
      ctx.moveTo(wv.x - 14, 106);
      ctx.quadraticCurveTo(wv.x - 4, 92, wv.x + 4, 96);
      ctx.lineTo(wv.x + 2, 106);
      ctx.fill();
    }
    drawPerson(ctx, PLOOKS.pedro, s.x, 104 + s.sink, 'right', s.walking && live ? Math.floor(t * 6) % 4 : 0);
    if (s.sink > 3) rect(ctx, s.x - 8, 103, 16, s.sink, '#3a7ab0');
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 3})`;
      ctx.fillRect(0, 0, w, 180);
    }
    SC.particlesDraw(ctx, s.parts);
  });
  const focus = () => {
    const s = st.current;
    if (paused || sunk) return;
    const wv = s.waves.find((x) => !x.done && Math.abs(x.x - s.x) < WIN);
    if (wv) {
      wv.done = true;
      engine.playNote(81, 'bell', 0, 0.3);
      buzz(15);
      s.faith = Math.min(100, s.faith + 6);
      s.msg = 'Os olhos em Jesus!';
      s.msgT = 1;
      burst(s.parts, s.x, 90, '#ffe066', 10);
    } else {
      // Looking around for no reason is doubt too.
      s.faith -= 5;
      s.msg = 'Sem onda por perto... não duvide à toa! (−5 fé)';
      s.msgT = 1;
    }
  };
  useKeys(
    (k) => {
      if (k === ' ' || k === 'enter' || k === 'z' || k === 'e') focus();
      if (k === 'arrowright' || k === 'd' || k === 'arrowup') st.current.walking = true;
    },
    (k) => {
      if (k === 'arrowright' || k === 'd' || k === 'arrowup') st.current.walking = false;
    },
  );
  const s = st.current;
  const near = s.waves.some((x) => !x.done && x.x > s.x - 50 && x.x < s.x + 26);
  return (
    <>
      <Stage cv={cv} />
      {!paused && !sunk && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Fé
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full transition-[width]', s.faith > 40 ? 'bg-[#ffe066]' : 'animate-pulse bg-[#d8402a]')} style={{ width: `${Math.max(0, s.faith)}%` }} />
              </span>
            </Panel>
            {s.msgT > 0 && <Panel className="text-base text-[#ffe08a]">{s.msg}</Panel>}
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              st.current.walking = true;
            }}
            onPointerUp={() => (st.current.walking = false)}
            onPointerCancel={() => (st.current.walking = false)}
            className="rpg-wood rpg-text absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] h-20 w-32 touch-none text-xl"
          >
            Andar ▶
          </button>
          <button
            onPointerDown={(e) => (e.preventDefault(), focus())}
            className={cx(
              'rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-28 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-sm leading-tight shadow-[3px_3px_0_#0006] active:scale-95',
              near ? 'animate-blink bg-[#e8b830] text-[#3a2414]' : 'bg-[#8a5a2e]',
            )}
          >
            Olhar para Jesus
          </button>
        </>
      )}
      {sunk && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4">
          <div className="rpg-frame rpg-text flex max-w-md flex-col items-center gap-3 p-4 text-center text-lg">
            <Portrait look={PLOOKS.jesus} img={heroFace('jesus')} className="h-20 w-20" />
            “Senhor, salva-me!” Jesus estendeu a mão e o segurou. Tente de novo, sem tirar os olhos dele.
            <button
              onClick={() => {
                st.current = fresh();
                setSunk(false);
              }}
              className="rpg-wood h-12 w-full text-xl"
            >
              Tentar de novo
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ================================================================ 3. The coin in the fish's mouth

export function CoinFish({ paused, onWin, diff = 1 }: GameProps) {
  const TIME = byDiff(diff, [45, 35, 28]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { hook: 86, down: false, fishes: [] as { x: number; y: number; v: number; gold: boolean; decoy?: boolean }[], spawn: 0, time: TIME, got: false, caughtT: 0, msg: '', parts: [] as Part[] };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.got;
    const hx = w * 0.5 + 18;
    if (live) {
      s.time -= dt;
      if (s.time <= 0) setLost(true);
      s.hook = Math.max(86, Math.min(172, s.hook + (s.down ? 46 : -26) * dt));
      s.spawn -= dt;
      if (s.spawn <= 0) {
        const left = Math.random() < 0.5;
        const gold = Math.random() < byDiff(diff, [0.22, 0.15, 0.11]);
        // Yellowish decoys that look a lot like the real one (but don't shine).
        const decoy = !gold && Math.random() < byDiff(diff, [0, 0.18, 0.28]);
        s.fishes.push({
          x: left ? -10 : w + 10,
          y: gold ? 150 + Math.random() * 18 : 96 + Math.random() * 74,
          v: (left ? 1 : -1) * (gold ? byDiff(diff, [40, 50, 62]) : 22 + Math.random() * 20),
          gold,
          decoy,
        });
        s.spawn = 0.7 + Math.random() * 0.8;
      }
      for (const f of s.fishes) {
        f.x += f.v * dt;
        if (Math.abs(f.x - hx) < 6 && Math.abs(f.y - s.hook) < 5) {
          if (f.gold) {
            s.got = true;
            engine.sfx('yay');
            buzz([40, 30, 120]);
            burst(s.parts, hx, s.hook, '#ffe066', 20);
            window.setTimeout(() => onWin(starsOf((s.time / TIME) * 2)), 1200);
          } else {
            f.x = -999;
            s.time -= 2;
            s.msg = 'Esse não tem moeda... devolve! (−2 s)';
            engine.sfx('bonk');
            buzz(20);
          }
        }
      }
      s.fishes = s.fishes.filter((f) => f.x > -40 && f.x < w + 40);
      if (Math.floor(t * 5) !== Math.floor((t - dt) * 5)) setH((h) => h + 1);
    }
    lake(ctx, w, t, 74);
    boat(ctx, w * 0.5, 74);
    drawPerson(ctx, PLOOKS.pedro, w * 0.5 + 8, 72, 'right', 0);
    ctx.strokeStyle = '#e8e0d0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + 18, 50);
    ctx.lineTo(hx, s.hook);
    ctx.stroke();
    rect(ctx, hx - 1, s.hook, 3, 2, '#c8c8d0');
    rect(ctx, hx + 1, s.hook - 2, 1, 2, '#c8c8d0');
    for (const f of s.fishes) {
      if (f.decoy) {
        fish(ctx, f.x, f.y, f.v < 0, false, 1.3);
        rect(ctx, f.x - 3, f.y - 1, 6, 2, '#c8a848');
      } else fish(ctx, f.x, f.y, f.v < 0, f.gold, f.gold ? 1.3 : 1);
    }
    if (s.got) fish(ctx, hx, s.hook + 4, false, true, 1.3);
    s.parts = stepParts(s.parts, dt, 40);
    SC.particlesDraw(ctx, s.parts);
  });
  useKeys(
    (k) => (k === ' ' || k === 'arrowdown' || k === 's' || k === 'enter') && (st.current.down = true),
    (k) => (k === ' ' || k === 'arrowdown' || k === 's' || k === 'enter') && (st.current.down = false),
  );
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <Panel className="pointer-events-none absolute left-14 top-2 text-base">
            Fisgue o peixe dourado · {Math.max(0, Math.ceil(s.time))} s{s.msg && <span className="ml-2 text-[#ffe08a]">{s.msg}</span>}
          </Panel>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              st.current.down = true;
            }}
            onPointerUp={() => (st.current.down = false)}
            onPointerCancel={() => (st.current.down = false)}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Descer
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {lost && (
        <Retry
          text="O tempo acabou! O peixe dourado nada fundo e rápido: desça o anzol antes e espere ele passar."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 4. The denial

export function Denial({ paused, onWin, diff = 1 }: GameProps) {
  const [ask, setAsk] = useState<number | null>(null);
  const [brave, setBrave] = useState(false);
  const [, setH] = useState(0);
  const st = useRef({ x: 0, dir: 0, count: 0, seen: 0, clock: 0, lights: byDiff(diff, [[0.1, 0.6], [0.1, 0.6], [0.1, 0.45, 0.8]]), crow: false, w: 320, warmth: 100, caught: 0 });
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    if (!s.x) s.x = w * 0.5;
    const live = !paused && ask === null && !s.crow;
    // Two servants with lamps walk across the courtyard.
    const sp = byDiff(diff, [0.8, 1, 1.25]);
    const lamps = s.lights.map((ph, i) => w * 0.5 + Math.sin(t * (0.5 + i * 0.17) * sp + ph * 6) * w * 0.42);
    if (live) {
      s.x = Math.max(16, Math.min(w - 16, s.x + s.dir * 40 * dt));
      s.clock += dt;
      const lit = lamps.some((lx) => Math.abs(lx - s.x) < 18);
      s.seen = lit ? s.seen + dt : Math.max(0, s.seen - dt * 0.5);
      // The night is cold: away from the fire Peter freezes and starts to shiver.
      const nearFire = Math.abs(s.x - w * 0.5) < 34;
      s.warmth = Math.max(0, Math.min(100, s.warmth + (nearFire ? 24 : -byDiff(diff, [9, 13, 17])) * dt));
      const caught = s.seen > byDiff(diff, [0.9, 0.7, 0.5]) || s.warmth <= 0;
      // Caught in the light (or shivering), or the story moves on anyway.
      if (caught || s.clock > byDiff(diff, [12, 15, 18])) {
        if (caught) s.caught += 1;
        s.seen = 0;
        s.clock = 0;
        s.warmth = Math.max(s.warmth, 50);
        engine.sfx('dead');
        setAsk(s.count);
      }
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    // Night courtyard.
    SC.sky(ctx, w, ['#0e0e1e', '#141426', '#1a1a30', '#22223a'], 70);
    rect(ctx, 0, 40, w, 50, '#2a2420');
    for (let x = 0; x < w; x += 16) rect(ctx, x, 40, 1, 50, '#3a3028');
    rect(ctx, 0, 90, w, 90, '#3a3026');
    for (let y = 92; y < 180; y += 9) for (let x = ((y / 9) % 2) * 6; x < w; x += 12) rect(ctx, x, y, 11, 8, '#443a2e');
    // Fire in the middle.
    const fx = w * 0.5;
    ctx.fillStyle = 'rgba(255,150,60,0.18)';
    ctx.beginPath();
    ctx.arc(fx, 150, 50, 0, Math.PI * 2);
    ctx.fill();
    for (let k = 0; k < 6; k++) rect(ctx, fx - 6 + k * 2, 146 - ((t * 30 + k * 7) % 14), 2, 3, k % 2 ? '#ffd23a' : '#ff6a2a');
    rect(ctx, fx - 9, 152, 18, 3, '#4a2c14');
    // Lamp cones.
    lamps.forEach((lx, i) => {
      const g = ctx.createRadialGradient(lx, 150, 2, lx, 150, 22);
      g.addColorStop(0, 'rgba(255,230,150,0.55)');
      g.addColorStop(1, 'rgba(255,230,150,0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - 24, 120, 48, 50);
      drawPerson(ctx, i ? PLOOKS.guarda : PLOOKS.serva, lx, 132, 'down', Math.floor(t * 4 + i) % 4);
    });
    drawPerson(ctx, PLOOKS.pedro, s.x, 160, s.dir < 0 ? 'left' : s.dir > 0 ? 'right' : 'down', s.dir ? Math.floor(t * 8) % 4 : 0);
    if (s.seen > 0.2) {
      rect(ctx, s.x - 2, 118, 4, 8, '#3a2414');
      rect(ctx, s.x - 1, 119, 2, 5, '#ff4a3a');
    }
  });
  const answer = () => {
    const s = st.current;
    s.count += 1;
    setAsk(null);
    setBrave(false);
    if (s.count >= 3) {
      s.crow = true;
      engine.playNote(76, 'keys', 0, 0.5);
      engine.playNote(81, 'keys', 0.2, 0.5);
      engine.playNote(79, 'keys', 0.5, 0.4);
      window.setTimeout(() => onWin(s.caught === 0 ? 3 : s.caught === 1 ? 2 : 1), 900);
    }
  };
  useKeys(
    (k) => {
      if (k === 'arrowleft' || k === 'a') st.current.dir = -1;
      if (k === 'arrowright' || k === 'd') st.current.dir = 1;
    },
    (k) => (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') && (st.current.dir = 0),
  );
  const acc = ask !== null ? ACCUSE[ask] : null;
  return (
    <>
      <Stage cv={cv} />
      {!paused && ask === null && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">Fuja da luz, fique perto do fogo · Acusações: {st.current.count}/3</Panel>
            <Panel className="flex items-center gap-2 text-base">
              Calor
              <span className="h-3 w-16 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full', st.current.warmth < 30 ? 'animate-pulse bg-[#5ab0ff]' : 'bg-[#ff8a3a]')} style={{ width: `${st.current.warmth}%` }} />
              </span>
            </Panel>
          </div>
          {[-1, 1].map((d) => (
            <button
              key={d}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                st.current.dir = d;
              }}
              onPointerUp={() => (st.current.dir = 0)}
              onPointerCancel={() => (st.current.dir = 0)}
              className={cx('rpg-wood rpg-text absolute bottom-4 h-20 w-24 touch-none text-3xl', d < 0 ? 'left-[max(1rem,env(safe-area-inset-left))]' : 'right-[max(1rem,env(safe-area-inset-right))]')}
            >
              {d < 0 ? '◀' : '▶'}
            </button>
          ))}
        </>
      )}
      {!paused && acc && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl items-stretch gap-2">
          <Portrait look={PSPEAK[acc.who].look} bg={PSPEAK[acc.who].bg} className="h-24 w-24" />
          <div className="rpg-frame rpg-text flex flex-1 flex-col justify-center gap-2 px-3 py-2 text-lg leading-snug">
            <span className="text-sm text-[#ffe08a]">{PSPEAK[acc.who].name}</span>
            {brave ? 'Pedro quis dizer isso... mas o medo falou mais alto:' : acc.text}
            <span className="flex flex-wrap gap-2">
              {brave ? (
                <button onClick={answer} className="rpg-wood h-11 flex-1 px-2 text-base">
                  “{DENY[ask!]}”
                </button>
              ) : (
                <>
                  <button onClick={() => (engine.playNote(64, 'keys', 0, 0.3), setBrave(true))} className="rpg-wood h-11 flex-1 px-2 text-base">
                    “Sim, sou discípulo dele!”
                  </button>
                  <button onClick={answer} className="rpg-wood h-11 flex-1 px-2 text-base">
                    “{DENY[ask!]}”
                  </button>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ================================================================ 5. Do you love me?

export function DoYouLove({ paused, onWin, diff = 1 }: GameProps) {
  const [fix, setFix] = useState<string | null>(null);
  const mistakes = useRef(0);
  const [phase, setPhase] = useState<'haul' | 'talk'>('haul');
  const [k, setK] = useState(0);
  const [reply, setReply] = useState(false);
  const cv = useStage((ctx, w, dt, t) => {
    lake(ctx, w, t, 96);
    // Beach with a charcoal fire, fish and bread.
    rect(ctx, 0, 140, w, 40, '#d8c08a');
    for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, 142 + ((i * 29) % 36), 2, 1, '#c4aa74');
    const fx = w * 0.35;
    for (let q = 0; q < 6; q++) rect(ctx, fx - 6 + q * 2, 156 - ((t * 30 + q * 7) % 12), 2, 3, q % 2 ? '#ffd23a' : '#ff6a2a');
    rect(ctx, fx - 8, 160, 16, 3, '#3a2414');
    fish(ctx, fx - 3, 158, false);
    boat(ctx, w * 0.8, 96);
    drawPerson(ctx, PLOOKS.jesus, fx - 22, 170, 'right', 0);
    drawPerson(ctx, PLOOKS.pedro, fx + 22, 170, 'left', 0);
    drawPerson(ctx, PLOOKS.joao, fx + 40, 168, 'left', 0);
    void dt;
  });
  if (paused) return <Stage cv={cv} />;
  const q = LOVE[k];
  return (
    <>
      <Stage cv={cv} />
      {phase === 'haul' && (
        <Qte
          kind="mash"
          title="153 peixes grandes!"
          hint="E a rede não se rompeu! Puxe sem parar!"
          look={PLOOKS.pedro}
          img={heroFace('pedro')}
          times={byDiff(diff, [12, 16, 20])}
          seconds={byDiff(diff, [5, 4.5, 4])}
          button="Puxar!"
          onDone={(ok) => ok && (engine.sfx('coin'), setPhase('talk'))}
        />
      )}
      {phase === 'talk' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl items-stretch gap-2">
          <Portrait look={reply ? PLOOKS.jesus : PLOOKS.jesus} img={heroFace('jesus')} className="h-24 w-24" />
          <div className="rpg-frame rpg-text flex flex-1 flex-col justify-center gap-2 px-3 py-2 text-lg leading-snug">
            <span className="text-sm text-[#ffe08a]">Jesus · pergunta {k + 1} de 3</span>
            {fix ?? (reply ? q.r : q.q)}
            <span className="flex flex-wrap gap-2">
              {reply ? (
                <button
                  onClick={() => {
                    setReply(false);
                    if (k + 1 < LOVE.length) setK(k + 1);
                    else {
                      engine.sfx('yay');
                      onWin(mistakes.current === 0 ? 3 : mistakes.current === 1 ? 2 : 1);
                    }
                  }}
                  className="rpg-wood h-11 flex-1 px-2 text-base"
                >
                  Continuar
                </button>
              ) : fix ? (
                <button onClick={() => setFix(null)} className="rpg-wood h-11 flex-1 px-2 text-base">
                  Pensar de novo
                </button>
              ) : (
                // The answers are shuffled each question: only the humble one is right.
                [q.a, ...q.wrong]
                  .map((text, i) => ({ text, i, o: (i * 7 + k * 3) % 3 }))
                  .sort((a, b) => a.o - b.o)
                  .map(({ text, i }) => (
                    <button
                      key={text}
                      onClick={() => {
                        if (i === 0) {
                          engine.playNote(72 + k * 2, 'bell', 0, 0.3);
                          buzz(20);
                          setReply(true);
                        } else {
                          engine.sfx('bonk');
                          mistakes.current += 1;
                          setFix(LOVE_FIX[(k + i) % LOVE_FIX.length]);
                        }
                      }}
                      className="rpg-wood min-h-11 w-full px-2 py-1 text-left text-sm"
                    >
                      “{text}”
                    </button>
                  ))
              )}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ================================================================ 6. Pentecost

export function Pentecost({ paused, onWin, diff = 1 }: GameProps) {
  const wrong = useRef(0);
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState(false);
  const score = useRef({ hit: 0, total: 0 });
  const [, setH] = useState(0);
  const [chart, setChart] = useState<{ notes: Note[]; start: number }>({ notes: [], start: 0 });
  useEffect(() => {
    if (paused) return;
    const list: Note[] = [];
    let t = 2;
    wrong.current = 0;
    const steps = byDiff(diff, [[0.75, 1, 0.75, 1], [0.5, 0.5, 1, 0.75], [0.5, 0.25, 0.5, 0.5, 0.75, 0.5]]);
    while (t < 24) {
      const lane = Math.floor(Math.random() * 4);
      list.push({ t, lane });
      if (diff === 2 && list.length % 6 === 0) list.push({ t: t + 0.001, lane: (lane + 2) % 4 });
      t += steps[list.length % steps.length];
    }
    score.current = { hit: 0, total: list.length };
    setChart({ notes: list, start: performance.now() });
    const t0 = engine.now + 2;
    for (let b = 0; b < 44; b++) {
      if (b % 2 === 0) engine.drum(b % 4 === 0 ? 'kick' : 'clap', t0 + b * 0.5, 0.4);
      if (b % 4 === 0) engine.bass([38, 45, 43, 38][(b / 4) % 4], t0 + b * 0.5, 1.8, 0.3);
    }
    const end = window.setTimeout(() => {
      const r = (score.current.hit - wrong.current * 0.5) / Math.max(1, score.current.total);
      if (r >= byDiff(diff, [0.55, 0.68, 0.78])) onWin(starsOf((r - 0.6) / 0.35));
      else setLost(true);
    }, 25500);
    return () => window.clearTimeout(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, run]);
  const cv = useStage((ctx, w, dt, t) => {
    SC.jerusalem(ctx, w, t);
    // Apostles with tongues of fire, and the crowd from every nation.
    for (let i = 0; i < 4; i++) {
      const x = 30 + i * 18;
      drawPerson(ctx, i === 0 ? PLOOKS.pedro : [PLOOKS.andre, PLOOKS.joao, { ...PLOOKS.andre, robe: '#5a6a8a' }][i - 1], x, 150, 'right', 0);
      rect(ctx, x - 1, 112 - Math.abs(Math.sin(t * 8 + i)) * 2, 3, 4, '#ff8a2a');
      rect(ctx, x, 110 - Math.abs(Math.sin(t * 8 + i)) * 2, 1, 2, '#ffe066');
    }
    const crowd: Look[] = [PLOOKS.povo, PLOOKS.romano, { ...PLOOKS.povo, robe: '#3a7a8a' }, { ...PLOOKS.serva, robe: '#a86a3a' }];
    for (let k = 0; k < 9; k++) drawPerson(ctx, crowd[k % 4], 110 + k * 13, 170 - (k % 2) * 8, 'left', 0);
    void dt;
  });
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <Panel className="absolute left-14 top-2 text-base">
            Convertidos: <span className="text-[#ffe08a]">{score.current.hit * 100}</span>
          </Panel>
          <Lanes
            key={run}
            notes={chart.notes}
            start={chart.start}
            labels={['Partos', 'Egito', 'Roma', 'Arábia']}
            colors={['#ff8a5a', '#e8c040', '#d8402a', '#5ab0ff']}
            approach={byDiff(diff, [1.6, 1.3, 1.1])}
            onWrong={() => {
              wrong.current += 1;
              buzz(12);
            }}
            keys={[['arrowleft', 'a', 'd'], ['arrowdown', 's', 'f'], ['arrowup', 'w', 'j'], ['arrowright', 'k']]}
            onHit={(n) => {
              score.current.hit += 1;
              engine.playNote([69, 72, 74, 76][n.lane], 'bell', 0, 0.25);
              buzz(10);
              setH((h) => h + 1);
            }}
            onMiss={() => setH((h) => h + 1)}
          />
        </>
      )}
      {lost && (
        <Retry
          text="Muitos não ouviram desta vez. Pregue de novo, no ritmo!"
          onRetry={() => {
            setLost(false);
            setRun((r) => r + 1);
          }}
        />
      )}
    </>
  );
}
