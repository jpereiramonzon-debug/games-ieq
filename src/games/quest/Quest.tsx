import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, RotateCw, ScrollText, X } from 'lucide-react';
import { engine } from '../../audio/engine';
import { set, get, submitScore, useStore } from '../../store';
import { cx } from '../../ui/kit';
import { HYMNS } from '../jesus/hymns';
import { RotateHint, useIsPortrait } from '../pixel/orientation';
import { Dialog, Portrait } from '../pixel/Dialog';
import { AButton, Joystick, Typed } from '../pixel/Controls';
import { Qte, type QteKind } from '../pixel/Qte';
import { drawPerson, LOOKS, personFrame, type Dir, type Look } from '../pixel/person';
import { GameShell } from '../Shell';
import { DiffPicker } from '../pixel/StoryMode';
import { BATTLE_WIN, L, QUESTS, SPEAKERS, TEMPTATIONS, type Line, type QuestId, type Who } from './content';
import { buildMap, drawWater, isSolid, MH, MW, paintMap, SPOTS, T, type Tile } from './map';

const VH = 180;
const SPEED = 66;

interface Npc {
  id: string;
  look: Look;
  x: number;
  y: number;
  dir: Dir;
  hidden?: boolean;
  /** Walking to a point, then optionally vanishing. */
  to?: { x: number; y: number; vanish?: boolean };
  step: number;
  bob?: number; // happy hop end time
  basket?: boolean;
}

interface Table {
  x: number;
  y: number;
  flipped: number; // time it was flipped, 0 = standing
  merchant: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Game {
  map: Tile[][];
  mapCanvas: HTMLCanvasElement;
  px: number;
  py: number;
  dir: Dir;
  walked: number;
  trail: { x: number; y: number; dir: Dir }[];
  npcs: Npc[];
  tables: Table[];
  parts: Particle[];
  time: number;
  keys: { x: number; y: number };
  done: Set<QuestId>;
  healed: Set<string>;
  hasBread: boolean;
  fed: Set<number>;
  sermon: 'idle' | 'gathering' | 'teaching' | 'done';
  templeWarned: boolean;
  music: { i: number; at: number; bi: number; bat: number };
}

const tile = (n: number) => n * T + T / 2;
const feet = (n: number) => n * T + T - 2;

function makeGame(done: QuestId[]): Game {
  const map = buildMap();
  const npcs: Npc[] = [];
  const add = (id: string, look: Look, tx: number, ty: number, dir: Dir = 'down', hidden = false) => npcs.push({ id, look, x: tile(tx), y: feet(ty), dir, step: 0, hidden });
  const d = new Set(done);
  add('peter', LOOKS.peter, SPOTS.peter[0], SPOTS.peter[1], 'left');
  add('boy', LOOKS.boy, SPOTS.boy[0], SPOTS.boy[1]);
  add('blind', d.has('heal') ? { ...LOOKS.blind, bandage: undefined } : LOOKS.blind, SPOTS.blind[0], SPOTS.blind[1]);
  add('leper', d.has('heal') ? LOOKS.villager : LOOKS.leper, SPOTS.leper[0], SPOTS.leper[1]);
  add('woman', LOOKS.woman, 16, 7, 'right');
  add('elder', LOOKS.elder, 25, 16, 'left');
  const groupLooks = [LOOKS.villager, LOOKS.woman, { ...LOOKS.villager, robe: '#8a9ab8', hair: '#4a3020' }, { ...LOOKS.woman, robe: '#6a8a5a', headColor: '#e8dcc0' }, LOOKS.elder];
  SPOTS.groups.forEach(([gx, gy], i) => {
    add(`g${i}a`, groupLooks[i % groupLooks.length], gx, gy, 'right');
    add(`g${i}b`, groupLooks[(i + 2) % groupLooks.length], gx + 1, gy, 'left');
    if (d.has('bread')) npcs.slice(-2).forEach((n) => (n.basket = true));
  });
  const tables: Table[] = SPOTS.tables.map(([tx, ty], i) => ({ x: tx * T, y: ty * T + 8, flipped: d.has('temple') ? -1 : 0, merchant: `m${i}` }));
  SPOTS.tables.forEach(([tx, ty], i) => add(`m${i}`, { ...LOOKS.merchant, robe: ['#7a3a8a', '#3a6a8a', '#8a5a2a', '#2a7a5a'][i] }, tx + 1, ty - 1, 'down', d.has('temple')));
  add('tempter', LOOKS.tempter, SPOTS.tempter[0], SPOTS.tempter[1], 'right', d.has('desert'));
  return {
    map,
    mapCanvas: paintMap(map),
    px: tile(SPOTS.start[0]),
    py: feet(SPOTS.start[1]),
    dir: 'down',
    walked: 0,
    trail: [],
    npcs,
    tables,
    parts: [],
    time: 0,
    keys: { x: 0, y: 0 },
    done: d,
    healed: new Set(d.has('heal') ? ['blind', 'leper'] : []),
    hasBread: d.has('bread'),
    fed: new Set(d.has('bread') ? [0, 1, 2, 3, 4] : []),
    sermon: d.has('sermon') ? 'done' : 'idle',
    templeWarned: false,
    music: { i: 0, at: 0, bi: 0, bat: 0 },
  };
}

/** Where the arrow should point for the next unfinished mission. */
function objective(g: Game): { x: number; y: number } | null {
  if (!g.done.has('call')) return { x: tile(SPOTS.peter[0]), y: feet(SPOTS.peter[1]) };
  if (!g.done.has('heal')) {
    const n = !g.healed.has('blind') ? SPOTS.blind : SPOTS.leper;
    return { x: tile(n[0]), y: feet(n[1]) };
  }
  if (!g.done.has('bread')) {
    if (!g.hasBread) return { x: tile(SPOTS.boy[0]), y: feet(SPOTS.boy[1]) };
    const i = [0, 1, 2, 3, 4].find((k) => !g.fed.has(k)) ?? 0;
    return { x: tile(SPOTS.groups[i][0]), y: feet(SPOTS.groups[i][1]) };
  }
  if (!g.done.has('sermon')) return { x: tile(SPOTS.rock[0]), y: feet(SPOTS.rock[1] + 1) };
  if (!g.done.has('temple')) {
    const t = g.tables.find((x) => !x.flipped);
    return t ? { x: t.x + 12, y: t.y + 8 } : null;
  }
  if (!g.done.has('desert')) return { x: tile(SPOTS.tempter[0]), y: feet(SPOTS.tempter[1]) };
  return null;
}

function goalText(g: Game, id: QuestId): string {
  switch (id) {
    case 'call':
      return 'Chame Pedro na beira do lago, a oeste da vila.';
    case 'heal':
      return `Cure o cego no poço e o leproso na saída da vila (${g.healed.size}/2).`;
    case 'bread':
      return g.hasBread ? `Alimente o povo no monte (${g.fed.size}/5).` : 'Fale com o menino a leste do poço.';
    case 'sermon':
      return 'Suba até a pedra no alto do monte e ensine o povo.';
    case 'temple':
      return `Vire as mesas dos cambistas no templo (${g.tables.filter((t) => t.flipped).length}/4).`;
    case 'desert':
      return 'Vá ao deserto, a sudoeste, e enfrente o tentador.';
  }
}

// ---------------------------------------------------------------- menu card

export default function JesusQuest({ onBack }: { onBack: () => void }) {
  const done = useStore((s) => s.questDone);
  const [open, setOpen] = useState(false);
  return (
    <GameShell id="jesusQuest" title="Missões de Jesus" onBack={onBack}>
      <div className="rpg-frame rpg-text p-3 text-lg leading-snug">
        Ande com Jesus por Cafarnaum, pelo monte, pelo templo e pelo deserto. Chame Pedro, cure os doentes, multiplique os pães, ensine o povo, vire as mesas dos cambistas e vença
        a tentação no deserto.
      </div>
      <DiffPicker />
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {QUESTS.map((q) => (
          <li key={q.id} className="rpg-frame rpg-text flex items-center gap-2 px-2 py-1.5">
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-sm border-2 border-[#5b3a1e]', done.includes(q.id) ? 'bg-[#6a9a3a]' : 'bg-[#c8975a]')}>
              {done.includes(q.id) && <Check size={14} />}
            </span>
            {q.title}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          engine.init();
          const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
          (el.requestFullscreen?.() ?? Promise.resolve())
            .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
            .catch(() => undefined);
          setOpen(true);
        }}
        className="rpg-wood rpg-text flex h-14 w-full items-center justify-center gap-2 text-xl active:translate-y-0.5"
      >
        <RotateCw size={20} /> {done.length ? 'Continuar a jornada' : 'Começar (deite o celular)'}
      </button>
      {done.length > 0 && (
        <button onClick={() => set({ questDone: [] })} className="text-sm text-muted underline">
          Recomeçar do zero
        </button>
      )}
      {open && (
        <QuestGame
          onExit={() => {
            setOpen(false);
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
          }}
        />
      )}
    </GameShell>
  );
}

// ---------------------------------------------------------------- game

interface DialogState {
  lines: Line[];
  i: number;
  onEnd?: () => void;
  choices?: { options: string[]; correct: number; onPick: (ok: boolean) => void };
}

function QuestGame({ onExit }: { onExit: () => void }) {
  const qdiff = useStore((s) => s.storyDiff);
  // Three random questions for the sermon (four on hard), out of the whole pool.
  const sermon = useRef(
    L.sermonQs
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, [3, 3, 4][qdiff]),
  );
  const canvas = useRef<HTMLCanvasElement>(null);
  const g = useRef<Game>(makeGame(get().questDone as QuestId[]));
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const dialogRef = useRef<DialogState | null>(null);
  const [log, setLog] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [battle, setBattle] = useState(false);
  const portrait = useIsPortrait();
  const [hint, setHint] = useState(false);
  const [, force] = useState(0);
  const viewW = useRef(320);

  const openDialog = (d: DialogState | null) => {
    dialogRef.current = d;
    setDialog(d);
  };
  const say = (lines: Line[], onEnd?: () => void) => {
    engine.playNote(84, 'bell', 0, 0.25);
    openDialog({ lines, i: 0, onEnd });
  };
  const ask = (q: string, options: string[], onPick: (ok: boolean) => void) => {
    // Shuffle the options; the first one in the content is the right answer.
    const order = options.map((_, i) => i).sort(() => Math.random() - 0.5);
    openDialog({
      lines: [{ who: 'jesus', text: q }],
      i: 0,
      choices: { options: order.map((i) => options[i]), correct: order.indexOf(0), onPick },
    });
  };
  const typing = useRef({ done: true, finish: () => {} });
  const skip = () => {
    const d = dialogRef.current;
    if (!d || d.choices) return;
    openDialog(null);
    d.onEnd?.();
  };
  type QteSpec = { kind: QteKind; title: string; hint: string; times: number; seconds?: number; button: string; onWin: () => void };
  const [qte, setQte] = useState<QteSpec | null>(null);
  const qteRef = useRef(false);
  qteRef.current = !!qte;
  const play = (q: QteSpec) => window.setTimeout(() => setQte(q), 150);
  const advance = () => {
    const d = dialogRef.current;
    if (!d) return;
    if (!typing.current.done) return typing.current.finish();
    if (d.choices) return;
    if (d.i + 1 < d.lines.length) {
      engine.playNote(84, 'bell', 0, 0.2);
      openDialog({ ...d, i: d.i + 1 });
    } else {
      openDialog(null);
      d.onEnd?.();
    }
  };
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

  const sparkle = (x: number, y: number, color = '#ffe066', n = 18) => {
    for (let i = 0; i < n; i++)
      g.current.parts.push({ x, y: y - 12, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 50, life: 1, color, size: Math.random() < 0.3 ? 2 : 1 });
  };

  const complete = (id: QuestId, lines: Line[]) => {
    const s = g.current;
    if (s.done.has(id)) return;
    s.done.add(id);
    const list = [...new Set([...(get().questDone as QuestId[]), id])];
    set({ questDone: list });
    submitScore('jesusQuest', list.length);
    engine.sfx('yay');
    setToast(`Missão cumprida: ${QUESTS.find((q) => q.id === id)!.title}`);
    window.setTimeout(() => setToast(null), 3000);
    say(lines, () => {
      if (s.done.size === QUESTS.length) say(L.allDone);
    });
  };

  const npc = (id: string) => g.current.npcs.find((n) => n.id === id)!;

  // What happens when Jesus talks to or touches something.
  const interact = () => {
    const s = g.current;
    const fx = s.px + (s.dir === 'left' ? -12 : s.dir === 'right' ? 12 : 0);
    const fy = s.py + (s.dir === 'up' ? -12 : s.dir === 'down' ? 10 : 0) - 4;
    const near = (x: number, y: number, r = 16) => Math.hypot(x - fx, y - 4 - fy) < r;

    const table = s.tables.find((t) => !t.flipped && near(t.x + 12, t.y + 6, 20));
    if (table) {
      const tryFlip = () =>
        play({ kind: 'mash', title: 'Virar a mesa!', hint: 'Toque sem parar para virar a mesa dos cambistas!', times: 10, seconds: 3, button: 'Virar!', onWin: () => flip(table) });
      if (!s.templeWarned) {
        s.templeWarned = true;
        return say(L.templeFirst, tryFlip);
      }
      return tryFlip();
    }
    const n = s.npcs.filter((x) => !x.hidden && !x.to && near(x.x, x.y, 18)).sort((a, b) => Math.hypot(a.x - fx, a.y - fy) - Math.hypot(b.x - fx, b.y - fy))[0];
    if (n) {
      n.dir = s.px < n.x ? 'left' : s.px > n.x ? 'right' : s.py < n.y ? 'up' : 'down';
      return talk(n);
    }
    if (near(tile(SPOTS.rock[0]), feet(SPOTS.rock[1]) + 8, 26)) return teach();
    if (near(tile(SPOTS.well[0]), feet(SPOTS.well[1] - 1), 20)) return say([{ who: 'jesus', text: L.well[0] }]);
  };

  const talk = (n: Npc) => {
    const s = g.current;
    const id = n.id;
    if (id === 'peter') {
      if (!s.done.has('call'))
        return say(L.peterCall, () =>
          play({
            kind: 'timing',
            title: 'Lançai as redes!',
            hint: 'Lance a rede quando a marca passar no verde, onde está o cardume.',
            times: 2,
            button: 'Lançar a rede',
            onWin: () => {
              sparkle(n.x - 20, n.y, '#9cc8e8', 20);
              complete('call', [{ who: 'peter', text: 'A rede quase rompe de tanto peixe! Senhor, eu vou contigo. Pra onde for!', mood: 'happy' }]);
            },
          }),
        );
      return say([{ who: 'peter', text: pick(L.peterIdle) }]);
    }
    if (id === 'blind' || id === 'leper') {
      if (s.healed.has(id)) return say([{ who: id, text: id === 'blind' ? 'Que cores lindas tem o mundo!' : 'Fui ao sacerdote. Estou limpo de verdade!', mood: 'happy' }]);
      return say(id === 'blind' ? L.blind : L.leper, () =>
        play({
          kind: 'ring',
          title: 'Oração',
          hint: 'Toque quando a luz encostar no círculo dourado.',
          times: 3,
          button: 'Orar',
          onWin: () => healNow(),
        }),
      );
      function healNow() {
        s.healed.add(id);
        n.look = id === 'blind' ? { ...LOOKS.blind, bandage: undefined } : LOOKS.villager;
        n.bob = s.time + 2;
        sparkle(n.x, n.y);
        engine.sfx('power');
        say(id === 'blind' ? L.blindHealed : L.leperHealed, () => s.healed.size === 2 && complete('heal', L.healDone));
      }
    }
    if (id === 'boy') {
      if (!s.hasBread) return say(L.boy, () => (s.hasBread = true));
      return say([{ who: 'boy', text: pick(L.boyAfter), mood: 'happy' }]);
    }
    if (/^g\d/.test(id)) {
      const gi = Number(id[1]);
      if (s.fed.has(gi)) return say([{ who: 'crowd', text: pick(L.fed), mood: 'happy' }]);
      if (!s.hasBread) return say([{ who: 'crowd', text: pick(L.hungry), mood: 'sad' }]);
      return say([L.feed], () =>
        play({ kind: 'mash', title: 'Partir o pão', hint: 'Toque bem rápido para partir e repartir!', times: 9, seconds: 3.5, button: 'Partir!', onWin: () => feedNow() }),
      );
      function feedNow() {
        s.fed.add(gi);
        s.npcs
          .filter((x) => x.id.startsWith(`g${gi}`))
          .forEach((x) => {
            x.basket = true;
            x.bob = s.time + 2;
          });
        sparkle(n.x, n.y, '#f0c060', 12);
        engine.sfx('coin');
        say([{ who: 'crowd', text: pick(L.fed), mood: 'happy' }], () => s.fed.size === 5 && complete('bread', L.breadDone));
      }
    }
    if (/^m\d/.test(id)) return say([{ who: 'merchant', text: pick(L.merchant) }]);
    if (id === 'woman') return say([{ who: 'woman', text: pick(L.woman) }]);
    if (id === 'elder') return say([{ who: 'elder', text: pick(L.elder) }]);
    if (id === 'tempter') return say(L.tempterIntro, () => setBattle(true));
    if (id.startsWith('c')) return say([{ who: 'crowd', text: pick(L.crowdYes), mood: 'happy' }]);
  };

  const flip = (t: Table) => {
    const s = g.current;
    t.flipped = s.time;
    engine.drum('crash', 0, 0.9);
    engine.sfx('stomp');
    for (let i = 0; i < 14; i++) s.parts.push({ x: t.x + 12, y: t.y + 4, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60, life: 1.2, color: '#ffd23a', size: 1 });
    for (let i = 0; i < 3; i++) s.parts.push({ x: t.x + 26, y: t.y, vx: 30 + Math.random() * 30, vy: -50 - Math.random() * 20, life: 2, color: '#ffffff', size: 2 });
    const m = npc(t.merchant);
    m.to = { x: tile(SPOTS.gate[0]), y: feet(SPOTS.gate[1]) - 20, vanish: true };
    say([{ who: 'merchant', text: pick(L.flipped), mood: 'sad' }], () => {
      if (s.tables.every((x) => x.flipped)) complete('temple', L.templeDone);
    });
  };

  const teach = () => {
    const s = g.current;
    if (s.sermon === 'done') return say([{ who: 'jesus', text: 'Daqui se vê o mar da Galileia inteiro. Lugar bom pra orar.' }]);
    if (s.sermon !== 'idle') return;
    s.sermon = 'gathering';
    // People come up the mount and sit around the rock.
    const looks = [LOOKS.villager, LOOKS.woman, LOOKS.elder, { ...LOOKS.villager, robe: '#8a9ab8' }, { ...LOOKS.woman, robe: '#6a8a5a' }, LOOKS.boy];
    const spots = [
      [-3, 2],
      [-1, 3],
      [1, 3],
      [3, 2],
      [-2, 4],
      [0, 4],
      [2, 4],
    ];
    spots.forEach(([dx, dy], i) => {
      s.npcs.push({
        id: `c${i}`,
        look: looks[i % looks.length],
        x: tile(39 + (i % 3)),
        y: feet(14),
        dir: 'up',
        step: 0,
        to: { x: tile(SPOTS.rock[0] + dx), y: feet(SPOTS.rock[1] + dy) },
      });
    });
    window.setTimeout(() => {
      s.sermon = 'teaching';
      s.npcs.filter((x) => x.id.startsWith('c')).forEach((x) => (x.dir = 'up'));
      say(L.sermonStart, () => question(0));
    }, 2600);
  };

  const question = (k: number) => {
    const s = g.current;
    const q = sermon.current[k];
    ask(q.q, q.options, (ok) => {
      const crowd = s.npcs.filter((x) => x.id.startsWith('c'));
      if (ok) {
        crowd.forEach((x) => (x.bob = s.time + 1.5));
        engine.sfx('coin');
        say([{ who: 'crowd', text: pick(L.crowdYes), mood: 'happy' }], () => {
          if (k + 1 < sermon.current.length) question(k + 1);
          else {
            s.sermon = 'done';
            complete('sermon', L.sermonDone);
          }
        });
      } else {
        engine.sfx('bonk');
        say([{ who: 'crowd', text: pick(L.crowdNo), mood: 'sad' }], () => question(k));
      }
    });
  };

  // ------------------------------------------------------------ loop
  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const fit = () => {
      const w = Math.round(Math.max(260, Math.min(420, (VH * cv.clientWidth) / Math.max(1, cv.clientHeight))));
      if (cv.width !== w || cv.height !== VH) {
        cv.width = w;
        cv.height = VH;
      }
      ctx.imageSmoothingEnabled = false;
      viewW.current = w;
    };
    fit();
    window.addEventListener('resize', fit);
    // Rotation: refit once the new size is really applied.
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    if (!get().questDone.length) window.setTimeout(() => say(L.intro), 400);
    if (import.meta.env.DEV) (window as any).__quest = g;

    let raf = 0;
    let last = performance.now();
    const hymn = HYMNS.find((h) => h.id === 'alvo')!;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = g.current;
      s.time += dt;
      const busy = !!dialogRef.current || battleRef.current || portraitRef.current || qteRef.current;

      // Gentle hymn in the background.
      const m = s.music;
      const t = engine.now;
      if (!busy || dialogRef.current) {
        if (!m.at || m.at < t - 1) m.at = m.bat = t + 0.1;
        while (m.at < t + 0.15) {
          const [midi, beats] = hymn.notes[m.i++ % hymn.notes.length];
          if (midi) engine.playNote(midi, 'pluck', m.at, 0.16);
          m.at += beats * 0.62;
        }
        while (m.bat < t + 0.15) {
          const [midi, beats] = hymn.bass[m.bi++ % hymn.bass.length];
          if (midi) engine.bass(midi - 12, m.bat, beats * 0.5, 0.18);
          m.bat += beats * 0.62;
        }
      }

      // Walking.
      if (!busy && (s.keys.x || s.keys.y)) {
        const len = Math.max(1, Math.hypot(s.keys.x, s.keys.y));
        const vx = (s.keys.x / len) * SPEED * dt;
        const vy = (s.keys.y / len) * SPEED * dt;
        s.dir = Math.abs(s.keys.x) > Math.abs(s.keys.y) ? (s.keys.x > 0 ? 'right' : 'left') : s.keys.y > 0 ? 'down' : 'up';
        const blocked = (x: number, y: number) => {
          for (const [cx2, cy2] of [
            [x - 4, y - 4],
            [x + 4, y - 4],
            [x - 4, y],
            [x + 4, y],
          ])
            if (isSolid(s.map, Math.floor(cx2 / T), Math.floor(cy2 / T))) return true;
          if (s.npcs.some((n) => !n.hidden && !n.to && Math.abs(n.x - x) < 9 && Math.abs(n.y - y) < 6 && n.id !== 'peter')) return true;
          if (s.tables.some((tb) => x > tb.x - 3 && x < tb.x + 27 && y > tb.y + 2 && y < tb.y + 16)) return true;
          return false;
        };
        const ox = s.px;
        const oy = s.py;
        if (!blocked(s.px + vx, s.py)) s.px += vx;
        else if (Math.abs(vx) > Math.abs(vy) * 2) {
          // Slide around corners instead of getting stuck on them.
          for (let k = 1; k <= 6; k++) {
            const dy = !blocked(s.px + vx, s.py - k) ? -1 : !blocked(s.px + vx, s.py + k) ? 1 : 0;
            if (dy) {
              if (!blocked(s.px, s.py + dy * Math.abs(vx))) s.py += dy * Math.abs(vx);
              break;
            }
          }
        }
        if (!blocked(s.px, s.py + vy)) s.py += vy;
        else if (Math.abs(vy) > Math.abs(vx) * 2) {
          for (let k = 1; k <= 6; k++) {
            const dx = !blocked(s.px - k, s.py + vy) ? -1 : !blocked(s.px + k, s.py + vy) ? 1 : 0;
            if (dx) {
              if (!blocked(s.px + dx * Math.abs(vy), s.py)) s.px += dx * Math.abs(vy);
              break;
            }
          }
        }
        s.walked += Math.hypot(s.px - ox, s.py - oy);
        if (s.px !== ox || s.py !== oy) {
          s.trail.push({ x: s.px, y: s.py, dir: s.dir });
          if (s.trail.length > 40) s.trail.shift();
        }
      }
      // NPCs walking somewhere.
      for (const n of s.npcs) {
        if (!n.to) continue;
        const dx = n.to.x - n.x;
        const dy = n.to.y - n.y;
        const d = Math.hypot(dx, dy);
        if (d < 1.5) {
          if (n.to.vanish) n.hidden = true;
          n.to = undefined;
          n.step = 0;
          continue;
        }
        const sp = (n.to.vanish ? 95 : 50) * dt;
        n.x += (dx / d) * Math.min(sp, d);
        n.y += (dy / d) * Math.min(sp, d);
        n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        n.step = Math.floor(s.time * 8) % 4;
      }
      // Peter follows once called.
      const peter = npc('peter');
      if (s.done.has('call')) {
        const back = s.trail[Math.max(0, s.trail.length - 14)];
        if (back && Math.hypot(back.x - peter.x, back.y - peter.y) > 1) {
          peter.step = Math.floor(s.time * 8) % 4;
          peter.x += (back.x - peter.x) * Math.min(1, dt * 8);
          peter.y += (back.y - peter.y) * Math.min(1, dt * 8);
          peter.dir = back.dir;
        } else peter.step = 0;
      }
      s.parts = s.parts.filter((p) => (p.life -= dt) > 0);
      s.parts.forEach((p) => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += (p.color === '#ffffff' ? -10 : 120) * dt;
      });

      // Camera.
      const vw = viewW.current;
      const camX = Math.round(Math.max(0, Math.min(MW * T - vw, s.px - vw / 2)));
      const camY = Math.round(Math.max(0, Math.min(MH * T - VH, s.py - 10 - VH / 2)));
      ctx.drawImage(s.mapCanvas, camX, camY, vw, VH, 0, 0, vw, VH);
      drawWater(ctx, s.map, camX, camY, vw, VH, s.time);

      // Sprites sorted by depth.
      type D = { y: number; draw: () => void };
      const list: D[] = [];
      for (const n of s.npcs) {
        if (n.hidden) continue;
        const hop = n.bob && s.time < n.bob ? Math.abs(Math.sin(s.time * 10)) * 3 : 0;
        list.push({
          y: n.y,
          draw: () => {
            drawPerson(ctx, n.look, n.x - camX, n.y - camY - hop, n.dir, n.step);
            if (n.basket) {
              ctx.fillStyle = '#4a2c14';
              ctx.fillRect(n.x - camX - 4, n.y - camY - 3, 9, 5);
              ctx.fillStyle = '#c08a4a';
              ctx.fillRect(n.x - camX - 3, n.y - camY - 2, 7, 3);
              ctx.fillStyle = '#eab866';
              ctx.fillRect(n.x - camX - 2, n.y - camY - 4, 5, 2);
            }
          },
        });
      }
      for (const tb of s.tables) {
        list.push({
          y: tb.y + 12,
          draw: () => {
            const X = tb.x - camX;
            const Y = tb.y - camY;
            if (!tb.flipped) {
              ctx.fillStyle = '#3a2414';
              ctx.fillRect(X - 1, Y - 1, 26, 12);
              ctx.fillStyle = '#9a6234';
              ctx.fillRect(X, Y, 24, 7);
              ctx.fillStyle = '#c08a4a';
              ctx.fillRect(X, Y, 24, 2);
              ctx.fillStyle = '#6a4220';
              ctx.fillRect(X + 1, Y + 7, 3, 4);
              ctx.fillRect(X + 20, Y + 7, 3, 4);
              ctx.fillStyle = '#ffd23a';
              for (let i = 0; i < 5; i++) ctx.fillRect(X + 4 + i * 4, Y + 3 + (i % 2), 2, 1);
              // Dove cage.
              ctx.fillStyle = '#3a2414';
              ctx.fillRect(X + 26, Y - 4, 9, 12);
              ctx.fillStyle = '#c8a870';
              ctx.fillRect(X + 27, Y - 3, 7, 10);
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(X + 28, Y + 1, 3, 2);
              ctx.fillStyle = '#3a2414';
              for (let i = 0; i < 3; i++) ctx.fillRect(X + 28 + i * 2, Y - 3, 1, 10);
            } else {
              // On its side, coins on the floor.
              ctx.fillStyle = '#3a2414';
              ctx.fillRect(X + 2, Y - 6, 22, 14);
              ctx.fillStyle = '#7a4a24';
              ctx.fillRect(X + 3, Y - 5, 20, 12);
              ctx.fillStyle = '#9a6234';
              ctx.fillRect(X + 3, Y - 5, 20, 3);
              ctx.fillStyle = '#ffd23a';
              for (let i = 0; i < 7; i++) ctx.fillRect(X - 6 + i * 6, Y + 10 + (i % 3), 2, 1);
              ctx.fillStyle = '#3a2414';
              ctx.fillRect(X + 28, Y + 4, 9, 4);
            }
          },
        });
      }
      const jy = s.py;
      const moving = !busy && (s.keys.x || s.keys.y);
      list.push({ y: jy, draw: () => drawPerson(ctx, LOOKS.jesus, s.px - camX, jy - camY, s.dir, moving ? Math.floor(s.walked / 6) % 4 : 0) });
      list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

      // Quest marks over people who matter right now.
      const marks: { x: number; y: number }[] = [];
      const markNpc = (id: string) => {
        const n = npc(id);
        if (!n.hidden) marks.push({ x: n.x, y: n.y - 46 });
      };
      if (!s.done.has('call')) markNpc('peter');
      if (!s.done.has('heal')) ['blind', 'leper'].filter((id) => !s.healed.has(id)).forEach(markNpc);
      if (!s.done.has('bread')) (s.hasBread ? [0, 1, 2, 3, 4].filter((k) => !s.fed.has(k)).map((k) => `g${k}a`) : ['boy']).forEach(markNpc);
      if (!s.done.has('desert')) markNpc('tempter');
      if (s.sermon === 'idle') marks.push({ x: tile(SPOTS.rock[0]), y: feet(SPOTS.rock[1]) - 22 });
      for (const mk of marks) {
        const bob = Math.round(Math.sin(s.time * 5) * 2);
        const X = Math.round(mk.x - camX);
        const Y = Math.round(mk.y - camY + bob);
        ctx.fillStyle = '#3a2414';
        ctx.fillRect(X - 2, Y - 1, 5, 9);
        ctx.fillRect(X - 2, Y + 9, 5, 4);
        ctx.fillStyle = '#ffd23a';
        ctx.fillRect(X - 1, Y, 3, 7);
        ctx.fillRect(X - 1, Y + 10, 3, 2);
      }
      for (const p of s.parts) {
        ctx.globalAlpha = Math.min(1, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Arrow toward the next objective when it is off screen.
      const goal = objective(s);
      if (goal) {
        const gx = goal.x - camX;
        const gy = goal.y - camY;
        if (gx < 0 || gy < 0 || gx > vw || gy > VH) {
          const ang = Math.atan2(gy - VH / 2, gx - vw / 2);
          const r = Math.min(vw, VH) / 2 - 14;
          const ax = vw / 2 + Math.cos(ang) * (vw / 2 - 14) * (Math.abs(Math.cos(ang)) > 0.6 ? 1 : 0.9);
          const ay = VH / 2 + Math.sin(ang) * r;
          ctx.save();
          ctx.translate(Math.round(ax), Math.round(ay));
          ctx.rotate(ang);
          ctx.fillStyle = '#3a2414';
          ctx.beginPath();
          ctx.moveTo(9, 0);
          ctx.lineTo(-6, -7);
          ctx.lineTo(-6, 7);
          ctx.fill();
          ctx.fillStyle = '#ffd23a';
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(-4, -5);
          ctx.lineTo(-4, 5);
          ctx.fill();
          ctx.restore();
        }
      }
      // "A" hint near something to interact with.
      const canAct =
        !busy &&
        (s.npcs.some((n) => !n.hidden && !n.to && Math.hypot(n.x - s.px, n.y - s.py) < 22) ||
          s.tables.some((tb) => !tb.flipped && Math.hypot(tb.x + 12 - s.px, tb.y + 6 - s.py) < 26) ||
          Math.hypot(tile(SPOTS.rock[0]) - s.px, feet(SPOTS.rock[1]) + 8 - s.py) < 30);
      if (canAct !== hintRef.current) {
        hintRef.current = canAct;
        setHint(canAct);
      }
    };
    raf = requestAnimationFrame(loop);
    const onKey = (e: KeyboardEvent, down: boolean) => {
      const k = e.key.toLowerCase();
      const s = g.current;
      const axis: Record<string, [number, number]> = { arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0], arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1] };
      if (axis[k]) {
        e.preventDefault();
        const [x, y] = axis[k];
        if (x) s.keys.x = down ? x : s.keys.x === x ? 0 : s.keys.x;
        if (y) s.keys.y = down ? y : s.keys.y === y ? 0 : s.keys.y;
      } else if (down && !e.repeat && (k === ' ' || k === 'enter' || k === 'e' || k === 'z')) {
        e.preventDefault();
        actionButton();
      } else if (down && k === 'escape') onExit();
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const battleRef = useRef(false);
  battleRef.current = battle;
  const portraitRef = useRef(portrait);
  portraitRef.current = portrait;
  const hintRef = useRef(false);

  const actionButton = () => {
    if (battleRef.current || qteRef.current) return;
    if (dialogRef.current) return advance();
    interact();
  };

  const line = dialog ? dialog.lines[dialog.i] : null;
  const s = g.current;
  const current = QUESTS.find((q) => !s.done.has(q.id));

  return createPortal(
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-black font-pixel text-white" role="dialog" aria-modal="true" aria-label="Missões de Jesus">
      <canvas ref={canvas} className="pixelated absolute inset-0 h-full w-full" aria-label="Mapa: Cafarnaum e arredores" />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
        <button onClick={onExit} aria-label="Sair" className="rpg-wood rpg-text pointer-events-auto grid h-10 w-10 place-items-center">
          <X size={18} />
        </button>
        {current && (
          <div className="rpg-frame rpg-text max-w-[55%] truncate px-2 py-1 text-sm">
            ★ {current.title}: <span className="text-[#ffe08a]">{goalText(s, current.id)}</span>
          </div>
        )}
        <button onClick={() => setLog(true)} aria-label="Diário de missões" className="rpg-wood rpg-text pointer-events-auto grid h-10 w-10 place-items-center">
          <ScrollText size={18} />
        </button>
      </div>

      {toast && <div className="rpg-wood rpg-text animate-pop absolute left-1/2 top-14 -translate-x-1/2 px-4 py-2 text-lg">{toast}</div>}

      {/* Controls */}
      {!dialog && !battle && !qte && (
        <>
          <Joystick className="absolute bottom-2 left-[max(0.5rem,env(safe-area-inset-left))]" onChange={(x, y) => (g.current.keys = { x, y })} />
          <AButton className={cx('absolute bottom-6 right-[max(1.25rem,env(safe-area-inset-right))]', hint && 'animate-blink')} hot={hint} onPress={actionButton}>
            A
          </AButton>
        </>
      )}

      {/* Dialog */}
      {line && (
        <div
          className="absolute inset-x-0 bottom-0 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]"
          onClick={() => !dialog?.choices && advance()}
        >
          <div className="mx-auto max-w-3xl">
            <Dialog look={SPEAKERS[line.who].look} img={SPEAKERS[line.who].img} mood={line.mood} bg={SPEAKERS[line.who].bg} name={SPEAKERS[line.who].name || undefined} size="lg">
              {line.who === 'narrator' ? (
                <em>
                  <Typed key={`${dialog!.i}${line.text}`} text={line.text} ctl={typing} />
                </em>
              ) : (
                <Typed key={`${dialog!.i}${line.text}`} text={line.text} ctl={typing} />
              )}
              {dialog?.choices ? (
                <span className="mt-2 grid gap-1">
                  {dialog.choices.options.map((o, i) => (
                    <button
                      key={o}
                      onClick={(e) => {
                        e.stopPropagation();
                        const c = dialog.choices!;
                        openDialog(null);
                        c.onPick(i === c.correct);
                      }}
                      className="rpg-wood rpg-text px-2 py-1.5 text-left text-[0.9em] active:translate-y-0.5"
                    >
                      ▸ {o}
                    </button>
                  ))}
                </span>
              ) : (
                <span className="absolute bottom-1 right-2 animate-bounce text-[0.8em] text-[#ffe08a]">▼</span>
              )}
            </Dialog>
          </div>
        </div>
      )}

      {/* Mission log */}
      {log && (
        <div className="absolute inset-0 grid place-items-center bg-black/50 p-4" onClick={() => setLog(false)}>
          <div className="rpg-frame rpg-text w-full max-w-lg p-3" onClick={(e) => e.stopPropagation()}>
            <p className="mb-2 text-xl text-[#ffe08a]">Diário de missões</p>
            <ul className="space-y-1.5">
              {QUESTS.map((q) => (
                <li key={q.id} className="flex gap-2">
                  <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center border-2 border-[#5b3a1e]', s.done.has(q.id) ? 'bg-[#6a9a3a]' : 'bg-[#c8975a]')}>
                    {s.done.has(q.id) && <Check size={12} />}
                  </span>
                  <span>
                    {q.title}
                    {!s.done.has(q.id) && <span className="block text-sm text-[#ffe08a]">{goalText(s, q.id)}</span>}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={() => setLog(false)} className="rpg-wood rpg-text mt-3 h-10 w-full">
              Fechar
            </button>
          </div>
        </div>
      )}

      {line && !dialog?.choices && (
        <button onClick={skip} className="rpg-wood rpg-text absolute right-[max(0.5rem,env(safe-area-inset-right))] top-14 px-3 py-1 text-sm" aria-label="Pular conversa">
          Pular ⏩
        </button>
      )}

      {qte && (
        <Qte
          kind={qte.kind}
          title={qte.title}
          hint={qte.hint}
          look={LOOKS.jesus}
          img={SPEAKERS.jesus.img}
          bg="#e0a458"
          times={qte.kind === 'mash' ? Math.round(qte.times * [0.8, 1, 1.3][qdiff]) : qte.times + (qte.kind === 'ring' ? qdiff - 1 : 0)}
          seconds={qte.seconds}
          diff={qdiff}
          button={qte.button}
          onDone={(ok) => {
            const q = qte;
            setQte(null);
            if (ok) q.onWin();
            else play(q);
          }}
        />
      )}

      {battle && (
        <Battle
          onWin={() => {
            setBattle(false);
            npc('tempter').hidden = true;
            force((x) => x + 1);
            say(BATTLE_WIN, () => complete('desert', [{ who: 'jesus', text: 'Está escrito, e está cumprido. Vamos voltar à vila.', mood: 'happy' }]));
          }}
          onLeave={() => setBattle(false)}
        />
      )}

      <RotateHint onExit={onExit} />
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- battle

function BattleScene({ shake }: { shake: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = now / 1000;
      const w = cv.width;
      ctx.imageSmoothingEnabled = false;
      ['#8ccbe2', '#a8d8ea', '#c4e4ee', '#ddeef0'].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(0, i * 14, w, 15);
      });
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 6; i++) ctx.fillRect(((i * 70 + t * 4) % (w + 40)) - 20, 6 + ((i * 13) % 26), 22, 3);
      // Far city and temple at the edge of the desert.
      ctx.fillStyle = '#d6bc86';
      for (let x = 0; x < w; x++) {
        const b = Math.floor(x / 22);
        const top = 52 - (b % 3) * 4 - (b % 5 === 2 ? 9 : 0);
        ctx.fillRect(x, top, 1, 60 - top);
      }
      ctx.fillStyle = '#c8a870';
      ctx.fillRect(w * 0.42, 38, 40, 18);
      ctx.beginPath();
      ctx.arc(w * 0.42 + 20, 40, 11, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#e6cb8e';
      ctx.fillRect(0, 58, w, 122);
      ctx.fillStyle = '#d0b276';
      for (let i = 0; i < 60; i++) ctx.fillRect((i * 53) % w, 62 + ((i * 29) % 110), 2, 1);
      // The tempter (floating) and Jesus seen from behind, above the menus.
      const sx = Math.round(Math.sin(t * 40) * shake);
      const f = personFrame(LOOKS.tempter, 'down', 0);
      ctx.fillStyle = '#00000033';
      ctx.fillRect(w * 0.62 + 6, 80, f.width * 2 - 12, 3);
      ctx.globalAlpha = 0.9 + Math.sin(t * 3) * 0.1;
      ctx.drawImage(f, Math.round(w * 0.62) + sx, 24 + Math.round(Math.sin(t * 2) * 2), f.width * 2, f.height * 2);
      ctx.globalAlpha = 1;
      const j = personFrame(LOOKS.jesus, 'up', 0);
      ctx.drawImage(j, Math.round(w * 0.24), 34, j.width * 2, j.height * 2);
    };
    const fit = () => {
      cv.width = Math.round((180 * cv.clientWidth) / Math.max(1, cv.clientHeight));
      cv.height = 180;
    };
    fit();
    window.addEventListener('resize', fit);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
    };
  }, [shake]);
  return <canvas ref={ref} className="pixelated absolute inset-0 h-full w-full" aria-hidden />;
}

function Battle({ onWin, onLeave }: { onWin: () => void; onLeave: () => void }) {
  const [round, setRound] = useState(0);
  const [resolve, setResolve] = useState(100); // the tempter's
  const [faith, setFaith] = useState(100);
  const [mode, setMode] = useState<'tempt' | 'menu' | 'verses' | 'msg' | 'lost'>('tempt');
  const [msg, setMsg] = useState<{ who: Who; text: string } | null>({ who: 'tempter', text: TEMPTATIONS[0].text });
  const [guard, setGuard] = useState(false);
  const [shake, setShake] = useState(0);
  const [order] = useState(() => TEMPTATIONS.map(() => [0, 1, 2, 3].sort(() => Math.random() - 0.5)));
  const bdiff = useStore((s) => s.storyDiff);
  const next = useRef<() => void>(() => setMode('menu'));

  const show = (who: Who, text: string, then: () => void) => {
    setMsg({ who, text });
    setMode('msg');
    next.current = then;
  };
  const enemyTurn = () => {
    const dmg = guard ? [3, 5, 8][bdiff] : [10, 14, 20][bdiff];
    setGuard(false);
    const f = Math.max(0, faith - dmg);
    setFaith(f);
    engine.sfx('hurt');
    if (f <= 0) return show('narrator', 'Jesus... digo, você fraquejou. Mas a graça te levanta: tente de novo!', () => setMode('lost'));
    show('tempter', `${TEMPTATIONS[round].text} (Fé −${dmg})`, () => setMode('menu'));
  };
  const quote = (k: number) => {
    const t = TEMPTATIONS[round];
    const ok = order[round][k] === 0;
    const verse = t.verses[order[round][k]];
    if (ok) {
      const r = Math.max(0, resolve - 34);
      setResolve(r);
      setShake(3);
      window.setTimeout(() => setShake(0), 500);
      engine.sfx('power');
      show('jesus', `Está escrito: “${verse}”`, () => {
        if (round === TEMPTATIONS.length - 1) return onWin();
        const nr = round + 1;
        setRound(nr);
        show('tempter', TEMPTATIONS[nr].text, () => setMode('menu'));
      });
    } else {
      engine.sfx('bonk');
      setFaith((f) => Math.max(0, f - 8));
      show('jesus', `“${verse}”... não, não é esta a resposta para isso.`, enemyTurn);
    }
  };
  const restart = () => {
    setRound(0);
    setResolve(100);
    setFaith(100);
    setGuard(false);
    show('tempter', TEMPTATIONS[0].text, () => setMode('menu'));
  };

  const speaker = msg ? SPEAKERS[msg.who] : SPEAKERS.tempter;
  return (
    <div className="absolute inset-0 z-10">
      <BattleScene shake={shake} />
      {/* Enemy panel */}
      <div className="rpg-wood rpg-text absolute left-3 top-3 w-[min(46%,22rem)] px-3 py-2">
        <p className="text-lg">Tentador</p>
        <div className="mt-1 h-3 border-2 border-[#3a2414] bg-[#4a4250]">
          <div className="h-full bg-[#d0703a] transition-[width] duration-500" style={{ width: `${resolve}%` }} />
        </div>
      </div>
      <Portrait look={LOOKS.tempter} img={SPEAKERS.tempter.img} mood="stern" bg="#5a6a5a" className="absolute right-3 top-3 h-24 w-24" />
      {/* Bottom: commands + party */}
      <div className="absolute inset-x-3 bottom-3 grid grid-cols-[minmax(9rem,32%)_1fr] gap-2">
        <div className="rpg-frame rpg-text flex flex-col justify-center gap-0.5 p-2 text-lg leading-tight">
          {mode === 'menu' ? (
            <>
              <button className="text-left hover:text-[#ffe08a]" onClick={() => setMode('verses')}>
                ▸ Citar a Escritura
              </button>
              <button
                className="text-left hover:text-[#ffe08a]"
                onClick={() => {
                  setFaith((f) => Math.min(100, f + 25));
                  engine.sfx('coin');
                  show('jesus', 'Pai, fortalece-me. (Fé +25)', enemyTurn);
                }}
              >
                ▸ Orar
              </button>
              <button
                className="text-left hover:text-[#ffe08a]"
                onClick={() => {
                  setGuard(true);
                  show('narrator', 'Jesus permanece em silêncio, firme. (A próxima tentação pesa menos.)', enemyTurn);
                }}
              >
                ▸ Ficar em silêncio
              </button>
              <button className="text-left hover:text-[#ffe08a]" onClick={() => show('narrator', 'Itens? Aqui a única arma é a Palavra.', () => setMode('menu'))}>
                ▸ Itens
              </button>
              <button className="text-left text-[0.8em] opacity-80 hover:text-[#ffe08a]" onClick={onLeave}>
                ▸ Sair por agora
              </button>
            </>
          ) : mode === 'lost' ? (
            <button className="text-left hover:text-[#ffe08a]" onClick={restart}>
              ▸ Tentar de novo
            </button>
          ) : (
            <span className="text-sm leading-snug opacity-80">{mode === 'verses' ? `Tentador: “${TEMPTATIONS[round].text}”` : '...'}</span>
          )}
        </div>
        <div className="rpg-frame rpg-text flex flex-col gap-1 p-2 text-lg">
          {mode === 'verses' ? (
            <>
              <span className="text-sm text-[#ffe08a]">Qual palavra responde a esta tentação?</span>
              {[0, 1, 2, 3].map((k) => (
                <button key={k} className="rpg-wood rpg-text px-2 py-1 text-left text-base leading-tight active:translate-y-0.5" onClick={() => quote(k)}>
                  “{TEMPTATIONS[round].verses[order[round][k]]}”
                </button>
              ))}
              <button className="text-left text-sm opacity-80" onClick={() => setMode('menu')}>
                ◂ Voltar
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-16">Jesus</span>
                <span className="text-sm text-[#ffe08a]">Fé</span>
                <div className="h-3 flex-1 border-2 border-[#3a2414] bg-[#4a4250]">
                  <div className="h-full bg-[#5ab0c8] transition-[width] duration-500" style={{ width: `${faith}%` }} />
                </div>
                <span className="w-9 text-right tabular-nums">{faith}</span>
              </div>
              {msg && (mode === 'msg' || mode === 'tempt' || mode === 'lost') && (
                <button
                  className="flex items-start gap-2 text-left text-base leading-snug"
                  onClick={() => {
                    if (mode === 'lost') return;
                    const fn = next.current;
                    fn();
                  }}
                >
                  {speaker.name && <span className="shrink-0 text-[#ffe08a]">{speaker.name}:</span>}
                  <span>{msg.text}</span>
                  {mode !== 'lost' && <span className="ml-auto animate-bounce text-[#ffe08a]">▼</span>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
