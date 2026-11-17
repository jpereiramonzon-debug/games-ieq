/**
 * One-colour pixel sprites for "Corrida da Fé", in the spirit of the offline
 * browser runner: dark ink on a pale ground, with a light fill for details.
 * x = ink, m = mid tone, l = light fill, . = transparent.
 */

export interface Palette {
  paper: string;
  ink: string;
  mid: string;
}

export type Sprite = string[];

// Jesus running to the right: long hair behind, beard, robe with a sash.
const HEAD = [
  '....xxxxxx......',
  '...xxxxxxxxx....',
  '..xxxxxlllllx...',
  '..xxxxlllxlllx..',
  '..xxxxllllllllx.',
  '..xxxxlllllllx..',
  '..xxxxxxxxlllx..',
  '..xxx.xxxxxxxx..',
  '..xx...xxxxxx...',
];
const ROBE = [
  '...xxxxxxxxxx...',
  '..xllllllxllllx.',
  '.xllllllxlllllx.',
  '.xlllllxllllllx.',
  '.xllllxlllllllx.',
  '..xlllxllllllx..',
  '..xllxlllllllx..',
  '..xlllllllllllx.',
  '..xxxxxxxxxxxxx.',
];
export const JESUS_RUN: Sprite[] = [
  [...HEAD, ...ROBE, '...xx......xx...', '...xx.....xx....', '..xx.......xx...', '..xxx......xxx..'],
  [...HEAD, ...ROBE, '.....xx.xx......', '.....xx.xx......', '......xxx.......', '.....xxxxx......'],
];
export const JESUS_JUMP: Sprite = [...HEAD, ...ROBE, '....xx..xx......', '...xx....xx.....', '...x......x.....', '................'];
export const JESUS_DUCK: Sprite = [
  '........xxxxxx......',
  '.......xxxxxxxxx....',
  '......xxxxxlllllx...',
  '......xxxxlllxlllx..',
  '......xxxxlllllllx..',
  '..xxxxxxxxxxxlllx...',
  '.xllllllxxxxxxxx....',
  '.xlllllllxllllllx...',
  '.xllllllxlllllllx...',
  '.xlllllxllllllllx...',
  '..xxxxxxxxxxxxxx....',
  '...xx........xx.....',
  '..xxx.......xxx.....',
];

export const SNAKE: Sprite[] = [
  ['...........xxx..', '..........xlxxx.', 'xx..xxx..xxxx...', '.xxxx.xxxx......'],
  ['...........xxx..', '..........xlxxx.', '.xxx..xxx.xxx...', 'xx..xxx..xx.....'],
];
export const BIRD: Sprite[] = [
  ['....x.........', '...xx.........', '..xxx.....xx..', '.xxxxxxxxxlxx.', 'xxxxxxxxxxxxxx', '......xxxxx...', '..............'],
  ['..............', '..............', '..........xx..', '.xxxxxxxxxlxx.', 'xxxxxxxxxxxxxx', '...xxxxxxx....', '...xx.........', '..xx..........'],
];
export const GOAT: Sprite[] = [
  ['.x.x..........', 'xxxxx.........', 'xlxxxx........', '.xxxxxxxxxxx..', '..xxxxxxxxxxxx', '..xxxxxxxxxxx.', '..x.x....x.x..', '..x.x....x.x..'],
  ['.x.x..........', 'xxxxx.........', 'xlxxxx........', '.xxxxxxxxxxx..', '..xxxxxxxxxxxx', '..xxxxxxxxxxx.', '...x.x..x.x...', '..x...x.x...x.'],
];
export const ROCK: Sprite = ['....xxxx....', '..xxllllxx..', '.xllllllllx.', 'xlllllmlllxx', 'xllmllllllmx', 'xllllllmlllx', '.xxxxxxxxxx.'];
export const THORN: Sprite = [
  '....x.....',
  '.x.xxx..x.',
  'xxx.x..xxx',
  '.x..x.x.x.',
  '..x.xx..x.',
  'x.xxx.xx..',
  'xx.x..x.xx',
  '.x.xx.x.x.',
  '..xxxxxx..',
  '...xxxx...',
  '....xx....',
  '....xx....',
];
export const JAR: Sprite = ['..xxxx..', '.xllllx.', '..xllx..', '.xllllx.', 'xllmmllx', 'xllllllx', 'xlmmmmlx', '.xllllx.', '..xxxx..'];
export const WAVE: Sprite = [
  '......xxxx....',
  '....xxllllx...',
  '...xlllxxllx..',
  '..xllx...xlx..',
  '..xlx.....x...',
  '.xllx.........',
  '.xlllx........',
  'xlllllxx......',
  'xllllllllxx...',
  'xlllllllllllxx',
  'xmmmmmmmmmmmmx',
  'xxxxxxxxxxxxxx',
];
export const FISH: Sprite = ['....xxxx..', '.xxxllllx.', 'xlxllxlllx', 'xxlllllllx', '.xxxllllx.', '....xxxx..'];
export const BREAD: Sprite = ['..xxxxx..', '.xllmllx.', 'xlmllmllx', 'xlllllllx', '.xxxxxxx.'];
export const FISH_ITEM: Sprite = ['x...xxxx.', 'xx.xllllx', 'xxxlllxlx', 'xx.xllllx', 'x...xxxx.'];
export const DOVE: Sprite = ['......xx....', '.....xllx...', 'xx..xlllxx..', 'xlxxlllllxx.', '.xllllllllxx', '..xxllllxx..', '....xxxx....'];
export const HALO: Sprite = ['..xxxxxx..', '.xllllllx.', 'xll....llx', '.xllllllx.', '..xxxxxx..'];
export const STAFF: Sprite = ['.xxx', 'x..x', 'x..x', '...x', '...x', '...x', '...x', '...x', '...x', '...x', '...x', '...x', '...x'];
export const BOX: Sprite = [
  'xxxxxxxxxxxxxx',
  'xllllllllllllx',
  'xlx.......lxlx',
  'xl....xx....lx',
  'xl....xx....lx',
  'xl..xxxxxx..lx',
  'xl..xxxxxx..lx',
  'xl....xx....lx',
  'xl....xx....lx',
  'xl....xx....lx',
  'xlx........xlx',
  'xllllllllllllx',
  'xxxxxxxxxxxxxx',
];
export const BOX_USED: Sprite = [
  'xxxxxxxxxxxxxx',
  'xmmmmmmmmmmmmx',
  'xm.m.m.m.m.mmx',
  'xmm.m.m.m.m.mx',
  'xm.m.m.m.m.mmx',
  'xmm.m.m.m.m.mx',
  'xm.m.m.m.m.mmx',
  'xmm.m.m.m.m.mx',
  'xm.m.m.m.m.mmx',
  'xmm.m.m.m.m.mx',
  'xm.m.m.m.m.mmx',
  'xmmmmmmmmmmmmx',
  'xxxxxxxxxxxxxx',
];
export const CLOUD: Sprite = ['.....xxxx......', '...xxllllxx....', '.xxllllllllxxx.', 'xlllllllllllllx', 'xxxxxxxxxxxxxxx'];

const COLORS = (p: Palette): Record<string, string> => ({ x: p.ink, m: p.mid, l: p.paper });

export function draw(ctx: CanvasRenderingContext2D, sprite: Sprite, x: number, y: number, p: Palette, alpha = 1) {
  const map = COLORS(p);
  ctx.globalAlpha = alpha;
  for (let j = 0; j < sprite.length; j++) {
    const row = sprite[j];
    for (let i = 0; i < row.length; i++) {
      const c = map[row[i]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x) + i, Math.round(y) + j, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

export const size = (s: Sprite) => ({ w: s[0].length, h: s.length });
