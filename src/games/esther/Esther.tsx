import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { heroCard } from '../pixel/heroes';
import { ECHAPTERS, EITEMS, ELOOKS, ESPEAK, ESTHER_X } from './content';
import { Cipher, Doorkeepers, EstherAnswer, GardenPath, HatachRoute, Letters, Market, RoyalSeals, Shelves, TornLetter } from './games1';
import { BanquetTable, Chronicles, Couriers, FastTasks, KingAnswer, Petition, PurimDiff, ThroneWalk, VigilLamps, WhoDidWhat } from './games2';

const all = ECHAPTERS.map((c) => c.id);

const SAGA: Saga = {
  heroCast: 'ester',
  style: 'stealth',
  music: 'egito',
  chapterMusic: { jovem: 'canaa', hama: 'enigma', decisao: 'getsemani', jejum: 'noite', trono: 'prisao', banquete: 'enigma', verdade: 'prisao', salvacao: 'reencontro' },
  key: 'estherDone',
  title: 'Ester',
  blurb: 'Da casa de Mordecai ao trono da Pérsia: explore Susã, resolva enigmas e veja como a coragem de Ester salvou o seu povo. Jogue com o celular deitado.',
  note: 'Os acontecimentos vêm do livro de Ester (as falas com 📖 indicam a referência). Os desafios, os moradores e as servas que conversam com você são parte do jogo.',
  hero: ELOOKS.ester,
  finalLook: ELOOKS.rainha,
  card: heroCard('ester'),
  chapters: ECHAPTERS,
  speakers: ESPEAK,
  explore: ESTHER_X,
  items: EITEMS,
  achievements: [
    { icon: '🌅', title: 'Hadassa', desc: 'Conclua o primeiro capítulo.', test: (d) => d.includes('jovem') },
    { icon: '👑', title: 'Rainha da Pérsia', desc: 'Ester é coroada (capítulo 3).', test: (d) => d.includes('escolha') },
    { icon: '🕵️', title: 'Olhar atento', desc: '3 estrelas em “A escolha do rei” e “O plano de Hamã”.', test: (_, s) => s('escolha') >= 3 && s('hama') >= 3 },
    { icon: '🔱', title: 'Diante do rei', desc: 'Atravesse o pátio interior (capítulo 7).', test: (d) => d.includes('trono') },
    { icon: '📖', title: 'Para um tempo como este', desc: 'Termine a história de Ester.', test: (d) => all.every((c) => d.includes(c)) },
    { icon: '⭐', title: 'Sabedoria de rainha', desc: '3 estrelas em todos os capítulos.', test: (_, s) => all.every((c) => s(c) >= 3) },
  ],
  games: {
    jovem: [Market, TornLetter],
    palacio: [GardenPath, Shelves],
    escolha: [RoyalSeals, Doorkeepers],
    hama: [Cipher, Letters],
    decisao: [HatachRoute, EstherAnswer],
    jejum: [FastTasks, VigilLamps],
    trono: [ThroneWalk, KingAnswer],
    banquete: [BanquetTable, Chronicles],
    verdade: [Petition, WhoDidWhat],
    salvacao: [Couriers, PurimDiff],
  },
};

export default function Esther({ onBack }: { onBack: () => void }) {
  return <StoryMenu saga={SAGA} onBack={onBack} />;
}
