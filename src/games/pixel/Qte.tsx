/**
 * Quick action mini-games used inside story scenes:
 * - ring:   a ring of light shrinks; tap when it meets the circle (n times)
 * - mash:   tap fast to fill a bar before time runs out
 * - timing: a marker sweeps; tap when it is inside the zone
 */
import { useEffect, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { cx } from '../../ui/kit';
import { Portrait } from './Dialog';
import type { Mood } from './bust';
import type { Look } from './person';
import { buzz } from './stage';

export type QteKind = 'ring' | 'mash' | 'timing';

export function Qte({
  kind,
  title,
  hint,
  look,
  img,
  bg,
  times = 3,
  seconds = 3,
  button = 'Agora!',
  diff = 1,
  onDone,
}: {
  /** 0 easy, 1 normal, 2 hard: hit windows shrink. */
  diff?: number;
  kind: QteKind;
  title: string;
  hint: string;
  look: Look;
  img?: string;
  bg?: string;
  /** Rings / zones to hit, or taps needed for mash. */
  times?: number;
  /** Time limit for mash. */
  seconds?: number;
  button?: string;
  onDone: (ok: boolean) => void;
}) {
  const [hits, setHits] = useState(0);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState<{ text: string; mood: Mood } | null>(null);
  const [, setFrame] = useState(0);
  const t0 = useRef(performance.now());
  const over = useRef(false);
  const zone = useRef(0.5);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      setFrame((f) => f + 1);
      if (kind === 'mash' && !over.current && (performance.now() - t0.current) / 1000 > seconds) {
        over.current = true;
        engine.sfx('bonk');
        setMsg({ text: 'Quase! Mais força, de novo.', mood: 'sad' });
        window.setTimeout(() => onDone(false), 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const el = (performance.now() - t0.current) / 1000;
  // ring: radius goes 1 → 0 over 1.4 s, repeating.
  const period = 1.5 - hits * 0.15;
  const ring = 1 - ((el % period) / period);
  // timing: marker triangle wave.
  const speed = 0.8 + hits * 0.25;
  const p = (el * speed) % 2;
  const pos = p < 1 ? p : 2 - p;
  const mashFill = Math.min(1, hits / times);
  const left = Math.max(0, seconds - el);

  const tap = () => {
    if (over.current) return;
    let ok = false;
    if (kind === 'ring') ok = Math.abs(ring - 0.42) < [0.12, 0.09, 0.065][diff];
    else if (kind === 'timing') ok = Math.abs(pos - zone.current) < [0.11, 0.08, 0.06][diff];
    else ok = true;
    if (ok) {
      const h = hits + 1;
      setHits(h);
      engine.playNote(76 + h * 2, 'bell', 0, kind === 'mash' ? 0.12 : 0.25);
      if (kind === 'mash') engine.drum('tom', 0, 0.5);
      buzz(kind === 'mash' ? 8 : 20);
      if (kind === 'timing') {
        zone.current = 0.2 + Math.random() * 0.6;
        t0.current = performance.now() - Math.random() * 500;
      }
      if (h >= times) {
        over.current = true;
        engine.sfx('power');
        setMsg({ text: 'Isso!', mood: 'happy' });
        window.setTimeout(() => onDone(true), 700);
      } else if (kind !== 'mash') setMsg({ text: ['Bom!', 'Muito bem!', 'Mais um!'][h % 3], mood: 'happy' });
    } else {
      engine.sfx('bonk');
      buzz([30, 30, 30]);
      const m = miss + 1;
      setMiss(m);
      setMsg({ text: kind === 'ring' ? 'Espere a luz encostar no círculo.' : 'Fora da marca... calma.', mood: 'sad' });
      if (m >= 3) {
        over.current = true;
        window.setTimeout(() => onDone(false), 800);
      }
    }
  };

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.repeat && kind !== 'mash') return;
      if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.stopPropagation();
        tap();
      }
    };
    window.addEventListener('keydown', kd, true);
    return () => window.removeEventListener('keydown', kd, true);
  });

  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/55 p-2">
      <div key={`${hits}-${miss}`} className={cx('rpg-frame rpg-text flex w-full max-w-2xl items-center gap-3 p-3', miss + hits > 0 && (msg?.mood === 'sad' ? 'fb-miss' : 'fb-hit'))}>
        <div className="flex w-32 shrink-0 flex-col items-center gap-1 text-center text-sm leading-snug">
          <Portrait look={look} img={img} mood={msg?.mood ?? 'neutral'} bg={bg} className="h-20 w-20" />
          <span key={msg?.text ?? hint} className="animate-pop">
            {msg?.text ?? hint}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <p className="text-xl text-[#ffe08a]">{title}</p>
          {kind === 'ring' && (
            <div className="relative grid h-36 w-36 place-items-center">
              <span className="absolute h-[42%] w-[42%] rounded-full border-4 border-[#ffe08a] shadow-[0_0_12px_#ffe08a]" />
              <span className="absolute rounded-full border-4 border-white/90" style={{ width: `${ring * 100}%`, height: `${ring * 100}%` }} />
              <span className="text-sm">
                {hits}/{times}
              </span>
            </div>
          )}
          {kind === 'timing' && (
            <div className="relative h-9 w-full border-[3px] border-[#3a2414] bg-[#c08a4a]">
              <div className="absolute inset-y-0 bg-[#6aaa3a]" style={{ left: `${(zone.current - [0.11, 0.08, 0.06][diff]) * 100}%`, width: `${[0.11, 0.08, 0.06][diff] * 200}%` }} />
              <div className="absolute -top-2 bottom-[-0.5rem] w-1.5 -translate-x-1/2 border border-[#3a2414] bg-white" style={{ left: `${pos * 100}%` }} />
            </div>
          )}
          {kind === 'mash' && (
            <div className="w-full">
              <div className="h-6 w-full border-[3px] border-[#3a2414] bg-[#4a4250]">
                <div className="h-full bg-[#ffd23a] transition-[width] duration-75" style={{ width: `${mashFill * 100}%` }} />
              </div>
              <p className="mt-1 text-center text-sm">{left.toFixed(1)} s</p>
            </div>
          )}
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              tap();
            }}
            className={cx('rpg-wood h-16 w-full touch-none text-2xl active:translate-y-0.5', kind === 'mash' && 'animate-blink')}
          >
            {button}
          </button>
          {kind !== 'mash' && <p className="text-xs opacity-70">Erros: {miss}/3</p>}
        </div>
      </div>
    </div>
  );
}
