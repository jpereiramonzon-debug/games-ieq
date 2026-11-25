import { DAVID_X } from '../platform/explore';
import { StoryMenu, type Saga } from '../pixel/StoryMode';
import { CHAPTERS, DSPEAK } from './content';
import { Anoint, Ark, Cave, Goliath, Harp, Shepherd, Stones } from './games';
import { DLOOKS } from './looks';
import { heroCard } from '../pixel/heroes';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { DuoMode, inviteCode } from './coop/DuoMode';

const SAGA: Saga = {
  heroCast: 'davi',
  style: 'sling',
  music: 'davi',
  chapterMusic: { caverna: 'noite', arca: 'reencontro' },
  quiet: ['harpa', 'arca'],
  explore: DAVID_X,
  key: 'davidDone',
  title: 'Davi',
  blurb: 'Do pastoreio ao trono: viva as passagens mais famosas da vida de Davi, de Belém até Jerusalém. Jogue com o celular deitado.',
  hero: DLOOKS.davi,
  finalLook: DLOOKS.rei,
  card: heroCard('davi'),
  chapters: CHAPTERS,
  speakers: DSPEAK,
  games: {
    pastor: [Shepherd],
    uncao: [Anoint],
    harpa: [Harp],
    golias: [Stones, Goliath],
    caverna: [Cave],
    arca: [Ark],
  },
};

export default function David({ onBack }: { onBack: () => void }) {
  // An invite link (?sala=CODE) opens the two-player mode ready to join.
  const [duo, setDuo] = useState<string | null>(() => inviteCode() || null);
  return (
    <>
      <StoryMenu
        saga={SAGA}
        onBack={onBack}
        extra={
          <button onClick={() => setDuo('')} className="rpg-wood rpg-text flex items-center justify-center gap-2 px-3 py-2 text-lg active:translate-y-0.5">
            <Users size={20} /> Modo Dupla online: Davi e Jônatas
          </button>
        }
      />
      {duo !== null && <DuoMode join={duo || undefined} onExit={() => setDuo(null)} />}
    </>
  );
}
