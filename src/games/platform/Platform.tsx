/**
 * Side-scrolling action platformer. Run (with weight: acceleration and
 * friction), variable-height jumps with coyote time and buffering, ladders,
 * pushable crates on pressure plates, lever sequences, keys and doors, false
 * walls, breakable walls, enemies with patrol / detect / chase / attack / hurt
 * / defeat states, checkpoints, hearts, gems and secrets.
 *
 * Each hero plays differently: Davi fights with the sling, Sansão punches and
 * breaks walls, Pedro and José sneak past guards (hide in bushes), Jesus heals
 * the sick and the tempter's shadows flee from his blessing, Noé avoids beasts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { speakLine, stopLine } from '../pixel/voices';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Joystick } from '../pixel/Controls';
import { Portrait } from '../pixel/Dialog';
import { LOOKS, shade, type Look } from '../pixel/person';
import { buzz, Panel, Stage, starsOf, useKeys, useStage, type GameProps } from '../pixel/stage';
import { buildLevel, type LevelSpec, type Style, type ThemeId } from './level';
import { ANIMS, drawChar, type Anim, type CastId } from './rig';
import { drawBackdrop, drawLights, SKIES, themeTime } from './sky';

export const T = 20;
const G = 920;
const JUMP = 352;
const WALK = 112;
const RUN = 168;
const CLIMB = 70;
const HW = 6;
const HH = 32;

export interface Theme {
  block: string;
  mortar: string;
  band: string[] | null;
  wall: string | null;
  plat: string;
  grass?: string;
}
export const THEMES: Record<ThemeId, Theme> = {
  egypt: { block: '#d8a84a', mortar: '#a8782a', band: ['#2a5aa8', '#3a9a6a', '#c8503a', '#f0d080'], wall: '#8a6424', plat: '#e8c060' },
  palace: { block: '#9a8aa6', mortar: '#5a4e66', band: ['#e8d8b0', '#c8b088', '#6a5a7a', '#f4e8c8'], wall: '#3a2e4c', plat: '#d8a868' },
  desert: { block: '#c8a070', mortar: '#9a7848', band: null, wall: null, plat: '#a87a44' },
  cave: { block: '#6a5a4a', mortar: '#4a3e32', band: null, wall: '#2e261e', plat: '#8a6a44' },
  village: { block: '#b89468', mortar: '#8a6a44', band: null, wall: null, plat: '#9a6234', grass: '#5aa03a' },
  temple: { block: '#e4dccb', mortar: '#b8ac96', band: ['#e8b830', '#c8902a', '#3a6ab8', '#fff0b0'], wall: '#9a8e7a', plat: '#c8a060' },
  shore: { block: '#b89a6a', mortar: '#8a7048', band: null, wall: null, plat: '#8a5a30', grass: '#6aa848' },
  night: { block: '#6a6a7e', mortar: '#3a3a4a', band: null, wall: null, plat: '#6a5a4a', grass: '#3a6a3a' },
  // Susa: glazed-brick bands (blue and gold rosettes), royal gardens and the palace halls.
  persia: { block: '#c8a878', mortar: '#9a7a52', band: ['#2a5ab0', '#e8b830', '#3a8ac8', '#f4e0a0'], wall: null, plat: '#b87a3a' },
  garden: { block: '#d8ccb0', mortar: '#a89a80', band: null, wall: null, plat: '#c89a5a', grass: '#4a9a3a' },
  susa: { block: '#c8b498', mortar: '#8a7458', band: ['#3a5ab0', '#e8b830', '#8a2a5a', '#f0e0b0'], wall: '#4a2e48', plat: '#e0b050' },
};

// ------------------------------------------------------------------ tiles

export function paintTiles(rows: string[], th: Theme) {
  const H = rows.length;
  const W = rows[0].length;
  const c = document.createElement('canvas');
  c.width = W * T;
  c.height = H * T;
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  const at = (r: number, cc: number) => (r < 0 || cc < 0 || r >= H || cc >= W ? '#' : rows[r][cc]);
  const isWall = (ch: string) => ch === '#' || ch === '?';
  for (let r = 0; r < H; r++)
    for (let cc = 0; cc < W; cc++) {
      const t = rows[r][cc];
      const X = cc * T;
      const Y = r * T;
      if (th.wall && !isWall(t)) {
        px(X, Y, T, T, th.wall);
        px(X, Y + T - 1, T, 1, shade(th.wall, -0.15));
        px(X + (((r % 2) * 10 + 4) % T), Y, 1, T - 1, shade(th.wall, -0.12));
        if ((r * 5 + cc * 3) % 7 === 0) px(X + 6, Y + 8, 3, 2, shade(th.wall, 0.08));
      }
      if (isWall(t)) {
        if (r === 0 && !th.wall) continue;
        const b = t === '?' ? shade(th.block, 0.06) : th.block;
        px(X, Y, T, T, b);
        px(X, Y + 9, T, 1, th.mortar);
        px(X, Y + T - 1, T, 1, th.mortar);
        px(X + (((r % 2) * 10 + 4) % T), Y, 1, 9, th.mortar);
        px(X + (((r % 2) * 10 + 14) % T), Y + 10, 1, 9, th.mortar);
        px(X, Y, T, 1, shade(b, 0.25));
        px(X, Y + 1, 1, 8, shade(b, 0.15));
        if ((r * 7 + cc * 3) % 9 === 0) px(X + 5, Y + 4, 4, 1, shade(b, -0.25));
        if (t === '?') {
          // Faint hint of a false wall.
          px(X + 8, Y + 3, 1, 5, shade(b, -0.18));
          px(X + 9, Y + 7, 1, 4, shade(b, -0.18));
        }
        const open = !isWall(at(r - 1, cc)) && r > 0;
        if (th.band && open) {
          px(X, Y, T, 6, th.band[3]);
          px(X, Y + 1, T, 4, th.band[(cc >> 1) % 3]);
          for (let k = 0; k < 5; k++) px(X + k * 4 + 1, Y + 2, 2, 2, th.band[3]);
          px(X, Y + 6, T, 1, shade(th.block, -0.35));
        } else if (th.grass && open) {
          px(X, Y, T, 4, th.grass);
          px(X, Y, T, 1, shade(th.grass, 0.3));
          px(X, Y + 4, T, 1, shade(th.grass, -0.35));
          for (let k = 0; k < 4; k++) px(X + k * 5 + 2, Y + 4, 2, 1 + ((cc + k) % 2), shade(th.grass, -0.1));
        } else if (open) {
          px(X, Y, T, 2, shade(th.block, 0.3));
          px(X, Y + 2, T, 1, shade(th.block, -0.3));
        }
        if (!isWall(at(r + 1, cc))) px(X, Y + T - 3, T, 3, shade(th.block, -0.35));
      } else if (t === '=') {
        px(X, Y, T, 6, '#2a1a10');
        px(X, Y, T, 5, th.plat);
        px(X, Y, T, 1, shade(th.plat, 0.3));
        px(X + 3, Y + 5, 2, 4, '#2a1a10');
        px(X + 15, Y + 5, 2, 4, '#2a1a10');
      } else if (t === 'H') {
        px(X + 4, Y, 3, T, '#5a3a1e');
        px(X + 13, Y, 3, T, '#5a3a1e');
        px(X + 4, Y, 1, T, '#8a5a30');
        for (let k = 3; k < T; k += 6) px(X + 4, Y + k, 12, 2, '#7a4a24');
      } else if (t === '^') {
        px(X, Y + 15, T, 5, '#3a3a44');
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = '#c8c8d0';
          ctx.beginPath();
          ctx.moveTo(X + k * 5, Y + 16);
          ctx.lineTo(X + k * 5 + 2.5, Y + 4);
          ctx.lineTo(X + k * 5 + 5, Y + 16);
          ctx.fill();
          px(X + k * 5 + 2, Y + 6, 1, 9, '#f0f0f8');
        }
      } else if (t === '~') {
        px(X, Y + 5, T, 15, '#2a6aa8');
        px(X, Y + 5, T, 2, '#7ab4dc');
      } else if (t === 'V') {
        px(X + 5, Y + 7, 10, 13, '#2a1a10');
        px(X + 6, Y + 8, 8, 11, '#c8783a');
        px(X + 6, Y + 8, 3, 11, '#e09858');
        px(X + 5, Y + 6, 10, 2, '#2a1a10');
        px(X + 7, Y + 11, 6, 1, '#f0d080');
      } else if (t === 'm') {
        // Mural frame (symbols drawn live).
        px(X - 6, Y - 6, 32, 26, '#5a3a1e');
        px(X - 4, Y - 4, 28, 22, '#e8d8b0');
      } else if (t === 's') {
        // Clay tablet with the door's code (symbols drawn live).
        px(X - 7, Y - 5, 34, 22, '#4a2e1a');
        px(X - 5, Y - 3, 30, 18, '#c8a070');
        px(X - 5, Y - 3, 30, 2, '#e0c090');
      } else if (t === 'p') {
        px(X + 2, Y + 16, 16, 4, '#5a5a64');
      }
    }
  return c;
}

// ------------------------------------------------------------------ creatures

function drawCreature(ctx: CanvasRenderingContext2D, kind: 'snake' | 'scorpion' | 'beast' | 'bat', x: number, y: number, left: boolean, t: number, hurt: boolean) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (left) ctx.scale(-1, 1);
  const r = (a: number, b: number, w: number, h: number, c: string) => {
    ctx.fillStyle = hurt ? '#ffffff' : c;
    ctx.fillRect(a, b, w, h);
  };
  if (kind === 'snake') {
    for (let k = 0; k < 6; k++) r(-9 + k * 3, -4 + Math.round(Math.sin(t * 10 + k) * 1.5), 4, 4, k % 2 ? '#5a9a3a' : '#4a8a2a');
    r(8, -6, 5, 4, '#5a9a3a');
    r(11, -5, 1, 1, '#1a1a1a');
    r(13, -4 + (Math.floor(t * 6) % 2), 2, 1, '#d83a3a');
  } else if (kind === 'scorpion') {
    r(-6, -5, 12, 4, '#8a5a2a');
    r(-8, -9 - (Math.floor(t * 4) % 2), 3, 5, '#8a5a2a');
    r(-7, -11, 3, 2, '#c83a2a');
    r(5, -6, 4, 2, '#8a5a2a');
    for (let k = 0; k < 3; k++) r(-4 + k * 4, -1, 1, 2 + ((k + Math.floor(t * 8)) % 2), '#5a3a1a');
  } else if (kind === 'beast') {
    const step = Math.floor(t * 8) % 2;
    r(-11, -14, 20, 9, '#c8902a');
    r(-11, -14, 20, 2, '#e8b040');
    r(6, -18, 9, 9, '#c8902a');
    r(4, -20, 8, 12, '#8a5a1a');
    r(12, -15, 1, 1, '#1a1a1a');
    r(14, -12, 2, 2, '#3a1a0a');
    r(-14, -14, 4, 2, '#8a5a1a');
    r(-9, -5, 3, 5 - step, '#a8701a');
    r(-4, -5, 3, 4 + step, '#a8701a');
    r(2, -5, 3, 5 - step, '#a8701a');
    r(6, -5, 3, 4 + step, '#a8701a');
  } else {
    const f = Math.floor(t * 10) % 2;
    r(-3, -4, 6, 5, '#3a2a3a');
    r(-9, -6 + f * 3, 6, 2, '#4a3a4a');
    r(3, -6 + f * 3, 6, 2, '#4a3a4a');
    r(-1, -3, 1, 1, '#ff5a3a');
    r(1, -3, 1, 1, '#ff5a3a');
  }
  ctx.restore();
}

// ------------------------------------------------------------------ entities

type EState = 'idle' | 'patrol' | 'alert' | 'chase' | 'windup' | 'strike' | 'recover' | 'hurt' | 'dead' | 'flee' | 'return';
interface Enemy {
  kind: 'human' | 'snake' | 'scorpion' | 'beast' | 'bat' | 'shadow';
  cast?: CastId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  home: number;
  homeY: number;
  dir: 1 | -1;
  state: EState;
  timer: number;
  hp: number;
  anim: number;
  lost: number;
  gone: boolean;
}
interface Crate {
  x: number;
  y: number;
  vy: number;
  locked: boolean;
}
interface Stone {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  c: string;
  life: number;
  g: number;
}

const SYMBOLS = ['☀', '☾', '★'];
/** Symbols of the sealed door's dials. */
const DIAL = ['☀', '☾', '★', '✿'];

export interface PlatformProps extends GameProps {
  spec: LevelSpec;
  /** Hero sprite and play style. */
  cast: CastId;
  style: Style;
}

export function Platform({ spec, cast, style, paused, onWin, diff = 1 }: PlatformProps) {
  const rows = useMemo(() => buildLevel(spec), [spec]);
  const th = THEMES[spec.theme];
  const time = spec.time ?? themeTime(spec.theme);
  const sky = SKIES[time];
  const LIVES = [5, 4, 3][diff] ?? 4;
  const [lost, setLost] = useState(false);
  const [talk, setTalk] = useState<{ text: string; look: Look } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, setH] = useState(0);
  const keys = useRef({ x: 0, y: 0, run: false });
  const jumpHeld = useRef(false);
  const H = rows.length;
  const W = rows[0].length;
  const at = (r: number, c: number) => (r < 0 || c < 0 || r >= H || c >= W ? '#' : rows[r][c]);
  const enemyCast: CastId =
    style === 'stealth'
      ? spec.theme === 'persia' || spec.theme === 'garden' || spec.theme === 'susa'
        ? 'persa'
        : spec.theme === 'egypt' || spec.theme === 'palace'
        ? 'guarda'
        : spec.theme === 'desert' || spec.theme === 'village'
          ? 'irmao'
          : 'romano'
      : style === 'peace'
        ? 'tentador'
        : spec.theme === 'palace' || spec.theme === 'temple'
          ? 'romano'
          : 'soldado';

  function fresh() {
    let px = 2 * T;
    let py = 9 * T;
    const items = new Map<string, string>();
    const crates: Crate[] = [];
    const enemies: Enemy[] = [];
    const npcs: { x: number; y: number; i: number; look: Look; sick: boolean; healed: boolean }[] = [];
    let gems = 0;
    let secrets = 0;
    const looks = [LOOKS.villager, LOOKS.elder, LOOKS.woman, LOOKS.boy, LOOKS.merchant];
    // A required order for the lever sequence (shown on the mural).
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const leverSym: Record<string, number> = {};
    const dialKeys: string[] = [];
    const perm = [0, 1, 2].sort(() => Math.random() - 0.5);
    rows.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        const X = c * T + T / 2;
        const Y = (r + 1) * T;
        if (ch === 'P') {
          px = X;
          py = Y;
        }
        if (ch === '*') {
          gems++;
          if (at(r, c - 1) === '#' || at(r, c + 1) === '?' || at(r, c - 1) === '?') secrets++;
        }
        if ('k*CLEp123r'.includes(ch)) items.set(`${r},${c}`, ch);
        if (ch === 'r') dialKeys.push(`${r},${c}`);
        if ('123'.includes(ch)) leverSym[`${r},${c}`] = perm['123'.indexOf(ch)];
        if (ch === 'B') crates.push({ x: c * T, y: r * T, vy: 0, locked: false });
        if (ch === 'N' || ch === 'S')
          npcs.push({ x: X, y: Y, i: npcs.length, look: ch === 'S' ? LOOKS.blind : looks[npcs.length % looks.length], sick: ch === 'S', healed: false });
        const base = { x: X, y: Y, vx: 0, vy: 0, home: X, homeY: Y, dir: -1 as const, timer: Math.random(), anim: 0, lost: 0, gone: false };
        if (ch === 'X') {
          const kind = style === 'peace' ? (cast === 'noe' ? 'beast' : 'shadow') : 'human';
          enemies.push({ ...base, kind, cast: enemyCast, state: 'patrol', hp: kind === 'human' ? [1, 2, 3][diff] : 99 });
        }
        if (ch === 'A') enemies.push({ ...base, kind: spec.theme === 'desert' || spec.theme === 'egypt' ? 'scorpion' : 'snake', state: 'patrol', hp: 1 });
        if (ch === 'W') enemies.push({ ...base, y: Y - T * 2, homeY: Y - T * 2, kind: 'bat', state: 'patrol', hp: 1 });
      }),
    );
    const code = dialKeys.map(() => Math.floor(Math.random() * DIAL.length));
    return {
      x: px,
      y: py,
      vx: 0,
      vy: 0,
      left: false,
      ground: true,
      wasGround: true,
      coyote: 0,
      buffer: 0,
      climbing: false,
      keys: 0,
      gems: 0,
      totalGems: gems,
      secrets,
      found: 0,
      lives: LIVES,
      inv: 0,
      check: { x: px, y: py },
      doors: new Set<string>(),
      broken: new Set<string>(),
      gates: false,
      plate: false,
      order,
      leverSym,
      seq: [] as number[],
      seqOpen: false,
      dialKeys,
      code,
      // Every dial starts on a wrong symbol.
      dial: Object.fromEntries(dialKeys.map((k, i) => [k, (code[i] + 1 + Math.floor(Math.random() * (DIAL.length - 1))) % DIAL.length])) as Record<string, number>,
      vaultOpen: dialKeys.length === 0,
      vaultT: 0,
      items,
      crates,
      enemies,
      npcs,
      stones: [] as Stone[],
      parts: [] as Part[],
      won: false,
      dead: 0,
      anim: 'idle' as Anim,
      animT: 0,
      action: null as null | { anim: Anim; t: number; hit: boolean },
      runT: 0,
      landT: 0,
      pushing: false,
      hidden: false,
      shake: 0,
      flash: 0,
      camX: 0,
      camY: 0,
      look: 1,
      defeated: 0,
      healed: 0,
    };
  }
  const st = useRef<ReturnType<typeof fresh>>(null as unknown as ReturnType<typeof fresh>);
  if (!st.current) st.current = fresh();
  if (import.meta.env.DEV) (window as unknown as { __plat: unknown }).__plat = { st, rows };
  const tiles = useMemo(() => paintTiles(rows, th), [rows, th]);

  const burst = (x: number, y: number, c: string, n = 10, up = 60, g = 300) => {
    const s = st.current;
    for (let i = 0; i < n; i++) s.parts.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: -Math.random() * up - 20, c, life: 0.5 + Math.random() * 0.4, g });
  };
  const flashMsg = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast((x) => (x === m ? null : x)), 1800);
  };

  const cv = useStage((ctx, w, rawDt, t) => {
    const s = st.current;
    const dt = Math.min(rawDt, 1 / 30);
    const solidT = (r: number, c: number) => {
      const ch = at(r, c);
      if (ch === '#') return true;
      if (ch === 'D') return !s.doors.has(`${r},${c}`);
      if (ch === 'G') return !s.gates;
      if (ch === 'O') return !s.plate;
      if (ch === 'Q') return !s.seqOpen;
      if (ch === 'U') return !s.vaultOpen;
      if (ch === 'x') return !s.broken.has(`${r},${c}`);
      return false;
    };
    const crateAt = (x: number, y: number, skip?: Crate) => s.crates.find((b) => b !== skip && x >= b.x && x < b.x + T && y >= b.y && y < b.y + T);
    const blocked = (x: number, y: number) => solidT(Math.floor(y / T), Math.floor(x / T)) || !!crateAt(x, y);
    const live = !paused && !lost && !s.won && !talk && s.dead <= 0;
    const k = keys.current;

    const hurt = (from: number, dmg = 1, respawn = false) => {
      if (s.inv > 0 || s.won) return;
      s.lives -= dmg;
      s.inv = 1.3;
      s.shake = 0.3;
      s.flash = 0.25;
      engine.sfx('hurt');
      buzz([60, 30, 60]);
      burst(s.x, s.y - 16, '#ffffff', 8);
      s.action = { anim: 'hurt', t: 0, hit: true };
      if (respawn) {
        s.x = s.check.x;
        s.y = s.check.y;
        s.vx = s.vy = 0;
      } else {
        s.vx = (s.x < from ? -1 : 1) * 160;
        s.vy = -180;
      }
      s.climbing = false;
      if (s.lives <= 0) {
        s.dead = 1.4;
        s.action = { anim: 'defeat', t: 0, hit: true };
        window.setTimeout(() => setLost(true), 1300);
      }
    };

    if (live) {
      s.inv = Math.max(0, s.inv - dt);
      s.coyote = Math.max(0, s.coyote - dt);
      s.buffer = Math.max(0, s.buffer - dt);
      s.landT = Math.max(0, s.landT - dt);
      const tc = Math.floor(s.x / T);
      const onLadder = at(Math.floor((s.y - 4) / T), tc) === 'H' || at(Math.floor((s.y - 20) / T), tc) === 'H';
      const ladderBelow = at(Math.floor((s.y + 2) / T), tc) === 'H';
      if (!s.climbing && ((onLadder && k.y < -0.4) || (ladderBelow && k.y > 0.4))) {
        s.climbing = true;
        s.x = tc * T + T / 2;
        s.vx = 0;
        if (ladderBelow && !onLadder) s.y += 4;
      }
      const busy = s.action && (s.action.anim === 'attack' || s.action.anim === 'hurt') && s.action.t < 0.2;
      if (s.climbing) {
        s.vx = 0;
        s.vy = k.y * CLIMB;
        if (Math.abs(k.x) > 0.6 && !onLadder) s.climbing = false;
        if (!onLadder && !ladderBelow) s.climbing = false;
        if (s.buffer > 0) {
          s.climbing = false;
          s.vy = -JUMP * 0.8;
          s.buffer = 0;
        }
      } else {
        // Acceleration gives the hero weight; holding the stick far (or Shift) runs.
        const running = k.run || Math.abs(k.x) > 0.85;
        s.runT = running && k.x ? s.runT + dt : 0;
        const top = (running && s.runT > 0.18 ? RUN : WALK) * (s.pushing ? 0.45 : 1);
        const target = busy ? 0 : Math.sign(k.x) * top * Math.min(1, Math.abs(k.x) * 1.4);
        const acc = s.ground ? (target === 0 ? 1500 : 1100) : 700;
        if (s.vx < target) s.vx = Math.min(target, s.vx + acc * dt);
        else if (s.vx > target) s.vx = Math.max(target, s.vx - acc * dt);
        s.vy = Math.min(520, s.vy + G * dt);
        if (s.buffer > 0 && (s.ground || s.coyote > 0)) {
          s.vy = -JUMP;
          s.ground = false;
          s.coyote = 0;
          s.buffer = 0;
          engine.sfx('jump');
          dust(s.x, s.y, 5);
        }
        if (!jumpHeld.current && s.vy < -150) s.vy = -150;
      }
      if (k.x && !busy) s.left = k.x < 0;
      // Horizontal move: crates are pushed, doors open with a key.
      s.pushing = false;
      let nx = s.x + s.vx * dt;
      const side = s.vx > 0 ? nx + HW : nx - HW;
      const ys = [s.y - 2, s.y - HH / 2, s.y - HH + 3];
      if (s.vx !== 0 && ys.some((y) => blocked(side, y))) {
        const r = Math.floor((s.y - 2) / T);
        const c = Math.floor(side / T);
        if (at(r, c) === 'D' && !s.doors.has(`${r},${c}`)) {
          if (s.keys > 0) {
            s.keys -= 1;
            s.doors.add(`${r},${c}`);
            s.doors.add(`${r - 1},${c}`);
            engine.sfx('power');
            buzz(30);
            burst(c * T + 10, r * T, '#ffe066', 14);
          } else if (Math.random() < 0.02) flashMsg('A porta está trancada. Procure a chave!');
        }
        const crate = crateAt(side, s.y - 6);
        if (crate && !crate.locked && s.ground) {
          s.pushing = true;
          const dir = s.vx > 0 ? 1 : -1;
          const strong = style === 'strong' ? 1.6 : 1;
          const cxn = crate.x + dir * 55 * strong * dt;
          const edge = dir > 0 ? cxn + T - 0.1 : cxn;
          const free =
            !solidT(Math.floor((crate.y + 2) / T), Math.floor(edge / T)) && !solidT(Math.floor((crate.y + T - 2) / T), Math.floor(edge / T)) && !crateAt(edge, crate.y + 10, crate);
          if (free) crate.x = cxn;
          // Crate settles on a pressure plate.
          const pr = Math.floor((crate.y + T - 2) / T);
          const pc = Math.floor((crate.x + T / 2) / T);
          if (s.items.get(`${pr},${pc}`) === 'p' && Math.abs(crate.x - pc * T) < 4) {
            crate.x = pc * T;
            crate.locked = true;
            s.plate = true;
            engine.drum('tom', 0, 0.8);
            engine.sfx('power');
            buzz([30, 30, 60]);
            burst(pc * T + 10, pr * T + T, '#ffe066', 16);
            flashMsg('O peso da caixa abriu o portão!');
          }
          if (Math.random() < 0.08) dust(crate.x + (dir > 0 ? 0 : T), crate.y + T, 1);
        }
        nx = s.x;
        s.vx = 0;
      }
      s.x = Math.max(HW, Math.min(W * T - HW, nx));
      // Vertical move.
      const prevY = s.y;
      let ny = s.y + s.vy * dt;
      s.wasGround = s.ground;
      s.ground = false;
      const xs = [s.x - HW + 1, s.x + HW - 1];
      if (s.vy >= 0) {
        for (const x of xs) {
          const r = Math.floor(ny / T);
          const c = Math.floor(x / T);
          const top = r * T;
          const oneway = (at(r, c) === '=' || (at(r, c) === 'H' && at(r - 1, c) !== 'H' && !s.climbing)) && prevY <= top + 0.5 && !(k.y > 0.6 && at(r, c) === '=');
          if (blocked(x, ny) || oneway) {
            const crate = crateAt(x, ny);
            ny = crate ? crate.y : top;
            s.vy = 0;
            s.ground = true;
          }
        }
      } else
        for (const x of xs)
          if (blocked(x, ny - HH)) {
            ny = (Math.floor((ny - HH) / T) + 1) * T + HH;
            s.vy = 0;
          }
      s.y = ny;
      if (s.climbing && s.vy > 0 && blocked(s.x, s.y + 1)) s.climbing = false;
      if (s.ground) s.coyote = 0.1;
      if (s.ground && !s.wasGround && prevY < s.y + 0.1) {
        s.landT = 0.12;
        dust(s.x, s.y, 6);
        engine.drum('kick', 0, 0.25);
      }
      if (s.ground && Math.abs(s.vx) > RUN * 0.8 && Math.random() < 0.25) dust(s.x - Math.sign(s.vx) * 6, s.y, 1);
      // Crates fall.
      for (const b of s.crates) {
        if (b.locked) continue;
        b.vy = Math.min(400, b.vy + G * dt);
        const nyb = b.y + b.vy * dt;
        const below = Math.floor((nyb + T) / T);
        if (solidT(below, Math.floor((b.x + 2) / T)) || solidT(below, Math.floor((b.x + T - 2) / T))) {
          b.y = below * T - T;
          b.vy = 0;
        } else b.y = nyb;
      }
      // Hidden in a bush, standing still.
      const bush = at(Math.floor((s.y - 4) / T), Math.floor(s.x / T)) === 'b';
      s.hidden = bush && Math.abs(s.vx) < 10 && s.ground;
      // Items, hazards, checkpoints, the exit.
      const cells = [
        [Math.floor((s.y - 4) / T), Math.floor(s.x / T)],
        [Math.floor((s.y - 24) / T), Math.floor(s.x / T)],
      ];
      for (const [r, c] of cells) {
        const key = `${r},${c}`;
        const it = s.items.get(key);
        if (it === 'k') {
          s.items.delete(key);
          s.keys += 1;
          engine.sfx('coin');
          buzz(20);
          burst(c * T + 10, r * T + 10, '#ffe066', 12);
          s.action = { anim: 'pickup', t: 0, hit: false };
          flashMsg('Você pegou uma chave!');
        } else if (it === '*') {
          s.items.delete(key);
          s.gems += 1;
          const secret = at(r, c - 1) === '#' || at(r, c + 1) === '?' || at(r, c - 1) === '?';
          if (secret) s.found += 1;
          engine.playNote(84 + (s.gems % 5) * 2, 'bell', 0, 0.25);
          burst(c * T + 10, r * T + 10, '#9ae0ff', 8);
          if (secret && s.found === 1) flashMsg('Passagem secreta!');
        } else if (it === 'C' && (s.check.x !== c * T + 10 || s.check.y !== (r + 1) * T)) {
          s.check = { x: c * T + 10, y: (r + 1) * T };
          engine.playNote(76, 'bell', 0, 0.3);
          burst(c * T + 10, r * T, '#ff9a3a', 14);
          flashMsg('Ponto de retorno');
        } else if (it === 'E' && !s.won) {
          s.won = true;
          s.action = { anim: 'victory', t: 0, hit: false };
          engine.sfx('yay');
          buzz([40, 30, 80]);
          const score = (s.totalGems ? s.gems / s.totalGems : 1) * 0.55 + (s.lives / LIVES) * 0.45;
          window.setTimeout(() => onWin(starsOf(score)), 1400);
        }
      }
      const feet = at(Math.floor((s.y - 2) / T), Math.floor(s.x / T));
      if (feet === '^' || feet === '~' || s.y > H * T) {
        if (feet === '~') burst(s.x, s.y - 4, '#7ab4dc', 14);
        s.inv = 0;
        hurt(s.x, 1, true);
      }
      // Hero action in progress (attack hit frames).
      if (s.action) {
        s.action.t += dt;
        const a = ANIMS[s.action.anim];
        const fr = Math.floor(s.action.t * a.fps);
        if (s.action.anim === 'attack' && !s.action.hit && fr >= 2) {
          s.action.hit = true;
          const dir = s.left ? -1 : 1;
          if (style === 'sling') {
            s.stones.push({ x: s.x + dir * 12, y: s.y - 22, vx: dir * 330, vy: -40, life: 1.2 });
            engine.sfx('bump');
          } else if (style === 'strong') {
            const hx = s.x + dir * 16;
            engine.drum('snare', 0, 0.8);
            s.shake = 0.12;
            for (const e of s.enemies) if (!e.gone && e.state !== 'dead' && Math.abs(e.x - hx) < 18 && Math.abs(e.y - s.y) < 26) hitEnemy(e, 2, dir);
            for (const yy of [s.y - 6, s.y - 26]) {
              const r = Math.floor(yy / T);
              const c = Math.floor(hx / T);
              if (at(r, c) === 'x' && !s.broken.has(`${r},${c}`)) {
                s.broken.add(`${r},${c}`);
                engine.sfx('bonk');
                buzz([40, 20, 40]);
                s.shake = 0.3;
                for (let i = 0; i < 18; i++)
                  s.parts.push({
                    x: c * T + 10,
                    y: r * T + 10,
                    vx: dir * (40 + Math.random() * 140),
                    vy: -Math.random() * 160,
                    c: i % 2 ? th.block : th.mortar,
                    life: 0.9,
                    g: 600,
                  });
              }
            }
          }
        }
        if (fr >= a.frames && s.action.anim !== 'defeat' && s.action.anim !== 'victory') s.action = null;
      }
      // Sling stones.
      for (const st2 of s.stones) {
        st2.life -= dt;
        st2.vy += 200 * dt;
        st2.x += st2.vx * dt;
        st2.y += st2.vy * dt;
        if (solidT(Math.floor(st2.y / T), Math.floor(st2.x / T))) {
          st2.life = 0;
          burst(st2.x, st2.y, '#bdbdc8', 5, 40);
        }
        for (const e of s.enemies)
          if (!e.gone && e.state !== 'dead' && Math.abs(e.x - st2.x) < 12 && st2.y > e.y - (e.kind === 'human' ? 34 : 16) && st2.y < e.y + 2 && st2.life > 0) {
            hitEnemy(e, 1, Math.sign(st2.vx) as 1 | -1);
            st2.life = 0;
          }
        const r = Math.floor(st2.y / T);
        const c = Math.floor(st2.x / T);
        if (at(r, c) === 'V' && !s.broken.has(`${r},${c}`) && st2.life > 0) {
          s.broken.add(`${r},${c}`);
          st2.life = 0;
          engine.sfx('bonk');
          burst(c * T + 10, r * T + 12, '#c8783a', 12);
          s.gems += 1;
          s.totalGems += 1;
        }
      }
      s.stones = s.stones.filter((x) => x.life > 0);
      // Enemies.
      for (const e of s.enemies) stepEnemy(e, dt, t);
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    } else if (s.dead > 0 || s.won) {
      s.dead = Math.max(0, s.dead - dt);
      if (s.action) s.action.t += dt;
    }

    function hitEnemy(e: Enemy, dmg: number, dir: 1 | -1) {
      if (e.kind === 'shadow') return;
      e.hp -= dmg;
      e.vx = dir * 150;
      e.vy = -120;
      e.timer = 0.35;
      buzz(25);
      burst(e.x, e.y - 18, '#fff4c0', 8);
      engine.drum('snare', 0, 0.6);
      if (e.hp <= 0) {
        e.state = 'dead';
        e.timer = 0.9;
        s.defeated += 1;
        engine.sfx('yay');
      } else e.state = 'hurt';
    }

    function sees(e: Enemy) {
      if (s.hidden || s.dead > 0) return false;
      const dx = s.x - e.x;
      const range = (e.kind === 'human' ? 6 : 4) * T;
      if (Math.abs(dx) > range || Math.abs(s.y - e.y) > 30) return false;
      if (Math.sign(dx) !== e.dir && Math.abs(dx) > 14) return false;
      const r = Math.floor((e.y - 24) / T);
      for (let c = Math.floor(Math.min(e.x, s.x) / T); c <= Math.floor(Math.max(e.x, s.x) / T); c++) if (solidT(r, c)) return false;
      return true;
    }

    function stepEnemy(e: Enemy, dt2: number, tt: number) {
      if (e.gone) return;
      e.anim += dt2;
      e.timer -= dt2;
      if (e.state === 'dead') {
        e.vx *= 0.9;
        e.x += e.vx * dt2;
        if (e.timer <= 0) {
          e.gone = true;
          burst(e.x, e.y - 12, '#9ae0ff', 10);
          s.gems += 1;
          s.totalGems += 1;
        }
        return;
      }
      if (e.kind === 'bat') {
        e.x = e.home + Math.sin(tt * 0.9 + e.homeY) * T * 2.5;
        e.y = e.homeY + Math.sin(tt * 2.2) * 10;
        e.dir = Math.cos(tt * 0.9 + e.homeY) > 0 ? 1 : -1;
      } else {
        const floorAhead = (x: number) => {
          const r = Math.floor((e.y + 2) / T);
          const c = Math.floor(x / T);
          return solidT(r, c) || at(r, c) === '=';
        };
        const wallAhead = (x: number) => solidT(Math.floor((e.y - 8) / T), Math.floor(x / T));
        const speed = { patrol: 34, return: 34, chase: e.kind === 'human' ? 78 : 50, flee: 90 }[e.state as 'patrol'] ?? 0;
        if (e.state === 'hurt') {
          e.x += e.vx * dt2;
          e.vx *= 0.88;
          if (e.timer <= 0) e.state = 'chase';
        } else if (e.state === 'idle') {
          if (e.timer <= 0) {
            e.state = 'patrol';
            e.dir = (e.dir * -1) as 1 | -1;
          }
        } else if (e.state === 'alert') {
          if (e.timer <= 0) e.state = 'chase';
        } else if (e.state === 'windup') {
          if (e.timer <= 0) {
            e.state = 'strike';
            e.timer = 0.18;
            if (Math.abs(s.x - (e.x + e.dir * 14)) < 20 && Math.abs(s.y - e.y) < 26) hurt(e.x, 1, style === 'stealth');
          }
        } else if (e.state === 'strike') {
          if (e.timer <= 0) {
            e.state = 'recover';
            e.timer = 0.5;
          }
        } else if (e.state === 'recover') {
          if (e.timer <= 0) e.state = style === 'stealth' ? 'return' : 'chase';
        } else if (e.state === 'flee') {
          const nx = e.x + e.dir * speed * dt2;
          if (!wallAhead(nx + e.dir * 8) && floorAhead(nx + e.dir * 8)) e.x = nx;
          if (e.timer <= 0) e.state = 'return';
        } else {
          // patrol / chase / return
          let dir = e.dir;
          if (e.state === 'chase') dir = s.x > e.x ? 1 : -1;
          if (e.state === 'return') dir = e.home > e.x ? 1 : -1;
          if (e.state === 'patrol' && Math.abs(e.x - e.home) > T * 3 && Math.sign(e.x - e.home) === dir) {
            e.state = 'idle';
            e.timer = 0.9;
            dir = e.dir;
          }
          const nx = e.x + dir * speed * dt2;
          const ok = !wallAhead(nx + dir * 8) && floorAhead(nx + dir * 8);
          if (ok && e.state !== 'idle') e.x = nx;
          else if (e.state === 'patrol') {
            e.state = 'idle';
            e.timer = 0.7;
          }
          e.dir = dir;
          if (e.state === 'return' && Math.abs(e.x - e.home) < 4) e.state = 'patrol';
          if ((e.state === 'patrol' || e.state === 'return') && e.kind === 'human' && sees(e)) {
            e.state = 'alert';
            e.timer = style === 'stealth' ? 0.55 : 0.4;
            engine.playNote(88, 'bell', 0, 0.2);
          }
          if (e.state === 'chase') {
            if (!sees(e)) e.lost += dt2;
            else e.lost = 0;
            if (e.lost > 1.6) {
              e.state = 'return';
              e.lost = 0;
            }
            if (e.kind === 'human' && Math.abs(s.x - e.x) < 24 && Math.abs(s.y - e.y) < 24) {
              e.state = 'windup';
              e.timer = 0.38;
            }
          }
        }
      }
      // Contact damage: creatures, shadows and beasts hurt by touch.
      const touch = Math.abs(s.x - e.x) < (e.kind === 'beast' ? 16 : 11) && s.y > e.y - (e.kind === 'bat' ? 10 : 18) && s.y - HH < e.y;
      if (touch && e.kind !== 'human' && e.state !== 'flee') hurt(e.x);
      // Stomping small creatures (not shadows).
      if (touch && (e.kind === 'snake' || e.kind === 'scorpion' || e.kind === 'bat') && s.vy > 60 && s.y < e.y - 4 && style !== 'peace') {
        hitEnemy(e, 1, s.x < e.x ? 1 : -1);
        s.vy = -JUMP * 0.6;
      }
    }

    function dust(x: number, y: number, n: number) {
      for (let i = 0; i < n; i++)
        s.parts.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y - 1,
          vx: (Math.random() - 0.5) * 60,
          vy: -Math.random() * 30,
          c: spec.theme === 'cave' || spec.theme === 'night' ? '#8a8a9a' : '#e8d8b0',
          life: 0.35 + Math.random() * 0.2,
          g: 40,
        });
    }

    // ---- particles
    for (const p of s.parts) {
      p.life -= rawDt;
      p.vy += p.g * rawDt;
      p.x += p.vx * rawDt;
      p.y += p.vy * rawDt;
    }
    if (s.parts.length > 220) s.parts.splice(0, s.parts.length - 220);
    s.parts = s.parts.filter((p) => p.life > 0);
    s.shake = Math.max(0, s.shake - rawDt);
    s.flash = Math.max(0, s.flash - rawDt);
    if (s.vaultOpen) s.vaultT += rawDt;

    // ---- hero animation
    let anim: Anim = 'idle';
    if (s.action) anim = s.action.anim;
    else if (s.climbing) anim = 'climb';
    else if (!s.ground) anim = s.vy < 0 ? 'jump' : 'fall';
    else if (s.landT > 0) anim = 'land';
    else if (s.pushing) anim = 'push';
    else if (Math.abs(s.vx) > WALK + 8) anim = 'run';
    else if (Math.abs(s.vx) > 6) anim = 'walk';
    if (anim !== s.anim) {
      s.anim = anim;
      s.animT = 0;
    } else s.animT += rawDt * (anim === 'climb' ? (Math.abs(s.vy) > 1 ? 1 : 0) : 1);
    const A = ANIMS[anim];
    let fi = Math.floor((s.action ? s.action.t : s.animT) * A.fps);
    fi = A.loop ? fi % A.frames : Math.min(A.frames - 1, fi);

    // ---- camera (looks ahead in the direction of travel)
    const viewH = 180;
    s.look += ((s.left ? -1 : 1) - s.look) * Math.min(1, rawDt * 2);
    const tx = Math.max(0, Math.min(W * T - w, s.x - w * 0.45 + s.look * w * 0.1));
    const ty = Math.max(0, Math.min(H * T - viewH, s.y - 120));
    s.camX += (tx - s.camX) * Math.min(1, rawDt * 7);
    s.camY += (ty - s.camY) * Math.min(1, rawDt * 5);
    const camX = Math.round(s.camX + (s.shake > 0 ? Math.sin(t * 70) * 3 : 0));
    const camY = Math.round(s.camY + (s.shake > 0 ? Math.cos(t * 55) * 2 : 0));

    // ---- draw
    drawBackdrop(ctx, w, viewH, spec.theme, time, t, camX, camY);
    ctx.drawImage(tiles, camX, camY, w, viewH, 0, 0, w, viewH);
    const lights: [number, number, number][] = [];
    const c0 = Math.max(0, Math.floor(camX / T));
    const c1 = Math.min(W, c0 + Math.ceil(w / T) + 2);
    for (let r = Math.max(0, Math.floor(camY / T)); r < Math.min(H, Math.floor((camY + viewH) / T) + 2); r++)
      for (let c = c0; c < c1; c++) {
        const ch = at(r, c);
        const X = c * T - camX;
        const Y = r * T - camY;
        if (ch === '~') {
          ctx.fillStyle = '#b8dcf4';
          ctx.fillRect(X + ((t * 24 + c * 6) % 16), Y + 6, 5, 1);
        } else if (ch === 'T') {
          ctx.fillStyle = '#5a3a1e';
          ctx.fillRect(X + 9, Y + 8, 3, 11);
          ctx.fillStyle = '#c8a040';
          ctx.fillRect(X + 6, Y + 7, 9, 2);
          const fl = Math.sin(t * 12 + c) * 1.3;
          const g = ctx.createRadialGradient(X + 10, Y + 3, 1, X + 10, Y + 3, 30);
          g.addColorStop(0, 'rgba(255,200,90,0.35)');
          g.addColorStop(1, 'rgba(255,200,90,0)');
          ctx.fillStyle = g;
          ctx.fillRect(X - 22, Y - 27, 64, 60);
          ctx.fillStyle = '#ff8a2a';
          ctx.fillRect(X + 7, Y + fl, 6, 7);
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(X + 9, Y + 2 + fl, 3, 4);
          lights.push([X + 10, Y + 2, 70]);
          if (Math.random() < 0.05) s.parts.push({ x: c * T + 10, y: r * T, vx: (Math.random() - 0.5) * 10, vy: -30, c: '#ffb040', life: 0.6, g: -10 });
        } else if (ch === 'D' && !s.doors.has(`${r},${c}`) && at(r - 1, c) !== 'D') {
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(X, Y - T, T, 2 * T);
          ctx.fillStyle = '#8a5a30';
          ctx.fillRect(X + 1, Y - T + 1, T - 2, 2 * T - 2);
          ctx.fillStyle = '#6a4220';
          for (let q = 0; q < 4; q++) ctx.fillRect(X + 1, Y - T + 6 + q * 9, T - 2, 1);
          ctx.fillStyle = '#e8b830';
          ctx.fillRect(X + 7, Y - 3, 6, 7);
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(X + 9, Y, 2, 3);
        } else if (ch === 'G' || ch === 'O' || ch === 'Q') {
          const open = ch === 'G' ? s.gates : ch === 'O' ? s.plate : s.seqOpen;
          const lift = open ? T - 4 : 0;
          ctx.fillStyle = '#3a3a44';
          ctx.fillRect(X + 1, Y - lift, T - 2, 3);
          for (let q = 0; q < 4; q++) {
            ctx.fillStyle = ch === 'Q' ? '#b8902a' : '#6a6a78';
            ctx.fillRect(X + 2 + q * 5, Y - lift, 3, T - (open ? T - 4 : 0));
          }
        } else if (ch === 'U' && at(r - 1, c) !== 'U') {
          // Sealed bronze door with a dial window for each pedestal.
          const lift = s.vaultOpen ? Math.min(2 * T - 4, (s.vaultT ?? 0) * 60) : 0;
          ctx.save();
          ctx.beginPath();
          ctx.rect(X - 6, Y - 2 * T - 4, T + 12, 3 * T + 4);
          ctx.clip();
          const Y0 = Y - lift;
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(X - 3, Y0 - 1, T + 6, 2 * T + 2);
          ctx.fillStyle = '#a8782a';
          ctx.fillRect(X - 2, Y0, T + 4, 2 * T);
          ctx.fillStyle = '#c8983a';
          ctx.fillRect(X - 2, Y0, 3, 2 * T);
          ctx.strokeStyle = '#e8c860';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(X + T / 2, Y0 + T, 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#1a2a3a';
          ctx.fillRect(X - 1, Y0 + T - 5, T + 2, 10);
          ctx.font = '8px serif';
          s.dialKeys.forEach((k, q) => {
            const okSym = s.dial[k] === s.code[q];
            ctx.fillStyle = s.vaultOpen || okSym ? '#7af0a0' : '#7ad8ff';
            ctx.fillText(DIAL[s.dial[k]], X + q * 7 - 1, Y0 + T + 3);
          });
          lights.push([X + T / 2, Y0 + T, 24]);
          ctx.restore();
        } else if (ch === 's') {
          ctx.font = '11px serif';
          s.code.forEach((sym, q) => {
            ctx.fillStyle = '#4a2a14';
            ctx.fillText(DIAL[sym], X - 3 + q * 9, Y + 10);
          });
        } else if (ch === 'x' && !s.broken.has(`${r},${c}`)) {
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(X + 4, Y + 3, 1, 6);
          ctx.fillRect(X + 5, Y + 8, 5, 1);
          ctx.fillRect(X + 10, Y + 8, 1, 7);
          ctx.fillRect(X + 13, Y + 2, 1, 5);
        } else if (ch === 'x' && s.broken.has(`${r},${c}`)) {
          ctx.fillStyle = th.wall ?? 'rgba(0,0,0,0.25)';
          ctx.fillRect(X, Y, T, T);
          ctx.fillStyle = th.mortar;
          ctx.fillRect(X + 2, Y + T - 4, 6, 4);
          ctx.fillRect(X + 11, Y + T - 3, 5, 3);
        } else if (ch === 'V' && s.broken.has(`${r},${c}`)) {
          ctx.fillStyle = '#7a4a24';
          ctx.fillRect(X + 4, Y + T - 3, 4, 3);
          ctx.fillRect(X + 11, Y + T - 2, 5, 2);
        } else if (ch === 'm') {
          s.order.forEach((sym, q) => {
            const done = s.seq.length > q || s.seqOpen;
            ctx.fillStyle = done ? '#2a8a3a' : '#5a3a1e';
            ctx.font = '12px serif';
            ctx.fillText(SYMBOLS[sym], X - 1 + q * 9, Y + 9);
          });
        }
      }
    // Items.
    for (const [key, it] of s.items) {
      const [r, c] = key.split(',').map(Number);
      const X = c * T - camX;
      const Y = r * T - camY;
      if (X < -T || X > w + T) continue;
      const bob = Math.round(Math.sin(t * 4 + c) * 2);
      if (it === '*') {
        const wd = Math.abs(Math.cos(t * 3 + c)) * 6 + 1;
        ctx.fillStyle = '#1a3a6a';
        ctx.beginPath();
        ctx.moveTo(X + 10, Y + 2 + bob);
        ctx.lineTo(X + 10 + wd, Y + 10 + bob);
        ctx.lineTo(X + 10, Y + 18 + bob);
        ctx.lineTo(X + 10 - wd, Y + 10 + bob);
        ctx.fill();
        ctx.fillStyle = '#5ac0ff';
        ctx.beginPath();
        ctx.moveTo(X + 10, Y + 4 + bob);
        ctx.lineTo(X + 10 + wd - 1, Y + 10 + bob);
        ctx.lineTo(X + 10, Y + 16 + bob);
        ctx.lineTo(X + 10 - wd + 1, Y + 10 + bob);
        ctx.fill();
        ctx.fillStyle = '#e8f8ff';
        ctx.fillRect(X + 9, Y + 7 + bob, 1, 3);
        lights.push([X + 10, Y + 10, 26]);
      } else if (it === 'k') {
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(X + 3, Y + 5 + bob, 8, 8);
        ctx.fillRect(X + 10, Y + 8 + bob, 9, 3);
        ctx.fillStyle = '#ffd23a';
        ctx.fillRect(X + 4, Y + 6 + bob, 6, 6);
        ctx.fillRect(X + 10, Y + 9 + bob, 8, 1);
        ctx.fillRect(X + 15, Y + 10 + bob, 2, 2);
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(X + 6, Y + 8 + bob, 2, 2);
        lights.push([X + 10, Y + 10, 30]);
      } else if (it === 'C') {
        const lit = s.check.x === c * T + 10 && s.check.y === (r + 1) * T;
        ctx.fillStyle = '#5a5a64';
        ctx.fillRect(X + 4, Y + 12, 12, 8);
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(X + 4, Y + 12, 12, 2);
        if (lit) {
          ctx.fillStyle = '#ff8a2a';
          ctx.fillRect(X + 6, Y + 4 + Math.sin(t * 14), 8, 8);
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(X + 8, Y + 7, 4, 4);
          lights.push([X + 10, Y + 6, 60]);
        }
      } else if (it === 'L' || '123'.includes(it)) {
        const seqIdx = '123'.includes(it) ? s.leverSym[key] : -1;
        const on = it === 'L' ? s.gates : s.seqOpen || s.seq.includes(seqIdx);
        ctx.fillStyle = '#3a3a44';
        ctx.fillRect(X + 4, Y + 14, 12, 6);
        ctx.save();
        ctx.translate(X + 10, Y + 16);
        ctx.rotate(on ? 0.7 : -0.7);
        ctx.fillStyle = '#8a8a94';
        ctx.fillRect(-1, -13, 3, 13);
        ctx.fillStyle = on ? '#3ac04a' : '#d8402a';
        ctx.fillRect(-2, -16, 5, 5);
        ctx.restore();
        if (seqIdx >= 0) {
          ctx.fillStyle = '#f4e4c0';
          ctx.font = '10px serif';
          ctx.fillText(SYMBOLS[seqIdx], X + 6, Y + 2);
        }
      } else if (it === 'r') {
        // Stone pedestal with a glowing ring and its current symbol.
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(X + 4, Y + 6, 12, 14);
        ctx.fillStyle = '#c8bca8';
        ctx.fillRect(X + 5, Y + 7, 10, 13);
        ctx.fillStyle = '#e8e0d0';
        ctx.fillRect(X + 3, Y + 5, 14, 3);
        const okSym = s.vaultOpen || s.dial[key] === s.code[s.dialKeys.indexOf(key)];
        ctx.strokeStyle = okSym ? '#7af0a0' : '#5ad8ff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(X + 10, Y - 2 + bob * 0.5, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#f4f0ff';
        ctx.font = '9px serif';
        ctx.fillText(DIAL[s.dial[key]], X + 6, Y + 1 + bob * 0.5);
        lights.push([X + 10, Y, 22]);
      } else if (it === 'p') {
        ctx.fillStyle = s.plate ? '#3ac04a' : '#b89a40';
        ctx.fillRect(X + 3, Y + (s.plate ? 17 : 15), 14, 2);
      } else if (it === 'E') {
        ctx.fillStyle = '#2a1a10';
        ctx.fillRect(X - 3, Y - T - 6, T + 6, 2 * T + 6);
        const g = ctx.createLinearGradient(0, Y - T, 0, Y + T);
        g.addColorStop(0, '#fff4c0');
        g.addColorStop(1, '#e8a830');
        ctx.fillStyle = g;
        ctx.fillRect(X, Y - T - 3, T, 2 * T + 3);
        ctx.fillStyle = `rgba(255,240,180,${0.25 + Math.sin(t * 3) * 0.1})`;
        ctx.fillRect(X - 10, Y - T - 12, T + 20, 2 * T + 12);
        lights.push([X + 10, Y, 80]);
      }
    }
    for (const b of s.crates) {
      const X = Math.round(b.x - camX);
      const Y = Math.round(b.y - camY);
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(X, Y, T, T);
      ctx.fillStyle = b.locked ? '#c89a54' : '#a87a44';
      ctx.fillRect(X + 1, Y + 1, T - 2, T - 2);
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(X + 1, Y + 9, T - 2, 2);
      ctx.fillRect(X + 9, Y + 1, 2, T - 2);
      ctx.fillStyle = '#c8985a';
      ctx.fillRect(X + 1, Y + 1, T - 2, 1);
    }
    // People.
    for (const n of s.npcs) {
      const X = n.x - camX;
      const Y = n.y - camY;
      if (X < -30 || X > w + 30) continue;
      drawChar(
        ctx,
        n.sick && !n.healed ? 'anciao' : n.i % 3 === 0 ? 'aldeao' : n.i % 3 === 1 ? 'mulher' : 'menino',
        n.sick && !n.healed ? 'defeat' : n.healed ? 'victory' : 'idle',
        n.sick && !n.healed ? 2 : Math.floor(t * 5 + n.i),
        X,
        Y,
        s.x < n.x,
      );
      if (n.sick && !n.healed) {
        ctx.fillStyle = '#9ad0ff';
        ctx.fillRect(X - 1, Y - 44 + Math.sin(t * 3) * 2, 3, 3);
      }
    }
    // Enemies.
    for (const e of s.enemies) {
      if (e.gone) continue;
      const X = e.x - camX;
      const Y = e.y - camY;
      if (X < -40 || X > w + 40) continue;
      const flash = e.state === 'hurt' && Math.floor(t * 20) % 2 === 0;
      ctx.globalAlpha = e.state === 'dead' ? Math.max(0, e.timer) : e.kind === 'shadow' ? 0.85 : 1;
      if (e.kind === 'human' || e.kind === 'shadow') {
        const id = e.kind === 'shadow' ? 'tentador' : (e.cast ?? 'soldado');
        const ea: Anim =
          e.state === 'dead'
            ? 'defeat'
            : e.state === 'hurt'
              ? 'hurt'
              : e.state === 'windup' || e.state === 'strike'
                ? 'attack'
                : e.state === 'chase' || e.state === 'flee'
                  ? 'run'
                  : e.state === 'patrol' || e.state === 'return'
                    ? 'walk'
                    : 'idle';
        const efi = e.state === 'windup' ? 0 : e.state === 'strike' ? 1 : e.state === 'dead' ? Math.min(3, Math.floor((0.9 - e.timer) * 6)) : Math.floor(e.anim * ANIMS[ea].fps);
        if (flash) ctx.filter = 'brightness(3)';
        drawChar(ctx, id as CastId, ea, efi, X, Y, e.dir < 0);
        ctx.filter = 'none';
        if (e.kind === 'shadow') lights.push([X, Y - 20, 22]);
        if (e.state === 'alert' || (e.state === 'chase' && e.anim % 1 < 0.3)) {
          ctx.fillStyle = '#ffe066';
          ctx.fillRect(X - 2, Y - 52, 4, 8);
          ctx.fillRect(X - 2, Y - 42, 4, 3);
        }
        // Vision cone for stealth guards.
        if (style === 'stealth' && (e.state === 'patrol' || e.state === 'idle' || e.state === 'return')) {
          ctx.fillStyle = 'rgba(255,240,150,0.13)';
          ctx.beginPath();
          ctx.moveTo(X + e.dir * 6, Y - 28);
          ctx.lineTo(X + e.dir * 6 * T, Y - 44);
          ctx.lineTo(X + e.dir * 6 * T, Y - 4);
          ctx.fill();
        }
      } else drawCreature(ctx, e.kind as 'snake', X, Y, e.dir < 0, t + e.home, flash);
      ctx.globalAlpha = 1;
    }
    // Sling stones.
    for (const p of s.stones) {
      ctx.fillStyle = '#3a3a44';
      ctx.fillRect(Math.round(p.x - camX) - 2, Math.round(p.y - camY) - 2, 4, 4);
      ctx.fillStyle = '#bdbdc8';
      ctx.fillRect(Math.round(p.x - camX) - 1, Math.round(p.y - camY) - 1, 2, 2);
    }
    // Hero.
    if (!(s.inv > 0 && !s.action && Math.floor(t * 16) % 2)) {
      ctx.globalAlpha = s.hidden ? 0.45 : 1;
      drawChar(ctx, cast, anim, fi, s.x - camX, s.y - camY + (anim === 'climb' ? 2 : 0), s.left && anim !== 'climb');
      ctx.globalAlpha = 1;
    }
    lights.push([s.x - camX, s.y - camY - 18, 64]);
    // Bushes in front of everything.
    for (let r = Math.max(0, Math.floor(camY / T)); r < Math.min(H, Math.floor((camY + viewH) / T) + 2); r++)
      for (let c = c0; c < c1; c++)
        if (at(r, c) === 'b') {
          const X = c * T - camX;
          const Y = r * T - camY;
          ctx.fillStyle = '#2a5a2a';
          ctx.beginPath();
          ctx.arc(X + 4, Y + 12, 9, 0, Math.PI * 2);
          ctx.arc(X + 16, Y + 11, 10, 0, Math.PI * 2);
          ctx.arc(X + 10, Y + 5, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3a7a32';
          ctx.beginPath();
          ctx.arc(X + 7, Y + 7, 5, 0, Math.PI * 2);
          ctx.arc(X + 15, Y + 8, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2a5a2a';
          ctx.fillRect(X - 5, Y + 12, 30, 8);
        }
    // Particles.
    for (const p of s.parts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2.5));
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), 2, 2);
    }
    ctx.globalAlpha = 1;
    // Weather.
    if (sky.rain) {
      ctx.fillStyle = 'rgba(190,210,240,0.55)';
      for (let i = 0; i < 70; i++) {
        const rx = ((i * 53 + t * 260) % (w + 40)) - 20;
        const ry = (i * 97 + t * 520) % viewH;
        ctx.fillRect(rx, ry, 1, 6);
      }
      if (Math.sin(t * 0.7) > 0.995) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(0, 0, w, viewH);
      }
    }
    if (time === 'night' && spec.theme !== 'cave')
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = `rgba(220,255,140,${0.4 + 0.4 * Math.sin(t * 3 + i)})`;
        ctx.fillRect((((i * 131 + Math.sin(t * 0.5 + i) * 30 - camX * 0.6) % w) + w) % w, 60 + ((i * 37) % 90) + Math.sin(t + i) * 8, 2, 2);
      }
    // Darkness and lights.
    drawLights(ctx, w, viewH, spec.theme === 'cave' ? Math.max(0.5, sky.dark) : sky.dark, lights);
    // Vignette.
    const vg = ctx.createRadialGradient(w / 2, viewH / 2, viewH * 0.45, w / 2, viewH / 2, w * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, viewH);
    if (s.flash > 0) {
      ctx.fillStyle = `rgba(200,40,40,${s.flash})`;
      ctx.fillRect(0, 0, w, viewH);
    }
  });

  // What the action button does right now.
  const near = () => {
    const s = st.current;
    const r = Math.floor((s.y - 4) / T);
    const c = Math.floor(s.x / T);
    for (const dc of [0, -1, 1]) {
      const it = s.items.get(`${r},${c + dc}`);
      if (it === 'L') return { kind: 'lever' as const };
      if (it && '123'.includes(it)) return { kind: 'seq' as const, key: `${r},${c + dc}` };
      if (it === 'r') return { kind: 'dial' as const, key: `${r},${c + dc}` };
    }
    const n = s.npcs.find((q) => Math.abs(q.x - s.x) < 24 && Math.abs(q.y - s.y) < 12);
    if (n?.sick && !n.healed && (cast === 'jesus' || cast === 'pedro')) return { kind: 'heal' as const, n };
    if (n) return { kind: 'npc' as const, n };
    if (cast === 'jesus' && s.enemies.some((e) => e.kind === 'shadow' && !e.gone && Math.abs(e.x - s.x) < 60 && Math.abs(e.y - s.y) < 30)) return { kind: 'bless' as const };
    if (style === 'sling' || style === 'strong') return { kind: 'attack' as const };
    return null;
  };
  const action = () => {
    const s = st.current;
    if (paused || lost || s.won || s.dead > 0) return;
    if (talk) return stopLine(), setTalk(null);
    const nr = near();
    if (!nr) return;
    if (nr.kind === 'lever') {
      s.gates = !s.gates;
      s.action = { anim: 'interact', t: 0, hit: true };
      engine.drum('tom', 0, 0.7);
      engine.sfx('power');
      buzz(30);
    } else if (nr.kind === 'seq') {
      if (s.seqOpen) return;
      const sym = s.leverSym[nr.key];
      s.action = { anim: 'interact', t: 0, hit: true };
      if (s.seq.includes(sym)) return;
      if (s.order[s.seq.length] === sym) {
        s.seq.push(sym);
        engine.playNote(72 + s.seq.length * 4, 'bell', 0, 0.3);
        if (s.seq.length === 3) {
          s.seqOpen = true;
          engine.sfx('power');
          buzz([30, 30, 80]);
          flashMsg('Mecanismo destravado!');
        }
      } else {
        s.seq = [];
        engine.sfx('bonk');
        buzz([40, 40]);
        flashMsg('Ordem errada! Veja o mural na parede.');
      }
    } else if (nr.kind === 'dial') {
      if (s.vaultOpen) return;
      s.action = { anim: 'interact', t: 0, hit: true };
      s.dial[nr.key] = (s.dial[nr.key] + 1) % DIAL.length;
      engine.playNote(67 + s.dial[nr.key] * 3, 'pluck', 0, 0.25);
      buzz(15);
      if (s.dialKeys.every((k, q) => s.dial[k] === s.code[q])) {
        s.vaultOpen = true;
        s.vaultT = 0;
        engine.sfx('power');
        engine.playNote(79, 'bell', 0.15, 0.35);
        buzz([30, 30, 90]);
        flashMsg('A porta selada se abriu!');
      }
    } else if (nr.kind === 'heal') {
      nr.n.healed = true;
      s.healed += 1;
      s.action = { anim: 'special', t: 0, hit: true };
      engine.sfx('power');
      engine.playNote(79, 'bell', 0.1, 0.4);
      buzz([30, 30, 60]);
      for (let i = 0; i < 24; i++)
        s.parts.push({ x: nr.n.x + (Math.random() - 0.5) * 30, y: nr.n.y - Math.random() * 40, vx: 0, vy: -30 - Math.random() * 30, c: '#fff4c0', life: 1, g: -20 });
      s.gems += 3;
      s.totalGems += 3;
      flashMsg('“Levanta-te e anda!”');
    } else if (nr.kind === 'bless') {
      s.action = { anim: 'special', t: 0, hit: true };
      engine.sfx('power');
      for (const e of s.enemies)
        if (e.kind === 'shadow' && !e.gone && Math.abs(e.x - s.x) < 90) {
          e.state = 'flee';
          e.timer = 3;
          e.dir = e.x > s.x ? 1 : -1;
        }
      flashMsg('“Vai-te, Satanás!”');
    } else if (nr.kind === 'npc') {
      const text = spec.npc?.[nr.n.i] ?? spec.goal ?? 'A paz! Siga em frente: a saída fica do outro lado.';
      setTalk({ text, look: nr.n.look });
      speakLine(text);
      s.action = { anim: 'interact', t: 0, hit: true };
      engine.playNote(84, 'bell', 0, 0.2);
    } else if (nr.kind === 'attack') {
      if (s.action && s.action.anim === 'attack') return;
      s.action = { anim: 'attack', t: 0, hit: false };
    }
  };
  const jump = () => {
    st.current.buffer = 0.14;
    jumpHeld.current = true;
  };
  useKeys(
    (k) => {
      const AX: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (AX[k]) keys.current = { ...keys.current, x: AX[k][0] || keys.current.x, y: AX[k][1] || keys.current.y };
      if (k === 'shift') keys.current = { ...keys.current, run: true };
      if (k === ' ' || k === 'z' || (k === 'arrowup' && !keys.current.y)) jump();
      if (k === 'e' || k === 'enter' || k === 'x' || k === 'j') action();
    },
    (k) => {
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') keys.current = { ...keys.current, x: 0 };
      if (k === 'arrowup' || k === 'w' || k === 'arrowdown' || k === 's') keys.current = { ...keys.current, y: 0 };
      if (k === 'shift') keys.current = { ...keys.current, run: false };
      if (k === ' ' || k === 'z') jumpHeld.current = false;
    },
  );
  useEffect(
    () => () => {
      jumpHeld.current = false;
      stopLine();
    },
    [],
  );
  const s = st.current;
  const nr = !paused ? near() : null;
  const label = !nr ? 'Ação' : { lever: 'Alavanca', seq: 'Alavanca', dial: 'Girar', heal: 'Curar', bless: 'Abençoar', npc: 'Falar', attack: style === 'sling' ? 'Funda' : 'Soco' }[nr.kind];
  const hot = !!nr && nr.kind !== 'attack';
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap items-center gap-2">
            <Panel className="text-base">{spec.goal ?? 'Encontre a saída'}</Panel>
            <Panel className="flex items-center gap-2 text-base">
              <span title="Chaves">🗝 {s.keys}</span>
              <span className="text-[#9ae0ff]">
                ◆ {s.gems}/{s.totalGems}
              </span>
              <span className="text-[#ff8a8a]">
                {'♥'.repeat(Math.max(0, s.lives))}
                <span className="opacity-30">{'♥'.repeat(Math.max(0, LIVES - Math.max(0, s.lives)))}</span>
              </span>
              {s.hidden && <span className="text-[#9af06a]">escondido</span>}
            </Panel>
          </div>
          {toast && <div className="rpg-frame rpg-text pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 px-3 py-1 text-base">{toast}</div>}
          <Joystick
            className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]"
            onChange={(x, y) => (keys.current = { ...keys.current, x: Math.abs(x) < 0.2 ? 0 : x, y: Math.abs(y) < 0.4 ? 0 : y })}
          />
          <button
            onPointerDown={(e) => (e.preventDefault(), action())}
            className={cx(
              'rpg-text absolute bottom-28 right-[max(1.5rem,env(safe-area-inset-right))] grid h-16 w-16 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-sm shadow-[3px_3px_0_#0006]',
              hot || talk ? 'animate-blink bg-[#e8b830] text-[#3a2414]' : nr?.kind === 'attack' ? 'bg-[#8a4a2a]' : 'bg-[#5a4a3a]',
            )}
          >
            {talk ? 'Falar' : label}
          </button>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              jump();
            }}
            onPointerUp={() => (jumpHeld.current = false)}
            onPointerCancel={() => (jumpHeld.current = false)}
            className="rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-20 w-20 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Pular
          </button>
        </>
      )}
      {talk && (
        <div className="absolute inset-x-2 bottom-2 z-10 mx-auto flex max-w-3xl items-stretch gap-2" onClick={() => (stopLine(), setTalk(null))}>
          <Portrait look={talk.look} className="h-20 w-20" />
          <div className="rpg-frame rpg-text flex-1 px-3 py-2 text-lg leading-snug">{talk.text}</div>
        </div>
      )}
      {lost && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-4">
          <div className="rpg-frame rpg-text flex max-w-md flex-col items-center gap-3 p-4 text-center">
            <p className="text-xl">As forças acabaram!</p>
            <p className="text-sm opacity-90">
              {style === 'stealth'
                ? 'Os guardas veem tudo à frente deles (a luz amarela). Espere eles virarem de costas ou fique parado dentro dos arbustos.'
                : style === 'peace'
                  ? 'Pule por cima dos animais e use as fogueiras como ponto de retorno.'
                  : 'Ataque antes que o inimigo levante a lança, e use as fogueiras como ponto de retorno.'}
            </p>
            <button
              className="rpg-wood h-12 w-full text-xl"
              onClick={() => {
                st.current = fresh();
                setLost(false);
              }}
            >
              Tentar de novo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
