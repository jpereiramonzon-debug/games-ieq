import { useEffect, useState } from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import JesusRun from './games/run/JesusRun';
import { RunBanner } from './games/run/Banner';
import David from './games/david/David';
import Samson from './games/samson/Samson';
import Peter from './games/peter/Peter';
import Noah from './games/noah/Noah';
import Joseph from './games/joseph/Joseph';
import Esther from './games/esther/Esther';
import { useBgm } from './games/bgm';
import Life from './games/life/Life';
import { heroCard } from './games/pixel/heroes';
import { useT } from './i18n';
import { useStore } from './store';
import { cx } from './ui/kit';

export type GameId = 'esther' | 'joseph' | 'life' | 'peter' | 'noah' | 'samson' | 'david' | 'run';

export default function GamesHub({ game, setGame }: { game: GameId | null; setGame: (g: GameId | null) => void }) {
  // An invite to the two-player mode goes straight to David.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('sala')) setGame('david');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const t = useT();
  const best = useStore((s) => s.best);
  const davi = useStore((s) => s.davidDone);
  const sansao = useStore((s) => s.samsonDone);
  const pedro = useStore((s) => s.peterDone);
  const noe = useStore((s) => s.noahDone);
  const vida = useStore((s) => s.lifeDone);
  const jose = useStore((s) => s.josephDone);
  const ester = useStore((s) => s.estherDone);
  const [hero, setHero] = useState<'jesus' | null>(() => (game && ['life', 'run'].includes(game) ? 'jesus' : null));
  useBgm(game === null ? 'menu' : null, 0);
  const back = () => setGame(null);
  if (game === 'david') return <David onBack={back} />;
  if (game === 'samson') return <Samson onBack={back} />;
  if (game === 'peter') return <Peter onBack={back} />;
  if (game === 'noah') return <Noah onBack={back} />;
  if (game === 'joseph') return <Joseph onBack={back} />;
  if (game === 'esther') return <Esther onBack={back} />;
  if (game === 'life') return <Life onBack={back} />;
  if (game === 'run') return <JesusRun onBack={back} />;

  const heroBar = (title: string) => (
    <div className="mb-3 flex items-center gap-2">
      <button onClick={() => setHero(null)} aria-label={t('games.heroes')} className="grid h-11 w-11 place-items-center rounded-full bg-surface hover:bg-raised">
        <ArrowLeft size={20} />
      </button>
      <h2 className="font-pixel text-2xl">{title}</h2>
    </div>
  );

  if (hero === 'jesus')
    return (
      <div className="mx-auto max-w-4xl">
        {heroBar('Jesus')}
        <button
          onClick={() => setGame('life')}
          className="mb-3 flex w-full flex-col overflow-hidden rounded-3xl border-[3px] border-[#e8b830] bg-[#2a1a10] text-left text-white transition active:scale-[0.99] sm:flex-row"
        >
          <span className="relative block aspect-[16/9] w-full shrink-0 overflow-hidden sm:aspect-auto sm:w-72">
            <img src={heroCard('jesus')} alt="" className="h-full w-full object-cover object-top" />
            <span className="font-pixel absolute left-2 top-2 rounded bg-[#e8b830] px-2 py-0.5 text-sm text-[#2a1a10]">Modo história</span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
            <span className="font-pixel text-2xl text-[#ffe08a]">Jesus: o caminho</span>
            <span className="text-sm text-white/80">
              11 capítulos do batismo à ressurreição: deserto contra o Tentador, Caná, o paralítico pelo telhado, o semeador, os pães, a tempestade, o cego, Lázaro, o Getsêmani e o
              túmulo vazio.
            </span>
            <span className="mt-2 flex items-center justify-between gap-2">
              <span className="font-pixel rounded-lg bg-[#e8b830] px-3 py-1.5 text-base text-[#2a1a10]">{t('jesus.play')}</span>
              <span className="flex items-center gap-1 text-sm tabular-nums text-white/70">
                <Trophy size={15} /> {vida.length}/11
              </span>
            </span>
          </span>
        </button>
        <p className="font-pixel mb-2 mt-1 px-1 text-lg">Mais aventuras de Jesus</p>
        <button
          onClick={() => setGame('run')}
          className="mb-3 flex w-full flex-col overflow-hidden rounded-3xl border-2 border-[#4a4238]/60 bg-[#f6f1e4] text-left text-[#4a4238] transition active:scale-[0.99] sm:flex-row"
        >
          <span className="block aspect-[200/112] w-full shrink-0 sm:w-72">
            <RunBanner />
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
            <span className="font-pixel text-2xl">{t('game.run')}</span>
            <span className="text-sm opacity-80">{t('games.run')}</span>
            <span className="mt-2 flex items-center justify-between gap-2">
              <span className="font-pixel rounded-lg bg-[#4a4238] px-3 py-1.5 text-base text-[#f6f1e4]">{t('jesus.play')}</span>
              <span className="flex items-center gap-1 text-sm tabular-nums opacity-70">
                <Trophy size={15} /> {best.jesusRun ?? 0} m
              </span>
            </span>
          </span>
        </button>
      </div>
    );

  // Stories still in development: visible, but not playable yet.
  const WIP = new Set<GameId>(['noah', 'esther']);
  const heroes = [
    { id: 'jesus' as const, name: 'Jesus', img: heroCard('jesus'), done: vida.length as number | null, total: 11 },
    { id: 'david' as const, name: 'Davi', img: heroCard('davi'), done: davi.length, total: 6 },
    { id: 'samson' as const, name: 'Sansão', img: heroCard('sansao'), done: sansao.length, total: 6 },
    { id: 'peter' as const, name: 'Pedro', img: heroCard('pedro'), done: pedro.length, total: 6 },
    { id: 'noah' as const, name: 'Noé', img: heroCard('noe'), done: noe.length, total: 5 },
    { id: 'joseph' as const, name: 'José', img: heroCard('jose'), done: jose.length, total: 7 },
    { id: 'esther' as const, name: 'Ester', img: heroCard('ester'), done: ester.length, total: 10 },
  ];
  return (
    <div className="mx-auto max-w-4xl">
      <p className="font-pixel mb-2 px-1 text-xl">{t('games.heroes')}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {heroes.map((h) => (
          <button
            key={h.id}
            onClick={() => (WIP.has(h.id as GameId) ? undefined : h.id === 'jesus' ? setHero('jesus') : setGame(h.id))}
            aria-disabled={WIP.has(h.id as GameId)}
            aria-label={WIP.has(h.id as GameId) ? `${h.name}: em desenvolvimento` : h.name}
            className={cx(
              'group relative overflow-hidden rounded-2xl border-[3px] border-[#5b3a1e] bg-[#2a1a10] text-left transition',
              WIP.has(h.id as GameId) ? 'cursor-not-allowed' : 'active:scale-95',
            )}
          >
            <img
              src={h.img}
              alt=""
              className={cx('block aspect-[3/4] w-full object-cover transition', WIP.has(h.id as GameId) ? 'opacity-60 grayscale' : 'group-hover:scale-105')}
              loading="lazy"
            />
            {WIP.has(h.id as GameId) && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45">
                <span className="h-9 w-9 animate-spin rounded-full border-4 border-[#e8b830] border-t-transparent" aria-hidden />
                <span className="font-pixel rounded-sm bg-[#2a1a10]/90 px-2 py-0.5 text-center text-sm leading-tight text-[#ffe08a]">
                  Em desenvolvimento
                  <span className="block text-xs text-white/80">em breve</span>
                </span>
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2.5 pb-2 pt-8">
              <span className="font-pixel text-2xl text-white drop-shadow-[2px_2px_0_#000]">{h.name}</span>
              {h.done !== null && !WIP.has(h.id as GameId) && (
                <span className="flex items-center gap-1 text-xs tabular-nums text-white/80">
                  <Trophy size={13} /> {h.done}/{h.total}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 px-1 text-xs text-muted">
        Músicas dos jogos: Purrple Cat (
        <a className="underline" href="https://purrplecat.com" target="_blank" rel="noreferrer">
          purrplecat.com
        </a>
        ), licença{' '}
        <a className="underline" href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        . Convertidas para mono e comprimidas.
      </p>
    </div>
  );
}
