/**
 * Sky, parallax scenery and light for the side-view stages and the
 * cinematic transitions. Each (theme, time of day) pair is painted once into
 * wide strips that scroll at different speeds; time changes crossfade.
 */
import type { ThemeId, TimeOfDay } from './level';

export interface Sky {
  top: string;
  bottom: string;
  /** Sun or moon: x, y as fractions of the view, radius, colour. */
  orb: [number, number, number, string] | null;
  stars: number;
  /** Darkness 0..1 (torches and the hero carry light). */
  dark: number;
  /** Colour cast over the scenery. */
  cast: string;
  rain?: boolean;
}

export const SKIES: Record<TimeOfDay, Sky> = {
  dawn: { top: '#6a78c0', bottom: '#f8c49a', orb: [0.18, 0.62, 14, '#fff0c8'], stars: 0.2, dark: 0.12, cast: '#f0a080' },
  day: { top: '#4a9ae4', bottom: '#c4e4f6', orb: [0.78, 0.16, 12, '#fff8d8'], stars: 0, dark: 0, cast: '#ffffff' },
  sunset: { top: '#4a3a7a', bottom: '#f88a50', orb: [0.82, 0.6, 18, '#ffb060'], stars: 0.1, dark: 0.22, cast: '#ff9a60' },
  night: { top: '#080c26', bottom: '#28305e', orb: [0.75, 0.18, 9, '#f0f0e0'], stars: 1, dark: 0.58, cast: '#4a5a9a' },
  storm: { top: '#1e2430', bottom: '#4a5260', orb: null, stars: 0, dark: 0.38, cast: '#6a7a8a', rain: true },
};

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: RGB) => `rgb(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',')})`;
export const mixHex = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return css([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]);
};
const toHex = (c: string) => {
  if (c.startsWith('#')) return c;
  const m = c.match(/\d+/g)!.map(Number);
  return (
    '#' +
    m
      .slice(0, 3)
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
};

/** Base colours of the far and middle layers for each theme. */
const LAYERS: Record<ThemeId, { far: string; mid: string; kind: 'hills' | 'dunes' | 'columns' | 'rock' | 'sea' | 'town' }> = {
  village: { far: '#8aa8a0', mid: '#5a8a4a', kind: 'hills' },
  desert: { far: '#d8b088', mid: '#c89a5a', kind: 'dunes' },
  egypt: { far: '#d8b088', mid: '#b88a48', kind: 'dunes' },
  palace: { far: '#b86a6a', mid: '#8a7a96', kind: 'columns' },
  temple: { far: '#b8a888', mid: '#d8ccb0', kind: 'columns' },
  cave: { far: '#3a3026', mid: '#4a3e32', kind: 'rock' },
  shore: { far: '#6a9ac8', mid: '#3a6a9a', kind: 'sea' },
  night: { far: '#3a4a6a', mid: '#2a3448', kind: 'town' },
};

const strips = new Map<string, { far: HTMLCanvasElement; mid: HTMLCanvasElement }>();
const SW = 960;

/** Paint (once) the far and middle scenery strips for a theme at a time of day. */
function stripsFor(theme: ThemeId, time: TimeOfDay) {
  const key = `${theme}|${time}`;
  const hit = strips.get(key);
  if (hit) return hit;
  const sky = SKIES[time];
  const L = LAYERS[theme];
  const tone = (c: string, k: number) => toHex(mixHex(toHex(mixHex(c, sky.cast, 0.25)), sky.bottom, k));
  const shadeDark = (c: string) => toHex(mixHex(c, '#0a0c18', sky.dark * 0.8));
  const farCol = shadeDark(tone(L.far, 0.35));
  const midCol = shadeDark(tone(L.mid, 0.12));
  const make = (h: number) => {
    const c = document.createElement('canvas');
    c.width = SW;
    c.height = h;
    return c;
  };
  const far = make(200);
  const mid = make(200);
  const f = far.getContext('2d')!;
  const m = mid.getContext('2d')!;
  const ridge = (g: CanvasRenderingContext2D, base: number, amp: number, freq: number, col: string, phase = 0) => {
    g.fillStyle = col;
    for (let x = 0; x < SW; x++) {
      const k = (x / SW) * Math.PI * 2;
      const y = base - amp * (0.6 * Math.abs(Math.sin(k * freq + phase)) + 0.4 * Math.sin(k * freq * 2.3 + phase * 2));
      g.fillRect(x, Math.round(y), 1, 200 - Math.round(y));
    }
  };
  // Far: mountains / dunes / sea horizon.
  if (L.kind === 'sea') {
    ridge(f, 120, 10, 3, farCol);
    f.fillStyle = shadeDark(tone('#3a7ab8', 0.1));
    f.fillRect(0, 128, SW, 72);
    f.fillStyle = shadeDark(tone('#8ac0e8', 0.2));
    for (let i = 0; i < 60; i++) f.fillRect((i * 97) % SW, 132 + ((i * 37) % 60), 6 + (i % 3) * 3, 1);
  } else ridge(f, 118, L.kind === 'dunes' ? 26 : 42, L.kind === 'dunes' ? 2 : 3, farCol);
  if (theme === 'egypt')
    for (const [px, s] of [
      [150, 54],
      [260, 36],
      [640, 70],
      [760, 40],
    ]) {
      f.fillStyle = toHex(mixHex(farCol, '#ffffff', 0.12));
      f.beginPath();
      f.moveTo(px - s, 128);
      f.lineTo(px, 128 - s);
      f.lineTo(px + s, 128);
      f.fill();
      f.fillStyle = toHex(mixHex(farCol, '#000000', 0.12));
      f.beginPath();
      f.moveTo(px, 128 - s);
      f.lineTo(px + s, 128);
      f.lineTo(px, 128);
      f.fill();
    }
  // Middle: silhouettes with detail.
  if (L.kind === 'hills') {
    ridge(m, 150, 22, 4, midCol, 1);
    for (let i = 0; i < 9; i++) {
      const x = (i * 113) % SW;
      const y = 136 - (i % 3) * 6;
      m.fillStyle = toHex(mixHex(midCol, '#000000', 0.15));
      m.fillRect(x + 6, y, 3, 14);
      m.fillStyle = toHex(mixHex(midCol, '#ffffff', 0.08));
      m.beginPath();
      m.arc(x + 7, y - 2, 9, 0, Math.PI * 2);
      m.fill();
    }
    // A walled town on the hill.
    m.fillStyle = shadeDark(tone('#d8c49a', 0.2));
    for (const [x, w, h] of [
      [520, 30, 22],
      [548, 22, 30],
      [568, 36, 18],
      [602, 18, 26],
    ]) {
      m.fillRect(x, 140 - h, w, h + 20);
      m.fillStyle = shadeDark(tone('#3a2a1a', 0.1));
      m.fillRect(x + w / 2 - 2, 146 - h + 6, 4, 5);
      m.fillStyle = shadeDark(tone('#d8c49a', 0.2));
    }
  } else if (L.kind === 'dunes') {
    ridge(m, 156, 18, 3, midCol, 2);
    for (const x of [90, 330, 560, 820]) {
      m.fillStyle = shadeDark('#5a3a1e');
      m.fillRect(x, 120, 3, 36);
      m.fillStyle = shadeDark(tone('#5a8a32', 0.1));
      for (let k = -3; k <= 3; k++) m.fillRect(x - 14 + k * 3 + 2, 116 + Math.abs(k) * 3, 12, 3);
    }
  } else if (L.kind === 'columns') {
    ridge(m, 170, 6, 5, midCol, 0.5);
    for (let x = 30; x < SW; x += 120) {
      m.fillStyle = midCol;
      m.fillRect(x, 70, 16, 110);
      m.fillStyle = toHex(mixHex(midCol, '#000000', 0.2));
      m.fillRect(x + 11, 70, 5, 110);
      m.fillStyle = toHex(mixHex(midCol, '#ffffff', 0.15));
      m.fillRect(x - 4, 64, 24, 7);
    }
  } else if (L.kind === 'rock') {
    ridge(m, 160, 30, 6, midCol, 0.3);
    m.fillStyle = midCol;
    for (let x = 0; x < SW; x += 40) m.fillRect(x, 0, 18 + ((x * 7) % 14), 18 + ((x * 13) % 30));
  } else if (L.kind === 'sea') {
    for (const x of [200, 640]) {
      m.fillStyle = shadeDark('#5a3a1e');
      m.fillRect(x, 138, 40, 8);
      m.fillRect(x + 18, 100, 2, 38);
      m.fillStyle = shadeDark(tone('#e8e0c8', 0.1));
      m.beginPath();
      m.moveTo(x + 20, 102);
      m.lineTo(x + 38, 132);
      m.lineTo(x + 20, 132);
      m.fill();
    }
  } else {
    // Night town.
    for (let x = 0; x < SW; x += 34) {
      const h = 30 + ((x * 31) % 40);
      m.fillStyle = midCol;
      m.fillRect(x, 170 - h, 30, h + 30);
      m.fillStyle = '#f0c060';
      if ((x / 34) % 2 === 0) m.fillRect(x + 10, 178 - h, 4, 4);
    }
  }
  const out = { far, mid };
  strips.set(key, out);
  return out;
}

/** Paint the sky (gradient, sun or moon, stars) for a time of day. */
export function drawSkyOnly(ctx: CanvasRenderingContext2D, w: number, h: number, time: TimeOfDay, t: number, alpha = 1) {
  const s = SKIES[time];
  ctx.globalAlpha = alpha;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, s.top);
  g.addColorStop(1, s.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  if (s.stars)
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = alpha * s.stars * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((i * 137) % w, (i * 53) % Math.round(h * 0.6), 1, 1);
    }
  if (s.orb) {
    const [fx, fy, r, c] = s.orb;
    const x = fx * w;
    const y = fy * h;
    ctx.globalAlpha = alpha * 0.35;
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 4);
    halo.addColorStop(0, c);
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (time === 'night') {
      ctx.fillStyle = mixHex(s.top, s.bottom, fy * 0.8);
      ctx.beginPath();
      ctx.arc(x + r * 0.45, y - r * 0.2, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** Sky plus the two scrolling scenery layers. */
export function drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, theme: ThemeId, time: TimeOfDay, t: number, camX: number, camY = 0, alpha = 1) {
  drawSkyOnly(ctx, w, h, time, t, alpha);
  const { far, mid } = stripsFor(theme, time);
  ctx.globalAlpha = alpha;
  const draw = (img: HTMLCanvasElement, k: number, dy: number) => {
    const off = ((-camX * k) % SW) - SW;
    for (let x = off; x < w; x += SW) ctx.drawImage(img, Math.round(x), Math.round(dy));
  };
  draw(far, 0.15, h - 200 - camY * 0.1 + 10);
  draw(mid, 0.4, h - 200 - camY * 0.25 + 20);
  ctx.globalAlpha = 1;
}

/** Darkness with holes of light (torches, the hero). Uses a reusable offscreen canvas. */
let lightCv: HTMLCanvasElement | null = null;
export function drawLights(ctx: CanvasRenderingContext2D, w: number, h: number, dark: number, lights: [number, number, number][], tint = '#0a0c24') {
  if (dark <= 0.01) return;
  if (!lightCv) lightCv = document.createElement('canvas');
  if (lightCv.width !== w || lightCv.height !== h) {
    lightCv.width = w;
    lightCv.height = h;
  }
  const l = lightCv.getContext('2d')!;
  l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, w, h);
  l.fillStyle = tint;
  l.globalAlpha = dark;
  l.fillRect(0, 0, w, h);
  l.globalAlpha = 1;
  l.globalCompositeOperation = 'destination-out';
  for (const [x, y, r] of lights) {
    if (x < -r || x > w + r || y < -r || y > h + r) continue;
    const g = l.createRadialGradient(x, y, r * 0.15, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    l.fillStyle = g;
    l.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.drawImage(lightCv, 0, 0);
}

/** Default time of day for a theme. */
export const themeTime = (theme: ThemeId): TimeOfDay => (theme === 'night' ? 'night' : theme === 'cave' ? 'night' : theme === 'palace' ? 'sunset' : 'day');
