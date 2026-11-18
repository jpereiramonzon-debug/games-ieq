/** Who is speaking in the story dialog right now, so animated scenes can make that character talk. */
import type { Mood } from './bust';

let current: { who: string; mood?: Mood } | null = null;
export const setSpeaker = (s: { who: string; mood?: Mood } | null) => {
  current = s;
};
export const speaker = () => current;
