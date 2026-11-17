import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { JOSEPH_X } from '../platform/explore';
import { heroCard } from '../pixel/heroes';
import { XCHAPTERS, XLOOKS, XSPEAK } from './content';
import { Clues, Desert, Granary, Harvest, Interpret, PharaohDream, Reveal, Seats, Sheaves, Stars, Storeroom, Temptation } from './games';

const SAGA: Saga = {
  heroCast: 'jose',
  style: 'stealth',
  music: 'canaa',
  chapterMusic: { traicao: 'deserto', potifar: 'egito', prisao: 'prisao', farao: 'egito', governador: 'enigma', reencontro: 'reencontro' },
  key: 'josephDone',
  title: 'José do Egito',
  blurb: 'Dos sonhos em Canaã ao palácio do Faraó: explore, resolva enigmas e veja como Deus transformou o mal em bem. Jogue com o celular deitado.',
  hero: XLOOKS.jose,
  finalLook: XLOOKS.joseEgito,
  card: heroCard('jose'),
  chapters: XCHAPTERS,
  speakers: XSPEAK,
  explore: JOSEPH_X,
  games: {
    sonhos: [Sheaves, Stars],
    traicao: [Desert],
    potifar: [Storeroom, Temptation],
    prisao: [Clues, Interpret],
    farao: [PharaohDream, Harvest],
    governador: [Granary],
    reencontro: [Seats, Reveal],
  },
};

export default function Joseph({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
