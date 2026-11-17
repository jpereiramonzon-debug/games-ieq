import { PETER_X } from '../platform/explore';
import { heroCard } from '../pixel/heroes';
import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { PCHAPTERS, PSPEAK } from './content';
import { CoinFish, Denial, DoYouLove, NetCast, Pentecost, WaterWalk } from './games';
import { PLOOKS } from './looks';

const SAGA: Saga = {
  heroCast: 'pedro',
  style: 'stealth',
  music: 'pedro',
  chapterMusic: { aguas: 'noite', moeda: 'canaa', negacao: 'noite', pentecostes: 'jesus' },
  quiet: ['pentecostes'],
  explore: PETER_X,
  key: 'peterDone',
  title: 'Pedro',
  blurb: 'De pescador de peixes a pescador de homens: a pesca maravilhosa, o mar agitado, a moeda no peixe, o galo que cantou, o “tu me amas?” e o Pentecostes.',
  hero: PLOOKS.pedro,
  finalLook: PLOOKS.pedro,
  card: heroCard('pedro'),
  chapters: PCHAPTERS,
  speakers: PSPEAK,
  games: {
    pesca: [NetCast],
    aguas: [WaterWalk],
    moeda: [CoinFish],
    negacao: [Denial],
    amas: [DoYouLove],
    pentecostes: [Pentecost],
  },
};

export default function Peter({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
