/**
 * Scenery of Corrida da Fé, painted once per place into tileable strips:
 * a dithered 16-bit sky, sun or moon, clouds, far / middle / near layers
 * that scroll at different speeds, and a textured ground tile.
 *
 * Places along Jesus' way: Nazaré, the Judean desert, the Sea of Galilee,
 * Cafarnaum, the Mount of Olives and Jerusalem by night.
 */
import { GROUND, H } from './levels';

export type SceneId = 'nazare' | 'desert' | 'sea' | 'cafarnaum' | 'olives' | 'jerusalem';
const LW = 480; // width of a scenery strip (tileable)
const GT = 64; // width of a ground tile

type Ctx = CanvasRenderingContext2D;
const rngOf = (seed: number) => {
  let s = seed >>> 0 || 7;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
};
const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: string, b: string, k: number) => {
  const x = hex(a);
  const y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',')})`;
};
const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx] as const;
};
const r = (g: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  g.fillStyle = col;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
/** Draw something at x and its wrapped copies, so the strip tiles seamlessly. */
const wrap = (x: number, w: number, f: (x: number) => void) => {
  f(x);
  if (x + w > LW) f(x - LW);
  if (x < 0) f(x + LW);
};

interface Scene {
  sky: string[];
  orb?: { x: number; y: number; r: number; col: string; glow: string; moon?: boolean };
  stars?: boolean;
  clouds: string;
  cloudsDark?: string;
  far: (g: Ctx, rnd: () => number) => void;
  mid: (g: Ctx, rnd: () => number) => void;
  near?: (g: Ctx, rnd: () => number) => void;
  ground: (g: Ctx, rnd: () => number) => void;
  /** Water drawn live instead of a ground tile. */
  water?: boolean;
  haze?: string;
}

// ------------------------------------------------------------------ helpers

/** A ridge line with layered noise; fills down to the bottom. */
function ridge(g: Ctx, base: number, amp: number, col: string, freq: number, seed: number, light?: string) {
  for (let x = 0; x < LW; x++) {
    const k = (x / LW) * Math.PI * 2;
    const y = Math.round(base - amp * (0.55 * Math.sin(k * freq + seed) + 0.3 * Math.sin(k * freq * 2.7 + seed * 2) + 0.15 * Math.sin(k * freq * 6.1 + seed * 3)));
    r(g, x, y, 1, H - y, col);
    if (light && x % 2 === 0) r(g, x, y, 1, 1, light);
  }
}
function house(g: Ctx, x: number, base: number, w: number, h: number, wall: string, shadow: string, opts: { dome?: string; stairs?: boolean; window?: string; lit?: boolean; roofEdge?: string } = {}) {
  wrap(x, w + 2, (X) => {
    r(g, X, base - h, w, h, wall);
    r(g, X + w - 3, base - h, 3, h, shadow);
    r(g, X - 1, base - h - 1, w + 2, 2, opts.roofEdge ?? mix(wall, '#ffffff', 0.25));
    const win = opts.window ?? '#3a2a20';
    for (let wy = base - h + 4; wy < base - 8; wy += 9)
      for (let wx = X + 3; wx < X + w - 6; wx += 7) {
        r(g, wx, wy, 3, 4, opts.lit && (wx + wy) % 3 === 0 ? '#ffd87a' : win);
        r(g, wx, wy - 1, 3, 1, mix(win, wall, 0.5));
      }
    r(g, X + Math.floor(w / 2) - 2, base - 7, 5, 7, '#3a2414');
    r(g, X + Math.floor(w / 2) - 2, base - 8, 5, 1, mix(wall, '#000000', 0.25));
    if (opts.dome) {
      g.fillStyle = opts.dome;
      g.beginPath();
      g.arc(X + w / 2, base - h, w / 3, Math.PI, 0);
      g.fill();
      r(g, X + w / 2 - 1, base - h - w / 3 - 3, 2, 3, opts.dome);
    }
    if (opts.stairs) for (let s = 0; s < Math.min(6, h / 3); s++) r(g, X + w + s * 2, base - s * 3 - 3, 3, 3, shadow);
  });
}
function palm(g: Ctx, x: number, base: number, h: number, trunk: string, leaf: string) {
  wrap(x, 20, (X) => {
    for (let y = 0; y < h; y++) r(g, X + Math.round(Math.sin(y / 9) * 2), base - y, 2, 1, y % 3 ? trunk : mix(trunk, '#000000', 0.25));
    const tx = X + Math.round(Math.sin(h / 9) * 2);
    for (let a = 0; a < 6; a++) {
      const ang = -Math.PI + (a / 5) * Math.PI;
      for (let k = 2; k < 13; k++) r(g, tx + Math.cos(ang) * k, base - h + Math.sin(ang) * k * 0.55 + (k * k) / 26, 2, 1, k > 9 ? mix(leaf, '#000000', 0.2) : leaf);
    }
    r(g, tx - 1, base - h + 1, 4, 3, '#6a4a1e');
  });
}
function olive(g: Ctx, x: number, base: number, s: number, trunk: string, leaf: string, rnd: () => number) {
  wrap(x, s * 3, (X) => {
    for (let y = 0; y < s; y++) r(g, X + Math.round(Math.sin(y / 3) * 1.5), base - y, 3, 1, trunk);
    for (let k = 0; k < 9; k++) {
      const cx = X + (rnd() - 0.5) * s * 1.6;
      const cy = base - s - rnd() * s * 0.6;
      const rr = s * (0.35 + rnd() * 0.25);
      g.fillStyle = k % 3 ? leaf : mix(leaf, '#ffffff', 0.18);
      g.beginPath();
      g.ellipse(cx, cy, rr, rr * 0.7, 0, 0, Math.PI * 2);
      g.fill();
    }
  });
}
function cypress(g: Ctx, x: number, base: number, h: number, col: string) {
  wrap(x, 8, (X) => {
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(X + 3, base - h / 2, 3.5, h / 2, 0, 0, Math.PI * 2);
    g.fill();
    r(g, X + 1, base - h * 0.8, 1, h * 0.6, mix(col, '#ffffff', 0.15));
  });
}
function cloud(g: Ctx, x: number, y: number, w: number, col: string, dark: string) {
  wrap(x, w + 10, (X) => {
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i < 2 ? dark : col;
      const cx = X + (i / 4) * w;
      g.beginPath();
      g.ellipse(cx, y + (i % 2) * 2 + (i < 2 ? 2 : 0), w / 4, w / 7, 0, 0, Math.PI * 2);
      g.fill();
    }
    r(g, X - w / 8, y + w / 10, w * 1.2, 3, col);
  });
}

// ------------------------------------------------------------------ the places

const SCENES: Record<SceneId, Scene> = {
  nazare: {
    sky: ['#7ab8e8', '#9cccec', '#c0dfee', '#f4dcb8'],
    orb: { x: 0.2, y: 52, r: 9, col: '#fff2c8', glow: 'rgba(255,220,150,0.35)' },
    clouds: '#ffffff',
    cloudsDark: '#e2ecf4',
    far: (g) => {
      ridge(g, 92, 16, '#9ab08a', 2, 1, '#b4c8a0');
      ridge(g, 100, 10, '#7e9a6a', 3, 4);
    },
    mid: (g, rnd) => {
      // Nazaré on the hillside: whitewashed and ochre houses, cypress and olive trees.
      ridge(g, 108, 8, '#8aa060', 4, 2);
      for (let i = 0; i < 9; i++) {
        const x = i * 54 + rnd() * 20;
        const base = 106 - (i % 3) * 5;
        const ochre = rnd() < 0.5;
        house(g, x, base, 18 + rnd() * 14, 12 + rnd() * 10, ochre ? '#e6c890' : '#f2ead8', ochre ? '#c8a66a' : '#d2c6ae', { stairs: rnd() < 0.5 });
        if (rnd() < 0.6) cypress(g, x - 8, base, 18 + rnd() * 8, '#3e6a34');
      }
      for (let i = 0; i < 6; i++) olive(g, i * 80 + 30, 112, 8, '#6a5038', '#7a9a5a', rnd);
    },
    near: (g, rnd) => {
      for (let x = 0; x < LW; x += 3) r(g, x, 114 - (x % 7 === 0 ? 1 : 0), 3, 4, (x / 3) % 2 ? '#a89a7a' : '#968a6a');
      for (let i = 0; i < 12; i++) {
        const x = rnd() * LW;
        g.fillStyle = '#5a8a3a';
        g.beginPath();
        g.ellipse(x, 114, 5, 3, 0, 0, Math.PI * 2);
        g.fill();
        r(g, x - 1, 112, 2, 1, '#e86a6a');
      }
    },
    ground: (g, rnd) => {
      r(g, 0, 0, GT, 30, '#c8a874');
      r(g, 0, 0, GT, 2, '#e0c898');
      r(g, 0, 2, GT, 1, '#a88a5a');
      for (let i = 0; i < 26; i++) {
        const x = rnd() * GT;
        const y = 4 + rnd() * 22;
        r(g, x, y, 2 + (i % 2), 1, i % 3 ? '#a88a5a' : '#e0c898');
      }
      for (let x = 0; x < GT; x += 9) r(g, x, 9, 5, 1, '#9a7c4e');
      r(g, 0, 18, GT, 1, '#b4956a');
    },
  },

  desert: {
    sky: ['#5aa8e0', '#8cc4e8', '#bcdcec', '#f0e4c8'],
    orb: { x: 0.78, y: 46, r: 10, col: '#fffbe8', glow: 'rgba(255,245,200,0.4)' },
    clouds: '#ffffff',
    cloudsDark: '#e8eef0',
    haze: 'rgba(255,230,180,0.12)',
    far: (g) => {
      // Judean mesas with layered strata, and a sliver of the Dead Sea.
      ridge(g, 84, 14, '#d8b48a', 2, 0.5, '#e8c8a0');
      for (let y = 84; y < 110; y += 4) for (let x = 0; x < LW; x += 1) if (Math.sin(x / 23 + y) > 0.6) r(g, x, y, 1, 1, '#c49c70');
      r(g, 0, 100, LW, 3, '#7ab0c8');
      r(g, 0, 100, LW, 1, '#a8d4e4');
    },
    mid: (g, rnd) => {
      ridge(g, 104, 9, '#e4c08a', 3, 3, '#f0d4a4');
      // Rock outcrops and acacias.
      for (let i = 0; i < 5; i++) {
        const x = i * 100 + rnd() * 40;
        wrap(x, 30, (X) => {
          g.fillStyle = '#b8875a';
          g.beginPath();
          g.moveTo(X, 108);
          g.lineTo(X + 6, 94);
          g.lineTo(X + 18, 92);
          g.lineTo(X + 26, 108);
          g.fill();
          r(g, X + 6, 94, 12, 2, '#d0a070');
        });
        const ax = x + 50;
        wrap(ax, 24, (X) => {
          r(g, X + 10, 98, 2, 12, '#6a4a2a');
          g.fillStyle = '#7a8a4a';
          g.beginPath();
          g.ellipse(X + 11, 97, 12, 3, 0, 0, Math.PI * 2);
          g.fill();
        });
      }
      // A caravan far away.
      for (let i = 0; i < 4; i++)
        wrap(300 + i * 12, 12, (X) => {
          r(g, X, 99, 8, 4, '#8a6a4a');
          r(g, X + 6, 96, 2, 4, '#8a6a4a');
          r(g, X + 7, 95, 3, 2, '#8a6a4a');
          r(g, X + 1, 103, 1, 4, '#8a6a4a');
          r(g, X + 6, 103, 1, 4, '#8a6a4a');
        });
    },
    near: (g, rnd) => {
      for (let i = 0; i < 14; i++) {
        const x = rnd() * LW;
        wrap(x, 10, (X) => {
          for (let k = 0; k < 5; k++) r(g, X + k * 2, 114 - (k % 2) * 2, 1, 3 + (k % 2) * 2, '#8a7a4a');
        });
      }
    },
    ground: (g, rnd) => {
      r(g, 0, 0, GT, 30, '#e8cc90');
      r(g, 0, 0, GT, 2, '#f6e0b0');
      for (let y = 5; y < 28; y += 5) for (let x = 0; x < GT; x++) if (Math.sin((x + y * 3) / 5) > 0.75) r(g, x, y + Math.round(Math.sin(x / 8) * 1.5), 1, 1, '#d0b072');
      for (let i = 0; i < 4; i++) {
        const x = rnd() * GT;
        const y = 6 + rnd() * 18;
        r(g, x, y, 4, 2, '#a88a62');
        r(g, x, y, 3, 1, '#c8aa80');
      }
    },
  },

  sea: {
    sky: ['#3a4a7a', '#7a7aa0', '#e0a090', '#f8d0a0'],
    orb: { x: 0.25, y: 98, r: 12, col: '#ffe0a0', glow: 'rgba(255,190,120,0.45)' },
    clouds: '#d8b0b0',
    cloudsDark: '#9a8aa8',
    water: true,
    far: (g) => {
      // The hills around the lake, and the far shore with Cafarnaum.
      ridge(g, 92, 10, '#5a6a8a', 2, 2);
      ridge(g, 98, 6, '#4a5a78', 3, 5);
      for (let i = 0; i < 12; i++) r(g, 330 + i * 5, 97 - (i % 3), 4, 3 + (i % 3), '#6a6a88');
    },
    mid: (g) => {
      // Water to the horizon with the sun's path.
      for (let y = 100; y < 122; y++) r(g, 0, y, LW, 1, mix('#c89090', '#2a5a8a', (y - 100) / 22));
      for (let y = 101; y < 120; y += 2) for (let x = 0; x < LW; x += 1) if (Math.sin(x * 0.9 + y * 7) > 0.92) r(g, x, y, 2, 1, '#ffd8a0');
      // Fishing boats with sails.
      for (const bx of [80, 260, 410])
        wrap(bx, 30, (X) => {
          r(g, X, 104, 22, 3, '#4a3020');
          r(g, X + 2, 107, 18, 1, '#3a2418');
          r(g, X + 11, 88, 1, 16, '#3a2418');
          g.fillStyle = '#e8d8c0';
          g.beginPath();
          g.moveTo(X + 12, 89);
          g.lineTo(X + 22, 102);
          g.lineTo(X + 12, 102);
          g.fill();
        });
    },
    ground: () => {},
  },

  cafarnaum: {
    sky: ['#4aa0e0', '#7ac0ea', '#aad8ee', '#dceef2'],
    orb: { x: 0.7, y: 44, r: 9, col: '#fffbe8', glow: 'rgba(255,245,200,0.35)' },
    clouds: '#ffffff',
    cloudsDark: '#dce8f0',
    far: (g) => {
      // The lake behind the town, hills on the other side.
      ridge(g, 86, 8, '#8aa0b0', 2, 3);
      r(g, 0, 92, LW, 20, '#5a9ac8');
      for (let x = 0; x < LW; x += 7) r(g, x, 94 + (x % 3) * 4, 4, 1, '#9ac8e8');
    },
    mid: (g, rnd) => {
      // Black basalt houses and the white synagogue; nets drying; palms.
      for (let i = 0; i < 8; i++) {
        const x = i * 60 + rnd() * 16;
        house(g, x, 110, 20 + rnd() * 10, 12 + rnd() * 8, '#4a4a50', '#36363c', { window: '#1a1a1e', roofEdge: '#6a6a70' });
      }
      wrap(220, 70, (X) => {
        r(g, X, 82, 60, 28, '#ece4d4');
        r(g, X - 3, 79, 66, 4, '#f8f2e4');
        for (let c = 0; c < 6; c++) {
          r(g, X + 4 + c * 10, 86, 4, 24, '#fffaf0');
          r(g, X + 7 + c * 10, 86, 1, 24, '#d8d0c0');
        }
        r(g, X - 3, 83, 66, 1, '#c8bca8');
      });
      for (const nx of [40, 330])
        wrap(nx, 30, (X) => {
          r(g, X, 96, 1, 14, '#5a3a1e');
          r(g, X + 24, 96, 1, 14, '#5a3a1e');
          for (let k = 0; k < 24; k += 2) for (let y = 97; y < 108; y += 2) r(g, X + k, y + Math.round(Math.sin(k / 4) * 1.5), 1, 1, '#a89878');
        });
      palm(g, 150, 110, 26, '#7a5a3a', '#4a8a3a');
      palm(g, 400, 110, 22, '#7a5a3a', '#4a8a3a');
    },
    near: (g) => {
      for (const bx of [100, 360])
        wrap(bx, 30, (X) => {
          r(g, X, 111, 26, 4, '#6a4428');
          r(g, X + 2, 115, 22, 1, '#4a2c18');
          r(g, X + 3, 110, 20, 1, '#8a5a34');
        });
    },
    ground: (g, rnd) => {
      r(g, 0, 0, GT, 30, '#5a5a60');
      for (let y = 0; y < 30; y += 6)
        for (let x = (y / 6) % 2 ? -5 : 0; x < GT; x += 10) {
          r(g, x + 1, y + 1, 8, 4, rnd() < 0.5 ? '#6a6a72' : '#626268');
          r(g, x + 1, y + 1, 8, 1, '#7c7c84');
        }
      r(g, 0, 0, GT, 1, '#8a8a92');
      for (let i = 0; i < 6; i++) r(g, rnd() * GT, 2 + rnd() * 26, 2, 1, '#5aa04a');
    },
  },

  olives: {
    sky: ['#4a5aa0', '#a07aa8', '#f0a080', '#fcd8a0'],
    orb: { x: 0.82, y: 78, r: 13, col: '#ffcc80', glow: 'rgba(255,170,90,0.45)' },
    clouds: '#f8c8a8',
    cloudsDark: '#c890a0',
    far: (g) => {
      // Jerusalem across the Kidron valley: walls and the golden Temple.
      ridge(g, 96, 6, '#7a6a88', 3, 1);
      for (let x = 0; x < LW; x += 1) r(g, x, 88 + (x % 40 < 3 ? -4 : 0), 1, 12, '#8a7a90');
      for (let x = 0; x < LW; x += 8) r(g, x, 86, 4, 2, '#8a7a90');
      wrap(180, 60, (X) => {
        r(g, X, 70, 40, 20, '#d8c8b8');
        r(g, X + 10, 60, 20, 12, '#e8d8c8');
        r(g, X + 10, 59, 20, 2, '#f0c050');
        r(g, X, 69, 40, 1, '#f0c050');
        r(g, X + 17, 76, 6, 14, '#8a6a5a');
      });
    },
    mid: (g, rnd) => {
      // Olive grove on stone terraces.
      for (let t = 0; t < 2; t++) {
        const y = 104 + t * 6;
        for (let x = 0; x < LW; x += 6) r(g, x, y, 5, 3, t ? '#9a8070' : '#8a7068');
        for (let i = 0; i < 9; i++) olive(g, i * 54 + t * 25 + rnd() * 10, y, 9 + rnd() * 4, '#5a4038', t ? '#6a8a5a' : '#5a7a52', rnd);
      }
    },
    near: (g, rnd) => {
      for (let x = 0; x < LW; x += 5) r(g, x, 113, 4, 4, (x / 5) % 2 ? '#a88a78' : '#987a6a');
      for (let i = 0; i < 18; i++) r(g, rnd() * LW, 111 + rnd() * 2, 1, 2, ['#f0d060', '#e87a8a', '#ffffff'][i % 3]);
    },
    ground: (g, rnd) => {
      r(g, 0, 0, GT, 30, '#a8745a');
      r(g, 0, 0, GT, 3, '#6a9a4a');
      r(g, 0, 3, GT, 1, '#4a7a34');
      for (let i = 0; i < 20; i++) r(g, rnd() * GT, 5 + rnd() * 22, 2, 1, i % 2 ? '#8a5a44' : '#c08a6a');
      for (let x = 0; x < GT; x += 4) r(g, x, 0, 1, 2 + (x % 3), '#7aaa52');
    },
  },

  jerusalem: {
    sky: ['#0a1030', '#141c44', '#202a58', '#2e386a'],
    orb: { x: 0.8, y: 50, r: 8, col: '#f4f0dc', glow: 'rgba(220,230,255,0.25)', moon: true },
    stars: true,
    clouds: '#3a4478',
    cloudsDark: '#2a3260',
    far: (g) => {
      // The Temple on its mount, the city walls with towers.
      ridge(g, 100, 4, '#262a4a', 3, 2);
      wrap(120, 90, (X) => {
        r(g, X, 74, 80, 26, '#c8c0b0');
        r(g, X + 25, 56, 30, 20, '#d8d0c0');
        r(g, X + 25, 55, 30, 2, '#f0c050');
        r(g, X, 73, 80, 1, '#f0c050');
        r(g, X + 36, 64, 8, 12, '#3a3040');
        for (let c = 0; c < 8; c++) r(g, X + 3 + c * 10, 78, 3, 22, '#e8e0d0');
      });
      for (let x = 0; x < LW; x++) r(g, x, 94, 1, 10, '#3a3a5a');
      for (let x = 0; x < LW; x += 8) r(g, x, 92, 4, 2, '#3a3a5a');
      for (const tx of [30, 260, 400])
        wrap(tx, 12, (X) => {
          r(g, X, 82, 10, 14, '#34344e');
          for (let k = 0; k < 10; k += 4) r(g, X + k, 80, 2, 2, '#34344e');
          r(g, X + 4, 86, 2, 3, '#ffd87a');
        });
    },
    mid: (g, rnd) => {
      for (let i = 0; i < 10; i++) {
        const x = i * 48 + rnd() * 12;
        house(g, x, 112, 18 + rnd() * 12, 14 + rnd() * 12, '#4a4a68', '#3a3a54', { dome: rnd() < 0.3 ? '#5a5a7a' : undefined, window: '#2a2a3a', lit: true, roofEdge: '#5e5e7e' });
      }
      palm(g, 90, 112, 24, '#3a3040', '#2a4a3a');
      palm(g, 330, 112, 20, '#3a3040', '#2a4a3a');
    },
    near: (g) => {
      // Oil lamps on posts.
      for (const lx of [60, 220, 380])
        wrap(lx, 20, (X) => {
          r(g, X, 100, 2, 16, '#2a2030');
          r(g, X - 2, 98, 6, 3, '#5a4030');
          const gl = g.createRadialGradient(X + 1, 97, 1, X + 1, 97, 14);
          gl.addColorStop(0, 'rgba(255,200,100,0.55)');
          gl.addColorStop(1, 'rgba(255,200,100,0)');
          g.fillStyle = gl;
          g.fillRect(X - 14, 83, 30, 30);
          r(g, X, 95, 2, 3, '#ffd87a');
        });
    },
    ground: (g) => {
      r(g, 0, 0, GT, 30, '#5e5868');
      for (let y = 0; y < 30; y += 7)
        for (let x = (y / 7) % 2 ? -8 : 0; x < GT; x += 16) {
          r(g, x + 1, y + 1, 14, 5, '#6e6878');
          r(g, x + 1, y + 1, 14, 1, '#847c8c');
        }
      r(g, 0, 0, GT, 1, '#948ca0');
    },
  },
};

// ------------------------------------------------------------------ cache and drawing

const cache = new Map<SceneId, { sky: HTMLCanvasElement; clouds: HTMLCanvasElement; far: HTMLCanvasElement; mid: HTMLCanvasElement; near: HTMLCanvasElement | null; ground: HTMLCanvasElement }>();

function build(id: SceneId) {
  const hit = cache.get(id);
  if (hit) return hit;
  const sc = SCENES[id];
  const rnd = rngOf(id.length * 7919 + id.charCodeAt(0));
  // Sky: four bands, dithered at the joins (a 16-bit look).
  const [sky, gs] = canvas(8, GROUND);
  const bands = sc.sky;
  const bh = GROUND / bands.length;
  for (let y = 0; y < GROUND; y++) {
    const b = Math.min(bands.length - 1, Math.floor(y / bh));
    const within = (y - b * bh) / bh;
    for (let x = 0; x < 8; x++) {
      const next = b + 1 < bands.length && within > 0.75 && (x + y) % 2 === 0;
      const prev = b > 0 && within < 0.12 && (x + y) % 2 === 1;
      r(gs, x, y, 1, 1, next ? bands[b + 1] : prev ? bands[b - 1] : bands[b]);
    }
  }
  const [clouds, gc] = canvas(LW, GROUND);
  for (let i = 0; i < 6; i++) cloud(gc, i * 80 + rnd() * 30, 40 + rnd() * 30, 22 + rnd() * 18, sc.clouds, sc.cloudsDark ?? sc.clouds);
  const layer = (f?: (g: Ctx, rnd: () => number) => void) => {
    if (!f) return null;
    const [c, g] = canvas(LW, H);
    f(g, rnd);
    return c;
  };
  const [ground, gg] = canvas(GT, H - GROUND);
  sc.ground(gg, rnd);
  const out = { sky, clouds, far: layer(sc.far)!, mid: layer(sc.mid)!, near: layer(sc.near), ground };
  cache.set(id, out);
  return out;
}

const tile = (ctx: Ctx, img: HTMLCanvasElement, off: number, W: number, y = 0) => {
  const x0 = -(((off % img.width) + img.width) % img.width);
  for (let x = x0; x < W; x += img.width) ctx.drawImage(img, Math.round(x), y);
};

/** Sky and scenery up to the ground line. */
export function drawScene(ctx: Ctx, id: SceneId, W: number, cam: number, time: number, alpha = 1) {
  const sc = SCENES[id];
  const L = build(id);
  ctx.globalAlpha = alpha;
  ctx.drawImage(L.sky, 0, 0, W, GROUND);
  if (sc.stars)
    for (let i = 0; i < 50; i++) {
      ctx.globalAlpha = alpha * (0.4 + 0.6 * Math.abs(Math.sin(time * 1.5 + i)));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((i * 97 + Math.floor(cam * 0.02)) % W, 34 + ((i * 37) % 50), 1, 1);
    }
  ctx.globalAlpha = alpha;
  if (sc.orb) {
    const o = sc.orb;
    const x = o.x * W;
    const g = ctx.createRadialGradient(x, o.y, o.r * 0.6, x, o.y, o.r * 3.5);
    g.addColorStop(0, o.glow);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - o.r * 4, o.y - o.r * 4, o.r * 8, o.r * 8);
    ctx.fillStyle = o.col;
    ctx.beginPath();
    ctx.arc(x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
    if (o.moon) {
      ctx.fillStyle = 'rgba(180,180,200,0.5)';
      ctx.fillRect(x - 3, o.y - 2, 2, 2);
      ctx.fillRect(x + 2, o.y + 2, 3, 2);
    }
  }
  tile(ctx, L.clouds, cam * 0.05 + time * 4, W);
  tile(ctx, L.far, cam * 0.15, W);
  tile(ctx, L.mid, cam * 0.4, W);
  if (L.near) tile(ctx, L.near, cam * 0.7, W);
  if (sc.haze) {
    ctx.fillStyle = sc.haze;
    for (let y = 100; y < GROUND; y += 3) ctx.fillRect(0, y + Math.sin(time * 3 + y) * 0.5, W, 1);
  }
  ctx.globalAlpha = 1;
}

/** Ground strip from the ground line down (pits are cut by the caller). */
export function drawGround(ctx: Ctx, id: SceneId, W: number, cam: number, time: number) {
  const sc = SCENES[id];
  if (sc.water) {
    // Walking on the water: deep bands, foam crests, sun glitter.
    for (let y = GROUND; y < H; y++) {
      ctx.fillStyle = mix('#3a7ab2', '#183a64', (y - GROUND) / (H - GROUND));
      ctx.fillRect(0, y, W, 1);
    }
    for (let x = 0; x < W; x++) {
      const wx = x + cam;
      const crest = Math.sin(wx / 9 + time * 3) + Math.sin(wx / 23 - time * 1.3);
      if (crest > 1.1) {
        ctx.fillStyle = '#e8f6fc';
        ctx.fillRect(x, GROUND - 1, 1, 2);
      } else if (crest > 0.6) {
        ctx.fillStyle = '#8ac4e8';
        ctx.fillRect(x, GROUND, 1, 1);
      }
      if (Math.sin(wx * 0.7 + time * 5) > 0.97) {
        ctx.fillStyle = '#ffe8b0';
        ctx.fillRect(x, GROUND + 4 + (Math.floor(wx) % 9), 2, 1);
      }
      if (Math.sin(wx / 5 + time * 2 + 1) > 0.85) {
        ctx.fillStyle = '#2a5a8e';
        ctx.fillRect(x, GROUND + 8 + (Math.floor(wx) % 6), 3, 1);
      }
    }
    return;
  }
  tile(ctx, build(id).ground, cam, W, GROUND);
}

/** Endless run: the places follow one another along the way. */
export const ENDLESS_ORDER: SceneId[] = ['nazare', 'desert', 'sea', 'cafarnaum', 'olives', 'jerusalem'];
export const ENDLESS_SPAN = 1800;
