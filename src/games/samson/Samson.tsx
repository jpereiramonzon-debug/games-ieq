import { SAMSON_X } from '../platform/explore';
import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { SCHAPTERS, SSPEAK } from './content';
import { Dagon, Delilah, Foxes, Gates, Jawbone, LionFight } from './games';
import { SLOOKS } from './looks';
import { heroCard } from '../pixel/heroes';

const SAGA: Saga = {
  heroCast: 'sansao',
  style: 'strong',
  music: 'sansao',
  chapterMusic: { leao: 'canaa', raposas: 'noite', gaza: 'noite', dalila: 'egito', dagom: 'prisao' },
  explore: SAMSON_X,
  key: 'samsonDone',
  title: 'Sansão',
  blurb: 'O valente de Deus: lute com o leão, apanhe as raposas, enfrente mil filisteus com uma queixada, carregue os portões de Gaza, resista a Dalila e derrube o templo de Dagom.',
  hero: SLOOKS.sansao,
  finalLook: SLOOKS.sansao,
  card: heroCard('sansao'),
  chapters: SCHAPTERS,
  speakers: SSPEAK,
  games: {
    leao: [LionFight],
    raposas: [Foxes],
    queixada: [Jawbone],
    gaza: [Gates],
    dalila: [Delilah],
    dagom: [Dagon],
  },
};

export default function Samson({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
