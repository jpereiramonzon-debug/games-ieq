/**
 * Chibi 16-bit character rig. Every frame is rasterised from the same
 * skeleton (legs, torso, arms, big head) and the same palette, so a character
 * looks identical in all of its animations: only the pose changes.
 *
 * Frames are 36×44 px, feet pivot at (18, 42), drawn facing right (left is a
 * mirror). Each part is shaded (lit from the top-left), parts get coloured
 * contours where they overlap, and the whole figure gets a selective outline.
 */

export const FW = 36;
export const FH = 44;
export const PIVOT_X = 18;
export const PIVOT_Y = 42;

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (c: RGB, t: RGB, k: number): RGB => [c[0] + (t[0] - c[0]) * k, c[1] + (t[1] - c[1]) * k, c[2] + (t[2] - c[2]) * k];
const light = (c: RGB, k: number) => mix(c, [255, 248, 230], k);
const dark = (c: RGB, k: number) => mix(c, [24, 12, 20], k);

export interface CharSpec {
  skin: string;
  hair: string;
  hairStyle: 'curly' | 'long' | 'wavy' | 'short' | 'bald' | 'none' | 'flow';
  beard?: 'short' | 'long';
  tunic: string;
  sleeve: 'short' | 'long' | 'none';
  belt: string;
  sandal?: string;
  /** Wider torso and thicker bare arms. */
  build?: 'strong' | 'slim';
  /** Robe that reaches the ankles. */
  robe?: boolean;
  /** Open coat/cloak worn over the tunic; several colours make vertical stripes. */
  coat?: string[];
  /** Diagonal sash across the chest. */
  sash?: string;
  head?: 'helmet' | 'crown' | 'hood' | 'veil' | 'turban' | 'tiara' | 'kidaris';
  /** Feminine face: lashes and coloured lips. */
  fem?: boolean;
  headColor?: string;
  /** Glowing eyes (the tempter). */
  glow?: string;
  /** Bandage over the eyes (the blind man). */
  bandage?: 'eyes' | 'arms';
  props?: ('sling' | 'bag' | 'keys' | 'chains' | 'staff' | 'spear' | 'shield' | 'harp' | 'collar' | 'bracers' | 'scepter' | 'earrings' | 'scroll' | 'bow')[];
  cape?: string;
}

// ------------------------------------------------------------------ cast

export const CAST = {
  davi: { skin: '#eaa978', hair: '#6a3a1c', hairStyle: 'curly', tunic: '#ece0c4', sleeve: 'short', belt: '#6a4424', props: ['sling', 'bag'] },
  daviRei: {
    skin: '#eaa978',
    hair: '#6a3a1c',
    hairStyle: 'curly',
    beard: 'short',
    tunic: '#ece0c4',
    sleeve: 'short',
    belt: '#6a4424',
    head: 'crown',
    headColor: '#f0c030',
    cape: '#b02a2a',
    props: ['harp'],
  },
  sansao: { skin: '#c87848', hair: '#4a2a12', hairStyle: 'long', beard: 'short', tunic: '#e0d0a8', sleeve: 'none', belt: '#5a3a1e', build: 'strong', props: ['chains', 'bracers'] },
  pedro: { skin: '#e2a272', hair: '#a8a8b4', hairStyle: 'wavy', beard: 'short', tunic: '#ece0c4', sleeve: 'long', belt: '#8a6234', coat: ['#2e5aa0'], props: ['keys'] },
  jose: {
    skin: '#eaa978',
    hair: '#6a3a1c',
    hairStyle: 'wavy',
    tunic: '#f2eee2',
    sleeve: 'long',
    belt: '#6a4424',
    coat: ['#d8382a', '#f09a20', '#f0d040', '#3aa04a', '#2a6ad8', '#8a3ab8'],
  },
  joseServo: { skin: '#c8885a', hair: '#1e140c', hairStyle: 'short', beard: 'short', tunic: '#ece6d4', sleeve: 'short', belt: '#6a4424', sash: '#d8ccb0', props: ['keys'] },
  joseGov: { skin: '#c8885a', hair: '#1e140c', hairStyle: 'bald', tunic: '#f6f2e8', sleeve: 'short', belt: '#e0b030', robe: true, props: ['collar', 'bracers'] },
  jesus: { skin: '#e2a272', hair: '#5a3418', hairStyle: 'long', beard: 'short', tunic: '#f6f2e8', sleeve: 'long', belt: '#c0302a', robe: true, sash: '#c0302a' },
  noe: { skin: '#dca070', hair: '#ece8e0', hairStyle: 'wavy', beard: 'long', tunic: '#8a6a4a', sleeve: 'long', belt: '#c8a870', robe: true, props: ['staff'] },
  soldado: {
    skin: '#c88a5a',
    hair: '#2a1a10',
    hairStyle: 'short',
    beard: 'short',
    tunic: '#a83a2a',
    sleeve: 'short',
    belt: '#5a3a1e',
    head: 'helmet',
    headColor: '#c89a40',
    props: ['spear', 'shield'],
  },
  romano: {
    skin: '#d8a070',
    hair: '#2a1a10',
    hairStyle: 'short',
    tunic: '#b8302a',
    sleeve: 'short',
    belt: '#6a4a2a',
    head: 'helmet',
    headColor: '#a8aab8',
    props: ['spear', 'shield'],
  },
  guarda: { skin: '#a8703e', hair: '#1a120a', hairStyle: 'bald', tunic: '#ece6d4', sleeve: 'none', belt: '#3a7ab0', head: 'helmet', headColor: '#3a6ab0', props: ['spear'] },
  irmao: { skin: '#c8885a', hair: '#3a2214', hairStyle: 'short', beard: 'short', tunic: '#8a6a3a', sleeve: 'short', belt: '#4a3018', props: ['staff'] },
  tentador: {
    skin: '#4a3a5a',
    hair: '#1a1424',
    hairStyle: 'none',
    tunic: '#2a2236',
    sleeve: 'long',
    belt: '#2a2236',
    robe: true,
    head: 'hood',
    headColor: '#2a2236',
    glow: '#ff5a3a',
  },
  aldeao: { skin: '#d49a68', hair: '#2a1a10', hairStyle: 'short', beard: 'short', tunic: '#c8a060', sleeve: 'long', belt: '#7a5a30', head: 'turban', headColor: '#e8dcc0' },
  mulher: { skin: '#e0a070', hair: '#3a2010', hairStyle: 'long', tunic: '#a84a3a', sleeve: 'long', belt: '#e8d0a0', robe: true, head: 'veil', headColor: '#d8c8a0' },
  anciao: { skin: '#d8a070', hair: '#e0dcd0', hairStyle: 'short', beard: 'long', tunic: '#6a7a5a', sleeve: 'long', belt: '#4a3a28', robe: true, props: ['staff'] },
  menino: { skin: '#eaa978', hair: '#3a2416', hairStyle: 'short', tunic: '#9a7a4a', sleeve: 'short', belt: '#5e4428', build: 'slim' },
  // Jonathan, son of Saul and David's friend (1 Samuel 18-20).
  jonatas: {
    skin: '#e2a272',
    hair: '#3a2214',
    hairStyle: 'wavy',
    beard: 'short',
    tunic: '#2e6ab0',
    sleeve: 'short',
    belt: '#e0b030',
    coat: ['#7a2a3a'],
    sash: '#e0b030',
    head: 'crown',
    headColor: '#d8a830',
    props: ['bow'],
  },
  // Book of Esther.
  ester: { skin: '#e2a272', hair: '#24140e', hairStyle: 'flow', fem: true, tunic: '#5a6ab8', sleeve: 'long', belt: '#e0b030', robe: true, sash: '#e8d8b0', build: 'slim', props: ['earrings'] },
  esterRainha: {
    skin: '#e2a272',
    hair: '#24140e',
    hairStyle: 'flow',
    fem: true,
    tunic: '#6a2a7a',
    sleeve: 'long',
    belt: '#f0c030',
    robe: true,
    sash: '#2a4a9a',
    cape: '#8a1e3a',
    build: 'slim',
    head: 'tiara',
    headColor: '#f0c030',
    props: ['earrings'],
  },
  mordecai: { skin: '#d8a070', hair: '#5a5250', hairStyle: 'short', beard: 'long', tunic: '#3a5a8a', sleeve: 'long', belt: '#c8a870', robe: true, head: 'turban', headColor: '#e8e0cc', props: ['scroll'] },
  assuero: {
    skin: '#d49a68',
    hair: '#1a120a',
    hairStyle: 'wavy',
    beard: 'long',
    tunic: '#7a2a8a',
    sleeve: 'long',
    belt: '#f0c030',
    robe: true,
    sash: '#f0c030',
    cape: '#2a3a8a',
    head: 'kidaris',
    headColor: '#f0c030',
    props: ['scepter'],
  },
  hama: { skin: '#c8885a', hair: '#0e0a08', hairStyle: 'short', beard: 'long', tunic: '#5a1e1e', sleeve: 'long', belt: '#c8a040', robe: true, sash: '#1e1a24', head: 'turban', headColor: '#8a1e2a' },
  hegai: { skin: '#b87a4a', hair: '#1a120a', hairStyle: 'bald', tunic: '#e8dcc4', sleeve: 'long', belt: '#3a8a8a', robe: true, sash: '#3a8a8a', props: ['keys'] },
  persa: { skin: '#c8885a', hair: '#1a120a', hairStyle: 'short', beard: 'short', tunic: '#2a5a9a', sleeve: 'long', belt: '#e0b030', head: 'helmet', headColor: '#e0b030', props: ['spear', 'shield'] },
  serva: { skin: '#d8a070', hair: '#2a1a10', hairStyle: 'long', fem: true, tunic: '#c8a868', sleeve: 'long', belt: '#8a4a2a', robe: true, head: 'veil', headColor: '#e8dcc0' },
} satisfies Record<string, CharSpec>;
export type CastId = keyof typeof CAST;

// ------------------------------------------------------------------ raster

class Mask {
  m = new Uint8Array(FW * FH);
  has(x: number, y: number) {
    return x >= 0 && y >= 0 && x < FW && y < FH && this.m[y * FW + x] === 1;
  }
  set(x: number, y: number) {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < FW && y < FH) this.m[y * FW + x] = 1;
  }
  clear(x: number, y: number) {
    if (x >= 0 && y >= 0 && x < FW && y < FH) this.m[y * FW + x] = 0;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++)
      for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) this.set(x, y);
    return this;
  }
  disc(cx: number, cy: number, r: number) {
    return this.ellipse(cx, cy, r, r);
  }
  capsule(x0: number, y0: number, x1: number, y1: number, r: number) {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) this.disc(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r);
    return this;
  }
  rect(x: number, y: number, w: number, h: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j);
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) this.set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n);
    return this;
  }
  poly(pts: [number, number][]) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + 0.5;
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i];
        const [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y);
    }
    return this;
  }
  /** Keep only the pixels for which f is true. */
  filter(f: (x: number, y: number) => boolean) {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (this.m[y * FW + x] && !f(x, y)) this.m[y * FW + x] = 0;
    return this;
  }
  copy() {
    const c = new Mask();
    c.m.set(this.m);
    return c;
  }
}

class Frame {
  px = new Float32Array(FW * FH * 4);
  fx: [number, number, RGB, number][] = [];
  op(x: number, y: number) {
    return x >= 0 && y >= 0 && x < FW && y < FH && this.px[(y * FW + x) * 4 + 3] > 0;
  }
  get(x: number, y: number): RGB {
    const i = (y * FW + x) * 4;
    return [this.px[i], this.px[i + 1], this.px[i + 2]];
  }
  put(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= FW || y >= FH) return;
    const i = (y * FW + x) * 4;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
    this.px[i + 3] = 255;
  }
  /** Paint a part: shaded, with a coloured contour where it overlaps what is already drawn. */
  paint(m: Mask, color: string | ((x: number, y: number) => string), o: { shade?: number; contour?: boolean } = {}) {
    const shade = o.shade ?? 1;
    const under = new Uint8Array(FW * FH);
    for (let i = 0; i < FW * FH; i++) under[i] = this.px[i * 4 + 3] > 0 ? 1 : 0;
    for (let y = 0; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        if (!m.has(x, y)) continue;
        let c = hex(typeof color === 'string' ? color : color(x, y));
        if (shade) {
          if (!m.has(x, y - 1) || !m.has(x - 1, y)) c = light(c, 0.22 * shade);
          else if (!m.has(x + 1, y) || !m.has(x, y + 1) || !m.has(x + 1, y + 1)) c = dark(c, 0.28 * shade);
        }
        if (o.contour) {
          const edge = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dx, dy]) => !m.has(x + dx, y + dy) && under[(y + dy) * FW + x + dx] === 1 && x + dx >= 0 && x + dx < FW);
          if (edge) c = dark(c, 0.5);
        }
        this.put(x, y, c);
      }
  }
  dot(x: number, y: number, c: string) {
    this.put(Math.round(x), Math.round(y), hex(c));
  }
  /** Glow and sparkles: drawn after the outline, semi-transparent. */
  glow(x: number, y: number, c: string, a = 200) {
    this.fx.push([Math.round(x), Math.round(y), hex(c), a]);
  }
  outline() {
    const add: [number, number, RGB][] = [];
    for (let y = 0; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        if (this.op(x, y)) continue;
        let best: RGB | null = null;
        let lum = 1e9;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ])
          if (this.op(x + dx, y + dy)) {
            const c = this.get(x + dx, y + dy);
            const l = c[0] + c[1] + c[2];
            if (l < lum) {
              lum = l;
              best = c;
            }
          }
        if (best) add.push([x, y, dark(best, 0.72)]);
      }
    for (const [x, y, c] of add) this.put(x, y, c);
  }
  toImageData() {
    const d = new ImageData(FW, FH);
    for (let i = 0; i < FW * FH * 4; i++) d.data[i] = this.px[i];
    for (const [x, y, c, a] of this.fx) {
      if (x < 0 || y < 0 || x >= FW || y >= FH) continue;
      const i = (y * FW + x) * 4;
      const k = a / 255;
      const ba = d.data[i + 3] / 255;
      d.data[i] = c[0] * k + d.data[i] * (1 - k) * ba;
      d.data[i + 1] = c[1] * k + d.data[i + 1] * (1 - k) * ba;
      d.data[i + 2] = c[2] * k + d.data[i + 2] * (1 - k) * ba;
      d.data[i + 3] = Math.min(255, a + d.data[i + 3] * (1 - k));
    }
    return d;
  }
}

// ------------------------------------------------------------------ poses

export type Expr = 'neutral' | 'happy' | 'hurt' | 'focus' | 'closed' | 'sad' | 'surprise' | 'talk';
interface Limb {
  a: number;
  b: number;
}
export interface Pose {
  view?: 'side' | 'front' | 'back';
  /** Body offset: x forward, y down. */
  bx?: number;
  by?: number;
  /** Upper body shifted forward (leaning). */
  lean?: number;
  /** Hips lowered (crouch). */
  crouch?: number;
  legB?: Limb;
  legF?: Limb;
  armB?: Limb;
  armF?: Limb;
  headDy?: number;
  headDx?: number;
  expr?: Expr;
  /** Kneeling: back knee on the ground. */
  kneel?: boolean;
  fxk?: 'sling-spin' | 'sling-release' | 'pillar' | 'keys-glow' | 'dream' | 'bless' | 'hammer' | 'punch' | 'stars' | 'item' | 'sweat' | 'thrust' | 'scepter' | 'read' | 'think' | 'talk' | 'shock' | 'tear' | 'resolve' | 'arrow';
  t?: number;
}
const L = (a: number, b = 0): Limb => ({ a, b });

/** Rasterise one frame of a character in a pose (facing right). */
export function renderPose(spec: CharSpec, p: Pose): ImageData {
  const f = new Frame();
  const view = p.view ?? 'side';
  const strong = spec.build === 'strong';
  const slim = spec.build === 'slim';
  const crouch = p.crouch ?? 0;
  const hipX = PIVOT_X + (p.bx ?? 0) - 1;
  const hipY = PIVOT_Y - 11 + (p.by ?? 0) + crouch;
  const lean = p.lean ?? 0;
  const sx = hipX + lean;
  const sy = hipY - 10 + (strong ? -1 : 0);
  const cx = sx + 1 + (p.headDx ?? 0);
  const cy = sy - 7 + (p.headDy ?? 0);
  const skin = spec.skin;
  const sandal = spec.sandal ?? '#5a3a1e';
  const props = spec.props ?? [];
  const sleeveCol = spec.coat ? spec.coat[0] : spec.tunic;
  const stripes = (x: number) => (spec.coat ? spec.coat[Math.floor((x + 40) / 2) % spec.coat.length] : spec.tunic);

  const limb = (x0: number, y0: number, l: Limb, l1: number, l2: number) => {
    const kx = x0 + Math.sin(l.a) * l1;
    const ky = y0 + Math.cos(l.a) * l1;
    const ex = kx + Math.sin(l.a + l.b) * l2;
    const ey = ky + Math.cos(l.a + l.b) * l2;
    return { kx, ky, ex, ey };
  };

  const drawLeg = (l: Limb, back: boolean) => {
    // Shin bends backwards at the knee.
    const { kx, ky, ex, ey } = limb(hipX, hipY, { a: l.a, b: -l.b }, 5.5, 5.5);
    const m = new Mask().capsule(hipX, hipY, kx, ky, strong ? 2.2 : 1.9).capsule(kx, ky, ex, ey, strong ? 2 : 1.7);
    f.paint(m, back ? shadeHex(skin, -0.12) : skin, { contour: !back });
    // Sandal pointing forward.
    const s = new Mask().rect(Math.round(ex) - 2, Math.round(ey), 5, 2);
    f.paint(s, back ? shadeHex(sandal, -0.15) : sandal, { shade: 0.6, contour: true });
    f.dot(ex, ey - 1, shadeHex(sandal, 0.1));
    return { ex, ey };
  };

  const drawArm = (l: Limb, back: boolean) => {
    const ax = sx + (back ? -1 : 1);
    const ay = sy + 1;
    let { kx, ky, ex, ey } = limb(ax, ay, l, 4.2, 4);
    // Raised high: the hand reaches above the big head.
    if (l.a > 1.9 && !(view !== 'side')) {
      const reach = Math.min(1, (l.a - 1.9) / 0.9);
      ex = cx + 1 + (1 - reach) * 6 + (l.b > 1 ? -3 : 0);
      ey = cy - 6 - reach * 6 + (l.b > 1 ? 4 : 0);
      kx = (ax + ex) / 2 + 2;
      ky = (ay + ey) / 2;
    }
    const r = strong ? 2.1 : slim ? 1.3 : 1.55;
    const tone = (c: string) => (back ? shadeHex(c, -0.14) : c);
    const upper = new Mask().capsule(ax, ay, kx, ky, r);
    const lower = new Mask().capsule(kx, ky, ex, ey, r * 0.9);
    const sleeve = spec.sleeve;
    f.paint(upper, tone(sleeve === 'none' ? skin : sleeveCol), { contour: !back });
    f.paint(lower, tone(sleeve === 'long' ? sleeveCol : skin), { contour: !back });
    if (props.includes('bracers'))
      f.paint(
        new Mask().capsule(kx + (ex - kx) * 0.45, ky + (ey - ky) * 0.45, kx + (ex - kx) * 0.8, ky + (ey - ky) * 0.8, r + 0.3),
        tone(spec === CAST.joseGov ? '#e0b030' : '#6a4a2a'),
        { contour: true },
      );
    const hand = new Mask().disc(ex, ey, strong ? 2 : 1.6);
    f.paint(hand, tone(skin), { contour: true, shade: 0.7 });
    return { ex, ey, kx, ky };
  };

  if (view === 'side') {
    // Cape (behind everything).
    if (spec.cape)
      f.paint(
        new Mask().poly([
          [sx - 3, sy],
          [sx + 2, sy],
          [hipX - 4, PIVOT_Y - 3],
          [hipX - 9 - lean, PIVOT_Y - 4],
        ]),
        spec.cape,
        { contour: false },
      );
    // Long hair hanging behind the shoulders.
    if (spec.hairStyle === 'long' || spec.hairStyle === 'flow') {
      const len = spec.hairStyle === 'flow' ? 11 : 6;
      f.paint(
        new Mask().poly([
          [cx - 7, cy - 1],
          [cx - 1, cy + 2],
          [sx - 1, sy + len],
          [sx - 4, sy + len + 1],
          [sx - 7, sy + len - 1],
        ]),
        spec.hair,
      );
    }
    const armBpose = p.armB ?? L(-0.2, 0.3);
    const armB = drawArm(armBpose, true);
    if (p.kneel) {
      const k = new Mask().capsule(hipX, hipY, hipX - 2, PIVOT_Y - 2, 1.9).capsule(hipX - 2, PIVOT_Y - 2, hipX - 8, PIVOT_Y - 1, 1.7);
      f.paint(k, shadeHex(skin, -0.12));
    } else drawLeg(p.legB ?? L(-0.08, 0), true);
    drawLeg(p.legF ?? L(0.08, 0), false);
    // Tunic / robe.
    const w = strong ? 5.5 : slim ? 3.5 : 4.5;
    const hem = spec.robe ? PIVOT_Y - 2 : hipY + 4;
    const flare = spec.robe ? 2 : 1;
    const tunic = new Mask().poly([
      [sx - w + 0.5, sy - 1],
      [sx + w, sy - 1],
      [hipX + w + flare, hem],
      [hipX - w - flare, hem],
    ]);
    f.paint(tunic, spec.tunic, { contour: true });
    // Folds on long robes.
    if (spec.robe)
      for (const dx of [-2, 1])
        new Mask().line(hipX + dx, hipY + 1, hipX + dx * 1.6, hem - 1) &&
          f.paint(new Mask().line(hipX + dx, hipY + 2, hipX + dx * 1.5, hem - 1), shadeHex(spec.tunic, -0.12), { shade: 0 });
    if (spec.sleeve === 'none' && !spec.robe) f.dot(sx + 2, sy + 2, shadeHex(spec.tunic, -0.2));
    if (spec.sash) f.paint(new Mask().capsule(sx - 3, sy, sx + 3, hipY - 1, 1), spec.sash, { shade: 0.5 });
    if (props.includes('bag')) f.paint(new Mask().capsule(sx + 3, sy, sx - 3, hipY - 2, 0.6), '#7a4a24', { shade: 0 });
    // Belt with buckle.
    f.paint(new Mask().rect(Math.round(hipX - w), Math.round(hipY - 2), Math.round(w * 2 + 1), 2), spec.belt, { shade: 0.5 });
    f.dot(hipX + w - 1, hipY - 2, '#e8c050');
    if (props.includes('bag')) f.paint(new Mask().rect(Math.round(hipX - 6), Math.round(hipY - 1), 4, 4), '#8a5a2a', { contour: true });
    // Open coat over the tunic: only a strip at the front shows the tunic and belt.
    if (spec.coat) {
      const hemC = spec === CAST.pedro ? PIVOT_Y - 3 : hipY + 7;
      f.paint(
        new Mask().poly([
          [sx - w, sy - 1],
          [sx + w - 2.5, sy - 1],
          [hipX + w - 1, hemC],
          [hipX - w - 1.5, hemC + 1],
        ]),
        (x) => stripes(x),
        { contour: true },
      );
    }
    if (props.includes('collar')) {
      const col = new Mask().ellipse(sx + 0.5, sy, 5, 2.5);
      f.paint(col, (x) => (x % 3 === 0 ? '#2a5ad0' : x % 3 === 1 ? '#e0b030' : '#c83030'), { shade: 0.4, contour: true });
    }
    // A raised arm goes behind the big head (only the hand shows above it).
    const armFpose = p.armF ?? L(0.15, 0.3);
    const raised = armFpose.a > 1.9;
    const armFr = raised ? drawArm(armFpose, false) : null;
    drawHead();
    const armF = armFr ?? drawArm(armFpose, false);
    drawProps(armF, armB);
  } else {
    // Front / back view (idle, climbing).
    const back = view === 'back';
    const lB = p.legB ?? L(0, 0);
    const lF = p.legF ?? L(0, 0);
    for (const [dx, l] of [
      [-2, lB],
      [2, lF],
    ] as [number, Limb][]) {
      const ey = PIVOT_Y - 1 - (l.b > 0 ? 3 : 0);
      f.paint(new Mask().capsule(hipX + dx, hipY, hipX + dx, ey, strong ? 2 : 1.7), skin, { contour: true });
      f.paint(new Mask().rect(Math.round(hipX + dx - 2), Math.round(ey), 4, 2), sandal, { shade: 0.5, contour: true });
    }
    const w = strong ? 6 : slim ? 4 : 5;
    const hem = spec.robe ? PIVOT_Y - 2 : hipY + 4;
    if (spec.cape)
      f.paint(
        new Mask().poly([
          [sx - w - 1, sy],
          [sx + w + 1, sy],
          [hipX + w + 3, PIVOT_Y - 3],
          [hipX - w - 3, PIVOT_Y - 3],
        ]),
        spec.cape,
      );
    for (const side of [-1, 1]) {
      const arm = side < 0 ? (p.armB ?? L(0.15, 0)) : (p.armF ?? L(0.15, 0));
      const up = arm.a > 1.5;
      const ax = sx + side * (w - 0.5);
      const ex = ax + side * (up ? 1 : 1.5);
      const ey = up ? sy - 8 : sy + 8;
      f.paint(new Mask().capsule(ax, sy + 1, ex, ey, strong ? 2 : 1.5), spec.sleeve === 'none' ? skin : sleeveCol, { contour: true });
      f.paint(new Mask().disc(ex, ey + (up ? -1 : 1), 1.6), skin, { contour: true, shade: 0.6 });
    }
    f.paint(
      new Mask().poly([
        [sx - w, sy - 1],
        [sx + w + 1, sy - 1],
        [hipX + w + 2, hem],
        [hipX - w - 1, hem],
      ]),
      spec.tunic,
      { contour: true },
    );
    if (spec.coat && !back) {
      f.paint(
        new Mask().poly([
          [sx - w, sy - 1],
          [sx - 1, sy - 1],
          [hipX - 2, hem + 2],
          [hipX - w - 2, hem + 2],
        ]),
        (x) => stripes(x),
      );
      f.paint(
        new Mask().poly([
          [sx + 2, sy - 1],
          [sx + w + 1, sy - 1],
          [hipX + w + 3, hem + 2],
          [hipX + 3, hem + 2],
        ]),
        (x) => stripes(x),
      );
    } else if (spec.coat)
      f.paint(
        new Mask().poly([
          [sx - w, sy - 1],
          [sx + w + 1, sy - 1],
          [hipX + w + 3, hem + 2],
          [hipX - w - 2, hem + 2],
        ]),
        (x) => stripes(x),
      );
    if (spec.sash && !back) f.paint(new Mask().capsule(sx - w + 1, sy, sx + w - 1, hipY - 1, 1), spec.sash, { shade: 0.5 });
    f.paint(new Mask().rect(Math.round(hipX - w), Math.round(hipY - 2), Math.round(w * 2 + 2), 2), spec.belt, { shade: 0.5 });
    if (props.includes('collar') && !back)
      f.paint(new Mask().ellipse(sx + 0.5, sy, 6, 2.5), (x) => (x % 3 === 0 ? '#2a5ad0' : x % 3 === 1 ? '#e0b030' : '#c83030'), { shade: 0.4, contour: true });
    drawHead();
  }

  function drawHead() {
    const side = view === 'side';
    const back = view === 'back';
    const hx = side ? cx : sx + 0.5;
    const rx = 7;
    const ry = 6.6;
    const head = new Mask().ellipse(hx, cy + 0.5, rx, ry);
    // Hair volume behind the head.
    const hs = spec.hairStyle;
    let hair: Mask | null = null;
    if (hs !== 'bald' && hs !== 'none') {
      hair = new Mask();
      const off = side ? -1.5 : 0;
      if (hs === 'curly') {
        hair.ellipse(hx + off, cy - 2, 7.6, 6.4);
        for (let k = 0; k < 8; k++) {
          const ang = Math.PI * (side ? 0.85 + (k / 7) * 1.1 : 1 + k / 7);
          hair.disc(hx + off + Math.cos(ang) * 7, cy - 2 + Math.sin(ang) * 6, 1.7);
        }
        if (side) hair.disc(hx - 5.5, cy + 2.5, 2);
      } else if (hs === 'long' || hs === 'wavy' || hs === 'flow') {
        hair.ellipse(hx + off, cy - 2, 7.5, 6.4);
        const drop = hs === 'flow' ? 12 : hs === 'long' ? 9 : 5;
        if (side)
          hair.poly([
            [hx - 8, cy - 2],
            [hx - 2, cy - 1],
            [hx - 3, cy + drop],
            [hx - 8, cy + drop - 1],
          ]);
        else
          hair.poly([
            [hx - 8, cy - 2],
            [hx + 9, cy - 2],
            [hx + 9, cy + drop - 1],
            [hx + 5.5, cy + drop - 1],
            [hx + 5.5, cy],
            [hx - 4.5, cy],
            [hx - 4.5, cy + drop - 1],
            [hx - 8, cy + drop - 1],
          ]);
      } else hair.ellipse(hx + off, cy - 2.2, 7.3, 5.8);
      f.paint(hair, spec.hair, { shade: 0.8 });
    }
    if (spec.cape && side) f.paint(new Mask().rect(Math.round(sx - 4), Math.round(sy - 1), 6, 3), spec.cape);
    f.paint(head, back && hair ? spec.hair : skin, { contour: true });
    if (back && hair) {
      f.paint(head.copy(), spec.hair, { shade: 0.8 });
      for (let k = -4; k <= 4; k += 3) f.paint(new Mask().line(hx + k, cy - 4, hx + k * 1.2, cy + 5), shadeHex(spec.hair, -0.2), { shade: 0 });
    }
    // Fringe over the forehead.
    if (hair && !back) {
      const fr = hair
        .copy()
        .filter((x, y) => head.has(x, y) && (side ? y < cy - 3 - Math.max(0, x - hx) * 0.45 || (x < hx - 3 && y < cy + 3) : y < cy - 3 || (Math.abs(x - hx) > 5.5 && y < cy + 2)));
      if (hs === 'curly' || hs === 'wavy' || hs === 'long' || hs === 'flow') for (let k = 0; k < 3; k++) fr.set(hx + (side ? 1 + k * 1.6 : -3 + k * 3), cy - 3 + (k % 2));
      f.paint(fr, spec.hair, { shade: 0.9, contour: true });
    }
    // Head coverings.
    const hc = spec.headColor ?? '#c8a040';
    if (spec.head === 'helmet') {
      const hm = new Mask().ellipse(hx - (side ? 0.5 : 0), cy - 2.5, 7.8, 5.6).filter((_, y) => y < cy - 0.5);
      if (side) hm.rect(Math.round(hx - 7), Math.round(cy - 2), 4, 6);
      f.paint(hm, hc, { contour: true });
      f.paint(new Mask().rect(Math.round(hx - 8), Math.round(cy - 1), 16, 1), shadeHex(hc, -0.25), { shade: 0 });
      if (spec === CAST.romano) f.paint(new Mask().ellipse(hx - 1, cy - 8.5, 5, 1.8), '#c8302a', { contour: true });
    } else if (spec.head === 'tiara') {
      // Delicate band with three small points and a jewel.
      const ti = new Mask().rect(Math.round(hx - 5), Math.round(cy - 6), 10, 1);
      for (const k of [-3, 0, 3]) ti.rect(Math.round(hx + k - (side ? 0 : 0.5)), Math.round(cy - 7 - (k === 0 ? 1 : 0)), 1, k === 0 ? 2 : 1);
      f.paint(ti, hc, { contour: true, shade: 0.5 });
      f.dot(hx + (side ? 1 : 0), cy - 6, '#7a3ac8');
    } else if (spec.head === 'kidaris') {
      // Tall Persian royal crown with crenellations.
      const kd = new Mask().rect(Math.round(hx - 5), Math.round(cy - 12), 10, 7);
      for (let k = 0; k < 5; k += 2) kd.rect(Math.round(hx - 5 + k * 2.2), Math.round(cy - 14), 2, 2);
      f.paint(kd, hc, { contour: true, shade: 0.6 });
      for (const k of [-3, 0, 3]) f.dot(hx + k, cy - 9, k === 0 ? '#c83030' : '#3a6ad8');
      f.paint(new Mask().rect(Math.round(hx - 5), Math.round(cy - 6), 10, 1), shadeHex(hc, -0.3), { shade: 0 });
    } else if (spec.head === 'crown') {
      const cr = new Mask().rect(Math.round(hx - 5), Math.round(cy - 7), 10, 2);
      for (let k = 0; k < 4; k++) cr.rect(Math.round(hx - 5 + k * 3), Math.round(cy - 9), 1, 2);
      f.paint(cr, hc, { contour: true, shade: 0.6 });
      f.dot(hx, cy - 6, '#c83030');
    } else if (spec.head === 'hood' || spec.head === 'veil' || spec.head === 'turban') {
      const hd = new Mask().ellipse(hx - (side ? 1 : 0), cy - 1, 8, 7.6);
      if (spec.head !== 'turban')
        hd.poly(
          side
            ? [
                [hx - 8, cy - 1],
                [hx - 1, cy],
                [hx - 1, cy + 9],
                [hx - 9, cy + 9],
              ]
            : [
                [hx - 8, cy],
                [hx + 9, cy],
                [hx + 9, cy + 9],
                [hx - 8, cy + 9],
              ],
        );
      const face = new Mask().ellipse(hx + (side ? 1.5 : 0.5), cy + 1.5, side ? 5.2 : 5.5, 5.3);
      const cover = spec.head === 'turban' ? hd.filter((_, y) => y < cy - 1.5) : hd.filter((x, y) => !face.has(x, y) || back);
      f.paint(cover, hc, { contour: true });
      if (spec.head === 'turban') f.paint(new Mask().line(hx - 6, cy - 3, hx + 6, cy - 5), shadeHex(hc, -0.2), { shade: 0 });
    }
    if (back) return;
    // Face.
    const ex = p.expr ?? 'neutral';
    const eyeC = spec.glow ?? '#2a1a14';
    const eyes = side ? [hx + 3.5] : [hx - 3, hx + 3];
    const ey = cy + 0.5;
    for (const x0 of eyes) {
      const x = Math.round(x0);
      const y = Math.round(ey);
      if (spec.glow) {
        f.dot(x, y, spec.glow);
        f.glow(x, y, spec.glow, 255);
        f.glow(x + 1, y, spec.glow, 120);
        continue;
      }
      if (ex === 'happy') {
        f.dot(x - 1, y + 1, eyeC);
        f.dot(x, y, eyeC);
        f.dot(x + 1, y + 1, eyeC);
      } else if (ex === 'closed') {
        f.dot(x - 1, y + 1, eyeC);
        f.dot(x, y + 1, eyeC);
        f.dot(x + 1, y + 1, eyeC);
      } else if (ex === 'surprise') {
        f.dot(x, y - 2, eyeC);
        f.dot(x, y - 1, eyeC);
        f.dot(x + 1, y - 1, '#fffaf0');
        f.dot(x, y, eyeC);
        f.dot(x + 1, y, eyeC);
        f.dot(x, y + 1, eyeC);
      } else if (ex === 'hurt') {
        f.dot(x - 1, y - 1, eyeC);
        f.dot(x, y, eyeC);
        f.dot(x - 1, y + 1, eyeC);
      } else {
        f.dot(x, y - 1, eyeC);
        f.dot(x + 1, y - 1, eyeC);
        f.dot(x, y, eyeC);
        f.dot(x + 1, y, '#fffaf0');
        f.dot(x, y + 1, eyeC);
        f.dot(x + 1, y + 1, eyeC);
      }
      // Brows.
      const bc = shadeHex(spec.hairStyle === 'bald' || spec.hairStyle === 'none' ? '#2a1a10' : spec.hair, -0.35);
      const tilt = ex === 'focus' ? 1 : ex === 'sad' || ex === 'hurt' ? -1 : 0;
      f.dot(x - 1, y - 3 + (side ? 0 : tilt * (x0 < hx ? 1 : -1) * 0), bc);
      f.dot(x, y - 3 + (tilt > 0 ? 1 : 0), bc);
      f.dot(x + 1, y - 3 + (tilt > 0 ? 1 : tilt < 0 ? -1 : 0) * 0, bc);
    }
    if (spec.fem && !spec.glow)
      for (const x0 of eyes) {
        const x = Math.round(x0);
        const y = Math.round(ey);
        const out = side ? 2 : x0 < hx ? -1 : 2;
        if (ex !== 'closed' && ex !== 'happy') f.dot(x + out, y - 1, eyeC);
        else f.dot(x + out, y + 1, eyeC);
      }
    if (spec.props?.includes('earrings') && !back && spec.head !== 'veil') {
      if (side) f.dot(hx - 2, cy + 4, '#f0c030');
      else {
        f.dot(hx - 7, cy + 4, '#f0c030');
        f.dot(hx + 7, cy + 4, '#f0c030');
      }
    }
    if (spec.bandage === 'eyes') {
      const bm = new Mask().rect(Math.round(hx - (side ? 2 : 7)), Math.round(ey - 1), side ? 9 : 15, 3).filter((x, y) => head.has(x, y));
      f.paint(bm, '#e8e0c8', { shade: 0.5, contour: true });
    }
    // Cheeks, ear, nose.
    if (!spec.glow) {
      if (side) {
        f.dot(hx - 2, cy + 1, shadeHex(skin, -0.22));
        f.dot(hx - 2, cy + 2, shadeHex(skin, -0.22));
        f.dot(hx + 6, cy + 2, shadeHex(skin, -0.18));
        f.glow(hx + 3, cy + 3, '#ff7a6a', 70);
      } else {
        f.glow(hx - 4, cy + 3, '#ff7a6a', 70);
        f.glow(hx + 4, cy + 3, '#ff7a6a', 70);
      }
    }
    // Beard.
    if (spec.beard) {
      const bd = new Mask().ellipse(hx + (side ? 0.5 : 0), cy + 0.5, 7, 6.6).filter((x, y) => y > cy + 3 && (side ? x > hx - 3 : true) && head.has(x, y));
      if (side) bd.rect(Math.round(hx - 2), Math.round(cy + 1), 2, 3);
      if (spec.beard === 'long') bd.ellipse(hx + (side ? 2.5 : 0.5), cy + 7.5, 3.6, 4);
      else bd.ellipse(hx + (side ? 2.5 : 0.5), cy + 6, 3, 1.8);
      f.paint(bd, spec.hair, { shade: 0.7, contour: true });
    }
    // Mouth.
    const mx = side ? hx + 4 : hx;
    const my = cy + 4.5;
    const mc = spec.beard ? shadeHex(skin, -0.3) : spec.fem ? '#b83a4a' : '#8a3a2a';
    if (spec.glow) return;
    if (ex === 'happy') {
      f.dot(mx - 1, my - 1, mc);
      f.dot(mx, my, mc);
      f.dot(mx + 1, my, mc);
      if (!side) f.dot(mx + 2, my - 1, mc);
    } else if (ex === 'surprise') {
      f.dot(mx, my, '#5a1a1a');
      f.dot(mx, my + 1, '#5a1a1a');
      f.dot(mx - 1, my, mc);
      f.dot(mx + 1, my + 1, mc);
    } else if (ex === 'talk') {
      f.dot(mx - 1, my, mc);
      f.dot(mx, my, '#5a1a1a');
      f.dot(mx + 1, my, mc);
      f.dot(mx, my + 1, mc);
    } else if (ex === 'hurt') {
      f.dot(mx, my, '#5a1a1a');
      f.dot(mx + 1, my, '#5a1a1a');
      f.dot(mx, my + 1, '#5a1a1a');
      f.dot(mx + 1, my + 1, '#5a1a1a');
    } else if (ex === 'sad') {
      f.dot(mx, my, mc);
      f.dot(mx + 1, my + 1, mc);
    } else if (ex === 'focus') {
      f.dot(mx, my, mc);
      f.dot(mx + 1, my, mc);
    } else {
      f.dot(mx, my, mc);
      f.dot(mx + 1, my, mc);
    }
  }

  function drawProps(armF: { ex: number; ey: number; kx: number; ky: number }, armB: { ex: number; ey: number }) {
    const t = p.t ?? 0;
    const { ex, ey } = armF;
    if (props.includes('chains')) {
      for (const [hx0, hy0] of [
        [ex, ey],
        [armB.ex, armB.ey],
      ])
        for (let k = 1; k <= 4; k++) f.dot(hx0 - 1 + (k % 2), hy0 + k * 1.3, k % 2 ? '#b8b8c8' : '#6a6a78');
    }
    if (props.includes('keys') && p.fxk !== 'keys-glow') {
      f.paint(new Mask().disc(ex + 1, ey + 2, 1.3), '#e8b830', { shade: 0.5, contour: true });
      f.dot(ex + 1, ey + 4, '#e8b830');
      f.dot(ex + 2, ey + 5, '#c89020');
    }
    if (props.includes('staff'))
      f.paint(new Mask().line(ex + 1, ey - 10, ex + 1, Math.min(FH - 1, ey + 9)).rect(Math.round(ex), Math.round(ey - 11), 3, 1), '#7a4a24', { shade: 0, contour: false });
    if (props.includes('spear')) {
      const thrust = p.fxk === 'thrust';
      const x0 = ex - (thrust ? 6 : 1);
      const y0 = ey + (thrust ? 0 : 6);
      const x1 = ex + (thrust ? 12 : 1);
      const y1 = ey - (thrust ? 0 : 16);
      f.paint(new Mask().line(x0, y0, x1, y1), '#6a4424', { shade: 0 });
      f.paint(new Mask().disc(x1, y1, 1.2), '#d8d8e0', { shade: 0, contour: true });
    }
    if (props.includes('shield') && p.fxk !== 'thrust') {
      f.paint(new Mask().ellipse(armB.ex + 4, armB.ey - 2, 3.2, 5), '#c8302a', { contour: true });
      f.dot(armB.ex + 4, armB.ey - 2, '#e8b830');
    }
    if (props.includes('harp')) {
      const hp = new Mask()
        .line(ex + 1, ey - 1, ex + 1, ey - 8)
        .line(ex + 1, ey - 8, ex + 5, ey - 6)
        .line(ex + 5, ey - 6, ex + 3, ey);
      f.paint(hp, '#e8b830', { shade: 0, contour: true });
    }
    if (props.includes('bow')) {
      const draw = p.fxk === 'arrow';
      const bx = draw ? ex + 3 : armB.ex - 1;
      const by = draw ? ey : armB.ey - 4;
      const bow = new Mask().line(bx, by - 7, bx + 3, by - 3).line(bx + 3, by - 3, bx + 3, by + 3).line(bx + 3, by + 3, bx, by + 7);
      f.paint(bow, '#8a5a2a', { shade: 0, contour: true });
      f.paint(new Mask().line(bx, by - 7, draw ? bx - 4 : bx, by).line(draw ? bx - 4 : bx, by, bx, by + 7), '#e8e0c8', { shade: 0 });
      if (draw) {
        f.paint(new Mask().line(bx - 4, by, bx + 8 + (t > 0.5 ? 6 : 0), by), '#6a4424', { shade: 0 });
        f.dot(bx + 9 + (t > 0.5 ? 6 : 0), by, '#d8d8e0');
      }
    }
    if (props.includes('scepter')) {
      const up = p.fxk === 'scepter';
      const x1 = up ? ex + 10 : ex + 1;
      const y1 = up ? ey - 2 : ey - 9;
      f.paint(new Mask().line(ex, ey + (up ? 0 : 3), x1, y1), '#e8b830', { shade: 0 });
      f.paint(new Mask().disc(x1, y1, 1.6), '#f0c830', { shade: 0.5, contour: true });
      if (up) for (let k = 0; k < 6; k++) f.glow(x1 + Math.cos(k + t * 6) * 3, y1 + Math.sin(k + t * 6) * 3, '#fff0a0', 150);
    }
    if ((props.includes('scroll') && p.fxk !== 'read') || p.fxk === 'read') {
      if (p.fxk === 'read') {
        f.paint(new Mask().rect(Math.round(ex - 1), Math.round(ey - 6), 6, 7), '#f0e4c0', { shade: 0.4, contour: true });
        f.paint(new Mask().rect(Math.round(ex - 2), Math.round(ey - 7), 8, 1).rect(Math.round(ex - 2), Math.round(ey + 1), 8, 1), '#c8a060', { shade: 0 });
        for (let k = 0; k < 3; k++) f.paint(new Mask().rect(Math.round(ex), Math.round(ey - 5 + k * 2), 4, 1), '#8a6a4a', { shade: 0 });
      } else f.paint(new Mask().rect(Math.round(ex - 1), Math.round(ey), 3, 5), '#f0e4c0', { shade: 0.3, contour: true });
    }
    if (props.includes('sling') && !p.fxk?.startsWith('sling')) {
      f.paint(new Mask().line(ex, ey + 1, ex - 1, ey + 5), '#8a5a2a', { shade: 0 });
      f.dot(ex - 1, ey + 6, '#6a4424');
    }
    // Effects of the special animations.
    switch (p.fxk) {
      case 'sling-spin': {
        const ang = t * Math.PI * 2;
        const rx = ex + Math.cos(ang) * 6;
        const ry = ey - 3 + Math.sin(ang) * 3;
        f.paint(new Mask().line(ex, ey, rx, ry), '#8a5a2a', { shade: 0 });
        f.paint(new Mask().disc(rx, ry, 1.2), '#8a8a90', { shade: 0, contour: true });
        for (let k = 1; k < 5; k++) f.glow(ex + Math.cos(ang - k * 0.5) * 6, ey - 3 + Math.sin(ang - k * 0.5) * 3, '#ffffff', 90 - k * 18);
        break;
      }
      case 'sling-release':
        f.paint(new Mask().line(ex, ey, ex + 4, ey + 2), '#8a5a2a', { shade: 0 });
        f.paint(new Mask().disc(ex + 9, ey - 1, 1.3), '#9a9aa0', { shade: 0, contour: true });
        for (let k = 1; k < 4; k++) f.glow(ex + 9 - k * 2, ey - 1, '#ffffff', 140 - k * 40);
        break;
      case 'punch':
        for (let k = 0; k < 5; k++) f.glow(ex + 3 + (k % 2), ey - 2 + k, '#fff4c0', 200 - k * 30);
        f.glow(ex + 5, ey, '#ffffff', 220);
        break;
      case 'pillar':
        f.paint(new Mask().rect(Math.round(ex - 9), Math.round(ey - 3), 18, 4), '#b8b0a0', { contour: true });
        f.paint(new Mask().rect(Math.round(ex - 10), Math.round(ey - 4), 2, 6).rect(Math.round(ex + 8), Math.round(ey - 4), 2, 6), '#d8d0c0', { contour: true });
        for (let k = 0; k < 3; k++) f.glow(ex - 10 + k * 9, ey + 3 + (k % 2), '#e8e0d0', 140);
        break;
      case 'keys-glow': {
        const r = 4 + Math.sin(t * Math.PI * 2) * 1.5;
        for (let k = 0; k < 12; k++) f.glow(ex + Math.cos(k * 0.52) * r, ey - 3 + Math.sin(k * 0.52) * r, '#fff0a0', 150);
        f.paint(new Mask().disc(ex, ey - 3, 1.5), '#f0c030', { shade: 0.5, contour: true });
        f.paint(new Mask().line(ex, ey - 1, ex, ey + 3).line(ex + 2, ey - 1, ex + 2, ey + 3), '#e8b830', { shade: 0 });
        break;
      }
      case 'dream': {
        const s = Math.round(1 + t * 3);
        const bx = cx + 4;
        const by = cy - 13;
        f.paint(new Mask().ellipse(bx + 4, by, 3 + s, 2 + s * 0.7), '#ffffff', { shade: 0.3, contour: true });
        f.dot(bx - 1, by + 5, '#ffffff');
        f.dot(bx - 2, by + 7, '#ffffff');
        f.dot(bx + 4, by, '#f0c030');
        f.dot(bx + 3, by, '#f0c030');
        f.dot(bx + 5, by, '#f0c030');
        f.dot(bx + 4, by - 1, '#f0c030');
        f.dot(bx + 4, by + 1, '#f0c030');
        for (let k = 0; k < 4; k++) f.glow(bx + 4 + Math.cos(k * 1.57 + t * 6) * (4 + s), by + Math.sin(k * 1.57 + t * 6) * 3, '#fff0a0', 160);
        break;
      }
      case 'bless':
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2;
          const r = 13 + Math.sin(t * Math.PI * 2 + k) * 1.5;
          f.glow(sx + Math.cos(a) * r, sy - 3 + Math.sin(a) * r * 1.1, '#fff4c0', 110);
        }
        break;
      case 'hammer':
        f.paint(new Mask().line(ex, ey, ex + 3, ey - 4), '#6a4424', { shade: 0 });
        f.paint(new Mask().rect(Math.round(ex + 2), Math.round(ey - 6), 4, 3), '#8a8a94', { contour: true });
        break;
      case 'stars':
        for (let k = 0; k < 3; k++) f.glow(cx - 4 + k * 4, cy - 10 - (k % 2) * 2, '#ffe066', 230);
        break;
      case 'item':
        f.paint(new Mask().disc(ex, ey - 3, 2), '#5ac0ff', { contour: true });
        f.glow(ex, ey - 6, '#ffffff', 200);
        break;
      case 'think':
        for (let k = 0; k < 2; k++) f.glow(cx + 7 + k * 2, cy - 4 - k * 2, '#ffffff', 140 + k * 50);
        f.paint(new Mask().ellipse(cx + 13, cy - 8, 3, 2), '#ffffff', { shade: 0.3, contour: true });
        f.dot(cx + 13, cy - 8, '#5a6ab8');
        break;
      case 'talk':
        f.glow(cx + 9, cy + 2 - (t > 0.5 ? 1 : 0), '#ffffff', 170);
        f.glow(cx + 11, cy + 1 - (t > 0.5 ? 1 : 0), '#ffffff', 120);
        break;
      case 'shock':
        f.paint(new Mask().rect(Math.round(cx + 10), Math.round(cy - 9), 2, 4), '#ffe066', { shade: 0, contour: true });
        f.paint(new Mask().rect(Math.round(cx + 10), Math.round(cy - 3), 2, 2), '#ffe066', { shade: 0, contour: true });
        f.glow(cx - 8, cy - 5, '#ffffff', 160);
        f.glow(cx + 7, cy - 7, '#ffffff', 160);
        break;
      case 'tear':
        f.glow(cx + (view === 'side' ? 4 : 3), cy + 3 + Math.round(t * 3), '#7ac8ff', 230);
        break;
      case 'resolve':
        for (let k = 0; k < 10; k++) f.glow(cx + Math.cos(k * 0.63) * 12, cy + 8 + Math.sin(k * 0.63) * 15, '#ffe8a0', 70 + (k % 2) * 40);
        break;
      case 'sweat':
        f.glow(cx + 7, cy - 3, '#bfe4ff', 220);
        f.glow(cx + 8, cy - 2, '#bfe4ff', 160);
        break;
    }
  }

  f.outline();
  return f.toImageData();
}

function shadeHex(h: string, k: number) {
  const c = k > 0 ? light(hex(h), k) : dark(hex(h), -k);
  return (
    '#' +
    c
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

// ------------------------------------------------------------------ animations

export type Anim =
  | 'idleFront'
  | 'idleBack'
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'fall'
  | 'land'
  | 'hurt'
  | 'victory'
  | 'interact'
  | 'push'
  | 'pickup'
  | 'defeat'
  | 'climb'
  | 'attack'
  | 'special'
  | 'talk'
  | 'read'
  | 'think'
  | 'surprise'
  | 'sad'
  | 'brave';

export const ANIMS: Record<Anim, { frames: number; fps: number; loop: boolean }> = {
  idleFront: { frames: 4, fps: 5, loop: true },
  idleBack: { frames: 2, fps: 3, loop: true },
  idle: { frames: 4, fps: 5, loop: true },
  walk: { frames: 6, fps: 11, loop: true },
  run: { frames: 6, fps: 15, loop: true },
  jump: { frames: 2, fps: 10, loop: false },
  fall: { frames: 2, fps: 8, loop: true },
  land: { frames: 2, fps: 16, loop: false },
  hurt: { frames: 2, fps: 10, loop: false },
  victory: { frames: 4, fps: 7, loop: true },
  interact: { frames: 3, fps: 10, loop: false },
  push: { frames: 4, fps: 6, loop: true },
  pickup: { frames: 3, fps: 9, loop: false },
  defeat: { frames: 4, fps: 6, loop: false },
  climb: { frames: 4, fps: 8, loop: true },
  attack: { frames: 4, fps: 14, loop: false },
  special: { frames: 6, fps: 8, loop: true },
  talk: { frames: 4, fps: 6, loop: true },
  read: { frames: 4, fps: 3, loop: true },
  think: { frames: 4, fps: 3, loop: true },
  surprise: { frames: 3, fps: 9, loop: false },
  sad: { frames: 4, fps: 3, loop: true },
  brave: { frames: 4, fps: 6, loop: true },
};

/** The special move of each hero (and the attack, when they have one). */
const SPECIAL: Partial<Record<CastId, 'sling' | 'pillar' | 'keys' | 'dream' | 'bless' | 'hammer' | 'thrust' | 'harp' | 'scepter' | 'bow'>> = {
  jonatas: 'bow',
  davi: 'sling',
  daviRei: 'harp',
  sansao: 'pillar',
  pedro: 'keys',
  jose: 'dream',
  joseServo: 'keys',
  joseGov: 'bless',
  jesus: 'bless',
  noe: 'hammer',
  soldado: 'thrust',
  romano: 'thrust',
  guarda: 'thrust',
  persa: 'thrust',
  assuero: 'scepter',
};

export function poseFor(id: CastId, anim: Anim, i: number): Pose {
  const n = ANIMS[anim].frames;
  const ph = (i / n) * Math.PI * 2;
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  switch (anim) {
    case 'idle':
      return {
        by: i >= 2 ? 1 : 0,
        headDy: i === 2 ? 0 : 0,
        armF: L(0.12 + (i >= 2 ? 0.05 : 0), 0.35),
        armB: L(-0.15, 0.3),
        legF: L(0.1),
        legB: L(-0.1),
        expr: i === 3 && id !== 'tentador' ? 'closed' : 'neutral',
      };
    case 'idleFront':
      return { view: 'front', by: i >= 2 ? 1 : 0, expr: i === 3 ? 'closed' : 'happy' };
    case 'idleBack':
      return { view: 'back', by: i };
    case 'walk':
      return {
        by: Math.abs(s) < 0.5 ? 0 : 1,
        legF: L(0.5 * s, 0.7 * Math.max(0, -c)),
        legB: L(-0.5 * s, 0.7 * Math.max(0, c)),
        armF: L(-0.55 * s, 0.4),
        armB: L(0.55 * s, 0.4),
      };
    case 'run':
      return {
        by: Math.abs(s) > 0.8 ? -1 : 0,
        lean: 2,
        headDx: 1,
        legF: L(0.9 * s, 1.5 * Math.max(0, -c) + 0.3),
        legB: L(-0.9 * s, 1.5 * Math.max(0, c) + 0.3),
        armF: L(-0.95 * s, 1.5),
        armB: L(0.95 * s, 1.5),
        expr: 'focus',
      };
    case 'jump':
      return i === 0
        ? { crouch: 1, legF: L(0.4, 0.8), legB: L(-0.3, 0.6), armF: L(2.4, 0.3), armB: L(-0.8, 0.4), expr: 'focus' }
        : { by: -1, legF: L(0.9, 1.6), legB: L(-0.2, 0.9), armF: L(2.7, 0.2), armB: L(-1.2, 0.5), expr: 'happy' };
    case 'fall':
      return { legF: L(0.25, 0.3), legB: L(-0.35, 0.4), armF: L(2.0 + i * 0.3, -0.3), armB: L(1.6 - i * 0.3, -0.3), expr: 'neutral' };
    case 'land':
      return i === 0
        ? { crouch: 3, legF: L(0.6, 1.2), legB: L(-0.5, 1.0), armF: L(0.9, 0.2), armB: L(0.6, 0.2), expr: 'focus' }
        : { crouch: 1, legF: L(0.3, 0.5), legB: L(-0.3, 0.5), armF: L(0.5, 0.3), armB: L(0.2, 0.3) };
    case 'hurt':
      return { lean: -2, bx: -i, headDx: -1, legF: L(0.4, 0.3), legB: L(-0.4, 0.2), armF: L(-0.9, 0.8), armB: L(-1.2, 0.6), expr: 'hurt', fxk: 'sweat' };
    case 'victory':
      return {
        by: i === 1 || i === 2 ? -2 : 0,
        legF: L(i === 1 || i === 2 ? 0.5 : 0.1, i === 1 || i === 2 ? 1 : 0),
        legB: L(-0.2, i === 1 || i === 2 ? 0.6 : 0),
        armF: L(3.0, 0.1),
        armB: L(i % 2 ? 2.4 : -0.3, 0.3),
        expr: 'happy',
        fxk: 'stars',
      };
    case 'interact':
      return { lean: i === 1 ? 1 : 0, armF: L([0.8, 1.55, 1.1][i], [0.6, 0.05, 0.4][i]), armB: L(-0.1, 0.3), legF: L(0.2), legB: L(-0.15), expr: 'focus' };
    case 'push':
      return {
        lean: 3,
        headDx: 1,
        legF: L(0.15 + 0.2 * s, 0.4),
        legB: L(-0.65 - 0.15 * s, 0.1),
        armF: L(1.5, 0.05),
        armB: L(1.35, 0.1),
        expr: 'focus',
        fxk: i % 2 ? 'sweat' : undefined,
      };
    case 'pickup':
      return i === 2
        ? { armF: L(2.9, 0.1), armB: L(-0.2, 0.3), expr: 'happy', fxk: 'item' }
        : { crouch: 2 + i * 2, lean: 2, legF: L(0.7, 1.2 + i * 0.3), legB: L(-0.4, 0.9 + i * 0.3), armF: L(0.6 + i * 0.1, 0.2), armB: L(0.2, 0.3), expr: 'focus' };
    case 'defeat':
      return [
        { lean: -2, armF: L(-0.9, 0.8), armB: L(-1.2, 0.6), expr: 'hurt' as Expr },
        { crouch: 3, legF: L(0.9, 1.6), kneel: true, armF: L(0.3, 0.2), armB: L(0.2, 0.2), expr: 'sad' as Expr },
        { crouch: 4, lean: 2, headDy: 2, legF: L(1.1, 1.9), kneel: true, armF: L(0.5, 0.2), armB: L(0.4, 0.2), expr: 'closed' as Expr },
        { crouch: 5, lean: 3, headDy: 3, headDx: 1, legF: L(1.2, 2.0), kneel: true, armF: L(0.9, 0.1), armB: L(0.7, 0.1), expr: 'closed' as Expr },
      ][i];
    case 'talk':
      return { by: i === 2 ? 1 : 0, armF: L(i % 2 ? 1.1 : 0.7, i % 2 ? 1.2 : 0.8), armB: L(-0.1, 0.3), legF: L(0.1), legB: L(-0.1), expr: i % 2 ? 'talk' : 'neutral', fxk: 'talk', t: i / 4 };
    case 'read':
      return { by: i === 3 ? 1 : 0, headDy: 1, armF: L(1.0, 1.1), armB: L(0.6, 1.4), legF: L(0.1), legB: L(-0.1), expr: i === 2 ? 'closed' : 'focus', fxk: 'read' };
    case 'think':
      return { by: i >= 2 ? 1 : 0, armF: L(0.6, 2.6), armB: L(0.3, 1.6), legF: L(0.1), legB: L(-0.1), expr: i === 3 ? 'closed' : 'focus', fxk: i > 0 ? 'think' : undefined };
    case 'surprise':
      return i === 0
        ? { by: 0, lean: -1, armF: L(0.6, 0.6), armB: L(0.2, 0.4), legF: L(0.1), legB: L(-0.1), expr: 'surprise' }
        : { by: -1, lean: -2, headDx: -1, armF: L(2.2, 1.8), armB: L(1.8, 1.6), legF: L(0.15), legB: L(-0.2), expr: 'surprise', fxk: 'shock' };
    case 'sad':
      return { by: 1, headDy: 2, lean: 1, armF: L(0.25, 0.3), armB: L(0.15, 0.3), legF: L(0.05), legB: L(-0.05), expr: i === 3 ? 'closed' : 'sad', fxk: 'tear', t: i / 4 };
    case 'brave':
      return { by: i % 2 ? -1 : 0, lean: -1, armF: L(i < 2 ? 0.6 : 1.4, i < 2 ? 1.6 : 0.6), armB: L(-0.3, 0.4), legF: L(0.35), legB: L(-0.3), expr: 'focus', fxk: 'resolve' };
    case 'climb':
      return { view: 'back', armF: L(i % 2 ? 2.8 : 0.5, 0), armB: L(i % 2 ? 0.5 : 2.8, 0), legF: L(0, i % 2 ? 1 : 0), legB: L(0, i % 2 ? 0 : 1), by: i % 2 };
    case 'attack': {
      const k = SPECIAL[id];
      if (k === 'sling')
        return [
          { lean: -1, armF: L(-1.6, 0.6), legF: L(0.4), legB: L(-0.3), expr: 'focus' as Expr, fxk: 'sling-spin' as const, t: 0.5 },
          { armF: L(2.8, 0.2), legF: L(0.4), legB: L(-0.3), expr: 'focus' as Expr, fxk: 'sling-spin' as const, t: 0.1 },
          { lean: 2, armF: L(1.6, 0), armB: L(-0.8, 0.3), legF: L(0.6, 0.3), legB: L(-0.5), expr: 'focus' as Expr, fxk: 'sling-release' as const },
          { lean: 1, armF: L(1.0, 0.3), legF: L(0.3), legB: L(-0.3), expr: 'neutral' as Expr },
        ][i];
      if (k === 'pillar' || id === 'sansao')
        return [
          { lean: -1, armF: L(-0.7, 1.7), armB: L(0.4, 0.8), legF: L(0.3), legB: L(-0.3), expr: 'focus' as Expr },
          { lean: 3, armF: L(1.6, 0), armB: L(-0.6, 0.6), legF: L(0.5, 0.2), legB: L(-0.7), expr: 'focus' as Expr, fxk: 'punch' as const },
          { lean: 3, armF: L(1.6, 0), armB: L(-0.6, 0.6), legF: L(0.5, 0.2), legB: L(-0.7), expr: 'focus' as Expr },
          { lean: 1, armF: L(0.6, 0.8), armB: L(0, 0.4), legF: L(0.2), legB: L(-0.2), expr: 'neutral' as Expr },
        ][i];
      if (k === 'bow')
        return [0.1, 0.4, 0.8, 1].map((tt) => ({ lean: -1, armF: L(1.5, 0.05), armB: L(1.45, 1.4 - tt), legF: L(0.4), legB: L(-0.35), expr: 'focus' as Expr, fxk: 'arrow' as const, t: tt }))[i];
      if (k === 'thrust')
        return [
          { lean: -1, armF: L(1.2, 0.6), legF: L(0.3), legB: L(-0.3), expr: 'focus' as Expr, fxk: 'thrust' as const },
          { lean: 3, armF: L(1.55, 0), legF: L(0.6, 0.2), legB: L(-0.6), expr: 'focus' as Expr, fxk: 'thrust' as const },
          { lean: 3, armF: L(1.55, 0), legF: L(0.6, 0.2), legB: L(-0.6), expr: 'focus' as Expr, fxk: 'thrust' as const },
          { lean: 0, armF: L(0.2, 0.3), legF: L(0.1), legB: L(-0.1) },
        ][i];
      return poseFor(id, 'interact', Math.min(2, i));
    }
    case 'special': {
      const k = SPECIAL[id];
      const t = i / n;
      if (k === 'sling') return { armF: L(2.8, 0.2), armB: L(-0.4, 0.4), legF: L(0.35), legB: L(-0.3), expr: 'focus', fxk: 'sling-spin', t };
      if (k === 'pillar')
        return i < 2
          ? { crouch: 3 - i, lean: 1, legF: L(0.6, 1.1), legB: L(-0.5, 0.9), armF: L(2.6 + i * 0.2, 0.4), armB: L(2.4 + i * 0.2, 0.4), expr: 'focus', fxk: 'pillar' }
          : { by: i % 2 ? 1 : 0, bx: i % 2 ? 1 : 0, legF: L(0.4, 0.2), legB: L(-0.4, 0.2), armF: L(3.0, 0.15), armB: L(2.9, 0.2), expr: i % 2 ? 'focus' : 'happy', fxk: 'pillar' };
      if (k === 'keys') return { armF: L(3.0, 0.05), armB: L(-0.2, 0.3), legF: L(0.15), legB: L(-0.15), expr: 'happy', fxk: 'keys-glow', t };
      if (k === 'dream') return { by: i % 3 === 0 ? 0 : 1, armF: L(2.4, 2.0), armB: L(2.2, 2.0), legF: L(0.1), legB: L(-0.1), expr: 'closed', fxk: 'dream', t };
      if (k === 'bless') return { by: i % 3 === 0 ? 0 : 1, armF: L(2.0, -0.1), armB: L(1.7, -0.1), legF: L(0.1), legB: L(-0.1), expr: 'happy', fxk: 'bless', t };
      if (k === 'harp') return { by: i % 2, armF: L(1.1, 1.2), armB: L(0.9, 1.4 + (i % 2) * 0.3), legF: L(0.1), legB: L(-0.1), expr: i % 3 ? 'closed' : 'happy' };
      if (k === 'bow') return { lean: -1, armF: L(1.5, 0.05), armB: L(1.45, 1.4 - t), legF: L(0.4), legB: L(-0.35), expr: 'focus', fxk: 'arrow', t };
      if (k === 'scepter') return { by: i % 2, lean: 1, armF: L(1.5 - (i < 2 ? (1 - i) * 0.6 : 0), 0.05), armB: L(-0.1, 0.3), legF: L(0.15), legB: L(-0.1), expr: i > 1 ? 'happy' : 'neutral', fxk: 'scepter', t };
      if (k === 'hammer') return { lean: 1, armF: i < 3 ? L(2.6 - i * 0.2, 0.6) : L(1.2, 0.4), armB: L(0.5, 0.4), legF: L(0.3), legB: L(-0.3), expr: 'focus', fxk: 'hammer' };
      return poseFor(id, 'attack', Math.min(3, i));
    }
  }
}

// ------------------------------------------------------------------ cache

const cache = new Map<string, HTMLCanvasElement>();

/** A frame as a canvas (facing right, or mirrored for left). */
export function frame(id: CastId, anim: Anim, i: number, left = false): HTMLCanvasElement {
  const n = ANIMS[anim].frames;
  const k = ((i % n) + n) % n;
  const key = `${id}|${anim}|${k}|${left ? 1 : 0}`;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = FW;
  c.height = FH;
  const ctx = c.getContext('2d')!;
  if (left) {
    ctx.translate(FW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(frame(id, anim, k), 0, 0);
  } else ctx.putImageData(renderPose(CAST[id], poseFor(id, anim, k)), 0, 0);
  cache.set(key, c);
  return c;
}

/** Draw a character with its feet at (x, y). */
export function drawChar(ctx: CanvasRenderingContext2D, id: CastId, anim: Anim, i: number, x: number, y: number, left = false) {
  ctx.drawImage(frame(id, anim, i, left), Math.round(x - PIVOT_X), Math.round(y - PIVOT_Y - 1));
}

/** Rows of the exported sprite sheet, in order. */
export const SHEET_ROWS: [string, Anim, boolean][] = [
  ['idle_front', 'idleFront', false],
  ['idle_back', 'idleBack', false],
  ['idle_right', 'idle', false],
  ['idle_left', 'idle', true],
  ['walk_right', 'walk', false],
  ['walk_left', 'walk', true],
  ['run_right', 'run', false],
  ['run_left', 'run', true],
  ['jump', 'jump', false],
  ['fall', 'fall', false],
  ['land', 'land', false],
  ['hurt', 'hurt', false],
  ['victory', 'victory', false],
  ['interact', 'interact', false],
  ['push', 'push', false],
  ['pickup', 'pickup', false],
  ['defeat', 'defeat', false],
  ['climb', 'climb', false],
  ['attack', 'attack', false],
  ['special', 'special', false],
  ['talk', 'talk', false],
  ['read', 'read', false],
  ['think', 'think', false],
  ['surprise', 'surprise', false],
  ['sad', 'sad', false],
  ['brave', 'brave', false],
];

// ------------------------------------------------------------------ any "look" in the new style

import type { Look, Dir } from '../pixel/person';

/** Convert an old-style look (used across the mini-games and dialogs) into a rig spec. */
export function lookToSpec(l: Look): CharSpec {
  const h = l.head ?? 'hair';
  const cover = h === 'veil' || h === 'turban' || h === 'hood' || h === 'crown' || h === 'helmet';
  const light = parseInt(l.hair.slice(1, 3), 16) > 0xc0;
  const hairStyle: CharSpec['hairStyle'] =
    h === 'bald' ? 'bald' : h === 'long' || h === 'braids' ? 'long' : h === 'curly' ? 'curly' : cover ? 'short' : l.beard && !light ? 'wavy' : 'short';
  return {
    skin: l.skin,
    hair: l.hair,
    hairStyle,
    beard: l.beard ? (light ? 'long' : 'short') : undefined,
    tunic: l.robe,
    sleeve: l.bare ? 'none' : 'long',
    belt: l.trim ?? '#5a3a1e',
    build: l.bare ? 'strong' : undefined,
    robe: h === 'veil' || h === 'hood' || (!!l.cloak && !l.bare),
    coat: l.cloak ? [l.cloak] : undefined,
    sash: l.sash ? (l.trim ?? '#c0302a') : undefined,
    head: cover ? h : undefined,
    headColor: l.headColor ?? (h === 'crown' ? '#f0c030' : undefined),
    glow: l.glow,
    bandage: l.bandage,
  };
}

const lookIds = new WeakMap<Look, string>();
const lookKey = (l: Look) => {
  let k = lookIds.get(l);
  if (!k) {
    k = JSON.stringify(l);
    lookIds.set(l, k);
  }
  return k;
};

/** Heroes and recurring characters keep their official sprite wherever their old look is used. */
const LOOK_CAST = new WeakMap<Look, CastId>();
export function bindCast(look: Look, id: CastId) {
  LOOK_CAST.set(look, id);
}

/** A frame of any look, as the old sprite API asks for it (direction + 4-step walk cycle). */
export function lookFrame(look: Look, dir: Dir, step: number, run = false): HTMLCanvasElement {
  const left = dir === 'left';
  const side = dir === 'left' || dir === 'right';
  const anim: Anim = side ? (step || run ? (run ? 'run' : 'walk') : 'idle') : dir === 'up' ? (step ? 'climb' : 'idleBack') : 'idleFront';
  const n = ANIMS[anim].frames;
  const i = side && (step || run) ? Math.floor((step % 4) * (n / 4)) : dir === 'down' ? (step % 2 ? 2 : 0) : step % n;
  const bound = LOOK_CAST.get(look);
  if (bound) return frame(bound, anim, i, left);
  const key = `L${lookKey(look)}|${anim}|${i}|${left ? 1 : 0}`;
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = FW;
  c.height = FH;
  const ctx = c.getContext('2d')!;
  if (left) {
    ctx.translate(FW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(lookFrame(look, 'right', step, run), 0, 0);
  } else ctx.putImageData(renderPose(lookToSpec(look), poseFor('aldeao', anim, i)), 0, 0);
  cache.set(key, c);
  return c;
}

/** Dialog portrait in the same pixel style: head and shoulders from the front, 30×30. */
export const PORTRAIT = 30;
export function drawPortrait(ctx: CanvasRenderingContext2D, look: Look, mood: 'neutral' | 'happy' | 'sad' | 'facepalm' | 'stern', bg: string) {
  const expr: Expr = mood === 'happy' ? 'happy' : mood === 'sad' ? 'sad' : mood === 'stern' ? 'focus' : mood === 'facepalm' ? 'closed' : 'neutral';
  const key = `P${lookKey(look)}|${expr}`;
  let c = cache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = FW;
    c.height = FH;
    const bound = LOOK_CAST.get(look);
    c.getContext('2d')!.putImageData(renderPose(bound ? CAST[bound] : lookToSpec(look), { view: 'front', expr }), 0, 0);
    cache.set(key, c);
  }
  ctx.clearRect(0, 0, PORTRAIT, PORTRAIT);
  const g = ctx.createLinearGradient(0, 0, 0, PORTRAIT);
  g.addColorStop(0, bg);
  g.addColorStop(1, '#2a1a10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PORTRAIT, PORTRAIT);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  for (let y = 0; y < PORTRAIT; y += 4) ctx.fillRect(0, y, PORTRAIT, 1);
  ctx.imageSmoothingEnabled = false;
  // Head and shoulders: frame rows 3..33 centred on the head.
  ctx.drawImage(c, PIVOT_X - 15, 4, PORTRAIT, PORTRAIT, 0, 1, PORTRAIT, PORTRAIT);
}
