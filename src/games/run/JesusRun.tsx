import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Lock, Pause, Play, Star } from 'lucide-react';
import { engine } from '../../audio/engine';
import { useT } from '../../i18n';
import { set, submitScore, useStore, get } from '../../store';
import { cx } from '../../ui/kit';
import { useJesusCoach } from '../jesus/Coach';
import { HYMNS } from '../jesus/hymns';
import { GameShell } from '../Shell';
import { GROUND, H, W, WORLDS, generate, rng, type Ent, type Item, type World } from './levels';
import { renderRun } from './render';

const PX = 44; // player's x on screen
const VW = 200; // default visible width; it follows the screen's shape (see viewW)
const VH = 112; // visible height: smaller than the world so everything reads bigger on phones
const VY = H - VH; // sky rows cropped off the top
const GRAV = 1000;
const JUMP = 330;
const CUT = -140; // releasing early cuts the jump short
const COYOTE = 0.08;
const BUFFER = 0.12;
const POWER_TIME = { dove: 9, halo: 6 };

type Phase = 'ready' | 'play' | 'paused' | 'dead' | 'clear';

interface Game {
  world: World;
  camX: number;
  speed: number;
  feet: number; // y of the player's feet
  vy: number;
  grounded: boolean;
  lastGround: number;
  ducking: boolean;
  held: boolean;
  pressedAt: number;
  airJumps: number;
  dove: number; // power-up end times (game seconds)
  halo: number;
  staff: boolean;
  hurtUntil: number;
  ents: Ent[];
  genTo: number;
  random: () => number;
  breads: number;
  breadTotal: number;
  stomps: number;
  time: number;
  deadAt: number;
  pops: { x: number; y: number; t: number; text: string }[];
  music: { i: number; at: number; notes: [number, number][]; bass: [number, number][]; bi: number; bat: number; beat: number };
}

function newGame(world: World, tries: number): Game {
  const random = rng(world.number * 7919 + (world.length ? 0 : tries * 31));
  const { ents, end } = generate(world, 320, world.length || 1400, random, 0);
  if (world.length) ents.push({ kind: 'goal', x: world.length + 120, y: GROUND - 40, w: 30, h: 40 });
  const hymn = HYMNS.find((h) => h.id === world.hymn) ?? HYMNS[0];
  return {
    world,
    camX: 0,
    speed: world.speed,
    feet: GROUND,
    vy: 0,
    grounded: true,
    lastGround: 0,
    ducking: false,
    held: false,
    pressedAt: -1,
    airJumps: 0,
    dove: 0,
    halo: 0,
    staff: false,
    hurtUntil: 0,
    ents,
    genTo: end,
    random,
    breads: 0,
    breadTotal: ents.filter((e) => e.kind === 'bread' || (e.kind === 'box' && e.item === 'bread')).length,
    stomps: 0,
    time: 0,
    deadAt: 0,
    pops: [],
    music: { i: 0, at: 0, notes: hymn.notes, bass: hymn.bass, bi: 0, bat: 0, beat: 60 / 168 },
  };
}

const overlap = (ax: number, ay: number, aw: number, ah: number, b: Ent, inset = 2) =>
  ax < b.x + b.w - inset && ax + aw > b.x + inset && ay < b.y + b.h - inset && ay + ah > b.y + inset;

export default function JesusRun({ onBack }: { onBack: () => void }) {
  const t = useT();
  const stars = useStore((s) => s.runStars);
  const best = useStore((s) => s.best.jesusRun ?? 0);
  const [world, setWorld] = useState<World | null>(null);
  const unlocked = (w: World) => w.length === 0 || w.number === 1 || (stars[WORLDS[w.number - 2].id] ?? 0) > 0 || (stars[w.id] ?? 0) > 0;

  if (world) return <Level world={world} onExit={() => setWorld(null)} />;

  return (
    <GameShell id="jesusRun" title={t('game.run')} onBack={onBack}>
      <p className="font-pixel text-lg text-muted">{t('run.intro')}</p>
      <div className="rpg-frame rpg-text relative p-3">
        <p className="mb-2 text-center text-xl text-[#ffe08a]">{t('run.map')}</p>
        <ol className="relative grid gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {WORLDS.map((w, i) => {
            const open = unlocked(w);
            const got = stars[w.id] ?? 0;
            return (
              <li key={w.id} className="relative">
                {i > 0 && <span aria-hidden className="absolute -top-2 left-1/2 hidden h-2 border-l-2 border-dashed border-[#4a4238]/50 max-sm:block" />}
                <button
                  disabled={!open}
                  onClick={() => {
                    engine.init();
                    setWorld(w);
                  }}
                  className={cx(
                    'rpg-wood rpg-text flex w-full items-center gap-3 p-2 text-left transition sm:flex-col sm:text-center',
                    open ? 'hover:brightness-110 active:scale-[0.97]' : 'opacity-50',
                  )}
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center border-[3px] border-[#3a2414] text-lg shadow-[2px_2px_0_#0006]"
                    style={{ background: w.palette.paper, color: w.palette.ink }}
                  >
                    {open ? w.length ? w.number : '∞' : <Lock size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base leading-tight">{t(`run.world.${w.id}`)}</span>
                    <span className="block text-xs leading-tight opacity-70">{t(`run.world.${w.id}Tag`)}</span>
                    <span className="mt-0.5 flex gap-0.5 sm:justify-center" aria-label={w.length ? `${got}/3` : undefined}>
                      {w.length ? (
                        [0, 1, 2].map((s) => <Star key={s} size={13} className={s < got ? 'fill-[#e0a92e] text-[#e0a92e]' : 'opacity-30'} />)
                      ) : (
                        <span className="text-xs">
                          {t('run.best')} {best} m
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-sm text-muted">{t('run.controls')}</p>
    </GameShell>
  );
}

function Level({ world, onExit }: { world: World; onExit: () => void }) {
  const t = useT();
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const viewW = useRef(VW);
  const coach = useJesusCoach('run');
  const [phase, setPhase] = useState<Phase>('ready');
  const [hud, setHud] = useState({ breads: 0, total: 0, dist: 0, progress: 0, dove: 0, halo: 0, staff: false });
  const [result, setResult] = useState<{ stars: number; breads: number; total: number; dist: number; record: boolean } | null>(null);
  const [tries, setTries] = useState(0);
  const g = useRef<Game>(newGame(world, 0));
  const phaseRef = useRef<Phase>('ready');
  const setP = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const press = () => {
    const s = g.current;
    if (phaseRef.current === 'ready') {
      engine.init();
      setP('play');
    }
    if (phaseRef.current !== 'play') return;
    s.held = true;
    s.pressedAt = s.time;
  };
  const release = () => {
    const s = g.current;
    s.held = false;
    if (s.vy < CUT) s.vy = CUT;
  };
  const duck = (on: boolean) => {
    g.current.ducking = on;
    if (on && !g.current.grounded) g.current.vy = Math.max(g.current.vy, 260);
  };

  const restart = () => {
    g.current = newGame(world, tries + 1);
    setTries((x) => x + 1);
    setResult(null);
    setP('ready');
  };

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = performance.now();
    let hudAt = 0;

    const die = (s: Game) => {
      s.deadAt = s.time;
      s.vy = -260;
      engine.sfx('hurt');
      coach.miss();
      setP('dead');
      const dist = Math.round(s.camX / 10);
      const record = !world.length && submitScore('jesusRun', dist);
      window.setTimeout(() => setResult({ stars: 0, breads: s.breads, total: s.breadTotal, dist, record }), 1100);
    };

    const win = (s: Game) => {
      const ratio = s.breadTotal ? s.breads / s.breadTotal : 1;
      const got = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      const prev = get().runStars[world.id] ?? 0;
      if (got > prev) set({ runStars: { ...get().runStars, [world.id]: got } });
      engine.sfx('yay');
      coach.praise();
      setP('clear');
      setResult({ stars: got, breads: s.breads, total: s.breadTotal, dist: Math.round(s.camX / 10), record: got > prev });
    };

    const hurt = (s: Game, e?: Ent) => {
      if (s.time < s.halo) {
        if (e && (e.kind === 'snake' || e.kind === 'bird' || e.kind === 'goat')) e.dead = s.time;
        return;
      }
      if (s.time < s.hurtUntil) return;
      if (s.staff) {
        s.staff = false;
        s.hurtUntil = s.time + 1.4;
        engine.sfx('bump');
        return;
      }
      die(s);
    };

    const give = (s: Game, item: Item, x: number, y: number) => {
      if (item === 'bread') {
        s.breads++;
        engine.sfx('coin');
        s.pops.push({ x, y, t: s.time, text: '+1' });
      } else {
        s.ents.push({ kind: item, x, y: y - 6, w: item === 'staff' ? 6 : 12, h: item === 'staff' ? 13 : 8, phase: s.time });
      }
    };

    const music = (s: Game) => {
      const m = s.music;
      const now = engine.now;
      if (!m.at) {
        m.at = now + 0.1;
        m.bat = m.at;
      }
      while (m.at < now + 0.15) {
        const [midi, beats] = m.notes[m.i % m.notes.length];
        if (midi) engine.playNote(midi + 12, 'pluck', m.at, 0.28);
        m.at += beats * m.beat;
        m.i++;
      }
      while (m.bat < now + 0.15) {
        const [midi, beats] = m.bass[m.bi % m.bass.length];
        if (midi) engine.bass(midi - 12, m.bat, beats * m.beat * 0.8, 0.35);
        m.bat += beats * m.beat;
        m.bi++;
      }
    };

    const step = (s: Game, dt: number) => {
      s.time += dt;
      // Speed: gentle ramp through a stage; endless keeps getting faster.
      s.speed = world.length ? world.speed * (1 + 0.18 * Math.min(1, s.camX / world.length)) : Math.min(270, world.speed + s.camX * 0.011);
      s.camX += s.speed * dt;
      const px = s.camX + PX;

      if (!world.length && s.camX + W * 3 > s.genTo) {
        const more = generate(world, s.genTo, s.genTo + 900, s.random, Math.min(1, s.camX / 14000));
        s.ents.push(...more.ents);
        s.breadTotal += more.ents.filter((e) => e.kind === 'bread' || (e.kind === 'box' && e.item === 'bread')).length;
        s.genTo = more.end;
        s.ents = s.ents.filter((e) => e.x + e.w > s.camX - 60);
      }

      // Jump (with coyote time, a press buffer and the dove's extra air jump).
      const wantJump = s.pressedAt >= 0 && s.time - s.pressedAt < BUFFER;
      if (wantJump && !s.ducking) {
        if (s.grounded || s.time - s.lastGround < COYOTE) {
          s.vy = -JUMP;
          s.grounded = false;
          s.pressedAt = -1;
          s.airJumps = s.time < s.dove ? 1 : 0;
          engine.sfx('jump');
        } else if (s.airJumps > 0) {
          s.airJumps--;
          s.vy = -JUMP * 0.9;
          s.pressedAt = -1;
          engine.sfx('jump');
        }
      }

      const prevFeet = s.feet;
      const height = s.ducking && s.grounded ? 13 : 21;
      const prevHead = prevFeet - height;
      s.vy += GRAV * dt;
      if (s.time < s.dove && s.held && s.vy > 50) s.vy = 50; // dove: glide
      s.vy = Math.min(s.vy, 430);
      s.feet += s.vy * dt;
      const head = s.feet - height;
      const left = px + 3;
      const width = s.ducking && s.grounded ? 14 : 10;

      // Landing on ledges, boxes and boat decks; bumping boxes from below.
      let landed = false;
      for (const e of s.ents) {
        if (e.x > px + 30 || e.x + e.w < px - 30) continue;
        const across = left < e.x + e.w && left + width > e.x;
        if (!across) continue;
        if (e.kind === 'ledge' || e.kind === 'box' || e.kind === 'hull') {
          if (s.vy >= 0 && prevFeet <= e.y + 1 && s.feet >= e.y) {
            s.feet = e.y;
            s.vy = 0;
            landed = true;
          } else if (e.kind === 'box' && s.vy < 0 && prevHead >= e.y + e.h - 1 && head <= e.y + e.h) {
            s.vy = 80;
            s.feet = e.y + e.h + height;
            engine.sfx('bump');
            if (!e.used) {
              e.used = true;
              give(s, e.item ?? 'bread', e.x + 2, e.y - 4);
            }
          }
        }
      }
      const overPit = s.ents.some((e) => e.kind === 'pit' && left + 2 > e.x && left + width - 2 < e.x + e.w);
      if (!landed && !overPit && s.feet >= GROUND && prevFeet <= GROUND + 2) {
        s.feet = GROUND;
        s.vy = 0;
        landed = true;
      }
      s.grounded = landed;
      if (landed) s.lastGround = s.time;
      if (s.feet > H + 30) return die(s);

      // Moving things.
      for (const e of s.ents) {
        if (e.dead || e.taken) continue;
        if (e.vx && e.x < s.camX + viewW.current + 40) e.x += e.vx * dt;
        if (e.kind === 'fish') {
          const k = ((s.time + (e.phase ?? 0)) % 2.2) / 2.2;
          e.y = k < 0.55 ? GROUND - Math.sin((k / 0.55) * Math.PI) * 42 : GROUND + 4;
        }
      }

      // Touching things.
      const top = s.feet - height;
      for (const e of s.ents) {
        if (e.dead || e.taken || e.x > px + 20 || e.x + e.w < px - 10) continue;
        if (!overlap(left, top, width, height, e, e.kind === 'bread' ? 0 : 2)) continue;
        switch (e.kind) {
          case 'bread':
          case 'fishItem':
            e.taken = true;
            s.breads++;
            engine.sfx('coin');
            break;
          case 'dove':
            e.taken = true;
            s.dove = s.time + POWER_TIME.dove;
            engine.sfx('power');
            coach.praise();
            break;
          case 'halo':
            e.taken = true;
            s.halo = s.time + POWER_TIME.halo;
            engine.sfx('power');
            coach.praise();
            break;
          case 'staff':
            e.taken = true;
            s.staff = true;
            engine.sfx('power');
            break;
          case 'snake':
          case 'bird':
          case 'goat':
            if (s.vy > 0 && prevFeet <= e.y + 4) {
              e.dead = s.time;
              s.vy = s.held ? -JUMP * 0.9 : -230;
              s.stomps++;
              engine.sfx('stomp');
              s.pops.push({ x: e.x, y: e.y - 6, t: s.time, text: '+5' });
            } else hurt(s, e);
            break;
          case 'hull':
            if (s.feet > e.y + 3) hurt(s, e);
            break;
          case 'rock':
          case 'thorn':
          case 'jar':
          case 'wave':
          case 'fish':
          case 'trunk':
            hurt(s, e);
            break;
          case 'goal':
            break;
        }
        if (phaseRef.current !== 'play') return;
      }
      const goal = s.ents.find((e) => e.kind === 'goal');
      if (goal && px > goal.x + 12) win(s);
    };

    const render = (s: Game) => {
      ctx.setTransform(1, 0, 0, 1, 0, -VY);
      s.pops = s.pops.filter((q) => s.time - q.t < 0.7);
      renderRun(ctx, {
        world,
        cam: s.camX,
        time: s.time,
        ents: s.ents,
        viewW: viewW.current,
        pops: s.pops,
        player: {
          x: PX,
          feet: s.feet,
          grounded: s.grounded,
          ducking: s.ducking,
          dead: phaseRef.current === 'dead',
          dove: s.time < s.dove,
          halo: s.time < s.halo,
          staff: s.staff,
          blink: s.time < s.hurtUntil && Math.floor(s.time * 12) % 2 === 0,
        },
      });
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = g.current;
      const ph = phaseRef.current;
      if (ph === 'play') {
        step(s, dt);
        if (phaseRef.current === 'play') music(s);
      } else if (ph === 'dead') {
        s.time += dt;
        s.vy += GRAV * dt;
        s.feet += s.vy * dt * 0.6;
      }
      render(s);
      if (now - hudAt > 120) {
        hudAt = now;
        setHud({
          breads: s.breads,
          total: s.breadTotal,
          dist: Math.round(s.camX / 10),
          progress: world.length ? Math.min(1, s.camX / (world.length + 120)) : 0,
          dove: Math.max(0, s.dove - s.time),
          halo: Math.max(0, s.halo - s.time),
          staff: s.staff,
        });
      }
    };
    const fit = () => {
      const el = box.current;
      if (!el || !canvas.current) return;
      const w = Math.round(Math.max(160, Math.min(360, (VH * el.clientWidth) / Math.max(1, el.clientHeight))));
      if (canvas.current.width !== w) {
        canvas.current.width = w;
        canvas.current.height = VH;
        ctx.imageSmoothingEnabled = false;
      }
      viewW.current = w;
    };
    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);
    fit();
    raf = requestAnimationFrame(loop);
    const onHide = () => document.visibilityState === 'hidden' && phaseRef.current === 'play' && setP('paused');
    document.addEventListener('visibilitychange', onHide);
    if (import.meta.env.DEV) (window as any).__run = g;
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener('visibilitychange', onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  // Keyboard: space / up to jump (hold for higher), down to duck, P to pause.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        if (phaseRef.current === 'dead' || phaseRef.current === 'clear') return;
        if (phaseRef.current === 'paused') return setP('play');
        press();
      } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        duck(true);
      } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (phaseRef.current === 'play') setP('paused');
      }
    };
    const up = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) release();
      else if (['ArrowDown', 's', 'S'].includes(e.key)) duck(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  });

  const pal = world.palette;
  const powerChip = (label: string, secs: number) => (
    <span className="rpg-wood px-1.5 py-0.5 text-[#ffe08a]">
      {label} {Math.ceil(secs)}
    </span>
  );

  const jumpDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (phaseRef.current === 'paused') return setP('play');
    press();
  };
  const duckDown = (e: React.PointerEvent) => {
    e.preventDefault();
    duck(true);
  };
  const hudChip = (
    <div className="rpg-frame rpg-text flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1 text-sm">
      <span>
        🍞 {hud.breads}
        {world.length ? `/${hud.total}` : ''}
      </span>
      <span>{hud.dist} m</span>
      {world.length > 0 && (
        <span className="h-2 min-w-16 flex-1 overflow-hidden border border-[#3a2414] bg-[#3a2414]" role="progressbar" aria-valuenow={Math.round(hud.progress * 100)}>
          <span className="block h-full bg-[#e8b830]" style={{ width: `${hud.progress * 100}%` }} />
        </span>
      )}
      {hud.dove > 0 && powerChip(t('run.dove'), hud.dove)}
      {hud.halo > 0 && powerChip(t('run.halo'), hud.halo)}
      {hud.staff && <span className="rpg-wood px-1.5 py-0.5 text-[#ffe08a]">{t('run.staff')}</span>}
    </div>
  );
  const roundBtn =
    'rpg-text grid touch-none select-none place-items-center rounded-full border-4 border-[#4a2c14] shadow-[3px_3px_0_#0006] active:scale-95';

  // Full screen: lying down the game fills the whole screen with the controls on top;
  // standing up the game takes the full width with big buttons below.
  return createPortal(
    <div className="fixed inset-0 z-50 flex select-none flex-col bg-[#0a0b10] font-pixel text-white landscape:block" role="dialog" aria-modal="true" aria-label={t(`run.world.${world.id}`)}>
      <header className="flex items-center gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))] landscape:pointer-events-none landscape:absolute landscape:inset-x-0 landscape:top-0 landscape:z-20 landscape:pl-[max(0.5rem,env(safe-area-inset-left))] landscape:pr-[max(0.5rem,env(safe-area-inset-right))]">
        <button onClick={onExit} aria-label={t('run.backMap')} className="rpg-wood rpg-text pointer-events-auto h-10 shrink-0 px-3 text-sm">
          ← {t('run.map')}
        </button>
        <h2 className="min-w-0 flex-1 truncate text-lg landscape:hidden">{t(`run.world.${world.id}`)}</h2>
        <div className="hidden min-w-0 flex-1 landscape:block">{hudChip}</div>
        {phase === 'play' && (
          <button onClick={() => setP('paused')} aria-label={t('run.pause')} className="rpg-wood rpg-text pointer-events-auto grid h-10 w-10 place-items-center">
            <Pause size={18} />
          </button>
        )}
      </header>
      <div className="px-2 landscape:pointer-events-none landscape:absolute landscape:left-[32%] landscape:top-14 landscape:z-20 landscape:max-w-[45%] landscape:origin-top-left landscape:scale-90 landscape:px-0">
        {coach.node}
      </div>
      <div className="px-2 pt-2 landscape:hidden">{hudChip}</div>
      <div className="flex flex-1 flex-col justify-evenly gap-3 p-2 landscape:absolute landscape:inset-0 landscape:block landscape:p-0">
        <div ref={box} className="relative aspect-[16/10] w-full overflow-hidden border-y-[3px] border-[#5b3a1e] landscape:aspect-auto landscape:h-full landscape:border-0">
          <canvas
            ref={canvas}
            width={VW}
            height={VH}
            className="pixelated absolute inset-0 block h-full w-full touch-none select-none"
            aria-label={t('run.canvas')}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              if (phaseRef.current === 'paused') return setP('play');
              if (phaseRef.current === 'dead' || phaseRef.current === 'clear') return;
              press();
            }}
            onPointerUp={release}
            onPointerCancel={release}
          />
          {(phase === 'ready' || phase === 'paused') && (
            <button onClick={() => (phase === 'paused' ? setP('play') : press())} className="rpg-text absolute inset-0 z-10 grid place-items-center text-center">
              <span className="rpg-frame px-4 py-2 text-lg">
                {phase === 'paused' ? <Play className="mx-auto mb-1" size={20} /> : null}
                {phase === 'paused' ? t('run.resume') : t('run.tapToStart')}
              </span>
            </button>
          )}
          {result && (
            <div className="absolute inset-0 z-30 flex overflow-y-auto bg-black/55 p-2">
              <div className="rpg-frame rpg-text m-auto px-4 py-3 text-center">
                <p className="text-xl">{phase === 'clear' ? t('run.cleared') : t('run.gameOver')}</p>
                {phase === 'clear' && (
                  <div className="my-1 flex justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <Star key={i} size={22} className={i < result.stars ? 'fill-[#e0a92e] text-[#e0a92e]' : 'opacity-30'} />
                    ))}
                  </div>
                )}
                <p className="text-sm">
                  🍞 {result.breads}
                  {world.length ? `/${result.total}` : ''} · {result.dist} m{result.record ? ` · ★ ${t('game.record')}` : ''}
                </p>
                <div className="mt-2 flex justify-center gap-2">
                  <button onClick={onExit} className="rpg-wood h-11 px-3">
                    {t('run.map')}
                  </button>
                  <button onClick={restart} className="rpg-wood h-11 px-4 text-[#ffe08a]">
                    {t('game.again')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 landscape:contents">
          <button
            onPointerDown={jumpDown}
            onPointerUp={release}
            onPointerCancel={release}
            onPointerLeave={release}
            aria-label={t('run.jump')}
            className={cx(
              roundBtn,
              'h-32 w-full rounded-2xl bg-[#c8321f] text-lg landscape:absolute landscape:bottom-[max(0.75rem,env(safe-area-inset-bottom))] landscape:right-[max(1rem,env(safe-area-inset-right))] landscape:z-20 landscape:h-16 landscape:w-16 landscape:rounded-full landscape:bg-[#c8321f]/70 landscape:text-sm',
            )}
          >
            <span className="flex flex-col items-center leading-none">
              <ArrowUp size={22} /> {t('run.jump')}
            </span>
          </button>
          <button
            onPointerDown={duckDown}
            onPointerUp={() => duck(false)}
            onPointerCancel={() => duck(false)}
            onPointerLeave={() => duck(false)}
            aria-label={t('run.duck')}
            className={cx(
              roundBtn,
              'h-32 w-full rounded-2xl bg-[#5a4a3a] text-lg landscape:absolute landscape:bottom-[max(0.75rem,env(safe-area-inset-bottom))] landscape:left-[max(1rem,env(safe-area-inset-left))] landscape:z-20 landscape:h-16 landscape:w-16 landscape:rounded-full landscape:bg-[#5a4a3a]/70 landscape:text-sm',
            )}
          >
            <span className="flex flex-col items-center leading-none">
              <ArrowDown size={22} /> {t('run.duck')}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
