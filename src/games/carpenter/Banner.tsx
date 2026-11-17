import { useEffect, useRef } from 'react';
import { drawPerson } from '../pixel/person';
import { icon } from '../pixel/icons';
import { paintMap, T } from '../quest/map';
import { buildMap, LOOK } from './world';

const VW = 200;
const VH = 112;

/** Still frame of the workshop yard for the games list. */
export function CarpenterBanner() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const camX = 13 * T;
    const camY = 5 * T;
    ctx.drawImage(paintMap(buildMap()), camX, camY, VW, VH, 0, 0, VW, VH);
    // Bench, with Jesus hammering and José and a villager nearby.
    const bx = 21 * T - camX;
    const by = 9 * T - camY;
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(bx - 1, by + 1, 34, 9);
    ctx.fillStyle = '#9a6234';
    ctx.fillRect(bx, by + 2, 32, 7);
    ctx.fillStyle = '#c08a4a';
    ctx.fillRect(bx, by + 2, 32, 2);
    ctx.fillStyle = '#3a2414';
    ctx.fillRect(bx + 1, by + 9, 4, 6);
    ctx.fillRect(bx + 27, by + 9, 4, 6);
    ctx.drawImage(icon('stool'), bx + 10, by - 8, 12, 12);
    drawPerson(ctx, LOOK.jesus, bx + 16, by + 30, 'up', 0);
    ctx.drawImage(icon('hammer'), bx + 20, by + 2, 10, 10);
    drawPerson(ctx, LOOK.jose, bx - 14, by + 34, 'right', 0);
    drawPerson(ctx, LOOK.sara, bx + 46, by + 26, 'left', 0);
    ctx.drawImage(icon('hand'), bx + 36, by - 6, 9, 9);
  }, []);
  return <canvas ref={ref} width={VW} height={VH} className="pixelated block h-full w-full" aria-hidden />;
}
