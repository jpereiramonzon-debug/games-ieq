import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { Check, Lock, Music, RotateCw, VolumeX, X } from 'lucide-react';
import { engine } from '../../audio/engine';
import { get, set, submitScore, useStore } from '../../store';
import { cx } from '../../ui/kit';
import { Typed } from './Controls';
import { Dialog, Portrait } from './Dialog';
import { GameShell } from '../Shell';
import type { Mood } from './bust';
import type { Look } from './person';
import type { GameProps } from './stage';
import { RotateHint } from './orientation';
import { useBgm, type Track } from '../bgm';
import { Platform } from '../platform/Platform';
import { Cinematic } from '../platform/Cinematic';
import { chapterLevel, type Style, type TimeOfDay } from '../platform/level';
import type { Explore } from '../platform/explore';
import type { CastId } from '../platform/rig';
import { themeTime } from '../platform/sky';

export interface SLine {
  who: string;
  text: string;
  mood?: Mood;
}
export interface SChapter {
  id: string;
  title: string;
  ref: string;
  intro: SLine[];
  mid?: SLine[];
  outro: SLine[];
}
export interface Saga {
  /** Store key for finished chapters and score id. */
  key: 'davidDone' | 'samsonDone' | 'peterDone' | 'noahDone' | 'lifeDone' | 'josephDone';
  title: string;
  blurb: string;
  hero: Look;
  /** Portrait shown when the whole story is finished. */
  finalLook: Look;
  chapters: SChapter[];
  speakers: Record<string, { look: Look; name: string; bg: string; img?: string }>;
  /** Painted card art for the menu. */
  card?: string;
  games: Record<string, [ComponentType<GameProps>, ComponentType<GameProps>?]>;
  /** Side-view exploration stage played before each chapter's challenge. */
  explore?: Record<string, Explore>;
  /** Sprite of the hero in the side-view stages and how they face enemies. */
  heroCast: CastId;
  style: Style;
  /** Background music of the saga, per-chapter overrides, and chapters whose challenge is musical (silence there). */
  music: Track;
  chapterMusic?: Record<string, Track>;
  quiet?: string[];
}

export function StoryMenu({ saga, onBack }: { saga: Saga; onBack: () => void }) {
  const CHAPTERS = saga.chapters;
  const done = useStore((s) => s[saga.key]);
  const stars = useStore((s) => s.stars);
  const [open, setOpen] = useState<string | null>(null);
  useBgm(saga.music, 1);
  const next = CHAPTERS.find((c) => !done.includes(c.id)) ?? CHAPTERS[0];
  const start = (id: string) => {
    engine.init();
    const el = document.documentElement;
    (el.requestFullscreen?.() ?? Promise.resolve())
      .then(() =>
        (
          screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          }
        )?.lock?.('landscape'),
      )
      .catch(() => undefined);
    setOpen(id);
  };
  return (
    <GameShell id={saga.key} title={saga.title} onBack={onBack}>
      <div className="flex items-center gap-3">
        {saga.card ? (
          <span className="rpg-wood block h-32 w-24 shrink-0 overflow-hidden p-[3px]">
            <img src={saga.card} alt="" className="h-full w-full object-cover" />
          </span>
        ) : (
          <Portrait look={saga.hero} className="h-24 w-24 shrink-0" />
        )}
        <div className="rpg-frame rpg-text flex-1 p-3 text-lg leading-snug">{saga.blurb}</div>
      </div>
      <DiffPicker />
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {CHAPTERS.map((c, i) => {
          const ok = done.includes(c.id);
          const unlocked = ok || i === 0 || done.includes(CHAPTERS[i - 1].id);
          return (
            <li key={c.id}>
              <button
                disabled={!unlocked}
                onClick={() => start(c.id)}
                className={cx('rpg-frame rpg-text flex w-full items-center gap-2 px-2 py-2 text-left', !unlocked && 'opacity-50')}
              >
                <span className={cx('grid h-8 w-8 shrink-0 place-items-center border-2 border-[#5b3a1e] text-lg', ok ? 'bg-[#6a9a3a]' : 'bg-[#c8975a]')}>
                  {ok ? <Check size={16} /> : unlocked ? i + 1 : <Lock size={14} />}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  {c.title}
                  <span className="block text-sm text-[#ffe08a]">{c.ref}</span>
                </span>
                <span className="shrink-0 text-lg tracking-tighter" aria-label={`${stars[`${saga.key}:${c.id}`] ?? 0} estrelas`}>
                  <span className="text-[#ffd23a]">{'★'.repeat(stars[`${saga.key}:${c.id}`] ?? 0)}</span>
                  <span className="opacity-30">{'★'.repeat(3 - (stars[`${saga.key}:${c.id}`] ?? 0))}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button onClick={() => start(next.id)} className="rpg-wood rpg-text flex h-14 w-full items-center justify-center gap-2 text-xl active:translate-y-0.5">
        <RotateCw size={20} /> {done.length ? (done.length >= CHAPTERS.length ? 'Jogar de novo' : `Continuar: ${next.title}`) : 'Começar a história (deite o celular)'}
      </button>
      {open && (
        <Story
          saga={saga}
          chapter={CHAPTERS.find((c) => c.id === open)!}
          onExit={() => {
            setOpen(null);
            if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
          }}
          onNext={(id) => setOpen(id)}
        />
      )}
    </GameShell>
  );
}

function Talk({ lines, speakers, onDone }: { lines: SLine[]; speakers: Saga['speakers']; onDone: () => void }) {
  const [i, setI] = useState(0);
  const typing = useRef({ done: true, finish: () => {} });
  const line = lines[i];
  const next = () => {
    if (!typing.current.done) return typing.current.finish();
    engine.playNote(84, 'bell', 0, 0.18);
    if (i + 1 < lines.length) setI(i + 1);
    else onDone();
  };
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  });
  if (!line) return null;
  const sp = speakers[line.who];
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-20 p-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))]" onClick={next}>
        <div className="mx-auto max-w-3xl">
          <Dialog look={sp.look} img={sp.img} mood={line.mood} bg={sp.bg} name={sp.name || undefined} size="lg">
            {line.who === 'narrator' ? (
              <em>
                <Typed key={i} text={line.text} ctl={typing} />
              </em>
            ) : (
              <Typed key={i} text={line.text} ctl={typing} />
            )}
            <span className="absolute bottom-1 right-2 animate-bounce text-[0.8em] text-[#ffe08a]">▼</span>
          </Dialog>
        </div>
      </div>
      <button onClick={onDone} className="rpg-wood rpg-text absolute right-[max(0.5rem,env(safe-area-inset-right))] top-2 z-20 px-3 py-1 text-sm" aria-label="Pular conversa">
        Pular ⏩
      </button>
    </>
  );
}

type Phase = 'title' | 'explore' | 'intro' | 'game' | 'mid' | 'game2' | 'outro' | 'end';

function Story({ saga, chapter, onExit, onNext }: { saga: Saga; chapter: SChapter; onExit: () => void; onNext: (id: string) => void }) {
  const CHAPTERS = saga.chapters;
  const [phase, setPhase] = useState<Phase>('title');
  const [A, B] = saga.games[chapter.id];
  const diff = useStore((s) => s.storyDiff);
  const got = useRef<number[]>([]);
  const ex = saga.explore?.[chapter.id];
  const idx0 = saga.chapters.findIndex((c) => c.id === chapter.id);
  const level = useMemo(() => (ex ? chapterLevel(ex.theme, idx0, diff, ex.npc, ex.goal, saga.style, ex.time) : null), [ex, idx0, diff, saga.style]);
  // Time passes between chapters: from the previous chapter's time of day to this one's.
  const timeOf = (e?: Explore) => (e ? (e.time ?? themeTime(e.theme)) : 'day');
  const toTime: TimeOfDay = timeOf(ex);
  const prevEx = idx0 > 0 ? saga.explore?.[saga.chapters[idx0 - 1].id] : undefined;
  const BEFORE: Record<TimeOfDay, TimeOfDay> = { dawn: 'night', day: 'dawn', sunset: 'day', night: 'sunset', storm: 'day' };
  let fromTime: TimeOfDay = prevEx ? timeOf(prevEx) : BEFORE[toTime];
  if (fromTime === toTime) fromTime = BEFORE[toTime];
  // A line of story for the cinematic (the intro's last line usually explains the controls).
  const caption = chapter.intro.slice(0, -1).find((l) => l.who === 'narrator')?.text;
  const first: Phase = ex ? 'explore' : 'intro';
  const quiet = saga.quiet?.includes(chapter.id) && (phase === 'game' || phase === 'game2');
  useBgm(quiet ? null : (saga.chapterMusic?.[chapter.id] ?? saga.music), 2);
  const bgm = useStore((s) => s.bgm);
  const [earned, setEarned] = useState(0);
  const win = (next: Phase) => (st?: number) => {
    got.current.push(st ?? 2);
    setPhase(next);
  };

  useEffect(() => {
    setPhase('title');
    got.current = [];
    const t = window.setTimeout(() => setPhase((p) => (p === 'title' && !saga.explore?.[chapter.id]?.place ? first : p)), 1100);
    engine.playNote(62, 'bell', 0, 0.25);
    engine.playNote(69, 'bell', 0.25, 0.22);
    engine.playNote(74, 'bell', 0.5, 0.2);
    return () => {
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter.id]);

  if (import.meta.env.DEV) (window as unknown as { __story: unknown }).__story = { setPhase };
  const finish = () => {
    const list = [...new Set([...get()[saga.key], chapter.id])];
    const st = Math.max(1, Math.min(3, Math.min(...(got.current.length ? got.current : [2])) - (diff === 0 ? 1 : 0)));
    const key = `${saga.key}:${chapter.id}`;
    setEarned(st);
    set({
      [saga.key]: list,
      stars: { ...get().stars, [key]: Math.max(get().stars[key] ?? 0, st) },
    });
    submitScore(saga.key, list.length);
    engine.sfx('yay');
    setPhase('end');
  };
  const idx = CHAPTERS.findIndex((c) => c.id === chapter.id);
  const following = CHAPTERS[idx + 1];
  const second = !!B && (phase === 'mid' || phase === 'game2' || phase === 'outro' || phase === 'end');

  return createPortal(
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-black font-pixel text-white" role="dialog" aria-modal="true" aria-label={`${saga.title}: ${chapter.title}`}>
      {phase === 'explore' && level ? (
        <Platform key={`${chapter.id}-x-${diff}`} spec={level} cast={ex?.cast ?? saga.heroCast} style={saga.style} diff={diff} paused={phase !== 'explore'} onWin={win('intro')} />
      ) : second && B ? (
        <B key={`${chapter.id}-b-${diff}`} diff={diff} paused={phase !== 'game2'} onWin={win('outro')} />
      ) : (
        <A key={`${chapter.id}-a-${diff}`} diff={diff} paused={phase !== 'game'} onWin={win(B ? 'mid' : 'outro')} />
      )}

      <button onClick={onExit} aria-label="Sair" className="rpg-wood rpg-text absolute left-[max(0.5rem,env(safe-area-inset-left))] top-2 z-30 grid h-10 w-10 place-items-center">
        <X size={18} />
      </button>
      <button
        onClick={() => set({ bgm: !bgm })}
        aria-label={bgm ? 'Desligar música' : 'Ligar música'}
        aria-pressed={bgm}
        className={cx('rpg-wood rpg-text absolute left-[max(0.5rem,env(safe-area-inset-left))] top-14 z-30 grid h-10 w-10 place-items-center', !bgm && 'opacity-60')}
      >
        {bgm ? <Music size={18} /> : <VolumeX size={18} />}
      </button>

      {phase === 'title' && ex?.place && (
        <Cinematic
          key={chapter.id}
          from={fromTime}
          to={toTime}
          theme={ex.theme}
          cast={ex.cast ?? saga.heroCast}
          place={ex.place}
          label={`CAPÍTULO ${idx + 1}`}
          title={chapter.title}
          sub={chapter.ref}
          caption={caption}
          onDone={() => setPhase((p) => (p === 'title' ? first : p))}
        />
      )}
      {phase === 'title' && !ex?.place && (
        <div className="animate-pop absolute inset-0 z-20 grid place-items-center bg-black/70" onClick={() => setPhase(first)}>
          <div className="rpg-frame rpg-text flex items-center gap-4 px-6 py-4 text-center">
            {saga.card && <img src={saga.card} alt="" className="hidden h-36 w-28 border-[3px] border-[#5b3a1e] object-cover sm:block" />}
            <div>
              <p className="text-sm text-[#ffe08a]">Capítulo {idx + 1}</p>
              <p className="text-3xl">{chapter.title}</p>
              <p className="text-sm opacity-80">{chapter.ref}</p>
            </div>
          </div>
        </div>
      )}
      {phase === 'intro' && <Talk key="intro" speakers={saga.speakers} lines={chapter.intro} onDone={() => setPhase('game')} />}
      {phase === 'mid' && chapter.mid && <Talk key="mid" speakers={saga.speakers} lines={chapter.mid} onDone={() => setPhase('game2')} />}
      {phase === 'outro' && <Talk key="outro" speakers={saga.speakers} lines={chapter.outro} onDone={finish} />}
      {phase === 'end' && (
        <div className="animate-pop absolute inset-0 z-20 grid place-items-center bg-black/60 p-4">
          <div className="rpg-frame rpg-text flex max-w-md flex-col items-center gap-3 p-4 text-center">
            <Portrait look={following ? saga.hero : saga.finalLook} mood="happy" className="h-24 w-24" />
            <p className="text-2xl">Capítulo concluído!</p>
            <p className="flex gap-1 text-4xl" aria-label={`${earned} de 3 estrelas`}>
              {[0, 1, 2].map((k) => (
                <span key={k} className={cx('animate-pop', k < earned ? 'text-[#ffd23a] drop-shadow-[0_0_6px_#ffd23a]' : 'opacity-25')} style={{ animationDelay: `${k * 180}ms` }}>
                  ★
                </span>
              ))}
            </p>
            <p className="text-xs opacity-80">
              {earned < 3 ? (diff === 0 ? 'No Fácil o máximo é 2 estrelas. Tente o Normal ou o Difícil!' : 'Jogue de novo para tirar 3 estrelas!') : 'Perfeito!'}
            </p>
            <p className="text-[#ffe08a]">{chapter.title}</p>
            {following ? (
              <button onClick={() => onNext(following.id)} className="rpg-wood h-12 w-full text-xl">
                Próximo: {following.title}
              </button>
            ) : (
              <p>Você completou a história de {saga.title}!</p>
            )}
            <button onClick={onExit} className="rpg-wood h-10 w-full text-base">
              Voltar aos capítulos
            </button>
          </div>
        </div>
      )}
      <RotateHint onExit={onExit} />
    </div>,
    document.body,
  );
}

/** Easy / normal / hard, shared by every story game. */
export function DiffPicker() {
  const diff = useStore((s) => s.storyDiff);
  return (
    <div className="rpg-frame rpg-text flex items-center gap-2 px-2 py-1.5" role="radiogroup" aria-label="Dificuldade">
      <span className="text-base">Dificuldade:</span>
      {['Fácil', 'Normal', 'Difícil'].map((label, k) => (
        <button
          key={label}
          role="radio"
          aria-checked={diff === k}
          onClick={() => set({ storyDiff: k })}
          className={cx('rpg-wood flex-1 px-2 py-1 text-base', diff === k ? 'outline outline-2 outline-[#ffe08a] brightness-110' : 'opacity-70')}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
