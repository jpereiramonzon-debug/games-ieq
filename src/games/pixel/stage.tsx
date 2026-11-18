/** Shared pieces for story-mode mini-games: canvas stage, panels, retry, keys, particles, haptics. */
import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../../ui/kit';
import { Portrait } from './Dialog';
import type { Look } from './person';

export interface GameProps {
  paused: boolean;
  /** Called once when the player wins; stars 1-3 rate the performance. */
  onWin: (stars?: number) => void;
  /** 0 = easy, 1 = normal, 2 = hard. */
  diff: number;
}

/** Pick a value by difficulty: [easy, normal, hard]. */
export const byDiff = <T,>(diff: number, v: [T, T, T]): T => v[Math.max(0, Math.min(2, diff))];

/** Stars from a 0..1 score (1 = flawless). */
export const starsOf = (score: number) => (score >= 0.85 ? 3 : score >= 0.5 ? 2 : 1);

export const VH = 180;

/** Canvas + animation loop; `draw` always sees the latest props through a ref. */
export function useStage(draw: (ctx: CanvasRenderingContext2D, w: number, dt: number, t: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fn = useRef(draw);
  fn.current = draw;
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let w = 320;
    const fit = () => {
      w = Math.round(Math.max(260, Math.min(420, (VH * cv.clientWidth) / Math.max(1, cv.clientHeight))));
      if (cv.width !== w || cv.height !== VH) {
        cv.width = w;
        cv.height = VH;
      }
      ctx.imageSmoothingEnabled = false;
    };
    fit();
    window.addEventListener('resize', fit);
    // Rotation: refit once the new size is really applied (resize can fire before that).
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    let raf = 0;
    let last = performance.now();
    let t = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      fn.current(ctx, w, dt, t);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      ro.disconnect();
    };
  }, []);
  return ref;
}

export const Stage = ({ cv }: { cv: React.RefObject<HTMLCanvasElement | null> }) => <canvas ref={cv} className="pixelated absolute inset-0 h-full w-full" aria-hidden />;

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rpg-frame rpg-text px-3 py-1.5', className)}>{children}</div>;
}

export function Retry({ text, onRetry, look }: { text: string; onRetry: () => void; look: Look }) {
  return (
    <div className="absolute inset-0 z-10 flex overflow-y-auto bg-black/50 p-4 short:p-2">
      <div className="rpg-frame rpg-text m-auto flex max-w-md flex-col items-center gap-3 p-4 text-center text-lg short:max-w-xl short:flex-row short:p-3 short:text-base">
        <Portrait look={look} mood="sad" className="h-20 w-20 short:h-14 short:w-14" />
        <div className="flex flex-col items-center gap-3 short:gap-2">
          {text}
          <button onClick={onRetry} className="rpg-wood h-12 w-full text-xl active:translate-y-0.5 short:h-11">
            Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}

export const useKeys = (down: (k: string) => void, up?: (k: string) => void) => {
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.repeat) return;
      down(e.key.toLowerCase());
    };
    const ku = (e: KeyboardEvent) => up?.(e.key.toLowerCase());
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  });
};

export type Part = { x: number; y: number; vx: number; vy: number; c: string; life: number };
export const burst = (ps: Part[], x: number, y: number, c: string, n = 10, up = 50) => {
  for (let i = 0; i < n; i++) ps.push({ x, y, vx: (Math.random() - 0.5) * 80, vy: -up * (0.3 + Math.random()), c, life: 0.8 });
};
export const stepParts = (ps: Part[], dt: number, g = 140) =>
  ps.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += g * dt;
    return (p.life -= dt) > 0;
  });

/** Short vibration on phones that support it (hits, damage). */
export function buzz(ms: number | number[] = 25) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
}
