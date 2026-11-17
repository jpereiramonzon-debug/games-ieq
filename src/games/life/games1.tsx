/**
 * Jesus: o caminho — chapters 1 to 6. Each chapter has its own mechanic:
 * crowd navigation, desert survival, a scripture-shield boss, a measuring
 * puzzle, a sliding-block puzzle, a matching puzzle, an aiming game and a
 * food-distribution strategy game.
 */
import { useMemo, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Joystick } from '../pixel/Controls';
import { drawPerson, type Dir, type Look } from '../pixel/person';
import { burst, buzz, byDiff, Panel, Retry as RetryBase, Stage, starsOf, stepParts, useKeys, useStage, type GameProps, type Part } from '../pixel/stage';
import * as SC from '../david/scenes';
import { JLOOKS } from './content';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={JLOOKS.jesus} />;
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const AX: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
function useMoveKeys(keys: React.MutableRefObject<{ x: number; y: number }>, extra?: (k: string) => void, extraUp?: (k: string) => void) {
  useKeys(
    (k) => {
      if (AX[k]) keys.current = { x: AX[k][0] || keys.current.x, y: AX[k][1] || keys.current.y };
      extra?.(k);
    },
    (k) => {
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') keys.current = { ...keys.current, x: 0 };
      if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') keys.current = { ...keys.current, y: 0 };
      extraUp?.(k);
    },
  );
}
const dirOf = (x: number, y: number, prev: Dir): Dir => (!x && !y ? prev : Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up');

// ================================================================ 1. Baptism: through the crowd

export function Baptism({ paused, onWin, diff = 1 }: GameProps) {
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const keys = useRef({ x: 0, y: 0 });
  const TIME = byDiff(diff, [70, 55, 42]);
  const st = useRef(fresh());
  function fresh() {
    return { x: 18, y: 160, dir: 'right' as Dir, walked: 0, stun: 0, bumps: 0, time: TIME, crowd: [] as { x: number; y: number; v: number; look: Look }[], won: false, dove: -1, parts: [] as Part[] };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const river = w * 0.62;
    if (!s.crowd.length) {
      const looks = [JLOOKS.servo, JLOOKS.amigo, JLOOKS.marta, JLOOKS.fariseu, JLOOKS.menino, JLOOKS.andre, JLOOKS.paralitico];
      const rows = byDiff(diff, [5, 6, 7]);
      for (let i = 0; i < rows; i++)
        for (let k = 0; k < 2; k++) s.crowd.push({ x: Math.random() * river, y: 56 + i * (110 / rows), v: (k ? -1 : 1) * byDiff(diff, [18, 26, 34]) * (0.7 + Math.random() * 0.6), look: looks[(i + k * 3) % looks.length] });
    }
    const goal = { x: w * 0.82, y: 92 };
    const live = !paused && !lost && !s.won;
    if (live) {
      s.time -= dt;
      if (s.time <= 0) setLost(true);
      s.stun = Math.max(0, s.stun - dt);
      if (!s.stun) {
        const k = keys.current;
        const len = Math.max(1, Math.hypot(k.x, k.y));
        const sp = (s.x > river ? 30 : 56) * dt;
        s.x = Math.max(8, Math.min(w - 8, s.x + (k.x / len) * sp));
        s.y = Math.max(50, Math.min(174, s.y + (k.y / len) * sp));
        s.walked += Math.hypot(k.x, k.y) * sp;
        s.dir = dirOf(k.x, k.y, s.dir);
      }
      for (const c of s.crowd) {
        c.x += c.v * dt;
        if (c.x < 6 || c.x > river - 6) c.v *= -1;
        if (!s.stun && Math.abs(c.x - s.x) < 10 && Math.abs(c.y - s.y) < 7) {
          s.stun = 0.5;
          s.bumps += 1;
          s.x = Math.max(8, s.x - 18);
          engine.sfx('bump');
          buzz(25);
        }
      }
      if (Math.hypot(goal.x - s.x, goal.y - s.y) < 14) {
        s.won = true;
        s.dove = t;
        engine.sfx('power');
        window.setTimeout(() => onWin(starsOf(1 - s.bumps * 0.18 + (s.time / TIME) * 0.3)), 2200);
      }
      if (Math.floor(t * 5) !== Math.floor((t - dt) * 5)) setH((h) => h + 1);
    }
    // Riverbank, reeds and the Jordan.
    SC.sky(ctx, w, ['#86c0e4', '#a2d0ea', '#bedcee', '#d8eaf0'], 40);
    SC.hills(ctx, w, 46, '#a8a870', 6, 0.04, 2);
    rect(ctx, 0, 46, w, 134, '#c8b07a');
    for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, 50 + ((i * 29) % 128), 2, 1, '#b49a66');
    for (let y = 46; y < 180; y++) {
      const edge = river + Math.sin(y / 9) * 4;
      rect(ctx, edge, y, w - edge, 1, (y + Math.floor(t * 6)) % 7 === 0 ? '#7ab4dc' : '#3a7ab0');
      rect(ctx, edge - 2, y, 2, 1, '#e8f0f4');
    }
    for (let k = 0; k < 12; k++) rect(ctx, river - 6 + (k % 3) * 2, 48 + k * 11, 1, 6, '#5a8a32');
    const list: { y: number; d: () => void }[] = [];
    for (const c of s.crowd) list.push({ y: c.y, d: () => drawPerson(ctx, c.look, c.x, c.y, c.v > 0 ? 'right' : 'left', Math.floor(t * 6 + c.x) % 4) });
    list.push({ y: goal.y, d: () => drawPerson(ctx, JLOOKS.batista, goal.x, goal.y, 'left', 0) });
    list.push({ y: s.y, d: () => drawPerson(ctx, JLOOKS.jesus, s.x, s.y, s.dir, keys.current.x || keys.current.y ? Math.floor(s.walked / 6) % 4 : 0) });
    list.sort((a, b) => a.y - b.y).forEach((e) => e.d());
    if (s.x > river) rect(ctx, s.x - 7, s.y - 6, 14, 6, 'rgba(58,122,176,0.8)');
    // The heavens open and the dove descends.
    if (s.dove >= 0) {
      const k = Math.min(1, (t - s.dove) / 1.8);
      ctx.fillStyle = `rgba(255,240,180,${0.5 * k})`;
      ctx.beginPath();
      ctx.moveTo(s.x - 6, 0);
      ctx.lineTo(s.x + 6, 0);
      ctx.lineTo(s.x + 22, s.y);
      ctx.lineTo(s.x - 22, s.y);
      ctx.fill();
      const dy = k * (s.y - 46);
      SC.blob(ctx, s.x, dy + 6, 5, 3.5, '#f4f4f8');
      rect(ctx, s.x - 9, dy + 4 - (Math.floor(t * 10) % 2) * 3, 18, 2, '#e8e8f0');
    }
  });
  useMoveKeys(keys);
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex gap-2">
            <Panel className="text-base">Chegue até João · {Math.max(0, Math.ceil(s.time))} s</Panel>
            <Panel className="text-base">Esbarrões: {s.bumps}</Panel>
          </div>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (keys.current = { x, y })} />
        </>
      )}
      {lost && (
        <Retry
          text="O tempo passou! Observe o ritmo das pessoas e atravesse pelas brechas."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 2a. Forty days: survival

export function Desert({ paused, onWin, diff = 1 }: GameProps) {
  const [lost, setLost] = useState<string | null>(null);
  const [, setH] = useState(0);
  const keys = useRef({ x: 0, y: 0 });
  const praying = useRef(false);
  const DUR = 48;
  const st = useRef(fresh());
  function fresh() {
    return { x: 160, y: 120, dir: 'down' as Dir, walked: 0, body: 100, spirit: 100, time: 0, won: false };
  }
  const CYCLE = 8; // seconds per day/night
  const shade = [
    [0.2, 70],
    [0.55, 140],
    [0.85, 90],
  ];
  const caves = [
    [0.12, 150],
    [0.7, 62],
  ];
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.won;
    const day = Math.floor(s.time / CYCLE) % 2 === 0;
    const inShade = shade.some(([x, y]) => Math.hypot(x * w - s.x, y - s.y) < 18);
    const inCave = caves.some(([x, y]) => Math.hypot(x * w - s.x, y - s.y) < 16);
    if (live) {
      s.time += dt;
      const k = keys.current;
      if (!praying.current) {
        const len = Math.max(1, Math.hypot(k.x, k.y));
        s.x = Math.max(10, Math.min(w - 10, s.x + (k.x / len) * 48 * dt));
        s.y = Math.max(54, Math.min(172, s.y + (k.y / len) * 48 * dt));
        s.walked += Math.hypot(k.x, k.y) * 48 * dt;
        s.dir = dirOf(k.x, k.y, s.dir);
      }
      const rate = byDiff(diff, [0.7, 1, 1.35]);
      // Heat by day outside the shade, cold by night outside the caves.
      if (day && !inShade) s.body -= 7 * rate * dt;
      else if (!day && !inCave) s.body -= 6 * rate * dt;
      else s.body = Math.min(100, s.body + 2 * dt);
      s.spirit += (praying.current ? 16 : -6 * rate) * dt;
      s.spirit = Math.min(100, s.spirit);
      if (s.body <= 0) setLost('O corpo não resistiu. De dia, procure a sombra; à noite, o abrigo das cavernas.');
      if (s.spirit <= 0) setLost('O espírito enfraqueceu. Pare para orar sempre que estiver protegido.');
      if (s.time >= DUR && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf((s.body + s.spirit) / 200 + 0.2)), 800);
      }
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    // Desert, sun or moon, shade trees and caves.
    SC.sky(ctx, w, day ? ['#f0c890', '#f4d8a8', '#f8e4c0', '#faecd0'] : ['#141a34', '#1c2442', '#242e50', '#2e385c'], 50);
    rect(ctx, 0, 50, w, 130, day ? '#e0c088' : '#5a5a6a');
    for (let i = 0; i < w; i++) rect(ctx, (i * 43) % w, 52 + ((i * 31) % 126), 2, 1, day ? '#caa870' : '#4a4a5a');
    ctx.fillStyle = day ? '#fff4c0' : '#e8e8f8';
    ctx.beginPath();
    ctx.arc(w * (0.15 + ((s.time % CYCLE) / CYCLE) * 0.7), 22, day ? 9 : 6, 0, Math.PI * 2);
    ctx.fill();
    for (const [x, y] of shade) {
      ctx.fillStyle = 'rgba(40,24,10,0.28)';
      ctx.beginPath();
      ctx.ellipse(x * w, y, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      rect(ctx, x * w - 2, y - 26, 3, 26, '#5a3a1e');
      SC.blob(ctx, x * w, y - 28, 14, 7, day ? '#6a8a3a' : '#3a4a3a');
    }
    for (const [x, y] of caves) {
      SC.blob(ctx, x * w, y - 8, 20, 12, day ? '#9a8a70' : '#5a5050');
      rect(ctx, x * w - 7, y - 10, 14, 10, '#1a120c');
    }
    drawPerson(ctx, JLOOKS.jesus, s.x, s.y, praying.current ? 'up' : s.dir, !praying.current && (keys.current.x || keys.current.y) ? Math.floor(s.walked / 6) % 4 : 0);
    if (praying.current) {
      ctx.fillStyle = 'rgba(255,240,180,0.3)';
      ctx.beginPath();
      ctx.arc(s.x, s.y - 14, 14 + Math.sin(t * 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!day) {
      ctx.fillStyle = 'rgba(20,20,60,0.25)';
      ctx.fillRect(0, 0, w, 180);
    }
  });
  useMoveKeys(
    keys,
    (k) => (k === ' ' || k === 'enter') && (praying.current = true),
    (k) => (k === ' ' || k === 'enter') && (praying.current = false),
  );
  const s = st.current;
  const day = Math.floor(s.time / CYCLE) % 2 === 0;
  const bar = (v: number, c: string) => (
    <span className="h-3 w-16 border-2 border-[#3a2414] bg-[#4a4250]">
      <span className={cx('block h-full', v < 30 ? 'animate-pulse bg-[#d8402a]' : c)} style={{ width: `${Math.max(0, v)}%` }} />
    </span>
  );
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">
              Dia {Math.min(40, Math.floor((s.time / DUR) * 40) + 1)} de 40 · {day ? 'sol: busque sombra' : 'frio: busque a caverna'}
            </Panel>
            <Panel className="flex items-center gap-1.5 text-base">Corpo {bar(s.body, 'bg-[#e0a020]')}</Panel>
            <Panel className="flex items-center gap-1.5 text-base">Espírito {bar(s.spirit, 'bg-[#ffe066]')}</Panel>
          </div>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (keys.current = { x, y })} />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              praying.current = true;
            }}
            onPointerUp={() => (praying.current = false)}
            onPointerCancel={() => (praying.current = false)}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#e8b830] text-lg leading-tight text-[#3a2414] shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Orar
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {lost && (
        <Retry
          text={lost}
          onRetry={() => {
            st.current = fresh();
            setLost(null);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 2b. The tempter: shield of the Word

const WORDS = [
  { id: 0, label: 'Nem só de pão', icon: 'pão' },
  { id: 1, label: 'Não tentarás', icon: 'altura' },
  { id: 2, label: 'Só a Deus adorarás', icon: 'glória' },
];

function drawTemptation(ctx: CanvasRenderingContext2D, kind: number, x: number, y: number, t: number) {
  ctx.fillStyle = 'rgba(120,40,90,0.45)';
  ctx.beginPath();
  ctx.arc(x, y, 10 + Math.sin(t * 8) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  if (kind === 0) {
    SC.blob(ctx, x, y, 7, 4.5, '#d8a050');
    rect(ctx, x - 4, y - 2, 2, 1, '#f0c878');
    rect(ctx, x + 1, y - 2, 2, 1, '#f0c878');
  } else if (kind === 1) {
    rect(ctx, x - 4, y - 8, 8, 16, '#2a1a10');
    rect(ctx, x - 3, y - 7, 6, 14, '#d8c8a0');
    rect(ctx, x - 5, y - 9, 10, 2, '#e8b830');
    rect(ctx, x - 1, y - 4, 2, 3, '#3a2a20');
  } else {
    rect(ctx, x - 7, y - 3, 14, 7, '#2a1a10');
    rect(ctx, x - 6, y - 2, 12, 5, '#e8b830');
    for (const k of [-6, -1, 4]) rect(ctx, x + k, y - 7, 2, 4, '#e8b830');
    rect(ctx, x - 1, y, 2, 2, '#d8402a');
  }
}

export function WordShield({ paused, onWin, diff = 1 }: GameProps) {
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { hp: 100, faith: 100, orbs: [] as { x: number; y: number; vx: number; vy: number; kind: number; back: boolean; swap: boolean }[], spawn: 1.2, flash: 0, shake: 0, won: false, parts: [] as Part[], w: 320, combo: 0 };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    const jx = w * 0.16;
    const jy = 132;
    const tx = w * 0.82;
    const ty = 70 + Math.sin(t * 1.3) * 10;
    const phase = s.hp > 66 ? 0 : s.hp > 33 ? 1 : 2;
    const live = !paused && !lost && !s.won;
    if (live) {
      s.spawn -= dt;
      if (s.spawn <= 0) {
        const kinds = phase === 0 ? [0] : phase === 1 ? [0, 1] : [0, 1, 2];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const sp = byDiff(diff, [58, 74, 92]) * (1 + phase * 0.18);
        const d = Math.hypot(jx - tx, jy - ty);
        s.orbs.push({ x: tx, y: ty, vx: ((jx - tx) / d) * sp, vy: ((jy - ty) / d) * sp, kind, back: false, swap: diff === 2 && phase === 2 && Math.random() < 0.35 });
        s.spawn = byDiff(diff, [1.9, 1.5, 1.15]) - phase * 0.2;
      }
      for (const o of s.orbs) {
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        // On hard, some temptations change shape halfway: watch until the end!
        if (o.swap && !o.back && o.x < w * 0.45) {
          o.swap = false;
          o.kind = (o.kind + 1 + Math.floor(Math.random() * 2)) % 3;
        }
        if (o.back && o.x > tx - 10) {
          o.x = 9999;
          s.hp -= byDiff(diff, [9, 7, 6]);
          s.shake = 0.2;
          burst(s.parts, tx, ty, '#ffe066', 14);
          engine.drum('crash', 0, 0.5);
          if (s.hp <= 0 && !s.won) {
            s.won = true;
            engine.sfx('yay');
            window.setTimeout(() => onWin(starsOf(s.faith / 100)), 1200);
          }
        }
        if (!o.back && o.x < jx + 6) {
          o.x = -9999;
          s.faith -= 18;
          s.combo = 0;
          s.flash = 0.25;
          engine.sfx('hurt');
          buzz([50, 30, 50]);
          if (s.faith <= 0) setLost(true);
        }
      }
      s.orbs = s.orbs.filter((o) => o.x > -100 && o.x < 2000);
      s.flash = Math.max(0, s.flash - dt);
      s.shake = Math.max(0, s.shake - dt);
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    // Desert at dusk; the pinnacle of the temple in the distance.
    SC.sky(ctx, w, ['#5a3a5a', '#8a4a5a', '#c86a5a', '#e89a6a'], 110);
    SC.hills(ctx, w, 112, '#8a6a5a', 12, 0.03, 4);
    rect(ctx, w * 0.55, 60, 10, 52, '#6a5a5a');
    rect(ctx, w * 0.55 - 3, 56, 16, 5, '#6a5a5a');
    rect(ctx, 0, 112, w, 68, '#c8a070');
    // The shield range.
    ctx.strokeStyle = 'rgba(255,240,180,0.35)';
    ctx.beginPath();
    ctx.arc(jx, jy - 14, 70, -1.2, 1.2);
    ctx.stroke();
    drawPerson(ctx, JLOOKS.jesus, jx, jy, 'right', 0);
    const sx = s.shake > 0 ? Math.round(Math.sin(t * 60) * 3) : 0;
    ctx.globalAlpha = 0.85 + Math.sin(t * 3) * 0.1;
    SC.bigPerson(ctx, JLOOKS.tentador, tx + sx, ty + 36, 2, 'left', 0);
    ctx.globalAlpha = 1;
    for (const o of s.orbs) drawTemptation(ctx, o.kind, o.x, o.y, t);
    SC.particlesDraw(ctx, s.parts);
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(120,0,40,${s.flash})`;
      ctx.fillRect(0, 0, w, 180);
    }
  });
  const answer = (id: number) => {
    const s = st.current;
    if (paused || lost || s.won) return;
    const jx = s.w * 0.16;
    const o = s.orbs.filter((q) => !q.back && q.x - jx < 74).sort((a, b) => a.x - b.x)[0];
    if (!o) {
      // Quoting without a temptation in reach is just noise.
      s.faith -= 4;
      engine.playNote(50, 'pluck', 0, 0.2);
      setH((h) => h + 1);
      return;
    }
    if (o.kind === id) {
      o.back = true;
      o.vx = Math.abs(o.vx) * 2.2;
      o.vy = -o.vy * 0.5;
      s.combo += 1;
      engine.playNote(76 + Math.min(12, s.combo), 'bell', 0, 0.35);
      buzz(20);
      burst(s.parts, o.x, o.y, '#ffffff', 8);
    } else {
      s.faith -= 10;
      s.combo = 0;
      engine.sfx('bonk');
      buzz([30, 30, 30]);
    }
    setH((h) => h + 1);
  };
  useKeys((k) => {
    if (k === '1' || k === 'arrowleft') answer(0);
    if (k === '2' || k === 'arrowup') answer(1);
    if (k === '3' || k === 'arrowright') answer(2);
  });
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Tentador
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#8a3a6a] transition-[width]" style={{ width: `${Math.max(0, s.hp)}%` }} />
              </span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Fé
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full transition-[width]', s.faith > 35 ? 'bg-[#ffe066]' : 'animate-pulse bg-[#d8402a]')} style={{ width: `${Math.max(0, s.faith)}%` }} />
              </span>
            </Panel>
            {s.combo > 2 && <span className="rpg-text animate-pop text-xl text-[#ffe066]">{s.combo} seguidas!</span>}
          </div>
          <div className="absolute inset-x-2 bottom-2 mx-auto grid max-w-2xl grid-cols-3 gap-1.5">
            {WORDS.map((wd) => (
              <button key={wd.id} onPointerDown={(e) => (e.preventDefault(), answer(wd.id))} className="rpg-wood rpg-text flex h-16 touch-none flex-col items-center justify-center text-base leading-tight active:translate-y-0.5">
                “{wd.label}”<span className="text-xs text-[#ffe08a]">contra: {wd.icon}</span>
              </button>
            ))}
          </div>
        </>
      )}
      {lost && (
        <Retry
          text="A fé se abalou. Espere a tentação chegar perto, olhe bem o que ela é, e responda com a Palavra certa."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 3. Cana: the water jars (measuring puzzle)

/** Fewest actions to pour exactly `target` into a jar using jugs of 5 and 3. */
function parFor(target: number) {
  const key = (a: number, b: number, p: number) => `${a},${b},${p}`;
  const seen = new Map<string, number>([[key(0, 0, 0), 0]]);
  const q: [number, number, number][] = [[0, 0, 0]];
  while (q.length) {
    const [a, b, p] = q.shift()!;
    const d = seen.get(key(a, b, p))!;
    if (p === target) return d;
    const next: [number, number, number][] = [
      [5, b, p],
      [a, 3, p],
      [0, b, p],
      [a, 0, p],
      [a - Math.min(a, 3 - b), b + Math.min(a, 3 - b), p],
      [a + Math.min(b, 5 - a), b - Math.min(b, 5 - a), p],
      [0, b, p + a],
      [a, 0, p + b],
    ];
    for (const n of next) {
      if (n[2] > target) continue;
      const k = key(...n);
      if (!seen.has(k)) {
        seen.set(k, d + 1);
        q.push(n);
      }
    }
  }
  return 99;
}

export function Cana({ paused, onWin, diff = 1 }: GameProps) {
  const targets = useMemo(() => byDiff(diff, [[4, 3, 6], [4, 7, 1, 8], [4, 7, 1, 6, 2, 8]]), [diff]);
  const par = useMemo(() => targets.reduce((n, x) => n + parFor(x), 0), [targets]);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [jars, setJars] = useState<number[]>(() => targets.map(() => 0));
  const [sel, setSel] = useState<'a' | 'b' | null>(null);
  const [moves, setMoves] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [blessed, setBlessed] = useState(false);
  const cv = useStage((ctx, w, dt, t) => {
    // Wedding courtyard with lamps and guests.
    rect(ctx, 0, 0, w, 180, '#3a2a20');
    rect(ctx, 0, 0, w, 96, '#d8bc88');
    for (let x = 0; x < w; x += 12) for (let y = 4; y < 94; y += 6) rect(ctx, x + ((y / 6) % 2) * 6, y, 1, 5, '#c0a070');
    for (let x = 20; x < w; x += 60) {
      rect(ctx, x, 10, 2, 16, '#5a3a1e');
      ctx.fillStyle = `rgba(255,200,100,${0.25 + Math.sin(t * 5 + x) * 0.08})`;
      ctx.beginPath();
      ctx.arc(x + 1, 28, 9, 0, Math.PI * 2);
      ctx.fill();
      rect(ctx, x - 2, 26, 6, 4, '#ffd060');
    }
    rect(ctx, 0, 96, w, 84, '#a88a5a');
    for (const [i, lk] of [JLOOKS.maria, JLOOKS.servo, JLOOKS.mestre, JLOOKS.amigo, JLOOKS.marta].entries()) drawPerson(ctx, lk, 18 + i * 22, 98, 'down', Math.floor(t * 3 + i) % 2);
    drawPerson(ctx, JLOOKS.jesus, w - 20, 100, 'left', 0);
    void dt;
  });
  const done = jars.every((v, i) => v === targets[i]);
  const act = (fn: () => void) => {
    if (paused || blessed) return;
    fn();
    setMoves((m) => m + 1);
    engine.playNote(60 + Math.floor(Math.random() * 7), 'pluck', 0, 0.2);
  };
  const pourTo = (i: number) => {
    if (!sel) return setMsg('Escolha um cântaro primeiro.');
    const v = sel === 'a' ? a : b;
    if (!v) return setMsg('Esse cântaro está vazio.');
    act(() => {
      const nv = jars[i] + v;
      if (nv > targets[i]) {
        engine.sfx('bonk');
        buzz([30, 30, 30]);
        setMsg('Passou da marca! A talha transbordou e foi esvaziada.');
        setJars(jars.map((x, k) => (k === i ? 0 : x)));
      } else {
        setJars(jars.map((x, k) => (k === i ? nv : x)));
        setMsg(nv === targets[i] ? 'Na medida certa!' : null);
        if (nv === targets[i]) buzz(20);
      }
      if (sel === 'a') setA(0);
      else setB(0);
    });
  };
  const reset = () => {
    setA(0);
    setB(0);
    setJars(targets.map(() => 0));
    setMoves(0);
    setMsg(null);
    setSel(null);
  };
  const jug = (id: 'a' | 'b', v: number, cap: number) => (
    <button
      onClick={() => setSel(id)}
      className={cx('rpg-wood relative flex h-24 w-20 flex-col items-center justify-end p-1', sel === id && 'outline outline-2 outline-[#ffe08a] brightness-110')}
      aria-label={`Cântaro de ${cap}: tem ${v}`}
    >
      <span className="absolute inset-x-3 bottom-2 top-3 border-2 border-[#3a2414] bg-[#c08a5a]">
        <span className="absolute inset-x-0 bottom-0 bg-[#5ab0e0] transition-[height]" style={{ height: `${(v / cap) * 100}%` }} />
      </span>
      <span className="rpg-text relative text-lg">
        {v}/{cap}
      </span>
    </button>
  );
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      <div className="absolute inset-x-2 bottom-2 top-14 mx-auto flex max-w-4xl gap-2">
        <div className="rpg-frame rpg-text flex flex-col gap-1.5 p-2">
          <span className="text-sm text-[#ffe08a]">Cântaros</span>
          <div className="flex gap-1.5">
            {jug('a', a, 5)}
            {jug('b', b, 3)}
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <button className="rpg-wood py-1" onClick={() => act(() => (sel === 'b' ? setB(3) : setA(5)))}>
              Encher no poço
            </button>
            <button className="rpg-wood py-1" onClick={() => act(() => (sel === 'b' ? setB(0) : setA(0)))}>
              Esvaziar
            </button>
            <button
              className="rpg-wood col-span-2 py-1"
              onClick={() =>
                act(() => {
                  if (sel === 'b') {
                    const m = Math.min(b, 5 - a);
                    setA(a + m);
                    setB(b - m);
                  } else {
                    const m = Math.min(a, 3 - b);
                    setA(a - m);
                    setB(b + m);
                  }
                })
              }
            >
              Passar para o outro cântaro
            </button>
          </div>
          <span className="text-xs opacity-80">{sel ? `Selecionado: cântaro de ${sel === 'a' ? 5 : 3}` : 'Toque num cântaro'}</span>
        </div>
        <div className="rpg-frame rpg-text flex min-w-0 flex-1 flex-col gap-1.5 p-2">
          <span className="flex items-center justify-between text-sm text-[#ffe08a]">
            <span>Talhas de pedra · toque para despejar</span>
            <span>
              Ações: {moves} (ideal ≈ {par})
            </span>
          </span>
          <div className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-6">
            {targets.map((tg, i) => (
              <button key={i} onClick={() => pourTo(i)} className={cx('relative flex flex-col items-center justify-end rounded-sm border-[3px] border-[#3a2414] bg-[#a8a090] p-1', jars[i] === tg && 'outline outline-2 outline-[#8af06a]')}>
                <span className="absolute inset-x-2 bottom-6 top-2 bg-[#6a6258]">
                  <span className={cx('absolute inset-x-0 bottom-0 transition-[height]', blessed ? 'bg-[#8a1a3a]' : 'bg-[#5ab0e0]')} style={{ height: `${(jars[i] / 8) * 100}%` }} />
                  <span className="absolute inset-x-0 border-t-2 border-dashed border-[#ffe08a]" style={{ bottom: `${(tg / 8) * 100}%` }} />
                </span>
                <span className="relative text-sm">
                  {jars[i]}/{tg}
                </span>
              </button>
            ))}
          </div>
          <span className="flex gap-1.5">
            <span className="flex-1 self-center text-sm">{msg}</span>
            <button className="rpg-wood px-3 py-1 text-sm" onClick={reset}>
              Recomeçar
            </button>
            <button
              disabled={!done || blessed}
              className={cx('rpg-wood px-3 py-1 text-base', done && !blessed ? 'animate-blink text-[#ffe08a]' : 'opacity-50')}
              onClick={() => {
                setBlessed(true);
                engine.sfx('power');
                buzz([40, 30, 80]);
                window.setTimeout(() => onWin(starsOf(1 - Math.max(0, moves - par) / (par * 1.2))), 1400);
              }}
            >
              Levai ao mestre-sala
            </button>
          </span>
        </div>
      </div>
    </>
  );
}

// ================================================================ 4. Through the roof (sliding blocks)

const ROOF_LEVELS = [
  ['..FBE.', '..FBE.', 'XX..G.', '..A.G.', '..A.CC', '..DD..'],
  ['....E.', '..D.E.', 'XXD.E.', '.BGCFF', '.BGCAA', '......'],
  ['E...CC', 'E...D.', 'XXG.DF', '..G..F', 'AAABBF', '......'],
];
const ROOF_PAR = [5, 11, 17];

interface Piece {
  id: string;
  r: number;
  c: number;
  len: number;
  horiz: boolean;
}

function parseRoof(rows: string[]): Piece[] {
  const cells: Record<string, [number, number][]> = {};
  rows.forEach((row, r) => [...row].forEach((ch, c) => ch !== '.' && (cells[ch] ??= []).push([r, c])));
  return Object.entries(cells).map(([id, v]) => {
    v.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    return { id, r: v[0][0], c: v[0][1], len: v.length, horiz: v.length > 1 && v[1][0] === v[0][0] };
  });
}

export function Roof({ paused, onWin, diff = 1 }: GameProps) {
  const level = byDiff(diff, [0, 1, 2]);
  const [pieces, setPieces] = useState(() => parseRoof(ROOF_LEVELS[level]));
  const [sel, setSel] = useState<string>('X');
  const [moves, setMoves] = useState(0);
  const lastMove = useRef('');
  const [won, setWon] = useState(false);
  const cv = useStage((ctx, w, dt, t) => {
    SC.sky(ctx, w, ['#86c0e4', '#a2d0ea', '#bedcee', '#d8eaf0'], 60);
    rect(ctx, 0, 60, w, 120, '#c8a878');
    for (let i = 0; i < 8; i++) drawPerson(ctx, [JLOOKS.servo, JLOOKS.fariseu, JLOOKS.marta, JLOOKS.amigo][i % 4], 10 + i * 14, 176, 'up', Math.floor(t * 3 + i) % 2);
    void dt;
  });
  const occ = (ps: Piece[], skip: string) => {
    const g: (string | null)[][] = Array.from({ length: 6 }, () => Array(6).fill(null));
    for (const p of ps) if (p.id !== skip) for (let i = 0; i < p.len; i++) g[p.r + (p.horiz ? 0 : i)][p.c + (p.horiz ? i : 0)] = p.id;
    return g;
  };
  const move = (dir: -1 | 1) => {
    if (paused || won) return;
    const p = pieces.find((q) => q.id === sel)!;
    const g = occ(pieces, p.id);
    const nr = p.horiz ? p.r : p.r + dir;
    const nc = p.horiz ? p.c + dir : p.c;
    const cells = Array.from({ length: p.len }, (_, i) => [nr + (p.horiz ? 0 : i), nc + (p.horiz ? i : 0)]);
    if (cells.some(([r, c]) => r < 0 || c < 0 || r > 5 || c > 5 || g[r][c])) {
      engine.sfx('bump');
      buzz(15);
      return;
    }
    const next = pieces.map((q) => (q.id === p.id ? { ...q, r: nr, c: nc } : q));
    setPieces(next);
    const sig = `${p.id}${dir}`;
    if (sig !== lastMove.current) setMoves((m) => m + 1);
    lastMove.current = sig;
    engine.playNote(62 + (p.id === 'X' ? 7 : 0), 'pluck', 0, 0.2);
    const x = next.find((q) => q.id === 'X')!;
    if (x.c + x.len === 6) {
      setWon(true);
      engine.sfx('yay');
      buzz([40, 30, 80]);
      window.setTimeout(() => onWin(starsOf(1 - Math.max(0, moves + 1 - ROOF_PAR[level]) / (ROOF_PAR[level] * 1.5))), 1200);
    }
  };
  useKeys((k) => {
    const p = pieces.find((q) => q.id === sel);
    if (!p) return;
    if (p.horiz && (k === 'arrowleft' || k === 'a')) move(-1);
    if (p.horiz && (k === 'arrowright' || k === 'd')) move(1);
    if (!p.horiz && (k === 'arrowup' || k === 'w')) move(-1);
    if (!p.horiz && (k === 'arrowdown' || k === 's')) move(1);
  });
  const color = (id: string) => (id === 'X' ? '#f0ece0' : ['#9a6234', '#c8703a', '#8a7a5a', '#6a8a5a', '#a8503a', '#7a6aa8'][id.charCodeAt(0) % 6]);
  const p = pieces.find((q) => q.id === sel)!;
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      <div className="absolute inset-y-2 left-[max(3.5rem,env(safe-area-inset-left))] right-2 flex items-center justify-center gap-3">
        <div className="relative aspect-square h-full max-h-[22rem] border-[4px] border-[#3a2414] bg-[#b8885a]">
          {Array.from({ length: 36 }, (_, i) => (
            <span key={i} className="absolute border border-[#9a6a3a]/60" style={{ left: `${(i % 6) * (100 / 6)}%`, top: `${Math.floor(i / 6) * (100 / 6)}%`, width: `${100 / 6}%`, height: `${100 / 6}%` }} />
          ))}
          {/* The opening over Jesus */}
          <span className="absolute -right-3 top-[33.3%] grid h-[16.6%] w-3 place-items-center bg-[#1a0e08]" aria-hidden />
          {pieces.map((q) => (
            <button
              key={q.id}
              onClick={() => setSel(q.id)}
              aria-label={q.id === 'X' ? 'Maca' : `Peça ${q.id}`}
              className={cx('absolute grid place-items-center border-[3px] border-[#2a1a10] transition-all duration-150', sel === q.id && 'z-10 outline outline-[3px] outline-[#ffe08a]')}
              style={{
                left: `calc(${(q.c * 100) / 6}% + 2px)`,
                top: `calc(${(q.r * 100) / 6}% + 2px)`,
                width: `calc(${((q.horiz ? q.len : 1) * 100) / 6}% - 4px)`,
                height: `calc(${((q.horiz ? 1 : q.len) * 100) / 6}% - 4px)`,
                background: color(q.id),
              }}
            >
              <span className="rpg-text text-xs">{q.id === 'X' ? 'MACA' : q.horiz ? '⇆' : '⇅'}</span>
            </button>
          ))}
        </div>
        <div className="rpg-frame rpg-text flex w-44 flex-col gap-1.5 p-2 text-sm">
          <span className="text-[#ffe08a]">Leve a maca até a abertura →</span>
          <span>
            Movimentos: {moves} (ideal {ROOF_PAR[level]})
          </span>
          <span className="grid grid-cols-2 gap-1.5">
            <button className="rpg-wood h-14 text-2xl" onClick={() => move(-1)} aria-label="Mover para trás">
              {p.horiz ? '◀' : '▲'}
            </button>
            <button className="rpg-wood h-14 text-2xl" onClick={() => move(1)} aria-label="Mover para frente">
              {p.horiz ? '▶' : '▼'}
            </button>
          </span>
          <button
            className="rpg-wood h-9"
            onClick={() => {
              setPieces(parseRoof(ROOF_LEVELS[level]));
              setMoves(0);
              setSel('X');
              lastMove.current = '';
            }}
          >
            Recomeçar
          </button>
          <span className="text-xs opacity-80">Toque numa peça e use as setas. Cada peça só anda no próprio sentido.</span>
        </div>
      </div>
    </>
  );
}

// ================================================================ 5a. Beatitudes (matching)

const BEATITUDES: [string, string][] = [
  ['Bem-aventurados os pobres de espírito', 'porque deles é o Reino dos céus.'],
  ['Bem-aventurados os que choram', 'porque eles serão consolados.'],
  ['Bem-aventurados os mansos', 'porque eles herdarão a terra.'],
  ['Bem-aventurados os que têm fome e sede de justiça', 'porque eles serão fartos.'],
  ['Bem-aventurados os misericordiosos', 'porque eles alcançarão misericórdia.'],
  ['Bem-aventurados os limpos de coração', 'porque eles verão a Deus.'],
  ['Bem-aventurados os pacificadores', 'porque eles serão chamados filhos de Deus.'],
  ['Bem-aventurados os perseguidos por causa da justiça', 'porque deles é o Reino dos céus.'],
];
const DECOYS = ['porque eles ficarão ricos.', 'porque eles nunca vão sofrer.', 'porque eles terão muitos seguidores.'];

export function Beatitudes({ paused, onWin, diff = 1 }: GameProps) {
  const LIVES = byDiff(diff, [5, 3, 2]);
  const set = useMemo(() => BEATITUDES.slice(0, byDiff(diff, [5, 8, 8])), [diff]);
  const ends = useMemo(() => [...set.map((b) => b[1]), ...DECOYS.slice(0, byDiff(diff, [0, 1, 3]))].sort(() => Math.random() - 0.5), [set]);
  const [left, setLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<number[]>([]);
  const [usedEnds, setUsedEnds] = useState<number[]>([]);
  const [lives, setLives] = useState(LIVES);
  const [shake, setShake] = useState(0);
  const cv = useStage((ctx, w, dt, t) => {
    SC.sky(ctx, w, ['#8ac0e4', '#a2d0ea', '#bcdcee', '#d4e8f0'], 80);
    SC.hills(ctx, w, 90, '#7a9a4a', 18, 0.02, 2);
    rect(ctx, 0, 100, w, 80, '#8aac58');
    drawPerson(ctx, JLOOKS.jesus, w * 0.5, 96, 'down', 0);
    for (let i = 0; i < 12; i++) drawPerson(ctx, [JLOOKS.servo, JLOOKS.marta, JLOOKS.amigo, JLOOKS.menino][i % 4], 20 + i * ((w - 40) / 11), 130 + (i % 3) * 14, 'up', 0);
    void dt;
    void t;
  });
  const pick = (ei: number) => {
    if (left === null || paused || lives <= 0) return;
    const ok = ends[ei] === set[left][1];
    if (ok) {
      engine.playNote(72 + matched.length * 2, 'bell', 0, 0.3);
      buzz(20);
      const m = [...matched, left];
      setMatched(m);
      setUsedEnds([...usedEnds, ei]);
      setLeft(null);
      if (m.length === set.length) {
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf(lives / LIVES)), 900);
      }
    } else {
      engine.sfx('bonk');
      buzz([30, 30, 30]);
      setLives(lives - 1);
      setShake((x) => x + 1);
      setLeft(null);
    }
  };
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      <div key={shake} className={cx('absolute inset-x-2 bottom-2 top-14 mx-auto grid max-w-4xl grid-cols-2 gap-2', shake > 0 && 'fb-miss')}>
        <div className="rpg-frame rpg-text flex flex-col gap-1 overflow-y-auto p-2 text-sm leading-tight">
          <span className="text-[#ffe08a]">
            Começos · Fé: {'♥'.repeat(Math.max(0, lives))}
          </span>
          {set.map((b, i) => (
            <button
              key={i}
              disabled={matched.includes(i)}
              onClick={() => setLeft(i)}
              className={cx('rpg-wood px-2 py-1 text-left', left === i && 'outline outline-2 outline-[#ffe08a]', matched.includes(i) && 'bg-[#6a9a3a] opacity-70')}
            >
              {b[0]},
            </button>
          ))}
        </div>
        <div className="rpg-frame rpg-text flex flex-col gap-1 overflow-y-auto p-2 text-sm leading-tight">
          <span className="text-[#ffe08a]">Finais</span>
          {ends.map((e, i) => (
            <button key={i} disabled={usedEnds.includes(i)} onClick={() => pick(i)} className={cx('rpg-wood px-2 py-1 text-left', usedEnds.includes(i) && 'bg-[#6a9a3a] opacity-70', left === null && 'opacity-80')}>
              {e}
            </button>
          ))}
        </div>
      </div>
      {lives <= 0 && (
        <Retry
          text="A fé acabou. Leia com calma: cada promessa combina com o seu começo."
          onRetry={() => {
            setLives(LIVES);
            setMatched([]);
            setUsedEnds([]);
            setLeft(null);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 5b. The sower (aim with lead)

type Soil = 'caminho' | 'pedras' | 'espinhos' | 'boa';

export function Sower({ paused, onWin, diff = 1 }: GameProps) {
  const SEEDS = byDiff(diff, [26, 22, 20]);
  const NEED = byDiff(diff, [10, 12, 14]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    const soils: Soil[] = [];
    for (let i = 0; i < 60; i++) soils.push(i < 2 ? 'caminho' : (['boa', 'caminho', 'pedras', 'boa', 'espinhos', 'boa'] as Soil[])[Math.floor(Math.random() * 6)]);
    return { scroll: 0, seeds: SEEDS, good: 0, flying: [] as { x: number; y: number; vx: number; vy: number }[], sprouts: [] as { x: number; soil: Soil; t: number }[], birds: [] as { x: number; y: number }[], soils, won: false, msg: '', msgT: 0, parts: [] as Part[], w: 320 };
  }
  const SEG = 34;
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    const live = !paused && !lost && !s.won;
    const speed = byDiff(diff, [22, 30, 38]);
    const soilAt = (worldX: number) => s.soils[Math.floor(worldX / SEG) % s.soils.length];
    if (live) {
      s.scroll += speed * dt;
      for (const f of s.flying) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 160 * dt;
        if (f.y >= 140) {
          f.y = 999;
          const wx = f.x + s.scroll;
          const soil = soilAt(wx);
          s.sprouts.push({ x: wx, soil, t });
          if (soil === 'boa') {
            s.good += 1;
            engine.playNote(76 + (s.good % 8), 'bell', 0, 0.2);
            buzz(15);
            s.msg = 'Boa terra! Vai dar fruto.';
          } else {
            engine.sfx('bonk');
            s.msg = soil === 'caminho' ? 'Caiu no caminho: as aves comeram.' : soil === 'pedras' ? 'Nas pedras: brotou e secou.' : 'Entre espinhos: foi sufocada.';
            if (soil === 'caminho') s.birds.push({ x: f.x, y: 60 });
          }
          s.msgT = 1.4;
          if (s.good >= NEED) {
            s.won = true;
            engine.sfx('yay');
            window.setTimeout(() => onWin(starsOf((s.seeds + 1) / (SEEDS - NEED + 1))), 900);
          } else if (s.seeds <= 0 && s.flying.every((q) => q.y > 200)) setLost(true);
        }
      }
      s.flying = s.flying.filter((f) => f.y < 200);
      for (const b of s.birds) {
        b.x += (b.y < 130 ? 0 : -40) * dt;
        b.y += 60 * dt;
      }
      s.birds = s.birds.filter((b) => b.y < 200);
      s.msgT = Math.max(0, s.msgT - dt);
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    SC.sky(ctx, w, ['#86c0e4', '#a2d0ea', '#bedcee', '#d8eaf0'], 90);
    SC.hills(ctx, w, 100, '#8aa868', 10, 0.04, 2);
    // Strip of soils scrolling under the sower.
    const first = Math.floor(s.scroll / SEG);
    for (let i = first; i < first + w / SEG + 2; i++) {
      const x = i * SEG - s.scroll;
      const soil = s.soils[i % s.soils.length];
      const col = soil === 'boa' ? '#6a4426' : soil === 'caminho' ? '#c8b088' : soil === 'pedras' ? '#9a9080' : '#6a7a3a';
      rect(ctx, x, 140, SEG, 40, col);
      if (soil === 'boa') for (let k = 0; k < 4; k++) rect(ctx, x + 2, 145 + k * 8, SEG - 4, 1, '#4a2c18');
      if (soil === 'pedras') for (let k = 0; k < 5; k++) SC.blob(ctx, x + 4 + k * 6, 146 + (k % 2) * 10, 3, 2, '#b8b0a0');
      if (soil === 'espinhos') for (let k = 0; k < 5; k++) rect(ctx, x + 3 + k * 6, 136 + (k % 2) * 3, 1, 8, '#3a4a1a');
      if (soil === 'caminho') rect(ctx, x, 150, SEG, 3, '#b49a6a');
      ctx.fillStyle = 'rgba(42,26,16,0.5)';
      ctx.font = '7px "Pixelify Sans", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(soil === 'boa' ? 'boa' : soil, x + SEG / 2, 177);
    }
    for (const sp of s.sprouts) {
      const x = sp.x - s.scroll;
      if (x < -10) continue;
      const age = Math.min(1, (t - sp.t) / 1.2);
      if (sp.soil === 'boa') {
        rect(ctx, x, 140 - age * 10, 1, age * 10, '#5aaa3a');
        if (age >= 1) rect(ctx, x - 2, 128, 5, 3, '#e8c060');
      } else if (sp.soil === 'pedras') rect(ctx, x, 136, 1, 4, age < 1 ? '#5aaa3a' : '#a89060');
    }
    const sx = w * 0.3;
    drawPerson(ctx, JLOOKS.jesus, sx, 138, 'right', Math.floor(t * 4) % 4);
    for (const f of s.flying) rect(ctx, f.x, f.y, 2, 2, '#e8c878');
    for (const b of s.birds) {
      rect(ctx, b.x - 4, b.y, 8, 2, '#2a2a3a');
      rect(ctx, b.x - 6, b.y - 2 + (Math.floor(t * 10) % 2) * 3, 4, 1, '#2a2a3a');
      rect(ctx, b.x + 2, b.y - 2 + (Math.floor(t * 10) % 2) * 3, 4, 1, '#2a2a3a');
    }
    // Landing guide on easy.
    if (diff === 0) {
      ctx.fillStyle = 'rgba(255,240,180,0.5)';
      ctx.fillRect(Math.round(sx + 52), 138, 2, 4);
    }
    SC.particlesDraw(ctx, s.parts);
  });
  const sow = () => {
    const s = st.current;
    if (paused || lost || s.won || s.seeds <= 0) return;
    s.seeds -= 1;
    s.flying.push({ x: s.w * 0.3 + 4, y: 118, vx: 44, vy: -60 });
    engine.playNote(67, 'pluck', 0, 0.15);
    setH((h) => h + 1);
  };
  useKeys((k) => (k === ' ' || k === 'enter' || k === 'z') && sow());
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">
              Boa terra: {s.good}/{NEED} · Sementes: {s.seeds}
            </Panel>
            {s.msgT > 0 && <Panel className="text-base text-[#ffe08a]">{s.msg}</Panel>}
          </div>
          <button
            onPointerDown={(e) => (e.preventDefault(), sow())}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-xl shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Semear
          </button>
          <span className="rpg-text pointer-events-none absolute bottom-6 left-6 max-w-[40%] text-sm opacity-90">A semente cai um pouco à frente: jogue antes da boa terra chegar!</span>
        </>
      )}
      {lost && (
        <Retry
          text="As sementes acabaram. Observe onde a semente cai e jogue com antecedência."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 6. Feeding the five thousand (strategy)

export function Loaves({ paused, onWin, diff = 1 }: GameProps) {
  const GROUPS = byDiff(diff, [6, 8, 10]);
  const DUR = byDiff(diff, [45, 55, 60]);
  const LIVES = byDiff(diff, [3, 2, 1]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return {
      groups: [] as { x: number; y: number; hunger: number; rate: number; fed: number; faint: number }[],
      disciples: [] as { look: Look; x: number; y: number; tx: number; ty: number; basket: boolean; target: number | null; refill: number }[],
      time: 0,
      lives: LIVES,
      meals: 0,
      won: false,
      parts: [] as Part[],
      w: 320,
    };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    const jx = w * 0.5;
    const jy = 100;
    if (!s.groups.length) {
      for (let i = 0; i < GROUPS; i++) {
        const a = (i / GROUPS) * Math.PI * 2;
        s.groups.push({ x: jx + Math.cos(a) * w * 0.36, y: 112 + Math.sin(a) * 52, hunger: 55 + Math.random() * 40, rate: byDiff(diff, [3, 4.2, 5.4]) * (0.6 + Math.random() * 0.8), fed: 0, faint: 0 });
      }
      [JLOOKS.pedro, JLOOKS.andre, JLOOKS.joao].forEach((look, i) => s.disciples.push({ look, x: jx - 14 + i * 14, y: jy + 14, tx: jx - 14 + i * 14, ty: jy + 14, basket: true, target: null, refill: 0 }));
    }
    const live = !paused && !lost && !s.won;
    if (live) {
      s.time += dt;
      for (const [i, g] of s.groups.entries()) {
        g.faint = Math.max(0, g.faint - dt);
        g.hunger -= g.rate * dt;
        if (g.hunger <= 0) {
          g.hunger = 50;
          g.faint = 2;
          s.lives -= 1;
          engine.sfx('sad');
          buzz([60, 40, 60]);
          if (s.lives <= 0) setLost(true);
          void i;
        }
      }
      for (const d of s.disciples) {
        const dx = d.tx - d.x;
        const dy = d.ty - d.y;
        const dist = Math.hypot(dx, dy);
        const sp = byDiff(diff, [62, 52, 46]) * dt;
        if (dist > 1) {
          d.x += (dx / dist) * Math.min(sp, dist);
          d.y += (dy / dist) * Math.min(sp, dist);
        } else if (d.target !== null) {
          const g = s.groups[d.target];
          g.hunger = Math.min(100, g.hunger + 70);
          g.fed += 1;
          s.meals += 1;
          d.basket = false;
          d.target = null;
          d.tx = jx;
          d.ty = jy + 14;
          engine.playNote(72 + (s.meals % 7), 'bell', 0, 0.2);
          burst(s.parts, g.x, g.y - 10, '#e8c060', 8);
        } else if (!d.basket) {
          // Back with Jesus: the basket is blessed and fills again.
          d.refill += dt;
          if (d.refill > byDiff(diff, [0.6, 0.9, 1.2])) {
            d.basket = true;
            d.refill = 0;
            burst(s.parts, d.x, d.y - 20, '#ffe066', 5);
          }
        }
      }
      if (s.time >= DUR && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf(s.lives / LIVES)), 900);
      }
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    SC.sky(ctx, w, ['#e8b880', '#f0c890', '#f4d8a8', '#f8e4c0'], 40);
    SC.hills(ctx, w, 46, '#7a9a4a', 10, 0.04, 3);
    rect(ctx, 0, 46, w, 134, '#8aac58');
    for (let i = 0; i < w; i++) rect(ctx, (i * 47) % w, 50 + ((i * 23) % 128), 1, 2, '#6a8e3a');
    for (const [i, g] of s.groups.entries()) {
      for (let k = 0; k < 4; k++) drawPerson(ctx, [JLOOKS.servo, JLOOKS.marta, JLOOKS.menino, JLOOKS.amigo][(k + i) % 4], g.x - 9 + (k % 2) * 14, g.y - 4 + Math.floor(k / 2) * 8, 'down', 0);
      rect(ctx, g.x - 12, g.y + 8, 24, 4, '#2a1a10');
      rect(ctx, g.x - 11, g.y + 9, Math.round(22 * (g.hunger / 100)), 2, g.hunger < 25 ? '#d8402a' : g.hunger < 50 ? '#e0a020' : '#6aca3a');
      if (g.faint > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('desmaiou!', g.x, g.y - 30);
      }
    }
    drawPerson(ctx, JLOOKS.jesus, jx, jy, 'down', 0);
    rect(ctx, jx - 6, jy - 2, 12, 5, '#a87a44');
    for (const d of s.disciples) {
      drawPerson(ctx, d.look, d.x, d.y, d.tx < d.x ? 'left' : 'right', Math.hypot(d.tx - d.x, d.ty - d.y) > 1 ? Math.floor(t * 8) % 4 : 0);
      if (d.basket) {
        rect(ctx, d.x - 4, d.y - 14, 9, 5, '#4a2c14');
        rect(ctx, d.x - 3, d.y - 13, 7, 3, '#e8b866');
      }
    }
    SC.particlesDraw(ctx, s.parts);
  });
  const tapField = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (paused || lost || s.won) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * s.w;
    const y = ((e.clientY - r.top) / r.height) * 180;
    const gi = s.groups.map((g, i) => ({ i, d: Math.hypot(g.x - x, g.y - y) })).sort((a, b) => a.d - b.d)[0];
    if (!gi || gi.d > 26) return;
    if (s.disciples.some((d) => d.target === gi.i)) return;
    const g = s.groups[gi.i];
    const d = s.disciples.filter((q) => q.basket && q.target === null).sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y))[0];
    if (!d) {
      engine.playNote(50, 'pluck', 0, 0.2);
      return;
    }
    d.target = gi.i;
    d.tx = g.x;
    d.ty = g.y - 10;
    engine.playNote(67, 'pluck', 0, 0.2);
  };
  const s = st.current;
  const ready = s.disciples.filter((d) => d.basket && d.target === null).length;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="absolute inset-0 top-12" onPointerDown={tapField} />
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">Toque num grupo com fome para mandar um cesto</Panel>
            <Panel className="text-base">
              Cestos prontos: {ready} · Refeições: {s.meals}
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Tarde
              <span className="h-3 w-16 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#f0a050]" style={{ width: `${Math.min(100, (s.time / DUR) * 100)}%` }} />
              </span>
              <span className="text-[#ff8a8a]">{'♥'.repeat(Math.max(0, s.lives))}</span>
            </Panel>
          </div>
        </>
      )}
      {lost && (
        <Retry
          text="Gente demais desmaiou de fome. Mande os cestos primeiro para os grupos com a barra vermelha e os mais distantes."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}
