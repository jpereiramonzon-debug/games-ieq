import { NOAH_X } from '../platform/explore';
import { heroCard } from '../pixel/heroes';
import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { NCHAPTERS, NLOOKS, NSPEAK } from './content';
import { BuildArk, Dove, Flood, Pairs, Rainbow } from './games';

const SAGA: Saga = {
  heroCast: 'noe',
  style: 'peace',
  music: 'noe',
  chapterMusic: { arca: 'canaa', animais: 'canaa', arcoiris: 'menu' },
  quiet: ['arcoiris'],
  explore: NOAH_X,
  key: 'noahDone',
  title: 'Noé',
  blurb: 'O homem que andava com Deus: construa a arca, junte os animais dois a dois, atravesse o dilúvio, solte a pomba e veja o arco da aliança.',
  hero: NLOOKS.noe,
  finalLook: NLOOKS.noe,
  card: heroCard('noe'),
  chapters: NCHAPTERS,
  speakers: NSPEAK,
  games: {
    arca: [BuildArk],
    animais: [Pairs],
    diluvio: [Flood],
    pomba: [Dove],
    arcoiris: [Rainbow],
  },
};

export default function Noah({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
