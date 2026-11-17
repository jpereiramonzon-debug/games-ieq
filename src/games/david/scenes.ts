/**
 * Backdrops and creature sprites for the story of David, drawn with the same
 * 16-bit palette as the people (light from the upper left, dithered tones).
 */
import { personFrame, shade, type Dir, type Look } from '../pixel/person';

export type Ctx = CanvasRenderingContext2D;

const BAYER = [
  [0, 0.5],
  [0.75, 0.25],
];

function tone(r: string[], l: number, x: number, y: number) {
  const v = Math.max(0, Math.min(r.length - 1, ((l + 1) / 2) * (r.length - 1))) + BAYER[y & 1][x & 1] * 0.5 - 0.25;
  return r[Math.max(0, Math.min(r.length - 1, Math.round(v)))];
}
const rampOf = (c: string) => [shade(c, -0.45), shade(c, -0.22), c, shade(c, 0.2)];

/** Offscreen canvases painted once and reused (pixel loops are too slow per frame on phones). */
const memo = new Map<string, HTMLCanvasElement>();
function cached(key: string, w: number, h: number, paint: (c: Ctx) => void) {
  let c = memo.get(key);
  if (!c) {
    if (memo.size > 600) memo.clear();
    c = document.createElement('canvas');
    c.width = Math.max(1, w);
    c.height = Math.max(1, h);
    paint(c.getContext('2d')!);
    memo.set(key, c);
  }
  return c;
}

/** Shaded ellipse. */
export function blob(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, color: string, bias = 0) {
  const ox = Math.floor(cx - rx) - 1;
  const oy = Math.floor(cy - ry) - 1;
  const lx = Math.round((cx - ox) * 2) / 2;
  const ly = Math.round((cy - oy) * 2) / 2;
  const W = Math.ceil(rx * 2) + 3;
  const H = Math.ceil(ry * 2) + 3;
  const img = cached(`b|${lx}|${ly}|${rx}|${ry}|${color}|${bias}|${ox & 1}${oy & 1}`, W, H, (c) => {
    const r = rampOf(color);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const nx = (x + 0.5 - lx) / rx;
        const ny = (y + 0.5 - ly) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        c.fillStyle = tone(r, -0.55 * nx - 0.5 * ny + 0.45 * Math.sqrt(1 - d) - 0.1 + bias, x + ox, y + oy);
        c.fillRect(x, y, 1, 1);
      }
  });
  ctx.drawImage(img, ox, oy);
}

const rect = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

export function sky(ctx: Ctx, w: number, bands: string[], h = 90) {
  const bh = Math.ceil(h / bands.length);
  bands.forEach((c, i) => rect(ctx, 0, i * bh, w, bh + 1, c));
}

export function hills(ctx: Ctx, w: number, base: number, color: string, amp: number, freq: number, seed: number, h = 180) {
  ctx.drawImage(cached(`h|${w}|${base}|${color}|${amp}|${freq}|${seed}|${h}`, w, h, (c) => paintHills(c, w, base, color, amp, freq, seed, h)), 0, 0);
}

function paintHills(ctx: Ctx, w: number, base: number, color: string, amp: number, freq: number, seed: number, h: number) {
  const r = rampOf(color);
  for (let x = 0; x < w; x++) {
    const top = Math.round(base - amp * (0.6 + 0.4 * Math.sin(x * freq + seed)) - amp * 0.3 * Math.sin(x * freq * 2.7 + seed * 2));
    for (let y = top; y < h; y++) {
      ctx.fillStyle = y - top < 2 ? r[3] : tone(r, 0.3 - (y - top) / 40, x, y);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function clouds(ctx: Ctx, w: number, t: number) {
  for (let i = 0; i < 5; i++) {
    const x = ((i * 97 + t * 3) % (w + 60)) - 30;
    const y = 12 + ((i * 23) % 30);
    rect(ctx, x, y, 26, 4, '#ffffff');
    rect(ctx, x + 5, y - 3, 14, 3, '#ffffff');
    rect(ctx, x + 2, y + 4, 22, 1, '#d8e8f0');
  }
}

function grass(ctx: Ctx, w: number, top: number, color = '#7aa04a', h = 180) {
  ctx.drawImage(cached(`g|${w}|${top}|${color}|${h}`, w, h, (c) => paintGrass(c, w, top, color, h)), 0, 0);
}

function paintGrass(ctx: Ctx, w: number, top: number, color: string, h: number) {
  rect(ctx, 0, top, w, h - top, color);
  for (let i = 0; i < w * 0.9; i++) {
    const x = (i * 53) % w;
    const y = top + ((i * 37) % (h - top));
    rect(ctx, x, y, 1, 2, shade(color, -0.22));
    rect(ctx, x + 1, y, 1, 1, shade(color, 0.18));
  }
}

function house(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, '#3a2414');
  rect(ctx, x, y, w, h, '#e0c896');
  rect(ctx, x, y, w, 2, '#f2dcae');
  rect(ctx, x + w - 2, y, 2, h, '#c0a274');
  rect(ctx, x + Math.round(w / 2) - 1, y + h - 4, 3, 4, '#4a3020');
}

/** Fields of Bethlehem at a given time of day (0 = noon, 1 = sunset). */
export function pasture(ctx: Ctx, w: number, t: number, dusk: number) {
  sky(ctx, w, dusk > 0.5 ? ['#e88a5a', '#f0a868', '#f4c080', '#f8d8a0'] : ['#7ab8e0', '#94c8e8', '#b0d8ee', '#cce6f0'], 70);
  clouds(ctx, w, t);
  hills(ctx, w, 66, '#8aa868', 14, 0.03, 1);
  // Bethlehem on the far hill.
  for (let i = 0; i < 6; i++) house(ctx, w * 0.62 + i * 9, 44 - (i % 3) * 3, 8, 7);
  hills(ctx, w, 84, '#6a9a3a', 10, 0.05, 4);
  grass(ctx, w, 84);
  if (dusk > 0) {
    ctx.fillStyle = `rgba(255,120,60,${dusk * 0.25})`;
    ctx.fillRect(0, 0, w, 180);
  }
}

export function village(ctx: Ctx, w: number, t: number) {
  sky(ctx, w, ['#86c0e4', '#a2d0ea', '#bedcee', '#d8eaf0'], 60);
  clouds(ctx, w, t);
  hills(ctx, w, 60, '#a8b878', 8, 0.04, 2);
  // Back wall of Jesse's courtyard and the house.
  rect(ctx, 0, 52, w, 44, '#d8bc88');
  for (let x = 0; x < w; x += 12) for (let y = 54; y < 94; y += 6) rect(ctx, x + ((y / 6) % 2) * 6, y, 1, 5, '#c0a070');
  for (let y = 54; y < 96; y += 6) rect(ctx, 0, y, w, 1, '#c0a070');
  rect(ctx, 0, 52, w, 2, '#ecd4a4');
  house(ctx, w * 0.62, 30, 60, 64);
  rect(ctx, w * 0.62 + 24, 66, 12, 28, '#3a2414');
  rect(ctx, w * 0.62 + 25, 67, 10, 27, '#5a3a20');
  // Fig tree.
  rect(ctx, w * 0.18, 50, 4, 44, '#5a3a1e');
  blob(ctx, w * 0.18 + 2, 44, 20, 14, '#5a8a32');
  rect(ctx, 0, 96, w, 84, '#d8b880');
  for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, 100 + ((i * 29) % 78), 2, 1, '#c4a06a');
}

/** Stone hall in the style of a palace interior. */
export function palace(ctx: Ctx, w: number) {
  rect(ctx, 0, 0, w, 180, '#2a1a10');
  // Back wall: cream plaster with a wooden band.
  rect(ctx, 0, 0, w, 84, '#ead8a6');
  for (let i = 0; i < w; i++) rect(ctx, (i * 31) % w, (i * 17) % 80, 1, 1, '#dcc896');
  rect(ctx, 0, 70, w, 4, '#8a5a2e');
  rect(ctx, 0, 70, w, 1, '#b0804a');
  rect(ctx, 0, 74, w, 10, '#c8b080');
  // Pillars and red hangings.
  for (let x = 20; x < w; x += 70) {
    rect(ctx, x, 0, 12, 84, '#d0c0a0');
    rect(ctx, x, 0, 3, 84, '#ece0c4');
    rect(ctx, x + 9, 0, 3, 84, '#a89878');
    rect(ctx, x + 22, 8, 22, 40, '#3a1a14');
    rect(ctx, x + 23, 9, 20, 38, '#a8322a');
    rect(ctx, x + 23, 9, 20, 2, '#c84a3a');
    rect(ctx, x + 31, 20, 4, 12, '#e8b830');
  }
  // Grey stone floor tiles.
  for (let y = 84; y < 180; y += 12)
    for (let x = -((y / 12) % 2) * 9; x < w; x += 18) {
      rect(ctx, x, y, 18, 12, '#9a9a94');
      rect(ctx, x + 1, y + 1, 16, 10, '#b4b4ac');
      rect(ctx, x + 1, y + 1, 16, 1, '#c8c8c0');
    }
}

export function elah(ctx: Ctx, w: number, t: number) {
  sky(ctx, w, ['#8cc2e4', '#a6d0ea', '#c0deee', '#d8eaee'], 60);
  clouds(ctx, w, t);
  hills(ctx, w, 62, '#b8a878', 22, 0.02, 0.5);
  // Tents of both armies.
  for (let i = 0; i < 5; i++) {
    for (const [x0, c] of [
      [10, '#e8dcc0'],
      [w - 70, '#a87a5a'],
    ] as const) {
      const x = x0 + i * 12;
      const y = 48 + (i % 2) * 4;
      ctx.fillStyle = '#3a2414';
      ctx.beginPath();
      ctx.moveTo(x - 1, y + 9);
      ctx.lineTo(x + 5, y - 1);
      ctx.lineTo(x + 11, y + 9);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x + 1, y + 8);
      ctx.lineTo(x + 5, y + 1);
      ctx.lineTo(x + 9, y + 8);
      ctx.fill();
    }
  }
  hills(ctx, w, 92, '#c8b480', 6, 0.05, 3);
  rect(ctx, 0, 92, w, 88, '#d8c08a');
  for (let i = 0; i < w; i++) rect(ctx, (i * 43) % w, 96 + ((i * 31) % 80), 2, 1, '#c4aa74');
}

export function brook(ctx: Ctx, w: number, t: number) {
  rect(ctx, 0, 0, w, 180, '#8aa860');
  grass(ctx, w, 0, '#7a9a48');
  for (let y = 40; y < 150; y++) {
    const off = Math.sin(y / 14) * 18;
    const x0 = w * 0.18 + off;
    const x1 = w * 0.82 + off;
    rect(ctx, x0 - 6, y, 6, 1, '#c8b484');
    rect(ctx, x1, y, 6, 1, '#c8b484');
    rect(ctx, x0, y, x1 - x0, 1, (y + Math.floor(t * 6)) % 9 === 0 ? '#7ab4dc' : '#4a88c0');
  }
}

export function cave(ctx: Ctx, w: number, t: number) {
  for (let y = 0; y < 180; y++) {
    const k = y / 180;
    rect(ctx, 0, y, w, 1, k < 0.15 ? '#1a1410' : k > 0.7 ? '#3a2e24' : '#2a221a');
  }
  // Rock texture and stalactites.
  for (let i = 0; i < 70; i++) rect(ctx, (i * 67) % w, (i * 41) % 120, 3, 2, i % 2 ? '#3a3026' : '#221a14');
  for (let x = 8; x < w; x += 23) {
    ctx.fillStyle = '#2e261e';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 5, 10 + (x % 17));
    ctx.lineTo(x + 10, 0);
    ctx.fill();
  }
  // Light from the entrance on the right.
  const g = ctx.createLinearGradient(w, 0, w * 0.4, 0);
  g.addColorStop(0, `rgba(255,220,150,${0.35 + Math.sin(t) * 0.03})`);
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, 180);
  rect(ctx, 0, 132, w, 48, '#4a3c2e');
  for (let i = 0; i < w; i++) rect(ctx, (i * 47) % w, 134 + ((i * 13) % 44), 2, 1, '#3a2e22');
}

export function jerusalem(ctx: Ctx, w: number, t: number) {
  sky(ctx, w, ['#5a9ad8', '#78b0e0', '#98c4e8', '#bcd8ee'], 60);
  clouds(ctx, w, t);
  // City wall with towers and the gate.
  rect(ctx, 0, 40, w, 50, '#d8c090');
  for (let x = 0; x < w; x += 8) rect(ctx, x, 36, 5, 5, '#d8c090');
  for (let y = 44; y < 90; y += 7) rect(ctx, 0, y, w, 1, '#c0a474');
  for (let x = 30; x < w; x += 90) {
    rect(ctx, x, 24, 22, 66, '#ccb282');
    for (let k = 0; k < 4; k++) rect(ctx, x + k * 6, 20, 4, 5, '#ccb282');
    rect(ctx, x + 8, 40, 6, 9, '#3a2a1a');
  }
  rect(ctx, w / 2 - 16, 56, 32, 34, '#3a2414');
  rect(ctx, w / 2 - 14, 58, 28, 32, '#5a4028');
  // Street.
  rect(ctx, 0, 90, w, 90, '#c8b088');
  for (let y = 92; y < 180; y += 8) for (let x = ((y / 8) % 2) * 7; x < w; x += 14) rect(ctx, x, y, 13, 7, '#d4bc94');
}

// ---------------------------------------------------------------- creatures

export function sheep(ctx: Ctx, x: number, y: number, step: number, left: boolean, scared = false) {
  const X = Math.round(x);
  const Y = Math.round(y);
  rect(ctx, X - 7, Y - 1, 14, 2, 'rgba(40,24,10,0.25)');
  const l = step % 2;
  rect(ctx, X - 5, Y - 4, 2, 4 - l, '#3a2a20');
  rect(ctx, X + 3, Y - 4, 2, 3 + l, '#3a2a20');
  blob(ctx, X, Y - 8, 7.5, 5.5, scared ? '#e8d8c8' : '#f0ece0', 0.1);
  for (let i = 0; i < 5; i++) rect(ctx, X - 5 + i * 2.5, Y - 13 + (i % 2), 2, 1, '#ffffff');
  const hx = left ? X - 8 : X + 5;
  rect(ctx, hx - 1, Y - 12, 5, 6, '#2a1a10');
  rect(ctx, hx, Y - 11, 3, 4, '#4a3a30');
  rect(ctx, left ? hx : hx + 2, Y - 10, 1, 1, '#ffffff');
}

export function lion(ctx: Ctx, x: number, y: number, step: number, left: boolean, flash = false, bear = false) {
  const X = Math.round(x);
  const Y = Math.round(y);
  const c = flash ? '#ffffff' : bear ? '#5a3a24' : '#d8a050';
  const mane = flash ? '#ffffff' : bear ? '#4a2e1a' : '#9a5a24';
  rect(ctx, X - 13, Y - 1, 26, 3, 'rgba(40,24,10,0.3)');
  const l = step % 2 ? 2 : 0;
  for (const lx of [-9, -4, 4, 9]) rect(ctx, X + lx - 1, Y - 6, 3, 6 - (lx % 2 ? l : 2 - l), shade(c, -0.35));
  blob(ctx, X, Y - 10, bear ? 13 : 12, bear ? 7.5 : 6, c);
  const hx = left ? X - 12 : X + 12;
  blob(ctx, hx, Y - 14, bear ? 6 : 7.5, bear ? 6 : 7.5, mane);
  blob(ctx, hx + (left ? -1 : 1), Y - 13, 4, 4, bear ? '#6a4630' : '#e0b060');
  rect(ctx, hx + (left ? -3 : 1), Y - 15, 2, 1, '#1a0a04');
  rect(ctx, hx + (left ? -5 : 4), Y - 12, 2, 2, '#2a1a10');
  if (!bear) {
    const tx = left ? X + 12 : X - 12;
    rect(ctx, tx - (left ? 0 : 4), Y - 14, 5, 1, c);
    rect(ctx, tx + (left ? 4 : -5), Y - 15, 2, 3, mane);
  } else {
    blob(ctx, hx + (left ? 3 : -3), Y - 19, 2, 2, mane);
  }
}

/** A person drawn bigger (Goliath, close-ups). */
export function bigPerson(ctx: Ctx, look: Look, x: number, feetY: number, scale: number, dir: Dir = 'down', step = 0) {
  const f = personFrame(look, dir, step);
  // The rig is ~37 px tall instead of 30: keep the same on-screen size.
  const k = scale * 0.82;
  ctx.fillStyle = 'rgba(40,24,10,0.25)';
  ctx.fillRect(Math.round(x - 7 * scale), Math.round(feetY - scale), Math.round(14 * scale), Math.round(2 * scale));
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(f, Math.round(x - 18 * k), Math.round(feetY - 43 * k), Math.round(f.width * k), Math.round(f.height * k));
  ctx.imageSmoothingEnabled = sm;
}

export function stone(ctx: Ctx, x: number, y: number, smooth: boolean, size = 1) {
  const X = Math.round(x);
  const Y = Math.round(y);
  if (smooth) blob(ctx, X, Y, 4 * size, 3 * size, '#b8b0a4', 0.2);
  else {
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.moveTo(X - 5 * size, Y + 2 * size);
    ctx.lineTo(X - 2 * size, Y - 4 * size);
    ctx.lineTo(X + 1 * size, Y - 1 * size);
    ctx.lineTo(X + 5 * size, Y - 3 * size);
    ctx.lineTo(X + 4 * size, Y + 3 * size);
    ctx.fill();
    ctx.fillStyle = '#8a7a64';
    ctx.beginPath();
    ctx.moveTo(X - 4 * size, Y + 2 * size);
    ctx.lineTo(X - 2 * size, Y - 3 * size);
    ctx.lineTo(X + 1 * size, Y);
    ctx.lineTo(X + 4 * size, Y - 2 * size);
    ctx.lineTo(X + 3 * size, Y + 2 * size);
    ctx.fill();
  }
}

export function ark(ctx: Ctx, x: number, y: number, t: number) {
  const X = Math.round(x);
  const Y = Math.round(y);
  // Poles, chest and the two cherubim.
  rect(ctx, X - 30, Y - 6, 60, 3, '#3a2414');
  rect(ctx, X - 29, Y - 5, 58, 1, '#c08a4a');
  rect(ctx, X - 13, Y - 16, 26, 14, '#3a2414');
  rect(ctx, X - 12, Y - 15, 24, 12, '#e8b830');
  rect(ctx, X - 12, Y - 15, 24, 2, '#ffe080');
  rect(ctx, X - 12, Y - 9, 24, 1, '#b88a20');
  for (const s of [-1, 1]) {
    rect(ctx, X + s * 7 - 2, Y - 22, 5, 7, '#e8b830');
    rect(ctx, X + s * 2, Y - 24 + Math.round(Math.sin(t * 2) * 0.5), s * 6, 2, '#ffe080');
  }
}

export function particlesDraw(ctx: Ctx, ps: { x: number; y: number; c: string; life: number }[]) {
  for (const p of ps) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    rect(ctx, p.x, p.y, 2, 2, p.c);
  }
  ctx.globalAlpha = 1;
}
