/**
 * AuraPads audio engine: pad layers with crossfades, a convolution reverb,
 * an ensemble chorus, playable instruments, drums and one-shot effects.
 */
import { midiToFreq, padRootMidi, type ChordMode } from '../music';
import { buildPad, makeNoiseBuffer, patchById, setWave, type PadVoice } from './patches';

export type ReverbSize = 'small' | 'medium' | 'cathedral';
export type Instrument = 'bell' | 'keys' | 'pluck' | 'electric';
export type DrumId = 'kick' | 'snare' | 'hat' | 'clap' | 'tom' | 'crash';
export type FxId = 'swell' | 'riser' | 'impact' | 'chimes' | 'subdrop' | 'reverse' | 'thunder' | 'wave';

export interface PadState {
  key: number | null; // pitch class, null = silence
  mode: ChordMode;
  a: string;
  b: string | null;
}

interface Layer {
  voice: PadVoice;
  env: GainNode;
  sig: string;
  sparkleTimer?: number;
}

const RT60: Record<ReverbSize, number> = { small: 1.6, medium: 3.8, cathedral: 7.5 };

/** Decaying, progressively darker stereo noise: a smooth hall with no metallic ringing. */
function makeImpulse(ctx: BaseAudioContext, rt60: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * rt60 * 1.15);
  const buf = ctx.createBuffer(2, len, sr);
  const onset = Math.floor(sr * 0.03);
  const tail = Math.floor(len * 0.12);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const coef = 0.04 + 0.8 * Math.exp((-2.6 * t) / rt60);
      lp += coef * (Math.random() * 2 - 1 - lp);
      let env = Math.exp((-6.9 * t) / rt60);
      if (i < onset) env *= i / onset;
      if (i > len - tail) env *= (len - i) / tail;
      data[i] = lp * env;
    }
  }
  return buf;
}

class Engine {
  ctx: AudioContext | null = null;
  analyser: AnalyserNode | null = null;

  private master!: GainNode;
  private padFilter!: BiquadFilterNode;
  private padDry!: GainNode;
  private padSend!: GainNode;
  private orbitOscs: OscillatorNode[] = [];
  private orbitPeriod = 10;
  private orbitPhase = 0;
  private orbitAt = 0;
  private mainOut!: GainNode;
  private bgOut: GainNode | null = null;
  private bgEl: HTMLAudioElement | null = null;
  private bgPauseTimer = 0;
  private hidden = false;
  private slots!: [GainNode, GainNode];
  private instBus!: GainNode;
  private drumBus!: GainNode;
  private fxBus!: GainNode;
  private voiceBus!: GainNode;
  private reverbIn!: GainNode;
  private reverbReturn: GainNode | null = null;
  private noise!: AudioBuffer;
  private impulses = new Map<ReverbSize, AudioBuffer>();

  private layers: [Layer | null, Layer | null] = [null, null];
  private volume = 0.8;
  private brightness = 0.75;
  private reverb = 0.6;
  private reverbSize: ReverbSize = 'medium';
  private blend = 0.5;
  private hasB = false;
  a4 = 440;

  /** Must be called from a user gesture the first time. */
  init(): AudioContext {
    if (this.ctx) {
      if (this.ctx.state !== 'running') void this.ctx.resume();
      return this.ctx;
    }
    // Safari: play as media (keeps going with the ringer switch off and in the background).
    const session = (navigator as any).audioSession;
    if (session) {
      try {
        session.type = 'playback';
      } catch {
        /* not supported */
      }
    }
    const Ctor: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = (this.ctx = new Ctor({ latencyHint: 'interactive' }));
    const t = ctx.currentTime;
    this.noise = makeNoiseBuffer(ctx);

    // Master: volume -> rumble filter -> glue compressor -> limiter -> out
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 28;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.03;
    comp.release.value = 0.4;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.master.connect(hp).connect(comp).connect(limiter).connect(this.analyser);
    this.mainOut = ctx.createGain();
    this.analyser.connect(this.mainOut).connect(ctx.destination);
    // Background bridge: the same mix also feeds a media element. When the screen locks
    // or the app is hidden, sound moves to that element, which phones keep playing.
    try {
      const streamDest = ctx.createMediaStreamDestination();
      this.bgOut = ctx.createGain();
      this.bgOut.gain.value = 0;
      this.analyser.connect(this.bgOut).connect(streamDest);
      const el = new Audio();
      el.srcObject = streamDest.stream;
      el.setAttribute('playsinline', '');
      this.bgEl = el;
    } catch {
      this.bgOut = null;
    }

    // Reverb bus
    this.reverbIn = ctx.createGain();
    this.swapReverb(0);

    // Pads: slots -> brightness filter -> ensemble chorus -> dry + reverb send
    const padBus = ctx.createGain();
    this.slots = [ctx.createGain(), ctx.createGain()];
    this.slots.forEach((s) => s.connect(padBus));
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.Q.value = 0.4;
    this.padFilter.frequency.value = this.cutoff();
    padBus.connect(this.padFilter);
    const padOut = ctx.createGain();
    this.padFilter.connect(padOut);
    [
      [0.011, 0.31, -0.8],
      [0.017, 0.47, 0.8],
      [0.023, 0.19, 0],
    ].forEach(([base, rate, pan]) => {
      const delay = ctx.createDelay(0.1);
      delay.delayTime.value = base;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = rate;
      const depth = ctx.createGain();
      depth.gain.value = 0.0022;
      lfo.connect(depth).connect(delay.delayTime);
      lfo.start(t);
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      const wet = ctx.createGain();
      wet.gain.value = 0.34;
      this.padFilter.connect(delay).connect(p).connect(wet).connect(padOut);
    });
    // 8D: the pad circles around the listener's head (binaural HRTF), always on.
    const orbitOut = ctx.createGain();
    orbitOut.gain.value = 1.15;
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.rolloffFactor = 0.4;
    const freq = 1 / this.orbitPeriod;
    const sin = ctx.createOscillator();
    sin.frequency.value = freq;
    const cos = ctx.createOscillator();
    cos.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0])));
    cos.frequency.value = freq;
    if (panner.positionX) {
      panner.positionX.value = 0;
      panner.positionY.value = 0.2;
      panner.positionZ.value = 0;
      const gx = ctx.createGain();
      gx.gain.value = 1.6;
      const gz = ctx.createGain();
      gz.gain.value = -1.6; // starts in front of the listener
      sin.connect(gx).connect(panner.positionX);
      cos.connect(gz).connect(panner.positionZ);
      padOut.connect(panner).connect(orbitOut);
    } else {
      // Older browsers: a left-right sweep instead of a full circle.
      const sweep = ctx.createStereoPanner();
      const depth = ctx.createGain();
      depth.gain.value = 0.9;
      sin.connect(depth).connect(sweep.pan);
      padOut.connect(sweep).connect(orbitOut);
    }
    sin.start(t);
    cos.start(t);
    this.orbitOscs = [sin, cos];
    this.orbitAt = t;
    // A little of the untouched stereo pad keeps it full on speakers.
    const bed = ctx.createGain();
    bed.gain.value = 0.08;
    padOut.connect(bed).connect(orbitOut);

    this.padDry = ctx.createGain();
    this.padSend = ctx.createGain();
    orbitOut.connect(this.padDry).connect(this.master);
    padOut.connect(this.padSend).connect(this.reverbIn);
    this.applyReverbAmount(0);
    this.applyBlend(0);

    const bus = (level: number, send: number) => {
      const g = ctx.createGain();
      g.gain.value = level;
      g.connect(this.master);
      const s = ctx.createGain();
      s.gain.value = send;
      g.connect(s).connect(this.reverbIn);
      return g;
    };
    this.instBus = bus(0.9, 0.5);
    this.drumBus = bus(0.9, 0.05);
    this.voiceBus = bus(1.15, 0.06);
    this.fxBus = bus(0.8, 0.55);
    return ctx;
  }

  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** Audio-clock time at which a DOM event was *heard*, for timing games. */
  eventTime(e: { timeStamp: number }): number {
    const ctx = this.init();
    const ots = ctx.getOutputTimestamp?.();
    if (ots && ots.contextTime && ots.performanceTime) {
      return ots.contextTime + (e.timeStamp - ots.performanceTime) / 1000;
    }
    return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
  }

  // ---------- 8D ----------

  /** Seconds for the pad to go once around the head. */
  setOrbit(period: number) {
    if (this.ctx) {
      const t = this.ctx.currentTime;
      this.orbitPhase += ((2 * Math.PI) / this.orbitPeriod) * (t - this.orbitAt);
      this.orbitAt = t;
      this.orbitOscs.forEach((o) => o.frequency.setValueAtTime(1 / period, t));
    }
    this.orbitPeriod = period;
  }

  /** Current angle of the 8D orbit in radians (0 = in front, growing clockwise). */
  orbitAngle(): number {
    if (!this.ctx) return 0;
    return this.orbitPhase + ((2 * Math.PI) / this.orbitPeriod) * (this.ctx.currentTime - this.orbitAt);
  }

  // ---------- background playback ----------

  /** Keep the media bridge running while the pad plays, so it survives a locked screen. */
  keepAlive(on: boolean, delay = 0) {
    const el = this.bgEl;
    if (!el) return;
    clearTimeout(this.bgPauseTimer);
    if (on) {
      if (el.paused) void el.play().catch(() => undefined);
    } else {
      this.bgPauseTimer = window.setTimeout(() => {
        el.pause();
        this.route();
      }, delay * 1000);
    }
  }

  setHidden(hidden: boolean) {
    this.hidden = hidden;
    if (!hidden && this.ctx && this.ctx.state !== 'running') void this.ctx.resume();
    this.route();
  }

  private route() {
    if (!this.ctx || !this.bgOut) return;
    const bg = this.hidden && !!this.bgEl && !this.bgEl.paused;
    const t = this.ctx.currentTime;
    this.mainOut.gain.setTargetAtTime(bg ? 0 : 1, t, 0.02);
    this.bgOut.gain.setTargetAtTime(bg ? 1 : 0, t, 0.02);
  }

  // ---------- master controls ----------

  setVolume(v: number) {
    this.volume = v;
    this.ctx && this.master.gain.setTargetAtTime(v, this.now, 0.03);
  }

  private cutoff() {
    return Math.min(19000, 260 * Math.pow(2, this.brightness * 6.2));
  }

  setBrightness(v: number) {
    this.brightness = v;
    this.ctx && this.padFilter.frequency.setTargetAtTime(this.cutoff(), this.now, 0.05);
  }

  private applyReverbAmount(tc = 0.05) {
    this.padSend.gain.setTargetAtTime(this.reverb * 1.1, this.now, tc);
    this.padDry.gain.setTargetAtTime(1 - 0.4 * this.reverb, this.now, tc);
  }

  setReverb(v: number) {
    this.reverb = v;
    this.ctx && this.applyReverbAmount();
  }

  setReverbSize(size: ReverbSize) {
    if (size === this.reverbSize) return;
    this.reverbSize = size;
    this.ctx && this.swapReverb(0.4);
  }

  /** Swap the impulse by crossfading to a fresh convolver (changing a live buffer clicks). */
  private swapReverb(fade: number) {
    const ctx = this.ctx!;
    let ir = this.impulses.get(this.reverbSize);
    if (!ir) this.impulses.set(this.reverbSize, (ir = makeImpulse(ctx, RT60[this.reverbSize])));
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const ret = ctx.createGain();
    ret.gain.value = 0;
    ret.gain.setTargetAtTime(1.6, ctx.currentTime, fade / 3 + 0.001);
    this.reverbIn.connect(conv).connect(ret).connect(this.master);
    const old = this.reverbReturn;
    this.reverbReturn = ret;
    if (old) {
      old.gain.setTargetAtTime(0, ctx.currentTime, fade / 3 + 0.001);
      setTimeout(() => old.disconnect(), fade * 1000 + 9000);
    }
  }

  private applyBlend(tc = 0.05) {
    const x = this.hasB ? this.blend : 0;
    this.slots[0].gain.setTargetAtTime(Math.cos((x * Math.PI) / 2), this.now, tc);
    this.slots[1].gain.setTargetAtTime(Math.sin((x * Math.PI) / 2), this.now, tc);
  }

  setBlend(v: number) {
    this.blend = v;
    this.ctx && this.applyBlend();
  }

  // ---------- pads ----------

  /** Move the pad to a new state, crossfading only the layers that actually change. */
  setPad(state: PadState, fade: number) {
    if (state.key === null && !this.ctx) return;
    const ctx = this.init();
    this.hasB = !!state.b;
    this.applyBlend(Math.max(0.05, fade / 4));
    [state.a, state.b].forEach((patchId, i) => {
      const sig = state.key === null || !patchId ? '' : `${patchId}|${state.key}|${state.mode}|${this.a4}`;
      const current = this.layers[i];
      if ((current?.sig ?? '') === sig) return;
      if (current) this.release(current, fade);
      this.layers[i] = null;
      if (!sig) return;

      const patch = patchById(patchId!);
      const voice = buildPad(ctx, patch, midiToFreq(padRootMidi(state.key!), this.a4), state.mode, this.noise);
      const env = ctx.createGain();
      env.gain.value = 0;
      env.gain.setTargetAtTime(1, ctx.currentTime, fade / 3.5 + 0.005);
      voice.out.connect(env).connect(this.slots[i]);
      const layer: Layer = { voice, env, sig };
      if (patch.sparkle) {
        const [min, max] = patch.sparkle.every;
        const tick = () => {
          voice.ping(ctx.currentTime + 0.05);
          layer.sparkleTimer = window.setTimeout(tick, (min + Math.random() * (max - min)) * 1000);
        };
        layer.sparkleTimer = window.setTimeout(tick, 600);
      }
      this.layers[i] = layer;
    });
  }

  private release(layer: Layer, fade: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    const end = t + fade * 1.5 + 0.05;
    clearTimeout(layer.sparkleTimer);
    layer.env.gain.cancelScheduledValues(t);
    layer.env.gain.setTargetAtTime(0, t, fade / 3.5 + 0.005);
    layer.env.gain.setTargetAtTime(0, end - 0.04, 0.008);
    layer.voice.stop(end + 0.05);
    setTimeout(() => {
      layer.voice.dispose();
      layer.env.disconnect();
    }, (end - t) * 1000 + 2500);
  }

  // ---------- instruments ----------

  playNote(midi: number, inst: Instrument, when = 0, velocity = 1, dest?: AudioNode) {
    const ctx = this.init();
    const t = Math.max(when, ctx.currentTime);
    const f = midiToFreq(midi, this.a4);
    const out = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.max(-0.6, Math.min(0.6, (midi - 66) / 30));
    out.connect(pan).connect(dest ?? this.instBus);
    const g = out.gain;
    const osc = (freq: number, wave: Parameters<typeof setWave>[2], level: number, dest: AudioNode = out) => {
      const o = ctx.createOscillator();
      setWave(ctx, o, wave);
      o.frequency.value = freq;
      const og = ctx.createGain();
      og.gain.value = level;
      o.connect(og).connect(dest);
      o.start(t);
      return { o, og };
    };
    let dur: number;
    const oscs: OscillatorNode[] = [];

    if (inst === 'bell') {
      dur = 3.2;
      const car = osc(f, 'sine', 1);
      const mod = ctx.createOscillator();
      mod.frequency.value = f * 3.5;
      const idx = ctx.createGain();
      idx.gain.setValueAtTime(f * 2.2, t);
      idx.gain.exponentialRampToValueAtTime(f * 0.05, t + 1.2);
      mod.connect(idx).connect(car.o.frequency);
      mod.start(t);
      const hi = osc(f * 2.76, 'sine', 0.12);
      hi.og.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      oscs.push(car.o, mod, hi.o);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(0.2 * velocity, t + 0.004);
      g.exponentialRampToValueAtTime(0.0001, t + dur);
    } else if (inst === 'keys') {
      dur = 2.6;
      const a = osc(f, 'sine', 1);
      const b = osc(f * 2, 'sine', 0.22);
      const c = osc(f, 'triangle', 0.25);
      const tine = osc(f * 4, 'sine', 0.2);
      tine.og.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      b.og.gain.exponentialRampToValueAtTime(0.02, t + 1.2);
      oscs.push(a.o, b.o, c.o, tine.o);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(0.24 * velocity, t + 0.006);
      g.exponentialRampToValueAtTime(0.06 * velocity, t + 0.7);
      g.exponentialRampToValueAtTime(0.0001, t + dur);
    } else if (inst === 'electric') {
      // Overdriven lead: two detuned saws into a soft clipper, then a cabinet-like lowpass.
      dur = 1.6;
      const drive = ctx.createWaveShaper();
      drive.curve = this.driveCurve();
      drive.oversample = '2x';
      const cab = ctx.createBiquadFilter();
      cab.type = 'lowpass';
      cab.frequency.value = 3200;
      cab.Q.value = 0.9;
      const pre = ctx.createGain();
      pre.gain.value = 3;
      pre.connect(drive).connect(cab).connect(out);
      oscs.push(osc(f, 'saw', 1, pre).o, osc(f * 1.006, 'saw', 0.7, pre).o, osc(f / 2, 'square', 0.25, pre).o);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(0.12 * velocity, t + 0.004);
      g.exponentialRampToValueAtTime(0.07 * velocity, t + 0.25);
      g.exponentialRampToValueAtTime(0.0001, t + dur);
    } else {
      dur = 1.5;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 2;
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
      lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.3);
      lp.connect(out);
      oscs.push(osc(f, 'softsaw', 1, lp).o, osc(f * 1.004, 'softsaw', 0.6, lp).o);
      g.setValueAtTime(0, t);
      g.linearRampToValueAtTime(0.26 * velocity, t + 0.003);
      g.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    oscs.forEach((o) => o.stop(t + dur + 0.05));
    oscs[0].onended = () => pan.disconnect();
  }

  private drive: Float32Array<ArrayBuffer> | null = null;
  driveCurve() {
    if (!this.drive) {
      const n = 1024;
      this.drive = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        this.drive[i] = Math.tanh(x * 2.5) / Math.tanh(2.5);
      }
    }
    return this.drive;
  }

  /** Strum the given pitches like a guitar (low to high on a downstroke). */
  strum(pitches: number[], when = 0, up = false, velocity = 0.7) {
    const t = Math.max(when, this.init().currentTime);
    const order = [...pitches].sort((a, b) => (up ? b - a : a - b));
    order.forEach((m, i) => this.playNote(m, 'pluck', t + i * (up ? 0.012 : 0.018), velocity * (up ? 0.6 : 1)));
  }

  /** A strummed triad (root, third, fifth, octave). */
  playChord(rootMidi: number, minor: boolean, inst: Instrument, when = 0) {
    const t = Math.max(when, this.init().currentTime);
    [0, minor ? 3 : 4, 7, 12].forEach((s, i) => this.playNote(rootMidi + s, inst, t + i * 0.022, 0.75));
    this.playNote(rootMidi - 12, inst, t, 0.6);
  }

  // ---------- drums & clicks ----------

  private noiseHit(t: number, dest: AudioNode, type: BiquadFilterType, freq: number, level: number, decay: number, attack = 0.001) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 2);
    src.stop(t + attack + decay + 0.05);
    src.onended = () => g.disconnect();
    return { f, g };
  }

  private tone(t: number, dest: AudioNode, type: OscillatorType, f0: number, f1: number, sweep: number, level: number, decay: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + sweep);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + decay + 0.05);
    o.onended = () => g.disconnect();
  }

  /** Metronome click. accent: 2 = downbeat, 1 = beat, 0 = subdivision. */
  click(when: number, accent: 0 | 1 | 2, level = 1) {
    const t = Math.max(when, this.init().currentTime);
    const f = accent === 2 ? 1760 : accent === 1 ? 1175 : 880;
    this.tone(t, this.drumBus, 'triangle', f, f * 0.98, 0.03, (accent === 0 ? 0.25 : 0.5) * level, 0.05);
    if (accent) this.noiseHit(t, this.drumBus, 'bandpass', f * 2, 0.15 * level, 0.012);
  }

  drum(id: DrumId, when = 0, level = 1, dest?: AudioNode) {
    const t = Math.max(when, this.init().currentTime);
    const d = dest ?? this.drumBus;
    if (id === 'kick') {
      this.tone(t, d, 'sine', 150, 46, 0.11, 0.95 * level, 0.36);
      this.noiseHit(t, d, 'lowpass', 2500, 0.2 * level, 0.015);
    } else if (id === 'snare') {
      this.tone(t, d, 'triangle', 210, 170, 0.05, 0.35 * level, 0.12);
      this.noiseHit(t, d, 'highpass', 1400, 0.42 * level, 0.17);
    } else if (id === 'hat') {
      this.noiseHit(t, d, 'highpass', 7500, 0.16 * level, 0.045);
    } else if (id === 'tom') {
      this.tone(t, d, 'sine', 190, 110, 0.18, 0.8 * level, 0.42);
      this.noiseHit(t, d, 'lowpass', 1800, 0.12 * level, 0.03);
    } else if (id === 'crash') {
      this.noiseHit(t, d, 'highpass', 4200, 0.32 * level, 1.5);
      this.noiseHit(t, d, 'bandpass', 6500, 0.14 * level, 0.6);
    } else {
      [0, 0.011, 0.023].forEach((o) => this.noiseHit(t + o, d, 'bandpass', 1300, 0.4 * level, 0.03));
      this.noiseHit(t + 0.03, d, 'bandpass', 1300, 0.45 * level, 0.18);
    }
  }

  /** Round, short bass note. */
  bass(midi: number, when: number, dur: number, level = 1) {
    const ctx = this.init();
    const t = Math.max(when, ctx.currentTime);
    const f = midiToFreq(midi, this.a4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(260, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.55 * level, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.25 * level, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0, t + dur);
    lp.connect(g).connect(this.instBus);
    (['triangle', 'sawtooth'] as const).forEach((type, i) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = i ? 0.25 : 1;
      o.connect(og).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.02);
      if (!i) o.onended = () => g.disconnect();
    });
  }

  /**
   * A note that keeps sounding until the returned function is called
   * (used for hold notes). `kind` picks the colour of the sustained tone.
   */
  sustain(midi: number, kind: 'lead' | 'organ' | 'bass'): () => void {
    const ctx = this.init();
    const t = ctx.currentTime;
    const f = midiToFreq(midi, this.a4);
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.connect(out).connect(this.instBus);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.2;
    const vibDepth = ctx.createGain();
    vibDepth.gain.setValueAtTime(0, t);
    vibDepth.gain.linearRampToValueAtTime(kind === 'lead' ? f * 0.012 : kind === 'organ' ? f * 0.004 : 0, t + 0.6);
    vib.connect(vibDepth);
    const oscs: OscillatorNode[] = [vib];
    const add = (freq: number, wave: Parameters<typeof setWave>[2], level: number) => {
      const o = ctx.createOscillator();
      setWave(ctx, o, wave);
      o.frequency.value = freq;
      vibDepth.connect(o.frequency);
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(lp);
      oscs.push(o);
    };
    if (kind === 'lead') {
      // Same overdriven voice as the electric guitar, held with vibrato.
      const drive = ctx.createWaveShaper();
      drive.curve = this.driveCurve();
      const pre = ctx.createGain();
      pre.gain.value = 3;
      lp.disconnect();
      pre.connect(drive).connect(lp);
      lp.connect(out);
      lp.frequency.value = 3200;
      lp.Q.value = 0.9;
      const addPre = (freq: number, level: number) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        vibDepth.connect(o.frequency);
        const g = ctx.createGain();
        g.gain.value = level;
        o.connect(g).connect(pre);
        oscs.push(o);
      };
      addPre(f, 1);
      addPre(f * 1.006, 0.7);
      out.gain.linearRampToValueAtTime(0.11, t + 0.02);
      out.gain.setTargetAtTime(0.08, t + 0.05, 0.3);
    } else if (kind === 'organ') {
      lp.frequency.value = 4500;
      add(f, 'organ', 1);
      add(f * 2, 'sine', 0.2);
      out.gain.linearRampToValueAtTime(0.13, t + 0.03);
    } else {
      lp.frequency.value = 700;
      add(f, 'triangle', 1);
      add(f, 'saw', 0.25);
      out.gain.linearRampToValueAtTime(0.42, t + 0.01);
      out.gain.setTargetAtTime(0.3, t + 0.05, 0.4);
    }
    oscs.forEach((o) => o.start(t));
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.setTargetAtTime(0, now, 0.06);
      oscs.forEach((o) => o.stop(now + 0.4));
      oscs[0].onended = () => out.disconnect();
    };
  }

  /** Play a decoded clip (a voice line) and return a function that stops it. */
  playBuffer(buffer: AudioBuffer): () => void {
    const ctx = this.init();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    src.connect(g).connect(this.voiceBus);
    src.start();
    src.onended = () => g.disconnect();
    return () => {
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      src.stop(ctx.currentTime + 0.15);
    };
  }

  /** Game feedback sounds. */
  sfx(id: 'bonk' | 'dead' | 'sad' | 'yay' | 'jump' | 'coin' | 'stomp' | 'power' | 'hurt' | 'bump') {
    const ctx = this.init();
    const t = ctx.currentTime + 0.005;
    const d = this.fxBus;
    if (id === 'jump') {
      this.tone(t, d, 'square', 330, 660, 0.12, 0.07, 0.14);
      return;
    }
    if (id === 'coin') {
      this.tone(t, d, 'square', 988, 988, 0.05, 0.06, 0.06);
      this.tone(t + 0.06, d, 'square', 1319, 1319, 0.2, 0.06, 0.22);
      return;
    }
    if (id === 'stomp') {
      this.tone(t, d, 'square', 300, 90, 0.1, 0.12, 0.12);
      this.noiseHit(t, d, 'lowpass', 1200, 0.15, 0.05);
      return;
    }
    if (id === 'bump') {
      this.tone(t, d, 'triangle', 180, 120, 0.06, 0.25, 0.1);
      return;
    }
    if (id === 'power') {
      [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => this.tone(t + i * 0.05, d, 'square', midiToFreq(m, this.a4), midiToFreq(m, this.a4), 0.04, 0.05, 0.08));
      return;
    }
    if (id === 'hurt') {
      this.tone(t, d, 'square', 520, 130, 0.35, 0.09, 0.4);
      return;
    }
    if (id === 'bonk') {
      this.tone(t, d, 'square', 220, 70, 0.14, 0.12, 0.18);
    } else if (id === 'dead') {
      this.noiseHit(t, d, 'bandpass', 900, 0.18, 0.05);
    } else if (id === 'yay') {
      [72, 76, 79, 84].forEach((m, i) => this.playNote(m, 'bell', t + i * 0.07, 0.6));
    } else {
      // The classic "sad trombone": four sliding, wobbling steps down.
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1100;
      lp.Q.value = 3;
      const g = ctx.createGain();
      g.gain.value = 0;
      lp.connect(g).connect(d);
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      const vib = ctx.createOscillator();
      vib.frequency.value = 6;
      const vibDepth = ctx.createGain();
      vibDepth.gain.value = 0;
      vib.connect(vibDepth).connect(o.frequency);
      o.connect(lp);
      const steps = [62, 61, 60, 59].map((m) => midiToFreq(m, this.a4) / 2);
      steps.forEach((f, i) => {
        const at = t + i * 0.38;
        o.frequency.setValueAtTime(f * 1.03, at);
        o.frequency.exponentialRampToValueAtTime(f, at + 0.08);
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(0.32, at + 0.04);
        g.gain.linearRampToValueAtTime(i === 3 ? 0.3 : 0.05, at + (i === 3 ? 0.9 : 0.34));
      });
      vibDepth.gain.setValueAtTime(0, t + 1.2);
      vibDepth.gain.linearRampToValueAtTime(5, t + 1.5);
      g.gain.linearRampToValueAtTime(0, t + 2.3);
      o.start(t);
      vib.start(t);
      o.stop(t + 2.4);
      vib.stop(t + 2.4);
      o.onended = () => g.disconnect();
    }
  }

  // ---------- one-shot effects ----------

  fx(id: FxId) {
    const ctx = this.init();
    const t = ctx.currentTime + 0.01;
    const d = this.fxBus;
    switch (id) {
      case 'swell': {
        const { f } = this.noiseHit(t, d, 'highpass', 3000, 0.3, 2.6, 2.4);
        f.frequency.exponentialRampToValueAtTime(7000, t + 2.4);
        break;
      }
      case 'riser': {
        const { f } = this.noiseHit(t, d, 'bandpass', 300, 0.5, 0.5, 3);
        f.Q.value = 1.5;
        f.frequency.exponentialRampToValueAtTime(9000, t + 3);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(110, t);
        o.frequency.exponentialRampToValueAtTime(880, t + 3);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.1, t + 3);
        g.gain.linearRampToValueAtTime(0, t + 3.08);
        const lp = ctx.createBiquadFilter();
        lp.frequency.value = 2400;
        o.connect(lp).connect(g).connect(d);
        o.start(t);
        o.stop(t + 3.2);
        o.onended = () => g.disconnect();
        break;
      }
      case 'impact':
        this.tone(t, d, 'sine', 90, 32, 0.5, 0.9, 2.6);
        this.noiseHit(t, d, 'lowpass', 500, 0.6, 2.2);
        this.noiseHit(t, d, 'highpass', 4000, 0.12, 0.5);
        break;
      case 'chimes':
        for (let i = 0; i < 16; i++) {
          const f = midiToFreq(100 - [0, 3, 5, 7, 10][i % 5] - 12 * Math.floor(i / 5), this.a4);
          this.tone(t + i * 0.07 + Math.random() * 0.02, d, 'sine', f, f, 0.1, 0.09, 1.8);
        }
        break;
      case 'subdrop':
        this.tone(t, d, 'sine', 120, 28, 1.6, 0.9, 2.2);
        break;
      case 'reverse': {
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.setValueAtTime(6000, t);
        f.frequency.exponentialRampToValueAtTime(1500, t + 1.8);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(0.45, t + 1.8);
        g.gain.linearRampToValueAtTime(0, t + 1.83);
        src.connect(f).connect(g).connect(d);
        src.start(t);
        src.stop(t + 1.9);
        src.onended = () => g.disconnect();
        break;
      }
      case 'thunder': {
        this.noiseHit(t, d, 'lowpass', 900, 0.5, 0.25);
        for (let i = 0; i < 6; i++) {
          this.noiseHit(t + 0.08 + i * 0.28 * Math.random() + i * 0.2, d, 'lowpass', 160 + Math.random() * 160, 0.7 / (1 + i * 0.4), 1.6);
        }
        break;
      }
      case 'wave': {
        const { f } = this.noiseHit(t, d, 'lowpass', 350, 0.4, 3.5, 2.5);
        f.frequency.exponentialRampToValueAtTime(2600, t + 2.5);
        f.frequency.exponentialRampToValueAtTime(300, t + 6);
        break;
      }
    }
  }

  /** Current output level 0..1, for the visualizer. */
  private meterBuf: Uint8Array<ArrayBuffer> | null = null;
  level(): number {
    if (!this.analyser) return 0;
    const buf = (this.meterBuf ??= new Uint8Array(this.analyser.fftSize));
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i += 4) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / (buf.length / 4));
  }
}

export const engine = new Engine();
