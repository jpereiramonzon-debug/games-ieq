/**
 * Background music for the story games (Purrple Cat, CC BY 4.0).
 *
 * Architecture (replaces a version that created a new <audio> per switch):
 * - Two persistent decks (A/B), each an <audio> element routed through a
 *   Web Audio GainNode. Elements are never recreated, so phones that only let
 *   a media element start after a tap keep working after the first tap, and
 *   fades use gain ramps (iOS ignores element.volume).
 * - One reconcile() decides what should sound from a single source of truth:
 *   the deepest screen's request, the music setting, the worship pad and
 *   page visibility. Every async step carries a generation number, so a slow
 *   load can never start a track that is no longer selected.
 * - Files are kept in Cache Storage (persist across restarts, offline), loaded
 *   once per track even if requested many times, and verified; a broken file
 *   is purged and fetched again once, then the track is marked unavailable
 *   for a while without blocking the game.
 */
import { useEffect } from 'react';
import { engine } from '../audio/engine';
import { get, useStore } from '../store';

export type Track = 'menu' | 'davi' | 'sansao' | 'pedro' | 'noite' | 'noe' | 'jesus' | 'getsemani' | 'canaa' | 'deserto' | 'egito' | 'prisao' | 'reencontro' | 'enigma';

const VOL = 0.32;
/** Music level while a character's recorded line plays (1 = normal). */
let duckK = 1;
const FADE_IN = 0.9;
const FADE_OUT = 0.4;
const CACHE = 'aurapads-music-v1';
const RETRY_AFTER = 20_000;
const KEEP_URLS = 4;

export type BgmStatus = 'off' | 'waiting-tap' | 'loading' | 'playing' | 'error';

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode | null;
  track: string | null;
  stopTimer: number;
}

const urlOf = (track: string) => `${import.meta.env.BASE_URL}music/${track}.mp3`;

// ------------------------------------------------------------------ files

/** One load per track at a time; resolved object URLs are reused (LRU). */
const sources = new Map<string, Promise<string>>();
const objectUrls = new Map<string, string>();
const fromCache = new Set<string>();

async function loadFile(track: string): Promise<string> {
  const url = urlOf(track);
  if (!('caches' in window)) return url;
  let cache: Cache;
  try {
    cache = await caches.open(CACHE);
  } catch {
    return url; // storage blocked (private mode): stream from the network
  }
  let res = await cache.match(url);
  if (res) fromCache.add(track);
  else {
    res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    if (type && !type.includes('audio') && !type.includes('mpeg') && !type.includes('octet-stream')) throw new Error(`not audio: ${type}`);
    try {
      await cache.put(url, res.clone());
    } catch {
      /* quota: play without persisting */
    }
  }
  const blob = await res.blob();
  if (blob.size < 1024) throw new Error('empty file');
  const obj = URL.createObjectURL(blob);
  objectUrls.set(track, obj);
  evictUrls();
  return obj;
}

function source(track: string) {
  let p = sources.get(track);
  if (!p) {
    p = loadFile(track);
    sources.set(track, p);
    p.catch(() => sources.delete(track));
  }
  return p;
}

/** Forget a broken file (memory and Cache Storage) so the next load fetches it again. */
async function purge(track: string) {
  sources.delete(track);
  const obj = objectUrls.get(track);
  if (obj) {
    objectUrls.delete(track);
    URL.revokeObjectURL(obj);
  }
  fromCache.delete(track);
  try {
    const cache = await caches.open(CACHE);
    await cache.delete(urlOf(track));
  } catch {
    /* nothing cached */
  }
}

function evictUrls() {
  if (objectUrls.size <= KEEP_URLS) return;
  for (const [track, obj] of objectUrls) {
    if (objectUrls.size <= KEEP_URLS) break;
    if (decks.some((d) => d.track === track)) continue;
    objectUrls.delete(track);
    sources.delete(track);
    URL.revokeObjectURL(obj);
  }
}

// ------------------------------------------------------------------ decks

const decks: Deck[] = [];
let active: Deck | null = null;
let graphCtx: AudioContext | null = null;
let gen = 0;
let target: string | null = null;
let status: BgmStatus = 'off';
let lastError: string | null = null;
const failed = new Map<string, number>();
const retried = new Set<string>();
const recovering = new Set<string>();
let unlocked = false;
let aborts = 0;

/** A short silent WAV used to "bless" the elements during the first tap. */
const SILENCE = (() => {
  const n = 800;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const w = (o: number, s: string) => [...s].forEach((c, i) => (b[o + i] = c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n, true);
  w(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  w(36, 'data');
  v.setUint32(40, n, true);
  b.fill(128, 44);
  let s = '';
  b.forEach((x) => (s += String.fromCharCode(x)));
  return `data:audio/wav;base64,${btoa(s)}`;
})();

function makeDecks() {
  if (decks.length) return;
  for (let i = 0; i < 2; i++) {
    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    const deck: Deck = { el, gain: null, track: null, stopTimer: 0 };
    el.addEventListener('error', () => onDeckError(deck));
    // Paused by the system (call, other app, headphones unplugged): resume when allowed.
    el.addEventListener('pause', () => {
      if (deck === active && !el.ended && target && deck.track === target && !document.hidden) window.setTimeout(reconcile, 0);
    });
    decks.push(deck);
  }
}

/** Route the decks through Web Audio once the context exists (gain works on iOS too). */
function attachGraph() {
  const ctx = engine.ctx;
  if (!ctx || graphCtx === ctx) return;
  graphCtx = ctx;
  for (const d of decks) {
    try {
      const src = ctx.createMediaElementSource(d.el);
      d.gain = ctx.createGain();
      d.gain.gain.value = d === active && !d.el.paused ? VOL * duckK : 0;
      src.connect(d.gain).connect(ctx.destination);
      d.el.volume = 1;
    } catch {
      d.gain = null; // already attached or unsupported: fall back to element volume
    }
  }
}

/** Lower the music while someone speaks, and bring it back afterwards. */
export function duckBgm(on: boolean) {
  duckK = on ? 0.35 : 1;
  if (active && !active.el.paused) setLevel(active, VOL * duckK, on ? 0.2 : 0.6);
}

function setLevel(d: Deck, to: number, secs: number) {
  if (d.gain && graphCtx) {
    const g = d.gain.gain;
    const now = graphCtx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + Math.max(0.01, secs));
  } else d.el.volume = to;
}

function fadeOut(d: Deck | null) {
  if (!d) return;
  window.clearTimeout(d.stopTimer);
  setLevel(d, 0, FADE_OUT);
  d.stopTimer = window.setTimeout(
    () => {
      if (d !== active) d.el.pause();
    },
    FADE_OUT * 1000 + 60,
  );
}

/** First tap: create the context, attach the graph and unlock both elements. */
function unlock() {
  makeDecks();
  engine.init();
  attachGraph();
  if (!unlocked) {
    unlocked = true;
    for (const d of decks)
      if (!d.track) {
        d.el.src = SILENCE;
        d.el.play().then(
          () => !d.track && d.el.pause(),
          () => {},
        );
      }
  }
  if (status === 'waiting-tap' || (active && active.el.paused && target)) reconcile();
}

// ------------------------------------------------------------------ the single decision

/** Screens nest (hub 0 > story menu 1 > chapter 2): the deepest level mounted decides, even if it asks for silence. */
const stack: { level: number; track: string | null }[] = [];

function selected(): string | null {
  const top = stack.reduce<(typeof stack)[number] | null>((b, e) => (!b || e.level >= b.level ? e : b), null);
  return top?.track ?? null;
}

function desired(): string | null {
  const s = get();
  const t = selected();
  if (!t || !s.bgm || s.playing || document.hidden) return null;
  const f = failed.get(t);
  if (f && Date.now() - f < RETRY_AFTER) return null;
  return t;
}

function reconcile() {
  makeDecks();
  attachGraph();
  const want = desired();
  // Already right: just make sure it is really playing (it may have been interrupted).
  if (want === target) {
    if (want && active && active.track === want && active.el.paused && status !== 'loading') start(active, want, gen);
    return;
  }
  target = want;
  const g = ++gen;
  if (!want) {
    fadeOut(active);
    active = null;
    status = selected() && get().bgm && !get().playing && !document.hidden ? 'error' : 'off';
    if (status === 'off') lastError = null;
    return;
  }
  // The wanted track may still be on a deck (returning to it resumes where it was).
  const same = decks.find((d) => d.track === want);
  const deck = same ?? decks.find((d) => d !== active) ?? decks[0];
  if (active && active !== deck) fadeOut(active);
  window.clearTimeout(deck.stopTimer);
  active = deck;
  start(deck, want, g);
}

function start(deck: Deck, track: string, g: number) {
  status = 'loading';
  const fresh = deck.track !== track;
  deck.track = track;
  source(track)
    .then((url) => {
      if (g !== gen) return;
      if (fresh || !deck.el.src || deck.el.src === SILENCE) {
        deck.el.src = url;
        deck.el.currentTime = 0;
      }
      // A new track starts silent; a resumed one fades up from where its fade-out left it.
      if (fresh) setLevel(deck, 0, 0.01);
      return deck.el.play().then(() => {
        if (g !== gen) return;
        status = 'playing';
        aborts = 0;
        lastError = null;
        failed.delete(track);
        retried.delete(track);
        setLevel(deck, VOL * duckK, FADE_IN);
      });
    })
    .catch((err: unknown) => {
      if (g !== gen) return;
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError') {
        status = 'waiting-tap'; // the next tap (unlock) starts it
        return;
      }
      if (name === 'AbortError') {
        // Interrupted by the system (not by a newer request, which changes gen): try once more.
        if (aborts++ < 2) window.setTimeout(() => g === gen && deck.el.paused && start(deck, track, g), 50);
        return;
      }
      broken(deck, track, err instanceof Error ? err.message : String(err));
    });
}

function onDeckError(deck: Deck) {
  if (deck.el.src === SILENCE || !deck.track || deck !== active) return;
  broken(deck, deck.track, `media error ${deck.el.error?.code ?? 0}`);
}

/** A file that failed to load or decode (from play() or from the element's error event). */
function broken(deck: Deck, track: string, why: string) {
  // The same bad file reports twice (element error + play() rejection): handle it once.
  if (deck.track !== track || recovering.has(track)) return;
  // A cached copy that does not decode is purged and fetched again once.
  if (fromCache.has(track) && !retried.has(track)) {
    retried.add(track);
    recovering.add(track);
    void purge(track).then(() => {
      recovering.delete(track);
      deck.track = null;
      target = null;
      reconcile();
    });
    return;
  }
  fail(track, why);
}

/** Give up on a track for a while: silence, no retries in a loop, the game keeps running. */
function fail(track: string, why: string) {
  failed.set(track, Date.now());
  lastError = `${track}: ${why}`;
  status = 'error';
  void purge(track);
  if (active && active.track === track) {
    fadeOut(active);
    active.track = null;
    active = null;
  }
  target = null;
  if (import.meta.env.DEV) console.warn('[bgm]', lastError);
}

// ------------------------------------------------------------------ wiring

let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener('pointerdown', unlock, { capture: true });
  window.addEventListener('keydown', unlock, { capture: true });
  // Minimised or screen locked: pause; back: resume the same track where it was.
  document.addEventListener('visibilitychange', reconcile);
  window.addEventListener('pageshow', reconcile);
}

/** Play a track while the component is mounted; re-evaluated when music or the pad is toggled. */
export function useBgm(track: Track | null, level = 0) {
  const on = useStore((s) => s.bgm && !s.playing);
  useEffect(() => {
    wire();
    const entry = { level, track: track as string | null };
    stack.push(entry);
    reconcile();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      reconcile();
    };
  }, [track, level]);
  useEffect(() => reconcile(), [on]);
}

/** Current state, for the UI and for tests. */
export function bgmState() {
  return {
    selected: selected(),
    target,
    playing: active && !active.el.paused && status === 'playing' ? active.track : null,
    status,
    error: lastError,
    decks: decks.map((d) => ({
      track: d.track,
      paused: d.el.paused,
      time: Math.round(d.el.currentTime * 10) / 10,
      gain: d.gain ? Math.round((d.gain.gain.value as number) * 100) / 100 : d.el.volume,
    })),
  };
}

if (import.meta.env.DEV)
  (window as unknown as { __bgm: unknown }).__bgm = Object.assign(bgmState, {
    /** Ask for any file name (tests a missing file). */
    request(name: string | null) {
      wire();
      const entry = { level: 9, track: name };
      stack.push(entry);
      reconcile();
      return () => {
        stack.splice(stack.indexOf(entry), 1);
        reconcile();
      };
    },
    clearFailures() {
      failed.clear();
      retried.clear();
    },
  });
