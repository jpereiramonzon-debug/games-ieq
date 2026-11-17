import { bindCast, lookFrame } from '../platform/rig';

/**
 * 16-bit style characters, drawn from a "look" (colours + hair/beard/headwear)
 * in four directions with a walk cycle. Each frame is painted once into a small
 * offscreen canvas, outlined, shaded and cached.
 */

export type Dir = 'down' | 'up' | 'left' | 'right';

export interface Look {
  skin: string;
  hair: string;
  robe: string;
  /** Sash, belt or trim colour. */
  trim?: string;
  /** Diagonal sash across the chest (Jesus). */
  sash?: boolean;
  beard?: boolean;
  /** Head covering: a cloth over the hair, or a turban. */
  head?: 'hair' | 'long' | 'veil' | 'turban' | 'hood' | 'crown' | 'helmet' | 'curly' | 'braids' | 'bald';
  /** Sleeveless: arms show skin (strong men). */
  bare?: boolean;
  /** Open cloak worn over the robe. */
  cloak?: string;
  headColor?: string;
  /** Bandages over the eyes (the blind man) or the arms (the leper). */
  bandage?: 'eyes' | 'arms';
  /** Glowing eyes for the tempter. */
  glow?: string;
}

/** Size of the old sprites (kept for layouts that still use it). */
export const W = 18;
export const H = 30;

export const LOOKS = {
  jesus: { skin: '#d89a68', hair: '#4a2a14', robe: '#e6dcc4', cloak: '#2e5a62', trim: '#7a5a34', sash: true, beard: true, head: 'long' } as Look,
  peter: { skin: '#c08058', hair: '#2e2a28', robe: '#2e5a5e', trim: '#a88a5a', beard: true, head: 'curly' } as Look,
  boy: { skin: '#e8b07a', hair: '#3a2416', robe: '#9a7a4a', trim: '#5e4428', head: 'hair' } as Look,
  merchant: { skin: '#d49058', hair: '#2e2018', robe: '#7a3a8a', trim: '#e0b040', beard: true, head: 'turban', headColor: '#e8d8a8' } as Look,
  woman: { skin: '#e0a070', hair: '#3a2010', robe: '#a84a3a', trim: '#e8d0a0', head: 'veil', headColor: '#d8c8a0' } as Look,
  elder: { skin: '#d8a070', hair: '#d8d0c0', robe: '#6a7a5a', trim: '#4a3a28', beard: true, head: 'hair' } as Look,
  villager: { skin: '#c88a58', hair: '#2a1a10', robe: '#c8a060', trim: '#7a5a30', beard: true, head: 'hair' } as Look,
  blind: { skin: '#d49a64', hair: '#5a4a3a', robe: '#8a8070', trim: '#5a5040', beard: true, head: 'hair', bandage: 'eyes' } as Look,
  leper: { skin: '#c8a888', hair: '#6a6050', robe: '#9a9488', trim: '#6a645a', head: 'hood', headColor: '#7a7468', bandage: 'arms' } as Look,
  tempter: { skin: '#5a4a6a', hair: '#1a1424', robe: '#2a2236', trim: '#6a2a3a', head: 'hood', headColor: '#2a2236', glow: '#ff5a3a' } as Look,
};

/** Darken (amount < 0) or lighten a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  return `#${[n >> 16, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Get (and cache) a frame. `step` 0..3 is the walk cycle. Every character in
 * the project is now drawn by the chibi rig (platform/rig.ts), so the
 * mini-games, the missions and the platform stages share one pixel style.
 * Frames are 36×44 with the feet at (18, 42).
 */
export function personFrame(look: Look, dir: Dir, step: number, run = false): HTMLCanvasElement {
  return lookFrame(look, dir, step, run);
}

/** Draw a character with its feet at (x, y) and a soft shadow. */
export function drawPerson(ctx: CanvasRenderingContext2D, look: Look, x: number, y: number, dir: Dir, step = 0, run = false) {
  ctx.fillStyle = 'rgba(40, 24, 10, 0.25)';
  ctx.fillRect(Math.round(x) - 7, Math.round(y) - 1, 14, 2);
  ctx.fillRect(Math.round(x) - 5, Math.round(y) - 2, 10, 4);
  ctx.drawImage(personFrame(look, dir, step, run), Math.round(x) - 18, Math.round(y) - 43);
}

// Official sprites (platform/rig) for the main characters.
bindCast(LOOKS.jesus, 'jesus');
bindCast(LOOKS.peter, 'pedro');
bindCast(LOOKS.tempter, 'tentador');
