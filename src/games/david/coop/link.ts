/** React glue for the two-player room: status re-renders, message subscriptions and the shared room. */
import { useEffect, useReducer, useRef } from 'react';
import type { Msg, Role, Room } from '../../../net/room';

/** Re-render when the connection status changes. */
export function useRoomStatus(room: Room | null) {
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => (room ? room.onStatus(bump) : undefined), [room]);
  return room?.status ?? 'closed';
}

/** Run `fn` for every message of a type (the latest `fn` is always used). */
export function useMsg(room: Room | null, type: string, fn: (m: Msg) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => (room ? room.on(type, (m) => ref.current(m)) : undefined), [room, type]);
}

/** What every two-player challenge receives. */
export interface CoopProps {
  room: Room;
  role: Role;
  diff: number;
  seed: number;
  /** Called on both phones when the host declares the win. */
  onWin: (stars: number) => void;
}

/** Remote hero smoothing: keep a short buffer and draw ~100 ms in the past. */
export class Mate<S extends { x: number; y: number }> {
  private buf: { at: number; s: S }[] = [];
  last: S | null = null;
  push(s: S) {
    this.buf.push({ at: performance.now(), s });
    if (this.buf.length > 30) this.buf.shift();
    this.last = s;
  }
  /** Interpolated state, or the newest one when the buffer is short. */
  at(delay = 100): S | null {
    const t = performance.now() - delay;
    const b = this.buf;
    if (!b.length) return null;
    if (b.length === 1 || t <= b[0].at) return b[0].s;
    for (let i = b.length - 1; i > 0; i--) {
      if (b[i - 1].at <= t) {
        const a = b[i - 1];
        const z = b[i];
        if (t >= z.at) return z.s;
        const k = (t - a.at) / Math.max(1, z.at - a.at);
        return { ...z.s, x: a.s.x + (z.s.x - a.s.x) * k, y: a.s.y + (z.s.y - a.s.y) * k };
      }
    }
    return b[b.length - 1].s;
  }
  /** Milliseconds since the last update (used to warn about a stalled partner). */
  age() {
    return this.buf.length ? performance.now() - this.buf[this.buf.length - 1].at : Infinity;
  }
}
