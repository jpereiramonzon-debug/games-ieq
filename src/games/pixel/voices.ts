/**
 * Recorded voices of the story dialogs (Portuguese). Each line is found by a
 * hash of its exact text in the generated index; lines without a recording stay
 * silent. Only one line plays at a time and the music is lowered meanwhile.
 */
import { engine } from '../../audio/engine';
import { get } from '../../store';
import { duckBgm } from '../bgm';
import { VOICED } from '../voicesIndex';

/** FNV-1a over UTF-16 code units (same as the generator script). */
export function lineHash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

const urlOf = (text: string) => {
  const f = VOICED[lineHash(text)];
  return f ? `${import.meta.env.BASE_URL}falas/${f}.mp3` : null;
};
export const hasVoice = (text: string) => !!urlOf(text);

const cache = new Map<string, Promise<AudioBuffer | null>>();
function load(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((data) => engine.init().decodeAudioData(data))
      .catch(() => {
        cache.delete(url);
        return null;
      });
    cache.set(url, p);
  }
  return p;
}

let stop: (() => void) | null = null;
let token = 0;
let duckTimer = 0;

const enabled = () => get().storyVoices && get().lang === 'pt';

/** Fetch a line ahead of time (the next one in a dialog). */
export function preloadLine(text?: string) {
  const url = text && enabled() ? urlOf(text) : null;
  if (url) void load(url);
}

/**
 * Speak a dialog line with its recorded voice, cutting the previous one.
 * Resolves with the clip's length in seconds when it starts playing, or null
 * when the line has no recording (or it could not be played).
 */
export function speakLine(text: string): Promise<number | null> {
  stopLine();
  const url = enabled() ? urlOf(text) : null;
  if (!url) return Promise.resolve(null);
  const mine = ++token;
  return load(url).then((buf) => {
    if (!buf || mine !== token) return null;
    stop = engine.playBuffer(buf);
    duckBgm(true);
    window.clearTimeout(duckTimer);
    duckTimer = window.setTimeout(() => mine === token && duckBgm(false), buf.duration * 1000 + 150);
    return buf.duration;
  });
}

/** True when this line will be spoken (recording exists and voices are on). */
export const willSpeak = (text: string) => enabled() && !!urlOf(text);

export function stopLine() {
  token++;
  stop?.();
  stop = null;
  window.clearTimeout(duckTimer);
  duckBgm(false);
}
