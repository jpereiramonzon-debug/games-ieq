import { useEffect, useRef, type ReactNode } from 'react';
import { cx } from '../../ui/kit';
import type { Mood } from './bust';
import { drawPortrait, PORTRAIT } from '../platform/rig';
import type { Look } from './person';

export function Portrait({ look, mood = 'neutral', bg = '#8aa898', className, img }: { look: Look; mood?: Mood; bg?: string; className?: string; img?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (ctx) drawPortrait(ctx, look, mood, bg);
  }, [look, mood, bg, img]);
  return (
    <span className={cx('rpg-wood block shrink-0 overflow-hidden p-[3px]', className)}>
      {img ? (
        <img src={img} alt="" className="block h-full w-full object-cover" draggable={false} />
      ) : (
        <canvas ref={ref} width={PORTRAIT} height={PORTRAIT} className="pixelated block h-full w-full" aria-hidden />
      )}
    </span>
  );
}

/**
 * Dialog box in the style of 16-bit RPGs: a framed portrait and a parchment panel.
 * `size` "sm" is used by the game coaches; "lg" by the missions game.
 */
export function Dialog({
  look,
  mood,
  bg,
  name,
  children,
  size = 'sm',
  onClick,
  className,
  tone = 'info',
  img,
}: {
  img?: string;
  look: Look;
  mood?: Mood;
  bg?: string;
  name?: string;
  children: ReactNode;
  size?: 'sm' | 'lg';
  onClick?: () => void;
  className?: string;
  tone?: 'info' | 'miss' | 'praise';
}) {
  return (
    <div className={cx('flex items-stretch gap-1.5', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <Portrait
        look={look}
        img={img}
        mood={mood}
        bg={bg ?? (tone === 'praise' ? '#c8c070' : tone === 'miss' ? '#c88a6a' : '#8aa898')}
        className={size === 'lg' ? 'h-24 w-24' : 'h-[3.75rem] w-[3.75rem]'}
      />
      <div
        className={cx(
          'rpg-frame rpg-text relative flex min-w-0 flex-1 flex-col justify-center leading-snug',
          size === 'lg' ? 'min-h-24 px-3 py-2 text-[clamp(14px,2.4vw,20px)]' : 'min-h-[3.75rem] px-2.5 py-1.5 text-[clamp(13px,3.6vw,17px)]',
        )}
      >
        {name && <span className="mb-0.5 text-[0.8em] text-[#ffe08a]">{name}</span>}
        {children}
      </div>
    </div>
  );
}
