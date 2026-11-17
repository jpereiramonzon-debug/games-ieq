import type { Palette } from './sprites';

export const W = 256;
export const H = 144;
export const GROUND = 118;

export type Kind =
  | 'rock'
  | 'thorn'
  | 'jar'
  | 'snake'
  | 'bird'
  | 'goat'
  | 'wave'
  | 'fish'
  | 'trunk'
  | 'hull'
  | 'pit'
  | 'ledge'
  | 'box'
  | 'bread'
  | 'fishItem'
  | 'dove'
  | 'halo'
  | 'staff'
  | 'goal';

export type Item = 'bread' | 'dove' | 'halo' | 'staff';

export interface Ent {
  kind: Kind;
  x: number;
  y: number; // top edge
  w: number;
  h: number;
  vx?: number; // own speed (negative = toward the player)
  item?: Item; // what a box gives
  used?: boolean;
  dead?: number; // time it was defeated
  taken?: boolean;
  phase?: number;
}

export interface World {
  id: string;
  number: number;
  palette: Palette;
  night?: boolean;
  speed: number; // px/s at the start
  length: number; // px; 0 = endless
  hymn: string;
  /** Weights of each pattern the generator may place. */
  mix: Partial<Record<Pattern, number>>;
}

type Pattern = 'rock' | 'thorns' | 'jar' | 'snake' | 'bird' | 'goat' | 'pit' | 'ledge' | 'box' | 'wave' | 'boat' | 'fish' | 'tree' | 'breads';

export const WORLDS: World[] = [
  {
    id: 'desert',
    number: 1,
    palette: { paper: '#f6f1e4', ink: '#4a4238', mid: '#c4b9a2' },
    speed: 120,
    length: 4200,
    hymn: 'castelo',
    mix: { rock: 3, thorns: 3, snake: 2, bird: 1, pit: 2, box: 2, breads: 3, ledge: 1 },
  },
  {
    id: 'sea',
    number: 2,
    palette: { paper: '#eef3f3', ink: '#2f3f49', mid: '#a6b8be' },
    speed: 128,
    length: 4600,
    hymn: 'perto',
    mix: { wave: 3, fish: 3, boat: 2, bird: 2, box: 2, breads: 3 },
  },
  {
    id: 'olives',
    number: 3,
    palette: { paper: '#f0f3e6', ink: '#3b4632', mid: '#aab597' },
    speed: 138,
    length: 5000,
    hymn: 'alvo',
    mix: { tree: 3, goat: 3, rock: 1, pit: 2, ledge: 2, box: 2, breads: 3, bird: 1 },
  },
  {
    id: 'jerusalem',
    number: 4,
    palette: { paper: '#25272e', ink: '#ebe7dc', mid: '#6c6f78' },
    night: true,
    speed: 150,
    length: 5600,
    hymn: 'cruz',
    mix: { jar: 3, pit: 3, bird: 2, goat: 2, ledge: 2, box: 2, breads: 3, thorns: 1 },
  },
  {
    id: 'endless',
    number: 5,
    palette: { paper: '#f4f2ec', ink: '#3f3f3f', mid: '#b5b2aa' },
    speed: 125,
    length: 0,
    hymn: 'castelo',
    mix: { rock: 3, thorns: 3, jar: 1, snake: 2, bird: 2, goat: 2, pit: 2, ledge: 1, box: 2, breads: 3, wave: 1, tree: 1 },
  },
];

/** Small seeded random generator, so each stage has the same layout every try. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickWeighted = <T extends string>(mix: Partial<Record<T, number>>, r: number): T => {
  const entries = Object.entries(mix) as [T, number][];
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let x = r * total;
  for (const [k, w] of entries) if ((x -= w) < 0) return k;
  return entries[entries.length - 1][0];
};

const breadRow = (out: Ent[], x: number, y: number, n: number, arc = false) => {
  for (let i = 0; i < n; i++) {
    const lift = arc ? Math.round(Math.sin((i / Math.max(1, n - 1)) * Math.PI) * 14) : 0;
    out.push({ kind: 'bread', x: x + i * 14, y: y - lift, w: 9, h: 5 });
  }
};

/**
 * Lays out obstacles from `from` to `to` (world x). `level` 0..1 raises density.
 * Returns the x where it stopped, so endless mode can keep extending.
 */
export function generate(world: World, from: number, to: number, random: () => number, level: number): { ents: Ent[]; end: number } {
  const out: Ent[] = [];
  let x = from;
  let boxes = 0;
  while (x < to) {
    const p = pickWeighted(world.mix, random());
    const r = random();
    const gap = 110 + random() * 120 * (1.15 - level * 0.6);
    switch (p) {
      case 'rock':
        out.push({ kind: 'rock', x, y: GROUND - 7, w: 12, h: 7 });
        if (r < 0.4) breadRow(out, x - 6, GROUND - 40, 3, true);
        x += 12;
        break;
      case 'thorns': {
        const n = r < 0.5 || level < 0.3 ? 1 : 2;
        for (let i = 0; i < n; i++) out.push({ kind: 'thorn', x: x + i * 11, y: GROUND - 12, w: 10, h: 12 });
        x += n * 11;
        break;
      }
      case 'jar':
        out.push({ kind: 'jar', x, y: GROUND - 9, w: 8, h: 9 });
        if (r < 0.5) out.push({ kind: 'jar', x: x + 10, y: GROUND - 9, w: 8, h: 9 });
        x += 20;
        break;
      case 'snake':
        out.push({ kind: 'snake', x, y: GROUND - 4, w: 16, h: 4, vx: -22 });
        x += 18;
        break;
      case 'goat':
        out.push({ kind: 'goat', x: x + 40, y: GROUND - 8, w: 14, h: 8, vx: -45 });
        x += 30;
        break;
      case 'bird': {
        // Low birds must be ducked, high ones run under or jump over.
        const low = r < 0.6;
        out.push({ kind: 'bird', x: x + 30, y: low ? GROUND - 21 : GROUND - 40, w: 14, h: 7, vx: -30, phase: random() * 6 });
        x += 30;
        break;
      }
      case 'pit': {
        const w = Math.round(30 + random() * (14 + level * 12));
        out.push({ kind: 'pit', x, y: GROUND, w, h: H - GROUND });
        breadRow(out, x + w / 2 - 14, GROUND - 34, 3, true);
        x += w;
        break;
      }
      case 'ledge': {
        const w = 40 + Math.round(random() * 30);
        const y = GROUND - (r < 0.5 ? 30 : 42);
        out.push({ kind: 'ledge', x, y, w, h: 4 });
        breadRow(out, x + 6, y - 10, Math.floor(w / 14));
        if (random() < 0.5) out.push({ kind: 'thorn', x: x + w / 2 - 5, y: GROUND - 12, w: 10, h: 12 });
        x += w;
        break;
      }
      case 'box': {
        boxes++;
        const item: Item = boxes % 3 === 0 ? (['dove', 'halo', 'staff'] as Item[])[Math.floor(random() * 3)] : 'bread';
        out.push({ kind: 'box', x, y: GROUND - 50, w: 14, h: 13, item });
        if (r < 0.5) out.push({ kind: 'box', x: x + 14, y: GROUND - 50, w: 14, h: 13, item: 'bread' });
        x += 30;
        break;
      }
      case 'breads':
        breadRow(out, x, GROUND - (r < 0.5 ? 10 : 30), 4 + Math.floor(random() * 3));
        x += 70;
        break;
      case 'wave':
        out.push({ kind: 'wave', x: x + 50, y: GROUND - 12, w: 14, h: 12, vx: -35 });
        x += 30;
        break;
      case 'fish':
        out.push({ kind: 'fish', x, y: GROUND, w: 10, h: 6, phase: random() * 2 });
        x += 14;
        break;
      case 'boat':
        // Hull to jump onto (crashing into its side hurts), with bread on deck.
        out.push({ kind: 'hull', x, y: GROUND - 12, w: 46, h: 12 });
        breadRow(out, x + 6, GROUND - 22, 3);
        x += 46;
        break;
      case 'tree':
        // Olive tree: trunk to jump, canopy to land on.
        out.push({ kind: 'trunk', x: x + 14, y: GROUND - 24, w: 8, h: 24 });
        out.push({ kind: 'ledge', x, y: GROUND - 34, w: 36, h: 4 });
        breadRow(out, x + 4, GROUND - 44, 2);
        x += 36;
        break;
    }
    x += gap;
  }
  return { ents: out, end: x };
}
