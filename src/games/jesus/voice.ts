import { engine } from '../../audio/engine';
import { get } from '../../store';
import { DROP, EAR, EARLY, FAILED, HELLO, MEMORY, MISS, PRAISE, rank, START, TIME } from './phrases';
import { VOICE_TAKES } from './voiceTakes';

/** Portuguese line → recorded clip id (same order as the voice script). */
const ids = new Map<string, string>();
const reg = (list: string[], prefix: string) => list.forEach((text, i) => ids.set(text, `${prefix}-${String(i + 1).padStart(2, '0')}`));
reg(MISS.pt, 'erro');
reg(EARLY.pt, 'vacuo');
reg(DROP.pt, 'soltou');
reg(MEMORY.pt, 'memoria');
reg(EAR.pt, 'ouvido');
reg(TIME.pt, 'tempo');
reg(PRAISE.pt, 'elogio');
reg([HELLO.pt, START.pt, FAILED.pt], 'geral');
reg([95, 80, 60, 35, 0].map((a) => rank('pt', a)), 'titulo');

const cache = new Map<string, Promise<AudioBuffer | null>>();
const load = (url: string) => {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => engine.init().decodeAudioData(data))
      .catch(() => null);
    cache.set(url, p);
  }
  return p;
};

const urlsFor = (id: string) => (VOICE_TAKES[id] ?? []).map((take) => `/voz/${id}-${take}.mp3`);

let stopCurrent: (() => void) | null = null;
let token = 0;

/**
 * Talking turns. Jesus finishes a line before starting another, and leaves a short
 * breath after it, so a burst of mistakes gets one joke you can actually hear
 * instead of a line per mistake cutting each other off.
 */
const AFTER_LINE = 1600; // ms of quiet after a recorded line
const READ_TIME = 2800; // ms a written-only line stays before the next one
let busyUntil = 0;

/** Ask for the next talking turn. Forced lines (results, menu, start) always get it. */
export function claimTalk(force = false): boolean {
  const now = performance.now();
  if (!force && now < busyUntil) return false;
  const voiced = get().jesusVoice && get().lang === 'pt';
  busyUntil = now + (voiced ? 4000 : READ_TIME); // refined once the clip starts
  return true;
}

/** Say a line out loud with Jesus's recorded voice, if there is one (Portuguese only). */
export function speak(text: string, delay = 0) {
  // A delayed line joins the queue only when its time comes, so it never cancels
  // the line that is playing (or still loading) before it.
  if (delay) {
    window.setTimeout(() => speak(text), delay);
    return;
  }
  const s = get();
  if (!s.jesusVoice || s.lang !== 'pt') return;
  const id = ids.get(text.replace(/!$/, '')) ?? ids.get(text);
  const urls = id ? urlsFor(id) : [];
  if (!urls.length) return;
  const mine = ++token;
  const url = urls[Math.floor(Math.random() * urls.length)];
  void load(url).then((buffer) => {
    if (!buffer || mine !== token) return;
    if (mine !== token) return;
    stopCurrent?.();
    stopCurrent = engine.playBuffer(buffer);
    busyUntil = performance.now() + buffer.duration * 1000 + AFTER_LINE;
  });
}

export function stopSpeaking() {
  token++;
  stopCurrent?.();
  stopCurrent = null;
}

/** Fetch the clips for some groups ahead of time so the first joke is not late. */
export function preloadVoices(prefixes: string[]) {
  if (get().lang !== 'pt' || !get().jesusVoice) return;
  for (const id of Object.keys(VOICE_TAKES)) {
    if (prefixes.some((p) => id.startsWith(p))) urlsFor(id).forEach((u) => void load(u));
  }
}
