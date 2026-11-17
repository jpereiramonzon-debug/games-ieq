/**
 * Screen orientation for the landscape games.
 *
 * The old check listened to window "resize" and compared innerWidth with
 * innerHeight. On many phones that event fires before the new size is
 * applied, so the "rotate your phone" panel stayed up until some later resize.
 * Now the panel is shown and hidden by the CSS orientation media query (the
 * same instant the browser re-lays out), and code that needs to know reads
 * the same query through matchMedia, so the two can never disagree.
 */
import { useSyncExternalStore } from 'react';
import { RotateCw } from 'lucide-react';

const QUERY = '(orientation: portrait)';
let mq: MediaQueryList | null = null;
const query = () => (mq ??= window.matchMedia(QUERY));

const subscribe = (fn: () => void) => {
  const m = query();
  m.addEventListener('change', fn);
  return () => m.removeEventListener('change', fn);
};

/** True while the device is held upright. One shared listener per subscriber, removed on unmount. */
export function useIsPortrait() {
  return useSyncExternalStore(subscribe, () => query().matches);
}

/**
 * Small pixel-art hint shown only in portrait. Visibility comes straight from
 * the media query (no waiting for JavaScript); it fades in and out in 150 ms
 * and never catches taps while hidden.
 */
export function RotateHint({ onExit }: { onExit: () => void }) {
  return (
    <div
      role="alert"
      className="pointer-events-none invisible absolute inset-0 z-40 grid place-items-center bg-[#1a120a]/80 p-4 opacity-0 transition-[opacity,visibility] duration-150 portrait:pointer-events-auto portrait:visible portrait:opacity-100"
    >
      <div className="rpg-frame rpg-text flex max-w-[16rem] items-center gap-3 px-3 py-2 text-base leading-tight">
        <RotateCw className="shrink-0 animate-[spin_1.6s_ease-in-out_infinite]" size={28} aria-hidden />
        <span className="flex-1">Deite o celular para jogar</span>
        <button onClick={onExit} className="rpg-wood rpg-text h-9 shrink-0 px-2 text-sm">
          Sair
        </button>
      </div>
    </div>
  );
}
