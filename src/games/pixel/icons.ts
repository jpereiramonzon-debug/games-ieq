/** 12×12 pixel icons for items, tools and actions, painted once and cached. */

export type IconId =
  | 'wood'
  | 'stone'
  | 'seed'
  | 'lily'
  | 'coin'
  | 'heart'
  | 'stool'
  | 'chair'
  | 'table'
  | 'yoke'
  | 'door'
  | 'manger'
  | 'mill'
  | 'boat'
  | 'horse'
  | 'axe'
  | 'pick'
  | 'hammer'
  | 'can'
  | 'hand'
  | 'moon'
  | 'chat'
  | 'sun'
  | 'wheel';

const K = '#3a2414';
const C = {
  w: '#9a6234',
  W: '#c08a4a',
  d: '#6a4220',
  s: '#a8987e',
  S: '#c8b89c',
  t: '#7e705c',
  g: '#6a9a3a',
  G: '#9aba5a',
  y: '#ffd23a',
  Y: '#e0a020',
  x: '#f4f0e0',
  m: '#8a8a96',
  M: '#d4d4de',
  b: '#3c7cb2',
  B: '#7eb4dc',
  r: '#d8402a',
  R: '#f07a5a',
  p: '#e2a56a',
  h: '#7a5230',
};

type Px = (x: number, y: number, w: number, h: number, c: string) => void;

const ART = {
  wood: (px) => {
    px(0, 3, 10, 7, K);
    px(1, 4, 8, 5, C.w);
    px(1, 4, 8, 1, C.W);
    px(2, 6, 5, 1, C.d);
    px(8, 2, 4, 9, K);
    px(9, 3, 2, 7, '#e8c890');
    px(9, 5, 2, 3, '#c09a60');
  },
  stone: (px) => {
    px(2, 2, 8, 9, K);
    px(1, 4, 10, 6, K);
    px(3, 3, 6, 7, C.s);
    px(2, 5, 8, 4, C.s);
    px(3, 3, 3, 2, C.S);
    px(7, 7, 2, 2, C.t);
  },
  seed: (px) => {
    px(2, 3, 8, 9, K);
    px(3, 4, 6, 7, '#c8a060');
    px(3, 4, 6, 1, '#e0c080');
    px(4, 1, 4, 3, K);
    px(5, 2, 2, 1, C.d);
    px(4, 6, 1, 1, C.d);
    px(6, 8, 1, 1, C.d);
    px(7, 6, 1, 1, C.d);
  },
  lily: (px) => {
    px(5, 6, 2, 6, C.g);
    px(2, 8, 3, 2, C.g);
    px(7, 9, 3, 2, C.G);
    px(2, 0, 8, 7, K);
    px(3, 1, 6, 5, C.x);
    px(1, 2, 1, 3, K);
    px(10, 2, 1, 3, K);
    px(5, 2, 2, 2, C.y);
  },
  coin: (px) => {
    px(3, 1, 6, 10, K);
    px(1, 3, 10, 6, K);
    px(2, 2, 8, 8, K);
    px(3, 2, 6, 8, C.Y);
    px(2, 3, 8, 6, C.Y);
    px(3, 3, 6, 6, C.y);
    px(5, 4, 2, 4, C.Y);
  },
  heart: (px) => {
    px(1, 2, 4, 5, K);
    px(7, 2, 4, 5, K);
    px(0, 3, 12, 4, K);
    px(2, 7, 8, 2, K);
    px(4, 9, 4, 2, K);
    px(2, 3, 2, 4, C.r);
    px(8, 3, 2, 4, C.r);
    px(1, 4, 10, 2, C.r);
    px(3, 6, 6, 2, C.r);
    px(5, 8, 2, 2, C.r);
    px(2, 3, 1, 1, C.R);
  },
  stool: (px) => {
    px(1, 3, 10, 3, K);
    px(2, 4, 8, 1, C.W);
    px(2, 6, 2, 6, K);
    px(8, 6, 2, 6, K);
    px(2, 6, 1, 5, C.w);
    px(8, 6, 1, 5, C.w);
  },
  chair: (px) => {
    px(2, 0, 3, 8, K);
    px(3, 1, 1, 6, C.W);
    px(2, 6, 9, 3, K);
    px(3, 7, 7, 1, C.W);
    px(2, 8, 2, 4, K);
    px(9, 8, 2, 4, K);
  },
  table: (px) => {
    px(0, 2, 12, 4, K);
    px(1, 3, 10, 2, C.W);
    px(1, 3, 10, 1, '#e0b070');
    px(1, 6, 2, 6, K);
    px(9, 6, 2, 6, K);
    px(1, 6, 1, 5, C.w);
    px(9, 6, 1, 5, C.w);
  },
  yoke: (px) => {
    px(0, 2, 12, 4, K);
    px(1, 3, 10, 2, C.w);
    px(1, 3, 10, 1, C.W);
    px(1, 6, 1, 4, K);
    px(4, 6, 1, 4, K);
    px(1, 9, 4, 2, K);
    px(7, 6, 1, 4, K);
    px(10, 6, 1, 4, K);
    px(7, 9, 4, 2, K);
  },
  door: (px) => {
    px(2, 0, 8, 12, K);
    px(3, 1, 6, 11, C.w);
    px(5, 1, 1, 11, C.d);
    px(7, 1, 1, 11, C.d);
    px(3, 3, 6, 1, C.d);
    px(3, 8, 6, 1, C.d);
    px(7, 5, 1, 2, C.y);
  },
  manger: (px) => {
    px(1, 1, 10, 3, '#e8c860');
    px(2, 0, 2, 1, '#e8c860');
    px(7, 0, 3, 1, '#e8c860');
    px(0, 3, 12, 2, K);
    px(1, 5, 10, 3, K);
    px(2, 8, 8, 1, K);
    px(2, 5, 8, 2, C.w);
    px(1, 4, 10, 1, C.W);
    px(1, 8, 2, 4, K);
    px(9, 8, 2, 4, K);
  },
  mill: (px) => {
    px(3, 1, 6, 10, K);
    px(1, 3, 10, 6, K);
    px(2, 2, 8, 8, K);
    px(3, 2, 6, 8, C.s);
    px(2, 3, 8, 6, C.s);
    px(3, 3, 3, 2, C.S);
    px(5, 5, 2, 2, K);
    px(8, 6, 1, 2, C.t);
  },
  boat: (px) => {
    px(5, 0, 1, 7, K);
    px(6, 1, 5, 5, K);
    px(6, 2, 4, 3, C.x);
    px(0, 6, 12, 2, K);
    px(1, 8, 10, 2, K);
    px(2, 10, 8, 1, K);
    px(1, 7, 10, 2, C.w);
    px(1, 7, 10, 1, C.W);
  },
  horse: (px) => {
    px(7, 0, 4, 5, K);
    px(8, 1, 2, 3, C.W);
    px(10, 2, 1, 1, K);
    px(2, 4, 8, 4, K);
    px(3, 5, 6, 2, C.W);
    px(1, 3, 2, 3, K);
    px(2, 8, 2, 4, K);
    px(8, 8, 2, 4, K);
    px(1, 11, 10, 1, C.d);
    px(7, 1, 1, 2, C.d);
  },
  axe: (px) => {
    px(5, 1, 3, 11, K);
    px(6, 2, 1, 9, C.h);
    px(0, 0, 6, 6, K);
    px(1, 1, 4, 4, C.m);
    px(1, 1, 1, 4, C.M);
  },
  pick: (px) => {
    px(5, 3, 3, 9, K);
    px(6, 4, 1, 7, C.h);
    px(0, 1, 12, 3, K);
    px(1, 2, 10, 1, C.m);
    px(0, 3, 2, 2, K);
    px(10, 3, 2, 2, K);
    px(1, 2, 3, 1, C.M);
  },
  hammer: (px) => {
    px(5, 4, 3, 8, K);
    px(6, 5, 1, 6, C.h);
    px(1, 0, 10, 5, K);
    px(2, 1, 8, 3, C.m);
    px(2, 1, 8, 1, C.M);
  },
  can: (px) => {
    px(1, 4, 8, 7, K);
    px(2, 5, 6, 5, C.b);
    px(2, 5, 6, 1, C.B);
    px(3, 1, 4, 4, K);
    px(4, 2, 2, 2, 'transparent');
    px(8, 5, 2, 2, K);
    px(9, 3, 3, 3, K);
    px(10, 4, 1, 1, C.B);
  },
  hand: (px) => {
    px(2, 4, 8, 7, K);
    px(3, 5, 6, 5, C.p);
    for (let i = 0; i < 4; i++) {
      px(2 + i * 2, 0 + (i === 0 || i === 3 ? 2 : 0), 2, 5, K);
      px(2 + i * 2 + (i === 3 ? 0 : 1), 1 + (i === 0 || i === 3 ? 2 : 0), 1, 4, C.p);
    }
    px(9, 6, 3, 2, K);
  },
  moon: (px) => {
    // Crescent: a disc minus an offset disc, with a dark rim.
    const inside = (x: number, y: number) => Math.hypot(x - 5.5, y - 6) <= 5 && Math.hypot(x - 8.5, y - 4) > 4;
    for (let y = 0; y < 12; y++)
      for (let x = 0; x < 12; x++) {
        if (inside(x, y)) {
          const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
          px(x, y, 1, 1, edge ? K : x < 4 && y < 6 ? '#fff4c8' : '#ffe08a');
        }
      }
  },
  chat: (px) => {
    px(0, 1, 12, 8, K);
    px(1, 2, 10, 6, C.x);
    px(2, 9, 3, 2, K);
    px(2, 8, 2, 1, C.x);
    px(3, 4, 1, 2, K);
    px(6, 4, 1, 2, K);
    px(9, 4, 1, 2, K);
  },
  sun: (px) => {
    px(3, 3, 6, 6, K);
    px(4, 4, 4, 4, C.y);
    px(5, 0, 2, 2, C.Y);
    px(5, 10, 2, 2, C.Y);
    px(0, 5, 2, 2, C.Y);
    px(10, 5, 2, 2, C.Y);
    px(1, 1, 2, 2, C.Y);
    px(9, 9, 2, 2, C.Y);
    px(9, 1, 2, 2, C.Y);
    px(1, 9, 2, 2, C.Y);
  },
} as Record<IconId, (px: Px) => void>;

ART.wheel = (px) => {
  for (let y = 0; y < 12; y++)
    for (let x = 0; x < 12; x++) {
      const d = Math.hypot(x - 5.5, y - 5.5);
      if (d > 5.6) continue;
      px(x, y, 1, 1, d > 4.6 || d < 1.2 ? K : (x + y) % 3 ? '#a8a0a0' : '#c8c0c0');
    }
  px(9, 1, 3, 2, '#ffe066');
  px(10, 0, 1, 1, '#ff8a3a');
};

const cache = new Map<IconId, HTMLCanvasElement>();
const urls = new Map<IconId, string>();

export function icon(id: IconId): HTMLCanvasElement {
  let c = cache.get(id);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = 12;
  c.height = 12;
  const ctx = c.getContext('2d')!;
  ART[id]((x, y, w, h, col) => {
    if (col === 'transparent') ctx.clearRect(x, y, w, h);
    else {
      ctx.fillStyle = col;
      ctx.fillRect(x, y, w, h);
    }
  });
  cache.set(id, c);
  return c;
}

export function iconURL(id: IconId): string {
  let u = urls.get(id);
  if (!u) {
    u = icon(id).toDataURL();
    urls.set(id, u);
  }
  return u;
}
