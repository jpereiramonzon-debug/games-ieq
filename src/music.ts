export type Notation = 'american' | 'latin';
export type ChordMode = 'neutral' | 'major' | 'minor';
export type ScaleId = 'penta' | 'major' | 'minor';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['', 'Db', '', 'Eb', '', '', 'Gb', '', 'Ab', '', 'Bb', ''];
const LATIN_NAMES = ['Dó', 'Dó#', 'Ré', 'Ré#', 'Mi', 'Fá', 'Fá#', 'Sol', 'Sol#', 'Lá', 'Lá#', 'Si'];
const LATIN_FLATS = ['', 'Réb', '', 'Mib', '', '', 'Solb', '', 'Láb', '', 'Sib', ''];

export function noteName(pc: number, notation: Notation): string {
  const i = ((pc % 12) + 12) % 12;
  return notation === 'latin' ? LATIN_NAMES[i] : NOTE_NAMES[i];
}

/** Enharmonic flat spelling for the black keys, empty for naturals. */
export function flatName(pc: number, notation: Notation): string {
  const i = ((pc % 12) + 12) % 12;
  return notation === 'latin' ? LATIN_FLATS[i] : FLAT_NAMES[i];
}

/** Hue for a key, walking the circle of fifths so related keys get related colors. */
export function keyHue(pc: number): number {
  return (205 + ((pc * 7) % 12) * 30) % 360;
}

export function midiToFreq(midi: number, a4 = 440): number {
  return a4 * Math.pow(2, (midi - 69) / 12);
}

/** Pad register: keep every key inside A2..G#3 so no key sounds thin or muddy. */
export function padRootMidi(pc: number): number {
  return pc <= 8 ? 48 + pc : 36 + pc;
}

export const SCALES: Record<ScaleId, number[]> = {
  penta: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

/** n-th note of a scale (n may exceed one octave), as a semitone offset from the root. */
export function scaleDegree(scale: ScaleId, n: number): number {
  const s = SCALES[scale];
  return s[n % s.length] + 12 * Math.floor(n / s.length);
}

export interface DiatonicChord {
  degree: string;
  root: number; // semitones from the key
  minor: boolean;
}

export const DIATONIC: DiatonicChord[] = [
  { degree: 'I', root: 0, minor: false },
  { degree: 'ii', root: 2, minor: true },
  { degree: 'iii', root: 4, minor: true },
  { degree: 'IV', root: 5, minor: false },
  { degree: 'V', root: 7, minor: false },
  { degree: 'vi', root: 9, minor: true },
];
