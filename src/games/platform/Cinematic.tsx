/**
 * Cinematic transition between chapters: the hero walks, the camera pulls
 * back, time passes (the sun crosses to the horizon, the sky turns orange,
 * night falls, stars and torches light up, or a storm rolls in), then the
 * name of the next place appears with a line of narration. Tap to skip.
 */
import { useEffect, useRef, useState } from 'react';
import { engine } from '../../audio/engine';
import { useStage, Stage } from '../pixel/stage';
import type { ThemeId, TimeOfDay } from './level';
import { drawChar, type CastId } from './rig';
import { drawBackdrop, drawLights, mixHex, SKIES } from './sky';

const DUR = 6.2;
const ease = (k: number) => k * k * (3 - 2 * k);

const GROUND: Record<ThemeId, [string, string]> = {
  village: ['#5aa03a', '#8a6a44'],
  shore: ['#e8d8a0', '#c8a870'],
  desert: ['#e0b878', '#c09050'],
  egypt: ['#e0b878', '#c09050'],
  palace: ['#9a8aa6', '#5a4e66'],
  temple: ['#e4dccb', '#b8ac96'],
  cave: ['#6a5a4a', '#4a3e32'],
  night: ['#3a6a3a', '#5a4a3a'],
  persia: ['#c8a878', '#9a7a52'],
  garden: ['#4a9a3a', '#d8ccb0'],
  susa: ['#c8b498', '#8a7458'],
};

export function Cinematic({
  from,
  to,
  theme,
  cast,
  place,
  label,
  title,
  sub,
  caption,
  onDone,
}: {
  from: TimeOfDay;
  to: TimeOfDay;
  theme: ThemeId;
  cast: CastId;
  place: string;
  label: string;
  title: string;
  sub: string;
  caption?: string;
  onDone: () => void;
}) {
  const t0 = useRef(performance.now());
  const done = useRef(false);
  const [card, setCard] = useState(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useEffect(() => {
    engine.playNote(62, 'bell', 0, 0.2);
    engine.playNote(69, 'bell', 0.4, 0.18);
    const a = window.setTimeout(() => {
      setCard(true);
      engine.playNote(74, 'bell', 0, 0.22);
      engine.playNote(78, 'bell', 0.2, 0.2);
    }, 3600);
    const b = window.setTimeout(finish, DUR * 1000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cv = useStage((ctx, w, _dt, t) => {
    const e = (performance.now() - t0.current) / 1000;
    const H = 180;
    // Time of day blends between 1.0 s and 4.0 s.
    const k = ease(Math.max(0, Math.min(1, (e - 1) / 3)));
    const A = SKIES[from];
    const B = SKIES[to];
    // Camera: starts close on the hero and pulls back.
    const zoom = 1.7 - 0.7 * ease(Math.min(1, e / 3.2));
    const heroX = 40 + e * 26;
    ctx.save();
    const fx = Math.min(heroX, w * 0.5);
    ctx.translate(fx, H - 24);
    ctx.scale(zoom, zoom);
    ctx.translate(-fx, -(H - 24));
    // Sky: interpolated gradient, a sun that travels and stars that come out.
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mixHex(A.top, B.top, k));
    g.addColorStop(1, mixHex(A.bottom, B.bottom, k));
    ctx.fillStyle = g;
    ctx.fillRect(-w, -H, w * 3, H * 3);
    const stars = A.stars + (B.stars - A.stars) * k;
    for (let i = 0; i < 80; i++) {
      ctx.globalAlpha = stars * (0.5 + 0.5 * Math.sin(t * 2 + i));
      ctx.fillStyle = '#fff';
      ctx.fillRect((i * 137) % w, (i * 53) % 110, 1, 1);
    }
    ctx.globalAlpha = 1;
    const orbA = A.orb;
    const orbB = B.orb;
    if (orbA || orbB) {
      // Sun sets (or rises) along an arc; the moon fades in at night.
      const sx = orbA && orbB ? orbA[0] + (orbB[0] - orbA[0]) * k : (orbA ?? orbB)![0];
      const sy = orbA && orbB ? orbA[1] + (orbB[1] - orbA[1]) * k - Math.sin(k * Math.PI) * 0.12 : (orbA ?? orbB)![1];
      const r = orbA && orbB ? orbA[2] + (orbB[2] - orbA[2]) * k : (orbA ?? orbB)![2];
      const c = orbA && orbB ? mixHex(orbA[3], orbB[3], k) : (orbA ?? orbB)![3];
      ctx.globalAlpha = orbA && orbB ? 1 : orbA ? 1 - k : k;
      const halo = ctx.createRadialGradient(sx * w, sy * H, r * 0.5, sx * w, sy * H, r * 4);
      halo.addColorStop(0, c);
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha *= 0.4;
      ctx.fillStyle = halo;
      ctx.fillRect(sx * w - r * 4, sy * H - r * 4, r * 8, r * 8);
      ctx.globalAlpha = orbA && orbB ? 1 : orbA ? 1 - k : k;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(sx * w, sy * H, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Scenery crossfades between the two times of day (skip their own skies).
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w, 60, w * 3, H);
    ctx.clip();
    ctx.globalAlpha = 1 - k;
    drawBackdrop(ctx, w, H, theme, from, t, e * 10, 0, 1 - k);
    drawBackdrop(ctx, w, H, theme, to, t, e * 10, 0, k);
    ctx.restore();
    // Ground with posts that light up at dusk.
    const [top, soil] = GROUND[theme];
    const dark = A.dark + (B.dark - A.dark) * k;
    ctx.fillStyle = mixHex(soil, '#0a0c18', dark * 0.7);
    ctx.fillRect(-w, H - 24, w * 3, 40);
    ctx.fillStyle = mixHex(top, '#0a0c18', dark * 0.7);
    ctx.fillRect(-w, H - 24, w * 3, 4);
    const lights: [number, number, number][] = [];
    for (let x = 70; x < w + 60; x += 130) {
      ctx.fillStyle = '#4a2e18';
      ctx.fillRect(x, H - 44, 3, 20);
      if (dark > 0.15) {
        const fl = Math.sin(t * 12 + x) * 1.2;
        ctx.globalAlpha = Math.min(1, (dark - 0.15) * 4);
        ctx.fillStyle = '#ff8a2a';
        ctx.fillRect(x - 1, H - 50 + fl, 5, 6);
        ctx.fillStyle = '#ffe066';
        ctx.fillRect(x, H - 48 + fl, 3, 3);
        ctx.globalAlpha = 1;
        lights.push([x + 1, H - 47, 46]);
      }
    }
    if (B.rain && k > 0.3)
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `rgba(190,210,240,${(k - 0.3) * 0.8})`;
        ctx.fillRect(((i * 53 + t * 260) % (w + 40)) - 20, (i * 97 + t * 520) % H, 1, 6);
      }
    drawChar(ctx, cast, 'walk', Math.floor(e * 11), heroX, H - 24, false);
    lights.push([heroX, H - 44, 50]);
    ctx.restore();
    drawLights(
      ctx,
      w,
      H,
      dark,
      lights.map(([x, y, r]) => [fx + (x - fx) * zoom, H - 24 + (y - (H - 24)) * zoom, r * zoom]),
    );
    // Letterbox bars.
    const bar = 14 * Math.min(1, e * 2) * (e > DUR - 0.5 ? (DUR - e) * 2 : 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, bar);
    ctx.fillRect(0, H - bar, w, bar);
    // Fade in and out.
    const fade = e < 0.4 ? 1 - e / 0.4 : e > DUR - 0.4 ? (e - (DUR - 0.4)) / 0.4 : 0;
    if (fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, w, H);
    }
  });

  return (
    <div className="absolute inset-0 z-20" onClick={() => performance.now() - t0.current > 600 && finish()}>
      <Stage cv={cv} />
      {card && (
        <div className="animate-pop pointer-events-none absolute inset-x-0 top-[18%] flex flex-col items-center text-center text-white drop-shadow-[2px_2px_0_#000]">
          <span className="text-sm tracking-[0.3em] text-[#ffe08a]">{label}</span>
          <span className="text-4xl">{place}</span>
          <span className="mt-1 text-xl">{title}</span>
          <span className="text-sm opacity-80">{sub}</span>
          {caption && <span className="rpg-frame rpg-text mt-3 max-w-xl px-3 py-1.5 text-base leading-snug drop-shadow-none">{caption}</span>}
        </div>
      )}
      <span className="pointer-events-none absolute bottom-4 right-4 text-xs text-white/70">Toque para pular</span>
    </div>
  );
}
