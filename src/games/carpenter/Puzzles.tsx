/**
 * Mini-games of the workshop: sharpening tools on the grindstone and José's
 * three puzzles (measure-and-cut, joinery and the nail memory board).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Portrait } from '../pixel/Dialog';
import { icon, iconURL } from '../pixel/icons';
import { LOOK } from './world';

function Frame({ title, onClose, children, side }: { title: string; onClose?: () => void; children: ReactNode; side?: ReactNode }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/55 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]">
      <div className="rpg-frame rpg-text flex max-h-full w-full max-w-3xl flex-col overflow-hidden p-2">
        <div className="mb-1 flex items-center gap-2">
          <p className="text-xl text-[#ffe08a]">{title}</p>
          <span className="ml-auto">{side}</span>
          {onClose && (
            <button onClick={onClose} aria-label="Fechar" className="rpg-wood grid h-9 w-9 place-items-center">
              <X size={16} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

/** José's face and line on the left of a puzzle. */
function Jose({ text, mood = 'neutral' }: { text: string; mood?: 'neutral' | 'happy' | 'sad' | 'stern' }) {
  return (
    <div className="flex w-36 shrink-0 flex-col items-center gap-1 text-center text-sm leading-snug sm:w-44">
      <Portrait look={LOOK.jose} mood={mood} bg="#c8a070" className="h-20 w-20" />
      <span key={text} className="animate-pop">
        {text}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------- grindstone

export type Tool = 'axe' | 'pick';

export function Sharpen({ sharp, onSharpen, onClose }: { sharp: Record<Tool, number>; onSharpen: (tool: Tool, value: number) => void; onClose: () => void }) {
  const [tool, setTool] = useState<Tool>(sharp.axe <= sharp.pick ? 'axe' : 'pick');
  const [value, setValue] = useState(sharp[tool]);
  const [combo, setCombo] = useState(0);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [want, setWant] = useState<-1 | 1>(-1);
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ t0: performance.now(), want: -1 as -1 | 1, sparks: [] as { x: number; y: number; vx: number; vy: number; life: number }[], last: performance.now(), value, tool, combo: 0 });
  st.current.value = value;
  st.current.tool = tool;

  const speed = 1.1 + Math.min(0.9, combo * 0.08);
  const pendulum = () => Math.sin(((performance.now() - st.current.t0) / 1000) * Math.PI * speed);

  useEffect(() => {
    setValue(sharp[tool]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  useEffect(() => {
    const c = cv.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const s = st.current;
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#e6cb8e';
      ctx.fillRect(0, 0, 160, 90);
      ctx.fillStyle = '#d0b276';
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 37) % 160, 60 + ((i * 13) % 30), 2, 1);
      // Frame and wheel.
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(44, 58, 72, 8);
      ctx.fillRect(48, 64, 6, 22);
      ctx.fillRect(106, 64, 6, 22);
      ctx.fillStyle = '#9a6234';
      ctx.fillRect(45, 59, 70, 5);
      const ang = now / 120;
      for (let y = -24; y <= 24; y++)
        for (let x = -24; x <= 24; x++) {
          const d = Math.hypot(x, y);
          if (d > 24) continue;
          const a = Math.atan2(y, x) + ang;
          const col = d > 22.5 ? '#3a2414' : d < 4 ? '#3a2414' : d < 6 ? '#6a4220' : Math.floor((a / Math.PI) * 6 + 12) % 2 ? '#a8a0a0' : '#8e8686';
          ctx.fillStyle = col;
          ctx.fillRect(80 + x, 34 + y, 1, 1);
        }
      // Water trough.
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(58, 54, 44, 6);
      ctx.fillStyle = '#5e9ccc';
      ctx.fillRect(59, 55, 42, 3);
      // The blade sliding left and right on top of the wheel.
      const p = Math.sin(((now - s.t0) / 1000) * Math.PI * (1.1 + Math.min(0.9, s.combo * 0.08)));
      const bx = 80 + p * 30;
      const zoneL = 80 - 30 * 0.72;
      const zoneR = 80 + 30 * 0.72;
      // The side to stroke next glows; the other one is dim.
      const glow = 0.55 + Math.sin(now / 90) * 0.35;
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(47, 1, zoneL - 46, 8);
      ctx.fillRect(zoneR - 1, 1, 114 - zoneR, 8);
      ctx.fillStyle = s.want < 0 ? `rgba(255,210,58,${glow})` : 'rgba(106,170,58,0.35)';
      ctx.fillRect(48, 2, zoneL - 48, 6);
      ctx.fillStyle = s.want > 0 ? `rgba(255,210,58,${glow})` : 'rgba(106,170,58,0.35)';
      ctx.fillRect(zoneR, 2, 112 - zoneR, 6);
      ctx.save();
      ctx.translate(Math.round(bx), 10);
      ctx.drawImage(icon(s.tool), -9, -2, 18, 18);
      ctx.restore();
      for (const k of s.sparks) {
        k.x += k.vx * dt;
        k.y += k.vy * dt;
        k.vy += 160 * dt;
        k.life -= dt;
        ctx.fillStyle = k.life > 0.25 ? '#ffe066' : '#ff8a3a';
        ctx.fillRect(Math.round(k.x), Math.round(k.y), 1, 1);
      }
      s.sparks = s.sparks.filter((k) => k.life > 0);
      // Sharpness meter.
      ctx.fillStyle = '#3a2414';
      ctx.fillRect(4, 80, 36, 7);
      ctx.fillStyle = s.value > 60 ? '#6aaa3a' : s.value > 30 ? '#e0a020' : '#d8402a';
      ctx.fillRect(5, 81, Math.round((34 * s.value) / 100), 5);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stroke = (side: -1 | 1) => {
    const s = st.current;
    if (s.value >= 100) return;
    const p = pendulum();
    const ok = side === s.want && side * p > 0.72;
    if (ok) {
      const v = Math.min(100, s.value + 9 + Math.min(6, combo));
      setValue(v);
      onSharpen(s.tool, v);
      s.combo = combo + 1;
      setCombo((c) => c + 1);
      s.want = (side === -1 ? 1 : -1) as -1 | 1;
      setWant(s.want);
      engine.drum('hat', 0, 0.9);
      engine.playNote(96 + Math.min(12, combo), 'bell', 0, 0.06);
      for (let i = 0; i < 14; i++) s.sparks.push({ x: 80 + side * 18, y: 14, vx: -side * (20 + Math.random() * 60), vy: -30 - Math.random() * 50, life: 0.6 });
      setMsg(v >= 100 ? { text: 'Afiadíssimo!', ok: true } : { text: ['Isso!', 'Bom golpe!', 'Faísca bonita!'][combo % 3], ok: true });
      if (v >= 100) engine.sfx('yay');
    } else {
      s.combo = 0;
      setCombo(0);
      engine.sfx('bonk');
      setMsg({ text: side !== s.want ? 'Do outro lado, filho!' : 'Cedo demais... espere chegar no verde.', ok: false });
    }
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') stroke(-1);
      if (e.key === 'ArrowRight' || e.key === 'd') stroke(1);
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  });

  return (
    <Frame
      title="Pedra de amolar"
      onClose={onClose}
      side={
        <span className="flex gap-1">
          {(['axe', 'pick'] as Tool[]).map((t) => (
            <button key={t} onClick={() => setTool(t)} className={cx('rpg-wood flex items-center gap-1 px-2 py-1 text-sm', tool === t && 'outline outline-2 outline-[#ffe08a]')}>
              <img src={iconURL(t)} alt="" className="pixelated h-5 w-5" />
              {t === 'axe' ? 'Machado' : 'Picareta'} {Math.round(t === tool ? value : sharp[t])}%
            </button>
          ))}
        </span>
      }
    >
      <div className="flex min-h-0 flex-1 items-center gap-3">
        <Jose
          text={msg?.text ?? 'Passe a lâmina de um lado pro outro: aperte a seta que pisca quando a lâmina chegar no lado amarelo!'}
          mood={msg ? (msg.ok ? 'happy' : 'sad') : 'neutral'}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <canvas ref={cv} width={160} height={90} className="pixelated aspect-[16/9] max-h-[45vh] w-full border-[3px] border-[#3a2414]" />
          <div className="flex items-center gap-2">
            <button onPointerDown={(e) => (e.preventDefault(), stroke(-1))} className={cx('rpg-wood h-14 flex-1 text-3xl active:translate-y-0.5', want < 0 && value < 100 && 'animate-blink text-[#ffe08a]')} aria-label="Passar para a esquerda">
              ◀
            </button>
            <span className="w-16 text-center text-sm">combo {combo}</span>
            <button onPointerDown={(e) => (e.preventDefault(), stroke(1))} className={cx('rpg-wood h-14 flex-1 text-3xl active:translate-y-0.5', want > 0 && value < 100 && 'animate-blink text-[#ffe08a]')} aria-label="Passar para a direita">
              ▶
            </button>
          </div>
        </div>
      </div>
    </Frame>
  );
}

// ---------------------------------------------------------------- José's puzzles

export type PuzzleKind = 'cut' | 'joint' | 'nails';
export const PUZZLES: { kind: PuzzleKind; name: string; intro: string }[] = [
  { kind: 'cut', name: 'Corte certo', intro: 'Preciso destas peças tiradas de uma tábua só. Marque onde serrar. Meça duas vezes, corte uma!' },
  { kind: 'joint', name: 'Encaixe', intro: 'As vigas dessa armação estão viradas. Gire as peças até tudo encaixar, sem ponta solta.' },
  { kind: 'nails', name: 'Pregos de memória', intro: 'Vou bater os pregos numa ordem. Olhe bem e repita igualzinho.' },
];

export function JosePuzzle({ kind, level, onWin, onClose }: { kind: PuzzleKind; level: number; onWin: () => void; onClose: () => void }) {
  const p = PUZZLES.find((x) => x.kind === kind)!;
  const [won, setWon] = useState(false);
  const win = () => {
    setWon(true);
    engine.sfx('yay');
    window.setTimeout(onWin, 1600);
  };
  return (
    <Frame title={`Desafio do José: ${p.name}`} onClose={won ? undefined : onClose}>
      {kind === 'cut' && <Cut level={level} intro={p.intro} won={won} onWin={win} />}
      {kind === 'joint' && <Joint level={level} intro={p.intro} won={won} onWin={win} />}
      {kind === 'nails' && <Nails level={level} intro={p.intro} won={won} onWin={win} />}
    </Frame>
  );
}

// ---- 1. Measure and cut

function Cut({ level, intro, won, onWin }: { level: number; intro: string; won: boolean; onWin: () => void }) {
  const { len, need } = useMemo(() => {
    const len = 8 + 2 * Math.min(level, 3);
    const k = 2 + Math.min(level, 2);
    const cuts = new Set<number>();
    while (cuts.size < k - 1) cuts.add(1 + Math.floor(Math.random() * (len - 1)));
    const c = [0, ...[...cuts].sort((a, b) => a - b), len];
    const parts = c.slice(1).map((v, i) => v - c[i]);
    return { len, need: parts.sort(() => Math.random() - 0.5) };
  }, [level]);
  const [cuts, setCuts] = useState<number[]>([]);
  const [msg, setMsg] = useState(intro);
  const [mood, setMood] = useState<'neutral' | 'happy' | 'sad'>('neutral');

  const bounds = [0, ...[...cuts].sort((a, b) => a - b), len];
  const pieces = bounds.slice(1).map((v, i) => v - bounds[i]);
  const left = [...need];
  const matched = pieces.map((pc) => {
    const i = left.indexOf(pc);
    if (i >= 0) left.splice(i, 1);
    return i >= 0;
  });

  const toggle = (at: number) => {
    if (won) return;
    engine.playNote(72 + at, 'pluck', 0, 0.15);
    setCuts((c) => (c.includes(at) ? c.filter((x) => x !== at) : c.length >= need.length - 1 ? c : [...c, at]));
  };
  const saw = () => {
    if (left.length === 0 && pieces.length === need.length) {
      setMsg('Na medida! Nenhuma lasca perdida. Esse é meu filho!');
      setMood('happy');
      engine.drum('snare', 0, 0.7);
      onWin();
    } else {
      setMsg(cuts.length < need.length - 1 ? `Faltam marcas: são ${need.length} peças, então ${need.length - 1} cortes.` : 'Hmm... esses pedaços não batem com a lista. Mede de novo!');
      setMood('sad');
      engine.sfx('bonk');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 items-center gap-3">
      <Jose text={msg} mood={mood} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="flex flex-wrap items-center gap-1 text-base">
          Peças pedidas:
          {need.map((n, i) => (
            <span key={i} className="rpg-wood px-2 py-0.5">
              {n} palmos
            </span>
          ))}
        </p>
        <div className="relative flex h-14 border-[3px] border-[#3a2414] bg-[#c08a4a]">
          {Array.from({ length: len }, (_, i) => (
            <span key={i} className="relative flex-1 border-r border-[#9a6234] last:border-r-0">
              <span className="absolute left-1 top-0.5 text-[10px] text-[#6a4220]">{i + 1}</span>
            </span>
          ))}
          {Array.from({ length: len - 1 }, (_, i) => i + 1).map((at) => (
            <button
              key={at}
              onClick={() => toggle(at)}
              aria-label={`Marcar corte em ${at} palmos`}
              className="absolute inset-y-[-6px] w-7 -translate-x-1/2"
              style={{ left: `${(at / len) * 100}%` }}
            >
              <span className={cx('mx-auto block h-full w-1', cuts.includes(at) ? 'bg-[#d8402a] shadow-[0_0_0_1px_#3a2414]' : 'bg-[#3a2414]/15')} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          Seus pedaços:
          {pieces.map((pc, i) => (
            <span key={i} className={cx('px-1.5', matched[i] ? 'text-[#b8f07a]' : 'text-[#ffb08a]')}>
              {pc}
              {matched[i] ? '✓' : ''}
            </span>
          ))}
        </div>
        <button onClick={saw} disabled={won} className="rpg-wood h-12 text-xl active:translate-y-0.5">
          Serrar!
        </button>
      </div>
    </div>
  );
}

// ---- 2. Joinery: rotate beams until the frame has no loose ends.

const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;
const rot = (m: number, r: number) => {
  let x = m;
  for (let i = 0; i < r; i++) x = ((x << 1) | (x >> 3)) & 15;
  return x;
};

function Joint({ level, intro, won, onWin }: { level: number; intro: string; won: boolean; onWin: () => void }) {
  const n = level >= 2 ? 4 : 3;
  const base = useMemo(() => {
    const mask = Array(n * n).fill(0);
    const seen = new Set([0]);
    const stack = [0];
    while (stack.length) {
      const c = stack[stack.length - 1];
      const x = c % n;
      const y = Math.floor(c / n);
      const opts = DIRS.map(([dx, dy], d) => ({ d, nx: x + dx, ny: y + dy })).filter(({ nx, ny }) => nx >= 0 && ny >= 0 && nx < n && ny < n && !seen.has(ny * n + nx));
      if (!opts.length) {
        stack.pop();
        continue;
      }
      const o = opts[Math.floor(Math.random() * opts.length)];
      const k = o.ny * n + o.nx;
      mask[c] |= 1 << o.d;
      mask[k] |= 1 << ((o.d + 2) % 4);
      seen.add(k);
      stack.push(k);
    }
    return mask;
  }, [n]);
  const [turns, setTurns] = useState<number[]>(() => base.map((m) => (m === 5 || m === 10 ? 1 : 1 + Math.floor(Math.random() * 3))));
  const [moves, setMoves] = useState(0);
  const cur = base.map((m, i) => rot(m, turns[i]));
  const linked = (i: number, d: number) => {
    const x = (i % n) + DIRS[d][0];
    const y = Math.floor(i / n) + DIRS[d][1];
    if (x < 0 || y < 0 || x >= n || y >= n) return false;
    return !!(cur[y * n + x] & (1 << ((d + 2) % 4)));
  };
  const loose = cur.reduce((acc, m, i) => acc + [0, 1, 2, 3].filter((d) => m & (1 << d) && !linked(i, d)).length, 0);

  useEffect(() => {
    if (loose === 0 && moves > 0 && !won) onWin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loose]);

  const turn = (i: number) => {
    if (won) return;
    engine.drum('tom', 0, 0.5);
    setTurns((t) => t.map((v, k) => (k === i ? (v + 1) % 4 : v)));
    setMoves((m) => m + 1);
  };

  return (
    <div className="flex min-h-0 flex-1 items-center gap-3">
      <Jose text={won ? 'Firme como casa na rocha! Belo encaixe.' : loose ? `${intro} (pontas soltas: ${loose})` : intro} mood={won ? 'happy' : 'neutral'} />
      <div className="mx-auto grid aspect-square h-[min(62vh,17rem)] gap-0.5 border-[3px] border-[#3a2414] bg-[#3a2414]" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {cur.map((m, i) => (
          <button key={i} onClick={() => turn(i)} aria-label="Girar peça" className={cx('relative bg-[#e6cb8e] transition', won && 'bg-[#f2e0a0]')}>
            <svg viewBox="0 0 10 10" className="absolute inset-0 h-full w-full" shapeRendering="crispEdges" aria-hidden>
              {[0, 1, 2, 3].map((d) =>
                m & (1 << d) ? (
                  <rect
                    key={d}
                    x={d === 3 ? 0 : d === 1 ? 5 : 3.5}
                    y={d === 0 ? 0 : d === 2 ? 5 : 3.5}
                    width={d % 2 ? 5 : 3}
                    height={d % 2 ? 3 : 5}
                    fill={linked(i, d) ? '#c08a4a' : '#9a6234'}
                    stroke="#3a2414"
                    strokeWidth="0.5"
                  />
                ) : null,
              )}
              <rect x="3.5" y="3.5" width="3" height="3" fill="#6a4220" stroke="#3a2414" strokeWidth="0.5" />
              <rect x="4.6" y="4.6" width="0.8" height="0.8" fill="#ffd23a" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- 3. Nail memory: José hammers a sequence, Jesus repeats it.

const NOTE = [60, 62, 64, 65, 67, 69, 71, 72, 74];

function Nails({ level, intro, won, onWin }: { level: number; intro: string; won: boolean; onWin: () => void }) {
  const rounds = 2;
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [showing, setShowing] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [busy, setBusy] = useState(true);
  const [msg, setMsg] = useState(intro);
  const [nailed, setNailed] = useState<number[]>([]);
  const timers = useRef<number[]>([]);

  const play = (s: number[]) => {
    setBusy(true);
    setInput([]);
    setNailed([]);
    timers.current.forEach(clearTimeout);
    timers.current = [];
    s.forEach((h, k) => {
      timers.current.push(
        window.setTimeout(() => {
          setShowing(h);
          engine.drum('snare', 0, 0.5);
          engine.playNote(NOTE[h], 'bell', 0, 0.2);
        }, 900 + k * 650),
        window.setTimeout(() => setShowing(null), 900 + k * 650 + 380),
      );
    });
    timers.current.push(window.setTimeout(() => setBusy(false), 900 + s.length * 650));
  };

  useEffect(() => {
    const len = 3 + Math.min(level, 3) + round;
    const s = Array.from({ length: len }, () => Math.floor(Math.random() * 9));
    setSeq(s);
    play(s);
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const tap = (h: number) => {
    if (busy || won) return;
    engine.playNote(NOTE[h], 'bell', 0, 0.2);
    engine.drum('snare', 0, 0.4);
    const next = [...input, h];
    if (seq[next.length - 1] !== h) {
      engine.sfx('bonk');
      setMsg('Opa, prego no lugar errado! Vou mostrar de novo, devagar.');
      play(seq);
      return;
    }
    setInput(next);
    setNailed((x) => [...x, h]);
    if (next.length === seq.length) {
      if (round + 1 >= rounds) {
        setMsg('Memória de carpinteiro! Nenhum prego torto.');
        onWin();
      } else {
        setMsg('Muito bem! Agora uma sequência maior.');
        setBusy(true);
        window.setTimeout(() => setRound((r) => r + 1), 700);
      }
    }
  };

  return (
    <div className="flex min-h-0 flex-1 items-center gap-3">
      <Jose text={busy && !won ? `${msg} Olhe bem...` : msg} mood={won ? 'happy' : 'neutral'} />
      <div className="flex flex-1 flex-col items-center gap-1">
        <p className="text-sm">
          Rodada {round + 1}/{rounds} · {input.length}/{seq.length} pregos
        </p>
        <div className="grid aspect-square h-[min(58vh,16rem)] grid-cols-3 gap-1 border-[3px] border-[#3a2414] bg-[#9a6234] p-1.5">
          {Array.from({ length: 9 }, (_, h) => (
            <button
              key={h}
              onClick={() => tap(h)}
              aria-label={`Furo ${h + 1}`}
              className={cx(
                'grid place-items-center border-2 border-[#6a4220] bg-[#c08a4a] transition',
                showing === h && 'scale-95 bg-[#ffe08a]',
                !busy && !won && 'active:bg-[#ffe08a]',
              )}
            >
              <span className={cx('block h-3 w-3 rounded-full border-2 border-[#3a2414]', nailed.includes(h) || showing === h ? 'bg-[#d4d4de]' : 'bg-[#3a2414]')} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
