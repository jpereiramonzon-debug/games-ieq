import { LIFE_X } from '../platform/explore';
import { heroCard } from '../pixel/heroes';
import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { JCHAPTERS, JLOOKS, JSPEAK } from './content';
import { Baptism, Beatitudes, Cana, Desert, Loaves, Roof, Sower, WordShield } from './games1';
import { BlindPath, EmptyTomb, Gethsemane, Storm, Tomb } from './games2';

const SAGA: Saga = {
  heroCast: 'jesus',
  style: 'peace',
  music: 'jesus',
  chapterMusic: { deserto: 'deserto', tempestade: 'noe', getsemani: 'getsemani', ressurreicao: 'reencontro', lazaro: 'getsemani' },
  explore: LIFE_X,
  key: 'lifeDone',
  title: 'Jesus: o caminho',
  blurb: 'Do Jordão ao túmulo vazio: viva o ministério de Jesus em 11 capítulos de exploração, puzzles, milagres, curas e resistência contra o inimigo. Jogue com o celular deitado.',
  hero: JLOOKS.jesus,
  finalLook: JLOOKS.jesus,
  card: heroCard('jesus'),
  chapters: JCHAPTERS,
  speakers: JSPEAK,
  games: {
    batismo: [Baptism],
    deserto: [Desert, WordShield],
    cana: [Cana],
    paralitico: [Roof],
    monte: [Beatitudes, Sower],
    paes: [Loaves],
    tempestade: [Storm],
    cego: [BlindPath],
    lazaro: [Tomb],
    getsemani: [Gethsemane],
    ressurreicao: [EmptyTomb],
  },
};

export default function Life({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
