/**
 * Jesus: o caminho — chapters 7 to 11: steering through the storm, guiding the
 * blind man with a program of steps, pushing the stones at Lazarus' tomb,
 * the vigil in Gethsemane and the run to tell that He is risen.
 */
import { useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { drawPerson, type Dir } from '../pixel/person';
import { Qte } from '../pixel/Qte';
import { heroFace } from '../pixel/heroes';
import { burst, buzz, byDiff, Panel, Retry as RetryBase, Stage, starsOf, stepParts, useKeys, useStage, type GameProps, type Part } from '../pixel/stage';
import * as SC from '../david/scenes';
import { JLOOKS } from './content';

const Retry = (p: { text: string; onRetry: () => void }) => <RetryBase {...p} look={JLOOKS.jesus} />;
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// ================================================================ 7. The storm

export function Storm({ paused, onWin, diff = 1 }: GameProps) {
  const WAVES = byDiff(diff, [10, 14, 18]);
  const [phase, setPhase] = useState<'storm' | 'calm' | 'done'>('storm');
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const turning = useRef(0);
  const st = useRef(fresh());
  function fresh() {
    return { angle: 0, water: 0, maxWater: 0, waves: [] as { a: number; t: number }[], next: 1.5, passed: 0, flash: 0, shake: 0, parts: [] as Part[], bail: 0 };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && phase === 'storm';
    const cx0 = w / 2;
    const cy0 = 100;
    if (live) {
      s.angle += turning.current * byDiff(diff, [2.6, 2.3, 2]) * dt;
      s.next -= dt;
      if (s.next <= 0 && s.passed + s.waves.length < WAVES) {
        s.waves.push({ a: Math.random() * Math.PI * 2, t: byDiff(diff, [2.2, 1.8, 1.4]) });
        s.next = byDiff(diff, [2.6, 2.1, 1.7]) + Math.random();
      }
      for (const wv of s.waves) {
        wv.t -= dt;
        if (wv.t <= 0) {
          // The boat must meet the wave head-on (bow or stern), never broadside.
          const head = Math.abs(((wv.a - s.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          const off = Math.min(head, Math.PI - head);
          const dmg = off < 0.45 ? 2 : off < 0.9 ? 14 : 26;
          s.water += dmg * byDiff(diff, [0.8, 1, 1.2]);
          s.passed += 1;
          s.shake = dmg > 5 ? 0.35 : 0.1;
          if (dmg > 5) {
            engine.sfx('hurt');
            buzz([50, 30, 50]);
          } else {
            engine.drum('tom', 0, 0.6);
            burst(s.parts, cx0, cy0 - 20, '#ffffff', 8);
          }
          if (s.water >= 100) setLost(true);
        }
      }
      s.waves = s.waves.filter((wv) => wv.t > 0);
      s.water = Math.max(0, s.water - s.bail);
      s.bail = 0;
      s.maxWater = Math.max(s.maxWater, s.water);
      if (s.passed >= WAVES && !s.waves.length) setPhase('calm');
      if (Math.random() < dt * 0.3) s.flash = 0.18;
      s.flash = Math.max(0, s.flash - dt);
      s.shake = Math.max(0, s.shake - dt);
      if (Math.floor(t * 8) !== Math.floor((t - dt) * 8)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt, 80);
    const calm = phase !== 'storm';
    const sx = s.shake > 0 ? Math.round(Math.sin(t * 50) * 3) : 0;
    // Top-down sea.
    for (let y = 0; y < 180; y += 4) rect(ctx, 0, y, w, 4, calm ? (y % 8 ? '#4a8ac0' : '#5a9ad0') : (y + Math.floor(t * 30)) % 12 < 4 ? '#2a4a6a' : '#1e3a58');
    if (!calm) for (let k = 0; k < 40; k++) rect(ctx, (k * 53 + t * 80) % w, (k * 37 + t * 50) % 180, 6, 1, '#8ab0d0');
    // Incoming waves: a crest on the side they come from.
    for (const wv of s.waves) {
      const dist = 30 + wv.t * 40;
      const x = cx0 + Math.cos(wv.a) * dist;
      const y = cy0 + Math.sin(wv.a) * dist;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(wv.a + Math.PI / 2);
      rect(ctx, -22, -3, 44, 6, '#e8f0f8');
      rect(ctx, -20, 3, 40, 3, '#9ac0e0');
      ctx.restore();
      // Arrow at the edge.
      const ex = cx0 + Math.cos(wv.a) * Math.min(w * 0.45, 80);
      const ey = cy0 + Math.sin(wv.a) * 70;
      ctx.fillStyle = wv.t < 0.6 ? '#ff6a4a' : '#ffe066';
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // The boat seen from above; the bow points to `angle`.
    ctx.save();
    ctx.translate(cx0 + sx, cy0);
    ctx.rotate(s.angle);
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(8, -11);
    ctx.lineTo(-22, -10);
    ctx.lineTo(-22, 10);
    ctx.lineTo(8, 11);
    ctx.fill();
    ctx.fillStyle = '#9a6234';
    ctx.beginPath();
    ctx.moveTo(23, 0);
    ctx.lineTo(7, -9);
    ctx.lineTo(-20, -8);
    ctx.lineTo(-20, 8);
    ctx.lineTo(7, 9);
    ctx.fill();
    rect(ctx, -18, -7, 28 * Math.min(1, s.water / 100), 14, 'rgba(90,150,210,0.7)');
    rect(ctx, -2, -9, 3, 18, '#5a3a1e');
    // Disciples holding on, and Jesus asleep at the stern on a cushion.
    for (const [x, y, c] of [
      [10, -5, '#2e5a5e'],
      [10, 4, '#4a6a9a'],
      [2, -5, '#8a6a3a'],
      [2, 4, '#6a5a4a'],
    ] as const) {
      ctx.fillStyle = c;
      ctx.fillRect(x - 2, y - 2, 4, 4);
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
    ctx.fillStyle = '#c8b090';
    ctx.fillRect(-19, -3, 4, 6);
    ctx.fillStyle = '#e6dcc4';
    ctx.fillRect(-16, -3, 7, 6);
    ctx.fillStyle = '#4a2a14';
    ctx.fillRect(-19, -2, 3, 4);
    ctx.restore();
    SC.particlesDraw(ctx, s.parts);
    if (s.flash > 0 && !calm) {
      ctx.fillStyle = `rgba(255,255,255,${s.flash * 2.5})`;
      ctx.fillRect(0, 0, w, 180);
    }
  });
  useKeys(
    (k) => {
      if (k === 'arrowleft' || k === 'a') turning.current = -1;
      if (k === 'arrowright' || k === 'd') turning.current = 1;
      if (k === ' ' || k === 'enter') st.current.bail = 6;
    },
    (k) => (k === 'arrowleft' || k === 'a' || k === 'arrowright' || k === 'd') && (turning.current = 0),
  );
  const s = st.current;
  const hold = (d: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      turning.current = d;
    },
    onPointerUp: () => (turning.current = 0),
    onPointerCancel: () => (turning.current = 0),
  });
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && phase === 'storm' && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="text-base">
              Ondas: {s.passed}/{WAVES}
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Água no barco
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full', s.water > 65 ? 'animate-pulse bg-[#d8402a]' : 'bg-[#5ab0e0]')} style={{ width: `${Math.min(100, s.water)}%` }} />
              </span>
            </Panel>
          </div>
          <div className="absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] flex gap-2">
            <button {...hold(-1)} className="rpg-wood rpg-text h-20 w-20 touch-none text-3xl" aria-label="Girar à esquerda">
              ⟲
            </button>
            <button {...hold(1)} className="rpg-wood rpg-text h-20 w-20 touch-none text-3xl" aria-label="Girar à direita">
              ⟳
            </button>
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              st.current.bail = 5;
              engine.playNote(55, 'pluck', 0, 0.15);
            }}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#5a8ab8] text-base leading-tight shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Tirar água
          </button>
        </>
      )}
      {!paused && phase === 'calm' && (
        <Qte
          kind="ring"
          title="Cala-te, aquieta-te!"
          hint="Os discípulos acordaram Jesus. Toque quando a luz encostar no círculo."
          look={JLOOKS.jesus}
          img={heroFace('jesus')}
          times={byDiff(diff, [2, 3, 4])}
          diff={diff}
          button="Repreender o vento"
          onDone={(ok) => {
            if (!ok) return;
            setPhase('done');
            engine.sfx('yay');
            window.setTimeout(() => onWin(starsOf(1 - st.current.maxWater / 110)), 900);
          }}
        />
      )}
      {lost && (
        <Retry
          text="O barco encheu de água! Gire a proa na direção de onde vem cada onda (o ponto que fica vermelho)."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 8. The man born blind (programming)

const BLIND_MAPS = [
  ['##########', '#S..#....#', '#.#.#.##.#', '#.#...#..#', '#.###.#.##', '#...~...G#', '##########'],
  ['############', '#S...#.....#', '###.##.###.#', '#...#..#~#.#', '#.###.##.#.#', '#...#....#.#', '#~#.....#..#', '#...#..G...#', '############'],
  ['############', '#S.#...#...#', '#..#.#.#.#.#', '##.#.#...#.#', '#..~.###.#.#', '#.##...#.#G#', '#....#...#~#', '############'],
];
const STEP: Record<string, [number, number]> = { '↑': [-1, 0], '↓': [1, 0], '←': [0, -1], '→': [0, 1] };

function shortest(map: string[]) {
  let s: [number, number] = [0, 0];
  let g: [number, number] = [0, 0];
  map.forEach((row, r) => [...row].forEach((ch, c) => (ch === 'S' ? (s = [r, c]) : ch === 'G' ? (g = [r, c]) : null)));
  const seen = new Map<string, number>([[s.join(), 0]]);
  const q = [s];
  while (q.length) {
    const p = q.shift()!;
    for (const [dr, dc] of Object.values(STEP)) {
      const n: [number, number] = [p[0] + dr, p[1] + dc];
      const ch = map[n[0]]?.[n[1]];
      if (!ch || ch === '#' || ch === '~' || seen.has(n.join())) continue;
      seen.set(n.join(), seen.get(p.join())! + 1);
      q.push(n);
    }
  }
  return { start: s, goal: g, len: seen.get(g.join()) ?? 99 };
}

export function BlindPath({ paused, onWin, diff = 1 }: GameProps) {
  const map = BLIND_MAPS[byDiff(diff, [0, 1, 2])];
  const info = useRef(shortest(map));
  const LIMIT = info.current.len + byDiff(diff, [6, 2, 0]);
  const [prog, setProg] = useState<string[]>([]);
  const [pos, setPos] = useState<[number, number]>(info.current.start);
  const [running, setRunning] = useState(false);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const cv = useStage((ctx, w, dt, t) => {
    rect(ctx, 0, 0, w, 180, '#c8b088');
    for (let i = 0; i < w; i++) rect(ctx, (i * 41) % w, (i * 29) % 180, 2, 1, '#b49a6a');
    void dt;
    void t;
  });
  const run = () => {
    if (running || !prog.length || won) return;
    setRunning(true);
    setMsg(null);
    let p: [number, number] = info.current.start;
    setPos(p);
    prog.forEach((cmd, i) => {
      window.setTimeout(() => {
        if (!p) return;
        const [dr, dc] = STEP[cmd];
        const n: [number, number] = [p[0] + dr, p[1] + dc];
        const ch = map[n[0]][n[1]];
        if (ch === '#' || ch === '~') {
          engine.sfx('bump');
          buzz([40, 30, 40]);
          setMsg(ch === '#' ? `Passo ${i + 1}: ele bateu na parede! Ajuste o caminho.` : `Passo ${i + 1}: quase caiu na água funda!`);
          setTries((x) => x + 1);
          setRunning(false);
          p = null as unknown as [number, number];
          return;
        }
        p = n;
        setPos(n);
        engine.playNote(60 + (i % 8) * 2, 'pluck', 0, 0.15);
        if (ch === 'G') {
          setWon(true);
          setRunning(false);
          engine.sfx('yay');
          buzz([40, 30, 80]);
          window.setTimeout(() => onWin(tries === 0 ? 3 : tries === 1 ? 2 : 1), 900);
          p = null as unknown as [number, number];
        } else if (i === prog.length - 1) {
          setMsg('Os passos acabaram antes do tanque. Ele ficou parado no meio do caminho.');
          setTries((x) => x + 1);
          setRunning(false);
        }
      }, 300 + i * 260);
    });
  };
  const cols = map[0].length;
  const rows = map.length;
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      <div className="absolute inset-y-2 left-[max(3.5rem,env(safe-area-inset-left))] right-2 flex items-center justify-center gap-2">
        <div className="relative h-full max-h-[22rem] border-[4px] border-[#3a2414]" style={{ aspectRatio: `${cols} / ${rows}` }}>
          {map.map((row, r) =>
            [...row].map((ch, c) => (
              <span
                key={`${r}-${c}`}
                className="absolute"
                style={{
                  left: `${(c / cols) * 100}%`,
                  top: `${(r / rows) * 100}%`,
                  width: `${100 / cols}%`,
                  height: `${100 / rows}%`,
                  background: ch === '#' ? '#8a7a5a' : ch === '~' ? '#3a7ab0' : ch === 'G' ? '#7ac0e8' : '#d8c09a',
                  boxShadow: ch === '#' ? 'inset -2px -2px 0 #5a4a34, inset 2px 2px 0 #a8987a' : undefined,
                }}
              />
            )),
          )}
          <span className="rpg-text absolute grid place-items-center text-[10px]" style={{ left: `${(info.current.goal[1] / cols) * 100}%`, top: `${(info.current.goal[0] / rows) * 100}%`, width: `${100 / cols}%`, height: `${100 / rows}%` }}>
            Siloé
          </span>
          <span
            className="absolute grid place-items-center rounded-full border-2 border-[#2a1a10] bg-[#f0e8d8] text-[10px] transition-all duration-200"
            style={{ left: `${(pos[1] / cols) * 100 + 1}%`, top: `${(pos[0] / rows) * 100 + 1}%`, width: `${100 / cols - 2}%`, height: `${100 / rows - 2}%` }}
            aria-label="O cego"
          >
            👣
          </span>
        </div>
        <div className="rpg-frame rpg-text flex w-48 flex-col gap-1.5 p-2 text-sm">
          <span className="text-[#ffe08a]">
            Passos: {prog.length}/{LIMIT}
          </span>
          <span className="flex min-h-12 flex-wrap gap-0.5 border-2 border-[#3a2414] bg-[#efe2c4] p-1 text-base text-[#3a2414]" style={{ textShadow: 'none' }}>
            {prog.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
          <span className="grid grid-cols-4 gap-1">
            {Object.keys(STEP).map((k) => (
              <button key={k} disabled={running || prog.length >= LIMIT} onClick={() => (setProg([...prog, k]), engine.playNote(67, 'pluck', 0, 0.1))} className="rpg-wood h-11 text-xl">
                {k}
              </button>
            ))}
          </span>
          <span className="grid grid-cols-2 gap-1">
            <button disabled={running} onClick={() => setProg(prog.slice(0, -1))} className="rpg-wood h-9">
              Apagar
            </button>
            <button disabled={running} onClick={() => (setProg([]), setPos(info.current.start), setMsg(null))} className="rpg-wood h-9">
              Limpar
            </button>
          </span>
          <button disabled={running || !prog.length} onClick={run} className={cx('rpg-wood h-11 text-lg', prog.length && !running && 'animate-blink text-[#ffe08a]')}>
            Guiar
          </button>
          {msg && <span className="text-xs text-[#ffb08a]">{msg}</span>}
        </div>
      </div>
    </>
  );
}

// ================================================================ 9. Lazarus (pushing stones)

const TOMB_LEVELS = [
  ['#######', '#     #', '# $ . #', '#  @  #', '# $ . #', '#     #', '#######'],
  ['########', '#  .   #', '# $##$ #', '#  @   #', '# $  # #', '#.  .  #', '########'],
  ['########', '#.  #  #', '# $ $  #', '##  #$ #', '#  @ . #', '# $  ###', '#. .   #', '########'],
];
const TOMB_PAR = [11, 23, 29];

export function Tomb({ paused, onWin, diff = 1 }: GameProps) {
  const level = byDiff(diff, [0, 1, 2]);
  const parse = () => {
    const map = TOMB_LEVELS[level];
    let p: [number, number] = [0, 0];
    const boxes: [number, number][] = [];
    map.forEach((row, r) => [...row].forEach((ch, c) => (ch === '@' ? (p = [r, c]) : ch === '$' ? boxes.push([r, c]) : null)));
    return { p, boxes };
  };
  const [state, setState] = useState(parse);
  const [hist, setHist] = useState<(typeof state)[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [face, setFace] = useState<Dir>('down');
  const map = TOMB_LEVELS[level];
  const goals: [number, number][] = [];
  map.forEach((row, r) => [...row].forEach((ch, c) => ch === '.' && goals.push([r, c])));
  const cv = useStage((ctx, w, dt, t) => {
    // A garden of olive trees around the tomb at Bethany.
    rect(ctx, 0, 0, w, 180, '#7a9a4a');
    for (let i = 0; i < w; i++) rect(ctx, (i * 47) % w, (i * 23) % 180, 1, 2, '#5a7a3a');
    SC.blob(ctx, 30, 40, 22, 14, '#5a7a3a');
    SC.blob(ctx, w - 30, 150, 24, 14, '#5a7a3a');
    void dt;
    void t;
  });
  const isWall = (r: number, c: number) => map[r]?.[c] === '#';
  const step = (dr: number, dc: number) => {
    if (paused || won) return;
    setFace(dr < 0 ? 'up' : dr > 0 ? 'down' : dc < 0 ? 'left' : 'right');
    const [pr, pc] = state.p;
    const n: [number, number] = [pr + dr, pc + dc];
    if (isWall(...n)) return engine.sfx('bump');
    const bi = state.boxes.findIndex(([r, c]) => r === n[0] && c === n[1]);
    let boxes = state.boxes;
    if (bi >= 0) {
      const b2: [number, number] = [n[0] + dr, n[1] + dc];
      if (isWall(...b2) || state.boxes.some(([r, c]) => r === b2[0] && c === b2[1])) {
        engine.sfx('bump');
        buzz(15);
        return;
      }
      boxes = state.boxes.map((b, i) => (i === bi ? b2 : b));
      engine.drum('tom', 0, 0.5);
    }
    setHist([...hist, state]);
    const next = { p: n, boxes };
    setState(next);
    setMoves((m) => m + 1);
    if (goals.every(([gr, gc]) => boxes.some(([r, c]) => r === gr && c === gc))) {
      setWon(true);
      engine.sfx('yay');
      buzz([40, 30, 80]);
      window.setTimeout(() => onWin(starsOf(1 - Math.max(0, moves + 1 - TOMB_PAR[level]) / (TOMB_PAR[level] * 1.5))), 1100);
    }
  };
  useKeys((k) => {
    if (k === 'arrowup' || k === 'w') step(-1, 0);
    if (k === 'arrowdown' || k === 's') step(1, 0);
    if (k === 'arrowleft' || k === 'a') step(0, -1);
    if (k === 'arrowright' || k === 'd') step(0, 1);
    if (k === 'z' || k === 'backspace') undo();
  });
  const undo = () => {
    if (!hist.length || won) return;
    setState(hist[hist.length - 1]);
    setHist(hist.slice(0, -1));
    setMoves((m) => m + 1);
  };
  const cols = map[0].length;
  const rows = map.length;
  const cell = (r: number, c: number) => ({ left: `${(c / cols) * 100}%`, top: `${(r / rows) * 100}%`, width: `${100 / cols}%`, height: `${100 / rows}%` });
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      <div className="absolute inset-y-2 left-[max(3.5rem,env(safe-area-inset-left))] right-2 flex items-center justify-center gap-2">
        <div className="relative h-full max-h-[22rem] border-[4px] border-[#3a2414] bg-[#a8946a]" style={{ aspectRatio: `${cols} / ${rows}` }}>
          {map.map((row, r) =>
            [...row].map((ch, c) =>
              ch === '#' ? (
                <span key={`${r}-${c}`} className="absolute bg-[#7a6a50]" style={{ ...cell(r, c), boxShadow: 'inset -2px -2px 0 #4a3e2e, inset 2px 2px 0 #9a8a6a' }} />
              ) : ch === '.' ? (
                <span key={`${r}-${c}`} className="absolute grid place-items-center" style={cell(r, c)}>
                  <span className="h-1/2 w-1/2 rounded-full border-2 border-dashed border-[#ffe08a]" />
                </span>
              ) : null,
            ),
          )}
          {state.boxes.map(([r, c], i) => {
            const on = goals.some(([gr, gc]) => gr === r && gc === c);
            return (
              <span key={i} className="absolute p-[6%] transition-all duration-100" style={cell(r, c)}>
                <span className={cx('block h-full w-full rounded-[40%] border-2 border-[#2a1a10]', on ? 'bg-[#c8b878] shadow-[0_0_8px_#ffe066]' : 'bg-[#a89e8e]')} />
              </span>
            );
          })}
          <span className="absolute grid place-items-center transition-all duration-100" style={cell(...state.p)} aria-label="Jesus">
            <span className="block h-[80%] w-[70%] rounded-t-full border-2 border-[#2a1a10] bg-[#e6dcc4]" style={{ boxShadow: 'inset 0 6px 0 #4a2a14' }} />
            <span className="sr-only">{face}</span>
          </span>
        </div>
        <div className="rpg-frame rpg-text flex w-44 flex-col gap-1.5 p-2 text-sm">
          <span className="text-[#ffe08a]">Pedras nas marcas</span>
          <span>
            Passos: {moves} (ideal {TOMB_PAR[level]})
          </span>
          <span className="grid grid-cols-3 gap-1">
            <span />
            <button className="rpg-wood h-11 text-xl" onClick={() => step(-1, 0)} aria-label="Cima">
              ▲
            </button>
            <span />
            <button className="rpg-wood h-11 text-xl" onClick={() => step(0, -1)} aria-label="Esquerda">
              ◀
            </button>
            <button className="rpg-wood h-11 text-xl" onClick={() => step(1, 0)} aria-label="Baixo">
              ▼
            </button>
            <button className="rpg-wood h-11 text-xl" onClick={() => step(0, 1)} aria-label="Direita">
              ▶
            </button>
          </span>
          <span className="grid grid-cols-2 gap-1">
            <button className="rpg-wood h-9" onClick={undo}>
              Desfazer
            </button>
            <button
              className="rpg-wood h-9"
              onClick={() => {
                setState(parse());
                setHist([]);
                setMoves(0);
              }}
            >
              Recomeçar
            </button>
          </span>
          <span className="text-xs opacity-80">Só dá para empurrar, nunca puxar. Pedra no canto não sai mais!</span>
        </div>
      </div>
    </>
  );
}

// ================================================================ 10. Gethsemane (vigil)

export function Gethsemane({ paused, onWin, diff = 1 }: GameProps) {
  const DUR = byDiff(diff, [36, 45, 52]);
  const [phase, setPhase] = useState<'vigil' | 'sword' | 'heal' | 'done'>('vigil');
  const [lost, setLost] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [, setH] = useState(0);
  const praying = useRef(false);
  const st = useRef(fresh());
  function fresh() {
    return { spirit: 100, time: 0, awake: [100, 100, 100], slept: 0, thoughts: [] as { x: number; y: number }[], next: 2, w: 320, parts: [] as Part[] };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    s.w = w;
    const live = !paused && !lost && phase === 'vigil';
    const jx = w * 0.62;
    const jy = 130;
    if (live) {
      s.time += dt;
      const rate = byDiff(diff, [6, 8.5, 11]);
      s.awake = s.awake.map((a) => Math.max(0, a - rate * (0.6 + Math.random() * 0.8) * dt));
      if (s.awake.some((a) => a <= 0)) s.slept += dt;
      s.spirit += (praying.current ? 9 : -byDiff(diff, [5, 7, 9])) * dt;
      s.spirit = Math.min(100, s.spirit);
      s.next -= dt;
      if (s.next <= 0) {
        s.thoughts.push({ x: Math.random() < 0.5 ? -10 : w + 10, y: 40 + Math.random() * 60 });
        s.next = byDiff(diff, [2.8, 2.1, 1.6]);
      }
      for (const th of s.thoughts) {
        const dx = jx - th.x;
        const dy = jy - 20 - th.y;
        const d = Math.hypot(dx, dy);
        th.x += (dx / d) * 30 * dt;
        th.y += (dy / d) * 30 * dt;
        if (praying.current && d < 40) {
          th.x = -999;
          burst(s.parts, jx, jy - 30, '#ffe066', 6);
        } else if (d < 8) {
          th.x = -999;
          s.spirit -= 14;
          engine.sfx('hurt');
          buzz([40, 30, 40]);
        }
      }
      s.thoughts = s.thoughts.filter((th) => th.x > -100);
      if (s.spirit <= 0) setLost(true);
      if (s.time >= DUR) {
        engine.sfx('power');
        setPhase('sword');
      }
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    s.parts = stepParts(s.parts, dt);
    // Night in the olive grove.
    SC.sky(ctx, w, ['#0e1228', '#141a34', '#1a2240', '#222a4a'], 90);
    rect(ctx, w * 0.85, 18, 10, 10, '#f0f0e0');
    SC.hills(ctx, w, 96, '#1e2a24', 10, 0.04, 3);
    rect(ctx, 0, 100, w, 80, '#2a3428');
    for (const x of [0.1, 0.4, 0.88]) {
      rect(ctx, x * w - 2, 60, 4, 40, '#3a2a1a');
      SC.blob(ctx, x * w, 58, 20, 12, '#3a4a32');
    }
    // Three disciples, asleep or awake.
    const disc = [JLOOKS.pedro, { ...JLOOKS.joao, robe: '#7a5a3a' }, JLOOKS.joao];
    s.awake.forEach((a, i) => {
      const x = w * 0.14 + i * 22;
      drawPerson(ctx, disc[i], x, 150, a > 0 ? 'right' : 'down', 0);
      if (a <= 0) {
        ctx.fillStyle = '#c8d8ff';
        ctx.font = '8px "Pixelify Sans", monospace';
        ctx.fillText('z', x + 4, 116 - ((t * 10) % 8));
      } else {
        rect(ctx, x - 6, 154, 12, 2, '#2a1a10');
        rect(ctx, x - 6, 154, Math.round(12 * (a / 100)), 2, a < 30 ? '#ff8a5a' : '#8ad86a');
      }
    });
    // Jesus kneeling in prayer, the cup of light, and the dark thoughts.
    drawPerson(ctx, JLOOKS.jesus, jx, jy, 'up', 0);
    if (praying.current) {
      ctx.fillStyle = 'rgba(255,240,180,0.22)';
      ctx.beginPath();
      ctx.arc(jx, jy - 18, 34 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const th of s.thoughts) {
      ctx.fillStyle = 'rgba(60,20,60,0.85)';
      ctx.beginPath();
      ctx.arc(th.x, th.y, 6 + Math.sin(t * 8 + th.y) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      rect(ctx, th.x - 2, th.y - 1, 1, 1, '#ff5a3a');
      rect(ctx, th.x + 1, th.y - 1, 1, 1, '#ff5a3a');
    }
    SC.particlesDraw(ctx, s.parts);
  });
  const wake = (i: number) => {
    const s = st.current;
    if (paused || phase !== 'vigil') return;
    s.awake[i] = 100;
    engine.playNote(69, 'pluck', 0, 0.25);
    buzz(15);
    setMsg(i === 0 ? '“Simão, dormes? O espírito está pronto, mas a carne é fraca.”' : '“Vigiai e orai, para não cairdes em tentação.”');
    setH((h) => h + 1);
  };
  const s = st.current;
  if (paused) return <Stage cv={cv} />;
  return (
    <>
      <Stage cv={cv} />
      {phase === 'vigil' && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Espírito
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className={cx('block h-full', s.spirit < 30 ? 'animate-pulse bg-[#d8402a]' : 'bg-[#ffe066]')} style={{ width: `${Math.max(0, s.spirit)}%` }} />
              </span>
            </Panel>
            <Panel className="flex items-center gap-2 text-base">
              Noite
              <span className="h-3 w-20 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#8a8ad8]" style={{ width: `${Math.min(100, (s.time / DUR) * 100)}%` }} />
              </span>
            </Panel>
            {msg && <Panel className="text-sm text-[#ffe08a]">{msg}</Panel>}
          </div>
          <div className="absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] flex gap-1.5">
            {['Pedro', 'Tiago', 'João'].map((n, i) => (
              <button key={n} onClick={() => wake(i)} className={cx('rpg-wood rpg-text h-14 w-20 text-sm leading-tight', s.awake[i] <= 0 && 'animate-blink text-[#ffe08a]')}>
                Acordar {n}
              </button>
            ))}
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              praying.current = true;
            }}
            onPointerUp={() => (praying.current = false)}
            onPointerCancel={() => (praying.current = false)}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#e8b830] text-lg leading-tight text-[#3a2414] shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Orar
            <span className="text-xs">segure</span>
          </button>
        </>
      )}
      {phase === 'sword' && (
        <div className="absolute inset-x-2 bottom-2 mx-auto max-w-3xl">
          <div className="rpg-frame rpg-text flex flex-col gap-2 px-3 py-2 text-lg leading-snug">
            <span className="text-sm text-[#ffe08a]">Os soldados chegam com Judas. Pedro feriu Malco com a espada. O que Jesus diz?</span>
            {msg && phase === 'sword' && <span className="text-sm text-[#ffb08a]">{msg}</span>}
            <span className="grid gap-1.5 sm:grid-cols-3">
              {[
                ['“Embainha a tua espada.”', true],
                ['“Lutai, discípulos!”', false],
                ['“Fujamos pelo jardim!”', false],
              ].map(([label, ok]) => (
                <button
                  key={label as string}
                  onClick={() => {
                    if (ok) {
                      setMsg(null);
                      setPhase('heal');
                    } else {
                      engine.sfx('bonk');
                      st.current.slept += 5;
                      setMsg('Não... Jesus não veio para ferir. “Bem-aventurados os pacificadores.”');
                    }
                  }}
                  className="rpg-wood min-h-11 px-2 py-1 text-base"
                >
                  {label as string}
                </button>
              ))}
            </span>
          </div>
        </div>
      )}
      {phase === 'heal' && (
        <Qte
          kind="ring"
          title="Curar a orelha de Malco"
          hint="Até preso, Jesus cura o inimigo. Toque quando a luz encostar no círculo."
          look={JLOOKS.jesus}
          img={heroFace('jesus')}
          times={byDiff(diff, [1, 2, 3])}
          diff={diff}
          button="Tocar e curar"
          onDone={(ok) => {
            if (!ok) return;
            setPhase('done');
            engine.sfx('yay');
            const sl = st.current.slept;
            window.setTimeout(() => onWin(sl < 3 ? 3 : sl < 10 ? 2 : 1), 700);
          }}
        />
      )}
      {lost && (
        <Retry
          text="O espírito desfaleceu. Ore enquanto os pensamentos sombrios se aproximam e acorde os discípulos entre uma oração e outra."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
            setMsg(null);
          }}
        />
      )}
    </>
  );
}

// ================================================================ 11. The empty tomb (run)

export function EmptyTomb({ paused, onWin, diff = 1 }: GameProps) {
  const GOAL = 100;
  const [lost, setLost] = useState(false);
  const [, setH] = useState(0);
  const st = useRef(fresh());
  function fresh() {
    return { y: 0, vy: 0, duck: false, dist: 0, lives: byDiff(diff, [4, 3, 2]), inv: 0, obs: [] as { x: number; kind: 'pedra' | 'toldo' | 'guarda' }[], next: 1, won: false, parts: [] as Part[], dawn: 0 };
  }
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost && !s.won;
    const speed = byDiff(diff, [70, 88, 104]);
    const ground = 150;
    const mx = w * 0.22;
    if (live) {
      s.dist += dt * byDiff(diff, [2.4, 2.2, 2]);
      s.dawn = Math.min(1, s.dist / GOAL);
      s.vy += 420 * dt;
      s.y = Math.min(0, s.y + s.vy * dt);
      if (s.y === 0) s.vy = 0;
      s.inv = Math.max(0, s.inv - dt);
      s.next -= dt;
      if (s.next <= 0 && s.dist < GOAL - 5) {
        const r = Math.random();
        s.obs.push({ x: w + 20, kind: r < 0.45 ? 'pedra' : r < 0.75 ? 'toldo' : 'guarda' });
        s.next = byDiff(diff, [1.5, 1.2, 0.95]) + Math.random() * 0.6;
      }
      for (const o of s.obs) o.x -= (o.kind === 'guarda' ? speed * 1.25 : speed) * dt;
      s.obs = s.obs.filter((o) => o.x > -30);
      for (const o of s.obs) {
        if (Math.abs(o.x - mx) > 9 || s.inv > 0) continue;
        const hit = o.kind === 'pedra' ? s.y > -10 : o.kind === 'toldo' ? !s.duck : s.y > -14;
        if (hit) {
          s.lives -= 1;
          s.inv = 1.2;
          engine.sfx('hurt');
          buzz([50, 30, 50]);
          if (s.lives <= 0) setLost(true);
        }
      }
      if (s.dist >= GOAL && !s.won) {
        s.won = true;
        engine.sfx('yay');
        window.setTimeout(() => onWin(starsOf(s.lives / byDiff(diff, [4, 3, 2]))), 900);
      }
      if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) setH((h) => h + 1);
    }
    // Jerusalem at dawn: the sky lights up as she runs.
    const d = s.dawn;
    SC.sky(ctx, w, d < 0.5 ? ['#2a2a4a', '#4a3a5a', '#7a5a6a', '#b07a6a'] : ['#e8a070', '#f0b880', '#f4cc98', '#f8e0b8'], ground);
    ctx.fillStyle = '#ffe8a0';
    ctx.beginPath();
    ctx.arc(w * 0.75, 100 - d * 60, 10, 0, Math.PI * 2);
    ctx.fill();
    // Houses of Jerusalem sliding past.
    const span = w + 90;
    for (let k = 0; k < 6; k++) {
      const x = ((((k * 70 - s.dist * 12) % span) + span) % span) - 45;
      const hgt = 50 + ((k * 23) % 30);
      rect(ctx, x - 1, ground - hgt - 1, 42, hgt + 1, '#2a1a10');
      rect(ctx, x, ground - hgt, 40, hgt, d < 0.5 ? '#5a4a52' : '#d8bc88');
      rect(ctx, x, ground - hgt, 40, 2, d < 0.5 ? '#6a5a62' : '#ecd4a4');
      rect(ctx, x + 8, ground - hgt + 14, 7, 9, '#2a2020');
      rect(ctx, x + 24, ground - 18, 9, 18, '#3a2414');
    }
    rect(ctx, 0, ground, w, 30, '#a88a6a');
    for (let x = 0; x < w; x += 12) rect(ctx, (x - s.dist * 30) % w + (x < 0 ? w : 0), ground + 6, 8, 2, '#8a6a4a');
    for (const o of s.obs) {
      if (o.kind === 'pedra') SC.blob(ctx, o.x, ground - 5, 7, 5, '#9a9080');
      else if (o.kind === 'toldo') {
        rect(ctx, o.x - 12, ground - 36, 2, 36, '#5a3a1e');
        rect(ctx, o.x + 10, ground - 36, 2, 36, '#5a3a1e');
        rect(ctx, o.x - 14, ground - 38, 28, 16, '#b83a2a');
        for (let k = 0; k < 4; k++) rect(ctx, o.x - 14 + k * 7, ground - 38, 3, 16, '#e8d8b0');
      } else drawPerson(ctx, JLOOKS.soldado, o.x, ground, 'left', Math.floor(t * 8) % 4);
    }
    if (!(s.inv > 0 && Math.floor(t * 16) % 2)) {
      if (s.duck && s.y === 0) {
        ctx.save();
        ctx.translate(mx, ground);
        ctx.scale(1, 0.6);
        drawPerson(ctx, JLOOKS.madalena, 0, 0, 'right', 1, true);
        ctx.restore();
      } else drawPerson(ctx, JLOOKS.madalena, mx, ground + s.y, 'right', s.y < 0 ? 1 : Math.floor(t * 10) % 4, true);
    }
    if (s.dist >= GOAL - 6) drawPerson(ctx, JLOOKS.pedro, w * 0.86, ground, 'left', 0);
  });
  const jump = () => {
    const s = st.current;
    if (paused || lost || s.y < 0) return;
    s.vy = -175;
    engine.sfx('jump');
  };
  useKeys(
    (k) => {
      if (k === ' ' || k === 'arrowup' || k === 'w') jump();
      if (k === 'arrowdown' || k === 's') st.current.duck = true;
    },
    (k) => (k === 'arrowdown' || k === 's') && (st.current.duck = false),
  );
  const s = st.current;
  return (
    <>
      <Stage cv={cv} />
      {!paused && !lost && (
        <>
          <div className="pointer-events-none absolute left-14 right-2 top-2 flex flex-wrap gap-2">
            <Panel className="flex items-center gap-2 text-base">
              Até os discípulos
              <span className="h-3 w-24 border-2 border-[#3a2414] bg-[#4a4250]">
                <span className="block h-full bg-[#ffe066]" style={{ width: `${Math.min(100, s.dist)}%` }} />
              </span>
            </Panel>
            <Panel className="text-base text-[#ff8a8a]">{'♥'.repeat(Math.max(0, s.lives))}</Panel>
          </div>
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              st.current.duck = true;
            }}
            onPointerUp={() => (st.current.duck = false)}
            onPointerCancel={() => (st.current.duck = false)}
            className="rpg-wood rpg-text absolute bottom-4 left-[max(1rem,env(safe-area-inset-left))] h-20 w-28 touch-none text-lg"
          >
            Abaixar ▼
          </button>
          <button
            onPointerDown={(e) => (e.preventDefault(), jump())}
            className="rpg-text absolute bottom-5 right-[max(1.25rem,env(safe-area-inset-right))] grid h-24 w-24 touch-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#c8321f] text-xl shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Pular
          </button>
          <span className="rpg-text pointer-events-none absolute bottom-28 right-6 text-xs opacity-90">pedra: pule · toldo: abaixe · guarda: pule</span>
        </>
      )}
      {lost && (
        <Retry
          text="Os guardas te atrasaram! Pule pedras e guardas, abaixe sob os toldos."
          onRetry={() => {
            st.current = fresh();
            setLost(false);
          }}
        />
      )}
    </>
  );
}
