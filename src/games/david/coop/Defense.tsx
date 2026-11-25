/**
 * Contra os filisteus (1 Samuel 18:30): Philistine raiders come from both sides
 * toward Israel's camp. Davi (sling) covers the left half, Jônatas (bow) the
 * right half: tap a raider on your side to hit it; hit raiders drop their shields
 * and run away. Davi's phone simulates the raiders and sends them ~12 times a
 * second; Jônatas sends his shots and Davi resolves them.
 */
import { useEffect, useRef, useState } from 'react';
import { engine } from '../../../audio/engine';
import { buzz, byDiff, Panel, starsOf, useStage } from '../../pixel/stage';
import { drawBackdrop } from '../../platform/sky';
import { drawChar } from '../../platform/rig';
import { seeded } from '../../../net/room';
import { useMsg, type CoopProps } from './link';

interface Raider {
  id: number;
  x: number;
  side: -1 | 1;
  hp: number;
  speed: number;
  flee: number;
  shield: boolean;
}
interface Shot {
  from: -1 | 1;
  x: number;
  tx: number;
  t: number;
  id: number;
}

const FLOOR = 158;

export function Defense({ room, role, diff, seed, onWin }: CoopProps) {
  const waves = byDiff(diff, [3, 4, 5]);
  const mine: -1 | 1 = role === 'host' ? -1 : 1;
  const rnd = useRef(seeded(seed));
  const sim = useRef({ raiders: [] as Raider[], wave: 0, spawnLeft: 0, spawnT: 1.5, camp: 5, nextId: 1, done: false, pause: 2 });
  const view = useRef({ raiders: [] as Raider[], camp: 5, wave: 0 });
  const shots = useRef<Shot[]>([]);
  const [hud, setHud] = useState({ camp: 5, wave: 0, lost: false, won: false });
  const lastSend = useRef(0);

  const startWave = (k: number) => {
    const s = sim.current;
    s.wave = k;
    s.spawnLeft = byDiff(diff, [5, 7, 9]) + k * 2;
    s.spawnT = 0.5;
  };
  useEffect(() => {
    if (role === 'host') startWave(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hit = (id: number) => {
    const s = sim.current;
    const r = s.raiders.find((q) => q.id === id && q.flee === 0);
    if (!r) return;
    r.hp -= 1;
    if (r.hp <= 0) {
      r.flee = 1;
      r.shield = false;
    }
  };
  useMsg(room, 'g', (m) => {
    if (m.k === 'shot' && role === 'host') {
      window.setTimeout(() => hit(m.id as number), 250);
    } else if (m.k === 'raiders' && role === 'guest') {
      const prev = new Map(view.current.raiders.map((r) => [r.id, r]));
      view.current = { raiders: (m.r as Raider[]).map((r) => ({ ...r, x: prev.get(r.id)?.x ?? r.x, tx: r.x }) as Raider & { tx: number }), camp: m.camp as number, wave: m.wave as number };
      setHud((h) => (h.camp !== m.camp || h.wave !== m.wave ? { ...h, camp: m.camp as number, wave: m.wave as number } : h));
    } else if (m.k === 'shotfx') {
      shots.current.push(m.s as Shot);
    } else if (m.k === 'over') {
      if (m.won) {
        engine.sfx('yay');
        setHud((h) => ({ ...h, won: true }));
        window.setTimeout(() => onWin(m.stars as number), 1200);
      } else setHud((h) => ({ ...h, lost: true }));
    } else if (m.k === 'again' && role === 'guest') setHud({ camp: 5, wave: 1, lost: false, won: false });
  });

  const cv = useStage((ctx, w, rawDt, t) => {
    const dt = Math.min(rawDt, 1 / 30);
    const cx = w / 2;
    // ---------------- host simulation
    if (role === 'host' && !hud.lost && !hud.won) {
      const s = sim.current;
      if (s.pause > 0) s.pause -= dt;
      else if (s.spawnLeft > 0) {
        s.spawnT -= dt;
        if (s.spawnT <= 0) {
          const side: -1 | 1 = rnd.current() < 0.5 ? -1 : 1;
          const shield = rnd.current() < 0.15 + 0.1 * s.wave;
          s.raiders.push({ id: s.nextId++, x: side < 0 ? -10 : w + 10, side, hp: shield ? 2 : 1, speed: 14 + s.wave * 3 + diff * 3 + rnd.current() * 6, flee: 0, shield });
          s.spawnLeft--;
          s.spawnT = Math.max(0.7, 2.4 - s.wave * 0.25 - diff * 0.3) * (0.7 + rnd.current() * 0.6);
        }
      } else if (!s.raiders.some((r) => r.flee === 0)) {
        if (s.wave >= waves) {
          s.done = true;
          const stars = starsOf(s.camp / 5);
          room.send({ t: 'g', k: 'over', won: true, stars });
          engine.sfx('yay');
          setHud((h) => ({ ...h, won: true }));
          window.setTimeout(() => onWin(stars), 1200);
        } else {
          startWave(s.wave + 1);
          s.pause = 2;
        }
      }
      for (const r of s.raiders) {
        // Raiders walk toward the camp; hit ones run back the way they came.
        if (r.flee) r.x += r.side * 60 * dt;
        else r.x -= r.side * r.speed * dt;
        if (!r.flee && Math.abs(r.x - cx) < 26) {
          r.flee = 1;
          s.camp -= 1;
          engine.sfx('bonk');
          buzz(40);
          if (s.camp <= 0) {
            room.send({ t: 'g', k: 'over', won: false });
            setHud((h) => ({ ...h, lost: true, camp: 0 }));
          }
        }
      }
      s.raiders = s.raiders.filter((r) => r.x > -30 && r.x < w + 30);
      view.current = { raiders: s.raiders, camp: s.camp, wave: s.wave };
      if (performance.now() - lastSend.current > 80) {
        lastSend.current = performance.now();
        room.send({ t: 'g', k: 'raiders', r: s.raiders.map((r) => ({ ...r, x: Math.round(r.x) })), camp: s.camp, wave: s.wave });
        if (hud.camp !== s.camp || hud.wave !== s.wave) setHud((h) => ({ ...h, camp: s.camp, wave: s.wave }));
      }
    } else if (role === 'guest') {
      for (const r of view.current.raiders as (Raider & { tx?: number })[]) if (r.tx !== undefined) r.x += (r.tx - r.x) * Math.min(1, dt * 10);
    }
    // ---------------- drawing
    drawBackdrop(ctx, w, 180, 'desert', 'day', t, 100);
    ctx.fillStyle = '#c89850';
    ctx.fillRect(0, FLOOR, w, 180 - FLOOR);
    // Camp in the middle.
    for (const [dx, col] of [
      [-18, '#e8dcc0'],
      [6, '#d8c8a0'],
    ] as [number, string][]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx + dx - 14, FLOOR);
      ctx.lineTo(cx + dx, FLOOR - 26);
      ctx.lineTo(cx + dx + 14, FLOOR);
      ctx.fill();
    }
    ctx.fillStyle = '#5a3a1e';
    ctx.fillRect(cx - 1, FLOOR - 40, 2, 16);
    ctx.fillStyle = '#2a5ab0';
    ctx.fillRect(cx + 1, FLOOR - 40, 10, 6);
    // Halves: whose side is whose.
    ctx.fillStyle = mine < 0 ? 'rgba(120,170,255,0.08)' : 'rgba(255,200,120,0.08)';
    ctx.fillRect(mine < 0 ? 0 : cx, 0, cx, FLOOR);
    const raiders = view.current.raiders;
    for (const r of raiders) {
      drawChar(ctx, 'soldado', r.flee ? 'run' : 'walk', Math.floor(t * (r.flee ? 14 : 8) + r.id) % 6, r.x, FLOOR, r.side < 0 ? !!r.flee : !r.flee);
      if (r.shield && !r.flee) {
        ctx.fillStyle = '#c8a040';
        ctx.fillRect(r.x + (r.side < 0 ? 6 : -10), FLOOR - 26, 4, 12);
      }
    }
    drawChar(ctx, 'davi', 'attack', Math.floor(t * 4) % 4 === 0 ? 1 : 0, cx - 40, FLOOR, true);
    drawChar(ctx, 'jonatas', 'idle', Math.floor(t * 5) % 4, cx + 40, FLOOR, false);
    // Shots in flight.
    shots.current = shots.current.filter((s) => (s.t += dt) < 0.3);
    for (const s of shots.current) {
      const k = s.t / 0.3;
      const x = s.x + (s.tx - s.x) * k;
      const y = FLOOR - 26 - Math.sin(k * Math.PI) * 10;
      ctx.fillStyle = s.from < 0 ? '#8a8a90' : '#6a4424';
      if (s.from < 0) ctx.fillRect(x - 1, y - 1, 3, 3);
      else ctx.fillRect(x - 4, y, 8, 1);
    }
  });

  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (hud.lost || hud.won) return;
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * c.width) / r.width;
    const w = c.width;
    if ((x < w / 2 ? -1 : 1) !== mine) {
      engine.playNote(52, 'pluck', 0, 0.1);
      return;
    }
    const list = view.current.raiders.filter((q) => !q.flee && (q.x < w / 2 ? -1 : 1) === mine);
    const target = list.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
    if (!target || Math.abs(target.x - x) > 28) return;
    engine.playNote(mine < 0 ? 67 : 74, 'pluck', 0, 0.12);
    const shot: Shot = { from: mine, x: w / 2 + mine * 36, tx: target.x, t: 0, id: target.id };
    shots.current.push(shot);
    room.send({ t: 'g', k: 'shotfx', s: shot });
    if (role === 'host') window.setTimeout(() => hit(target.id), 250);
    else room.send({ t: 'g', k: 'shot', id: target.id });
  };
  const again = () => {
    if (role !== 'host') return;
    sim.current = { raiders: [], wave: 0, spawnLeft: 0, spawnT: 1.5, camp: 5, nextId: 1, done: false, pause: 2 };
    rnd.current = seeded(seed + 7);
    startWave(1);
    setHud({ camp: 5, wave: 1, lost: false, won: false });
    room.send({ t: 'g', k: 'again' });
  };
  if (import.meta.env.DEV) (window as unknown as { __def: unknown }).__def = { sim, view, hit, mine };
  return (
    <>
      <canvas ref={cv} onPointerDown={tap} className="pixelated absolute inset-0 h-full w-full touch-none" aria-label="Defesa do acampamento" />
      <div className="pointer-events-none absolute left-[max(3.25rem,calc(env(safe-area-inset-left)+2.75rem))] right-2 top-2 flex flex-wrap items-center gap-2">
        <Panel className="text-sm">
          Onda {Math.max(1, hud.wave)}/{waves} · Acampamento: {'⛺'.repeat(Math.max(0, hud.camp))}
        </Panel>
        <Panel className="text-sm">{role === 'host' ? 'Você é Davi: toque nos filisteus da ESQUERDA' : 'Você é Jônatas: toque nos filisteus da DIREITA'}</Panel>
      </div>
      {hud.lost && (
        <div className="absolute inset-0 z-20 flex bg-black/60 p-3">
          <div className="rpg-frame rpg-text m-auto flex max-w-md flex-col items-center gap-2 p-3 text-center">
            <p className="text-lg">O acampamento foi invadido!</p>
            <p className="text-sm">Cada um cuida do seu lado: se um lado fica sem defesa, os dois perdem.</p>
            {role === 'host' ? (
              <button className="rpg-wood h-11 w-full text-lg" onClick={again}>
                Tentar de novo
              </button>
            ) : (
              <p className="text-sm text-[#ffe08a]">Davi vai recomeçar a defesa…</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
