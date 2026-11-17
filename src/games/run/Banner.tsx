import { useEffect, useRef } from 'react';
import { GROUND, H, WORLDS, type Ent } from './levels';
import { renderRun } from './render';

const VW = 200;
const VH = 112;

/** Still frame of the desert stage for the games list. */
export function RunBanner() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const ents: Ent[] = [
      { kind: 'thorn', x: 52, y: GROUND - 12, w: 10, h: 12 },
      { kind: 'box', x: 96, y: GROUND - 50, w: 14, h: 13, item: 'dove' },
      { kind: 'bread', x: 124, y: GROUND - 30, w: 9, h: 5 },
      { kind: 'bread', x: 138, y: GROUND - 36, w: 9, h: 5 },
      { kind: 'bread', x: 152, y: GROUND - 30, w: 9, h: 5 },
      { kind: 'snake', x: 168, y: GROUND - 4, w: 16, h: 4 },
      { kind: 'bird', x: 180, y: GROUND - 44, w: 14, h: 7 },
    ];
    ctx.setTransform(1, 0, 0, 1, 0, -(H - VH));
    renderRun(ctx, {
      world: WORLDS[0],
      cam: 0,
      time: 0.35,
      ents,
      viewW: VW,
      pops: [],
      player: { x: 40, feet: GROUND - 26, grounded: false, ducking: false, dead: false, dove: true, halo: false, staff: false, blink: false },
    });
  }, []);
  return <canvas ref={ref} width={VW} height={VH} className="pixelated block h-full w-full" aria-hidden />;
}
