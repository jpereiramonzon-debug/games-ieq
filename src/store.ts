/**
 * Saved state of Jogos IEQ: language, sound options, scores and the progress
 * of every game. Kept in localStorage and shared with React through
 * useSyncExternalStore.
 */
import { useSyncExternalStore } from 'react';
import { engine } from './audio/engine';

export type Lang = 'pt' | 'en' | 'es';

export interface State {
  lang: Lang;
  /** Master volume of the game sounds. */
  volume: number;
  /** Recorded voice of Jesus in the games. */
  jesusVoice: boolean;
  /** Recorded voices of the characters in the story dialogs. */
  storyVoices: boolean;
  best: Record<string, number>;
  /** Stars per stage in Corrida da Fé. */
  runStars: Record<string, number>;
  questDone: string[];
  carpenter: object | null;
  davidDone: string[];
  /** Two-player chapters of David finished together. */
  davidDuoDone: string[];
  samsonDone: string[];
  peterDone: string[];
  noahDone: string[];
  lifeDone: string[];
  josephDone: string[];
  estherDone: string[];
  /** Background music in the story games. */
  bgm: boolean;
  /** 0 easy, 1 normal, 2 hard. */
  storyDiff: number;
  /** Stars per chapter, key `saga:chapter`. */
  stars: Record<string, number>;
  /** Kept for the shared music player: there is no worship pad in this app. */
  playing: boolean;
}

const STORAGE_KEY = 'games-ieq:v1';

const defaults: State = {
  lang: 'pt',
  volume: 0.8,
  jesusVoice: true,
  storyVoices: true,
  best: {},
  runStars: {},
  questDone: [],
  carpenter: null,
  davidDone: [],
  davidDuoDone: [],
  samsonDone: [],
  peterDone: [],
  noahDone: [],
  lifeDone: [],
  josephDone: [],
  estherDone: [],
  bgm: true,
  storyDiff: 1,
  stars: {},
  playing: false,
};

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const merged = { ...defaults, ...saved, playing: false };
    return Object.fromEntries(Object.keys(defaults).map((k) => [k, merged[k]])) as unknown as State;
  } catch {
    return defaults;
  }
}

let state = load();
const listeners = new Set<() => void>();
engine.setVolume(state.volume);

export function set(patch: Partial<State>) {
  state = { ...state, ...patch, playing: false };
  engine.setVolume(state.volume);
  try {
    const { playing: _p, ...persisted } = state;
    void _p;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* storage unavailable: keep working in memory */
  }
  listeners.forEach((fn) => fn());
}

export const get = () => state;

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

/** Record a game score; returns true when it is a new best. */
export function submitScore(game: string, score: number): boolean {
  if (score <= (state.best[game] ?? 0)) return false;
  set({ best: { ...state.best, [game]: score } });
  return true;
}
