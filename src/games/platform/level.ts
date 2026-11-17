/**
 * Side-view action-platformer levels, built from hand-made segments that are
 * each traversable from left to right on the floor line, so any sequence of
 * them is solvable. A validator double-checks reachability (keys, doors,
 * levers, pressure plates, lever sequences and breakable walls).
 *
 * Tiles: '#' solid · '=' one-way platform · 'H' ladder · '^' spikes · '~' water
 *        'k' key · 'D' locked door · 'L' lever · 'G' gate (opened by the lever)
 *        'B' pushable crate · 'p' pressure plate · 'O' gate held open by a crate on the plate
 *        '1' '2' '3' levers to pull in order (shown on a mural 'm') · 'Q' gate of the sequence
 *        'x' cracked wall (only a strong hero breaks it) · '?' false wall hiding a secret
 *        '*' gem · 'P' start · 'E' exit · 'C' checkpoint · 'N' person · 'S' sick person (heal)
 *        'X' enemy that patrols · 'A' small creature (snake, scorpion) · 'W' flying creature
 *        'T' torch · 'V' vase · 'b' bush to hide in
 */

export type ThemeId = 'egypt' | 'palace' | 'desert' | 'cave' | 'village' | 'temple' | 'shore' | 'night';
export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night' | 'storm';
/** How the hero deals with enemies. */
export type Style = 'sling' | 'strong' | 'stealth' | 'peace';

const S: Record<string, string[]> = {
  start: ['......', '......', '......', '......', '......', '......', '...T..', '......', '.P....', '######'],
  flat: ['........', '........', '........', '........', '........', '........', '..*..*..', '........', '......V.', '########'],
  npc: ['........', '........', '........', '........', '........', '....T...', '........', '........', '...N....', '########'],
  pit: ['........', '........', '........', '........', '........', '........', '...*....', '........', '........', '##^^^###'],
  steps: ['............', '............', '............', '......*.....', '.....===....', '............', '...===..===.', '............', '.===......==', '############'],
  ledge: ['..........', '..........', '......*...', '....H.....', '....H###..', '....H###..', '....H###..', '....H###..', '....H###..', '##########'],
  key: ['..........', '....k.....', '...===....', '..........', '......==..', '..........', '...==.....', '..........', '..........', '##########'],
  door: ['...#..', '...#..', '...#..', '...#..', '...#..', '...#..', '...#..', '...D..', '...D..', '######'],
  lever: ['.........#..', '.........#..', '.........#..', '.........#..', '.........#..', '.........#..', '.........#..', '...*.....G..', '..L......G..', '############'],
  water: ['..........', '..........', '..........', '..........', '..........', '..........', '....*.....', '..........', '...=..=...', '##~~~~~~##'],
  spikes: ['............', '............', '............', '............', '....*.......', '............', '..===...===.', '............', '............', '#^^^^^^^^^^#'],
  tower: ['.....*......', '....===.....', '............', '.......===..', '............', '....===.....', '............', '.......===..', '............', '############'],
  check: ['....', '....', '....', '....', '....', '....', '....', '....', '.C..', '####'],
  crate: ['........', '........', '........', '........', '....*...', '........', '........', '........', '..B.....', '########'],
  exit: ['.....#', '.....#', '.....#', '.....#', '.....#', '.....#', '..T..#', '.....#', '..E..#', '######'],
  // Puzzles built into the level.
  plate: ['..........#..', '..........#..', '..........#..', '..........#..', '..........#..', '..........#..', '..........#..', '....*.....O..', '..B....p..O..', '#############'],
  sequence: [
    '..............#..',
    '..............#..',
    '..............#..',
    '..............#..',
    '..m...........#..',
    '..............#..',
    '.......*......#..',
    '..............Q..',
    '...1...2...3..Q..',
    '#################',
  ],
  secret: ['............', '............', '....####....', '....#**?....', '....#*.?....', '....#####...', '............', '.........==.', '............', '############'],
  // Enemies.
  guard: [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '....===.......',
    '..............',
    '..............',
    '..b......X....',
    '##############',
  ],
  patrol: [
    '..............',
    '..............',
    '..............',
    '.......*......',
    '......===.....',
    '..............',
    '..===....===..',
    '..............',
    '.....X.....b..',
    '##############',
  ],
  beasts: ['............', '............', '............', '............', '......W.....', '............', '....*...*...', '............', '...A....A...', '############'],
  breakwall: ['.....#....', '.....#....', '.....#....', '.....#....', '.....#....', '.....#....', '.....#....', '.....x....', '..*..x....', '##########'],
  sick: ['..........', '..........', '..........', '..........', '..........', '..........', '..........', '..........', '....S.....', '##########'],
};

export interface LevelSpec {
  theme: ThemeId;
  segments: string[];
  /** What the people say, in order of appearance. */
  npc?: string[];
  goal?: string;
  time?: TimeOfDay;
}

/** Glue segments into the 12-row grid (with a ceiling and a bedrock row). */
export function buildLevel(spec: LevelSpec): string[] {
  const rows: string[] = Array.from({ length: 10 }, () => '');
  for (const name of spec.segments) {
    const seg = S[name];
    if (!seg) throw new Error(`segment ${name}`);
    seg.forEach((r, i) => (rows[i] += r));
  }
  const w = rows[0].length;
  const body = rows.map((r) => '#' + r.slice(1));
  return ['#'.repeat(w), ...body, '#'.repeat(w)];
}

/** Segments that challenge each kind of hero. */
const ENEMY: Record<Style, string[]> = {
  sling: ['patrol', 'beasts', 'guard'],
  strong: ['breakwall', 'patrol', 'guard'],
  stealth: ['guard', 'patrol', 'beasts'],
  peace: ['beasts', 'sick', 'guard'],
};

/** Standard chapter level: puzzles, enemies and a checkpoint, by chapter and difficulty. */
export function chapterLevel(theme: ThemeId, chapter: number, diff: number, npc?: string[], goal?: string, style: Style = 'peace', time?: TimeOfDay): LevelSpec {
  const pool = [
    ['flat', 'pit', 'key', 'steps', 'door'],
    ['steps', 'lever', 'water', 'plate'],
    ['ledge', 'key', 'pit', 'door', 'secret'],
    ['tower', 'sequence', 'spikes', 'flat'],
    ['crate', 'water', 'key', 'ledge', 'door'],
    ['spikes', 'plate', 'tower', 'lever'],
    ['secret', 'steps', 'sequence', 'pit'],
  ];
  const a = pool[chapter % pool.length];
  const b = pool[(chapter + 3) % pool.length].filter((x) => x !== 'door' && x !== 'key');
  const en = ENEMY[style];
  const e1 = en[chapter % en.length];
  const e2 = en[(chapter + 1) % en.length];
  const mid = diff === 0 ? [e1] : diff === 1 ? [e1, ...b.slice(0, 2)] : [e1, ...b.slice(0, 3), e2];
  // Jesus always meets someone to heal.
  const heal = style === 'peace' ? ['sick'] : [];
  return { theme, time, segments: ['start', 'npc', ...a.slice(0, 2), ...heal, ...a.slice(2), 'check', ...mid, 'flat', 'exit'], npc, goal };
}

// ---------------------------------------------------------------- validator

/** True if the exit is reachable with the hero's jump (3 up, 3 across), ladders and mechanisms. */
export function validate(rows: string[], strong = false): boolean {
  const H = rows.length;
  const W = rows[0].length;
  const at = (r: number, c: number) => (r < 0 || c < 0 || r >= H || c >= W ? '#' : rows[r][c]);
  let keys = 0;
  let doorsOpen = new Set<string>();
  let gatesOpen = false;
  let plateOpen = false;
  const seq = new Set<string>();
  const taken = new Set<string>();
  const hasCrate = rows.some((r) => r.includes('B'));
  const solid = (r: number, c: number) => {
    const t = at(r, c);
    if (t === '#') return true;
    if (t === 'D') return !doorsOpen.has(`${r},${c}`);
    if (t === 'G') return !gatesOpen;
    if (t === 'O') return !plateOpen;
    if (t === 'Q') return seq.size < 3;
    if (t === 'x') return !strong;
    return false;
  };
  const supportAt = (r: number, c: number) => solid(r + 1, c) || at(r + 1, c) === '=' || at(r + 1, c) === 'H' || at(r + 1, c) === 'B';
  const deadly = (r: number, c: number) => at(r, c) === '^' || at(r, c) === '~';
  const free = (r: number, c: number) => !solid(r, c) && !solid(r - 1, c) && !deadly(r, c);
  const fall = (r: number, c: number) => {
    while (r < H - 1 && !supportAt(r, c) && at(r, c) !== 'H') {
      r += 1;
      if (solid(r, c)) return null;
    }
    return deadly(r, c) ? null : r;
  };
  let start: [number, number] = [0, 0];
  rows.forEach((row, r) => [...row].forEach((ch, c) => ch === 'P' && (start = [r, c])));
  for (let round = 0; round < 30; round++) {
    const seen = new Set<string>();
    const q: [number, number][] = [start];
    seen.add(start.join());
    let changed = false;
    let exit = false;
    while (q.length) {
      const [r, c] = q.shift()!;
      const t = at(r, c);
      if (t === 'E') exit = true;
      if (t === 'k' && !taken.has(`${r},${c}`)) {
        taken.add(`${r},${c}`);
        keys += 1;
        changed = true;
      }
      if (t === 'L' && !gatesOpen) {
        gatesOpen = true;
        changed = true;
      }
      if (t === 'p' && hasCrate && !plateOpen) {
        plateOpen = true;
        changed = true;
      }
      if ('123'.includes(t) && !seq.has(t)) {
        seq.add(t);
        changed = true;
      }
      const push = (nr: number, nc: number) => {
        const k = `${nr},${nc}`;
        if (!seen.has(k) && free(nr, nc)) {
          seen.add(k);
          q.push([nr, nc]);
        }
      };
      for (const dc of [-1, 1])
        if (at(r, c + dc) === 'D' && solid(r, c + dc) && keys > doorsOpen.size / 2) {
          doorsOpen = new Set([...doorsOpen, `${r},${c + dc}`, `${r - 1},${c + dc}`]);
          changed = true;
        }
      const onLadder = at(r, c) === 'H';
      for (const dc of [-1, 1]) {
        if (!free(r, c + dc)) continue;
        const fr = fall(r, c + dc);
        if (fr !== null) push(fr, c + dc);
      }
      if (onLadder || at(r + 1, c) === 'H') {
        if (at(r - 1, c) === 'H' || onLadder) push(r - 1, c);
        if (at(r + 1, c) === 'H') push(r + 1, c);
      }
      if (supportAt(r, c) || onLadder)
        for (let dy = 1; dy <= 3; dy++) {
          if (solid(r - dy - 1, c)) break;
          for (let dx = -3; dx <= 3; dx++) {
            const nc = c + dx;
            const nr = r - dy;
            let ok = true;
            for (let k = 1; k <= Math.abs(dx); k++) if (solid(nr, c + Math.sign(dx) * k) || solid(nr - 1, c + Math.sign(dx) * k)) ok = false;
            if (!ok || !free(nr, nc)) continue;
            const fr = fall(nr, nc);
            if (fr !== null) push(fr, nc);
          }
        }
      if (supportAt(r, c))
        for (const dir of [-1, 1])
          for (let dx = 2; dx <= 4; dx++) {
            const nc = c + dir * dx;
            let ok = true;
            for (let k = 1; k <= dx; k++) if (solid(r - 1, c + dir * k) || solid(r - 2, c + dir * k)) ok = false;
            if (!ok || !free(r, nc)) continue;
            const fr = fall(r, nc);
            if (fr !== null) push(fr, nc);
          }
    }
    if (exit) return true;
    if (!changed) return false;
  }
  return false;
}
