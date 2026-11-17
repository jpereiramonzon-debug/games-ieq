/**
 * Playable chapters of the story of Samson. Same stage as David's story: a
 * 180 px tall canvas, `paused` while dialogue is shown.
 */
import { useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Joystick } from '../pixel/Controls';
import { Portrait } from '../pixel/Dialog';
import { drawPerson, type Dir, type Look } from '../pixel/person';
import { Qte } from '../pixel/Qte';
import { burst, buzz, byDiff, starsOf, Panel, Retry as RetryBase, Stage, stepParts, useKeys, useStage, type GameProps, type Part } from '../pixel/stage';
import * as SC from '../david/scenes';
import { BIND, FREE, LIES } from './content';
import { SLOOKS } from './looks';
import { heroFace } from '../pixel/heroes';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={SLOOKS.sansao} />;
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const shake = (ctx: CanvasRenderingContext2D, amt: number) => amt > 0 && ctx.setTransform(1, 0, 0, 1, Math.round((Math.random() - 0.5) * amt * 2), Math.round((Math.random() - 0.5) * amt * 2));

// ---------------------------------------------------------------- scenery

function vineyard(ctx: CanvasRenderingContext2D, w: number, t: number) {
  SC.sky(ctx, w, ['#7ab8e0', '#94c8e8', '#b0d8ee', '#cce6f0'], 70);
  SC.hills(ctx, w, 70, '#a8b070', 12, 0.03, 2);
  rect(ctx, 0, 78, w, 102, '#b89a5a');
  for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, 80 + ((i * 29) % 98), 2, 1, '#a4864a');
  // Rows of vines with grapes.
  for (const y of [82, 96]) {
    rect(ctx, 0, y + 8, w, 2, '#5a3a1e');
    for (let x = 4; x < w; x += 14) {
      SC.blob(ctx, x, y + 3, 7, 5, '#5a8a32');
      rect(ctx, x - 1, y + 4 + (x % 3), 2, 3, '#6a2a6a');
      rect(ctx, x + 3, y + 2, 2, 3, '#7a3a7a');
    }
  }
  void t;
}

function lehi(ctx: CanvasRenderingContext2D, w: number, t: number) {
  SC.sky(ctx, w, ['#e8b878', '#f0c890', '#f4d8a8', '#f6e4c0'], 70);
  SC.hills(ctx, w, 66, '#b8946a', 22, 0.025, 1);
  SC.hills(ctx, w, 96, '#a88458', 10, 0.06, 4);
  rect(ctx, 0, 104, w, 76, '#d0b080');
  for (let i = 0; i < w * 0.7; i++) rect(ctx, (i * 43) % w, 106 + ((i * 31) % 72), 2, 1, '#bc9a6a');
  for (let k = 0; k < 4; k++) SC.blob(ctx, (k * 113 + 30) % w, 104, 9, 5, '#9a8468');
  void t;
}

function gazaNight(ctx: CanvasRenderingContext2D, w: number, dawn: number, scroll: number) {
  const sky = dawn > 0.66 ? ['#4a4a7a', '#7a6a8a', '#c88a7a', '#e8a878'] : dawn > 0.33 ? ['#1a1a3a', '#2a2a4a', '#3a3a5a', '#5a4a6a'] : ['#0a0a1e', '#121228', '#1a1a34', '#24243e'];
  SC.sky(ctx, w, sky, 110);
  for (let i = 0; i < 40; i++) rect(ctx, (i * 71 + 13) % w, (i * 37) % 80, 1, 1, `rgba(255,255,240,${(1 - dawn) * 0.9})`);
  rect(ctx, w * 0.82, 14, 10, 10, `rgba(250,240,200,${1 - dawn * 0.7})`);
  // Gaza's walls fall behind as Samson climbs.
  const cx0 = -scroll * 2 + 30;
  rect(ctx, cx0 - 60, 70, 110, 50, '#3a3040');
  for (let x = 0; x < 110; x += 8) rect(ctx, cx0 - 60 + x, 66, 5, 5, '#3a3040');
  // The hill rising to the right.
  for (let x = 0; x < w; x++) {
    const top = 150 - Math.max(0, (x + scroll * 3 - 80) * 0.08);
    rect(ctx, x, top, 1, 180 - top, '#3a3428');
    rect(ctx, x, top, 1, 2, '#5a5040');
  }
}

function temple(ctx: CanvasRenderingContext2D, w: number, crack: number, fall: number, t: number) {
  rect(ctx, 0, 0, w, 180, '#2a1e18');
  // Galleries full of people on the roof and the sides.
  rect(ctx, 0, 0, w, 40, '#4a3a2e');
  for (let x = 6; x < w; x += 9) {
    const bob = Math.round(Math.sin(t * 4 + x) * 1);
    SC.blob(ctx, x, 26 + bob, 3, 3, ['#a83a2a', '#c8a060', '#6a5a8a', '#5a8a5a'][x % 4]);
    SC.blob(ctx, x, 20 + bob, 2.4, 2.4, '#c88a58');
  }
  rect(ctx, 0, 36, w, 6, '#6a5240');
  rect(ctx, 0, 36, w, 1, '#8a7258');
  // Statue of Dagon at the back.
  rect(ctx, w * 0.5 - 10, 54, 20, 40, '#5a5a4a');
  SC.blob(ctx, w * 0.5, 54, 8, 8, '#6a6a58');
  rect(ctx, w * 0.5 - 14, 84, 28, 10, '#4a6a7a');
  // Floor.
  for (let y = 120; y < 180; y += 10) for (let x = ((y / 10) % 2) * 8; x < w; x += 16) rect(ctx, x, y, 15, 9, '#6a5a48');
  // The two central pillars.
  for (const s of [-1, 1]) {
    const px = w * 0.5 + s * 30;
    ctx.save();
    ctx.translate(px, 160);
    ctx.rotate(s * fall * 0.5);
    rect(ctx, -8, -120, 16, 120, '#2a1e18');
    rect(ctx, -7, -120, 14, 120, '#c8b896');
    rect(ctx, -7, -120, 4, 120, '#e0d4b8');
    rect(ctx, 3, -120, 4, 120, '#a89878');
    rect(ctx, -10, -124, 20, 6, '#b8a886');
    // Cracks grow as Samson pushes.
    ctx.fillStyle = '#2a1e18';
    for (let k = 0; k < Math.floor(crack * 8); k++) ctx.fillRect(-5 + ((k * 5) % 10), -110 + k * 13, 1 + (k % 2), 6);
    ctx.restore();
  }
}

// ================================================================ 1. The lion of Timnah

export function LionFight({ paused, onWin, diff = 1 }: GameProps) {
  const LION_HP = byDiff(diff, [10, 16, 22]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { hp: 100, lion: LION_HP, lx: 0, phase: 'prowl' as 'prowl' | 'crouch' | 'leap' | 'dazed' | 'dead', pt: 1.5, dodge: -1, dodged: false, feinted: false, hit: 0, shake: 0, parts: [] as Part[], w: 320, punch: 0, won: false };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    if (!s.lx) s.lx = w * 0.72;
    const live = !paused && !lost && !s.won;
    const sx = w * 0.28;
    if (live) {
      if (Math.floor(t * 10) !== Math.floor((t - dt) * 10)) setH((h) => h + 1);
      s.pt -= dt;
      s.dodge = Math.max(-1, s.dodge - dt);
      s.hit = Math.max(0, s.hit - dt);
      s.punch = Math.max(0, s.punch - dt);
      if (s.phase === 'prowl') {
        s.lx = w * 0.7 + Math.sin(t * 1.4) * 18;
        if (s.pt <= 0) {
          s.phase = 'crouch';
          s.pt = byDiff(diff, [0.85, 0.65, 0.48]);
          s.dodged = false;
          engine.sfx('dead');
        }
      } else if (s.phase === 'crouch') {
        if (s.pt <= 0) {
          // A feint: he crouches, then backs off and leaps a moment later.
          if (!s.dodged && Math.random() < byDiff(diff, [0, 0.25, 0.4]) && !s.feinted) {
            s.feinted = true;
            s.phase = 'prowl';
            s.pt = 0.35;
          } else {
            s.feinted = false;
            s.phase = 'leap';
            s.pt = 0.42;
          }
        }
      } else if (s.phase === 'leap') {
        const k = 1 - s.pt / 0.42;
        s.lx = w * 0.7 + (sx + 10 - w * 0.7) * k;
        if (s.pt <= 0) {
          if (s.dodged) {
            s.phase = 'dazed';
            s.pt = byDiff(diff, [2.4, 1.9, 1.5]);
            engine.sfx('bump');
          } else {
            s.hp -= 22;
            s.hit = 0.5;
            s.shake = 0.3;
            buzz([60, 30, 60]);
            engine.sfx('hurt');
            s.phase = 'prowl';
            s.pt = 1.2 + Math.random();
            if (s.hp <= 0) setLost(true);
          }
        }
      } else if (s.phase === 'dazed') {
        if (s.pt <= 0) {
          s.phase = 'prowl';
          s.pt = 1 + Math.random() * 1.2;
        }
      }
      s.shake = Math.max(0, s.shake - dt);
    }
    s.parts = stepParts(s.parts, dt);
    shake(ctx, s.shake * 10);
    vineyard(ctx, w, t);
    const leapY = s.phase === 'leap' ? -Math.sin((1 - s.pt / 0.42) * Math.PI) * 26 : 0;
    // Lion drawn twice as big.
    ctx.save();
    ctx.scale(2, 2);
    SC.lion(ctx, s.lx / 2, (160 + leapY) / 2 + (s.phase === 'crouch' ? 1 : 0), Math.floor(t * (s.phase === 'prowl' ? 8 : 2)), true, s.phase === 'dazed' && Math.floor(t * 8) % 2 === 0, false);
    ctx.restore();
    if (s.phase === 'crouch') {
      rect(ctx, s.lx - 3, 92, 6, 14, '#3a2414');
      rect(ctx, s.lx - 2, 93, 4, 9, '#ff4a3a');
      rect(ctx, s.lx - 2, 103, 4, 2, '#ff4a3a');
    }
    if (s.phase === 'dazed') for (let k = 0; k < 3; k++) rect(ctx, s.lx - 18 + Math.cos(t * 6 + k * 2) * 10, 118 + Math.sin(t * 6 + k * 2) * 3, 2, 2, '#ffe066');
    const dodgeX = s.dodge > 0 ? -18 * Math.sin((s.dodge / 0.5) * Math.PI) : 0;
    SC.bigPerson(ctx, SLOOKS.sansao, sx + dodgeX + (s.punch > 0 ? 6 : 0), 164 + (s.hit > 0 ? -2 : 0), 2, 'right', s.punch > 0 ? 1 : 0);
    SC.particlesDraw(ctx, s.parts);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  const dodge = () => {
    const s = st.current;
    if (paused || lost || s.won || s.dodge > -0.35) return;
    s.dodge = 0.5;
    engine.sfx('jump');
    if (s.phase === 'leap' || (s.phase === 'crouch' && s.pt < 0.25)) s.dodged = true;
  };
  const punch = () => {
    const s = st.current;
    if (paused || lost || s.won) return;
    s.punch = 0.12;
    if (s.phase !== 'dazed') return engine.drum('tom', 0, 0.3);
    s.lion -= 1;
    engine.drum('snare', 0, 0.9);
    buzz(20);
    s.shake = 0.08;
    burst(s.parts, s.lx - 20, 130, '#ffffff', 5);
    setH((h) => h + 1);
    if (s.lion <= 0) {
      s.won = true;
      s.phase = 'dead';
      engine.sfx('stomp');
      burst(s.parts, s.lx, 140, '#ffe066', 24);
      window.setTimeout(() => engine.sfx('yay'), 400);
      window.setTimeout(() => onWin(starsOf((s.hp / 100) * 1.2)), 1500);
    }
  };
  useKeys((k) => {
    if (k === 'shift' || k === 'x' || k === 'arrowdown' || k === 'arrowleft') dodge();
    if (k === ' ' || k === 'enter' || k === 'z' || k === 'e') punch();
  });
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Sansão
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#5ab0c8] transition-[width]" style={{ width: `${Math.max(0, s.hp)}%` }} />
              </span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Leão
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#d0703a] transition-[width]" style={{ width: `${(s.lion / LION_HP) * 100}%` }} />
              </span>
            </Panel>
          </div>
          <button
            onPointerDown={(e) => (e.preventDefault(), dodge())}
            className={cx('rpg-wood rpg-text absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] h-20 w-32 touch-none text-xl', s.phase === 'crouch' && 'animate-blink text-[#ffe08a]')}
          >
            Esquivar
          </button>
          <button
            onPointerDown={(e) => (e.preventDefault(), punch())}
            className={cx(
              'rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-xl shadow-[3px_3px_0_#0006] active:scale-95',
              s.phase === 'dazed' ? 'animate-blink bg-[#c8321f]' : 'bg-[#8a5a2e]',
            )}
          >
            Golpe
          </button>
        </>
      )}
      {lost && (
        <Retry
          text="O leão te derrubou! Espere ele agachar e esquive na hora do pulo."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 2. Foxes

export function Foxes({ paused, onWin, diff = 1 }: GameProps) {
  const FOX_NEED = byDiff(diff, [8, 10, 13]);
  const FOX_TIME = byDiff(diff, [50, 45, 40]);
  const FOX_SPEED = byDiff(diff, [50, 60, 68]);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { x: 160, y: 120, dir: 'right' as Dir, keys: { x: 0, y: 0 }, walked: 0, foxes: [] as { x: number; y: number; vx: number; vy: number; caught: boolean; t: number }[], got: 0, time: FOX_TIME, dash: 0, cool: 0, parts: [] as Part[], won: false };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    if (!s.foxes.length)
      for (let i = 0; i < 14; i++) s.foxes.push({ x: 20 + Math.random() * (w - 40), y: 70 + Math.random() * 100, vx: 0, vy: 0, caught: false, t: Math.random() * 2 });
    const live = !paused && !lost && !s.won;
    if (live) {
      s.time -= dt;
      if (s.time <= 0) setLost(true);
      if (Math.floor(s.time * 5) !== Math.floor((s.time + dt) * 5)) setH((h) => h + 1);
      s.dash = Math.max(0, s.dash - dt);
      s.cool = Math.max(0, s.cool - dt);
      const len = Math.max(1, Math.hypot(s.keys.x, s.keys.y));
      const sp = (s.dash > 0 ? 150 : 74) * dt;
      s.x = Math.max(8, Math.min(w - 8, s.x + (s.keys.x / len) * sp));
      s.y = Math.max(66, Math.min(174, s.y + (s.keys.y / len) * sp));
      s.walked += Math.hypot(s.keys.x, s.keys.y) * sp;
      if (s.keys.x || s.keys.y) s.dir = Math.abs(s.keys.x) > Math.abs(s.keys.y) ? (s.keys.x > 0 ? 'right' : 'left') : s.keys.y > 0 ? 'down' : 'up';
      for (const f of s.foxes) {
        if (f.caught) continue;
        const dx = f.x - s.x;
        const dy = f.y - (s.y - 6);
        const d = Math.hypot(dx, dy);
        f.t -= dt;
        if (d < 46) {
          // Run away, with a little zig-zag.
          const a = Math.atan2(dy, dx) + Math.sin(t * 6 + f.x) * 0.6;
          f.vx = Math.cos(a) * FOX_SPEED;
          f.vy = Math.sin(a) * FOX_SPEED;
        } else if (f.t <= 0) {
          const a = Math.random() * Math.PI * 2;
          f.vx = Math.cos(a) * 18;
          f.vy = Math.sin(a) * 18;
          f.t = 1 + Math.random() * 2;
        }
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x < 8 || f.x > w - 8) f.vx *= -1;
        if (f.y < 66 || f.y > 174) f.vy *= -1;
        f.x = Math.max(8, Math.min(w - 8, f.x));
        f.y = Math.max(66, Math.min(174, f.y));
        if (d < 11) {
          f.caught = true;
          s.got += 1;
          engine.sfx('coin');
          buzz(15);
          burst(s.parts, f.x, f.y, '#f0a050', 8);
          setH((h) => h + 1);
          if (s.got >= FOX_NEED) {
            s.won = true;
            engine.sfx('yay');
            window.setTimeout(() => onWin(starsOf((s.time / FOX_TIME) * 2.2)), 900);
          }
        }
      }
    }
    s.parts = stepParts(s.parts, dt);
    // Wheat field.
    rect(ctx, 0, 0, w, 180, '#d8b048');
    for (let i = 0; i < w * 2; i++) {
      const x = (i * 37) % w;
      const y = (i * 53) % 180;
      rect(ctx, x, y, 1, 3, i % 3 ? '#c09030' : '#f0d070');
    }
    rect(ctx, 0, 0, w, 60, '#8ab858');
    SC.hills(ctx, w, 56, '#7aa048', 6, 0.05, 2, 60);
    const list: { y: number; d: () => void }[] = [];
    for (const f of s.foxes)
      if (!f.caught)
        list.push({
          y: f.y,
          d: () => {
            const left = f.vx < 0;
            rect(ctx, f.x - 6, f.y - 1, 12, 2, 'rgba(40,24,10,0.25)');
            SC.blob(ctx, f.x, f.y - 4, 5, 3, '#e07a2a');
            const hx = left ? f.x - 6 : f.x + 6;
            SC.blob(ctx, hx, f.y - 6, 3, 2.6, '#e88a3a');
            rect(ctx, hx + (left ? -3 : 2), f.y - 6, 1, 1, '#2a1a10');
            rect(ctx, hx - 1, f.y - 10, 1, 2, '#c05a1a');
            rect(ctx, hx + 1, f.y - 10, 1, 2, '#c05a1a');
            const tx = left ? f.x + 6 : f.x - 9;
            rect(ctx, tx, f.y - 5 + Math.round(Math.sin(t * 10 + f.x)), 4, 2, '#e07a2a');
            rect(ctx, tx + (left ? 3 : 0), f.y - 5 + Math.round(Math.sin(t * 10 + f.x)), 1, 2, '#ffffff');
          },
        });
    const moving = live && (s.keys.x || s.keys.y);
    list.push({ y: s.y, d: () => drawPerson(ctx, SLOOKS.sansao, s.x, s.y, s.dir, moving ? Math.floor(s.walked / 6) % 4 : 0, s.dash > 0) });
    list.sort((a, b) => a.y - b.y).forEach((e) => e.d());
    SC.particlesDraw(ctx, s.parts);
  });
  const dash = () => {
    const s = st.current;
    if (paused || lost || s.cool > 0) return;
    s.dash = 0.4;
    s.cool = 1.2;
    engine.sfx('jump');
  };
  useKeys(
    (k) => {
      const s = st.current;
      if (k === ' ' || k === 'enter' || k === 'z' || k === 'e' || k === 'shift') dash();
      const ax: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (ax[k]) s.keys = { x: ax[k][0] || s.keys.x, y: ax[k][1] || s.keys.y };
    },
    (k) => {
      const s = st.current;
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') s.keys.x = 0;
      if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') s.keys.y = 0;
    },
  );
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <Panel className="pointer-events-none absolute left-14 top-2 text-base">
            Raposas: {s.got}/{FOX_NEED} · {Math.max(0, Math.ceil(s.time))} s
          </Panel>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (st.current.keys = { x, y })} />
          <button
            onPointerDown={(e) => (e.preventDefault(), dash())}
            className={cx(
              'rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-base shadow-[3px_3px_0_#0006] active:scale-95',
              s.cool > 0 ? 'bg-[#8a5a2e] opacity-70' : 'bg-[#c8321f]',
            )}
          >
            Arrancada
          </button>
        </>
      )}
      {lost && (
        <Retry
          text="As raposas foram mais espertas desta vez! Encurrale e use a arrancada."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 3. The jawbone (beat 'em up)

interface Foe {
  x: number;
  y: number;
  hp: number;
  max: number;
  boss: boolean;
  state: 'walk' | 'windup' | 'recover' | 'hurt' | 'down';
  t: number;
  flash: number;
  vx: number;
  look: Look;
  side: number;
  /** Spearman, archer (shoots from afar) or shield-bearer (blocks normal hits). */
  kind: 'spear' | 'archer' | 'shield';
  shield: boolean;
}

const KILLS = 40;

export function Jawbone({ paused, onWin, diff = 1 }: GameProps) {
  const WINDUP = byDiff(diff, [0.75, 0.6, 0.48]);
  const CAP = byDiff(diff, [5, 6, 8]);
  const [lost, setLost] = useState(false);
  const [bound, setBound] = useState(true);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return {
      x: 120,
      y: 150,
      dir: 'right' as Dir,
      keys: { x: 0, y: 0 },
      walked: 0,
      hp: 100,
      armed: false,
      bone: { x: 0, y: 150 },
      foes: [] as Foe[],
      arrows: [] as { x: number; y: number; vx: number }[],
      kills: 0,
      power: 0,
      swing: 0,
      combo: 0,
      lastSwing: -9,
      chain: 0,
      chainT: 0,
      inv: 0,
      shake: 0,
      stop: 0,
      flash: 0,
      spawn: 1,
      parts: [] as Part[],
      pops: [] as { x: number; y: number; t: number; text: string; c: string }[],
      won: false,
      time: 0,
      now: 0,
      w: 320,
    };
  }
  const reset = () => {
    st.current = fresh();
    setBound(true);
    setLost(false);
  };

  const cv = useStage((ctx, w, rawDt, t) => {
    const s = st.current;
    s.w = w;
    s.now = t;
    if (!s.bone.x) {
      s.x = w * 0.35;
      s.bone = { x: w * 0.62, y: 156 };
    }
    // Hit-stop: freeze a few frames on strong hits.
    const dt = s.stop > 0 ? 0 : rawDt;
    s.stop = Math.max(0, s.stop - rawDt);
    const live = !paused && !lost && !bound && !s.won;
    if (live) {
      s.time += dt;
      s.inv = Math.max(0, s.inv - dt);
      s.swing = Math.max(0, s.swing - dt);
      s.chainT = Math.max(0, s.chainT - dt);
      if (!s.chainT) s.chain = 0;
      const len = Math.max(1, Math.hypot(s.keys.x, s.keys.y));
      const sp = (s.swing > 0 ? 20 : 66) * dt;
      s.x = Math.max(10, Math.min(w - 10, s.x + (s.keys.x / len) * sp));
      s.y = Math.max(112, Math.min(174, s.y + (s.keys.y / len) * sp * 0.7));
      if (s.keys.x || s.keys.y) s.walked += sp;
      if (s.keys.x && s.swing <= 0) s.dir = s.keys.x > 0 ? 'right' : 'left';
      if (!s.armed && Math.hypot(s.bone.x - s.x, s.bone.y - s.y) < 14) {
        s.armed = true;
        engine.sfx('power');
        buzz(40);
        pop(s.x, s.y - 40, 'Queixada!', '#ffe066');
      }
      // Spawning: more at once as the fight goes on.
      const alive = s.foes.filter((f) => f.state !== 'down').length;
      const cap = Math.min(CAP, 2 + Math.floor(s.kills / 7));
      s.spawn -= dt;
      if (s.armed && s.spawn <= 0 && alive < cap && s.kills + alive < KILLS) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const boss = (s.kills + alive) % 10 === 9;
        const look = boss ? SLOOKS.chefe : { ...SLOOKS.filisteu, robe: ['#a83a2a', '#8a4a2a', '#9a3a4a'][Math.floor(Math.random() * 3)] };
        const r = Math.random();
        const kind: Foe['kind'] = boss || s.kills < 4 ? 'spear' : r < byDiff(diff, [0, 0.2, 0.28]) ? 'archer' : r < byDiff(diff, [0.12, 0.4, 0.55]) ? 'shield' : 'spear';
        const hp = (boss ? 5 : 2) + (diff === 2 && !boss ? 1 : 0);
        s.foes.push({ x: side < 0 ? -16 : w + 16, y: 118 + Math.random() * 54, hp, max: hp, boss, state: 'walk', t: 0, flash: 0, vx: 0, look: kind === 'archer' ? { ...look, robe: '#5a6a3a', head: 'turban', headColor: '#c8b890' } : look, side, kind, shield: kind === 'shield' });
        s.spawn = 0.9 + Math.random() * 0.6;
      }
      for (const f of s.foes) {
        f.t -= dt;
        f.flash = Math.max(0, f.flash - dt);
        if (f.state === 'down') {
          f.x += f.vx * dt;
          f.vx *= 0.92;
          continue;
        }
        const dx = s.x - f.x;
        const dy = s.y - f.y;
        if (f.state === 'hurt') {
          f.x += f.vx * dt;
          f.vx *= 0.85;
          if (f.t <= 0) f.state = 'walk';
        } else if (f.state === 'walk') {
          // Stand a little to the side of Samson, lined up with him (archers keep their distance).
          const want = s.x - Math.sign(dx || f.side) * (f.kind === 'archer' ? 92 : 20);
          const mx = want - f.x;
          const v = (f.boss ? 30 : 38) * dt;
          if (Math.abs(mx) > 2) f.x += Math.sign(mx) * Math.min(v, Math.abs(mx));
          if (Math.abs(dy) > 2) f.y += Math.sign(dy) * Math.min(v * 0.7, Math.abs(dy));
          if (f.kind === 'archer' ? Math.abs(Math.abs(dx) - 92) < 10 && Math.abs(dy) < 5 : Math.abs(dx) < 26 && Math.abs(dy) < 8) {
            f.state = 'windup';
            f.t = f.kind === 'archer' ? WINDUP + 0.35 : f.boss ? WINDUP + 0.1 : WINDUP;
          }
        } else if (f.state === 'windup') {
          if (f.t <= 0 && f.kind === 'archer') {
            s.arrows.push({ x: f.x + Math.sign(dx) * 8, y: f.y - 16, vx: Math.sign(dx) * 150 });
            engine.playNote(88, 'pluck', 0, 0.2);
            f.state = 'recover';
            f.t = 1.4;
          } else if (f.t <= 0) {
            if (Math.abs(dx) < 30 && Math.abs(dy) < 10 && s.inv <= 0) {
              s.hp -= f.boss ? 12 : 7;
              s.inv = 0.7;
              s.shake = 0.25;
              s.chain = 0;
              s.x += Math.sign(dx) * 10;
              engine.sfx('hurt');
              buzz([50, 30, 50]);
              pop(s.x, s.y - 40, `-${f.boss ? 12 : 7}`, '#ff6a5a');
              if (s.hp <= 0) {
                setLost(true);
                engine.sfx('dead');
              }
            }
            f.state = 'recover';
            f.t = 0.9;
          }
        } else if (f.state === 'recover') {
          f.x -= Math.sign(dx) * 14 * dt;
          if (f.t <= 0) f.state = 'walk';
        }
      }
      for (const a of s.arrows) {
        a.x += a.vx * dt;
        if (Math.abs(a.x - s.x) < 6 && Math.abs(a.y - (s.y - 16)) < 7 && s.inv <= 0) {
          a.x = -999;
          s.hp -= 6;
          s.inv = 0.6;
          s.shake = 0.2;
          s.chain = 0;
          engine.sfx('hurt');
          buzz([40, 20, 40]);
          pop(s.x, s.y - 40, '-6', '#ff6a5a');
          if (s.hp <= 0) {
            setLost(true);
            engine.sfx('dead');
          }
        }
      }
      s.arrows = s.arrows.filter((a) => a.x > -20 && a.x < w + 20);
      s.foes = s.foes.filter((f) => !(f.state === 'down' && f.t < -0.8));
      if (s.kills >= KILLS && !s.won) {
        s.won = true;
        engine.sfx('yay');
        buzz([80, 40, 80, 40, 160]);
        for (const f of s.foes) if (f.state !== 'down') ((f.state = 'down'), (f.vx = Math.sign(f.x - s.x) * 120), (f.t = 0));
        window.setTimeout(() => onWin(starsOf((s.hp / 100) * 1.3)), 1800);
      }
      if (Math.floor(s.time * 6) !== Math.floor((s.time - dt) * 6)) setH((h) => h + 1);
    }
    s.shake = Math.max(0, s.shake - rawDt);
    s.flash = Math.max(0, s.flash - rawDt);
    s.parts = stepParts(s.parts, dt);
    s.pops = s.pops.filter((p) => t - p.t < 0.9);

    // ---- draw
    shake(ctx, s.shake * 12);
    lehi(ctx, w, t);
    if (!s.armed) {
      const by = s.bone.y - 6 + Math.sin(t * 4) * 1.5;
      ctx.fillStyle = `rgba(255,240,180,${0.35 + Math.sin(t * 6) * 0.15})`;
      ctx.beginPath();
      ctx.arc(s.bone.x, by, 9, 0, Math.PI * 2);
      ctx.fill();
      drawBone(ctx, s.bone.x - 6, by, 0);
    }
    const list: { y: number; d: () => void }[] = [];
    for (const f of s.foes) {
      list.push({
        y: f.y,
        d: () => {
          const fx = Math.round(f.x);
          const dir: Dir = s.x < f.x ? 'left' : 'right';
          if (f.state === 'down') {
            ctx.globalAlpha = Math.max(0, 1 + f.t * 1.2);
            ctx.save();
            ctx.translate(fx, f.y);
            ctx.rotate(Math.sign(f.vx || 1) * Math.min(Math.PI / 2, -f.t * 6 + 0.6));
            drawPerson(ctx, f.look, 0, 0, dir, 0);
            ctx.restore();
            ctx.globalAlpha = 1;
            return;
          }
          drawPerson(ctx, f.flash > 0 ? { ...f.look, robe: '#ffffff', skin: '#ffffff' } : f.look, fx, f.y, dir, f.state === 'walk' ? Math.floor(t * 8 + f.x) % 4 : 0);
          const sx = dir === 'left' ? -1 : 1;
          if (f.kind === 'archer') {
            rect(ctx, fx + sx * 5, f.y - 24, 1, 14, '#6a4220');
            if (f.state === 'windup') {
              ctx.fillStyle = `rgba(255,80,60,${0.35 + Math.sin(t * 20) * 0.2})`;
              ctx.fillRect(sx > 0 ? fx + 6 : 0, Math.round(f.y - 17), sx > 0 ? w : fx - 6, 1);
            }
            return;
          }
          if (f.shield) {
            rect(ctx, fx + sx * 6 - (sx < 0 ? 6 : 0), f.y - 24, 6, 16, '#2a1a10');
            rect(ctx, fx + sx * 6 - (sx < 0 ? 5 : -1), f.y - 23, 4, 14, '#b8903a');
          }
          // Spear: raised in the windup, thrust at the end.
          const lift = f.state === 'windup' ? -6 : 0;
          const reach = f.state === 'recover' && f.t > 0.7 ? 10 : 0;
          rect(ctx, fx + sx * 4, f.y - 18 + lift, sx * (16 + reach), 1, '#5a3a20');
          rect(ctx, fx + sx * (20 + reach) - (sx < 0 ? 3 : 0), f.y - 19 + lift, 3, 3, '#c8c8d0');
          if (f.state === 'windup') {
            rect(ctx, fx - 2, f.y - 44, 4, 8, '#3a2414');
            rect(ctx, fx - 1, f.y - 43, 2, 5, '#ff4a3a');
            rect(ctx, fx - 1, f.y - 37, 2, 1, '#ff4a3a');
          }
          if (f.boss) {
            rect(ctx, fx - 8, f.y - 40, 16, 3, '#2a1a10');
            rect(ctx, fx - 7, f.y - 39, Math.round((14 * f.hp) / f.max), 1, '#ff6a3a');
          }
        },
      });
    }
    list.push({
      y: s.y,
      d: () => {
        if (s.inv > 0 && Math.floor(t * 20) % 2) return;
        drawPerson(ctx, SLOOKS.sansao, s.x, s.y, s.dir, s.keys.x || s.keys.y ? Math.floor(s.walked / 6) % 4 : 0);
        if (s.armed) {
          const sx = s.dir === 'left' ? -1 : 1;
          const k = s.swing > 0 ? 1 - s.swing / 0.22 : 0;
          const ang = s.swing > 0 ? -1.6 + k * 2.8 : -0.4;
          ctx.save();
          ctx.translate(Math.round(s.x + sx * 6), Math.round(s.y - 16));
          ctx.scale(sx, 1);
          ctx.rotate(ang);
          drawBone(ctx, 0, -2, 0);
          ctx.restore();
          if (s.swing > 0) {
            // Swing arc.
            ctx.strokeStyle = s.combo === 3 ? 'rgba(255,224,100,0.9)' : 'rgba(255,255,255,0.75)';
            ctx.lineWidth = s.combo === 3 ? 3 : 2;
            ctx.beginPath();
            ctx.arc(s.x + sx * 6, s.y - 16, 18, sx > 0 ? -1.4 : Math.PI - 1.2, sx > 0 ? -1.4 + k * 2.6 : Math.PI - 1.2 + k * 2.6, false);
            ctx.stroke();
          }
        }
      },
    });
    list.sort((a, b) => a.y - b.y).forEach((e) => e.d());
    for (const a of s.arrows) {
      rect(ctx, a.x - 5, a.y, 10, 1, '#5a3a20');
      rect(ctx, a.vx > 0 ? a.x + 5 : a.x - 7, a.y - 1, 2, 3, '#c8c8d0');
    }
    SC.particlesDraw(ctx, s.parts);
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    for (const p of s.pops) {
      const k = (t - p.t) / 0.9;
      ctx.globalAlpha = 1 - k * k;
      ctx.fillStyle = '#2a1a10';
      ctx.fillText(p.text, p.x + 1, p.y - k * 12 + 1);
      ctx.fillStyle = p.c;
      ctx.fillText(p.text, p.x, p.y - k * 12);
    }
    ctx.globalAlpha = 1;
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(255,240,180,${s.flash * 1.6})`;
      ctx.fillRect(0, 0, w, 180);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });

  function pop(x: number, y: number, text: string, c = '#ffffff') {
    st.current.pops.push({ x, y, t: st.current.now, text, c });
  }

  const hitFoe = (f: Foe, dmg: number, knock: number) => {
    const s = st.current;
    f.hp -= dmg;
    f.flash = 0.12;
    f.vx = Math.sign(f.x - s.x || 1) * knock;
    s.stop = dmg > 1 ? 0.07 : 0.04;
    s.shake = Math.max(s.shake, dmg > 1 ? 0.18 : 0.08);
    s.chain += 1;
    s.chainT = 1.2;
    burst(s.parts, f.x, f.y - 16, '#ffffff', 6);
    burst(s.parts, f.x, f.y - 16, '#ffe066', 3);
    if (f.hp <= 0) {
      f.state = 'down';
      f.t = 0;
      f.vx = Math.sign(f.x - s.x || 1) * (knock + 60);
      s.kills += 1;
      s.power = Math.min(100, s.power + (f.boss ? 30 : 12));
      engine.sfx('stomp');
      pop(f.x, f.y - 40, '+25', '#ffe066');
    } else {
      f.state = 'hurt';
      f.t = 0.3;
    }
  };
  const attack = () => {
    const s = st.current;
    if (paused || lost || bound || s.won || s.swing > 0) return;
    const now = s.time;
    s.combo = now - s.lastSwing < 0.55 ? (s.combo % 3) + 1 : 1;
    s.lastSwing = now;
    s.swing = 0.22;
    const sx = s.dir === 'left' ? -1 : 1;
    const range = s.armed ? 34 : 16;
    const dmg = s.armed ? (s.combo === 3 ? 2 : 1) : 0.5;
    let hit = false;
    for (const f of s.foes) {
      if (f.state === 'down') continue;
      const dx = (f.x - s.x) * sx;
      if (dx > -4 && dx < range && Math.abs(f.y - s.y) < 12) {
        if (f.shield && s.combo !== 3) {
          // Blocked: only the third blow of the combo breaks the shield.
          engine.drum('crash', 0, 0.3);
          f.flash = 0.06;
          pop(f.x, f.y - 40, 'Bloqueou!', '#c8c8d0');
          hit = true;
          continue;
        }
        if (f.shield) {
          f.shield = false;
          pop(f.x, f.y - 46, 'Escudo quebrado!', '#ffe066');
        }
        hitFoe(f, dmg, s.combo === 3 ? 90 : 30);
        hit = true;
      }
    }
    // Swinging also knocks arrows out of the air.
    for (const a of s.arrows) {
      if (Math.abs(a.x - s.x) < range && Math.abs(a.y - (s.y - 16)) < 12 && Math.sign(a.x - s.x) === sx) {
        a.x = -999;
        burst(s.parts, s.x + sx * 14, s.y - 16, '#ffffff', 4);
        pop(s.x, s.y - 44, 'Rebateu!', '#b8f07a');
      }
    }
    if (hit) {
      engine.drum(s.combo === 3 ? 'kick' : 'snare', 0, 0.9);
      buzz(s.combo === 3 ? 35 : 15);
    } else engine.drum('hat', 0, 0.5);
    setH((h) => h + 1);
  };
  const power = () => {
    const s = st.current;
    if (paused || lost || bound || s.won || s.power < 100) return;
    s.power = 0;
    s.flash = 0.5;
    s.shake = 0.5;
    s.stop = 0.12;
    engine.sfx('power');
    engine.drum('crash', 0, 1);
    buzz([30, 20, 120]);
    for (let k = 0; k < 40; k++) s.parts.push({ x: s.x, y: s.y - 16, vx: Math.cos(k) * (60 + (k % 5) * 20), vy: Math.sin(k) * (60 + (k % 5) * 20), c: k % 2 ? '#ffe066' : '#ffffff', life: 0.7 });
    for (const f of s.foes)
      if (f.state !== 'down') {
        f.shield = false;
        hitFoe(f, 3, 140);
      }
    s.arrows = [];
    setH((h) => h + 1);
  };
  useKeys(
    (k) => {
      const s = st.current;
      if (k === ' ' || k === 'enter' || k === 'z' || k === 'e') attack();
      if (k === 'x' || k === 'q' || k === 'shift') power();
      const ax: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (ax[k]) s.keys = { x: ax[k][0] || s.keys.x, y: ax[k][1] || s.keys.y };
    },
    (k) => {
      const s = st.current;
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') s.keys.x = 0;
      if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') s.keys.y = 0;
    },
  );

  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && !bound && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Vida
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full transition-[width]', s.hp > 35 ? 'bg-[#5ab0c8]' : 'animate-pulse bg-[#d8402a]')} style={{ width: `${Math.max(0, s.hp)}%` }} />
              </span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Força
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full transition-[width]', s.power >= 100 ? 'animate-pulse bg-[#ffe066]' : 'bg-[#e0a020]')} style={{ width: `${s.power}%` }} />
              </span>
            </Panel>
            <Panel className="text-base">
              Filisteus: <span className="tabular-nums text-[#ffe08a]">{s.kills * 25}</span>/1000
            </Panel>
            {s.chain > 1 && (
              <span key={s.chain} className="rpg-text animate-pop self-center text-2xl text-[#ffe066]">
                {s.chain} combo!
              </span>
            )}
          </div>
          {!s.armed && <Panel className="pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 text-base">Pegue a queixada que brilha no chão!</Panel>}
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (st.current.keys = { x, y })} />
          <button
            onPointerDown={(e) => (e.preventDefault(), power())}
            disabled={s.power < 100}
            className={cx(
              'rpg-text absolute bottom-28 right-[max(1.5rem,env(safe-area-inset-right))] grid h-16 w-16 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-sm shadow-[3px_3px_0_#0006]',
              s.power >= 100 ? 'animate-blink bg-[#e8b830] text-[#3a2414]' : 'bg-[#5a4a3a] opacity-60',
            )}
          >
            Poder
          </button>
          <button
            onPointerDown={(e) => (e.preventDefault(), attack())}
            className="rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-xl shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Golpe
          </button>
        </>
      )}
      {!paused && bound && !lost && (
        <Qte
          kind="mash"
          title="Romper as cordas!"
          hint="O Espírito do Senhor veio sobre ele! Toque sem parar!"
          look={SLOOKS.sansao}
          img={heroFace('sansao')}
          bg="#c8a070"
          times={12}
          seconds={4}
          button="Romper!"
          onDone={(ok) => {
            if (ok) {
              setBound(false);
              buzz([40, 20, 40]);
            } else reset();
          }}
        />
      )}
      {lost && <Retry text="Os filisteus te cercaram! Ande para não ficar no meio deles e use o Poder quando a Força encher." onRetry={reset} />}
    </>
  );
}

function drawBone(ctx: CanvasRenderingContext2D, x: number, y: number, _a: number) {
  // Donkey's jawbone: a curved bone with teeth.
  rect(ctx, x - 1, y - 2, 14, 5, '#2a1a10');
  rect(ctx, x, y - 1, 12, 3, '#f0e6c8');
  rect(ctx, x + 10, y - 4, 3, 4, '#2a1a10');
  rect(ctx, x + 11, y - 3, 1, 3, '#f0e6c8');
  for (let k = 0; k < 4; k++) rect(ctx, x + 2 + k * 2, y + 2, 1, 1, '#ffffff');
  rect(ctx, x, y - 1, 12, 1, '#fffaf0');
}

// ================================================================ 4. The gates of Gaza

export function Gates({ paused, onWin, diff = 1 }: GameProps) {
  const WOBBLE = byDiff(diff, [0.8, 1.05, 1.35]);
  const drops = useRef(0);
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { dist: 0, tilt: 0, vel: 0, drift: 0.3, walking: false, time: 0, dropped: 0, msg: '', won: false, parts: [] as Part[] };
  }
  const DAWN = byDiff(diff, [80, 66, 56]);
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.won;
    if (live) {
      s.time += dt;
      if (s.time > DAWN) setLost(true);
      s.dropped = Math.max(0, s.dropped - dt);
      if (Math.random() < dt * 0.8) s.drift = (Math.random() - 0.5) * 1.4;
      const wobble = (s.walking && !s.dropped ? 1.6 : 0.6) * WOBBLE;
      s.vel += (s.drift * wobble + s.tilt * 1.4) * dt;
      s.vel *= 0.985;
      s.tilt += s.vel * dt;
      if (s.walking && !s.dropped) s.dist = Math.min(100, s.dist + dt * 3.4);
      if (Math.abs(s.tilt) > 1) {
        // The gates slip: lose some ground.
        s.dropped = 1.4;
        s.tilt = 0;
        s.vel = 0;
        s.dist = Math.max(0, s.dist - byDiff(diff, [6, 10, 14]));
        drops.current += 1;
        engine.drum('kick', 0, 1);
        engine.sfx('bonk');
        buzz([80, 40, 80]);
        s.msg = 'Escorregou! Equilibre com ◀ ▶';
        burst(s.parts, w * 0.4, 150, '#8a7a5a', 14);
      }
      if (s.dist >= 100 && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf((1 - s.time / DAWN) * 2 - drops.current * 0.25)), 1200);
      }
      if (Math.floor(s.time * 8) !== Math.floor((s.time - dt) * 8)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    gazaNight(ctx, w, Math.min(1, s.time / DAWN), s.dist);
    const px = w * 0.4;
    const ground = 150 - Math.max(0, (px + s.dist * 3 - 80) * 0.08);
    SC.bigPerson(ctx, SLOOKS.sansao, px, ground + 1, 2, 'right', s.walking && !s.dropped ? Math.floor(t * 6) % 4 : 0);
    // The gates and posts on his shoulders, tilting.
    ctx.save();
    ctx.translate(Math.round(px), Math.round(ground - 50));
    ctx.rotate(s.dropped ? 0.5 : s.tilt * 0.45);
    rect(ctx, -34, -30, 68, 32, '#2a1a10');
    rect(ctx, -33, -29, 32, 30, '#7a5230');
    rect(ctx, 1, -29, 32, 30, '#6a4424');
    for (let y = -26; y < 0; y += 6) rect(ctx, -33, y, 66, 1, '#4a2c14');
    rect(ctx, -38, -34, 6, 40, '#5a4a3a');
    rect(ctx, 32, -34, 6, 40, '#5a4a3a');
    rect(ctx, -36, -14, 72, 3, '#9a9aa0');
    ctx.restore();
    SC.particlesDraw(ctx, s.parts);
  });
  const nudge = (d: number) => {
    const s = st.current;
    if (paused || lost) return;
    s.vel += d * 0.55;
    engine.drum('tom', 0, 0.25);
  };
  useKeys(
    (k) => {
      if (k === 'arrowleft' || k === 'a') nudge(-1);
      if (k === 'arrowright' || k === 'd') nudge(1);
      if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'enter') st.current.walking = true;
    },
    (k) => {
      if (k === ' ' || k === 'arrowup' || k === 'w' || k === 'enter') st.current.walking = false;
    },
  );
  const s = st.current;
  const lean = s.tilt;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Morro
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#6aaa3a]" style={{ width: `${s.dist}%` }} />
              </span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Amanhecer
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#f0a050]" style={{ width: `${Math.min(100, (s.time / DAWN) * 100)}%` }} />
              </span>
            </Panel>
          </div>
          {/* Balance gauge */}
          <div className="pointer-events-none absolute left-1/2 top-14 w-48 -translate-x-1/2">
            <div className="relative h-4 border-2 border-[#3a2414] bg-[#4a4250]">
              <div className="absolute inset-y-0 left-[30%] right-[30%] bg-[#6aaa3a]/50" />
              <div className={cx('absolute -top-1 bottom-[-0.25rem] w-1.5 -translate-x-1/2 bg-white', Math.abs(lean) > 0.6 && 'bg-[#ff4a3a]')} style={{ left: `${50 + Math.max(-1, Math.min(1, lean)) * 50}%` }} />
            </div>
            {s.dropped > 0 && <p className="rpg-text mt-1 text-center text-sm text-[#ffb08a]">{s.msg}</p>}
          </div>
          <div className="absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                onPointerDown={(e) => (e.preventDefault(), nudge(-d))}
                className={cx('rpg-wood rpg-text h-20 w-20 touch-none text-3xl', lean * d > 0.45 && 'animate-blink text-[#ffe08a]')}
                aria-label={d < 0 ? 'Equilibrar para a direita' : 'Equilibrar para a esquerda'}
              >
                {d < 0 ? '◀' : '▶'}
              </button>
            ))}
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              st.current.walking = true;
            }}
            onPointerUp={() => (st.current.walking = false)}
            onPointerCancel={() => (st.current.walking = false)}
            className="rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Subir
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {lost && (
        <Retry
          text="Amanheceu antes de você chegar ao topo! Ande e equilibre ao mesmo tempo."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 5. Delilah

export function Delilah({ paused, onWin, diff = 1 }: GameProps) {
  const fails = useRef(0);
  const [round, setRound] = useState(0);
  const [step, setStep] = useState<'ask' | 'bound' | 'alarm' | 'free' | 'secret' | 'told' | 'cut' | 'weak'>('ask');
  const [refuse, setRefuse] = useState(0);
  const [bald, setBald] = useState(false);
  const cv = useStage((ctx, w, dt, t) => {
    SC.palace(ctx, w);
    // Purple hangings for Delilah's house.
    ctx.fillStyle = 'rgba(90,30,90,0.25)';
    ctx.fillRect(0, 0, w, 84);
    // Couch.
    rect(ctx, w * 0.3 - 30, 138, 70, 14, '#3a2414');
    rect(ctx, w * 0.3 - 29, 139, 68, 8, '#8a3a6a');
    const look = bald ? SLOOKS.careca : SLOOKS.sansao;
    SC.bigPerson(ctx, look, w * 0.3, 162, 2, 'right', 0);
    if (step === 'bound' || step === 'alarm') for (let k = 0; k < 3; k++) rect(ctx, w * 0.3 - 16, 120 + k * 8, 32, 2, step === 'alarm' ? '#c8a060' : '#a88a50');
    SC.bigPerson(ctx, SLOOKS.dalila, w * 0.55, 162, 2, 'left', 0);
    if (step === 'alarm' || step === 'weak' || step === 'free') {
      for (let k = 0; k < 3; k++) drawPerson(ctx, SLOOKS.filisteu, w - 20 - k * 14, 150 + (k % 2) * 6, 'left', Math.floor(t * 8 + k) % 4);
    }
    if (step === 'cut') for (let k = 0; k < 6; k++) rect(ctx, w * 0.3 - 10 + k * 4, 112 + ((t * 40 + k * 7) % 40), 2, 3, '#3a2010');
    void dt;
  });
  const lie = LIES[Math.min(round, LIES.length - 1)];
  const box = (look: Look, name: string, text: string, buttons: { label: string; fn: () => void }[], mood: 'neutral' | 'happy' | 'sad' | 'stern' = 'neutral') => (
    <div className="absolute inset-x-2 bottom-2 mx-auto flex max-w-3xl items-stretch gap-2">
      <Portrait look={look} mood={mood} bg={name === 'Dalila' ? '#b88ab8' : '#c8a070'} className="h-24 w-24" />
      <div className="rpg-frame rpg-text flex flex-1 flex-col justify-center gap-2 px-3 py-2 text-lg leading-snug">
        <span className="text-sm text-[#ffe08a]">{name}</span>
        {text}
        <span className="flex flex-wrap gap-2">
          {buttons.map((b) => (
            <button key={b.label} onClick={b.fn} className="rpg-wood min-h-10 flex-1 px-2 py-1 text-base active:translate-y-0.5">
              {b.label}
            </button>
          ))}
        </span>
      </div>
    </div>
  );
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      {step === 'ask' &&
        box(
          SLOOKS.dalila,
          'Dalila',
          lie.q,
          [...lie.options].map((o) => ({
            label: o,
            fn: () => {
              engine.playNote(72, 'bell', 0, 0.2);
              setStep('bound');
            },
          })),
          'happy',
        )}
      {step === 'bound' && box(SLOOKS.sansao, 'Narrador', BIND[round], [{ label: 'Continuar', fn: () => (engine.sfx('dead'), setStep('alarm')) }])}
      {step === 'alarm' && (
        <Qte
          kind="mash"
          title="Os filisteus vêm sobre ti, Sansão!"
          hint="Toque rápido para se soltar!"
          look={SLOOKS.sansao}
          img={heroFace('sansao')}
          bg="#c8a070"
          times={byDiff(diff, [8, 11, 13]) + round * 3}
          seconds={byDiff(diff, [3.6, 3.2, 2.8])}
          button="Soltar!"
          onDone={(ok) => {
            if (!ok) {
              fails.current += 1;
              return setStep('bound');
            }
            buzz([40, 20, 40]);
            setStep('free');
          }}
        />
      )}
      {step === 'free' &&
        box(SLOOKS.sansao, 'Sansão', FREE[round], [
          {
            label: 'Continuar',
            fn: () => {
              if (round + 1 < LIES.length) {
                setRound(round + 1);
                setStep('ask');
              } else setStep('secret');
            },
          },
        ], 'happy')}
      {step === 'secret' &&
        box(
          SLOOKS.dalila,
          'Dalila',
          refuse === 0
            ? 'Como podes dizer que me amas, se o teu coração não está comigo? Três vezes zombaste de mim!'
            : refuse === 1
              ? 'Todos os dias eu vou perguntar... até tu me contares.'
              : 'E ela o importunava todos os dias, até a alma dele se angustiar até a morte.',
          refuse < 2
            ? [
                { label: 'Guardar o segredo', fn: () => (engine.sfx('bonk'), setRefuse(refuse + 1)) },
                { label: 'Contar o segredo', fn: () => setStep('told') },
              ]
            : [{ label: 'Contar o segredo', fn: () => setStep('told') }],
          refuse < 2 ? 'sad' : 'stern',
        )}
      {step === 'told' &&
        box(SLOOKS.sansao, 'Sansão', 'Navalha nunca passou na minha cabeça, porque sou nazireu de Deus. Se for rapado, a força me deixará.', [
          {
            label: 'Continuar',
            fn: () => {
              setStep('cut');
              window.setTimeout(() => {
                setBald(true);
                engine.sfx('sad');
                setStep('weak');
              }, 1600);
            },
          },
        ], 'sad')}
      {step === 'cut' && <Panel className="absolute inset-x-2 bottom-2 mx-auto max-w-xl text-lg">Ela o fez dormir no colo e chamou um homem para rapar as sete tranças...</Panel>}
      {step === 'weak' &&
        box(SLOOKS.careca, 'Narrador', '“Os filisteus vêm sobre ti, Sansão!” Ele pensou: “Sairei como das outras vezes.” Mas não sabia que o Senhor se retirara dele.', [
          { label: 'Tentar se soltar...', fn: () => (engine.sfx('dead'), buzz(200), window.setTimeout(() => onWin(fails.current === 0 ? 3 : fails.current === 1 ? 2 : 1), 600)) },
        ], 'sad')}
    </>
  );
}

// ================================================================ 6. Temple of Dagon

export function Dagon({ paused, onWin, diff = 1 }: GameProps) {
  const TIME = byDiff(diff, [17, 14, 12]);
  const [phase, setPhase] = useState<'pray' | 'push' | 'fall'>('pray');
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef({ push: 0, last: 0, time: TIME, fall: 0, shake: 0, parts: [] as Part[], lastT: 0 });
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    if (!paused && phase === 'push' && !lost) {
      s.push = Math.max(0, s.push - dt * byDiff(diff, [4, 5.5, 7]));
      s.time -= dt;
      if (s.time <= 0) setLost(true);
      if (s.push >= 100) {
        setPhase('fall');
        engine.drum('crash', 0, 1);
        engine.sfx('stomp');
        buzz([100, 50, 200, 50, 300]);
        window.setTimeout(() => onWin(starsOf((s.time / TIME) * 2.4)), 2600);
      }
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    if (phase === 'fall') {
      s.fall = Math.min(1, s.fall + dt * 0.6);
      s.shake = 0.4;
      if (Math.random() < 0.6) s.parts.push({ x: Math.random() * w, y: 0, vx: (Math.random() - 0.5) * 20, vy: 20, c: Math.random() < 0.5 ? '#8a7258' : '#6a5240', life: 2 });
    }
    s.shake = Math.max(0, s.shake - dt * 0.5);
    s.parts = stepParts(s.parts, dt, 200);
    shake(ctx, (phase === 'push' ? s.push / 50 : 0) + s.shake * 8);
    temple(ctx, w, s.push / 100, s.fall, t);
    // Samson between the pillars, arms out; the boy at his side.
    SC.bigPerson(ctx, SLOOKS.careca, w * 0.5, 162, 2, 'down', 0);
    if (phase !== 'fall') drawPerson(ctx, SLOOKS.menino, w * 0.5 + 34, 168, 'left', 0);
    for (let k = 0; k < 5; k++) drawPerson(ctx, SLOOKS.filisteu, 20 + k * 16, 172, 'right', Math.floor(t * 4 + k) % 2);
    if (phase === 'fall') {
      ctx.fillStyle = `rgba(200,180,150,${s.fall * 0.7})`;
      ctx.fillRect(0, 0, w, 180);
    }
    SC.particlesDraw(ctx, s.parts);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  });
  const push = (side: number) => {
    const s = st.current;
    if (paused || phase !== 'push' || lost) return;
    // Alternate sides, and keep a steady rhythm: frantic tapping pushes less.
    const now = performance.now();
    const gap = now - s.lastT;
    s.lastT = now;
    if (side !== s.last) {
      s.push = Math.min(100, s.push + byDiff(diff, [7.5, 6.5, 5.5]) * (gap < 110 ? 0.4 : 1));
      engine.drum('tom', 0, 0.5);
      buzz(12);
    } else engine.drum('hat', 0, 0.3);
    s.last = side;
    setH((h) => h + 1);
  };
  useKeys((k) => {
    if (k === 'arrowleft' || k === 'a') push(-1);
    if (k === 'arrowright' || k === 'd') push(1);
  });
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && phase === 'pray' && (
        <Qte
          kind="ring"
          title="Senhor, lembra-te de mim!"
          hint="Fortalece-me só esta vez, ó Deus. Toque quando a luz encostar no círculo."
          look={SLOOKS.careca}
          bg="#c8a070"
          times={byDiff(diff, [2, 3, 4])}
          button="Orar"
          onDone={(ok) => (ok ? setPhase('push') : setPhase('pray'))}
        />
      )}
      {!paused && phase === 'push' && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 top-2 flex gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Colunas
              <span className="h-3 w-28 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#e8b830]" style={{ width: `${s.push}%` }} />
              </span>
            </Panel>
            <Panel className="text-base">{Math.max(0, Math.ceil(s.time))} s</Panel>
          </div>
          {[-1, 1].map((d) => (
            <button
              key={d}
              onPointerDown={(e) => (e.preventDefault(), push(d))}
              className={cx(
                'rpg-wood rpg-text absolute bottom-4 h-24 w-28 touch-none text-4xl',
                d < 0 ? 'left-[max(1rem,env(safe-area-inset-left))]' : 'right-[max(1rem,env(safe-area-inset-right))]',
                s.last !== d && 'animate-blink text-[#ffe08a]',
              )}
              aria-label={d < 0 ? 'Empurrar coluna da esquerda' : 'Empurrar coluna da direita'}
            >
              {d < 0 ? '◀' : '▶'}
            </button>
          ))}
        </>
      )}
      {lost && (
        <Retry
          text="Mais força! Alterne ◀ e ▶ bem rápido, sem repetir o mesmo lado."
          onRetry={() => {
            st.current = { push: 0, last: 0, time: TIME, fall: 0, shake: 0, parts: [], lastT: 0 };
            setLost(false);
          }}
        />
      )}
    </>
  );
}

