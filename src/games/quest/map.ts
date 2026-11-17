/**
 * Top-down world for "Missões de Jesus": a small Galilee with the lake, the
 * village, the mount, the temple court and the desert. Tiles are 16 px and are
 * painted once into a big offscreen canvas.
 */
import { shade } from '../pixel/person';

export const T = 16;
export const MW = 50;
export const MH = 34;

/**
 * . sand   : desert   , path   ~ water   = shore   " grass   T olive tree   r rock
 * R roof   H house wall   S stone floor   W temple wall   C column   w well   p palm   b bush
 */
export type Tile = '.' | ':' | ',' | '~' | '=' | '"' | 'T' | 'r' | 'R' | 'H' | 'S' | 'W' | 'C' | 'w' | 'p' | 'b';

const SOLID = new Set<Tile>(['~', 'T', 'r', 'R', 'H', 'W', 'C', 'w', 'p', 'b']);

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const HOUSES = [
  [13, 2, 5, 4],
  [20, 2, 4, 4],
  [26, 3, 4, 4],
  [13, 11, 4, 4],
  [24, 11, 4, 3],
] as const;

/** Points of interest, in tiles. */
export const SPOTS = {
  start: [20, 7],
  peter: [9, 9],
  boat: [5, 9],
  well: [20, 9],
  blind: [21, 10],
  leper: [16, 18],
  boy: [27, 9],
  rock: [40, 4],
  gate: [39, 19],
  tempter: [7, 28],
  groups: [
    [33, 3],
    [35, 9],
    [44, 8],
    [46, 3],
    [37, 12],
  ],
  tables: [
    [33, 24],
    [33, 29],
    [45, 24],
    [45, 29],
  ],
} as const;

export function buildMap(): Tile[][] {
  const r = rng(77);
  const m: Tile[][] = Array.from({ length: MH }, () => Array<Tile>(MW).fill('.'));
  const set = (x: number, y: number, t: Tile) => {
    if (x >= 0 && y >= 0 && x < MW && y < MH) m[y][x] = t;
  };
  // Desert in the south-west.
  for (let y = 21; y < MH; y++) for (let x = 0; x < 27; x++) if (y > 21 + Math.sin(x / 3) * 1.2) set(x, y, ':');
  // The lake on the west, with a shore line.
  for (let y = 0; y < 21; y++) {
    const edge = 7 + Math.round(Math.sin(y / 3) * 1.5);
    for (let x = 0; x <= edge; x++) set(x, y, '~');
    set(edge + 1, y, '=');
  }
  // Grassy mount in the north-east with olive trees.
  for (let y = 0; y < 15; y++) for (let x = 30; x < MW; x++) if (y < 13 + Math.sin(x / 2) || x > 31) set(x, y, '"');
  // Temple court in the south-east.
  for (let y = 19; y < MH; y++)
    for (let x = 30; x < MW; x++) {
      const edge = y === 19 || y === MH - 1 || x === 30 || x === MW - 1;
      set(x, y, edge ? 'W' : 'S');
    }
  for (const x of [38, 39, 40]) set(x, 19, 'S'); // gate
  for (let x = 32; x < MW - 1; x += 4) {
    set(x, 21, 'C');
    set(x, MH - 3, 'C');
  }
  for (let y = 23; y < MH - 3; y += 4) {
    set(31 + 1, y, 'C');
    set(MW - 3, y, 'C');
  }
  // Village houses: flat roofs with a front wall.
  for (const [hx, hy, w, h] of HOUSES) {
    for (let y = hy; y < hy + h; y++) for (let x = hx; x < hx + w; x++) set(x, y, y === hy + h - 1 ? 'H' : 'R');
  }
  set(SPOTS.well[0], SPOTS.well[1] - 1, 'w');
  // Paths.
  const path = (x0: number, y0: number, x1: number, y1: number) => {
    let x = x0;
    let y = y0;
    while (x !== x1 || y !== y1) {
      if (m[y][x] === '.' || m[y][x] === ':' || m[y][x] === '"' || m[y][x] === '=') m[y][x] = ',';
      if (x !== x1 && (y === y1 || r() < 0.6)) x += Math.sign(x1 - x);
      else y += Math.sign(y1 - y);
    }
  };
  path(9, 9, 30, 9);
  path(20, 9, 20, 16);
  path(30, 9, 39, 6);
  path(39, 6, 39, 19);
  path(18, 16, 10, 27);
  path(20, 16, 30, 17);
  path(30, 17, 39, 18);
  // Scenery, kept off paths and away from people.
  const busy = (x: number, y: number) =>
    Math.abs(x - SPOTS.rock[0]) < 3 && Math.abs(y - SPOTS.rock[1]) < 3 ||
    SPOTS.groups.some(([gx, gy]) => Math.abs(x - gx) < 2 && Math.abs(y - gy) < 2);
  for (let i = 0; i < 26; i++) {
    const x = 31 + Math.floor(r() * 18);
    const y = Math.floor(r() * 13);
    if (m[y][x] === '"' && !busy(x, y)) set(x, y, 'T');
  }
  set(SPOTS.rock[0], SPOTS.rock[1], 'r');
  for (let i = 0; i < 16; i++) {
    const x = 1 + Math.floor(r() * 24);
    const y = 23 + Math.floor(r() * 10);
    if (m[y][x] === ':' && Math.abs(x - SPOTS.tempter[0]) + Math.abs(y - SPOTS.tempter[1]) > 3) set(x, y, r() < 0.5 ? 'r' : 'b');
  }
  for (const [x, y] of [
    [10, 3],
    [11, 14],
    [10, 17],
    [12, 6],
    [18, 15],
    [29, 13],
    [22, 15],
  ])
    if (m[y][x] === '.') set(x, y, 'p');
  return m;
}

export const isSolid = (m: Tile[][], tx: number, ty: number) => tx < 0 || ty < 0 || ty >= m.length || tx >= m[0].length || SOLID.has(m[ty][tx]);

/** Ground under scenery tiles, so a tree on grass sits on grass. */
function baseOf(m: Tile[][], x: number, y: number): Tile {
  const t = m[y][x];
  if (t === 'T') return '"';
  if (t === 'C') return 'S';
  if (t === 'r' || t === 'b') return y > 20 && m.length === MH ? ':' : '"';
  if (t === 'p' || t === 'w') return '.';
  return t;
}

const COL = {
  sand: '#e6cb8e',
  sandD: '#d0b276',
  sandL: '#f2dca6',
  desert: '#dcb472',
  desertD: '#c49a5a',
  path: '#d2ae78',
  pathD: '#b8925e',
  water: '#3c7cb2',
  waterL: '#5e9ccc',
  shore: '#c9aa72',
  grass: '#8aac58',
  grassD: '#6a8e3a',
  grassL: '#a8c870',
  roof: '#e8d4a4',
  roofL: '#f4e4bc',
  roofD: '#c8ae7c',
  wall: '#c6a270',
  wallD: '#9e7c4e',
  stone: '#d8ccb2',
  stoneD: '#b6a88e',
  twall: '#c2ae86',
  twallD: '#8e7a56',
  ink: '#3a2414',
};

export function paintMap(m: Tile[][]): HTMLCanvasElement {
  const MH = m.length;
  const MW = m[0].length;
  const c = document.createElement('canvas');
  c.width = MW * T;
  c.height = MH * T;
  const ctx = c.getContext('2d')!;
  const px = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
  };
  const r = rng(5);
  for (let ty = 0; ty < MH; ty++) {
    for (let tx = 0; tx < MW; tx++) {
      const X = tx * T;
      const Y = ty * T;
      const t = m[ty][tx];
      const base = baseOf(m, tx, ty);
      // Ground.
      const speck = (n: number, a: string, b: string) => {
        for (let i = 0; i < n; i++) px(X + Math.floor(r() * 16), Y + Math.floor(r() * 16), 1 + (r() < 0.3 ? 1 : 0), 1, r() < 0.5 ? a : b);
      };
      if (base === '.') {
        px(X, Y, T, T, COL.sand);
        speck(6, COL.sandD, COL.sandL);
      } else if (base === ':') {
        px(X, Y, T, T, COL.desert);
        speck(5, COL.desertD, COL.sandL);
        if ((tx + ty) % 3 === 0) px(X + 2, Y + 9, 10, 1, COL.desertD);
      } else if (base === ',') {
        px(X, Y, T, T, COL.path);
        speck(7, COL.pathD, COL.sandL);
      } else if (base === '~') {
        px(X, Y, T, T, COL.water);
        if ((tx * 7 + ty * 3) % 4 === 0) px(X + 3, Y + 6, 5, 1, COL.waterL);
      } else if (base === '=') {
        px(X, Y, T, T, COL.shore);
        px(X, Y, 2, T, '#e8f2f4');
        speck(4, COL.sandD, COL.sandL);
      } else if (base === '"') {
        px(X, Y, T, T, COL.grass);
        for (let i = 0; i < 6; i++) {
          const gx = X + Math.floor(r() * 15);
          const gy = Y + Math.floor(r() * 14);
          px(gx, gy, 1, 2, COL.grassD);
          px(gx + 1, gy, 1, 1, COL.grassL);
        }
      } else if (base === 'S') {
        px(X, Y, T, T, COL.stone);
        px(X, Y + 7, T, 1, COL.stoneD);
        px(X + ((ty % 2) * 8), Y, 1, 7, COL.stoneD);
        px(X + (((ty + 1) % 2) * 8), Y + 8, 1, 8, COL.stoneD);
      }
      // Structures and scenery.
      switch (t) {
        case 'R': {
          px(X, Y, T, T, COL.roof);
          const up = ty > 0 && m[ty - 1][tx] === 'R';
          const left = tx > 0 && m[ty][tx - 1] === 'R';
          const right = tx < MW - 1 && m[ty][tx + 1] === 'R';
          if (!up) {
            px(X, Y, T, 2, COL.roofL);
            px(X, Y, T, 1, COL.ink);
          }
          if (!left) px(X, Y, 2, T, COL.roofL);
          if (!left) px(X, Y, 1, T, COL.ink);
          if (!right) {
            px(X + 13, Y, 3, T, COL.roofD);
            px(X + 15, Y, 1, T, COL.ink);
          }
          if ((tx + ty) % 3 === 1) {
            px(X + 5, Y + 6, 6, 3, COL.ink);
            px(X + 5, Y + 6, 6, 1, '#5a4030');
          }
          break;
        }
        case 'H': {
          px(X, Y, T, T, COL.wall);
          px(X, Y, T, 2, COL.wallD);
          px(X, Y + 14, T, 2, COL.wallD);
          px(X, Y + 15, T, 1, COL.ink);
          if (tx % 2 === 0) {
            px(X + 4, Y + 5, 8, 11, '#4a3020');
            px(X + 5, Y + 6, 6, 10, '#2e1c10');
          }
          break;
        }
        case 'W':
          px(X, Y, T, T, COL.twall);
          px(X, Y + 7, T, 1, COL.twallD);
          px(X, Y + 15, T, 1, COL.twallD);
          px(X + (ty % 2 ? 4 : 11), Y, 1, 7, COL.twallD);
          px(X + (ty % 2 ? 11 : 4), Y + 8, 1, 7, COL.twallD);
          px(X, Y, T, 1, '#e2d2ae');
          break;
        case 'C':
          px(X + 3, Y + 13, 10, 3, 'rgba(40,24,10,0.25)');
          px(X + 3, Y - 6, 10, 20, COL.ink);
          px(X + 4, Y - 5, 8, 18, '#ece2c8');
          px(X + 9, Y - 5, 3, 18, '#c8b896');
          px(X + 2, Y - 8, 12, 3, '#ece2c8');
          px(X + 2, Y - 8, 12, 1, COL.ink);
          px(X + 2, Y + 12, 12, 2, '#d8caa8');
          break;
        case 'T':
          px(X + 3, Y + 13, 11, 3, 'rgba(30,40,10,0.3)');
          px(X + 6, Y + 8, 4, 7, '#5a3a1e');
          px(X + 7, Y + 8, 1, 7, '#7a5230');
          for (let yy = 0; yy < 12; yy++)
            for (let xx = 0; xx < 16; xx++) {
              const d = ((xx - 8) / 7.5) ** 2 + ((yy - 5) / 5.5) ** 2;
              if (d <= 1) px(X + xx, Y - 3 + yy, 1, 1, d > 0.82 ? COL.ink : xx > 9 ? '#4e6e2a' : (xx + yy) % 4 === 0 ? '#9aba5a' : '#6a8e3a');
            }
          break;
        case 'r':
          px(X + 2, Y + 4, 12, 11, COL.ink);
          px(X + 3, Y + 5, 10, 9, '#a8987e');
          px(X + 3, Y + 5, 6, 3, '#c8b89c');
          px(X + 10, Y + 8, 3, 6, '#7e705c');
          break;
        case 'b':
          for (let yy = 0; yy < 10; yy++)
            for (let xx = 0; xx < 14; xx++) {
              const d = ((xx - 7) / 6.5) ** 2 + ((yy - 5) / 4.8) ** 2;
              if (d <= 1) px(X + 1 + xx, Y + 5 + yy, 1, 1, d > 0.78 ? COL.ink : (xx + yy) % 3 ? '#7a8a3a' : '#9aa84e');
            }
          break;
        case 'p':
          px(X + 7, Y - 2, 3, 17, '#3a2414');
          px(X + 8, Y - 2, 1, 17, '#8a6234');
          for (const [dx, dy] of [
            [-7, -6],
            [5, -6],
            [-6, -2],
            [4, -1],
          ])
            for (let i = 0; i < 7; i++) px(X + 8 + Math.sign(dx) * i, Y - 4 + Math.round((dy / 6) * i * 0.6) + (i > 4 ? 1 : 0), 2, 2, i > 5 ? '#4e6e2a' : '#6a9a3a');
          break;
        case 'w':
          px(X - 1, Y + 1, 18, 14, COL.ink);
          px(X, Y + 2, 16, 12, '#8a8a96');
          px(X + 3, Y + 4, 10, 7, '#1e2a3e');
          px(X + 3, Y + 4, 10, 1, '#3a4a64');
          px(X, Y + 2, 16, 1, '#b4b4c0');
          break;
      }
    }
  }
  return c;
}

/** Animated ripples on the lake, drawn each frame over the painted map. */
export function drawWater(ctx: CanvasRenderingContext2D, m: Tile[][], camX: number, camY: number, vw: number, vh: number, time: number) {
  const MH = m.length;
  const MW = m[0].length;
  const x0 = Math.max(0, Math.floor(camX / T));
  const y0 = Math.max(0, Math.floor(camY / T));
  ctx.fillStyle = '#9cc8e8';
  for (let ty = y0; ty < Math.min(MH, y0 + vh / T + 2); ty++)
    for (let tx = x0; tx < Math.min(MW, x0 + vw / T + 2); tx++) {
      if (m[ty][tx] !== '~') continue;
      const k = (tx * 13 + ty * 7 + Math.floor(time * 2)) % 6;
      if (k < 2) ctx.fillRect(tx * T + 2 + k * 5 - camX, ty * T + 4 + k * 4 - camY, 4, 1);
    }
}

export { shade };
