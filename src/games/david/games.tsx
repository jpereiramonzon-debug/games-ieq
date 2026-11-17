/**
 * The playable parts of each chapter of the story of David. Every game draws a
 * 16-bit scene on a canvas (180 px tall, width from the screen) and takes
 * `paused` while a dialogue is shown on top of it.
 */
import { useEffect, useRef, useState } from 'react';
import { burst, buzz, byDiff, starsOf, Panel, Retry as RetryBase, Stage, stepParts, useKeys, useStage, VH, type GameProps, type Part } from '../pixel/stage';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
export type { GameProps };
const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={DLOOKS.davi} />;
import { Joystick } from '../pixel/Controls';
import { Qte } from '../pixel/Qte';
import { Portrait } from '../pixel/Dialog';
import { drawPerson, type Dir } from '../pixel/person';
import { BROTHERS, DAVID_HEART, GOLIAS_TAUNTS, HEART, LORD } from './content';
import { DLOOKS } from './looks';
import * as SC from './scenes';

// ================================================================ 1. Shepherd

interface Sheep {
  x: number;
  y: number;
  tx: number;
  ty: number;
  next: number;
  taken: boolean;
  lost: boolean;
  left: boolean;
}
interface Beast {
  bear: boolean;
  x: number;
  y: number;
  hp: number;
  state: 'hunt' | 'carry' | 'flee';
  prey: number;
  flash: number;
  home: number;
}

const SHEEP = 8;
const DUSK = 48;

export function Shepherd({ paused, onWin, diff = 1 }: GameProps) {
  const NEED = byDiff(diff, [5, 6, 7]);
  const SPEED = byDiff(diff, [0.85, 1.1, 1.3]);
  const [lost, setLost] = useState(false);
  const [, setHud] = useState(0);
  const st = useRef(newShepherd());
  function newShepherd() {
    return {
      x: 160,
      y: 130,
      dir: 'right' as Dir,
      keys: { x: 0, y: 0 },
      walked: 0,
      sheep: [] as Sheep[],
      beasts: [] as Beast[],
      stones: [] as { x: number; y: number; vx: number; vy: number; life: number; target: Beast | null }[],
      parts: [] as Part[],
      holding: false,
      charge: 0,
      time: 0,
      spawns: (
        [
          [3, false],
          [10, false],
          [15, true],
          [20, false],
          [25, false],
          [29, true],
          [33, false],
          [37, true],
          [40, false],
          [43, false],
        ] as [number, boolean][]
      ).filter((_, i) => i % (diff === 0 ? 2 : 1) === 0 || diff === 2),
      done: false,
    };
  }
  const reset = () => {
    st.current = newShepherd();
    setLost(false);
  };

  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    if (!s.sheep.length)
      for (let i = 0; i < SHEEP; i++) {
        const x = w * 0.3 + Math.random() * w * 0.4;
        const y = 110 + Math.random() * 55;
        s.sheep.push({ x, y, tx: x, ty: y, next: Math.random() * 3, taken: false, lost: false, left: Math.random() < 0.5 });
      }
    const live = !paused && !lost && !s.done;
    if (live) {
      s.time += dt;
      // Spawns.
      while (s.spawns.length && s.spawns[0][0] <= s.time) {
        const [, bear] = s.spawns.shift()!;
        const fromLeft = Math.random() < 0.5;
        const prey = s.sheep.map((q, i) => ({ q, i })).filter(({ q }) => !q.lost && !q.taken);
        if (!prey.length) break;
        // Predators pick the sheep that is farthest from David: keep the flock together!
        const target = prey.sort((a, b) => Math.hypot(b.q.x - s.x, b.q.y - s.y) - Math.hypot(a.q.x - s.x, a.q.y - s.y))[0].i;
        s.beasts.push({ bear, x: fromLeft ? -20 : w + 20, y: 110 + Math.random() * 50, hp: (bear ? 3 : 2) + (diff === 2 ? 1 : 0) - (diff === 0 ? 1 : 0), state: 'hunt', prey: target, flash: 0, home: fromLeft ? -40 : w + 40 });
        engine.sfx(bear ? 'hurt' : 'dead');
      }
      // David.
      const k = s.keys;
      const len = Math.max(1, Math.hypot(k.x, k.y));
      const sp = 72 * dt;
      const ox = s.x;
      s.x = Math.max(10, Math.min(w - 10, s.x + (k.x / len) * sp));
      s.y = Math.max(96, Math.min(174, s.y + (k.y / len) * sp));
      s.walked += Math.abs(s.x - ox) + Math.abs(k.y) * sp;
      if (k.x || k.y) s.dir = Math.abs(k.x) > Math.abs(k.y) ? (k.x > 0 ? 'right' : 'left') : k.y > 0 ? 'down' : 'up';
      if (s.holding) s.charge = Math.min(1, s.charge + dt / 0.7);
      // Sheep wander.
      for (const q of s.sheep) {
        if (q.lost || q.taken) continue;
        q.next -= dt;
        // Sheep near David follow him; far ones wander off.
        const dd = Math.hypot(s.x - q.x, s.y - q.y);
        if (dd < 46 && dd > 14) {
          q.tx = s.x + (q.x - s.x) * 0.5;
          q.ty = s.y + (q.y - s.y) * 0.5;
          q.next = 0.6;
        }
        if (q.next <= 0) {
          q.tx = Math.max(20, Math.min(w - 20, q.x + (Math.random() - 0.5) * 60));
          q.ty = Math.max(104, Math.min(170, q.y + (Math.random() - 0.5) * 40));
          q.next = 2 + Math.random() * 3;
        }
        const dx = q.tx - q.x;
        const dy = q.ty - q.y;
        const d = Math.hypot(dx, dy);
        if (d > 1) {
          q.x += (dx / d) * 9 * dt;
          q.y += (dy / d) * 9 * dt;
          q.left = dx < 0;
        }
      }
      // Beasts.
      for (const b of s.beasts) {
        b.flash = Math.max(0, b.flash - dt);
        const prey = s.sheep[b.prey];
        if (b.state === 'hunt') {
          if (prey.lost || prey.taken) {
            const alt = s.sheep.findIndex((q) => !q.lost && !q.taken);
            if (alt < 0) b.state = 'flee';
            else b.prey = alt;
            continue;
          }
          const dx = prey.x - b.x;
          const dy = prey.y - b.y;
          const d = Math.hypot(dx, dy);
          const v = (b.bear ? 24 : 32) * SPEED * dt;
          if (d < 8) {
            b.state = 'carry';
            prey.taken = true;
            engine.sfx('sad');
          } else {
            b.x += (dx / d) * v;
            b.y += (dy / d) * v;
          }
        } else {
          const v = (b.state === 'flee' ? 70 : 20) * dt;
          b.x += Math.sign(b.home - b.x) * v;
          if (b.state === 'carry') {
            prey.x = b.x + (b.home < 0 ? -6 : 6);
            prey.y = b.y - 2;
            if (b.x < -30 || b.x > w + 30) {
              prey.lost = true;
              prey.taken = false;
            }
          }
        }
      }
      s.beasts = s.beasts.filter((b) => b.x > -60 && b.x < w + 60);
      // Stones.
      for (const o of s.stones) {
        o.life -= dt;
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        const b = o.target;
        if (b && b.state !== 'flee' && Math.hypot(b.x - o.x, b.y - 10 - o.y) < 10) {
          o.life = 0;
          b.hp -= 1;
          b.flash = 0.15;
          b.x += Math.sign(b.x - s.x) * 6;
          engine.drum('snare', 0, 0.8);
          buzz(20);
          burst(s.parts, b.x, b.y - 12, '#ffffff', 6);
          if (b.hp <= 0) {
            if (b.state === 'carry') s.sheep[b.prey].taken = false;
            b.state = 'flee';
            engine.sfx('stomp');
          }
        }
      }
      s.stones = s.stones.filter((o) => o.life > 0);
      const alive = s.sheep.filter((q) => !q.lost).length;
      if (alive < NEED) {
        setLost(true);
        engine.sfx('dead');
      } else if (s.time >= DUSK && !s.beasts.some((b) => b.state !== 'flee')) {
        s.done = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf((alive - NEED) / Math.max(1, SHEEP - NEED))), 600);
      }
      if (Math.floor(s.time * 4) !== Math.floor((s.time - dt) * 4)) setHud((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);

    // Draw.
    SC.pasture(ctx, w, t, Math.min(1, s.time / DUSK));
    const list: { y: number; d: () => void }[] = [];
    s.sheep.forEach((q) => !q.lost && list.push({ y: q.y, d: () => SC.sheep(ctx, q.x, q.y, Math.floor(t * 4 + q.x), q.left, q.taken) }));
    s.beasts.forEach((b) => list.push({ y: b.y, d: () => SC.lion(ctx, b.x, b.y, Math.floor(t * 8), b.home < b.x ? true : false, b.flash > 0, b.bear) }));
    const moving = live && (s.keys.x || s.keys.y);
    list.push({ y: s.y, d: () => drawPerson(ctx, DLOOKS.davi, s.x, s.y, s.dir, moving ? Math.floor(s.walked / 6) % 4 : 0) });
    list.sort((a, b) => a.y - b.y).forEach((e) => e.d());
    // Sling being swung and its power.
    if (s.holding) {
      const a = t * 18;
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(Math.round(s.x + Math.cos(a) * 9), Math.round(s.y - 30 + Math.sin(a) * 4), 3, 3);
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(Math.round(s.x - 10), Math.round(s.y - 42), 20, 4);
      ctx.fillStyle = s.charge > 0.75 ? '#6aca3a' : '#ffd23a';
      ctx.fillRect(Math.round(s.x - 9), Math.round(s.y - 41), Math.round(18 * s.charge), 2);
    }
    for (const o of s.stones) {
      ctx.fillStyle = '#d8d0c4';
      ctx.fillRect(Math.round(o.x), Math.round(o.y), 2, 2);
    }
    SC.particlesDraw(ctx, s.parts);
  });

  const release = () => {
    const s = st.current;
    if (!s.holding) return;
    s.holding = false;
    const power = s.charge;
    s.charge = 0;
    if (paused || lost) return;
    const range = 50 + 170 * Math.min(1, power / 0.75);
    const targets = s.beasts.filter((b) => b.state !== 'flee').sort((a, b) => Math.hypot(a.x - s.x, a.y - s.y) - Math.hypot(b.x - s.x, b.y - s.y));
    const tg = targets[0] && Math.hypot(targets[0].x - s.x, targets[0].y - s.y) < range ? targets[0] : null;
    const tx = tg ? tg.x : s.x + (s.dir === 'left' ? -1 : s.dir === 'right' ? 1 : 0) * range;
    const ty = tg ? tg.y - 10 : s.y - 20 + (s.dir === 'up' ? -range : s.dir === 'down' ? range : 0);
    const d = Math.max(1, Math.hypot(tx - s.x, ty - (s.y - 20)));
    s.stones.push({ x: s.x, y: s.y - 20, vx: ((tx - s.x) / d) * 240, vy: ((ty - (s.y - 20)) / d) * 240, life: d / 240 + 0.1, target: tg });
    s.dir = tx < s.x ? 'left' : 'right';
    engine.sfx('jump');
  };
  const press = () => {
    if (paused || lost) return;
    st.current.holding = true;
    st.current.charge = 0;
  };
  useKeys(
    (k) => {
      const s = st.current;
      if (k === ' ' || k === 'enter' || k === 'z' || k === 'e') press();
      const ax: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (ax[k]) s.keys = { x: ax[k][0] || s.keys.x, y: ax[k][1] || s.keys.y };
    },
    (k) => {
      const s = st.current;
      if (k === ' ' || k === 'enter' || k === 'z' || k === 'e') release();
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') s.keys.x = 0;
      if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') s.keys.y = 0;
    },
  );

  const s = st.current;
  const alive = s.sheep.filter((q) => !q.lost).length || SHEEP;
  return (
    <>
      <Stage cv={cv} />
      {!paused && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex gap-2 pl-[env(safe-area-inset-left)]">
            <Panel className="text-base">
              Ovelhas: {alive}/{SHEEP} <span className="text-sm opacity-80">(mínimo {NEED})</span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Pôr do sol
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#f0a050]" style={{ width: `${Math.min(100, (s.time / DUSK) * 100)}%` }} />
              </span>
            </Panel>
          </div>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (st.current.keys = { x, y })} />
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              press();
            }}
            onPointerUp={release}
            onPointerCancel={release}
            aria-label="Funda: segure e solte"
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Funda
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {lost && <Retry text="As feras levaram ovelhas demais. Um bom pastor não desiste do rebanho!" onRetry={reset} />}
    </>
  );
}

// ================================================================ 2. Anointing

export function Anoint({ paused, onWin, diff = 1 }: GameProps) {
  const LOOKS_MAX = byDiff(diff, [10, 7, 6]);
  const [sel, setSel] = useState(0);
  const [seen, setSeen] = useState<number[]>([]);
  const [left, setLeft] = useState(LOOKS_MAX);
  const [lives, setLives] = useState(3);
  const [davidHere, setDavidHere] = useState(false);
  const [msg, setMsg] = useState<{ who: 'lord' | 'jesse' | 'samuel'; text: string } | null>(null);
  const [phase, setPhase] = useState<'choose' | 'oil' | 'done' | 'lost'>('choose');
  const [early, setEarly] = useState(false);
  const [oil, setOil] = useState(0);
  const [oilMsg, setOilMsg] = useState<string | null>(null);
  const pouring = useRef(false);
  const parts = useRef<Part[]>([]);
  const davidX = useRef(999);
  const zone: [number, number] = byDiff(diff, [[0.55, 0.9], [0.62, 0.84], [0.68, 0.8]]);
  const all = davidHere ? [...BROTHERS, { name: 'Davi', look: DLOOKS.davi, looks: 'Ruivo, de belos olhos, ainda com cheiro de ovelha.', heart: DAVID_HEART }] : BROTHERS;

  const cv = useStage((ctx, w, dt, t) => {
    SC.village(ctx, w, t);
    const n = all.length;
    const gap = Math.min(30, (w * 0.62) / n);
    const x0 = w * 0.36;
    all.forEach((b, i) => {
      let x = x0 + i * gap;
      if (i === 7) {
        if (davidX.current === 999) davidX.current = w + 20;
        davidX.current = Math.max(x, davidX.current - 70 * dt);
        x = davidX.current;
      }
      const y = 116 + (i % 2) * 5;
      drawPerson(ctx, b.look, x, y, i === 7 && x > x0 + i * gap ? 'left' : 'down', i === 7 && x > x0 + i * gap ? Math.floor(t * 8) % 4 : 0);
      if (i === sel && phase === 'choose') {
        const by = y - 40 + Math.round(Math.sin(t * 5) * 2);
        ctx.fillStyle = '#3a2414';
        ctx.fillRect(Math.round(x) - 4, by - 1, 9, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(Math.round(x) - 3, by, 7, 2);
        ctx.fillRect(Math.round(x) - 2, by + 2, 5, 1);
        ctx.fillRect(Math.round(x) - 1, by + 3, 3, 1);
      }
      if (seen.includes(i)) {
        ctx.fillStyle = '#ff6a8a';
        ctx.fillRect(Math.round(x) + 6, y - 34, 3, 2);
        ctx.fillRect(Math.round(x) + 5, y - 33, 5, 2);
        ctx.fillRect(Math.round(x) + 6, y - 31, 3, 1);
      }
    });
    drawPerson(ctx, DLOOKS.jesse, w * 0.95, 112, 'left', 0);
    drawPerson(ctx, DLOOKS.samuel, w * 0.2, 120, 'right', 0);
    if (phase === 'oil' && pouring.current) {
      setOil((o) => Math.min(1.2, o + dt * 0.55));
      ctx.fillStyle = '#e8c848';
      ctx.fillRect(Math.round(davidX.current) - 1, 74, 2, 12);
    }
    parts.current = stepParts(parts.current, dt, -20);
    SC.particlesDraw(ctx, parts.current);
  });

  const examine = () => {
    if (left <= 0) return setMsg({ who: 'samuel', text: 'Já não consigo discernir mais nada... preciso decidir.' });
    if (seen.includes(sel)) return setMsg({ who: 'samuel', text: 'Já olhei o coração deste. Não preciso olhar de novo.' });
    setSeen([...seen, sel]);
    setLeft(left - 1);
    setMsg(null);
    engine.playNote(76, 'bell', 0, 0.25);
  };
  const anoint = () => {
    const b = all[sel];
    const ok = HEART.every((h) => b.heart.includes(h));
    if (ok) {
      engine.sfx('power');
      buzz(30);
      setPhase('oil');
      return;
    }
    engine.sfx('bonk');
    buzz([40, 30, 40]);
    const l = lives - 1;
    setLives(l);
    setMsg({ who: 'lord', text: sel === 0 ? LORD : `Não é ${b.name}. O Senhor não vê como vê o homem.` });
    if (l <= 0) setPhase('lost');
  };
  const askAll = () => {
    if (davidHere) return;
    const unchecked = BROTHERS.map((_, i) => i).filter((i) => !seen.includes(i));
    setEarly(unchecked.length > (diff === 2 ? 1 : 0));
    setMsg({ who: 'jesse', text: 'Estão todos? ...Ainda falta o mais novo, que está apascentando as ovelhas. Vou mandar chamá-lo!' });
    setDavidHere(true);
    setSel(7);
    engine.playNote(67, 'pluck', 0, 0.3);
  };
  const release = () => {
    if (!pouring.current) return;
    pouring.current = false;
    if (oil >= zone[0] && oil <= zone[1]) {
      setPhase('done');
      engine.sfx('yay');
      const x = davidX.current;
      for (let k = 0; k < 30; k++) parts.current.push({ x: x + (Math.random() - 0.5) * 30, y: 88 + Math.random() * 30, vx: (Math.random() - 0.5) * 10, vy: -10 - Math.random() * 20, c: k % 2 ? '#ffe066' : '#ffffff', life: 2 });
      const score = (lives === 3 ? 0.5 : lives === 2 ? 0.25 : 0) + (early ? 0 : 0.5);
      window.setTimeout(() => onWin(starsOf(score)), 1400);
    } else {
      engine.sfx('bonk');
      setOilMsg(oil < zone[0] ? 'Pouco azeite. Derrame mais um pouco.' : 'Opa, azeite demais! Escorreu na barba toda.');
      setOil(0);
    }
  };
  const restart = () => {
    setSel(0);
    setSeen([]);
    setLeft(LOOKS_MAX);
    setLives(3);
    setDavidHere(false);
    setMsg(null);
    setEarly(false);
    davidX.current = 999;
    setPhase('choose');
  };

  const b = all[sel];
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      {phase === 'choose' && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap items-center gap-1.5">
            <Panel className="text-sm">
              O Senhor procura um coração:{' '}
              {HEART.map((h) => (
                <span key={h} className="mx-0.5 rounded bg-[#6a9a3a] px-1 text-white">
                  {h}
                </span>
              ))}
            </Panel>
            <Panel className="text-sm">
              Olhares: {left} · Vidas: <span className="text-[#ff8a8a]">{'♥'.repeat(lives)}</span>
            </Panel>
          </div>
          <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl items-stretch gap-2">
            <Portrait look={msg?.who === 'lord' || msg?.who === 'samuel' ? DLOOKS.samuel : msg?.who === 'jesse' ? DLOOKS.jesse : b.look} className="h-24 w-24" />
            <div className="rpg-frame rpg-text flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2 text-base leading-snug">
              {msg ? (
                <>
                  <span className="text-sm text-[#ffe08a]">{msg.who === 'lord' ? 'A voz do Senhor' : msg.who === 'jesse' ? 'Jessé' : 'Samuel'}</span>
                  {msg.text}
                </>
              ) : (
                <>
                  <span className="text-sm text-[#ffe08a]">
                    {b.name} · aparência: “{b.looks}”
                  </span>
                  {seen.includes(sel) ? (
                    <span className="flex flex-wrap gap-1">
                      Coração:
                      {b.heart.map((h) => (
                        <span key={h} className={cx('rounded px-1', HEART.includes(h) ? 'bg-[#6a9a3a] text-white' : 'bg-[#8a4a3a] text-white')}>
                          {h}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="opacity-80">O coração dele ainda está oculto.</span>
                  )}
                </>
              )}
              <span className="flex flex-wrap gap-1.5">
                <button onClick={() => (setMsg(null), setSel((sel + all.length - 1) % all.length))} className="rpg-wood h-10 w-10 text-lg" aria-label="Anterior">
                  ◀
                </button>
                <button onClick={() => (setMsg(null), setSel((sel + 1) % all.length))} className="rpg-wood h-10 w-10 text-lg" aria-label="Próximo">
                  ▶
                </button>
                <button onClick={examine} className="rpg-wood h-10 flex-1 px-2 text-sm">
                  Olhar o coração
                </button>
                <button onClick={anoint} className="rpg-wood h-10 flex-1 px-2 text-sm">
                  Ungir este
                </button>
                {!davidHere && (
                  <button onClick={askAll} className="rpg-wood h-10 flex-1 px-2 text-sm">
                    “Estão todos aqui?”
                  </button>
                )}
              </span>
            </div>
          </div>
        </>
      )}
      {phase === 'oil' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-xl flex-col gap-2">
          <Panel className="text-base">{oilMsg ?? 'Segure para derramar o azeite. Solte quando chegar na faixa dourada.'}</Panel>
          <div className="relative h-6 border-[3px] border-[#3a2414] bg-[#4a4250]">
            <div className="absolute inset-y-0 bg-[#e8b830]/60" style={{ left: `${zone[0] * 100}%`, width: `${(zone[1] - zone[0]) * 100}%` }} />
            <div className="h-full bg-[#ffe066]" style={{ width: `${Math.min(100, oil * 100)}%` }} />
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              setOilMsg(null);
              setOil(0);
              pouring.current = true;
            }}
            onPointerUp={release}
            onPointerCancel={release}
            className="rpg-wood h-14 touch-none text-xl active:translate-y-0.5"
          >
            Derramar o azeite (segure)
          </button>
        </div>
      )}
      {phase === 'lost' && <Retry text="Três escolhas pela aparência... Olhe o coração antes de ungir, e pense em quem ainda não está aqui." onRetry={restart} />}
    </>
  );
}

// ================================================================ rhythm (harp, dance)

export interface Note {
  t: number;
  lane: number;
  midi?: number;
  hit?: boolean;
  miss?: boolean;
}

export function Lanes({
  notes,
  start,
  labels,
  colors,
  approach,
  onHit,
  onMiss,
  onWrong,
  keys,
}: {
  /** A tap with no note in reach (spamming is punished). */
  onWrong?: (lane: number) => void;
  notes: Note[];
  start: number;
  labels: string[];
  colors: string[];
  approach: number;
  onHit: (n: Note) => void;
  onMiss: (n: Note) => void;
  keys: string[][];
}) {
  const [, setF] = useState(0);
  const [flash, setFlash] = useState<number[]>(labels.map(() => 0));
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = (performance.now() - start) / 1000;
      for (const n of notes) if (!n.hit && !n.miss && now - n.t > 0.18) {
        n.miss = true;
        onMiss(n);
      }
      setF((f) => f + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, start]);
  const hit = (lane: number) => {
    const now = (performance.now() - start) / 1000;
    setFlash((f) => f.map((v, i) => (i === lane ? performance.now() : v)));
    const n = notes.filter((x) => x.lane === lane && !x.hit && !x.miss && Math.abs(x.t - now) < 0.18).sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now))[0];
    if (n) {
      n.hit = true;
      onHit(n);
    } else onWrong?.(lane);
  };
  useKeys((k) => keys.forEach((ks, i) => ks.includes(k) && hit(i)));
  const now = (performance.now() - start) / 1000;
  return (
    <div className="absolute bottom-2 right-2 top-14 flex w-[min(46%,22rem)] gap-1 pr-[env(safe-area-inset-right)]">
      {labels.map((lb, i) => (
        <div key={i} data-lane={i} className="relative flex flex-1 flex-col overflow-hidden border-[3px] border-[#3a2414] bg-[#2a1a10]/55">
          <div data-line className="absolute inset-x-0 bottom-16 h-1 bg-[#ffe08a]" />
          {notes
            .filter((n) => n.lane === i && !n.hit && n.t - now < approach && now - n.t < 0.3)
            .map((n) => {
              const k = 1 - (n.t - now) / approach; // 0 at top, 1 at the line
              return (
                <span
                  key={n.t}
                  className={cx('absolute left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-[#3a2414]', n.miss && 'opacity-30')}
                  style={{ top: `calc(${k} * (100% - 4.6rem))`, background: colors[i] }}
                />
              );
            })}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              hit(i);
            }}
            className={cx('rpg-wood rpg-text absolute inset-x-0 bottom-0 h-14 touch-none', lb.length > 2 ? 'text-xs' : 'text-2xl', performance.now() - flash[i] < 120 && 'brightness-150')}
            aria-label={`Faixa ${i + 1}`}
          >
            {lb}
          </button>
        </div>
      ))}
    </div>
  );
}

// Psalm-like tune in D major: [midi, beats].
const PSALM: [number, number][] = [
  [62, 1], [66, 1], [69, 2], [71, 1], [69, 1], [66, 2], [64, 1], [66, 1], [67, 1], [69, 1], [66, 3], [0, 1],
  [69, 1], [71, 1], [74, 2], [73, 1], [71, 1], [69, 2], [67, 1], [66, 1], [64, 1], [62, 1], [64, 3], [0, 1],
  [62, 1], [66, 1], [69, 2], [74, 1], [73, 1], [71, 2], [69, 1], [67, 1], [66, 1], [64, 1], [62, 4],
];

export function Harp({ paused, onWin, diff = 1 }: GameProps) {
  const hits = useRef({ hit: 0, total: 0 });
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState(false);
  const calm = useRef(100);
  const [, setH] = useState(0);
  const start = useRef(0);
  const notes = useRef<Note[]>([]);
  const [chart, setChart] = useState<{ notes: Note[]; start: number }>({ notes: [], start: 0 });
  const ended = useRef(false);

  useEffect(() => {
    if (paused) return;
    const beat = byDiff(diff, [0.7, 0.56, 0.46]);
    let t = 2.2;
    const list: Note[] = [];
    const pitches = [...new Set(PSALM.filter(([m]) => m).map(([m]) => m))].sort((a, b) => a - b);
    const chordEvery = byDiff(diff, [0, 6, 3]);
    let k = 0;
    for (const [m, b] of PSALM) {
      if (m) {
        const lane = Math.min(3, Math.floor((pitches.indexOf(m) / pitches.length) * 4));
        list.push({ t, lane, midi: m });
        // Chords: a second string at the same time.
        if (chordEvery && ++k % chordEvery === 0) list.push({ t: t + 0.001, lane: (lane + 2) % 4, midi: m - 5 });
        // On hard, quick passing notes between long ones.
        if (diff === 2 && b >= 2) list.push({ t: t + beat, lane: (lane + 1) % 4, midi: m + 2 });
      }
      t += b * beat;
    }
    hits.current = { hit: 0, total: list.length };
    notes.current = list;
    calm.current = 100;
    ended.current = false;
    start.current = performance.now();
    setChart({ notes: list, start: start.current });
    // Soft bass under the harp.
    const t0 = engine.now + 2.2;
    for (let k = 0; k < Math.ceil((t - 2.2) / (beat * 2)); k++) engine.bass([38, 43, 45, 38][k % 4], t0 + k * beat * 2, beat * 1.8, 0.35);
    const end = window.setTimeout(() => {
      ended.current = true;
      if (calm.current <= byDiff(diff, [50, 35, 20])) onWin(starsOf(hits.current.hit / Math.max(1, hits.current.total)));
      else setLost(true);
    }, (t + 0.8) * 1000);
    return () => window.clearTimeout(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, run]);

  const cv = useStage((ctx, w, dt, t) => {
    SC.palace(ctx, w);
    // Throne and Saul.
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(Math.round(w * 0.16) - 14, 92, 28, 50);
    ctx.fillStyle = '#8a2a2a';
    ctx.fillRect(Math.round(w * 0.16) - 12, 94, 24, 46);
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(Math.round(w * 0.16) - 12, 94, 24, 3);
    SC.bigPerson(ctx, DLOOKS.saul, w * 0.16, 150, 2, 'right', 0);
    // The dark cloud of torment over Saul.
    const a = calm.current / 100;
    for (let k = 0; k < 9; k++) {
      ctx.fillStyle = `rgba(30,20,40,${0.65 * a})`;
      const r = 8 + (k % 3) * 3;
      ctx.beginPath();
      ctx.arc(w * 0.16 - 20 + k * 5 + Math.sin(t * 2 + k) * 2, 70 + Math.cos(t * 1.7 + k) * 3, r, 0, Math.PI * 2);
      ctx.fill();
    }
    SC.bigPerson(ctx, DLOOKS.davi, w * 0.36, 156, 2, 'left', 0);
    // Harp.
    const hx = Math.round(w * 0.36) - 22;
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(hx, 104, 3, 34);
    ctx.fillRect(hx, 104, 16, 3);
    ctx.fillStyle = '#c08a4a';
    ctx.fillRect(hx + 1, 105, 1, 32);
    ctx.fillRect(hx + 1, 105, 14, 1);
    ctx.fillStyle = '#f4ecd8';
    for (let k = 0; k < 4; k++) ctx.fillRect(hx + 4 + k * 3, 107, 1, 30 - k * 5);
    void dt;
  });

  const restart = () => {
    setLost(false);
    setRun((r) => r + 1);
  };
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <Panel className="absolute left-14 top-2 flex items-center gap-2 text-base">
            Tormento de Saul
            <span className="h-3 w-28 border-2 border-[#3a2414] bg-[#4a4250]">
              <span className="block h-full bg-[#7a4aa8] transition-[width]" style={{ width: `${calm.current}%` }} />
            </span>
          </Panel>
          <Lanes
            key={run}
            notes={chart.notes}
            start={chart.start}
            labels={['♪', '♫', '♪', '♫']}
            colors={['#f0e0a0', '#e8c070', '#e0a860', '#d88a50']}
            approach={byDiff(diff, [1.8, 1.5, 1.2])}
            keys={[['d', 'arrowleft'], ['f', 'arrowdown'], ['j', 'arrowup'], ['k', 'arrowright']]}
            onWrong={() => {
              calm.current = Math.min(100, calm.current + 3);
              engine.playNote(50, 'pluck', 0, 0.2);
              buzz(15);
            }}
            onHit={(n) => {
              hits.current.hit += 1;
              engine.playNote(n.midi ?? 69, 'pluck', 0, 0.55);
              engine.playNote((n.midi ?? 69) + 12, 'bell', 0.01, 0.08);
              calm.current = Math.max(0, calm.current - byDiff(diff, [4.5, 3.2, 2.6]));
              setH((h) => h + 1);
              if (calm.current <= 0 && !ended.current) {
                ended.current = true;
                window.setTimeout(() => onWin(starsOf(hits.current.hit / Math.max(1, hits.current.total))), 500);
              }
            }}
            onMiss={() => {
              calm.current = Math.min(100, calm.current + 5);
              setH((h) => h + 1);
            }}
          />
        </>
      )}
      {lost && <Retry text="Saul ainda está atormentado... Toque com o coração mais uma vez." onRetry={restart} />}
    </>
  );
}

// ================================================================ 4a. Five smooth stones

export function Stones({ paused, onWin, diff = 1 }: GameProps) {
  const TIME = byDiff(diff, [32, 24, 19]);
  const FLOW = byDiff(diff, [4, 9, 14]);
  const [picked, setPicked] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState(false);
  const errors = useRef(0);
  const st = useRef({ stones: [] as { x: number; y: number; kind: 'smooth' | 'rough' | 'cracked'; gone: boolean; ph: number }[], time: TIME, w: 320, parts: [] as Part[] });
  useEffect(() => {
    st.current.stones = [];
    st.current.time = TIME;
    errors.current = 0;
    setPicked(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    if (!s.stones.length) {
      const kinds: ('smooth' | 'rough' | 'cracked')[] = [...Array(6).fill('smooth'), ...Array(byDiff(diff, [3, 6, 8])).fill('cracked'), ...Array(8).fill('rough')];
      kinds.sort(() => Math.random() - 0.5).forEach((kind, i) => {
        const y = 50 + (i % 9) * 11 + Math.random() * 4;
        s.stones.push({ x: w * 0.2 + Math.random() * w * 0.6, y, kind, gone: false, ph: Math.random() * 6 });
      });
    }
    const live = !paused && !lost && picked < 5;
    if (live) {
      s.time -= dt;
      if (s.time <= 0) setLost(true);
      // The current carries the stones downstream; they come back at the top.
      for (const o of s.stones) {
        o.x += FLOW * dt * (0.6 + (o.ph % 1));
        if (o.x > w * 0.84) o.x = w * 0.18;
      }
    }
    SC.brook(ctx, w, t);
    for (const o of s.stones)
      if (!o.gone) {
        const y = o.y + Math.sin(t * 2 + o.ph) * 0.6;
        SC.stone(ctx, o.x, y, o.kind !== 'rough', 1.4);
        if (o.kind === 'cracked') {
          ctx.fillStyle = '#4a4038';
          ctx.fillRect(Math.round(o.x) - 1, Math.round(y) - 3, 1, 2);
          ctx.fillRect(Math.round(o.x), Math.round(y) - 1, 1, 2);
          ctx.fillRect(Math.round(o.x) + 1, Math.round(y) + 1, 1, 1);
        }
      }
    drawPerson(ctx, DLOOKS.davi, w * 0.1, 160, 'right', 0);
    s.parts = stepParts(s.parts, dt);
    SC.particlesDraw(ctx, s.parts);
  });
  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (paused || lost || picked >= 5) return;
    const r = e.currentTarget.getBoundingClientRect();
    const k = VH / r.height;
    const x = (e.clientX - r.left) * k * (st.current.w / ((r.width * VH) / r.height));
    const y = (e.clientY - r.top) * k;
    const s = st.current;
    const o = s.stones.filter((q) => !q.gone).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!o || Math.hypot(o.x - x, o.y - y) > 14) return;
    if (o.kind === 'cracked') {
      engine.sfx('bonk');
      buzz([30, 30, 30]);
      errors.current += 1;
      s.time -= 3;
      o.gone = true;
      setMsg('Essa tem uma rachadura! Quebraria na funda. (−3 s)');
      return;
    }
    if (o.kind === 'smooth') {
      o.gone = true;
      burst(s.parts, o.x, o.y, '#9cc8e8', 8);
      engine.sfx('coin');
      const n = picked + 1;
      setPicked(n);
      setMsg(['Lisinha!', 'Perfeita!', 'Redonda!', 'Mais uma!', 'Cinco! Pronto.'][n - 1]);
      if (n >= 5) window.setTimeout(() => onWin(starsOf(Math.max(0, s.time / TIME) * 1.4 - errors.current * 0.25)), 700);
    } else {
      engine.sfx('bonk');
      s.time -= 2;
      errors.current += 1;
      setMsg('Essa é áspera, não voa reto! (−2 s)');
    }
  };
  return (
    <>
      <Stage cv={cv} />
      {!paused && (
        <div className="absolute inset-0" onPointerDown={tap}>
          <Panel className="pointer-events-none absolute left-14 top-2 text-base">
            Pedras lisas: {picked}/5 · {Math.max(0, Math.ceil(st.current.time))} s{msg && <span className="ml-2 text-[#ffe08a]">{msg}</span>}
          </Panel>
        </div>
      )}
      {lost && (
        <Retry
          text="O tempo acabou. Procure as pedras lisas e redondas, que voam reto."
          onRetry={() => {
            setLost(false);
            setMsg(null);
            setRun((r) => r + 1);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 4b. Goliath

export function Goliath({ paused, onWin, diff = 1 }: GameProps) {
  const TOL = byDiff(diff, [4.6, 3.2, 2.3]);
  const AIM = byDiff(diff, [0.8, 1, 1.3]);
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState<string | null>(null);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { gx: 0, stones: 5, holding: false, power: 0, pt: 0, aimT: Math.random() * 6, shot: null as null | { t: number; ok: boolean; tx: number; ty: number }, fallen: 0, taunt: '', tauntT: 0, won: false, parts: [] as Part[], w: 320, now: 0, shield: true, shT: 1.5 };
  }
  useEffect(() => {
    st.current = fresh();
  }, [run]);
  const G = 3.2; // Goliath's scale
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    s.now = t;
    if (!s.gx) s.gx = w * 0.76;
    const live = !paused && !lost && !s.won;
    if (live) {
      s.gx -= (w * byDiff(diff, [0.28, 0.34, 0.42]) * dt) / 40;
      s.aimT += dt * (1.6 + (5 - s.stones) * 0.25) * AIM;
      // He hides behind his shield, then lowers it to mock David.
      s.shT -= dt;
      if (s.shT <= 0) {
        s.shield = !s.shield;
        s.shT = s.shield ? byDiff(diff, [1.2, 1.8, 2.4]) + Math.random() : byDiff(diff, [2.4, 1.8, 1.3]) + Math.random() * 0.6;
        if (!s.shield) {
          s.taunt = GOLIAS_TAUNTS[Math.floor(Math.random() * GOLIAS_TAUNTS.length)];
          s.tauntT = s.shT;
        }
      }
      if (s.holding) {
        s.pt += dt;
        const p = (s.pt / 0.8) % 2;
        s.power = p < 1 ? p : 2 - p;
        setH((h) => h + 1);
      }
      s.tauntT -= dt;
      if (s.tauntT <= 0) s.taunt = '';
      if (s.gx < w * 0.42) setLost('O gigante chegou perto demais! Confie no Senhor e tente de novo.');
    }
    SC.elah(ctx, w, t);
    // Armies watching.
    for (let k = 0; k < 6; k++) drawPerson(ctx, DLOOKS.soldado, 10 + k * 9, 96, 'right', 0);
    for (let k = 0; k < 6; k++) drawPerson(ctx, { ...DLOOKS.golias, robe: '#7a5a3a' }, w - 12 - k * 9, 96, 'left', 0);
    // David.
    const dx = w * 0.18;
    SC.bigPerson(ctx, DLOOKS.davi, dx, 166, 1.6, 'right', 0);
    if (s.holding) {
      const a = t * 20;
      ctx.fillStyle = '#5a3a20';
      ctx.fillRect(Math.round(dx + 6 + Math.cos(a) * 10), Math.round(166 - 46 + Math.sin(a) * 6), 3, 3);
    }
    // Goliath: big, with a spear; falls when hit.
    const headY = 166 - 30 * G + 8 * G;
    if (s.fallen) {
      const k = Math.min(1, (t - s.fallen) / 0.9);
      ctx.save();
      ctx.translate(Math.round(s.gx), 166);
      ctx.rotate((k * Math.PI) / 2);
      SC.bigPerson(ctx, DLOOKS.golias, 0, 0, G, 'left', 0);
      ctx.restore();
    } else {
      // Spear.
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(Math.round(s.gx + 13 * G), Math.round(166 - 40 * G), 3, Math.round(36 * G));
      ctx.fillStyle = '#c8c8d0';
      ctx.fillRect(Math.round(s.gx + 13 * G) - 1, Math.round(166 - 42 * G), 5, 8);
      SC.bigPerson(ctx, DLOOKS.golias, s.gx, 166, G, 'left', live ? Math.floor(t * 3) % 4 : 0);
      // The great bronze shield, raised over his face or lowered while he mocks.
      const shY = s.shield ? headY - 14 : headY + 30;
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(Math.round(s.gx - 9 * G) - 1, Math.round(shY) - 1, Math.round(9 * G) + 2, Math.round(11 * G) + 2);
      ctx.fillStyle = '#b8903a';
      ctx.fillRect(Math.round(s.gx - 9 * G), Math.round(shY), Math.round(9 * G), Math.round(11 * G));
      ctx.fillStyle = '#d8b050';
      ctx.fillRect(Math.round(s.gx - 9 * G), Math.round(shY), Math.round(3 * G), Math.round(11 * G));
      ctx.fillStyle = '#e8c868';
      ctx.fillRect(Math.round(s.gx - 6 * G), Math.round(shY + 4 * G), 4, 4);
      // Aim reticle moving over his head.
      if (live) {
        const ay = headY + Math.sin(s.aimT) * 10 * G * 0.5;
        const ax = s.gx - 1 * G;
        const onHead = Math.abs(ay - headY) < TOL;
        ctx.strokeStyle = onHead ? '#ff4a3a' : '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(ax) - 4.5, Math.round(ay) - 4.5, 9, 9);
        ctx.fillStyle = onHead ? '#ff4a3a' : '#ffffff';
        ctx.fillRect(Math.round(ax), Math.round(ay), 1, 1);
      }
      if (s.taunt && live) {
        ctx.font = '8px "Pixelify Sans", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#2a1a10';
        ctx.fillText(s.taunt, s.gx + 1, headY - 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(s.taunt, s.gx, headY - 23);
      }
    }
    // Stone in flight.
    if (s.shot) {
      const k = Math.min(1, (t - s.shot.t) / 0.45);
      const x = dx + (s.shot.tx - dx) * k;
      const y = 120 + (s.shot.ty - 120) * k - Math.sin(k * Math.PI) * 18;
      ctx.fillStyle = '#d8d0c4';
      ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      if (k >= 1) {
        const ok = s.shot.ok;
        s.shot = null;
        if (ok) {
          s.fallen = t;
          s.won = true;
          engine.drum('crash', 0, 1);
          engine.sfx('stomp');
          buzz([60, 40, 160]);
          burst(s.parts, s.gx, headY, '#ffffff', 16);
          window.setTimeout(() => engine.sfx('yay'), 700);
          window.setTimeout(() => onWin(s.stones >= 4 ? 3 : s.stones >= 2 ? 2 : 1), 1800);
        } else {
          if (s.shield) {
            engine.drum('crash', 0, 0.4);
            burst(s.parts, x, y, '#ffe066', 8);
          } else engine.drum('snare', 0, 0.5);
          burst(s.parts, x, y, '#c8b89c', 6);
          if (s.stones <= 0) setLost('As cinco pedras acabaram... Recomece com fé!');
        }
      }
    }
    s.parts = stepParts(s.parts, dt);
    SC.particlesDraw(ctx, s.parts);
  });

  const press = () => {
    const s = st.current;
    if (paused || lost || s.won || s.shot || s.stones <= 0) return;
    s.holding = true;
    s.pt = 0;
    s.power = 0;
  };
  const release = () => {
    const s = st.current;
    if (!s.holding) return;
    s.holding = false;
    s.stones -= 1;
    const G2 = G;
    const headY = 166 - 30 * G2 + 8 * G2;
    const ay = headY + Math.sin(s.aimT) * 10 * G2 * 0.5;
    const strong = s.power >= 0.7 && s.power <= 0.97;
    const onHead = Math.abs(ay - headY) < TOL;
    const ok = strong && onHead && !s.shield;
    engine.sfx('jump');
    s.shot = { t: s.now, ok, tx: strong ? s.gx - G2 : s.w * 0.18 + (s.gx - s.w * 0.18) * s.power * 0.8, ty: strong ? ay : 160 };
    setH((h) => h + 1);
  };
  const cv2 = cv;
  useKeys(
    (k) => (k === ' ' || k === 'enter' || k === 'z' || k === 'e') && press(),
    (k) => (k === ' ' || k === 'enter' || k === 'z' || k === 'e') && release(),
  );
  const s = st.current;
  return (
    <>
      <Stage cv={cv2} />
      {!paused && !lost && !s.won && (
        <>
          <Panel className="absolute left-14 top-2 flex items-center gap-2 text-base">
            Pedras: {'●'.repeat(Math.max(0, s.stones))}
            <span className="opacity-40">{'●'.repeat(5 - Math.max(0, s.stones))}</span>
          </Panel>
          <div className="absolute bottom-3 left-[max(0.75rem,env(safe-area-inset-left))] w-48">
            <Panel className="mb-1 text-sm">Força da funda</Panel>
            <div className="relative h-5 border-[3px] border-[#3a2414] bg-[#4a4250]">
              <div className="absolute inset-y-0 bg-[#6aaa3a]/70" style={{ left: '70%', width: '27%' }} />
              <div className="h-full bg-[#ffd23a]" style={{ width: `${s.power * 100}%` }} />
            </div>
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              press();
            }}
            onPointerUp={release}
            onPointerCancel={release}
            aria-label="Funda: segure e solte"
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Funda
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {lost && (
        <Retry
          text={lost}
          onRetry={() => {
            setLost(null);
            setRun((r) => r + 1);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 5. Cave of En Gedi

export function Cave({ paused, onWin, diff = 1 }: GameProps) {
  const TIME = byDiff(diff, [45, 34, 27]);
  const [phase, setPhase] = useState<'sneak' | 'cut' | 'choice' | 'done'>('sneak');
  const [caught, setCaught] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { x: 0, moving: false, walked: 0, saul: 'calm' as 'calm' | 'stir' | 'look' | 'twitch', timer: 2.5, w: 320, piece: false, noise: 0, time: TIME, gravel: [] as [number, number][] };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    if (!s.x) {
      s.x = w * 0.9;
      // Patches of loose gravel between David and Saul.
      s.gravel = [
        [w * 0.68, w * 0.76],
        [w * 0.46, w * 0.55],
      ];
      if (diff === 2) s.gravel.push([w * 0.37, w * 0.41]);
    }
    const target = w * 0.33;
    const live = !paused && !caught && phase === 'sneak';
    if (live) {
      s.time -= dt;
      if (s.time <= 0) {
        setCaught('Saul terminou o descanso e saiu da caverna! Seja mais rápido entre um olhar e outro.');
        engine.sfx('sad');
      }
      s.timer -= dt;
      if (s.timer <= 0) {
        if (s.saul === 'calm') {
          // Sometimes he only shifts and goes back to sleep.
          const fake = Math.random() < byDiff(diff, [0, 0.3, 0.4]);
          s.saul = fake ? 'twitch' : 'stir';
          s.timer = fake ? 0.6 : byDiff(diff, [0.95, 0.7, 0.5]);
          engine.playNote(50, 'keys', 0, 0.25);
        } else if (s.saul === 'stir') {
          s.saul = 'look';
          s.timer = 1.2 + Math.random() * 0.9;
        } else {
          s.saul = 'calm';
          s.timer = byDiff(diff, [2.2, 1.6, 1.3]) + Math.random() * 2;
        }
      }
      const onGravel = s.gravel.some(([a, b]) => s.x > a && s.x < b);
      s.noise = Math.max(0, s.noise - dt * 0.35);
      if (s.moving) {
        s.x = Math.max(target, s.x - 26 * dt);
        s.walked += 26 * dt;
        if (onGravel) s.noise += dt * byDiff(diff, [0.35, 0.55, 0.75]);
        if (s.noise >= 1 && s.saul !== 'look') {
          s.saul = 'stir';
          s.timer = 0.4;
          s.noise = 0.4;
        }
        if (s.saul === 'look') {
          setCaught('Saul viu um vulto se mexendo! Fique parado quando ele olhar.');
          engine.sfx('hurt');
          buzz([60, 40, 60]);
        }
        if (s.x <= target) {
          s.moving = false;
          setPhase('cut');
        }
      }
    }
    if (live && Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    SC.cave(ctx, w, t);
    for (const [ga, gb] of s.gravel)
      for (let x = ga; x < gb; x += 3) {
        ctx.fillStyle = Math.round(x) % 2 ? '#8a7a64' : '#6a5a48';
        ctx.fillRect(Math.round(x), 152 + (Math.round(x * 7) % 5), 2, 1);
      }
    // Saul resting, facing the back of the cave unless he turns.
    const sx = w * 0.22;
    const shake = s.saul === 'stir' || s.saul === 'twitch' ? Math.round(Math.sin(t * 50)) : 0;
    SC.bigPerson(ctx, { ...DLOOKS.saul, robe: s.piece ? '#7a2424' : DLOOKS.saul.robe }, sx + shake, 150, 1.8, s.saul === 'look' ? 'right' : 'left', 0);
    if (s.piece) {
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(Math.round(sx + 6), 141, 6, 5);
    }
    if (s.saul === 'stir' || s.saul === 'twitch') {
      ctx.font = '10px "Pixelify Sans", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe08a';
      ctx.fillText('Hm...?', sx, 88);
    }
    // David's men hiding in the dark at the back.
    for (let k = 0; k < 3; k++) drawPerson(ctx, { ...DLOOKS.irmao, robe: '#4a3a2a' }, w - 14 - k * 10, 128 - k * 3, 'left', 0);
    SC.bigPerson(ctx, DLOOKS.davi, s.x, 154, 1.5, 'left', s.moving ? Math.floor(s.walked / 5) % 4 : 0);
  });
  const retry = () => {
    st.current = fresh();
    setCaught(null);
    setPhase('sneak');
  };
  return (
    <>
      <Stage cv={cv} />
      {!paused && phase === 'sneak' && !caught && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">{st.current.saul === 'calm' ? 'Saul está distraído... avance!' : st.current.saul === 'look' ? 'PARE! Ele está olhando!' : 'Cuidado! Ele se mexeu...'}</Panel>
            <Panel className="flex items-center gap-2 text-base">
              Barulho
              <span className="h-3 w-16 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full', st.current.noise > 0.7 ? 'animate-pulse bg-[#d8402a]' : 'bg-[#e0a020]')} style={{ width: `${Math.min(100, st.current.noise * 100)}%` }} />
              </span>
            </Panel>
            <Panel className="text-base">{Math.max(0, Math.ceil(st.current.time))} s</Panel>
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              st.current.moving = true;
            }}
            onPointerUp={() => (st.current.moving = false)}
            onPointerCancel={() => (st.current.moving = false)}
            className="rpg-wood rpg-text absolute bottom-4 right-[max(1rem,env(safe-area-inset-right))] h-20 w-40 touch-none text-xl active:translate-y-0.5"
          >
            Avançar ◀ (segure)
          </button>
        </>
      )}
      {!paused && phase === 'cut' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-xl flex-col gap-2">
          <Qte
            kind="timing"
            title="Cortar a orla do manto"
            hint="Corte só quando a marca passar no verde: um corte em falso e ele acorda!"
            look={DLOOKS.davi}
            times={byDiff(diff, [1, 2, 3])}
            button="Cortar"
            onDone={(ok) => {
              if (!ok) {
                setCaught('A faca raspou e Saul acordou! Corte com calma, no verde.');
                return;
              }
              st.current.piece = true;
              engine.playNote(80, 'pluck', 0, 0.3);
              setPhase('choice');
            }}
          />
        </div>
      )}
      {!paused && phase === 'choice' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl items-stretch gap-2">
          <Portrait look={DLOOKS.davi} mood={msg ? 'sad' : 'neutral'} className="h-24 w-24" />
          <div className="rpg-frame rpg-text flex flex-1 flex-col justify-center gap-2 px-3 py-2 text-lg leading-snug">
            {msg ?? 'Abisai sussurra: “Deus entregou o teu inimigo na tua mão!” O que Davi faz?'}
            <span className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  engine.sfx('power');
                  setPhase('done');
                  window.setTimeout(() => onWin(starsOf((st.current.time / TIME) * 2.2)), 400);
                }}
                className="rpg-wood h-11 flex-1 px-2 text-base"
              >
                Poupar o ungido do Senhor
              </button>
              <button
                onClick={() => {
                  engine.sfx('bonk');
                  setMsg('O coração de Davi o acusa: “Não estenderei a minha mão contra o ungido do Senhor.” Escolha de novo.');
                }}
                className="rpg-wood h-11 flex-1 px-2 text-base"
              >
                Acabar com Saul
              </button>
            </span>
          </div>
        </div>
      )}
      {caught && <Retry text={caught} onRetry={retry} />}
    </>
  );
}

// ================================================================ 6. Dance before the ark

export function Ark({ paused, onWin, diff = 1 }: GameProps) {
  const wrong = useRef(0);
  const [run, setRun] = useState(0);
  const [lost, setLost] = useState(false);
  const score = useRef({ hit: 0, total: 0 });
  const [, setH] = useState(0);
  const start = useRef(0);
  const notes = useRef<Note[]>([]);
  const [chart, setChart] = useState<{ notes: Note[]; start: number }>({ notes: [], start: 0 });
  const pose = useRef<Dir>('down');

  useEffect(() => {
    if (paused) return;
    const beat = byDiff(diff, [0.55, 0.45, 0.38]);
    const list: Note[] = [];
    const pattern = byDiff(diff, [[1, 1, 1, 2], [1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5, 2], [1, 0.5, 0.5, 1, 0.5, 0.5, 0.5, 0.5, 1, 1]]);
    let t = 2;
    let k = 0;
    wrong.current = 0;
    while (t < 26) {
      const lane = Math.floor(Math.random() * 4);
      list.push({ t, lane });
      // Two arrows at once: both hands.
      if (diff > 0 && k % byDiff(diff, [99, 8, 5]) === 4) list.push({ t: t + 0.001, lane: (lane + 1 + Math.floor(Math.random() * 3)) % 4 });
      t += pattern[k++ % pattern.length] * beat;
    }
    notes.current = list;
    score.current = { hit: 0, total: list.length };
    start.current = performance.now();
    setChart({ notes: list, start: start.current });
    // Drums and lyre for the feast.
    const t0 = engine.now + 2;
    for (let b = 0; b < Math.ceil(25 / beat); b++) {
      engine.drum(b % 4 === 0 ? 'kick' : b % 2 ? 'hat' : 'clap', t0 + b * beat, 0.5);
      if (b % 4 === 0) engine.bass([38, 43, 45, 43][(b / 4) % 4], t0 + b * beat, beat * 3.5, 0.35);
    }
    const end = window.setTimeout(() => {
      const r = (score.current.hit - wrong.current * 0.5) / Math.max(1, score.current.total);
      if (r >= byDiff(diff, [0.55, 0.68, 0.78])) onWin(starsOf((r - 0.6) / 0.35));
      else setLost(true);
    }, 27.5 * 1000);
    return () => window.clearTimeout(end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, run]);

  const cv = useStage((ctx, w, dt, t) => {
    SC.jerusalem(ctx, w, t);
    // The ark carried by two priests, the crowd and the king dancing.
    const ax = w * 0.2 + Math.sin(t * 0.4) * 6;
    drawPerson(ctx, DLOOKS.sacerdote, ax - 24, 142, 'right', Math.floor(t * 4) % 4);
    drawPerson(ctx, DLOOKS.sacerdote, ax + 24, 142, 'right', (Math.floor(t * 4) + 2) % 4);
    SC.ark(ctx, ax, 120 - Math.abs(Math.sin(t * 4)) * 1.5, t);
    for (let k = 0; k < 8; k++) drawPerson(ctx, [DLOOKS.irmao, DLOOKS.jesse, { ...DLOOKS.irmao, robe: '#a84a3a' }, DLOOKS.soldado][k % 4], 14 + k * 16, 104 + (k % 2) * 4, 'down', Math.floor(t * 6 + k) % 2 ? 1 : 0);
    const hop = Math.abs(Math.sin(t * 6.3)) * 4;
    SC.bigPerson(ctx, { ...DLOOKS.rei, robe: '#f0e8d8' }, w * 0.42, 172 - hop, 1.8, pose.current, Math.floor(t * 8) % 4);
    void dt;
  });

  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <Panel className="absolute left-14 top-2 text-base">
            Acertos: {score.current.hit}/{score.current.total}
          </Panel>
          <Lanes
            key={run}
            notes={chart.notes}
            start={chart.start}
            labels={['◀', '▼', '▲', '▶']}
            colors={['#ff8a5a', '#5ab0ff', '#7ae05a', '#ffd23a']}
            approach={byDiff(diff, [1.5, 1.25, 1.05])}
            keys={[['arrowleft', 'a', 'd'], ['arrowdown', 's', 'f'], ['arrowup', 'w', 'j'], ['arrowright', 'k']]}
            onWrong={() => {
              wrong.current += 1;
              buzz(12);
            }}
            onHit={(n) => {
              score.current.hit += 1;
              pose.current = (['left', 'down', 'up', 'right'] as Dir[])[n.lane];
              engine.playNote([74, 76, 78, 81][n.lane], 'pluck', 0, 0.4);
              setH((h) => h + 1);
            }}
            onMiss={() => setH((h) => h + 1)}
          />
        </>
      )}
      {lost && (
        <Retry
          text="Faltou ritmo na festa! Dance de novo diante do Senhor."
          onRetry={() => {
            setLost(false);
            setRun((r) => r + 1);
          }}
        />
      )}
    </>
  );
}
