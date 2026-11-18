/**
 * Animated backdrops for Esther's challenges: the shared parallax scenery of
 * the platform stages (Susa, the gardens, the palace halls) with a floor and
 * characters from the official sprite rig. Whoever speaks in the story dialog
 * plays the talking animation; sad or stern lines change their pose.
 */
import { drawBackdrop } from '../platform/sky';
import { ANIMS, drawChar, type Anim, type CastId } from '../platform/rig';
import type { ThemeId, TimeOfDay } from '../platform/level';
import { speaker } from '../pixel/speaker';
import { useStage } from '../pixel/stage';

export interface Actor {
  id: CastId;
  /** Position across the view, 0..1. */
  x: number;
  left?: boolean;
  anim?: Anim;
  /** Speaker key in the story dialog (ESPEAK) that animates this actor. */
  who?: string;
}

const FLOOR: Record<string, [string, string, string]> = {
  persia: ['#c8a878', '#a88a5a', '#2a5ab0'],
  garden: ['#4a9a3a', '#d8ccb0', '#3a7a2e'],
  susa: ['#c8b498', '#8a7458', '#7a2a5a'],
};

function paintFloor(ctx: CanvasRenderingContext2D, w: number, theme: ThemeId, y: number) {
  const [a, b, c] = FLOOR[theme] ?? FLOOR.persia;
  ctx.fillStyle = a;
  ctx.fillRect(0, y, w, 180 - y);
  if (theme === 'garden') {
    ctx.fillStyle = b;
    ctx.fillRect(0, y + 4, w, 9);
    ctx.fillStyle = c;
    for (let x = 0; x < w; x += 6) ctx.fillRect(x, y, 2, 2 + ((x * 7) % 3));
    ctx.fillStyle = '#a89a80';
    for (let x = 0; x < w; x += 14) ctx.fillRect(x, y + 4, 1, 9);
  } else {
    ctx.fillStyle = b;
    for (let x = 0; x < w; x += 16) ctx.fillRect(x, y, 1, 180 - y);
    ctx.fillRect(0, y + 8, w, 1);
    ctx.fillStyle = c;
    ctx.fillRect(0, y, w, 2);
    if (theme === 'susa')
      for (let x = 4; x < w; x += 16) {
        ctx.fillStyle = '#e8b830';
        ctx.fillRect(x + 2, y + 3, 3, 3);
      }
  }
}

const POSE: Record<string, Anim> = { sad: 'sad', stern: 'brave', facepalm: 'surprise', happy: 'talk', neutral: 'talk' };

/** Draw actors on a floor line (used by the scene hook and by custom canvases). */
export function drawActors(ctx: CanvasRenderingContext2D, w: number, actors: Actor[], t: number, floorY: number) {
  const sp = speaker();
  for (const a of actors) {
    const talking = sp && a.who && sp.who === a.who;
    const anim: Anim = talking ? POSE[sp!.mood ?? 'neutral'] : (a.anim ?? 'idle');
    const spec = ANIMS[anim];
    const i = spec.loop ? Math.floor(t * spec.fps + a.x * 7) % spec.frames : Math.min(spec.frames - 1, Math.floor(t * spec.fps));
    drawChar(ctx, a.id, anim, i, a.x * w, floorY, a.left);
  }
}

/** Torches on the walls (warm light pools), for halls and night scenes. */
export function drawTorches(ctx: CanvasRenderingContext2D, w: number, t: number, xs = [0.08, 0.92], y = 60) {
  for (const f of xs) {
    const x = f * w;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 46);
    g.addColorStop(0, 'rgba(255,190,90,0.38)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 46, y - 46, 92, 92);
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(x - 2, y + 4, 4, 9);
    ctx.fillStyle = '#ff8a2a';
    ctx.fillRect(x - 2, y - 2 + Math.sin(t * 12 + x), 4, 6);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(x - 1, y, 2, 3);
  }
}

/**
 * Canvas stage for a challenge: scenery, floor and actors, then `extra` on top.
 * `time` night adds torches.
 */
export function useEstherScene(theme: ThemeId, time: TimeOfDay, actors: Actor[] | (() => Actor[]), extra?: (ctx: CanvasRenderingContext2D, w: number, dt: number, t: number) => void, floorY = 158) {
  return useStage((ctx, w, dt, t) => {
    drawBackdrop(ctx, w, 180, theme, time, t, 120 + Math.sin(t * 0.05) * 30);
    if (time === 'night' || theme === 'susa') drawTorches(ctx, w, t);
    if (time === 'night') {
      ctx.fillStyle = 'rgba(10,12,40,0.25)';
      ctx.fillRect(0, 0, w, 180);
    }
    paintFloor(ctx, w, theme, floorY);
    drawActors(ctx, w, typeof actors === 'function' ? actors() : actors, t, floorY);
    extra?.(ctx, w, dt, t);
  });
}
