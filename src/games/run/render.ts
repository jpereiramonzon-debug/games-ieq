/**
 * Colour renderer for Corrida da Fé: 16-bit style scenery per stage, shaded
 * obstacles with a dark outline, and Jesus drawn with the shared character kit.
 */
import { drawPerson, LOOKS, shade } from '../pixel/person';
import { drawChar } from '../platform/rig';
import { drawGround, drawScene, ENDLESS_ORDER, ENDLESS_SPAN, type SceneId } from './scenes';
import { GROUND, H, type Ent, type World } from './levels';
import * as SP from './sprites';

type Colors = { x: string; m?: string; l?: string };

const SPRITE_COLORS: Record<string, Colors> = {
  rock: { x: '#4a3a2c', m: '#8a7a66', l: '#bcab92' },
  thorn: { x: '#3e4a20', m: '#6a7a34', l: '#9aaa50' },
  jar: { x: '#5a2814', m: '#9a4a22', l: '#d0783e' },
  snake: { x: '#2e6224', l: '#f0d060' },
  bird: { x: '#23232e', l: '#f0c040' },
  goat: { x: '#7a6650', l: '#f4ecdc' },
  wave: { x: '#1c4878', m: '#4a8ac4', l: '#c8eaf8' },
  fish: { x: '#34485a', l: '#cfdfe8' },
  bread: { x: '#5e3010', m: '#c0782c', l: '#eab866' },
  dove: { x: '#6a6a78', l: '#ffffff' },
  halo: { x: '#a87808', l: '#ffe266' },
  staff: { x: '#6a4420' },
  cloud: { x: '#d4e2ea', l: '#ffffff' },
};

function drawC(ctx: CanvasRenderingContext2D, sprite: SP.Sprite, x: number, y: number, c: Colors, dim = 0) {
  const map: Record<string, string | undefined> = {
    x: dim ? shade(c.x, -dim) : c.x,
    m: c.m && (dim ? shade(c.m, -dim) : c.m),
    l: c.l && (dim ? shade(c.l, -dim) : c.l),
  };
  for (let j = 0; j < sprite.length; j++) {
    const row = sprite[j];
    for (let i = 0; i < row.length; i++) {
      const col = map[row[i]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
    }
  }
}

interface Theme {
  sky: string[];
  far: string;
  farD: string;
  ground: string;
  groundD: string;
  groundL: string;
  dim: number; // darken sprites (night)
}

const THEMES: Record<string, Theme> = {
  desert: { sky: ['#8ccbe2', '#a8d8ea', '#c4e4ee', '#ddeef0'], far: '#d6bc86', farD: '#b89a64', ground: '#e6cb8e', groundD: '#c8a666', groundL: '#f2dca6', dim: 0 },
  sea: { sky: ['#86c6e6', '#a2d4ec', '#bfe2f0', '#d8eef4'], far: '#8aa874', farD: '#6c8a5a', ground: '#3c7cb2', groundD: '#2c5e8e', groundL: '#e8f4f8', dim: 0 },
  olives: { sky: ['#94cee4', '#addaeb', '#c6e6ef', '#dceff2'], far: '#86a466', farD: '#66844c', ground: '#b4a868', groundD: '#8e8448', groundL: '#ccc282', dim: 0 },
  jerusalem: { sky: ['#141a36', '#1c2446', '#26305a', '#323e6e'], far: '#3a3a5c', farD: '#2a2a46', ground: '#6a6272', groundD: '#4c4656', groundL: '#847c8c', dim: 0.32 },
  nazare: { sky: [], far: '', farD: '', ground: '#c8a874', groundD: '#a88a5a', groundL: '#e0c898', dim: 0 },
  cafarnaum: { sky: [], far: '', farD: '', ground: '#5a5a60', groundD: '#3e3e44', groundL: '#8a8a92', dim: 0 },
};
const themeOf = (w: World) => THEMES[w.id] ?? THEMES.desert;

export interface View {
  world: World;
  cam: number;
  time: number;
  ents: Ent[];
  viewW: number;
  player: { feet: number; grounded: boolean; ducking: boolean; dead: boolean; dove: boolean; halo: boolean; staff: boolean; blink: boolean; x: number };
  pops: { x: number; y: number; t: number; text: string }[];
}

function drawJesus(ctx: CanvasRenderingContext2D, p: View['player'], time: number) {
  const step = p.grounded ? Math.floor(time * 10) % 4 : 1;
  const x = p.x + 8;
  if (p.ducking && p.grounded) {
    // Crouch: the rig's low reaching pose.
    ctx.fillStyle = 'rgba(40, 24, 10, 0.25)';
    ctx.fillRect(Math.round(x) - 7, Math.round(p.feet) - 1, 14, 2);
    drawChar(ctx, 'jesus', 'pickup', 1, x, p.feet);
    return;
  }
  if (!p.dead) {
    ctx.fillStyle = 'rgba(40, 24, 10, 0.25)';
    ctx.fillRect(Math.round(x) - 7, Math.round(p.feet) - 1, 14, 2);
    drawChar(ctx, 'jesus', p.grounded ? 'run' : 'jump', p.grounded ? Math.floor(time * 15) : 1, x, p.feet);
    return;
  }
  drawPerson(ctx, LOOKS.jesus, x, p.feet, 'right', p.dead ? 1 : step, true);
}

function drawBox(ctx: CanvasRenderingContext2D, x: number, y: number, used: boolean, dim: number) {
  const d = (c: string) => (dim ? shade(c, -dim) : c);
  ctx.fillStyle = d('#3e240e');
  ctx.fillRect(x, y, 14, 13);
  ctx.fillStyle = d(used ? '#8a7258' : '#c08a4a');
  ctx.fillRect(x + 1, y + 1, 12, 11);
  ctx.fillStyle = d(used ? '#6e5a44' : '#9a6a36');
  ctx.fillRect(x + 1, y + 6, 12, 1);
  ctx.fillRect(x + 12, y + 1, 1, 11);
  if (!used) {
    ctx.fillStyle = d('#ffe066');
    ctx.fillRect(x + 6, y + 2, 2, 9);
    ctx.fillRect(x + 3, y + 4, 8, 2);
    ctx.fillStyle = d('#b8860b');
    ctx.fillRect(x + 7, y + 3, 1, 8);
  }
}

export function renderRun(ctx: CanvasRenderingContext2D, v: View) {
  const th = themeOf(v.world);
  const W = v.viewW;
  const cam = v.cam;
  // Scenery of the place (several parallax layers) and its ground.
  const pits = v.ents.filter((e) => e.kind === 'pit' && e.x < cam + W && e.x + e.w > cam);
  if (v.world.length === 0) {
    // Endless: the places follow one another, crossfading at each change.
    const n = ENDLESS_ORDER.length;
    const seg = Math.floor(cam / ENDLESS_SPAN);
    const a = ENDLESS_ORDER[((seg % n) + n) % n];
    const b = ENDLESS_ORDER[(((seg + 1) % n) + n) % n];
    const into = cam - seg * ENDLESS_SPAN;
    const fade = Math.max(0, Math.min(1, (into - (ENDLESS_SPAN - 300)) / 300));
    drawScene(ctx, a, W, cam, v.time);
    if (fade > 0) drawScene(ctx, b, W, cam, v.time, fade);
    const edge = (seg + 1) * ENDLESS_SPAN - cam;
    drawGround(ctx, a, W, cam, v.time);
    if (edge < W) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(edge, GROUND - 2, W - edge, H - GROUND + 2);
      ctx.clip();
      drawGround(ctx, b, W, cam, v.time);
      ctx.restore();
    }
  } else {
    const id = v.world.id as SceneId;
    drawScene(ctx, id, W, cam, v.time);
    drawGround(ctx, id, W, cam, v.time);
  }
  // Pits: a dark gap with crumbling edges.
  for (const e of pits) {
    const x0 = Math.max(0, Math.round(e.x - cam));
    const x1 = Math.min(W, Math.round(e.x + e.w - cam));
    if (x1 <= x0) continue;
    const g = ctx.createLinearGradient(0, GROUND, 0, H);
    g.addColorStop(0, shade(th.groundD, -0.5));
    g.addColorStop(1, '#0a0806');
    ctx.fillStyle = g;
    ctx.fillRect(x0, GROUND, x1 - x0, H - GROUND);
    ctx.fillStyle = shade(th.groundD, -0.2);
    for (const ex of [Math.round(e.x - cam), Math.round(e.x + e.w - cam) - 2]) if (ex >= 0 && ex < W) ctx.fillRect(ex, GROUND, 2, 6);
  }
  // Things.
  const dim = th.dim;
  for (const e of v.ents) {
    const x = e.x - cam;
    if (x > W + 20 || x + e.w < -20 || e.taken) continue;
    if (e.dead !== undefined) {
      if (v.time - e.dead > 0.4) continue;
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1 - (v.time - e.dead) / 0.4;
      ctx.fillRect(Math.round(x), Math.round(e.y + e.h - 3), e.w, 3);
      ctx.globalAlpha = 1;
      continue;
    }
    const f = Math.floor(v.time * 6) % 2;
    switch (e.kind) {
      case 'rock':
        drawC(ctx, SP.ROCK, x, e.y, SPRITE_COLORS.rock, dim);
        break;
      case 'thorn':
        drawC(ctx, SP.THORN, x, e.y, SPRITE_COLORS.thorn, dim);
        break;
      case 'jar':
        drawC(ctx, SP.JAR, x, e.y, SPRITE_COLORS.jar, dim);
        break;
      case 'snake':
        drawC(ctx, SP.SNAKE[f], x, e.y - 1, SPRITE_COLORS.snake, dim);
        break;
      case 'bird':
        drawC(ctx, SP.BIRD[f], x, e.y - 2, SPRITE_COLORS.bird);
        break;
      case 'goat':
        drawC(ctx, SP.GOAT[f], x, e.y - 1, SPRITE_COLORS.goat, dim);
        break;
      case 'wave':
        drawC(ctx, SP.WAVE, x, e.y, SPRITE_COLORS.wave);
        break;
      case 'fish':
        if (e.y < GROUND) drawC(ctx, SP.FISH, x, e.y, SPRITE_COLORS.fish);
        break;
      case 'bread':
        drawC(ctx, SP.BREAD, x, e.y + Math.round(Math.sin(v.time * 4 + e.x)), SPRITE_COLORS.bread, dim * 0.5);
        break;
      case 'fishItem':
        drawC(ctx, SP.FISH_ITEM, x, e.y, SPRITE_COLORS.fish);
        break;
      case 'dove':
        drawC(ctx, SP.DOVE, x, e.y + Math.round(Math.sin(v.time * 5) * 2), SPRITE_COLORS.dove);
        break;
      case 'halo':
        drawC(ctx, SP.HALO, x, e.y + Math.round(Math.sin(v.time * 5) * 2), SPRITE_COLORS.halo);
        break;
      case 'staff':
        drawC(ctx, SP.STAFF, x, e.y - 6, SPRITE_COLORS.staff);
        break;
      case 'box':
        drawBox(ctx, Math.round(x), e.y, !!e.used, dim);
        break;
      case 'ledge': {
        const leafy = v.world.id === 'olives';
        ctx.fillStyle = shade(leafy ? '#3e5a24' : '#4a2c14', -dim);
        ctx.fillRect(Math.round(x), e.y, e.w, 4);
        ctx.fillStyle = shade(leafy ? '#6a8e3a' : '#b07a40', -dim);
        ctx.fillRect(Math.round(x) + 1, e.y + 1, e.w - 2, 2);
        if (leafy) {
          ctx.fillStyle = shade('#8aae4a', -dim);
          for (let i = 2; i < e.w - 2; i += 5) ctx.fillRect(Math.round(x) + i, e.y - 1, 2, 2);
        }
        break;
      }
      case 'trunk':
        ctx.fillStyle = '#3a2412';
        ctx.fillRect(Math.round(x) - 1, e.y, e.w + 2, e.h);
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(Math.round(x), e.y, e.w, e.h);
        ctx.fillStyle = '#9a6e44';
        ctx.fillRect(Math.round(x) + 1, e.y + 2, 2, e.h - 4);
        break;
      case 'hull': {
        const X = Math.round(x);
        ctx.fillStyle = '#3a2412';
        ctx.beginPath();
        ctx.moveTo(X - 1, e.y - 1);
        ctx.lineTo(X + e.w + 1, e.y - 1);
        ctx.lineTo(X + e.w - 5, e.y + e.h + 1);
        ctx.lineTo(X + 5, e.y + e.h + 1);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#9a6234';
        ctx.beginPath();
        ctx.moveTo(X, e.y);
        ctx.lineTo(X + e.w, e.y);
        ctx.lineTo(X + e.w - 6, e.y + e.h);
        ctx.lineTo(X + 6, e.y + e.h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c08a4a';
        ctx.fillRect(X + 3, e.y + 2, e.w - 6, 2);
        ctx.fillStyle = '#5a3a1e';
        ctx.fillRect(X + e.w / 2, e.y - 22, 1, 22);
        ctx.fillStyle = '#f2ead6';
        ctx.fillRect(X + e.w / 2 + 1, e.y - 20, 12, 14);
        ctx.fillStyle = '#d8ccb0';
        ctx.fillRect(X + e.w / 2 + 1, e.y - 8, 12, 2);
        break;
      }
      case 'goal': {
        const X = Math.round(x);
        ctx.fillStyle = shade('#5a4632', -dim);
        ctx.fillRect(X - 3, e.y - 5, 36, e.h + 5);
        ctx.fillStyle = shade('#c8ac7c', -dim);
        ctx.fillRect(X - 2, e.y - 4, 34, e.h + 4);
        ctx.fillStyle = shade('#a88c5e', -dim);
        for (let r = 0; r < e.h; r += 6) ctx.fillRect(X - 2, e.y + r, 34, 1);
        ctx.fillStyle = shade('#3a2a1c', -dim * 0.5);
        ctx.fillRect(X + 7, e.y + 10, 16, e.h - 10);
        ctx.fillRect(X + 9, e.y + 7, 12, 3);
        ctx.fillStyle = '#4a2c14';
        ctx.fillRect(X + 15, e.y - 22, 1, 18);
        ctx.fillStyle = '#c8321f';
        ctx.fillRect(X + 16, e.y - 22, 10, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(X + 20, e.y - 21, 2, 4);
        break;
      }
    }
  }
  // Jesus and power-ups.
  const p = v.player;
  if (p.halo) {
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(v.time * 20);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(p.x - 2, p.feet - 28, 20, 30);
    ctx.globalAlpha = 1;
    drawC(ctx, SP.HALO, p.x + 3, p.feet - 32, SPRITE_COLORS.halo);
  }
  if (!p.blink) drawJesus(ctx, p, v.time);
  if (p.staff) drawC(ctx, SP.STAFF, p.x + 15, p.feet - 20, SPRITE_COLORS.staff);
  if (p.dove) drawC(ctx, SP.DOVE, p.x + 3 + Math.round(Math.sin(v.time * 6) * 2), p.feet - 38, SPRITE_COLORS.dove);
  // Score pops.
  ctx.font = '7px monospace';
  for (const q of v.pops) {
    const y = Math.round(q.y - (v.time - q.t) * 20);
    ctx.fillStyle = '#3a2414';
    ctx.fillText(q.text, Math.round(q.x - cam) + 1, y + 1);
    ctx.fillStyle = '#ffe066';
    ctx.fillText(q.text, Math.round(q.x - cam), y);
  }
}
