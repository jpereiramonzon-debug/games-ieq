import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { Dialog } from '../pixel/Dialog';
import { LOOKS } from '../pixel/person';
import { heroFace } from '../pixel/heroes';
import { EAR, HELLO, MEMORY, MISS, pick, PRAISE, RUN, TIME } from './phrases';
import { claimTalk, preloadVoices, speak } from './voice';

export type CoachTopic = 'memory' | 'ear' | 'time' | 'notes' | 'run';

const TOPIC = { memory: MEMORY, ear: EAR, time: TIME, notes: MISS, run: RUN };

/**
 * Pixel Jesus that sits above a game and reacts: a facepalm and a one-liner when
 * you get something wrong, a cheer when you do well.
 */
export function useJesusCoach(topic: CoachTopic) {
  const lang = useStore((s) => s.lang);
  const [line, setLine] = useState<{ text: string; kind: 'miss' | 'praise' | 'info'; id: number } | null>(null);
  const mood = useRef({ facepalmUntil: 0, cheerUntil: 0, lastSay: 0, last: null as string | null });
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => preloadVoices([{ memory: 'memoria', ear: 'ouvido', time: 'tempo', notes: 'erro', run: 'erro' }[topic], 'erro', 'elogio']), [topic]);

  const say = (text: string, kind: 'miss' | 'praise' | 'info', ms = 2600) => {
    mood.current.last = text;
    mood.current.lastSay = performance.now();
    clearTimeout(timer.current);
    setLine({ text, kind, id: Math.random() });
    timer.current = window.setTimeout(() => setLine(null), ms);
    speak(text);
  };

  const miss = () => {
    const m = mood.current;
    m.facepalmUntil = performance.now() + 900;
    // One joke at a time: mistakes while he is still talking only get the facepalm.
    if (!claimTalk()) return;
    const own = TOPIC[topic][lang];
    // Music jokes only fit the music games; the runner keeps to its own lines.
    say(pick(topic === 'run' || Math.random() < 0.65 ? own : MISS[lang], m.last), 'miss');
  };

  const praise = () => {
    mood.current.cheerUntil = performance.now() + 1500;
    if (claimTalk()) say(pick(PRAISE[lang], mood.current.last), 'praise', 2400);
  };

  const node = <Coach line={line} hello={HELLO[lang]} />;
  return { node, miss, praise, say };
}

function Coach({ line, hello }: { line: { text: string; kind: 'miss' | 'praise' | 'info'; id: number } | null; hello: string }) {
  const kind = line?.kind ?? 'info';
  return (
    <div key={line?.id ?? 'hello'} aria-live="polite" className="animate-pop">
      <Dialog look={LOOKS.jesus} img={heroFace('jesus')} mood={kind === 'miss' ? 'facepalm' : kind === 'praise' ? 'happy' : 'neutral'} tone={kind}>
        {line?.text ?? hello}
      </Dialog>
    </div>
  );
}
