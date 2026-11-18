/**
 * Esther, chapters 6-10: the maids' tasks over three days (scheduling), the
 * vigil lamps (patterns), the walk to the throne (timing), the answer to the
 * king (conversation), the banquet table (logic placement), the chronicles
 * (document search), Esther's petition (ordering, with false phrases), who did
 * what (matching), the king's couriers (route planning against a deadline)
 * and the Purim feast (spot the differences).
 */
import { useEffect, useRef, useState } from 'react';
import { cx } from '../../ui/kit';
import { engine } from '../../audio/engine';
import { byDiff, Retry, useStage, type GameProps } from '../pixel/stage';
import { Portrait } from '../pixel/Dialog';
import { drawBackdrop } from '../platform/sky';
import { drawChar, type CastId } from '../platform/rig';
import { drawTorches, useEstherScene } from './scene';
import { ELOOKS, ESPEAK } from './content';
import { bad, Box, dev, Head, makeConversation, ok, Placement, placementClues, rnd, shuffle, tick, toLogical, win, type Clue } from './kit';

// ------------------------------------------------------------------ 6A. tasks of the three days

const TASKS = [
  { name: 'Avisar Mordecai', icon: '✉️' },
  { name: 'Reunir as servas', icon: '👭' },
  { name: 'Orar juntas', icon: '🙏' },
  { name: 'Vigiar à noite', icon: '🪔' },
  { name: 'Ensaiar o pedido', icon: '🗣️' },
  { name: 'Vestes reais', icon: '👗' },
];

export function FastTasks({ paused, onWin, diff = 1 }: GameProps) {
  const cvs = useEstherScene('susa', 'night', [
    { id: 'esterRainha', x: 0.12, anim: 'think', who: 'rainha' },
    { id: 'serva', x: 0.88, left: true, who: 'serva' },
  ]);
  const [clues] = useState(() => {
    const day = (s: number) => s % 3;
    const N = TASKS.map((t) => t.name);
    for (;;) {
      // Hidden plan: two tasks per day; Mordecai on day 1, the royal garments on day 3 (Esther 5:1).
      const slots = shuffle([0, 1, 2, 3, 4, 5]);
      const ans = TASKS.map((_, i) => slots[i]);
      if (day(ans[0]) !== 0 || day(ans[5]) !== 2) continue;
      if (day(ans[1]) > day(ans[2])) continue; // gather the maids before praying together
      const forced: Clue[] = [
        { text: 'Mordecai precisa ser avisado no 1º dia.', test: (p) => day(p[0]) === 0 },
        { text: 'As vestes reais ficam para o 3º dia (Ester 5:1).', test: (p) => day(p[5]) === 2 },
        { text: 'Reunir as servas vem antes de orarem juntas (ou no mesmo dia).', test: (p) => day(p[1]) <= day(p[2]) },
      ];
      const pool: Clue[] = [];
      for (let a = 0; a < 6; a++)
        for (let b = 0; b < 6; b++) {
          if (a === b) continue;
          if (day(ans[a]) < day(ans[b])) pool.push({ text: `${N[a]} vem num dia antes de ${N[b]}.`, test: (p) => day(p[a]) < day(p[b]) });
          if (a < b && day(ans[a]) === day(ans[b])) pool.push({ text: `${N[a]} e ${N[b]} são no mesmo dia.`, test: (p) => day(p[a]) === day(p[b]) });
          if (a < b && day(ans[a]) !== day(ans[b])) pool.push({ text: `${N[a]} e ${N[b]} são em dias diferentes.`, test: (p) => day(p[a]) !== day(p[b]) });
        }
      // Two slots per day: only the day matters, so compare by days.
      const all: number[][] = [];
      const walk = (cur: number[], used: boolean[]) => {
        if (cur.length === 6) return void all.push([...cur]);
        for (let s = 0; s < 6; s++)
          if (!used[s]) {
            used[s] = true;
            cur.push(s);
            walk(cur, used);
            cur.pop();
            used[s] = false;
          }
      };
      walk([], []);
      const key = (p: number[]) => p.map(day).join('');
      const chosen = [...forced];
      let alive = new Set(all.filter((p) => chosen.every((c) => c.test(p))).map(key));
      for (const c of shuffle(pool)) {
        if (alive.size <= 1) break;
        const next = new Set(all.filter((p) => chosen.every((q) => q.test(p)) && c.test(p)).map(key));
        if (next.size < alive.size) chosen.push(c), (alive = next);
      }
      if (alive.size === 1 && chosen.length <= byDiff(diff, [6, 7, 8])) return chosen;
    }
  });
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="Os três dias de jejum" right={diff === 2 ? 'Sem dicas ao vivo' : ''} />
          <Placement title="O que a rainha pediu:" items={TASKS} rows={2} cols={3} clues={clues} slotLabel={(s) => `Dia ${(s % 3) + 1}`} live={diff < 2} onSolved={(c) => onWin(c === 0 ? 3 : c <= 2 ? 2 : 1)} />
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 6B. the vigil lamps (patterns)

type Round = { seq: string[]; answer: string; opts: string[] };
const lamps = (n: number) => '🪔'.repeat(n);
const ROUNDS: (() => Round)[] = [
  () => {
    const [a, b] = shuffle(['☀', '☾', '★', '✿']);
    return { seq: [a, b, a, b, a, '?'], answer: b, opts: [a, b, '★', '✿'].filter((v, i, l) => l.indexOf(v) === i) };
  },
  () => {
    const [a, b, c] = shuffle(['☀', '☾', '★', '✿']);
    return { seq: [a, b, c, a, b, '?'], answer: c, opts: [a, b, c, '✦'] };
  },
  () => {
    const s = 1 + rnd(2);
    return { seq: [lamps(s), lamps(s + 1), lamps(s + 2), '?'], answer: lamps(s + 3), opts: [lamps(s + 3), lamps(s + 2), lamps(s + 4), lamps(s)] };
  },
  () => {
    const A = ['↑', '→', '↓', '←'];
    const k = rnd(4);
    return { seq: [0, 1, 2, 3, 4].map((i) => A[(k + i) % 4]).concat('?'), answer: A[(k + 5) % 4], opts: shuffle(A) };
  },
  () => ({ seq: ['1', '2', '4', '8', '?'], answer: '16', opts: ['10', '12', '16', '14'] }),
  () => {
    const d = 2 + rnd(3);
    const s = 1 + rnd(4);
    return { seq: [s, s + d, s + 2 * d, s + 3 * d].map(String).concat('?'), answer: String(s + 4 * d), opts: shuffle([s + 4 * d, s + 4 * d + 1, s + 3 * d + 1, s + 5 * d].map(String)) };
  },
  () => {
    const [a, b, c] = shuffle(['☀', '☾', '★', '✿']);
    return { seq: [a, b, c, '?', b, a], answer: c, opts: [a, b, c, '✦'] };
  },
  () => {
    const [a, b] = shuffle(['☀', '☾', '★', '✿']);
    return { seq: [a, a, b, a, a, b, a, '?'], answer: a, opts: [a, b, '✦', '✿'].filter((v, i, l) => l.indexOf(v) === i) };
  },
];

export function VigilLamps({ paused, onWin, diff = 1 }: GameProps) {
  const n = byDiff(diff, [3, 4, 5]);
  const cvs = useEstherScene('susa', 'night', [
    { id: 'serva', x: 0.1, anim: 'sad', who: 'serva' },
    { id: 'esterRainha', x: 0.9, left: true, anim: 'think', who: 'rainha' },
  ]);
  const [rounds] = useState(() => {
    const pick = diff === 0 ? [0, 2, 1, 4] : diff === 1 ? shuffle([0, 1, 2, 3, 4, 5]) : shuffle([1, 3, 5, 6, 7, 4]);
    return pick.slice(0, n).map((k) => {
      const r = ROUNDS[k]();
      return { ...r, opts: shuffle([...new Set(r.opts)]) };
    });
  });
  const [k, setK] = useState(0);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [lit, setLit] = useState(false);
  const r = rounds[k];
  const pick = (o: string) => {
    if (lit) return;
    if (o === r.answer) {
      ok();
      setLit(true);
      setMsg('A fileira se acendeu!');
      window.setTimeout(() => {
        setLit(false);
        setMsg(null);
        if (k + 1 < n) setK(k + 1);
        else {
          win();
          onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1);
        }
      }, 800);
    } else {
      bad();
      setMiss((m) => m + 1);
      setMsg('Não segue o padrão. Olhe a fileira inteira.');
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box narrow>
          <Head left={`Fileira ${k + 1}/${n}`} right={`Erros: ${miss}`} />
          <div className="flex min-h-0 flex-1 flex-wrap items-center justify-center gap-1.5">
            {r.seq.map((s, i) => (
              <span
                key={i}
                className={cx(
                  'grid h-12 min-w-12 place-items-center rounded-sm border-2 px-1 text-xl short:h-10 short:min-w-10 short:text-lg',
                  s === '?' ? (lit ? 'border-[#ffe08a] bg-[#5a3a1e] text-[#ffe08a]' : 'animate-pulse border-dashed border-[#ffe08a] bg-[#2a1a10] text-[#ffe08a]') : 'border-[#8a6a3a] bg-[#2a1a10] text-[#ffe8a0]',
                )}
              >
                {s === '?' ? (lit ? r.answer : '?') : s}
              </span>
            ))}
          </div>
          <div className="grid shrink-0 grid-cols-4 gap-1">
            {r.opts.map((o) => (
              <button key={o} className="rpg-wood h-11 text-lg short:h-10" onClick={() => pick(o)}>
                {o}
              </button>
            ))}
          </div>
          <span className="text-xs sm:text-sm">{msg ?? 'Qual peça completa o padrão?'}</span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 7A. the walk to the throne (timing)

export function ThroneWalk({ paused, onWin, diff = 1 }: GameProps) {
  const nG = byDiff(diff, [3, 4, 5]);
  const speed = byDiff(diff, [1.0, 1.25, 1.5]);
  const LEN = 120 + nG * 110 + 120;
  const [gates] = useState(() => Array.from({ length: nG }, (_, i) => ({ x: 150 + i * 110, period: 2.6 - rnd(3) * 0.3, phase: Math.random() * 6 })));
  const st = useRef({ x: 40, hits: 0, hold: false, bump: 0, end: -1, flash: 0 });
  const [hits, setHits] = useState(0);
  const [lost, setLost] = useState(false);
  const [, force] = useState(0);
  // Spears are crossed (closed) during part of each cycle; they lower before closing.
  const closedness = (g: (typeof gates)[number], t: number) => {
    const k = (((t * speed + g.phase) % g.period) + g.period) % g.period;
    const cyc = k / g.period;
    return cyc < 0.42 ? 0 : cyc < 0.52 ? (cyc - 0.42) / 0.1 : cyc < 0.86 ? 1 : 1 - (cyc - 0.86) / 0.14;
  };
  const cv = useStage((ctx, w, dt, t) => {
    const s = st.current;
    const live = !paused && !lost;
    if (live && s.end < 0) {
      // Development autopilot for the automated test: walk only when the next gate stays open.
      if (import.meta.env.DEV && (window as unknown as { __throneAuto?: boolean }).__throneAuto) {
        const g = gates.find((q) => q.x - s.x > -10);
        const dist = g ? g.x - s.x : 999;
        const need = (dist + 10) / 46 + 0.2;
        s.hold = dist > 13 || dist < -9 || [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7].filter((k) => k <= need).every((k) => closedness(g!, t + k) < 0.5);
      }
      if (s.bump > 0) {
        s.bump -= dt;
        s.x -= 60 * dt;
      } else if (s.hold) s.x += 46 * dt;
      for (const g of gates)
        if (Math.abs(s.x - g.x) < 9 && closedness(g, t) > 0.6 && s.bump <= 0) {
          s.hits++;
          s.bump = 0.5;
          s.flash = 0.3;
          engine.sfx('bonk');
          setHits(s.hits);
          if (s.hits >= 3) setLost(true);
        }
      if (s.x >= LEN - 90) {
        s.end = t;
        engine.playNote(74, 'bell', 0, 0.3);
        engine.playNote(79, 'bell', 0.3, 0.3);
        force((n) => n + 1);
      }
    }
    if (s.end >= 0 && t - s.end > 3.2 && s.end !== -2) {
      const h = s.hits;
      s.end = -2;
      win();
      onWin(h === 0 ? 3 : h === 1 ? 2 : 1);
    }
    const camX = Math.max(0, Math.min(LEN - w, s.x - w * 0.35));
    drawBackdrop(ctx, w, 180, 'susa', 'dawn', t, camX);
    drawTorches(ctx, w, t, [0.15, 0.6]);
    // Floor and the long carpet to the throne.
    ctx.fillStyle = '#c8b498';
    ctx.fillRect(0, 150, w, 30);
    ctx.fillStyle = '#8a1e3a';
    ctx.fillRect(0, 154, w, 8);
    ctx.fillStyle = '#e8b830';
    for (let x = -(camX % 12); x < w; x += 12) ctx.fillRect(x, 157, 4, 2);
    // Throne at the end.
    const TX = LEN - 50 - camX;
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(TX - 18, 104, 36, 48);
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(TX - 16, 100, 32, 6);
    ctx.fillRect(TX - 20, 126, 40, 4);
    const kingAnim = s.end >= 0 || s.end === -2 ? 'special' : 'idle';
    drawChar(ctx, 'assuero', kingAnim, Math.floor(t * 6) % 6, TX, 150, true);
    for (const g of gates) {
      const gx = g.x - camX;
      if (gx < -40 || gx > w + 40) continue;
      const c = closedness(g, t);
      drawChar(ctx, 'persa', 'idle', 0, gx - 16, 150, false);
      drawChar(ctx, 'persa', 'idle', 0, gx + 16, 150, true);
      // Spears from the two guards, crossing over the carpet.
      ctx.strokeStyle = '#6a4424';
      ctx.lineWidth = 2;
      for (const side of [-1, 1]) {
        const ax = gx + side * 10;
        const ex = ax + Math.cos(side < 0 ? -Math.PI / 2 + c * (Math.PI / 2 - 0.25) : -Math.PI / 2 - c * (Math.PI / 2 - 0.25)) * 26;
        const ey = 128 + Math.sin(side < 0 ? -Math.PI / 2 + c * (Math.PI / 2 - 0.25) : -Math.PI / 2 - c * (Math.PI / 2 - 0.25)) * 26;
        ctx.beginPath();
        ctx.moveTo(ax, 132);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.fillStyle = '#d8d8e0';
        ctx.fillRect(ex - 1, ey - 1, 3, 3);
      }
      if (c > 0.6) {
        ctx.fillStyle = 'rgba(255,60,40,0.18)';
        ctx.fillRect(gx - 9, 100, 18, 52);
      }
    }
    const anim = s.end >= 0 || s.end === -2 ? 'interact' : s.bump > 0 ? 'hurt' : s.hold ? 'walk' : 'idle';
    drawChar(ctx, 'esterRainha', anim, Math.floor(t * 9) % 6, s.x - camX, 150, false);
    // Heartbeat: faster when close to the guards.
    const near = Math.min(...gates.map((g) => Math.abs(g.x - s.x)));
    const bpm = 70 + Math.max(0, 60 - near) * 1.2;
    const beat = Math.max(0, Math.sin(t * (bpm / 60) * Math.PI * 2)) ** 8;
    ctx.fillStyle = `rgba(255,${120 - beat * 60},${120 - beat * 60},0.95)`;
    ctx.font = `${12 + beat * 4}px serif`;
    ctx.fillText('♥', w - 22 - beat * 2, 22 + beat * 2);
    if (s.flash > 0) {
      s.flash -= dt;
      ctx.fillStyle = `rgba(200,40,40,${s.flash})`;
      ctx.fillRect(0, 0, w, 180);
    }
  });
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') st.current.hold = e.type === 'keydown';
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', kd);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', kd);
    };
  }, []);
  const hold = (v: boolean) => () => {
    st.current.hold = v;
  };
  return (
    <>
      <canvas ref={cv} className="pixelated absolute inset-0 h-full w-full" aria-label="O pátio interior" />
      {!paused && !lost && st.current.end === -1 && (
        <>
          <div className="rpg-frame rpg-text pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] top-2 px-2 py-1 text-xs sm:text-sm">
            Coragem: {'♥'.repeat(3 - hits)}
            {'♡'.repeat(hits)} · Solte quando as lanças se cruzarem
          </div>
          <button
            onPointerDown={hold(true)}
            onPointerUp={hold(false)}
            onPointerLeave={hold(false)}
            onPointerCancel={hold(false)}
            className="rpg-text absolute bottom-4 right-[max(1.25rem,env(safe-area-inset-right))] grid h-20 w-20 touch-none select-none place-items-center rounded-full border-4 border-[#4a2c14] bg-[#6a2a7a] text-sm shadow-[3px_3px_0_#0006] active:scale-95"
          >
            Avançar
          </button>
        </>
      )}
      {lost && (
        <Retry
          look={ELOOKS.rainha}
          text="Ester recuou três vezes. Respire e observe: as lanças baixam devagar antes de se cruzar."
          onRetry={() => {
            st.current = { x: 40, hits: 0, hold: false, bump: 0, end: -1, flash: 0 };
            setHits(0);
            setLost(false);
          }}
        />
      )}
    </>
  );
}

// ------------------------------------------------------------------ 7B. the answer to the king

export const KingAnswer = makeConversation(
  'susa',
  'dawn',
  [
    { id: 'esterRainha', x: 0.25, who: 'rainha' },
    { id: 'assuero', x: 0.75, left: true, who: 'assuero', anim: 'special' },
  ],
  [
    {
      who: 'assuero',
      q: '“Que é que tens, rainha Ester? Qual é o teu pedido? Até metade do reino te será dada.”',
      opts: [
        { t: '“Se bem parecer ao rei, venha hoje o rei com Hamã ao banquete que lhe preparei.”', ok: true, reply: 'Ester agiu com paciência e sabedoria: preparou o momento certo (Ester 5:4).' },
        { t: '“Quero metade do reino, como prometeste.”', why: '“Metade do reino” era um modo de dizer generosidade. Ester não buscava riqueza: buscava salvar o seu povo.' },
        { t: '“Hamã é um traidor! Prende-o agora!”', why: 'Ester não acusou de imediato. Ela esperou o momento certo, no banquete.' },
      ],
    },
    {
      who: 'assuero',
      q: 'No banquete do vinho, o rei pergunta de novo: “Qual é a tua petição? E se te dará.”',
      opts: [
        { t: '“Venham o rei e Hamã amanhã a outro banquete, e então farei conforme o rei mandou.”', ok: true, reply: 'Mais um dia... e naquela noite o rei não conseguiria dormir (Ester 5:8; 6:1).' },
        { t: '“Esqueci o que ia pedir.”', why: 'Ester sabia muito bem o que pedir: ela estava preparando o momento.' },
        { t: '“Peço que Mordecai seja feito rei.”', why: 'Ester não pediu poder para ninguém: ela pediu pela vida do seu povo.' },
      ],
    },
  ],
);

// ------------------------------------------------------------------ 8A. the banquet table

const TABLE = [
  { name: 'Rei Assuero', icon: '👑' },
  { name: 'Hamã', icon: '🧔' },
  { name: 'Rainha Ester', icon: '👸' },
  { name: 'Vinho', icon: '🍷' },
  { name: 'Pão', icon: '🍞' },
  { name: 'Uvas', icon: '🍇' },
];

export function BanquetTable({ paused, onWin, diff = 1 }: GameProps) {
  const cvs = useEstherScene('garden', 'sunset', [
    { id: 'esterRainha', x: 0.1, who: 'rainha' },
    { id: 'serva', x: 0.9, left: true, who: 'serva' },
  ]);
  const n = byDiff(diff, [5, 6, 6]);
  const [clues] = useState(() => {
    const items = TABLE.slice(0, n);
    for (;;) {
      const slots = shuffle([0, 1, 2, 3, 4, 5]).slice(0, n);
      // Guests on the couches (back row), food on the table (front).
      if (slots.slice(0, 3).some((s) => s >= 3) || slots.slice(3).some((s) => s < 3)) continue;
      const forced: Clue[] = [
        { text: 'Os três convidados ficam nos divãs, no fundo.', test: (p) => p.slice(0, 3).every((s) => s < 3) },
        { text: 'A comida fica na mesa, na frente.', test: (p) => p.slice(3).every((s) => s >= 3) },
      ];
      const res = placementClues(
        items.map((i) => i.name),
        2,
        3,
        slots,
        forced,
        0,
        { col: ['à esquerda', 'no centro', 'à direita'] },
      );
      if (res.unique && res.clues.length <= byDiff(diff, [6, 7, 8])) return { items, list: res.clues };
    }
  });
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="A mesa do banquete" right={diff === 2 ? 'Sem dicas ao vivo' : ''} />
          <Placement
            title="Instruções da rainha:"
            items={clues.items}
            rows={2}
            cols={3}
            clues={clues.list}
            slotLabel={(s) => `${s < 3 ? 'Divã' : 'Mesa'} ${['esq.', 'centro', 'dir.'][s % 3]}`}
            live={diff < 2}
            onSolved={(c) => onWin(c === 0 ? 3 : c <= 2 ? 2 : 1)}
          />
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 8B. the chronicles of the king

const CAT = [
  { sym: '⚔', name: 'guarda e porteiros' },
  { sym: '🪙', name: 'tributos' },
  { sym: '🏛', name: 'corte e banquetes' },
  { sym: '📜', name: 'cartas e decretos' },
];
const ENTRY: string[][] = [
  ['Troca da guarda na porta do rei.', 'Um porteiro foi promovido a chefe da porta.', 'Novas lanças para a guarda do palácio.'],
  ['Chegaram tributos das ilhas do mar.', 'Contagem da prata do tesouro real.', 'Imposto das províncias do oeste.'],
  ['Banquete para os príncipes das províncias.', 'Visita dos sábios que conheciam os tempos.', 'Nova cortina azul e branca no salão.'],
  ['Carta enviada às 127 províncias.', 'Decreto sobre as estradas do reino.', 'Resposta ao governador de Sardes.'],
];

export function Chronicles({ paused, onWin, diff = 1 }: GameProps) {
  const cvs = useEstherScene('susa', 'night', [
    { id: 'assuero', x: 0.1, anim: 'think', who: 'assuero' },
    { id: 'hegai', x: 0.9, left: true, anim: 'read', who: 'escriba' },
  ]);
  const years = byDiff(diff, [[6, 7], [6, 7, 8], [5, 6, 7, 8]]);
  const months = byDiff(diff, [[9, 11, 12], [8, 10, 11, 12], [8, 9, 10, 11, 12]]);
  const [{ scrolls, target, clues }] = useState(() => {
    const tm = Math.random() < 0.5 ? 11 : 12;
    const scrolls: { y: number; m: number; c: number; text: string }[] = [];
    for (const y of years)
      for (const m of months) {
        const isT = y === 7 && m === tm;
        const c = isT ? 0 : y === 7 && m > 10 ? 1 + rnd(3) : rnd(4);
        scrolls.push({ y, m, c, text: isT ? 'Mordecai denunciou Bigtã e Teres, porteiros que queriam matar o rei. Os dois foram enforcados.' : ENTRY[c][rnd(3)] });
      }
    // Near misses: the guard seal also in other months of year 7 and in other years.
    for (const s of scrolls) if ((s.y !== 7 || s.m !== tm) && (s.m === tm || s.y === 7) && Math.random() < 0.5) (s.c = 0), (s.text = ENTRY[0][rnd(3)]);
    const target = scrolls.findIndex((s) => s.y === 7 && s.m === tm);
    const clues = [
      'Foi depois que Ester foi coroada, no 10º mês (Tebete) do 7º ano do rei (Ester 2:16-17).',
      tm === 11 ? 'Foi logo no mês seguinte à coroação.' : 'Foi no último mês do ano.',
      'O registro fala dos porteiros do rei (selo ⚔).',
    ];
    return { scrolls, target, clues };
  });
  dev('chron', { target });
  const [opened, setOpened] = useState<number[]>([]);
  const [read, setRead] = useState<number | null>(null);
  const [won, setWon] = useState(false);
  const open = (i: number) => {
    if (won) return;
    tick();
    setRead(i);
    if (!opened.includes(i)) setOpened((o) => [...o, i]);
    if (i === target) {
      setWon(true);
      win();
      const wrong = opened.filter((k) => k !== target).length;
      window.setTimeout(() => onWin(wrong === 0 ? 3 : wrong <= 2 ? 2 : 1), 1800);
    } else engine.playNote(55, 'pluck', 0, 0.2);
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="O livro das crônicas" right={`Rolos abertos: ${opened.length}`} />
          <ul className="shrink-0 text-xs leading-snug sm:text-sm">
            {clues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
          <div className="grid min-h-0 flex-1 gap-0.5 overflow-y-auto" style={{ gridTemplateColumns: `auto repeat(${months.length}, minmax(0,1fr))` }}>
            <span />
            {months.map((m) => (
              <span key={m} className="text-center text-[10px] text-[#ffe08a]">
                mês {m}
              </span>
            ))}
            {years.map((y) => (
              <div key={y} className="contents">
                <span className="self-center pr-1 text-[10px] text-[#ffe08a]">ano {y}</span>
                {months.map((m) => {
                  const i = scrolls.findIndex((s) => s.y === y && s.m === m);
                  const s = scrolls[i];
                  return (
                    <button
                      key={m}
                      onClick={() => open(i)}
                      className={cx('flex min-h-8 items-center justify-center gap-0.5 rounded-sm border-2 text-sm', opened.includes(i) ? (i === target ? 'border-[#2a8a3a] bg-[#d8f0c0]' : 'border-[#8a6a3a] bg-[#d8c8a0] opacity-70') : 'border-[#5b3a1e] bg-[#f4e4c0]')}
                      aria-label={`Rolo do ano ${y}, mês ${m}, selo ${CAT[s.c].name}`}
                    >
                      📜<span className="text-xs">{CAT[s.c].sym}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="min-h-8 shrink-0 rounded-sm bg-[#2a1a10] px-2 py-1 text-xs leading-snug text-[#f4e4c0] sm:text-sm">
            {read === null ? 'Toque num rolo para lê-lo. Abra o mínimo possível!' : `Ano ${scrolls[read].y}, mês ${scrolls[read].m}: ${scrolls[read].text}`}
          </p>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 9A. Esther's petition (ordering)

const PETITION = [
  'Se achei graça aos teus olhos, ó rei,',
  'e se bem parecer ao rei,',
  'dê-se-me a minha vida como minha petição, e o meu povo como meu requerimento.',
  'Porque fomos vendidos, eu e o meu povo, para destruição.',
  'Se fôssemos vendidos como servos e servas, eu me calaria.',
  'O adversário e inimigo é este mau Hamã!',
];
const FALSE_LINES = ['Exijo metade do reino, como prometeste!', 'Mordecai deve ser rei no teu lugar.', 'Eu nunca quis ser rainha.'];

export function Petition({ paused, onWin, diff = 1 }: GameProps) {
  const cvs = useEstherScene('susa', 'night', [
    { id: 'esterRainha', x: 0.18, anim: 'brave', who: 'rainha' },
    { id: 'assuero', x: 0.55, left: true, who: 'assuero' },
    { id: 'hama', x: 0.85, left: true, who: 'hama' },
  ]);
  const [{ answer, cards }] = useState(() => {
    const idx = byDiff(diff, [[0, 2, 3], [0, 2, 3, 5], [0, 1, 2, 3, 4, 5]]);
    const answer = idx.map((i) => PETITION[i]);
    const cards = shuffle([...answer, ...FALSE_LINES.slice(0, byDiff(diff, [1, 2, 3]))]);
    return { answer, cards };
  });
  dev('petition', { answer });
  const [seq, setSeq] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const check = () => {
    if (seq.length !== answer.length) return setMsg(`O pedido de Ester tem ${answer.length} partes.`);
    const right = seq.findIndex((s, i) => s !== answer[i]);
    if (right === -1) {
      setWon(true);
      win();
      setMsg('Ester falou com coragem e verdade.');
      window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 1200);
    } else {
      bad();
      setMiss((m) => m + 1);
      setMsg(FALSE_LINES.includes(seq[right]) ? `A parte ${right + 1} não foi dita por Ester.` : `As primeiras ${right} partes estão certas. A ${right + 1}ª não.`);
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="O pedido de Ester (Ester 7:3-6)" right={`Erros: ${miss}`} />
          <ol className="flex min-h-0 flex-col gap-0.5 overflow-y-auto">
            {answer.map((_, i) => (
              <li key={i}>
                <button
                  disabled={!seq[i] || won}
                  onClick={() => (setSeq(seq.filter((_, k) => k !== i)), tick())}
                  className={cx('w-full rounded-sm border-2 px-1.5 py-0.5 text-left text-xs leading-snug sm:text-sm', seq[i] ? 'border-[#5b3a1e] bg-[#f4e4c0] text-[#3a2414]' : 'border-dashed border-[#8a6a3a] text-[#8a6a3a]')}
                >
                  {i + 1}. {seq[i] ?? '...'}
                </button>
              </li>
            ))}
          </ol>
          <div className="flex min-h-0 flex-1 flex-wrap content-start gap-1 overflow-y-auto">
            {cards
              .filter((c) => !seq.includes(c))
              .map((c) => (
                <button key={c} disabled={won} onClick={() => (seq.length < answer.length ? (setSeq([...seq, c]), tick()) : setMsg('Todas as partes já estão preenchidas. Toque numa para tirar.'))} className="rpg-wood px-1.5 py-0.5 text-left text-xs leading-snug">
                  {c}
                </button>
              ))}
          </div>
          <span className="flex items-center gap-2">
            <span className="flex-1 text-xs leading-tight sm:text-sm">{msg ?? 'Toque nas frases na ordem. Toque numa parte montada para tirá-la.'}</span>
            <button disabled={won} className="rpg-wood px-3 py-1 text-sm" onClick={check}>
              Falar
            </button>
          </span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 9B. who did what (matching)

const DEEDS: [keyof typeof ESPEAK, string][] = [
  ['mordecai', 'Descobriu a conspiração contra o rei'],
  ['hama', 'Lançou o Pur para escolher o dia do ataque'],
  ['harbona', 'Lembrou ao rei a forca de cinquenta côvados'],
  ['assuero', 'Estendeu o cetro de ouro para Ester'],
  ['rainha', 'Intercedeu pela vida do seu povo'],
  ['hata', 'Levou os recados entre Ester e Mordecai'],
];
const FALSE_DEEDS = ['Construiu o templo de Jerusalém', 'Interpretou o sonho do Faraó', 'Atravessou o mar Vermelho'];

export function WhoDidWhat({ paused, onWin, diff = 1 }: GameProps) {
  const cvs = useEstherScene('susa', 'night', [
    { id: 'assuero', x: 0.2, who: 'assuero' },
    { id: 'esterRainha', x: 0.5, who: 'rainha' },
    { id: 'mordecai', x: 0.8, left: true, who: 'mordecai' },
  ]);
  const [{ pairs, deeds }] = useState(() => {
    const pairs = shuffle(DEEDS).slice(0, byDiff(diff, [4, 5, 6]));
    const deeds = shuffle([...pairs.map((p) => p[1]), ...FALSE_DEEDS.slice(0, byDiff(diff, [0, 1, 2]))]);
    return { pairs, deeds };
  });
  dev('who', { pairs: pairs.map(([w, d]) => [ESPEAK[w].name.split(',')[0], d]) });
  const [sel, setSel] = useState<number | null>(null);
  const [done, setDone] = useState<Record<number, string>>({});
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const pick = (d: string) => {
    if (sel === null) return setMsg('Toque primeiro numa pessoa.');
    if (pairs[sel][1] === d) {
      ok();
      const nd = { ...done, [sel]: d };
      setDone(nd);
      setSel(null);
      setMsg(null);
      if (Object.keys(nd).length === pairs.length) {
        win();
        window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 2 ? 2 : 1), 700);
      }
    } else {
      bad();
      setMiss((m) => m + 1);
      setMsg(FALSE_DEEDS.includes(d) ? 'Isso aconteceu em outra história da Bíblia!' : 'Não foi essa pessoa. Lembre-se da história.');
    }
  };
  return (
    <>
      <canvas ref={cvs} className="pixelated absolute inset-0 h-full w-full" aria-hidden />
      {!paused && (
        <Box>
          <Head left="Quem fez o quê?" right={`Erros: ${miss}`} />
          <div className="flex min-h-0 flex-1 gap-2">
            <div className="grid min-h-0 flex-1 gap-1 overflow-y-auto" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gridAutoRows: 'min-content' }}>
              {pairs.map(([who], i) => {
                const sp = ESPEAK[who];
                return (
                  <button
                    key={who}
                    disabled={!!done[i]}
                    onClick={() => (setSel(i), tick())}
                    className={cx('rpg-wood flex items-center gap-1 p-1 text-left text-xs leading-tight', sel === i && 'outline outline-2 outline-[#ffe08a]', done[i] && 'opacity-60')}
                  >
                    <Portrait look={sp.look} bg={sp.bg} className="h-9 w-9" />
                    <span className="min-w-0">
                      {sp.name.split(',')[0]}
                      {done[i] && <span className="block text-[10px] text-[#9af06a]">✔</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
              {deeds.map((d) => (
                <button
                  key={d}
                  disabled={Object.values(done).includes(d)}
                  onClick={() => pick(d)}
                  className={cx('rounded-sm border-2 border-[#5b3a1e] bg-[#f4e4c0] px-1.5 py-0.5 text-left text-xs leading-snug text-[#3a2414]', Object.values(done).includes(d) && 'opacity-40')}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs sm:text-sm">{msg ?? 'Toque numa pessoa e depois no que ela fez. Cuidado com o que não é desta história.'}</span>
        </Box>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 10A. the king's couriers (routes)

const CITIES: { name: string; x: number; y: number }[] = [
  { name: 'Susã', x: 0.55, y: 0.5 },
  { name: 'Babilônia', x: 0.4, y: 0.45 },
  { name: 'Ecbátana', x: 0.55, y: 0.22 },
  { name: 'Persépolis', x: 0.7, y: 0.7 },
  { name: 'Damasco', x: 0.22, y: 0.4 },
  { name: 'Jerusalém', x: 0.18, y: 0.6 },
  { name: 'Sardes', x: 0.08, y: 0.18 },
  { name: 'Mênfis', x: 0.07, y: 0.8 },
  { name: 'Índia', x: 0.93, y: 0.5 },
  { name: 'Bactra', x: 0.84, y: 0.18 },
  { name: 'Cuxe', x: 0.12, y: 0.96 },
  { name: 'Arábia', x: 0.38, y: 0.82 },
];
const ROADS: [number, number, number][] = [
  [0, 1, 1],
  [0, 2, 2],
  [0, 3, 2],
  [1, 4, 3],
  [1, 11, 3],
  [4, 5, 1],
  [4, 6, 3],
  [5, 7, 2],
  [5, 11, 2],
  [7, 10, 2],
  [3, 8, 3],
  [2, 9, 3],
  [9, 8, 2],
  [2, 6, 4],
  [1, 2, 2],
  [3, 11, 3],
];

export function Couriers({ paused, onWin, diff = 1 }: GameProps) {
  const [{ cities, K, D, walks }] = useState(() => {
    const nC = byDiff(diff, [6, 9, 12]);
    // The cities closest to Susa (by road) first.
    const dist = Array(CITIES.length).fill(Infinity);
    dist[0] = 0;
    const q = [0];
    while (q.length) {
      const a = q.shift()!;
      for (const [x, y, d] of ROADS)
        for (const [u, v] of [
          [x, y],
          [y, x],
        ])
          if (u === a && dist[v] > dist[a] + d) (dist[v] = dist[a] + d), q.push(v);
    }
    const cities = [...CITIES.keys()].sort((a, b) => dist[a] - dist[b]).slice(0, nC);
    const K = byDiff(diff, [2, 2, 3]);
    // A hidden solution: couriers take turns extending to the nearest unvisited city.
    const roads = ROADS.filter(([a, b]) => cities.includes(a) && cities.includes(b));
    const sp = Object.assign((from: number) => {
      const d: Record<number, number> = { [from]: 0 };
      const prev: Record<number, number> = {};
      sp.prev = prev;
      const left = new Set(cities);
      while (left.size) {
        let u = -1;
        for (const c of left) if (d[c] !== undefined && (u < 0 || d[c] < d[u])) u = c;
        if (u < 0) break;
        left.delete(u);
        for (const [a, b, w] of roads)
          for (const [x, y] of [
            [a, b],
            [b, a],
          ])
            if (x === u && (d[y] === undefined || d[u] + w < d[y])) (d[y] = d[u] + w), (prev[y] = u);
      }
      return d;
    }, { prev: {} as Record<number, number> });
    const ends = Array(K).fill(0);
    const walks: number[][] = Array.from({ length: K }, () => [0]);
    const len = Array(K).fill(0);
    const seen = new Set([0]);
    while (seen.size < cities.length) {
      const k = len.indexOf(Math.min(...len));
      const d = sp(ends[k]);
      let best = -1;
      for (const c of cities) if (!seen.has(c) && d[c] !== undefined && (best < 0 || d[c] < d[best])) best = c;
      len[k] += d[best];
      const hop: number[] = [];
      for (let c = best; c !== ends[k]; c = sp.prev[c]) hop.unshift(c);
      walks[k].push(...hop);
      hop.forEach((c) => seen.add(c));
      ends[k] = best;
      seen.add(best);
    }
    return { cities, K, D: Math.max(...len) + byDiff(diff, [3, 1, 0]), walks };
  });
  const roads = ROADS.filter(([a, b]) => cities.includes(a) && cities.includes(b));
  const cost = (a: number, b: number) => roads.find(([x, y]) => (x === a && y === b) || (x === b && y === a))?.[2];
  const [routes, setRoutes] = useState<number[][]>(() => Array.from({ length: K }, () => [0]));
  const [cur, setCur] = useState(0);
  dev('couriers', { walks, pos: (i: number, w: number) => pos(i, w) });
  const [msg, setMsg] = useState<string | null>(null);
  const [undos, setUndos] = useState(0);
  const [won, setWon] = useState(false);
  const days = (r: number[]) => r.slice(1).reduce((s, c, i) => s + (cost(r[i], c) ?? 0), 0);
  const reached = new Set(routes.flat());
  const COL = ['#c8321f', '#2a5ab0', '#2a8a3a'];
  const view = useRef({ routes, cur });
  view.current = { routes, cur };
  const pad = { x: 14, y: 22 };
  const pos = (i: number, w: number) => [pad.x + CITIES[i].x * (w - pad.x * 2 - 60) + 30, pad.y + CITIES[i].y * (180 - pad.y - 18)] as const;
  const cv = useStage((ctx, w, _dt, t) => {
    const { routes, cur } = view.current;
    ctx.fillStyle = '#e8d4a8';
    ctx.fillRect(0, 0, w, 180);
    ctx.fillStyle = '#d8c090';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % w, (i * 53) % 180, 18, 1);
    // Rivers and the sea, for a map feel.
    ctx.fillStyle = '#8ab8d8';
    ctx.fillRect(0, 0, 18, 180);
    ctx.fillStyle = '#9ac4e0';
    ctx.fillRect(pos(1, w)[0] - 1, 30, 2, 120);
    for (const [a, b, d] of roads) {
      const [x1, y1] = pos(a, w);
      const [x2, y2] = pos(b, w);
      ctx.strokeStyle = '#8a6a3a';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#5a3a1e';
      ctx.font = '8px monospace';
      ctx.fillText(`${d}d`, (x1 + x2) / 2 + 2, (y1 + y2) / 2 - 2);
    }
    routes.forEach((r, k) => {
      ctx.strokeStyle = COL[k];
      ctx.lineWidth = k === cur ? 3 : 2;
      ctx.beginPath();
      r.forEach((c, i) => {
        const [x, y] = pos(c, w);
        const o = (k - 1) * 2;
        if (i === 0) ctx.moveTo(x + o, y + o);
        else ctx.lineTo(x + o, y + o);
      });
      ctx.stroke();
      const [hx, hy] = pos(r[r.length - 1], w);
      ctx.fillStyle = COL[k];
      ctx.fillRect(hx - 3 + (k - 1) * 3, hy - 9 - Math.abs(Math.sin(t * 6)) * 2, 6, 5);
    });
    const reached = new Set(routes.flat());
    for (const c of cities) {
      const [x, y] = pos(c, w);
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(x - 4, y - 4, 8, 8);
      ctx.fillStyle = c === 0 ? '#e8b830' : reached.has(c) ? '#5ad06a' : '#f4ecd8';
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.fillStyle = '#2a1a10';
      ctx.font = '8px sans-serif';
      ctx.fillText(CITIES[c].name, x + 5, y + 3);
    }
  });
  const extend = (c: number) => {
    if (won) return;
    const r = routes[cur];
    const last = r[r.length - 1];
    const d = cost(last, c);
    if (d === undefined) return setMsg('Escolha uma cidade ligada por estrada à última do mensageiro.'), bad();
    if (days(r) + d > D) return setMsg(`Assim o mensageiro passaria do prazo de ${D} dias.`), bad();
    tick();
    const nr = routes.map((x, k) => (k === cur ? [...x, c] : x));
    setRoutes(nr);
    setMsg(null);
    if (cities.every((q) => nr.flat().includes(q))) {
      setWon(true);
      win();
      setMsg('O decreto chegou a todas as províncias a tempo!');
      window.setTimeout(() => onWin(undos === 0 ? 3 : undos <= 3 ? 2 : 1), 1200);
    }
  };
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused) return;
    const [x, y] = toLogical(e.currentTarget, e);
    const w = e.currentTarget.width;
    let best = -1;
    let bd = 12;
    for (const c of cities) {
      const [cx2, cy2] = pos(c, w);
      const d = Math.hypot(cx2 - x, cy2 - y);
      if (d < bd) (bd = d), (best = c);
    }
    if (best >= 0) extend(best);
  };
  return (
    <>
      <canvas ref={cv} onPointerDown={tap} className="pixelated absolute inset-0 h-full w-full touch-none" aria-label="Mapa das províncias" />
      {!paused && (
        <div className="absolute bottom-2 right-[max(0.5rem,env(safe-area-inset-right))] flex max-w-[45%] flex-col items-end gap-1">
          <div className="rpg-frame rpg-text px-2 py-1 text-xs leading-tight sm:text-sm">
            Prazo: {D} dias · cidades: {cities.filter((c) => reached.has(c)).length}/{cities.length}
            <span className="block text-[11px] opacity-90">{msg ?? 'Toque numa cidade vizinha para o mensageiro seguir.'}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {routes.map((r, k) => (
              <button key={k} onClick={() => (setCur(k), tick())} className={cx('rpg-wood px-2 py-1 text-xs', cur === k && 'outline outline-2 outline-[#ffe08a]')} style={{ color: COL[k] }}>
                🐎 {k + 1}: {days(r)}/{D}d
              </button>
            ))}
            <button
              className="rpg-wood px-2 py-1 text-xs"
              disabled={routes[cur].length < 2 || won}
              onClick={() => {
                setRoutes(routes.map((x, k) => (k === cur ? x.slice(0, -1) : x)));
                setUndos((u) => u + 1);
                tick();
              }}
            >
              ↶ Voltar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------------ 10B. the Purim feast (differences)

type Spot = { id: string; x: number; y: number; r: number };
const SPOTS: Spot[] = [
  { id: 'banner', x: 0.22, y: 34, r: 14 },
  { id: 'lamp', x: 0.5, y: 46, r: 12 },
  { id: 'fruit', x: 0.36, y: 118, r: 11 },
  { id: 'robe', x: 0.8, y: 138, r: 14 },
  { id: 'star', x: 0.86, y: 14, r: 10 },
  { id: 'window', x: 0.1, y: 76, r: 11 },
  { id: 'basket', x: 0.62, y: 150, r: 11 },
  { id: 'flag', x: 0.93, y: 40, r: 11 },
  { id: 'drum', x: 0.2, y: 150, r: 11 },
];

function drawFeast(ctx: CanvasRenderingContext2D, ox: number, pw: number, alt: Set<string>, t: number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, 0, pw, 180);
  ctx.clip();
  ctx.translate(ox, 0);
  const g = ctx.createLinearGradient(0, 0, 0, 120);
  g.addColorStop(0, '#2a2a6a');
  g.addColorStop(1, '#e88a50');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, pw, 180);
  if (!alt.has('star')) {
    ctx.fillStyle = '#fff8c0';
    ctx.fillRect(pw * 0.86 - 1, 13, 3, 3);
  }
  // Houses with a window.
  ctx.fillStyle = '#c8a878';
  ctx.fillRect(0, 60, pw * 0.3, 80);
  ctx.fillRect(pw * 0.7, 66, pw * 0.3, 74);
  ctx.fillStyle = alt.has('window') ? '#3a2a1e' : '#ffd060';
  ctx.fillRect(pw * 0.1 - 4, 72, 8, 8);
  // Garland and banner.
  ctx.strokeStyle = '#3a8a5a';
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.quadraticCurveTo(pw / 2, 46, pw, 26);
  ctx.stroke();
  ctx.fillStyle = alt.has('banner') ? '#2a5ab0' : '#c8321f';
  ctx.beginPath();
  ctx.moveTo(pw * 0.22 - 7, 28);
  ctx.lineTo(pw * 0.22 + 7, 28);
  ctx.lineTo(pw * 0.22, 44);
  ctx.fill();
  if (!alt.has('lamp')) {
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(pw * 0.5 - 3, 40, 6, 8);
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(pw * 0.5 - 1, 37 + Math.sin(t * 8), 2, 3);
  }
  // Flag on the roof.
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(pw * 0.93, 30, 1, 18);
  ctx.fillStyle = '#e8b830';
  if (alt.has('flag')) ctx.fillRect(pw * 0.93 - 8, 30, 8, 5);
  else ctx.fillRect(pw * 0.93 + 1, 30, 8, 5);
  // Ground and the table of gifts.
  ctx.fillStyle = '#c8a878';
  ctx.fillRect(0, 140, pw, 40);
  ctx.fillStyle = '#7a4a24';
  ctx.fillRect(pw * 0.25, 120, pw * 0.3, 5);
  ctx.fillRect(pw * 0.27, 125, 3, 15);
  ctx.fillRect(pw * 0.52, 125, 3, 15);
  const fruits = alt.has('fruit') ? 4 : 3;
  for (let i = 0; i < fruits; i++) {
    ctx.fillStyle = '#c8302a';
    ctx.fillRect(pw * 0.3 + i * 7, 115, 5, 5);
  }
  if (!alt.has('basket')) {
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(pw * 0.62 - 5, 146, 10, 7);
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(pw * 0.62 - 3, 143, 6, 3);
  }
  ctx.fillStyle = alt.has('drum') ? '#3a8a5a' : '#a83a2a';
  ctx.fillRect(pw * 0.2 - 5, 146, 10, 8);
  ctx.fillStyle = '#f4ecd8';
  ctx.fillRect(pw * 0.2 - 5, 145, 10, 2);
  // People celebrating.
  const people: [CastId, number][] = [
    ['esterRainha', 0.08],
    ['mordecai', 0.45],
    [alt.has('robe') ? 'aldeao' : 'mulher', 0.8],
  ];
  for (const [id, x] of people) drawChar(ctx, id, 'victory', Math.floor(t * 4 + x * 10) % 4, pw * x, 160, x > 0.5);
  ctx.restore();
}

export function PurimDiff({ paused, onWin, diff = 1 }: GameProps) {
  const n = byDiff(diff, [4, 5, 7]);
  const [alt] = useState(() => new Set(shuffle(SPOTS).slice(0, n).map((s) => s.id)));
  dev('purim', { spots: SPOTS.filter((s) => alt.has(s.id)) });
  const [found, setFound] = useState<string[]>([]);
  const [miss, setMiss] = useState(0);
  const view = useRef(found);
  view.current = found;
  const cv = useStage((ctx, w, _dt, t) => {
    const pw = Math.floor(w / 2) - 3;
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, w, 180);
    drawFeast(ctx, 2, pw, new Set(), t);
    drawFeast(ctx, w - pw - 2, pw, alt, t);
    for (const id of view.current) {
      const s = SPOTS.find((x) => x.id === id)!;
      for (const ox of [2, w - pw - 2]) {
        ctx.strokeStyle = '#5af06a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox + s.x * pw, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (paused || found.length === n) return;
    const [x, y] = toLogical(e.currentTarget, e);
    const w = e.currentTarget.width;
    const pw = Math.floor(w / 2) - 3;
    const lx = x > w / 2 ? x - (w - pw - 2) : x - 2;
    const hit = SPOTS.find((s) => alt.has(s.id) && !found.includes(s.id) && Math.hypot(s.x * pw - lx, s.y - y) < s.r + 4);
    if (hit) {
      ok();
      const nf = [...found, hit.id];
      setFound(nf);
      if (nf.length === n) {
        win();
        window.setTimeout(() => onWin(miss === 0 ? 3 : miss <= 3 ? 2 : 1), 900);
      }
    } else {
      bad();
      setMiss((m) => m + 1);
    }
  };
  return (
    <>
      <canvas ref={cv} onPointerDown={tap} className="pixelated absolute inset-0 h-full w-full touch-none" aria-label="A festa de Purim" />
      {!paused && (
        <div className="rpg-frame rpg-text pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs sm:text-sm">
          Diferenças: {found.length}/{n} · erros: {miss}
        </div>
      )}
    </>
  );
}
