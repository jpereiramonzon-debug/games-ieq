import { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';
import { engine } from './audio/engine';
import GamesHub, { type GameId } from './GamesHub';
import { useT } from './i18n';
import { get, set, useStore, type Lang } from './store';
import { Segmented, Sheet, Slider, Toggle } from './ui/kit';

export default function App() {
  const t = useT();
  const [game, setGame] = useState<GameId | null>(null);
  const [settings, setSettings] = useState(false);
  const lang = useStore((s) => s.lang);
  const volume = useStore((s) => s.volume);
  const bgm = useStore((s) => s.bgm);
  const voice = useStore((s) => s.jesusVoice);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
  }, [lang]);

  // Browsers only allow audio after a gesture, and suspend it in the background.
  useEffect(() => {
    const unlock = () => engine.init();
    const onVisible = () => engine.setHidden(document.visibilityState === 'hidden');
    window.addEventListener('pointerdown', unlock, { capture: true });
    window.addEventListener('keydown', unlock, { capture: true });
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pointerdown', unlock, { capture: true });
      window.removeEventListener('keydown', unlock, { capture: true });
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {game === null && (
        <header className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <h1 className="font-pixel text-2xl">
            Jogos <span className="text-[#e8b830]">IEQ</span>
          </h1>
          <button onClick={() => setSettings(true)} aria-label={t('settings.title')} className="grid h-11 w-11 place-items-center rounded-full bg-surface hover:bg-raised">
            <Settings size={20} />
          </button>
        </header>
      )}
      <main className="px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <GamesHub game={game} setGame={setGame} />
      </main>
      {settings && (
        <Sheet title={t('settings.title')} onClose={() => setSettings(false)}>
          <div className="flex flex-col gap-4">
            <Segmented<Lang>
              value={lang}
              onChange={(v) => set({ lang: v })}
              options={[
                { value: 'pt', label: 'Português' },
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
            <Slider label="Volume" value={volume} onChange={(v) => set({ volume: v })} />
            <Toggle label="Música de fundo" checked={bgm} onChange={(v) => set({ bgm: v })} />
            <Toggle label="Voz de Jesus" checked={voice} onChange={(v) => set({ jesusVoice: v })} />
          </div>
        </Sheet>
      )}
    </div>
  );
}

// Handy while developing and in tests: window.aura.get() / window.aura.set().
if (import.meta.env.DEV) (window as unknown as { aura: unknown }).aura = { engine, get, set };
