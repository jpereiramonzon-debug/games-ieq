/**
 * Os sinais das flechas (1 Samuel 20:18-42). Only Jônatas learns what Saul
 * intends; only Davi, hidden by the stone, decides to stay or to flee. The
 * only message between them is where Jônatas' arrow lands: short of the boy
 * means “stay, it's peace”; beyond the boy means “go, the Lord sends you away”
 * (1 Samuel 20:21-22). Davi's phone runs the rounds and the wind; Jônatas sends
 * his shot's strength; Davi's phone computes where it lands for both.
 */
import { useEffect, useRef, useState } from 'react';
import { engine } from '../../../audio/engine';
import { cx } from '../../../ui/kit';
import { buzz, byDiff, Panel, starsOf, useStage } from '../../pixel/stage';
import { drawBackdrop } from '../../platform/sky';
import { drawChar } from '../../platform/rig';
import { seeded } from '../../../net/room';
import { useMsg, type CoopProps } from './link';

const CLUES: { text: string; flee: boolean }[] = [
  { text: 'Saul na mesa: “Por que o filho de Jessé não veio à refeição? Ele deve morrer!”', flee: true },
  { text: 'Saul na mesa: “Davi não veio... deve estar impuro. Não é nada.”', flee: false },
  { text: 'Saul atirou a lança contra Jônatas por defender Davi.', flee: true },
  { text: 'Saul está calmo e pergunta por Davi com carinho.', flee: false },
  { text: 'Saul cochicha com os guardas e manda vigiar a casa de Davi.', flee: true },
  { text: 'Saul jurou: “Vive o Senhor, Davi não morrerá.”', flee: false },
  { text: 'Saul diz: “Enquanto o filho de Jessé viver, o teu reino não será firme.”', flee: true },
  { text: 'Saul manda chamar Davi para tocar a harpa, em paz.', flee: false },
];

type Phase = 'clue' | 'shoot' | 'fly' | 'decide' | 'result' | 'over';
const BOY = 0.62;

export function Arrows({ room, role, diff, seed, onWin }: CoopProps) {
  const rounds = byDiff(diff, [3, 4, 5]);
  const rnd = useRef(seeded(seed));
  const [plan] = useState(() => {
    // Fisher-Yates with the shared seed: the same order on both phones.
    const order = [...CLUES.keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd.current() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    order.length = rounds;
    return order.map((k) => ({ clue: CLUES[k], wind: diff === 0 ? 0 : (rnd.current() - 0.5) * byDiff(diff, [0, 0.12, 0.22]) }));
  });
  const [k, setK] = useState(0);
  const [phase, setPhase] = useState<Phase>('clue');
  const [land, setLand] = useState<number | null>(null);
  const [choice, setChoice] = useState<'stay' | 'flee' | null>(null);
  const [score, setScore] = useState(0);
  const power = useRef({ charging: false, v: 0, at: 0 });
  const fly = useRef({ t0: 0, to: 0 });
  const round = plan[k];

  // ---------------- host: the rounds
  const next = (nk: number, sc: number) => {
    if (nk >= rounds) {
      const need = rounds - 1;
      const won = sc >= need;
      const stars = starsOf(sc / rounds);
      room.send({ t: 'g', k: 'over', won, stars, score: sc });
      end(won, stars, sc);
      return;
    }
    room.send({ t: 'g', k: 'round', i: nk });
    setK(nk);
    setPhase('clue');
    setLand(null);
    setChoice(null);
  };
  const end = (won: boolean, stars: number, sc: number) => {
    setScore(sc);
    setPhase('over');
    if (won) {
      engine.sfx('yay');
      buzz([40, 30, 80]);
      window.setTimeout(() => onWin(stars), 1500);
    } else engine.sfx('bonk');
  };
  const landAt = (p: number) => {
    // Strength 0..1 → distance across the field, plus the wind.
    const x = 0.25 + p * 0.68 + round.wind;
    return Math.max(0.27, Math.min(0.97, x));
  };
  useMsg(room, 'g', (m) => {
    if (m.k === 'round' && role === 'guest') {
      setK(m.i as number);
      setPhase('clue');
      setLand(null);
      setChoice(null);
    } else if (m.k === 'shoot' && role === 'host') shoot(m.p as number);
    else if (m.k === 'fly') startFly(m.x as number);
    else if (m.k === 'shooting' && role === 'host') setPhase('shoot');
    else if (m.k === 'choice') reveal(m.c as 'stay' | 'flee', m.ok as boolean, m.score as number);
    else if (m.k === 'over' && role === 'guest') end(m.won as boolean, m.stars as number, m.score as number);
    else if (m.k === 'again' && role === 'guest') {
      setK(0);
      setScore(0);
      setPhase('clue');
      setLand(null);
      setChoice(null);
    }
  });
  const shoot = (p: number) => {
    const x = landAt(p);
    room.send({ t: 'g', k: 'fly', x });
    startFly(x);
  };
  const startFly = (x: number) => {
    fly.current = { t0: performance.now(), to: x };
    setPhase('fly');
    engine.playNote(76, 'pluck', 0, 0.15);
    window.setTimeout(() => {
      setLand(x);
      setPhase('decide');
    }, 1100);
  };
  const decide = (c: 'stay' | 'flee') => {
    if (role !== 'host' || phase !== 'decide') return;
    const ok = (c === 'flee') === round.clue.flee;
    const sc = score + (ok ? 1 : 0);
    room.send({ t: 'g', k: 'choice', c, ok, score: sc });
    reveal(c, ok, sc);
  };
  const reveal = (c: 'stay' | 'flee', ok: boolean, sc: number) => {
    setChoice(c);
    setScore(sc);
    setPhase('result');
    if (ok) engine.playNote(79, 'bell', 0, 0.25);
    else engine.sfx('bonk');
    if (role === 'host') window.setTimeout(() => next(k + 1, sc), 2600);
  };
  const again = () => {
    rnd.current = seeded(seed);
    room.send({ t: 'g', k: 'again' });
    setK(0);
    setScore(0);
    setPhase('clue');
    setLand(null);
    setChoice(null);
  };

  // ---------------- Jônatas: charge and release the bow
  const startCharge = () => {
    if (role !== 'guest' || (phase !== 'clue' && phase !== 'shoot')) return;
    power.current = { charging: true, v: 0, at: performance.now() };
    if (phase === 'clue') {
      setPhase('shoot');
      room.send({ t: 'g', k: 'shooting' });
    }
  };
  const release = () => {
    if (role !== 'guest' || !power.current.charging) return;
    power.current.charging = false;
    const p = power.current.v;
    room.send({ t: 'g', k: 'shoot', p });
  };
  useEffect(() => {
    const kd = (e: KeyboardEvent) => e.key === ' ' && (e.type === 'keydown' ? !e.repeat && startCharge() : release());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', kd);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', kd);
    };
  });

  const cv = useStage((ctx, w, _dt, t) => {
    drawBackdrop(ctx, w, 180, 'village', 'sunset', t, 60);
    ctx.fillStyle = '#7a9a3a';
    ctx.fillRect(0, 150, w, 30);
    // Distance marks and the boy.
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = '#5a7a2a';
      ctx.fillRect(w * (0.3 + i * 0.07), 152, 1, 4);
    }
    const boyX = w * (BOY + (round?.wind ?? 0) * 0);
    drawChar(ctx, 'menino', 'idle', Math.floor(t * 4) % 4, boyX, 152, true);
    // Davi hidden behind the stone Ezel (only the top of his head shows).
    drawChar(ctx, 'davi', choice ? (choice === 'flee' ? 'run' : 'idle') : 'idle', Math.floor(t * 6) % 4, w * 0.9 + (choice === 'flee' ? 30 : 0), 152, true);
    ctx.fillStyle = '#8a8478';
    ctx.beginPath();
    ctx.ellipse(w * 0.88, 150, 26, 26, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(w * 0.88 - 26, 148, 52, 6);
    ctx.fillStyle = '#a8a294';
    ctx.fillRect(w * 0.88 - 14, 130, 10, 3);
    // Jônatas with the bow.
    const charging = power.current.charging;
    if (charging) power.current.v = (Math.sin((performance.now() - power.current.at) / 700 - Math.PI / 2) + 1) / 2;
    drawChar(ctx, 'jonatas', charging || phase === 'fly' ? 'special' : 'idle', charging ? Math.min(5, Math.floor(power.current.v * 6)) : Math.floor(t * 4) % 4, w * 0.16, 152, false);
    // Wind flag.
    if (round && round.wind !== 0) {
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(w * 0.45, 112, 1, 40);
      ctx.fillStyle = '#e8e0c8';
      const dir = Math.sign(round.wind);
      const len = 6 + Math.abs(round.wind) * 60;
      ctx.fillRect(dir > 0 ? w * 0.45 : w * 0.45 - len, 112 + Math.sin(t * 8), len, 5);
    }
    // Arrow in flight / landed.
    if (phase === 'fly' || land !== null) {
      const k2 = phase === 'fly' ? Math.min(1, (performance.now() - fly.current.t0) / 1000) : 1;
      const tx = (land ?? fly.current.to) * w;
      const x0 = w * 0.18;
      const x = x0 + (tx - x0) * k2;
      const y = 128 - Math.sin(k2 * Math.PI) * 50 + k2 * 22;
      ctx.strokeStyle = '#6a4424';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - (k2 < 1 ? Math.cos(k2 * Math.PI) * 3 : -2));
      ctx.lineTo(x + 2, y);
      ctx.stroke();
      ctx.fillStyle = '#d8d8e0';
      ctx.fillRect(x + 1, y - 1, 2, 2);
    }
    // Power meter for Jônatas.
    if (role === 'guest' && charging) {
      ctx.fillStyle = '#2a1a10';
      ctx.fillRect(w * 0.08, 60, 8, 50);
      ctx.fillStyle = '#e8b830';
      const hgt = power.current.v * 48;
      ctx.fillRect(w * 0.08 + 1, 109 - hgt, 6, hgt);
    }
  });

  if (import.meta.env.DEV) (window as unknown as { __arrows: unknown }).__arrows = { plan, k, phase, landAt, shoot, power, decide, BOY };
  const signal = land === null ? null : land > BOY + 0.02 ? 'além' : land < BOY - 0.02 ? 'aquém' : 'perto';
  const truthText = round ? (round.clue.flee ? 'Saul quer matar Davi: a flecha deve cair ALÉM do menino (fuja!).' : 'Saul está em paz: a flecha deve cair AQUÉM do menino (fique!).') : '';
  return (
    <>
      <canvas
        ref={cv}
        onPointerDown={startCharge}
        onPointerUp={release}
        onPointerCancel={release}
        className="pixelated absolute inset-0 h-full w-full touch-none"
        aria-label="O campo e a pedra de Ezel"
      />
      <div className="pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-2 top-2 flex flex-wrap items-start gap-2">
        <Panel className="text-sm">
          Sinal {Math.min(k + 1, rounds)}/{rounds} · acertos {score}
        </Panel>
        <Panel className="max-w-md text-xs leading-snug sm:text-sm">
          {role === 'guest' ? (
            phase === 'clue' || phase === 'shoot' ? (
              <>
                <span className="text-[#ffe08a]">Só você sabe: </span>
                {round?.clue.text}
                <span className="block">{diff === 0 ? truthText : 'Segure e solte para atirar. Além do menino = fuja; aquém = fique.'}</span>
              </>
            ) : phase === 'decide' ? (
              'Davi está lendo o seu sinal...'
            ) : null
          ) : phase === 'clue' || phase === 'shoot' ? (
            'Escondido junto à pedra. Espere o sinal de Jônatas: flecha ALÉM do menino = fuja; AQUÉM do menino = fique.'
          ) : phase === 'decide' ? (
            <>A flecha caiu {signal === 'além' ? 'ALÉM do menino' : signal === 'aquém' ? 'AQUÉM do menino' : 'bem perto do menino'}. O que Davi faz?</>
          ) : null}
          {phase === 'result' && round && <span className="block text-[#ffe08a]">{(choice === 'flee') === round.clue.flee ? 'Certo! O sinal foi entendido.' : `Errado... ${round.clue.flee ? 'Saul queria matar Davi.' : 'Saul estava em paz.'}`}</span>}
        </Panel>
      </div>
      {role === 'host' && phase === 'decide' && (
        <div className="absolute bottom-3 right-[max(0.75rem,env(safe-area-inset-right))] flex gap-2">
          <button className="rpg-wood px-4 py-2 text-lg" onClick={() => decide('stay')}>
            Ficar
          </button>
          <button className="rpg-wood px-4 py-2 text-lg" onClick={() => decide('flee')}>
            Fugir
          </button>
        </div>
      )}
      {role === 'guest' && (phase === 'clue' || phase === 'shoot') && (
        <div className={cx('rpg-frame rpg-text pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm', phase === 'shoot' && 'animate-pulse')}>
          Segure o dedo na tela para puxar o arco e solte para atirar
        </div>
      )}
      {phase === 'over' && (
        <div className="absolute inset-0 z-20 flex bg-black/55 p-3">
          <div className="rpg-frame rpg-text m-auto flex max-w-md flex-col items-center gap-2 p-3 text-center">
            <p className="text-lg">
              {score} de {rounds} sinais entendidos
            </p>
            {score >= rounds - 1 ? (
              <p className="text-sm">Jônatas e Davi se entenderam sem dizer uma palavra.</p>
            ) : role === 'host' ? (
              <button className="rpg-wood h-11 w-full text-lg" onClick={again}>
                Tentar de novo
              </button>
            ) : (
              <p className="text-sm text-[#ffe08a]">Davi vai recomeçar...</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
