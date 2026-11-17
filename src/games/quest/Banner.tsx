import { useEffect, useRef } from 'react';
import { drawPerson, LOOKS } from '../pixel/person';
import { buildMap, drawWater, paintMap, T } from './map';

const VW = 200;
const VH = 112;

/** Still frame of the village (Jesus, Pedro and the well) for the games list. */
export function QuestBanner() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const map = buildMap();
    const camX = 12 * T;
    const camY = 3 * T;
    ctx.drawImage(paintMap(map), camX, camY, VW, VH, 0, 0, VW, VH);
    drawWater(ctx, map, camX, camY, VW, VH, 0.3);
    drawPerson(ctx, LOOKS.woman, 72, 76, 'right', 0);
    drawPerson(ctx, LOOKS.jesus, 104, 92, 'down', 1);
    drawPerson(ctx, LOOKS.peter, 88, 98, 'down', 3);
    drawPerson(ctx, LOOKS.blind, 140, 104, 'left', 0);
  }, []);
  return <canvas ref={ref} width={VW} height={VH} className="pixelated block h-full w-full" aria-hidden />;
}
