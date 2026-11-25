/**
 * Two-player side-view stage. Each phone moves its own hero (instant response)
 * and sends its position ~20 times a second; the partner is drawn interpolated.
 * Davi's phone (host) owns the shared world: items taken, the team's keys,
 * opened doors, the lever, the checkpoint and the win. Pressure plates and the
 * gates they hold open follow both heroes' positions with the same rule on both
 * phones, and guards walk a fixed route in time, so neither needs the network.
 *
 * Tiles: '#' solid · '=' one-way platform · '^' spikes · 'p' plate · 'O' gate open
 * while any plate is pressed · 'L' lever · 'G' gate opened by the lever · 'k' key ·
 * 'D' door (uses a team key) · '*' gem · 'C' checkpoint · 'E' exit (both heroes) ·
 * 'P' Davi's start · 'Q' Jônatas' start · 'X' guard · 'b' bush (hide, standing still) · 'T' torch.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { engine } from '../../../audio/engine';
import { cx } from '../../../ui/kit';
import { buzz, Panel, starsOf, useKeys, useStage } from '../../pixel/stage';
import { Joystick } from '../../pixel/Controls';
import { drawBackdrop, themeTime } from '../../platform/sky';
import { paintTiles, THEMES, T } from '../../platform/Platform';
import { ANIMS, drawChar, type Anim, type CastId } from '../../platform/rig';
import type { ThemeId, TimeOfDay } from '../../platform/level';
import { Mate, useMsg, type CoopProps } from './link';

const G = 920;
const JUMP = 352;
const WALK = 112;
const HW = 6;
const HH = 30;

const SEG: Record<string, string[]> = {
  start: ['......', '......', '......', '......', '......', '......', '..T...', '......', '.PQ...', '######'],
  flat: ['........', '........', '........', '........', '........', '........', '..*..*..', '........', '........', '########'],
  steps: ['..........', '..........', '..........', '......*...', '.....===..', '..........', '...===....', '..........', '..........', '##########'],
  // One holds a plate while the other passes the gate; then the other way round.
  hold: ['..........#...', '..........#...', '..........#...', '..........#...', '..........#...', '..........#...', '..........#...', '..........O...', '...p......O.p.', '##############'],
  // A wall too high to jump: climb on the partner's shoulders, pull the lever, the tunnel opens.
  boost: ['................', '................', '................', '................', '......L..*......', '.....######.....', '.....#....#.....', '.....G....G.....', '.....G....G.....', '################'],
  key: ['..........', '....k.....', '...===....', '..........', '......==..', '..........', '...==.....', '..........', '..........', '##########'],
  door: ['...#..', '...#..', '...#..', '...#..', '...#..', '...#..', '...#..', '...D..', '...D..', '######'],
  check: ['....', '....', '....', '....', '....', '....', '....', '....', '.C..', '####'],
  // A guard on the ground: pass over him on the high walkway (3 tiles up) while he looks the other way.
  guard: ['................', '................', '................', '................', '........*.......', '................', '...==========...', '................', '..b.....X....b..', '################'],
  spikes: ['............', '............', '............', '............', '....*.......', '............', '..===...===.', '............', '............', '#^^^^^^^^^^#'],
  exit: ['......#', '......#', '......#', '......#', '......#', '......#', '...T..#', '......#', '..E...#', '#######'],
};

export interface DuoLevel {
  theme: ThemeId;
  time?: TimeOfDay;
  goal: string;
  /** Segments per difficulty (easy, normal, hard). */
  segs: [string[], string[], string[]];
}

function build(segs: string[]) {
  const rows: string[] = Array.from({ length: 10 }, () => '');
  for (const n of segs) SEG[n].forEach((r, i) => (rows[i] += r));
  const w = rows[0].length;
  return ['#'.repeat(w), ...rows.map((r) => '#' + r.slice(1)), '#'.repeat(w)];
}

interface Me {
  x: number;
  y: number;
  a: Anim;
  f: number;
  l: boolean;
  h: boolean;
  ex: boolean;
}
interface World {
  taken: string[];
  keys: number;
  doors: string[];
  lever: boolean;
  check: [number, number];
  deaths: number;
}

export function DuoStage({ room, role, diff, onWin, level }: CoopProps & { level: DuoLevel }) {
  const rows = useMemo(() => build(level.segs[Math.max(0, Math.min(2, diff))]), [level, diff]);
  const H = rows.length;
  const W = rows[0].length;
  const at = (r: number, c: number) => (r < 0 || c < 0 || r >= H || c >= W ? '#' : rows[r][c]);
  const th = THEMES[level.theme];
  const time = level.time ?? themeTime(level.theme);
  const tiles = useMemo(() => paintTiles(rows, th), [rows, th]);
  const cast: CastId = role === 'host' ? 'davi' : 'jonatas';
  const mateCast: CastId = role === 'host' ? 'jonatas' : 'davi';
  const find = (ch: string) => {
    for (let r = 0; r < H; r++) {
      const c = rows[r].indexOf(ch);
      if (c >= 0) return [c * T + T / 2, (r + 1) * T] as [number, number];
    }
    return [2 * T, 9 * T] as [number, number];
  };
  const spawn = find(role === 'host' ? 'P' : 'Q');
  const totalGems = useMemo(() => rows.join('').split('*').length - 1, [rows]);
  const guards = useMemo(() => {
    const g: { x: number; y: number; ph: number }[] = [];
    rows.forEach((row, r) => [...row].forEach((ch, c) => ch === 'X' && g.push({ x: c * T + T / 2, y: (r + 1) * T, ph: c * 0.7 })));
    return g;
  }, [rows]);
  const startStr = find('P');

  const world = useRef<World>({ taken: [], keys: 0, doors: [], lever: false, check: startStr, deaths: 0 });
  const [, render] = useState(0);
  const st = useRef({ x: spawn[0], y: spawn[1], vx: 0, vy: 0, ground: true, left: false, coyote: 0, buffer: 0, flash: 0, hold: false, dead: 0, won: false, pending: new Set<string>() });
  const keys = useRef({ x: 0 });
  const mate = useRef(new Mate<Me>());
  const t0 = useRef(performance.now());
  const [toast, setToast] = useState<string | null>(null);
  const toastT = useRef(0);
  const flashMsg = (m: string) => {
    setToast(m);
    window.clearTimeout(toastT.current);
    toastT.current = window.setTimeout(() => setToast(null), 1800);
  };

  // ---------------------------------------------------------------- shared world (host decides)
  const publish = () => room.send({ t: 'g', k: 'world', w: world.current });
  const apply = (ev: { k: string; key?: string }, fromGuest: boolean) => {
    const w = world.current;
    if (ev.k === 'take' && ev.key && !w.taken.includes(ev.key)) {
      const [r, c] = ev.key.split(',').map(Number);
      const it = at(r, c);
      w.taken = [...w.taken, ev.key];
      if (it === 'k') w.keys += 1;
      if (it === 'C') w.check = [c * T + T / 2, (r + 1) * T];
    } else if (ev.k === 'door' && ev.key && !w.doors.includes(ev.key) && w.keys > 0) {
      const [r, c] = ev.key.split(',').map(Number);
      w.keys -= 1;
      w.doors = [...w.doors, ev.key, `${r - 1},${c}`, `${r + 1},${c}`];
    } else if (ev.k === 'lever') w.lever = !w.lever;
    else if (ev.k === 'die') w.deaths += 1;
    else return;
    void fromGuest;
    publish();
    render((n) => n + 1);
  };
  const ask = (ev: { k: string; key?: string }) => (role === 'host' ? apply(ev, false) : room.send({ t: 'g', k: 'req', ev }));

  useMsg(room, 'g', (m) => {
    if (m.k === 'me') mate.current.push(m.s as Me);
    else if (m.k === 'req' && role === 'host') apply(m.ev as { k: string; key?: string }, true);
    else if (m.k === 'world' && role === 'guest') {
      const prev = world.current;
      world.current = m.w as World;
      for (const k of world.current.taken) st.current.pending.delete(k);
      if (world.current.lever !== prev.lever) engine.sfx('power');
      render((n) => n + 1);
    } else if (m.k === 'win') finish(m.stars as number);
  });

  const finish = (stars: number) => {
    if (st.current.won) return;
    st.current.won = true;
    engine.sfx('yay');
    buzz([40, 30, 80]);
    window.setTimeout(() => onWin(stars), 1200);
  };

  // ---------------------------------------------------------------- simulation
  const platePressed = (me: { x: number; y: number }, other: Me | null) => {
    const on = (x: number, y: number) => at(Math.floor((y - 2) / T), Math.floor(x / T)) === 'p';
    return on(me.x, me.y) || (!!other && on(other.x, other.y));
  };
  const solid = (r: number, c: number, plate: boolean) => {
    const ch = at(r, c);
    const w = world.current;
    if (ch === '#') return true;
    if (ch === 'D') return !w.doors.includes(`${r},${c}`);
    if (ch === 'O') return !plate;
    if (ch === 'G') return !w.lever;
    return false;
  };
  const guardPos = (g: { x: number; y: number; ph: number }, t: number) => {
    const k = Math.sin(t * 0.7 + g.ph);
    return { x: g.x + k * T * 2.6, left: Math.cos(t * 0.7 + g.ph) < 0, y: g.y };
  };

  const lastSent = useRef(0);
  const cv = useStage((ctx, w, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const s = st.current;
    const t = (performance.now() - t0.current) / 1000;
    const other = mate.current.at();
    const plate = platePressed(s, other);
    const blocked = (x: number, y: number) => solid(Math.floor(y / T), Math.floor(x / T), plate);
    // Respawn after a fall or a guard.
    if (s.dead > 0) {
      s.dead -= dt;
      if (s.dead <= 0) {
        [s.x, s.y] = world.current.check;
        s.x += role === 'host' ? -8 : 8;
        s.vx = s.vy = 0;
      }
    } else if (!s.won) {
      const ax = keys.current.x;
      s.vx = ax * WALK;
      if (ax) s.left = ax < 0;
      // Horizontal move.
      const nx = s.x + s.vx * dt;
      const side = nx + (s.vx > 0 ? HW : -HW);
      if (!blocked(side, s.y - 4) && !blocked(side, s.y - HH + 2)) s.x = nx;
      // Jump (buffered, with coyote time) and gravity.
      s.buffer -= dt;
      s.coyote = s.ground ? 0.1 : s.coyote - dt;
      if (s.buffer > 0 && s.coyote > 0) {
        s.vy = -JUMP;
        s.buffer = 0;
        s.coyote = 0;
        engine.playNote(72, 'pluck', 0, 0.1);
      }
      s.vy = Math.min(s.vy + G * dt * (s.vy < 0 && !s.hold ? 1.8 : 1), 520);
      const ny = s.y + s.vy * dt;
      s.ground = false;
      if (s.vy >= 0) {
        // Feet: solid tiles, one-way platforms, and the partner's head.
        const rFeet = Math.floor(ny / T);
        const prevR = Math.floor((s.y - 0.01) / T);
        const tileUnder = (x: number) => solid(rFeet, Math.floor(x / T), plate) || (at(rFeet, Math.floor(x / T)) === '=' && prevR < rFeet);
        let land: number | null = tileUnder(s.x - HW + 1) || tileUnder(s.x + HW - 1) ? rFeet * T : null;
        if (other && Math.abs(other.x - s.x) < HW * 2 - 1) {
          const head = other.y - HH;
          if (s.y <= head + 1 && ny >= head) land = land === null ? head : Math.min(land, head);
        }
        if (land !== null) {
          s.y = land;
          s.vy = 0;
          s.ground = true;
        } else s.y = ny;
      } else {
        const rHead = Math.floor((ny - HH) / T);
        if (solid(rHead, Math.floor((s.x - HW + 1) / T), plate) || solid(rHead, Math.floor((s.x + HW - 1) / T), plate)) {
          s.vy = 0;
          s.y = (rHead + 1) * T + HH;
        } else s.y = ny;
      }
      // Hazards.
      const here = at(Math.floor((s.y - 2) / T), Math.floor(s.x / T));
      const hidden = here === 'b' && Math.abs(s.vx) < 1 && s.ground;
      let die = here === '^' || s.y > H * T;
      for (const g of guards) {
        const p = guardPos(g, t);
        const dx = s.x - p.x;
        const facing = p.left ? dx < 0 : dx > 0;
        if (!hidden && Math.abs(s.y - p.y) < 22 && ((facing && Math.abs(dx) < 46) || Math.abs(dx) < 10)) die = true;
      }
      if (die) {
        s.dead = 0.9;
        s.flash = 0.4;
        engine.sfx('bonk');
        buzz([40, 40]);
        flashMsg(here === '^' ? 'Cuidado com os espinhos!' : 'Um guarda viu você! Use os arbustos.');
        ask({ k: 'die' });
      }
      // Items, checkpoint, doors.
      const r = Math.floor((s.y - 6) / T);
      const c = Math.floor(s.x / T);
      for (const [rr, cc] of [
        [r, c],
        [r - 1, c],
      ]) {
        const it = at(rr, cc);
        const key = `${rr},${cc}`;
        if ('k*C'.includes(it) && it !== '.' && !world.current.taken.includes(key) && !s.pending.has(key)) {
          s.pending.add(key);
          if (it === '*') engine.playNote(84, 'bell', 0, 0.15);
          if (it === 'k') (engine.sfx('power'), flashMsg('Chave da equipe!'));
          if (it === 'C') flashMsg('Ponto de retorno');
          ask({ k: 'take', key });
        }
      }
      for (const dc of [-1, 1]) {
        const cc = Math.floor((s.x + dc * (HW + 2)) / T);
        const rr = Math.floor((s.y - 4) / T);
        if (at(rr, cc) === 'D' && !world.current.doors.includes(`${rr},${cc}`)) {
          if (world.current.keys > 0 && !s.pending.has(`door${rr},${cc}`)) {
            s.pending.add(`door${rr},${cc}`);
            engine.sfx('power');
            ask({ k: 'door', key: `${rr},${cc}` });
          }
        }
      }
      // Exit: both heroes must stand there.
      const atExit = at(Math.floor((s.y - 2) / T), Math.floor(s.x / T)) === 'E' || at(Math.floor((s.y - 2) / T), Math.floor((s.x + 10) / T)) === 'E';
      (s as unknown as { ex: boolean }).ex = atExit;
      if (role === 'host' && atExit && other?.ex && !s.won) {
        const w0 = world.current;
        const gems = w0.taken.filter((k) => at(+k.split(',')[0], +k.split(',')[1]) === '*').length;
        const stars = starsOf(0.6 * (totalGems ? gems / totalGems : 1) + 0.4 * Math.max(0, 1 - w0.deaths / 6));
        room.send({ t: 'g', k: 'win', stars });
        finish(stars);
      }
      (s as unknown as { hidden: boolean }).hidden = hidden;
    }
    // Send my state ~20 times a second.
    const now = performance.now();
    const anim: Anim = s.dead > 0 ? 'hurt' : s.won ? 'victory' : !s.ground ? (s.vy < 0 ? 'jump' : 'fall') : Math.abs(s.vx) > 1 ? 'walk' : 'idle';
    const fi = Math.floor(t * ANIMS[anim].fps) % ANIMS[anim].frames;
    if (now - lastSent.current > 50) {
      lastSent.current = now;
      room.send({ t: 'g', k: 'me', s: { x: Math.round(s.x * 10) / 10, y: Math.round(s.y * 10) / 10, a: anim, f: fi, l: s.left, h: (s as unknown as { hidden: boolean }).hidden ?? false, ex: (s as unknown as { ex: boolean }).ex ?? false } satisfies Me });
    }

    // ---------------------------------------------------------------- drawing
    const viewH = 180;
    const camX = Math.max(0, Math.min(W * T - w, s.x - w * 0.45));
    const camY = Math.max(0, Math.min(H * T - viewH, s.y - viewH * 0.6));
    drawBackdrop(ctx, w, viewH, level.theme, time, t, camX, camY);
    ctx.drawImage(tiles, -Math.round(camX), -Math.round(camY));
    const wd = world.current;
    for (let r = 0; r < H; r++)
      for (let c = Math.max(0, Math.floor(camX / T) - 1); c < Math.min(W, Math.ceil((camX + w) / T) + 1); c++) {
        const ch = rows[r][c];
        const X = c * T - Math.round(camX);
        const Y = r * T - Math.round(camY);
        const key = `${r},${c}`;
        if (ch === 'O' || ch === 'G') {
          const open = ch === 'O' ? plate : wd.lever;
          if (!open) {
            ctx.fillStyle = '#3a3a44';
            ctx.fillRect(X + 1, Y, T - 2, 3);
            ctx.fillStyle = ch === 'O' ? '#6a6a78' : '#b8902a';
            for (let q = 0; q < 4; q++) ctx.fillRect(X + 2 + q * 5, Y, 3, T);
          }
        } else if (ch === 'D' && !wd.doors.includes(key) && at(r - 1, c) !== 'D') {
          ctx.fillStyle = '#2a1a10';
          ctx.fillRect(X, Y, T, 2 * T);
          ctx.fillStyle = '#8a5a30';
          ctx.fillRect(X + 1, Y + 1, T - 2, 2 * T - 2);
          ctx.fillStyle = '#e8b830';
          ctx.fillRect(X + 7, Y + T - 3, 6, 7);
        } else if (ch === 'p') {
          ctx.fillStyle = plate ? '#3ac04a' : '#b89a40';
          ctx.fillRect(X + 3, Y + (plate ? 17 : 15), 14, 3);
        } else if (ch === 'L') {
          ctx.fillStyle = '#3a3a44';
          ctx.fillRect(X + 4, Y + 14, 12, 6);
          ctx.save();
          ctx.translate(X + 10, Y + 16);
          ctx.rotate(wd.lever ? 0.7 : -0.7);
          ctx.fillStyle = '#8a8a94';
          ctx.fillRect(-1, -13, 3, 13);
          ctx.fillStyle = wd.lever ? '#3ac04a' : '#d8402a';
          ctx.fillRect(-2, -16, 5, 5);
          ctx.restore();
        } else if (ch === 'b') {
          ctx.fillStyle = '#2e6a2a';
          ctx.beginPath();
          ctx.ellipse(X + 10, Y + 14, 13, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a8a3a';
          ctx.fillRect(X + 2, Y + 8, 6, 3);
        } else if (ch === 'E') {
          ctx.fillStyle = 'rgba(255,240,180,0.35)';
          ctx.fillRect(X - 6, Y - T - 10, T + 20, 2 * T + 10);
          ctx.fillStyle = '#e8a830';
          ctx.fillRect(X, Y - T, T + 8, 2 * T);
          ctx.fillStyle = '#fff4c0';
          ctx.fillRect(X + 3, Y - T + 3, T + 2, 2 * T - 3);
        } else if (!wd.taken.includes(key) && !st.current.pending.has(key)) {
          const bob = Math.round(Math.sin(t * 4 + c) * 2);
          if (ch === '*') {
            const wd2 = Math.abs(Math.cos(t * 3 + c)) * 6 + 1;
            ctx.fillStyle = '#1a3a6a';
            ctx.beginPath();
            ctx.moveTo(X + 10, Y + 2 + bob);
            ctx.lineTo(X + 10 + wd2, Y + 10 + bob);
            ctx.lineTo(X + 10, Y + 18 + bob);
            ctx.lineTo(X + 10 - wd2, Y + 10 + bob);
            ctx.fill();
            ctx.fillStyle = '#5ac0ff';
            ctx.beginPath();
            ctx.moveTo(X + 10, Y + 4 + bob);
            ctx.lineTo(X + 9 + wd2, Y + 10 + bob);
            ctx.lineTo(X + 10, Y + 16 + bob);
            ctx.lineTo(X + 11 - wd2, Y + 10 + bob);
            ctx.fill();
          } else if (ch === 'k') {
            ctx.fillStyle = '#ffd23a';
            ctx.fillRect(X + 4, Y + 6 + bob, 6, 6);
            ctx.fillRect(X + 10, Y + 9 + bob, 8, 2);
          } else if (ch === 'C') {
            ctx.fillStyle = '#5a5a64';
            ctx.fillRect(X + 4, Y + 12, 12, 8);
          }
        } else if (ch === 'C') {
          ctx.fillStyle = '#5a5a64';
          ctx.fillRect(X + 4, Y + 12, 12, 8);
          ctx.fillStyle = '#ff8a2a';
          ctx.fillRect(X + 6, Y + 4 + Math.sin(t * 14), 8, 8);
        }
      }
    for (const g of guards) {
      const p = guardPos(g, t);
      drawChar(ctx, 'soldado', 'walk', Math.floor(t * 8) % 6, p.x - camX, p.y - camY, p.left);
      ctx.fillStyle = 'rgba(255,220,90,0.18)';
      ctx.fillRect(p.left ? p.x - 46 - camX : p.x - camX, p.y - 30 - camY, 46, 30);
    }
    // Partner, then me.
    if (other) {
      ctx.globalAlpha = other.h ? 0.45 : 1;
      drawChar(ctx, mateCast, other.a, other.f, other.x - camX, other.y - camY, other.l);
      ctx.globalAlpha = 1;
      const sx = other.x - camX;
      if (sx < 4 || sx > w - 4) {
        const ax = sx < 4 ? 6 : w - 6;
        ctx.fillStyle = role === 'host' ? '#2e6ab0' : '#c8902a';
        ctx.beginPath();
        ctx.moveTo(ax + (sx < 4 ? -4 : 4), 90);
        ctx.lineTo(ax + (sx < 4 ? 4 : -4), 84);
        ctx.lineTo(ax + (sx < 4 ? 4 : -4), 96);
        ctx.fill();
      }
    }
    if (s.dead <= 0 || Math.floor(t * 20) % 2) {
      ctx.globalAlpha = (s as unknown as { hidden: boolean }).hidden ? 0.5 : 1;
      drawChar(ctx, cast, anim, fi, s.x - camX, s.y - camY, s.left);
      ctx.globalAlpha = 1;
    }
    if (s.flash > 0) {
      s.flash -= dt;
      ctx.fillStyle = `rgba(200,40,40,${s.flash})`;
      ctx.fillRect(0, 0, w, viewH);
    }
  });

  // ---------------------------------------------------------------- input
  const jump = () => {
    st.current.buffer = 0.14;
    st.current.hold = true;
  };
  const action = () => {
    const s = st.current;
    const c = Math.floor(s.x / T);
    const r = Math.floor((s.y - 4) / T);
    if ([c - 1, c, c + 1].some((cc) => at(r, cc) === 'L')) {
      engine.drum('tom', 0, 0.7);
      ask({ k: 'lever' });
    } else flashMsg(role === 'host' ? 'Nada aqui. Jônatas pode precisar de ajuda!' : 'Nada aqui. Davi pode precisar de ajuda!');
  };
  useKeys(
    (k) => {
      if (k === 'arrowleft' || k === 'a') keys.current.x = -1;
      if (k === 'arrowright' || k === 'd') keys.current.x = 1;
      if (k === ' ' || k === 'z' || k === 'arrowup' || k === 'w') jump();
      if (k === 'e' || k === 'x' || k === 'enter') action();
    },
    (k) => {
      if (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') keys.current.x = 0;
      if (k === ' ' || k === 'z' || k === 'arrowup' || k === 'w') st.current.hold = false;
    },
  );
  useEffect(() => {
    t0.current = performance.now();
  }, []);
  // Check the partner's heartbeat once a second (the HUD only re-renders on world changes otherwise).
  const [mateAge, setMateAge] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setMateAge(mate.current.age()), 1000);
    return () => window.clearInterval(id);
  }, []);
  // Test hook (development only).
  if (import.meta.env.DEV) (window as unknown as { __duo: unknown }).__duo = { st, world, rows, mate, keys, jump, action, role };

  const wd = world.current;
  const gems = wd.taken.filter((k) => at(+k.split(',')[0], +k.split(',')[1]) === '*').length;
  const stalled = mateAge > 3000;
  return (
    <>
      <canvas ref={cv} className="pixelated absolute inset-0 h-full w-full" aria-label="Fase em dupla" />
      <div className="pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-2 top-2 flex flex-wrap items-center gap-2">
        <Panel className="text-sm sm:text-base">{level.goal}</Panel>
        <Panel className="flex items-center gap-2 text-sm sm:text-base">
          <span title="Chaves da equipe">🗝 {wd.keys}</span>
          <span className="text-[#9ae0ff]">
            ◆ {gems}/{totalGems}
          </span>
          <span className={cx(role === 'host' ? 'text-[#7ab0ff]' : 'text-[#ffd07a]')}>Você: {role === 'host' ? 'Davi' : 'Jônatas'}</span>
          {stalled && <span className="text-[#ffb0a0]">esperando {role === 'host' ? 'Jônatas' : 'Davi'}…</span>}
        </Panel>
      </div>
      {toast && <div className="rpg-frame rpg-text pointer-events-none absolute left-1/2 top-14 -translate-x-1/2 px-3 py-1 text-sm">{toast}</div>}
      <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x) => (keys.current.x = Math.abs(x) < 0.25 ? 0 : Math.sign(x))} />
      <button
        onPointerDown={(e) => (e.preventDefault(), action())}
        className="rpg-text absolute bottom-28 right-[max(1.5rem,env(safe-area-inset-right))] grid h-16 w-16 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#5a4a3a] text-sm shadow-[3px_3px_0_#0006]"
      >
        Ação
      </button>
      <button
        onPointerDown={(e) => (e.preventDefault(), jump())}
        onPointerUp={() => (st.current.hold = false)}
        onPointerCancel={() => (st.current.hold = false)}
        className="rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-20 w-20 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-lg shadow-[3px_3px_0_#0006] active:scale-95"
      >
        Pular
      </button>
    </>
  );
}
