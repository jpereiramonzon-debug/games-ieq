/**
 * Two-player rooms over WebRTC (PeerJS). The host's peer id carries the room
 * code; the guest connects to it. Messages are small JSON objects; see
 * docs/multiplayer.md for the protocol.
 */
import Peer, { type DataConnection, type PeerOptions } from 'peerjs';

export const PROTOCOL = 1;
export type Role = 'host' | 'guest';
export type Status = 'starting' | 'waiting' | 'connecting' | 'open' | 'lost' | 'closed' | 'error';
export type Msg = { t: string; [k: string]: unknown };

const PREFIX = 'jogosieq-davi-';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode = () => Array.from({ length: 5 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);

function options(): PeerOptions {
  const test = (window as unknown as { __peerConfig?: PeerOptions }).__peerConfig;
  if (test) return test;
  return {
    debug: 0,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] },
  };
}

type Listener = (m: Msg) => void;

export class Room {
  readonly role: Role;
  readonly code: string;
  status: Status = 'starting';
  error = '';
  rtt = 0;
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private listeners = new Map<string, Set<Listener>>();
  private statusListeners = new Set<() => void>();
  private lastSeen = 0;
  private timer = 0;

  constructor(role: Role, code: string) {
    this.role = role;
    this.code = code;
  }

  /** Subscribe to one message type ('*' for all); returns the unsubscribe function. */
  on(type: string, fn: Listener) {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    set.add(fn);
    return () => void set!.delete(fn);
  }
  onStatus(fn: () => void) {
    this.statusListeners.add(fn);
    return () => void this.statusListeners.delete(fn);
  }
  send(m: Msg) {
    if (this.conn?.open) this.conn.send(m);
  }
  close() {
    this.send({ t: 'bye' });
    window.clearInterval(this.timer);
    window.setTimeout(() => {
      this.conn?.close();
      this.peer?.destroy();
    }, 50);
    this.setStatus('closed');
  }

  private setStatus(s: Status, error = '') {
    if (this.status === 'closed' && s !== 'closed') return;
    this.status = s;
    this.error = error;
    this.statusListeners.forEach((f) => f());
  }
  private emit(m: Msg) {
    this.listeners.get(m.t)?.forEach((f) => f(m));
    this.listeners.get('*')?.forEach((f) => f(m));
  }
  private attach(conn: DataConnection) {
    this.conn = conn;
    conn.on('data', (raw) => {
      const m = raw as Msg;
      if (!m || typeof m.t !== 'string') return;
      this.lastSeen = performance.now();
      if (this.status === 'lost') this.setStatus('open');
      if (m.t === 'ping') return this.send({ t: 'pong', at: m.at });
      if (m.t === 'pong') {
        this.rtt = Math.round(performance.now() - (m.at as number));
        return;
      }
      if (m.t === 'hello' && this.role === 'host') {
        if (m.v !== PROTOCOL) {
          this.send({ t: 'refuse', reason: 'version' });
          return;
        }
        this.send({ t: 'welcome', v: PROTOCOL });
        this.setStatus('open');
      }
      if (m.t === 'welcome' && this.role === 'guest') this.setStatus('open');
      if (m.t === 'refuse') this.setStatus('error', 'As duas telas estão com versões diferentes do jogo. Atualizem a página.');
      if (m.t === 'bye') this.setStatus('closed', 'O outro jogador saiu da sala.');
      this.emit(m);
    });
    conn.on('close', () => this.setStatus('closed', 'A conexão foi encerrada.'));
    conn.on('error', () => this.setStatus('lost'));
    const opened = () => {
      this.lastSeen = performance.now();
      if (this.role === 'guest') this.send({ t: 'hello', v: PROTOCOL });
    };
    if (conn.open) opened();
    else conn.on('open', opened);
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.send({ t: 'ping', at: performance.now() });
      if (this.status === 'open' && performance.now() - this.lastSeen > 5000) this.setStatus('lost');
    }, 1500);
  }

  /** Host: register the room code and wait for the guest. */
  host() {
    const peer = new Peer(PREFIX + this.code, options());
    this.peer = peer;
    peer.on('open', () => this.setStatus('waiting'));
    peer.on('connection', (conn) => {
      if (this.conn?.open) {
        conn.on('open', () => {
          conn.send({ t: 'refuse', reason: 'full' });
          window.setTimeout(() => conn.close(), 200);
        });
        return;
      }
      this.attach(conn);
    });
    peer.on('disconnected', () => peer.reconnect());
    peer.on('error', (e: { type?: string }) => {
      if (e.type === 'unavailable-id') this.setStatus('error', 'Esse código já está em uso. Crie outra sala.');
      else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') this.setStatus('error', 'Sem acesso ao servidor de salas. Verifique a internet.');
      else if (this.status !== 'open') this.setStatus('error', 'Não foi possível criar a sala.');
    });
    return this;
  }

  /** Guest: connect to the host's room code. */
  join() {
    const peer = new Peer(options());
    this.peer = peer;
    this.setStatus('connecting');
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + this.code, { reliable: true, serialization: 'json' });
      this.attach(conn);
      window.setTimeout(() => {
        if (this.status === 'connecting') this.setStatus('error', 'Não foi possível conectar. Confira o código, ou tentem os dois no mesmo Wi‑Fi.');
      }, 15000);
    });
    peer.on('error', (e: { type?: string }) => {
      if (e.type === 'peer-unavailable') this.setStatus('error', 'Sala não encontrada. Confira o código com quem criou a sala.');
      else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') this.setStatus('error', 'Sem acesso ao servidor de salas. Verifique a internet.');
      else this.setStatus('error', 'Não foi possível conectar.');
    });
    return this;
  }
}

/** Deterministic random numbers from a shared seed (same draws on both phones). */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
