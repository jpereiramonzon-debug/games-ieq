import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { cx } from '../../ui/kit';

/** Round 8-way d-pad: the direction comes from where the finger is relative to the centre. */
export function DPad({ onChange, className }: { onChange: (x: number, y: number) => void; className?: string }) {
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.12) return onChange(0, 0);
    const a = Math.atan2(dy, dx);
    const c = Math.cos(a);
    const s = Math.sin(a);
    onChange(Math.abs(c) > 0.38 ? Math.sign(c) : 0, Math.abs(s) > 0.38 ? Math.sign(s) : 0);
  };
  const end = () => onChange(0, 0);
  return (
    <div
      className={cx('h-32 w-32 touch-none rounded-full border-4 border-[#4a2c14]/70 bg-[#8a5a2e]/45', className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Direcional"
    >
      <span className="absolute left-1/2 top-1 -translate-x-1/2 text-2xl text-[#ffe08a]/80">▲</span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-2xl text-[#ffe08a]/80">▼</span>
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-2xl text-[#ffe08a]/80">◀</span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-2xl text-[#ffe08a]/80">▶</span>
    </div>
  );
}

/** Big round "A" button; `hot` makes it glow when there is something to do. */
export function AButton({ onPress, hot, children, className, label = 'Agir' }: { onPress: () => void; hot?: boolean; children: ReactNode; className?: string; label?: string }) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      aria-label={label}
      className={cx(
        'rpg-text grid h-20 w-20 touch-none place-items-center rounded-full border-4 border-[#4a2c14] text-3xl shadow-[3px_3px_0_#0006] transition',
        hot ? 'bg-[#c8321f]' : 'bg-[#8a5a2e]',
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Analog joystick: the knob follows the thumb and the stick reports a vector
 * with length 0..1, so a light push walks slowly and a full push runs.
 */
export function Joystick({ onChange, className }: { onChange: (x: number, y: number) => void; className?: string }) {
  const knob = useRef<HTMLSpanElement>(null);
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (e.clientX - (r.left + R)) / (R * 0.75);
    let dy = (e.clientY - (r.top + R)) / (R * 0.75);
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    if (knob.current) knob.current.style.transform = `translate(${dx * R * 0.55}px, ${dy * R * 0.55}px)`;
    // Small dead zone, then a slight curve so small pushes are precise.
    const mm = Math.min(1, m);
    if (mm < 0.15) return onChange(0, 0);
    const k = Math.min(1, (mm - 0.15) / 0.75) ** 0.8 / mm;
    onChange(dx * mm * k, dy * mm * k);
  };
  const end = () => {
    if (knob.current) knob.current.style.transform = '';
    onChange(0, 0);
  };
  return (
    <div
      className={cx('grid h-36 w-36 touch-none place-items-center rounded-full border-4 border-[#4a2c14]/70 bg-[#8a5a2e]/40', className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Direcional"
    >
      <span ref={knob} className="rpg-wood pointer-events-none block h-14 w-14 rounded-full transition-transform duration-75" />
    </div>
  );
}

/** Reveals text letter by letter; `ctl` lets the owner finish it at once. */
export function Typed({ text, ctl, cps = 70 }: { text: string; ctl?: React.MutableRefObject<{ done: boolean; finish: () => void }>; cps?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(text.length, Math.floor(((performance.now() - t0) / 1000) * cps));
      setN(k);
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    if (ctl) ctl.current = { done: false, finish: () => (cancelAnimationFrame(raf), setN(text.length)) };
    return () => cancelAnimationFrame(raf);
  }, [text, cps, ctl]);
  if (ctl) ctl.current.done = n >= text.length;
  return (
    <span>
      {text.slice(0, n)}
      <span className="opacity-0">{text.slice(n)}</span>
    </span>
  );
}
