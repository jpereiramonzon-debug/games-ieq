import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, RotateCw, X } from 'lucide-react';
import { engine } from '../../audio/engine';
import { get, set, submitScore, useStore } from '../../store';
import { cx } from '../../ui/kit';
import { HYMNS } from '../jesus/hymns';
import { AButton, Joystick, Typed } from '../pixel/Controls';
import { RotateHint, useIsPortrait } from '../pixel/orientation';
import { Dialog } from '../pixel/Dialog';
import { icon, iconURL, type IconId } from '../pixel/icons';
import { drawPerson, LOOKS, type Dir, type Look } from '../pixel/person';
import { drawWater, isSolid, paintMap, T, type Tile } from '../quest/map';
import { GameShell } from '../Shell';
import { DiffPicker } from '../pixel/StoryMode';
import { heroFace } from '../pixel/heroes';
import { JosePuzzle, PUZZLES, Sharpen, type Tool } from './Puzzles';
import {
  BG,
  buildMap,
  FINALE,
  HAMMER_BAD,
  HAMMER_GOOD,
  ITEM_NAME,
  JOSE,
  LOOK,
  MARIA,
  MH,
  MW,
  NAMES,
  ORDERS,
  PASSERS,
  RECIPES,
  SPOT,
  UPGRADES,
  type ItemId,
  type Line,
  type Order,
  type Who,
} from './world';

const VH = 180;
const SPEED = 66;
const DAY_SECONDS = 240;

// ---------------------------------------------------------------- save

export interface CarpSave {
  day: number;
  clock: number;
  wood: number;
  stone: number;
  seed: number;
  lily: number;
  coins: number;
  hearts: number;
  /** Finished pieces, each with its quality (1-3 stars). */
  items: Partial<Record<ItemId, number[]>>;
  /** Day a tree / rock was taken (0 = standing). */
  trees: number[];
  rocks: number[];
  plots: { stage: number; wet: boolean }[];
  done: string[];
  orders: string[];
  ups: string[];
  jose: number;
  gift: number;
  finale: boolean;
  /** Edge of the axe and the pick, 0-100. */
  sharp: Record<Tool, number>;
  /** Day José's last puzzle was solved, and how many were solved. */
  puzzleDay: number;
  puzzles: number;
}

function freshSave(): CarpSave {
  return {
    day: 1,
    clock: 6,
    wood: 0,
    stone: 0,
    seed: 4,
    lily: 0,
    coins: 0,
    hearts: 0,
    items: {},
    trees: SPOT.trees.map(() => 0),
    rocks: SPOT.rocks.map(() => 0),
    plots: SPOT.plots.map(() => ({ stage: -1, wet: false })),
    done: [],
    orders: refill(1, [], []),
    ups: [],
    jose: 0,
    gift: 0,
    finale: false,
    sharp: { axe: 100, pick: 100 },
    puzzleDay: 0,
    puzzles: 0,
  };
}

function refill(day: number, done: string[], current: string[]): string[] {
  const out = [...current];
  for (const o of ORDERS) {
    if (out.length >= 3) break;
    if (o.day <= day && !done.includes(o.id) && !out.includes(o.id)) out.push(o.id);
  }
  return out;
}

const orderById = (id: string) => ORDERS.find((o) => o.id === id)!;
const have = (s: CarpSave, o: Order) => (o.item === 'lily' ? s.lily >= o.qty : (s.items[o.item]?.length ?? 0) >= o.qty);

// ---------------------------------------------------------------- runtime

interface Npc {
  id: string;
  who: Who | 'passer';
  look: Look;
  x: number;
  y: number;
  dir: Dir;
  step: number;
  path: { x: number; y: number }[];
  delay: number;
  order?: string;
  leaving?: boolean;
  gone?: boolean;
  wave?: number;
  waved?: boolean;
}

interface Pop {
  x: number;
  y: number;
  text: string;
  t: number;
  color: string;
}

interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Game {
  sv: CarpSave;
  map: Tile[][];
  mapCanvas: HTMLCanvasElement;
  px: number;
  py: number;
  dir: Dir;
  walked: number;
  keys: { x: number; y: number };
  time: number;
  npcs: Npc[];
  pops: Pop[];
  parts: Part[];
  hp: { trees: number[]; rocks: number[] };
  hit: { kind: 'tree' | 'rock'; i: number; t: number } | null;
  swing: { tool: IconId; t: number } | null;
  nextPasser: number;
  music: { i: number; at: number; bi: number; bat: number };
}

const cxp = (n: number) => n * T + T / 2;
const feet = (n: number) => n * T + T - 2;

function spawnCustomers(g: Game) {
  g.npcs = g.npcs.filter((n) => !n.order);
  g.sv.orders.forEach((id, i) => {
    const o = orderById(id);
    const [wx, wy] = SPOT.wait[i % SPOT.wait.length];
    g.npcs.push({
      id: `o-${id}`,
      who: o.who,
      look: LOOK[o.who as keyof typeof LOOK],
      x: cxp(SPOT.enter[0]),
      y: feet(SPOT.enter[1]) + 20,
      dir: 'up',
      step: 0,
      delay: 1 + i * 5,
      path: [
        { x: cxp(SPOT.yardGate[0]), y: feet(SPOT.yardGate[1]) },
        { x: cxp(wx), y: feet(wy) },
      ],
      order: id,
    });
  });
}

function makeGame(sv: CarpSave): Game {
  // Saves from before the grindstone and the puzzles.
  sv.sharp ??= { axe: 100, pick: 100 };
  sv.puzzleDay ??= 0;
  sv.puzzles ??= 0;
  const map = buildMap();
  const g: Game = {
    sv,
    map,
    mapCanvas: paintMap(map),
    px: cxp(SPOT.start[0]),
    py: feet(SPOT.start[1]),
    dir: 'down',
    walked: 0,
    keys: { x: 0, y: 0 },
    time: 0,
    npcs: [
      { id: 'jose', who: 'jose', look: LOOK.jose, x: cxp(SPOT.jose[0]), y: feet(SPOT.jose[1]), dir: 'up', step: 0, path: [], delay: 0 },
      { id: 'maria', who: 'maria', look: LOOK.maria, x: cxp(SPOT.maria[0]), y: feet(SPOT.maria[1]), dir: 'right', step: 0, path: [], delay: 0 },
    ],
    pops: [],
    parts: [],
    hp: { trees: SPOT.trees.map(() => 99), rocks: SPOT.rocks.map(() => 99) },
    hit: null,
    swing: null,
    nextPasser: 6,
    music: { i: 0, at: 0, bi: 0, bat: 0 },
  };
  spawnCustomers(g);
  return g;
}

type Target =
  | { kind: 'npc'; n: Npc }
  | { kind: 'bench' }
  | { kind: 'plot'; i: number }
  | { kind: 'tree'; i: number }
  | { kind: 'rock'; i: number }
  | { kind: 'door' }
  | { kind: 'grind' };

function findTarget(g: Game): Target | null {
  const fx = g.px + (g.dir === 'left' ? -12 : g.dir === 'right' ? 12 : 0);
  const fy = g.py - 6 + (g.dir === 'up' ? -12 : g.dir === 'down' ? 10 : 0);
  let best: Target | null = null;
  let bestD = 1;
  const test = (x: number, y: number, r: number, t: Target) => {
    const d = Math.hypot(x - fx, y - fy) / r;
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  };
  for (const n of g.npcs) if (!n.gone && n.who !== 'passer' && !n.path.length && n.delay <= 0) test(n.x, n.y - 8, 16, { kind: 'npc', n });
  test(SPOT.bench[0] * T + T, SPOT.bench[1] * T + 8, 22, { kind: 'bench' });
  SPOT.plots.forEach(([x, y], i) => test(cxp(x), y * T + 8, 12, { kind: 'plot', i }));
  SPOT.trees.forEach(([x, y], i) => !g.sv.trees[i] && test(cxp(x), y * T + 8, 16, { kind: 'tree', i }));
  SPOT.rocks.forEach(([x, y], i) => !g.sv.rocks[i] && test(cxp(x), y * T + 8, 15, { kind: 'rock', i }));
  test(cxp(SPOT.houseDoor[0]), SPOT.houseDoor[1] * T + 12, 20, { kind: 'door' });
  test(cxp(SPOT.grind[0]), SPOT.grind[1] * T + 8, 16, { kind: 'grind' });
  return best;
}

function targetIcon(g: Game, t: Target | null): IconId | null {
  if (!t) return null;
  switch (t.kind) {
    case 'npc':
      return 'chat';
    case 'bench':
      return 'hammer';
    case 'tree':
      return 'axe';
    case 'rock':
      return 'pick';
    case 'door':
      return 'moon';
    case 'grind':
      return 'wheel';
    case 'plot': {
      const p = g.sv.plots[t.i];
      return p.stage < 0 ? 'seed' : p.stage >= 2 ? 'lily' : 'can';
    }
  }
}

function solidAt(g: Game, x: number, y: number) {
  if (isSolid(g.map, Math.floor(x / T), Math.floor(y / T))) return true;
  for (let i = 0; i < SPOT.trees.length; i++) {
    const [tx, ty] = SPOT.trees[i];
    if (x > tx * T + 3 && x < tx * T + 13 && y > ty * T + 8 && y < ty * T + 16) return true;
  }
  for (let i = 0; i < SPOT.rocks.length; i++) {
    if (g.sv.rocks[i]) continue;
    const [tx, ty] = SPOT.rocks[i];
    if (x > tx * T + 1 && x < tx * T + 15 && y > ty * T + 4 && y < ty * T + 16) return true;
  }
  const [bx, by] = SPOT.bench;
  if (x > bx * T - 2 && x < bx * T + 34 && y > by * T + 2 && y < by * T + 16) return true;
  const [gx, gy] = SPOT.grind;
  if (x > gx * T && x < gx * T + 16 && y > gy * T + 6 && y < gy * T + 16) return true;
  const [wx, wy] = SPOT.woodpile;
  if (x > wx * T - 2 && x < wx * T + 18 && y > wy * T + 4 && y < wy * T + 16) return true;
  return g.npcs.some((n) => !n.gone && n.who !== 'passer' && !n.path.length && n.delay <= 0 && Math.abs(n.x - x) < 8 && Math.abs(n.y - y) < 5);
}

// ---------------------------------------------------------------- drawing

function drawTree(ctx: CanvasRenderingContext2D, X: number, Y: number, shake: number) {
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(X + x, Y + y, w, h);
  };
  px(1, 13, 14, 3, 'rgba(30,40,10,0.3)');
  px(5, 4, 6, 12, '#3a2414');
  px(6, 4, 4, 11, '#6a4424');
  px(6, 4, 1, 11, '#8a6234');
  const sx = Math.round(shake);
  for (let yy = 0; yy < 18; yy++)
    for (let xx = 0; xx < 24; xx++) {
      const d = ((xx - 12) / 11.5) ** 2 + ((yy - 8.5) / 8.5) ** 2;
      if (d > 1) continue;
      const col = d > 0.86 ? '#2a3a14' : xx > 14 && yy > 7 ? '#3e5e22' : (xx * 3 + yy * 5) % 11 === 0 ? '#9aca5a' : xx < 9 && yy < 8 ? '#7aaa4a' : '#5a8a32';
      px(xx - 4 + sx, yy - 14, 1, 1, col);
    }
}

function drawStump(ctx: CanvasRenderingContext2D, X: number, Y: number) {
  ctx.fillStyle = 'rgba(30,40,10,0.3)';
  ctx.fillRect(X + 2, Y + 13, 12, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X + 4, Y + 8, 8, 7);
  ctx.fillStyle = '#6a4424';
  ctx.fillRect(X + 5, Y + 10, 6, 4);
  ctx.fillStyle = '#e0c088';
  ctx.fillRect(X + 5, Y + 8, 6, 2);
  ctx.fillStyle = '#b8945a';
  ctx.fillRect(X + 7, Y + 8, 2, 1);
  ctx.fillStyle = '#6a9a3a';
  ctx.fillRect(X + 12, Y + 11, 2, 2);
}

function drawRock(ctx: CanvasRenderingContext2D, X: number, Y: number, shake: number, hp: number) {
  const sx = Math.round(shake);
  ctx.fillStyle = 'rgba(40,24,10,0.25)';
  ctx.fillRect(X + 1, Y + 13, 15, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X + 1 + sx, Y + 4, 14, 11);
  ctx.fillRect(X + 3 + sx, Y + 2, 10, 2);
  ctx.fillStyle = '#a8987e';
  ctx.fillRect(X + 2 + sx, Y + 5, 12, 9);
  ctx.fillRect(X + 4 + sx, Y + 3, 8, 2);
  ctx.fillStyle = '#c8b89c';
  ctx.fillRect(X + 4 + sx, Y + 3, 5, 3);
  ctx.fillStyle = '#7e705c';
  ctx.fillRect(X + 10 + sx, Y + 8, 4, 6);
  if (hp < 3) {
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(X + 6 + sx, Y + 5, 1, 4);
    ctx.fillRect(X + 7 + sx, Y + 9, 1, 3);
  }
  if (hp < 2) ctx.fillRect(X + 10 + sx, Y + 4, 1, 4);
}

function drawBench(ctx: CanvasRenderingContext2D, X: number, Y: number) {
  ctx.fillStyle = 'rgba(40,24,10,0.25)';
  ctx.fillRect(X - 1, Y + 13, 34, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X - 1, Y + 1, 34, 9);
  ctx.fillRect(X + 1, Y + 9, 4, 6);
  ctx.fillRect(X + 27, Y + 9, 4, 6);
  ctx.fillStyle = '#9a6234';
  ctx.fillRect(X, Y + 2, 32, 7);
  ctx.fillStyle = '#c08a4a';
  ctx.fillRect(X, Y + 2, 32, 2);
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(X + 2, Y + 9, 2, 5);
  ctx.fillRect(X + 28, Y + 9, 2, 5);
  // A plank, a saw and the hammer on top.
  ctx.fillStyle = '#e0b878';
  ctx.fillRect(X + 3, Y, 14, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X + 3, Y + 3, 14, 1);
  ctx.fillStyle = '#b4b4c0';
  ctx.fillRect(X + 19, Y + 2, 9, 2);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(X + 27, Y + 1, 3, 3);
  ctx.drawImage(icon('hammer'), X + 9, Y - 6, 9, 9);
}

function drawWoodpile(ctx: CanvasRenderingContext2D, X: number, Y: number, n: number) {
  ctx.fillStyle = 'rgba(40,24,10,0.25)';
  ctx.fillRect(X - 1, Y + 13, 18, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X - 1, Y + 11, 18, 3);
  ctx.fillStyle = '#6a4220';
  ctx.fillRect(X, Y + 11, 16, 2);
  const shown = Math.min(n, 10);
  for (let i = 0; i < shown; i++) {
    const row = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3;
    const col = i < 4 ? i : i < 7 ? i - 4 : i < 9 ? i - 7 : 0;
    const x = X + col * 4 + row * 2;
    const y = Y + 7 - row * 4;
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = '#e8c890';
    ctx.fillRect(x + 1, y + 1, 3, 3);
    ctx.fillStyle = '#b8945a';
    ctx.fillRect(x + 2, y + 2, 1, 1);
  }
}

function drawGrind(ctx: CanvasRenderingContext2D, X: number, Y: number, t: number) {
  ctx.fillStyle = 'rgba(40,24,10,0.25)';
  ctx.fillRect(X, Y + 13, 17, 3);
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X + 1, Y + 8, 15, 4);
  ctx.fillRect(X + 2, Y + 11, 2, 4);
  ctx.fillRect(X + 13, Y + 11, 2, 4);
  ctx.fillStyle = '#9a6234';
  ctx.fillRect(X + 2, Y + 9, 13, 2);
  for (let y = -6; y <= 6; y++)
    for (let x = -6; x <= 6; x++) {
      const d = Math.hypot(x, y);
      if (d > 6) continue;
      const a = Math.atan2(y, x) + t * 3;
      ctx.fillStyle = d > 5 || d < 1 ? '#3a2414' : Math.floor((a / Math.PI) * 3 + 6) % 2 ? '#a8a0a0' : '#8e8686';
      ctx.fillRect(X + 8 + x, Y + 4 + y, 1, 1);
    }
  ctx.fillStyle = '#5e9ccc';
  ctx.fillRect(X + 4, Y + 10, 9, 1);
}

function drawPlot(ctx: CanvasRenderingContext2D, X: number, Y: number, p: { stage: number; wet: boolean }, t: number) {
  ctx.fillStyle = '#3a2414';
  ctx.fillRect(X, Y, 16, 16);
  ctx.fillStyle = p.wet ? '#5a3a22' : '#8a5a34';
  ctx.fillRect(X + 1, Y + 1, 14, 14);
  ctx.fillStyle = p.wet ? '#4a2c18' : '#6a4426';
  for (let r = 0; r < 3; r++) ctx.fillRect(X + 2, Y + 3 + r * 5, 12, 1);
  if (p.stage === 0) {
    ctx.fillStyle = '#e0c080';
    ctx.fillRect(X + 4, Y + 6, 1, 1);
    ctx.fillRect(X + 8, Y + 11, 1, 1);
    ctx.fillRect(X + 11, Y + 6, 1, 1);
  } else if (p.stage === 1) {
    for (const [sx, sy] of [
      [4, 8],
      [10, 9],
    ]) {
      ctx.fillStyle = '#3a5a1a';
      ctx.fillRect(X + sx, Y + sy - 3, 1, 4);
      ctx.fillStyle = '#7aba4a';
      ctx.fillRect(X + sx - 2, Y + sy - 4, 2, 2);
      ctx.fillRect(X + sx + 1, Y + sy - 5, 2, 2);
    }
  } else if (p.stage >= 2) {
    for (const [sx, sy] of [
      [4, 12],
      [11, 13],
      [8, 8],
    ]) {
      const sway = Math.round(Math.sin(t * 2 + sx) * 0.6);
      ctx.fillStyle = '#4a7a2a';
      ctx.fillRect(X + sx, Y + sy - 7, 1, 7);
      ctx.fillRect(X + sx - 2, Y + sy - 3, 2, 1);
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(X + sx - 2 + sway, Y + sy - 11, 5, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(X + sx - 1 + sway, Y + sy - 10, 3, 3);
      ctx.fillStyle = '#ffd23a';
      ctx.fillRect(X + sx + sway, Y + sy - 9, 1, 1);
    }
  }
  if (p.wet && p.stage >= 0 && p.stage < 2) {
    ctx.fillStyle = '#9cc8e8';
    ctx.fillRect(X + 12, Y + 2, 1, 2);
  }
}

// ---------------------------------------------------------------- card

export default function Carpenter({ onBack }: { onBack: () => void }) {
  const save = useStore((s) => s.carpenter) as CarpSave | null;
  const [open, setOpen] = useState(false);
  return (
    <GameShell id="carpenter" title="O Carpinteiro" onBack={onBack}>
      <div className="rpg-frame rpg-text p-3 text-lg leading-snug">
        Nazaré, antes de tudo começar. Jesus trabalha na carpintaria com José: corte madeira, tire pedra da pedreira, cuide da horta de lírios e faça na bancada as encomendas da
        vila. Martele no tempo certo para peças de 3 estrelas!
      </div>
      <DiffPicker />
      {save && (
        <div className="rpg-frame rpg-text flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-lg">
          <span>Dia {save.day}</span>
          <span className="flex items-center gap-1">
            <img src={iconURL('coin')} alt="" className="pixelated h-5 w-5" /> {save.coins}
          </span>
          <span className="flex items-center gap-1">
            <img src={iconURL('heart')} alt="" className="pixelated h-5 w-5" /> {save.hearts}
          </span>
          <span>
            Encomendas: {save.done.length}/{ORDERS.length}
          </span>
        </div>
      )}
      <button
        onClick={() => {
          engine.init();
          const el = document.documentElement;
          (el.requestFullscreen?.() ?? Promise.resolve())
            .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
            .catch(() => undefined);
          setOpen(true);
        }}
        className="rpg-wood rpg-text flex h-14 w-full items-center justify-center gap-2 text-xl active:translate-y-0.5"
      >
        <RotateCw size={20} /> {save ? 'Voltar à oficina' : 'Abrir a oficina (deite o celular)'}
      </button>
      {save && (
        <button
          onClick={() => {
            if (confirm('Apagar o progresso da oficina e começar do dia 1?')) set({ carpenter: null });
          }}
          className="text-sm text-muted underline"
        >
          Recomeçar do zero
        </button>
      )}
      {open && (
        <CarpenterGame
          onExit={() => {
            setOpen(false);
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
          }}
        />
      )}
    </GameShell>
  );
}

// ---------------------------------------------------------------- game

interface DialogState {
  lines: Line[];
  i: number;
  onEnd?: () => void;
  /** Buttons shown on the last line instead of "continue". */
  choices?: { label: string; fn: () => void }[];
}

function CarpenterGame({ onExit }: { onExit: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const first = useRef(!get().carpenter);
  const g = useRef<Game>(makeGame(structuredClone((get().carpenter as CarpSave | null) ?? freshSave())));
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dialogRef = useRef<DialogState | null>(null);
  const [bench, setBench] = useState(false);
  const benchRef = useRef(false);
  benchRef.current = bench;
  const hammerRef = useRef<(() => void) | null>(null);
  const [sleeping, setSleeping] = useState<number | null>(null);
  const [grind, setGrind] = useState(false);
  const [puzzle, setPuzzle] = useState<{ kind: (typeof PUZZLES)[number]['kind']; level: number } | null>(null);
  const overlayRef = useRef(false);
  overlayRef.current = grind || !!puzzle;
  const sleepRef = useRef(false);
  const portrait = useIsPortrait();
  const portraitRef = useRef(portrait);
  portraitRef.current = portrait;
  const [act, setAct] = useState<IconId | null>(null);
  const actRef = useRef<IconId | null>(null);
  const [, setTick] = useState(0);
  const rerender = () => setTick((x) => x + 1);
  const viewW = useRef(320);

  const persist = () => set({ carpenter: structuredClone(g.current.sv) });

  const openDialog = (d: DialogState | null) => {
    dialogRef.current = d;
    setDialog(d);
  };
  const say = (lines: Line[], onEnd?: () => void) => {
    engine.playNote(84, 'bell', 0, 0.22);
    openDialog({ lines, i: 0, onEnd });
  };
  const typing = useRef({ done: true, finish: () => {} });
  const skip = () => {
    const d = dialogRef.current;
    if (!d || d.choices) return;
    openDialog(null);
    d.onEnd?.();
  };
  const advance = () => {
    const d = dialogRef.current;
    if (!d) return;
    if (!typing.current.done) return typing.current.finish();
    if (d.choices && d.i === d.lines.length - 1) return;
    if (d.i + 1 < d.lines.length) {
      engine.playNote(84, 'bell', 0, 0.18);
      openDialog({ ...d, i: d.i + 1 });
    } else {
      openDialog(null);
      d.onEnd?.();
    }
  };
  const pick = <V,>(l: readonly V[]) => l[Math.floor(Math.random() * l.length)];
  const pop = (x: number, y: number, text: string, color = '#ffe08a') => g.current.pops.push({ x, y, text, t: g.current.time, color });
  const burst = (x: number, y: number, color: string, n = 8, up = 50) => {
    for (let i = 0; i < n; i++) g.current.parts.push({ x, y, vx: (Math.random() - 0.5) * 70, vy: -up * (0.4 + Math.random()), life: 0.8, color });
  };

  const needText = (o: Order) => {
    if (o.item === 'lily') return `Vou colher na horta. Preciso de ${o.qty} lírios (tenho ${g.current.sv.lily}).`;
    const r = RECIPES.find((x) => x.id === o.item)!;
    return `Pode deixar! Faço na bancada: ${r.wood} madeira${r.stone ? ` e ${r.stone} pedra${r.stone > 1 ? 's' : ''}` : ''}.`;
  };

  const deliver = (n: Npc, o: Order) => {
    const s = g.current;
    const sv = s.sv;
    let stars = 2;
    if (o.item === 'lily') sv.lily -= o.qty;
    else {
      const list = (sv.items[o.item] ??= []);
      list.sort((a, b) => b - a);
      stars = list.shift() ?? 1;
    }
    const coins = o.coins + stars;
    sv.coins += coins;
    sv.hearts += 1;
    sv.done.push(o.id);
    sv.orders = sv.orders.filter((x) => x !== o.id);
    engine.sfx('coin');
    pop(n.x, n.y - 38, `+${coins} moedas`);
    n.leaving = true;
    n.path = [
      { x: cxp(SPOT.yardGate[0]), y: feet(SPOT.yardGate[1]) },
      { x: cxp(SPOT.enter[0]), y: feet(SPOT.enter[1]) + 24 },
    ];
    persist();
    submitScore('carpenter', sv.done.length);
    rerender();
    say(o.thanks, () => {
      if (sv.done.length === ORDERS.length && !sv.finale) {
        sv.finale = true;
        persist();
        engine.sfx('yay');
        say(FINALE);
      }
    });
  };

  const newDay = () => {
    const s = g.current;
    const sv = s.sv;
    sv.day += 1;
    sv.clock = 6;
    sv.trees = sv.trees.map((d) => (d && sv.day - d >= 1 ? 0 : d));
    sv.rocks = sv.rocks.map((d) => (d && sv.day - d >= 1 ? 0 : d));
    s.hp = { trees: SPOT.trees.map(() => 99), rocks: SPOT.rocks.map(() => 99) };
    sv.plots = sv.plots.map((p) => (p.stage >= 0 && p.stage < 2 && p.wet ? { stage: p.stage + 1, wet: false } : { ...p, wet: false }));
    const before = sv.orders.length;
    sv.orders = refill(sv.day, sv.done, sv.orders);
    s.px = cxp(SPOT.houseDoor[0]);
    s.py = feet(SPOT.houseDoor[1] + 1);
    s.dir = 'down';
    spawnCustomers(s);
    persist();
    rerender();
    const lines: Line[] = [{ who: 'jesus', text: `Dia ${sv.day}. Bom dia, Nazaré!`, mood: 'happy' }];
    if (sv.orders.length > before) lines.push({ who: 'jose', text: 'Filho, chegaram encomendas novas! O povo já está vindo.', mood: 'happy' });
    if (sv.plots.some((p) => p.stage >= 2)) lines.push({ who: 'maria', text: 'Os lírios floresceram! Vá colher.', mood: 'happy' });
    window.setTimeout(() => say(lines), 300);
  };

  const sleep = () => {
    sleepRef.current = true;
    setSleeping(g.current.sv.day + 1);
    engine.playNote(72, 'bell', 0, 0.2);
    engine.playNote(76, 'bell', 0.3, 0.2);
    engine.playNote(79, 'bell', 0.6, 0.2);
    window.setTimeout(() => {
      newDay();
      setSleeping(null);
      sleepRef.current = false;
    }, 1800);
  };

  const toolOf = (kind: 'tree' | 'rock'): Tool => (kind === 'tree' ? 'axe' : 'pick');
  const strikes = (kind: 'tree' | 'rock') => {
    const sv = g.current.sv;
    const edge = sv.sharp[toolOf(kind)];
    return (sv.ups.includes(toolOf(kind)) ? 2 : 3) + (edge <= 0 ? 2 : edge < 35 ? 1 : 0);
  };
  const dullWarned = useRef<Record<Tool, boolean>>({ axe: false, pick: false });

  const interact = () => {
    const s = g.current;
    const sv = s.sv;
    const t = findTarget(s);
    if (!t) return;
    switch (t.kind) {
      case 'npc': {
        const n = t.n;
        n.dir = s.px < n.x ? 'left' : s.px > n.x ? 'right' : s.py < n.y ? 'up' : 'down';
        if (n.who === 'jose') {
          if (sv.puzzleDay !== sv.day) {
            const pz = PUZZLES[sv.puzzles % PUZZLES.length];
            return openDialog({
              lines: [{ who: 'jose', text: `Filho, tenho um desafio pra você hoje: “${pz.name}”. Topa? Paga em moedas e madeira!`, mood: 'happy' }],
              i: 0,
              choices: [
                {
                  label: 'Bora, pai!',
                  fn: () => {
                    openDialog(null);
                    setPuzzle({ kind: pz.kind, level: Math.floor(sv.puzzles / PUZZLES.length) + get().storyDiff });
                  },
                },
                { label: 'Agora não', fn: () => say([{ who: 'jose', text: 'Tudo bem. Estarei aqui na oficina quando quiser.' }]) },
              ],
            });
          }
          return say([{ who: 'jose', text: JOSE[sv.jose++ % JOSE.length] }]);
        }
        if (n.who === 'maria') {
          if (sv.gift !== sv.day) {
            sv.gift = sv.day;
            sv.seed += 2;
            engine.sfx('coin');
            return say([{ who: 'maria', text: 'Filho, a vizinha mandou sementes de lírio. Tome, duas pra você!', mood: 'happy' }], rerender);
          }
          return say([{ who: 'maria', text: pick(MARIA) }]);
        }
        if (n.order) {
          const o = orderById(n.order);
          if (have(sv, o)) return deliver(n, o);
          return say([...o.ask, { who: 'jesus', text: needText(o) }]);
        }
        return;
      }
      case 'bench':
        engine.playNote(79, 'pluck', 0, 0.2);
        return setBench(true);
      case 'grind':
        engine.playNote(79, 'pluck', 0, 0.2);
        return setGrind(true);
      case 'door':
        if (sv.clock < 15) return say([{ who: 'maria', text: 'Já vai dormir, filho? O sol ainda está alto! Volte depois das três da tarde.' }]);
        return sleep();
      case 'tree':
      case 'rock': {
        const [tx, ty] = (t.kind === 'tree' ? SPOT.trees : SPOT.rocks)[t.i];
        const hp = t.kind === 'tree' ? s.hp.trees : s.hp.rocks;
        s.swing = { tool: t.kind === 'tree' ? 'axe' : 'pick', t: s.time };
        s.hit = { kind: t.kind, i: t.i, t: s.time };
        const need = strikes(t.kind);
        if (hp[t.i] >= 99) hp[t.i] = need;
        hp[t.i] -= 1;
        const tool = toolOf(t.kind);
        const before = sv.sharp[tool];
        sv.sharp[tool] = Math.max(0, before - (sv.ups.includes(tool) ? 3 : 5));
        if (sv.sharp[tool] < 35 && before >= 35 && !dullWarned.current[tool]) {
          dullWarned.current[tool] = true;
          pop(s.px, s.py - 40, tool === 'axe' ? 'Machado cego!' : 'Picareta cega!', '#ffb08a');
        }
        if (t.kind === 'tree') {
          engine.drum('tom', 0, 0.8);
          burst(cxp(tx), ty * T + 6, '#c09a60', 5);
          burst(cxp(tx), ty * T - 4, '#6a9a3a', 4, 20);
        } else {
          engine.drum('snare', 0, 0.6);
          burst(cxp(tx), ty * T + 6, '#c8b89c', 6);
        }
        if (hp[t.i] <= 0) {
          if (t.kind === 'tree') {
            sv.trees[t.i] = sv.day;
            sv.wood += 3;
            engine.sfx('stomp');
            pop(cxp(tx), ty * T - 8, '+3 madeira');
          } else {
            sv.rocks[t.i] = sv.day;
            sv.stone += 2;
            engine.sfx('stomp');
            pop(cxp(tx), ty * T - 4, '+2 pedras');
          }
          rerender();
        }
        return;
      }
      case 'plot': {
        const p = sv.plots[t.i];
        const [tx, ty] = SPOT.plots[t.i];
        if (p.stage < 0) {
          if (!sv.seed) return say([{ who: 'jesus', text: 'Sem sementes... Mamãe às vezes tem. E na bancada dá pra comprar.' }]);
          sv.seed -= 1;
          p.stage = 0;
          p.wet = false;
          engine.sfx('bump');
          pop(cxp(tx), ty * T, 'Plantado!');
        } else if (p.stage >= 2) {
          p.stage = -1;
          p.wet = false;
          sv.lily += 2;
          sv.seed += 1;
          engine.sfx('power');
          burst(cxp(tx), ty * T + 4, '#ffffff', 10);
          pop(cxp(tx), ty * T, '+2 lírios');
        } else if (p.wet) {
          return say([{ who: 'jesus', text: 'Já reguei. Agora é esperar: a semente cresce de noite, sem que se saiba como.' }]);
        } else {
          s.swing = { tool: 'can', t: s.time };
          const row = sv.ups.includes('can') ? SPOT.plots.map((q, i) => (q[1] === ty ? i : -1)).filter((i) => i >= 0) : [t.i];
          for (const i of row) {
            const q = sv.plots[i];
            if (q.stage >= 0 && q.stage < 2) {
              q.wet = true;
              burst(cxp(SPOT.plots[i][0]), SPOT.plots[i][1] * T + 4, '#9cc8e8', 6, 20);
            }
          }
          engine.playNote(88, 'bell', 0, 0.14);
          engine.playNote(91, 'bell', 0.08, 0.12);
        }
        rerender();
        return;
      }
    }
  };

  const actionButton = () => {
    if (sleepRef.current || portraitRef.current || overlayRef.current) return;
    if (benchRef.current) return hammerRef.current?.();
    if (dialogRef.current) return advance();
    interact();
  };

  // ------------------------------------------------------------ loop
  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const fit = () => {
      const w = Math.round(Math.max(260, Math.min(420, (VH * cv.clientWidth) / Math.max(1, cv.clientHeight))));
      if (cv.width !== w || cv.height !== VH) {
        cv.width = w;
        cv.height = VH;
      }
      ctx.imageSmoothingEnabled = false;
      viewW.current = w;
    };
    fit();
    window.addEventListener('resize', fit);
    // Rotation: refit once the new size is really applied.
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    if (import.meta.env.DEV) (window as unknown as { __carp: typeof g }).__carp = g;
    if (first.current)
      window.setTimeout(
        () =>
          say([
            { who: 'jose', text: 'Bom dia, filho! A vila tem encomendas para a nossa oficina.', mood: 'happy' },
            { who: 'jose', text: 'Corte madeira nas árvores, faça as peças na bancada e entregue para quem pediu. Eu fico aqui ajudando.' },
            { who: 'jesus', text: 'Vamos ao trabalho, pai! Use as setas para andar e o A para agir.', mood: 'happy' },
          ]),
        400,
      );

    const hymn = HYMNS.find((h) => h.id !== 'alvo') ?? HYMNS[0];
    let raf = 0;
    let last = performance.now();
    let clockShown = -1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = g.current;
      const sv = s.sv;
      s.time += dt;
      const busy = !!dialogRef.current || benchRef.current || sleepRef.current || portraitRef.current || overlayRef.current;

      // Soft hymn on a plucked lute.
      const m = s.music;
      const at = engine.now;
      if (!portraitRef.current) {
        if (!m.at || m.at < at - 1) m.at = m.bat = at + 0.1;
        while (m.at < at + 0.15) {
          const [midi, beats] = hymn.notes[m.i++ % hymn.notes.length];
          if (midi) engine.playNote(midi, 'pluck', m.at, 0.13);
          m.at += beats * 0.7;
        }
        while (m.bat < at + 0.15) {
          const [midi, beats] = hymn.bass[m.bi++ % hymn.bass.length];
          if (midi) engine.bass(midi - 12, m.bat, beats * 0.55, 0.14);
          m.bat += beats * 0.7;
        }
      }

      // Time of day.
      if (!busy) {
        sv.clock += (dt * 14) / DAY_SECONDS;
        if (sv.clock >= 20) {
          sv.clock = 20;
          say([{ who: 'maria', text: 'Filho, já escureceu! Hora de descansar.' }], sleep);
        }
      }
      const shownNow = Math.floor(sv.clock * 4);
      if (shownNow !== clockShown) {
        clockShown = shownNow;
        rerender();
      }

      // Walking.
      const moving = !busy && (s.keys.x || s.keys.y);
      if (moving) {
        const len = Math.max(1, Math.hypot(s.keys.x, s.keys.y));
        const vx = (s.keys.x / len) * SPEED * dt;
        const vy = (s.keys.y / len) * SPEED * dt;
        s.dir = Math.abs(s.keys.x) > Math.abs(s.keys.y) ? (s.keys.x > 0 ? 'right' : 'left') : s.keys.y > 0 ? 'down' : 'up';
        const blocked = (x: number, y: number) => [-4, 4].some((ox) => [-4, 0].some((oy) => solidAt(s, x + ox, y + oy)));
        const ox = s.px;
        const oy = s.py;
        if (!blocked(s.px + vx, s.py)) s.px += vx;
        else if (Math.abs(vx) > Math.abs(vy) * 2) {
          // Slide around corners instead of getting stuck on them.
          for (let k = 1; k <= 6; k++) {
            const dy = !blocked(s.px + vx, s.py - k) ? -1 : !blocked(s.px + vx, s.py + k) ? 1 : 0;
            if (dy) {
              if (!blocked(s.px, s.py + dy * Math.abs(vx))) s.py += dy * Math.abs(vx);
              break;
            }
          }
        }
        if (!blocked(s.px, s.py + vy)) s.py += vy;
        else if (Math.abs(vy) > Math.abs(vx) * 2) {
          for (let k = 1; k <= 6; k++) {
            const dx = !blocked(s.px - k, s.py + vy) ? -1 : !blocked(s.px + k, s.py + vy) ? 1 : 0;
            if (dx) {
              if (!blocked(s.px + dx * Math.abs(vy), s.py)) s.px += dx * Math.abs(vy);
              break;
            }
          }
        }
        s.px = Math.max(6, Math.min(MW * T - 6, s.px));
        s.py = Math.max(10, Math.min(MH * T - 2, s.py));
        s.walked += Math.hypot(s.px - ox, s.py - oy);
      }

      // People.
      if (!busy && s.time > s.nextPasser && !s.npcs.some((n) => n.who === 'passer' && !n.gone)) {
        const fromLeft = Math.random() < 0.5;
        const looks = [LOOKS.villager, LOOKS.woman, LOOKS.elder, LOOKS.boy, LOOK.raquel, LOOK.natanael];
        s.npcs.push({
          id: `p${Math.floor(s.time)}`,
          who: 'passer',
          look: pick(looks),
          x: fromLeft ? -10 : MW * T + 10,
          y: feet(18),
          dir: fromLeft ? 'right' : 'left',
          step: 0,
          delay: 0,
          path: [{ x: fromLeft ? MW * T + 20 : -20, y: feet(18) }],
        });
        s.nextPasser = s.time + 18 + Math.random() * 14;
      }
      for (const n of s.npcs) {
        if (n.gone) continue;
        if (n.delay > 0) {
          if (!busy) n.delay -= dt;
          continue;
        }
        const tgt = n.path[0];
        if (tgt) {
          const dx = tgt.x - n.x;
          const dy = tgt.y - n.y;
          const d = Math.hypot(dx, dy);
          const sp = (n.who === 'passer' ? 30 : 46) * dt;
          if (d <= sp) {
            n.x = tgt.x;
            n.y = tgt.y;
            n.path.shift();
            if (!n.path.length) {
              n.step = 0;
              n.dir = 'left';
              if (n.leaving || n.who === 'passer') n.gone = true;
            }
          } else {
            n.x += (dx / d) * sp;
            n.y += (dy / d) * sp;
            n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
            n.step = Math.floor(s.time * 7) % 4;
          }
        }
        if (n.who === 'passer' && !n.waved && Math.hypot(n.x - s.px, n.y - s.py) < 70) {
          n.waved = true;
          n.wave = s.time;
          pop(n.x, n.y - 38, pick(PASSERS), '#ffffff');
        }
      }
      s.npcs = s.npcs.filter((n) => !n.gone);

      s.parts = s.parts.filter((p) => (p.life -= dt) > 0);
      for (const p of s.parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 140 * dt;
      }
      s.pops = s.pops.filter((p) => s.time - p.t < 1.6);

      // Camera and ground.
      const vw = viewW.current;
      const camX = Math.round(Math.max(0, Math.min(MW * T - vw, s.px - vw / 2)));
      const camY = Math.round(Math.max(0, Math.min(MH * T - VH, s.py - 10 - VH / 2)));
      ctx.drawImage(s.mapCanvas, camX, camY, vw, VH, 0, 0, vw, VH);
      drawWater(ctx, s.map, camX, camY, vw, VH, s.time);
      sv.plots.forEach((p, i) => drawPlot(ctx, SPOT.plots[i][0] * T - camX, SPOT.plots[i][1] * T - camY, p, s.time));

      // Depth-sorted scenery and people.
      const list: { y: number; draw: () => void }[] = [];
      const shakeOf = (kind: 'tree' | 'rock', i: number) => (s.hit && s.hit.kind === kind && s.hit.i === i && s.time - s.hit.t < 0.25 ? Math.sin((s.time - s.hit.t) * 60) * 2 : 0);
      SPOT.trees.forEach(([tx, ty], i) =>
        list.push({ y: ty * T + 15, draw: () => (sv.trees[i] ? drawStump(ctx, tx * T - camX, ty * T - camY) : drawTree(ctx, tx * T - camX, ty * T - camY, shakeOf('tree', i))) }),
      );
      SPOT.rocks.forEach(
        ([tx, ty], i) => !sv.rocks[i] && list.push({ y: ty * T + 14, draw: () => drawRock(ctx, tx * T - camX, ty * T - camY, shakeOf('rock', i), s.hp.rocks[i]) }),
      );
      list.push({ y: SPOT.bench[1] * T + 14, draw: () => drawBench(ctx, SPOT.bench[0] * T - camX, SPOT.bench[1] * T - camY) });
      list.push({ y: SPOT.grind[1] * T + 14, draw: () => drawGrind(ctx, SPOT.grind[0] * T - camX, SPOT.grind[1] * T - camY, s.time) });
      list.push({ y: SPOT.woodpile[1] * T + 14, draw: () => drawWoodpile(ctx, SPOT.woodpile[0] * T - camX, SPOT.woodpile[1] * T - camY, sv.wood) });
      for (const n of s.npcs) {
        if (n.gone || n.delay > 0) continue;
        list.push({ y: n.y, draw: () => drawPerson(ctx, n.look, n.x - camX, n.y - camY, n.dir, n.step) });
      }
      list.push({ y: s.py, draw: () => drawPerson(ctx, LOOK.jesus, s.px - camX, s.py - camY, s.dir, moving ? Math.floor(s.walked / 6) % 4 : 0) });
      list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

      // Tool swing.
      if (s.swing && s.time - s.swing.t < 0.3) {
        const k = (s.time - s.swing.t) / 0.3;
        const side = s.dir === 'left' ? -1 : 1;
        ctx.save();
        ctx.translate(Math.round(s.px - camX + side * 8), Math.round(s.py - camY - 12 + (s.dir === 'up' ? -4 : 0)));
        ctx.rotate(side * (-0.9 + k * 1.8));
        if (side < 0) ctx.scale(-1, 1);
        ctx.drawImage(icon(s.swing.tool), -2, -11, 12, 12);
        ctx.restore();
      }
      for (const p of s.parts) {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), 2, 2);
      }
      ctx.globalAlpha = 1;

      // Order bubbles over customers, a gold "!" when the piece is ready.
      for (const n of s.npcs) {
        if (!n.order || n.gone || n.leaving || n.path.length || n.delay > 0) continue;
        const o = orderById(n.order);
        const X = Math.round(n.x - camX);
        const Y = Math.round(n.y - camY - 50 + Math.sin(s.time * 4) * 1.5);
        ctx.fillStyle = '#3a2414';
        ctx.fillRect(X - 9, Y - 1, 18, 17);
        ctx.fillRect(X - 2, Y + 16, 4, 2);
        ctx.fillStyle = have(sv, o) ? '#ffe08a' : '#f4f0e0';
        ctx.fillRect(X - 8, Y, 16, 15);
        ctx.drawImage(icon(o.item === 'lily' ? 'lily' : o.item), X - 6, Y + 1, 12, 12);
        if (have(sv, o)) {
          ctx.fillStyle = '#3a2414';
          ctx.fillRect(X + 7, Y - 5, 5, 9);
          ctx.fillStyle = '#ffd23a';
          ctx.fillRect(X + 8, Y - 4, 3, 5);
          ctx.fillRect(X + 8, Y + 2, 3, 1);
        }
      }
      // José has a challenge today.
      const jose = s.npcs.find((n) => n.id === 'jose');
      if (jose && sv.puzzleDay !== sv.day) {
        const X = Math.round(jose.x - camX);
        const Y = Math.round(jose.y - camY - 48 + Math.sin(s.time * 5) * 2);
        ctx.fillStyle = '#3a2414';
        ctx.fillRect(X - 2, Y - 1, 5, 9);
        ctx.fillRect(X - 2, Y + 9, 5, 4);
        ctx.fillStyle = '#ffd23a';
        ctx.fillRect(X - 1, Y, 3, 7);
        ctx.fillRect(X - 1, Y + 10, 3, 2);
      }
      // Blinking arrow over what Jesus can use right now.
      const tg = busy ? null : findTarget(s);
      if (tg && Math.floor(s.time * 4) % 2 === 0) {
        let tx = 0;
        let ty = 0;
        if (tg.kind === 'npc') [tx, ty] = [tg.n.x, tg.n.y - 38];
        else if (tg.kind === 'bench') [tx, ty] = [SPOT.bench[0] * T + T, SPOT.bench[1] * T - 8];
        else if (tg.kind === 'grind') [tx, ty] = [cxp(SPOT.grind[0]), SPOT.grind[1] * T - 6];
        else if (tg.kind === 'door') [tx, ty] = [cxp(SPOT.houseDoor[0]), SPOT.houseDoor[1] * T - 2];
        else if (tg.kind === 'plot') [tx, ty] = [cxp(SPOT.plots[tg.i][0]), SPOT.plots[tg.i][1] * T - 6];
        else if (tg.kind === 'tree') [tx, ty] = [cxp(SPOT.trees[tg.i][0]), SPOT.trees[tg.i][1] * T - 20];
        else if (tg.kind === 'rock') [tx, ty] = [cxp(SPOT.rocks[tg.i][0]), SPOT.rocks[tg.i][1] * T];
        if (!(tg.kind === 'npc' && tg.n.order)) {
          const X = Math.round(tx - camX);
          const Y = Math.round(ty - camY);
          ctx.fillStyle = '#3a2414';
          ctx.fillRect(X - 4, Y - 6, 9, 3);
          ctx.fillRect(X - 3, Y - 3, 7, 2);
          ctx.fillRect(X - 2, Y - 1, 5, 2);
          ctx.fillRect(X - 1, Y + 1, 3, 1);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(X - 3, Y - 5, 7, 1);
          ctx.fillRect(X - 2, Y - 3, 5, 1);
          ctx.fillRect(X - 1, Y - 1, 3, 1);
        }
      }
      // Waving passers.
      for (const n of s.npcs) {
        if (n.who !== 'passer' || n.gone || !n.wave || s.time - n.wave > 2.5) continue;
        const X = Math.round(n.x - camX + (n.dir === 'left' ? -9 : 5));
        const Y = Math.round(n.y - camY - 36 - Math.abs(Math.sin(s.time * 8)) * 2);
        ctx.drawImage(icon('hand'), X, Y, 9, 9);
      }

      // Light: morning glow and evening dusk.
      const h = sv.clock;
      const dusk = h > 16.5 ? Math.min(0.5, (h - 16.5) * 0.15) : h < 7 ? (7 - h) * 0.25 : 0;
      if (dusk > 0) {
        ctx.fillStyle = h > 12 ? `rgba(60,30,90,${dusk})` : `rgba(255,170,90,${dusk})`;
        ctx.fillRect(0, 0, vw, VH);
        if (h > 17) {
          ctx.fillStyle = `rgba(255,140,60,${Math.max(0, 0.18 - (h - 17) * 0.06)})`;
          ctx.fillRect(0, 0, vw, VH);
        }
      }

      // Floating texts.
      ctx.font = '8px "Pixelify Sans", monospace';
      ctx.textAlign = 'center';
      for (const p of s.pops) {
        const k = (s.time - p.t) / 1.6;
        const X = Math.round(p.x - camX);
        const Y = Math.round(p.y - camY - k * 12);
        ctx.globalAlpha = 1 - k * k;
        ctx.fillStyle = '#3a2414';
        for (const [ox, oy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ])
          ctx.fillText(p.text, X + ox, Y + oy);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, X, Y);
      }
      ctx.globalAlpha = 1;

      const ic = targetIcon(s, tg);
      if (ic !== actRef.current) {
        actRef.current = ic;
        setAct(ic);
      }
    };
    raf = requestAnimationFrame(loop);

    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      const s = g.current;
      const axis: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (axis[k]) {
        e.preventDefault();
        const [x, y] = axis[k];
        if (x) s.keys.x = down ? x : s.keys.x === x ? 0 : s.keys.x;
        if (y) s.keys.y = down ? y : s.keys.y === y ? 0 : s.keys.y;
      } else if (down && !e.repeat && (k === ' ' || k === 'enter' || k === 'e' || k === 'z')) {
        e.preventDefault();
        actionButton();
      } else if (down && k === 'escape') {
        if (benchRef.current) setBench(false);
        else if (overlayRef.current) {
          setGrind(false);
          setPuzzle(null);
        } else exit();
      }
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exit = () => {
    persist();
    onExit();
  };

  const s = g.current;
  const sv = s.sv;
  const line = dialog ? dialog.lines[dialog.i] : null;
  const hh = Math.floor(sv.clock);
  const mm = Math.floor((sv.clock - hh) * 4) * 15;
  const slots: { id: IconId; n: number; label: string }[] = [
    { id: 'wood', n: sv.wood, label: 'Madeira' },
    { id: 'stone', n: sv.stone, label: 'Pedra' },
    { id: 'seed', n: sv.seed, label: 'Sementes' },
    { id: 'lily', n: sv.lily, label: 'Lírios' },
    ...RECIPES.filter((r) => sv.items[r.id]?.length).map((r) => ({ id: r.id as IconId, n: sv.items[r.id]!.length, label: r.name })),
  ];

  return createPortal(
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-black font-pixel text-white" role="dialog" aria-modal="true" aria-label="O Carpinteiro">
      <canvas ref={canvas} className="pixelated absolute inset-0 h-full w-full" aria-label="Oficina de Nazaré" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <div className="flex items-start gap-2">
          <button onClick={exit} aria-label="Sair" className="rpg-wood rpg-text pointer-events-auto grid h-10 w-10 place-items-center">
            <X size={18} />
          </button>
          <div className="rpg-frame rpg-text flex items-center gap-3 px-2 py-1 text-base">
            <span className="flex items-center gap-1">
              <img src={iconURL(sv.clock >= 18 ? 'moon' : 'sun')} alt="" className="pixelated h-5 w-5" />
              Dia {sv.day} · {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
            </span>
            <span className="flex items-center gap-1" aria-label="Moedas">
              <img src={iconURL('coin')} alt="" className="pixelated h-5 w-5" /> {sv.coins}
            </span>
            <span className="flex items-center gap-1" aria-label="Amizade">
              <img src={iconURL('heart')} alt="" className="pixelated h-5 w-5" /> {sv.hearts}
            </span>
            {(['axe', 'pick'] as Tool[]).map((tl) => (
              <span key={tl} className="flex items-center gap-0.5" aria-label={`${tl === 'axe' ? 'Machado' : 'Picareta'} ${Math.round(sv.sharp[tl])}%`}>
                <img src={iconURL(tl)} alt="" className="pixelated h-5 w-5" />
                <span className="h-2 w-8 border border-[#3a2414] bg-[#4a4250]">
                  <span
                    className={cx('block h-full', sv.sharp[tl] > 60 ? 'bg-[#6aaa3a]' : sv.sharp[tl] > 30 ? 'bg-[#e0a020]' : 'animate-pulse bg-[#d8402a]')}
                    style={{ width: `${sv.sharp[tl]}%` }}
                  />
                </span>
              </span>
            ))}
          </div>
        </div>
        <div className="rpg-frame rpg-text w-[min(40%,15rem)] px-2 py-1 text-sm leading-tight">
          <p className="text-[#ffe08a]">Encomendas</p>
          {sv.orders.length ? (
            sv.orders.map((id) => {
              const o = orderById(id);
              const ok = have(sv, o);
              return (
                <p key={id} className="flex items-center gap-1 truncate">
                  <img src={iconURL(o.item === 'lily' ? 'lily' : o.item)} alt="" className="pixelated h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {o.qty > 1 ? `${o.qty} ` : ''}
                    {ITEM_NAME[o.item]} · {NAMES[o.who].split(',')[0]}
                  </span>
                  {ok && <Check size={14} className="ml-auto shrink-0 text-[#b8f07a]" />}
                </p>
              );
            })
          ) : (
            <p className="opacity-80">Nenhuma hoje. Volte amanhã!</p>
          )}
        </div>
      </div>

      {/* Controls + hotbar */}
      {!dialog && !bench && !grind && !puzzle && (
        <>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (g.current.keys = { x, y })} />
          <AButton className={cx('absolute bottom-6 right-[max(1.25rem,env(safe-area-inset-right))]', act && 'animate-blink')} onPress={actionButton} hot={!!act}>
            {act ? <img src={iconURL(act)} alt="" className="pixelated h-9 w-9" /> : 'A'}
          </AButton>
        </>
      )}
      {!bench && !grind && !puzzle && (
        <div className="pointer-events-none absolute bottom-2 left-1/2 flex max-w-[calc(100%-19rem)] -translate-x-1/2 gap-1 overflow-hidden" aria-label="Inventário">
          {slots.map((sl) => (
            <span key={sl.id} title={sl.label} className={cx('rpg-wood relative grid h-11 w-11 shrink-0 place-items-center', dialog && 'hidden')}>
              <img src={iconURL(sl.id)} alt={sl.label} className="pixelated h-7 w-7" />
              <span className="rpg-text absolute bottom-0 right-0.5 text-sm">{sl.n}</span>
            </span>
          ))}
        </div>
      )}

      {/* Dialog */}
      {line && (
        <div className="absolute inset-x-0 bottom-0 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]" onClick={advance}>
          <div className="mx-auto max-w-3xl">
            <Dialog
              look={line.who === 'narrator' ? LOOK.jesus : LOOK[line.who]}
              img={
                line.who === 'jesus'
                  ? heroFace('jesus')
                  : line.who === 'maria'
                    ? heroFace('maria')
                    : line.who === 'eli' || line.who === 'simeao'
                      ? heroFace('anciao')
                      : line.who === 'tiago' || line.who === 'zebedeu'
                        ? heroFace('judeu')
                        : line.who === 'natanael'
                          ? heroFace('jovem')
                          : undefined
              }
              mood={line.mood}
              bg={BG[line.who]}
              name={NAMES[line.who] || undefined}
              size="lg"
            >
              <Typed key={`${dialog!.i}${line.text}`} text={line.text} ctl={typing} />
              {dialog?.choices && dialog.i === dialog.lines.length - 1 ? (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {dialog.choices.map((c) => (
                    <button
                      key={c.label}
                      onClick={(e) => {
                        e.stopPropagation();
                        c.fn();
                      }}
                      className="rpg-wood rpg-text px-3 py-1.5 text-[0.9em] active:translate-y-0.5"
                    >
                      ▸ {c.label}
                    </button>
                  ))}
                </span>
              ) : (
                <span className="absolute bottom-1 right-2 animate-bounce text-[0.8em] text-[#ffe08a]">▼</span>
              )}
            </Dialog>
          </div>
        </div>
      )}

      {line && !dialog?.choices && (
        <button onClick={skip} className="rpg-wood rpg-text absolute right-[max(0.5rem,env(safe-area-inset-right))] top-[5.5rem] px-3 py-1 text-sm" aria-label="Pular conversa">
          Pular ⏩
        </button>
      )}

      {bench && (
        <Workbench
          sv={sv}
          hammerRef={hammerRef}
          onChange={() => {
            persist();
            rerender();
          }}
          onClose={() => setBench(false)}
        />
      )}

      {grind && (
        <Sharpen
          sharp={sv.sharp}
          onSharpen={(tl, v) => {
            sv.sharp[tl] = v;
            dullWarned.current[tl] = false;
            rerender();
          }}
          onClose={() => {
            setGrind(false);
            persist();
          }}
        />
      )}

      {puzzle && (
        <JosePuzzle
          kind={puzzle.kind}
          level={puzzle.level}
          onClose={() => setPuzzle(null)}
          onWin={() => {
            const coins = 4 + puzzle.level * 2;
            sv.puzzleDay = sv.day;
            sv.puzzles += 1;
            sv.coins += coins;
            sv.wood += 2;
            sv.hearts += 1;
            persist();
            setPuzzle(null);
            say([{ who: 'jose', text: `Tome: ${coins} moedas e 2 tábuas de sobra. Amanhã tem outro desafio!`, mood: 'happy' }]);
          }}
        />
      )}

      {sleeping !== null && (
        <div className="animate-pop absolute inset-0 grid place-items-center bg-[#140c24]">
          <div className="rpg-text text-center text-3xl">
            <img src={iconURL('moon')} alt="" className="pixelated mx-auto mb-3 h-16 w-16" />
            Zzz... Dia {sleeping}
          </div>
        </div>
      )}

      <RotateHint onExit={exit} />
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- workbench

function Workbench({ sv, hammerRef, onChange, onClose }: { sv: CarpSave; hammerRef: React.MutableRefObject<(() => void) | null>; onChange: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<'make' | 'shop'>('make');
  const [job, setJob] = useState<{ id: ItemId; nail: number; hits: boolean[]; zone: number; t0: number; done?: number } | null>(null);
  const [, setFrame] = useState(0);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const jobRef = useRef(job);
  jobRef.current = job;

  useEffect(() => {
    if (!job || job.done) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      setFrame((f) => f + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [job]);

  const diff = useStore((s) => s.storyDiff);
  const HALF = [0.11, 0.085, 0.06][diff];
  const speedOf = (nail: number) => [0.65, 0.8, 1][diff] + nail * 0.3;
  const posOf = (j: NonNullable<typeof job>, now = performance.now()) => {
    const p = (((now - j.t0) / 1000) * speedOf(j.nail)) % 2;
    return p < 1 ? p : 2 - p;
  };

  const hit = () => {
    const j = jobRef.current;
    if (!j || j.done) return;
    const ok = Math.abs(posOf(j) - j.zone) < HALF;
    const hits = [...j.hits, ok];
    if (ok) {
      engine.drum('snare', 0, 0.9);
      engine.playNote(84 + hits.length * 2, 'bell', 0.02, 0.15);
    } else engine.sfx('bonk');
    setNote({ text: (ok ? HAMMER_GOOD : HAMMER_BAD)[Math.floor(Math.random() * 3)], ok });
    if (hits.length >= 3) {
      const stars = Math.max(1, hits.filter(Boolean).length);
      (sv.items[j.id] ??= []).push(stars);
      onChange();
      engine.sfx('yay');
      setJob({ ...j, hits, done: stars });
      window.setTimeout(() => {
        setJob(null);
        setNote(null);
      }, 1700);
    } else setJob({ ...j, hits, nail: j.nail + 1, zone: 0.2 + Math.random() * 0.6, t0: performance.now() - Math.random() * 400 });
  };
  hammerRef.current = job ? hit : null;
  useEffect(() => () => void (hammerRef.current = null), [hammerRef]);

  const start = (id: ItemId) => {
    const r = RECIPES.find((x) => x.id === id)!;
    if (sv.wood < r.wood || sv.stone < r.stone) return;
    sv.wood -= r.wood;
    sv.stone -= r.stone;
    onChange();
    engine.playNote(76, 'pluck', 0, 0.2);
    setNote(null);
    setJob({ id, nail: 0, hits: [], zone: 0.2 + Math.random() * 0.6, t0: performance.now() });
  };

  const buy = (u: (typeof UPGRADES)[number]) => {
    if (sv.coins < u.cost || (!u.repeat && sv.ups.includes(u.id))) return;
    sv.coins -= u.cost;
    if (u.id === 'seeds') sv.seed += 3;
    else sv.ups.push(u.id);
    engine.sfx('coin');
    onChange();
  };

  const wanted = new Set(sv.orders.map((id) => ORDERS.find((o) => o.id === id)!.item));

  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
      <div className="rpg-frame rpg-text flex max-h-full w-full max-w-3xl flex-col overflow-hidden p-2">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-xl text-[#ffe08a]">Bancada</p>
          {!job && (
            <>
              <button onClick={() => setTab('make')} className={cx('rpg-wood px-3 py-1 text-base', tab === 'make' && 'outline outline-2 outline-[#ffe08a]')}>
                Fazer
              </button>
              <button onClick={() => setTab('shop')} className={cx('rpg-wood px-3 py-1 text-base', tab === 'shop' && 'outline outline-2 outline-[#ffe08a]')}>
                Melhorias
              </button>
            </>
          )}
          <span className="ml-auto flex items-center gap-2 text-base">
            <img src={iconURL('wood')} alt="Madeira" className="pixelated h-5 w-5" /> {sv.wood}
            <img src={iconURL('stone')} alt="Pedra" className="pixelated h-5 w-5" /> {sv.stone}
            <img src={iconURL('coin')} alt="Moedas" className="pixelated h-5 w-5" /> {sv.coins}
          </span>
          {!job && (
            <button onClick={onClose} aria-label="Fechar bancada" className="rpg-wood grid h-9 w-9 place-items-center">
              <X size={16} />
            </button>
          )}
        </div>

        {job ? (
          <div className="flex flex-1 items-center gap-4 px-2 pb-2">
            <img src={iconURL(job.id)} alt="" className={cx('pixelated h-24 w-24 shrink-0', job.hits.length && !job.done && 'animate-pop')} key={job.hits.length} />
            <div className="min-w-0 flex-1">
              {job.done ? (
                <p className="text-2xl">
                  {RECIPES.find((r) => r.id === job.id)!.name} pronta! <span className="text-[#ffd23a]">{'★'.repeat(job.done)}</span>
                  <span className="opacity-40">{'★'.repeat(3 - job.done)}</span>
                </p>
              ) : (
                <>
                  <p className="text-lg">
                    {RECIPES.find((r) => r.id === job.id)!.name}: prego {job.nail + 1} de 3
                    {note && <span className={cx('ml-2', note.ok ? 'text-[#b8f07a]' : 'text-[#ffb08a]')}>{note.text}</span>}
                  </p>
                  <div className="relative mt-2 h-8 border-[3px] border-[#3a2414] bg-[#c08a4a]">
                    <div className="absolute inset-y-0 bg-[#6aaa3a]" style={{ left: `${(job.zone - HALF) * 100}%`, width: `${HALF * 200}%` }} />
                    <div className="absolute inset-y-0 left-[var(--z)] w-[2px] bg-[#ffe08a]" style={{ ['--z' as string]: `${job.zone * 100}%` }} />
                    <div className="absolute -top-2 bottom-[-0.5rem] w-1.5 -translate-x-1/2 border border-[#3a2414] bg-white" style={{ left: `${posOf(job) * 100}%` }} />
                  </div>
                  <button
                    onPointerDown={(e) => (e.preventDefault(), hit())}
                    className="rpg-wood mt-3 flex h-14 w-full items-center justify-center gap-2 text-2xl active:translate-y-0.5"
                  >
                    <img src={iconURL('hammer')} alt="" className="pixelated h-8 w-8" /> Martelar!
                  </button>
                </>
              )}
            </div>
          </div>
        ) : tab === 'make' ? (
          <div className="grid grid-cols-3 gap-1.5 overflow-y-auto sm:grid-cols-5">
            {RECIPES.map((r) => {
              const can = sv.wood >= r.wood && sv.stone >= r.stone;
              const n = sv.items[r.id]?.length ?? 0;
              return (
                <button
                  key={r.id}
                  onClick={() => start(r.id)}
                  disabled={!can}
                  className={cx('rpg-wood relative flex flex-col items-center px-1 py-1.5 text-sm leading-tight', !can && 'opacity-50')}
                >
                  {wanted.has(r.id) && <span className="absolute left-1 top-0.5 text-[#ffe08a]">!</span>}
                  {n > 0 && <span className="absolute right-1 top-0.5">×{n}</span>}
                  <img src={iconURL(r.id)} alt="" className="pixelated h-9 w-9" />
                  <span>{r.name}</span>
                  <span className="flex items-center gap-0.5 text-xs">
                    <img src={iconURL('wood')} alt="madeira" className="pixelated h-3.5 w-3.5" />
                    {r.wood}
                    {r.stone > 0 && (
                      <>
                        <img src={iconURL('stone')} alt="pedra" className="pixelated ml-1 h-3.5 w-3.5" />
                        {r.stone}
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-1.5 overflow-y-auto sm:grid-cols-2">
            {UPGRADES.map((u) => {
              const owned = !u.repeat && sv.ups.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => buy(u)}
                  disabled={owned || sv.coins < u.cost}
                  className={cx('rpg-wood flex items-center gap-2 px-2 py-1.5 text-left', !owned && sv.coins < u.cost && 'opacity-50')}
                >
                  <img src={iconURL(u.icon)} alt="" className="pixelated h-9 w-9 shrink-0" />
                  <span className="min-w-0 flex-1 leading-tight">
                    {u.name}
                    <span className="block text-sm opacity-80">{u.desc}</span>
                  </span>
                  {owned ? (
                    <Check size={18} className="text-[#b8f07a]" />
                  ) : (
                    <span className="flex items-center gap-1">
                      <img src={iconURL('coin')} alt="moedas" className="pixelated h-4 w-4" />
                      {u.cost}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
