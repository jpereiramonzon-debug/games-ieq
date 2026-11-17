/**
 * Pad sounds, described as data and built on any BaseAudioContext
 * (so the same code runs live and in offline renders used for level matching).
 */
import type { ChordMode } from '../music';

type WaveId = 'sine' | 'triangle' | 'square' | 'saw' | 'softsaw' | 'hollow' | 'organ' | 'glass';
type Voicing = 'sub' | 'root' | 'low' | 'open' | 'high' | 'wide';

interface Part {
  wave: WaveId;
  voicing: Voicing;
  unison: number; // oscillators per chord tone
  detune: number; // cents, half-width of the unison spread
  gain: number;
  cutoff: number; // lowpass Hz (ignored when formants are set)
  q?: number;
  lfoRate?: number; // slow filter movement
  lfoDepth?: number; // Hz
  drift?: number; // 0..1 slow level movement
  driftRate?: number;
  spread?: number; // 0..1 stereo width
  vibrato?: [rate: number, cents: number];
  formants?: [freq: number, q: number, gain: number][];
}

export interface Patch {
  id: string;
  hue: number;
  parts: Part[];
  /** Noise pushed through resonators tuned to the chord: breathy, glassy air. */
  air?: { gain: number; octaves: number[]; q: number };
  /** Untuned breath/hiss bed. */
  noise?: { gain: number; freq: number; q: number };
  /** Random high pings on chord tones. */
  sparkle?: { every: [number, number]; gain: number };
  /** Level trim so every sound sits at the same loudness. */
  trim: number;
}

export const PATCHES: Patch[] = [
  {
    id: 'aurora',
    hue: 265,
    trim: 0.46,
    parts: [
      { wave: 'softsaw', voicing: 'open', unison: 3, detune: 9, gain: 0.5, cutoff: 900, q: 0.6, lfoRate: 0.06, lfoDepth: 260, drift: 0.15, spread: 0.7 },
      { wave: 'softsaw', voicing: 'high', unison: 2, detune: 12, gain: 0.12, cutoff: 1800, lfoRate: 0.09, lfoDepth: 500, drift: 0.3, spread: 1 },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.32, cutoff: 400 },
    ],
    noise: { gain: 0.012, freq: 5200, q: 0.5 },
  },
  {
    id: 'strings',
    hue: 30,
    trim: 0.84,
    parts: [
      { wave: 'saw', voicing: 'wide', unison: 3, detune: 14, gain: 0.4, cutoff: 2300, q: 0.5, lfoRate: 0.1, lfoDepth: 600, drift: 0.12, spread: 0.9, vibrato: [5.2, 5] },
      { wave: 'saw', voicing: 'high', unison: 2, detune: 10, gain: 0.09, cutoff: 3400, drift: 0.25, spread: 1, vibrato: [5.6, 6] },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.16, cutoff: 400 },
    ],
  },
  {
    id: 'choir',
    hue: 330,
    trim: 0.34,
    parts: [
      { wave: 'softsaw', voicing: 'open', unison: 3, detune: 10, gain: 0.7, cutoff: 0, spread: 0.7, drift: 0.15, vibrato: [4.8, 8], formants: [[650, 5, 1], [1080, 6, 0.5], [2650, 8, 0.22]] },
      { wave: 'hollow', voicing: 'high', unison: 2, detune: 8, gain: 0.3, cutoff: 0, spread: 1, drift: 0.3, vibrato: [5.3, 7], formants: [[400, 5, 1], [800, 6, 0.4], [2800, 8, 0.18]] },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.2, cutoff: 400 },
    ],
    noise: { gain: 0.02, freq: 2400, q: 0.8 },
  },
  {
    id: 'crystal',
    hue: 185,
    trim: 0.4,
    parts: [
      { wave: 'glass', voicing: 'high', unison: 2, detune: 6, gain: 0.3, cutoff: 5200, drift: 0.4, driftRate: 0.21, spread: 1 },
      { wave: 'triangle', voicing: 'open', unison: 2, detune: 8, gain: 0.34, cutoff: 1400, lfoRate: 0.07, lfoDepth: 300, spread: 0.6 },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.2, cutoff: 400 },
    ],
    sparkle: { every: [0.35, 1.5], gain: 0.07 },
  },
  {
    id: 'organ',
    hue: 50,
    trim: 0.53,
    parts: [
      { wave: 'organ', voicing: 'open', unison: 2, detune: 4, gain: 0.5, cutoff: 2600, drift: 0.22, driftRate: 0.9, spread: 0.8 },
      { wave: 'organ', voicing: 'sub', unison: 1, detune: 0, gain: 0.22, cutoff: 1200 },
    ],
  },
  {
    id: 'analog',
    hue: 12,
    trim: 0.48,
    parts: [
      { wave: 'saw', voicing: 'open', unison: 3, detune: 18, gain: 0.5, cutoff: 720, q: 2.6, lfoRate: 0.05, lfoDepth: 330, spread: 0.8 },
      { wave: 'square', voicing: 'root', unison: 2, detune: 10, gain: 0.13, cutoff: 520, q: 1, spread: 0.4 },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.3, cutoff: 400 },
    ],
  },
  {
    id: 'deep',
    hue: 235,
    trim: 0.38,
    parts: [
      { wave: 'softsaw', voicing: 'low', unison: 3, detune: 10, gain: 0.6, cutoff: 330, q: 0.8, lfoRate: 0.04, lfoDepth: 130, drift: 0.2, spread: 0.6 },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.4, cutoff: 300 },
    ],
    air: { gain: 4, octaves: [2], q: 30 },
  },
  {
    id: 'air',
    hue: 150,
    trim: 0.7,
    parts: [
      { wave: 'sine', voicing: 'open', unison: 2, detune: 5, gain: 0.08, cutoff: 2000, drift: 0.3, spread: 0.8 },
      { wave: 'sine', voicing: 'sub', unison: 1, detune: 0, gain: 0.1, cutoff: 400 },
    ],
    air: { gain: 6, octaves: [2, 4], q: 45 },
    noise: { gain: 0.01, freq: 7000, q: 0.5 },
  },
];

export const patchById = (id: string): Patch => PATCHES.find((p) => p.id === id) ?? PATCHES[0];

const HARMONICS: Partial<Record<WaveId, number[]>> = {
  softsaw: Array.from({ length: 24 }, (_, i) => 1 / Math.pow(i + 1, 1.45)),
  hollow: Array.from({ length: 19 }, (_, i) => (i % 2 === 0 ? 1 / Math.pow(i + 1, 1.2) : 0.04 / (i + 1))),
  organ: [1, 0.6, 0.35, 0.4, 0, 0.15, 0, 0.2],
  glass: [1, 0.1, 0.3, 0, 0.12, 0, 0.06],
};

const waveCache = new WeakMap<BaseAudioContext, Map<WaveId, PeriodicWave>>();

export function setWave(ctx: BaseAudioContext, osc: OscillatorNode, wave: WaveId) {
  const harmonics = HARMONICS[wave];
  if (!harmonics) {
    osc.type = wave === 'saw' ? 'sawtooth' : (wave as OscillatorType);
    return;
  }
  let cache = waveCache.get(ctx);
  if (!cache) waveCache.set(ctx, (cache = new Map()));
  let pw = cache.get(wave);
  if (!pw) {
    const imag = new Float32Array(harmonics.length + 1);
    harmonics.forEach((h, i) => (imag[i + 1] = h));
    pw = ctx.createPeriodicWave(new Float32Array(harmonics.length + 1), imag);
    cache.set(wave, pw);
  }
  osc.setPeriodicWave(pw);
}

/** Chord tones as [semitones from root, level]. The third only appears in major/minor. */
export function voicingTones(voicing: Voicing, mode: ChordMode): [number, number][] {
  const third = mode === 'major' ? 4 : mode === 'minor' ? 3 : null;
  const withThird = (tones: [number, number][], at: number): [number, number][] =>
    third === null ? tones : [...tones, [at + third, 0.7]];
  switch (voicing) {
    case 'sub':
      return [[-12, 1]];
    case 'root':
      return [[0, 1]];
    case 'low':
      return withThird([[-12, 1], [-5, 0.7], [0, 0.8]], 0);
    case 'open':
      return withThird([[0, 1], [7, 0.75], [12, 0.8]], 12);
    case 'high':
      return withThird([[12, 1], [19, 0.7], [24, 0.6]], 24);
    case 'wide':
      return withThird([[-12, 0.7], [0, 1], [7, 0.75], [12, 0.8], [19, 0.45]], 12);
  }
}

export interface PadVoice {
  out: GainNode;
  /** Play one sparkle ping at an audio time (no-op for sounds without sparkle). */
  ping(time: number): void;
  stop(time: number): void;
  dispose(): void;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function buildPad(
  ctx: BaseAudioContext,
  patch: Patch,
  rootFreq: number,
  mode: ChordMode,
  noiseBuffer: AudioBuffer,
): PadVoice {
  const t0 = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = patch.trim;
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [out];
  const track = <T extends AudioNode>(n: T): T => (nodes.push(n), n);
  const startOsc = (freq: number, wave: WaveId, detune = 0) => {
    const osc = track(ctx.createOscillator());
    setWave(ctx, osc, wave);
    osc.frequency.value = freq;
    osc.detune.value = detune;
    osc.start(t0);
    sources.push(osc);
    return osc;
  };
  const lfo = (rate: number, depth: number, target: AudioParam) => {
    const osc = startOsc(rate * rand(0.85, 1.15), 'sine');
    const g = track(ctx.createGain());
    g.gain.value = depth;
    osc.connect(g).connect(target);
  };
  const noiseSource = () => {
    const src = track(ctx.createBufferSource());
    src.buffer = noiseBuffer;
    src.loop = true;
    src.start(t0, Math.random() * (noiseBuffer.duration - 0.1));
    sources.push(src);
    return src;
  };

  for (const part of patch.parts) {
    const tones = voicingTones(part.voicing, mode);
    const partGain = track(ctx.createGain());
    partGain.gain.value = part.gain;
    partGain.connect(out);

    // Tone shaping: either a moving lowpass or a bank of vowel formants.
    const shaper = track(ctx.createGain());
    if (part.formants) {
      for (const [f, q, g] of part.formants) {
        const bp = track(ctx.createBiquadFilter());
        bp.type = 'bandpass';
        bp.frequency.value = f;
        bp.Q.value = q;
        const fg = track(ctx.createGain());
        fg.gain.value = g * 2.2;
        shaper.connect(bp).connect(fg).connect(partGain);
      }
    } else {
      const lp = track(ctx.createBiquadFilter());
      lp.type = 'lowpass';
      lp.frequency.value = part.cutoff;
      lp.Q.value = part.q ?? 0.5;
      shaper.connect(lp).connect(partGain);
      if (part.lfoRate && part.lfoDepth) lfo(part.lfoRate, part.lfoDepth, lp.frequency);
    }
    if (part.drift) lfo(part.driftRate ?? 0.09, part.drift * part.gain, partGain.gain);

    const spread = part.spread ?? 0;
    const sides = [-spread, spread].map((p) => {
      const pan = track(ctx.createStereoPanner());
      pan.pan.value = p;
      pan.connect(shaper);
      return pan;
    });

    let vib: GainNode | null = null;
    if (part.vibrato) {
      vib = track(ctx.createGain());
      vib.gain.value = part.vibrato[1];
      startOsc(part.vibrato[0], 'sine').connect(vib);
    }

    const norm = 1 / Math.sqrt(tones.length * part.unison);
    let n = 0;
    for (const [semi, level] of tones) {
      for (let u = 0; u < part.unison; u++) {
        const offset = part.unison === 1 ? 0 : -part.detune + (2 * part.detune * u) / (part.unison - 1);
        const osc = startOsc(rootFreq * Math.pow(2, semi / 12), part.wave, offset + rand(-1.5, 1.5));
        if (vib) vib.connect(osc.detune);
        const g = track(ctx.createGain());
        g.gain.value = level * norm;
        osc.connect(g).connect(sides[n++ % 2]);
      }
    }
  }

  if (patch.air) {
    const src = noiseSource();
    const airGain = track(ctx.createGain());
    airGain.gain.value = patch.air.gain;
    airGain.connect(out);
    let i = 0;
    for (const [semi, level] of voicingTones('open', mode)) {
      for (const oct of patch.air.octaves) {
        const bp = track(ctx.createBiquadFilter());
        bp.type = 'bandpass';
        const freq = rootFreq * Math.pow(2, semi / 12) * oct;
        bp.frequency.value = freq;
        bp.Q.value = patch.air.q;
        const g = track(ctx.createGain());
        // A constant-Q band widens with pitch, so level it to keep every key equally loud.
        g.gain.value = level * Math.sqrt(180 / freq);
        const pan = track(ctx.createStereoPanner());
        pan.pan.value = i++ % 2 ? 0.6 : -0.6;
        src.connect(bp).connect(g).connect(pan).connect(airGain);
        lfo(rand(0.05, 0.16), g.gain.value * 0.6, g.gain);
      }
    }
  }

  if (patch.noise) {
    const bp = track(ctx.createBiquadFilter());
    bp.type = 'bandpass';
    bp.frequency.value = patch.noise.freq;
    bp.Q.value = patch.noise.q;
    const g = track(ctx.createGain());
    g.gain.value = patch.noise.gain;
    noiseSource().connect(bp).connect(g).connect(out);
  }

  const sparkleTones = voicingTones('open', mode);
  const ping = (time: number) => {
    if (!patch.sparkle) return;
    const [semi] = sparkleTones[Math.floor(Math.random() * sparkleTones.length)];
    const osc = ctx.createOscillator();
    osc.frequency.value = rootFreq * Math.pow(2, semi / 12) * (Math.random() < 0.5 ? 4 : 8);
    const g = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.9, 0.9);
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(patch.sparkle.gain * rand(0.4, 1), time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    osc.connect(g).connect(pan).connect(out);
    osc.start(time);
    osc.stop(time + 1.7);
    osc.onended = () => pan.disconnect();
  };

  return {
    out,
    ping,
    stop: (time) => sources.forEach((s) => s.stop(time)),
    dispose: () => nodes.forEach((n) => n.disconnect()),
  };
}

export function makeNoiseBuffer(ctx: BaseAudioContext, seconds = 3): AudioBuffer {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}
