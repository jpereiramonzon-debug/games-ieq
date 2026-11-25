/**
 * Modo Dupla: create or join a room, pick a chapter (Davi decides), read the
 * story, wait until both are ready, play together, read the ending.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Share2, Users, Wifi, WifiOff, X } from 'lucide-react';
import { engine } from '../../../audio/engine';
import { cleanCode, newCode, Room } from '../../../net/room';
import { get, set, useStore } from '../../../store';
import { cx } from '../../../ui/kit';
import { Talk } from '../../pixel/StoryMode';
import { Portrait } from '../../pixel/Dialog';
import { RotateHint } from '../../pixel/orientation';
import { useBgm } from '../../bgm';
import { useMsg, useRoomStatus } from './link';
import { DUO_CHAPTERS, DUO_SPEAK, JONATAS, STAGE1, STAGE2, type DuoChapter } from './content';
import { DuoStage } from './DuoStage';
import { Defense } from './Defense';
import { Arrows } from './Arrows';
import { DSPEAK } from '../content';

/** Code from an invite link (?sala=CODE), read once. */
export const inviteCode = () => cleanCode(new URLSearchParams(location.search).get('sala') ?? '');

const inviteLink = (code: string) => `${location.origin}${location.pathname}?sala=${code}`;

export function DuoMode({ onExit, join }: { onExit: () => void; join?: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [code, setCode] = useState(join ?? '');
  const [chapter, setChapter] = useState<DuoChapter | null>(null);
  const status = useRoomStatus(room);
  const diff = useStore((s) => s.storyDiff);
  const done = useStore((s) => s.davidDuoDone);
  const stars = useStore((s) => s.stars);
  const [copied, setCopied] = useState(false);
  useBgm(chapter ? null : 'davi', 3);

  useEffect(() => {
    if (!room) return;
    // Closing the tab or leaving the page tells the partner at once.
    const bye = () => room.send({ t: 'bye' });
    window.addEventListener('pagehide', bye);
    return () => {
      window.removeEventListener('pagehide', bye);
      room.close();
    };
  }, [room]);
  useEffect(() => {
    // Clean the invite from the address bar so a reload does not join again.
    if (join) history.replaceState(null, '', location.pathname);
  }, [join]);

  const host = () => {
    engine.init();
    setRoom(new Room('host', newCode()).host());
  };
  const enter = () => {
    const c = cleanCode(code);
    if (c.length !== 5) return;
    engine.init();
    setRoom(new Room('guest', c).join());
  };
  const leave = () => {
    room?.close();
    setRoom(null);
    setChapter(null);
  };
  useMsg(room, 'menu', (m) => setChapter(DUO_CHAPTERS.find((c) => c.id === m.chapter) ?? null));
  useMsg(room, 'leave', () => setChapter(null));
  const pick = (c: DuoChapter) => {
    if (room?.role !== 'host') return;
    room.send({ t: 'menu', chapter: c.id, diff });
    setChapter(c);
  };
  const share = async () => {
    const url = inviteLink(room!.code);
    try {
      if (navigator.share) await navigator.share({ title: 'Jogos IEQ — Modo Dupla', text: `Vamos jogar Davi e Jônatas! Código da sala: ${room!.code}`, url });
      else throw new Error('no share');
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        /* the code is on screen anyway */
      }
    }
  };
  if (import.meta.env.DEV) (window as unknown as { __duoRoom: unknown }).__duoRoom = room;

  const open = status === 'open';
  return createPortal(
    <div className="fixed inset-0 z-50 select-none overflow-hidden bg-[#1a1410] font-pixel text-white" role="dialog" aria-modal="true" aria-label="Modo Dupla">
      {chapter && room && open ? (
        <Chapter key={chapter.id} room={room} chapter={chapter} diff={diff} onLeave={() => (room.role === 'host' && room.send({ t: 'leave' }), setChapter(null))} onNext={(c) => pick(c)} />
      ) : (
        <div className="absolute inset-0 flex overflow-y-auto p-3 pl-[max(3.5rem,calc(env(safe-area-inset-left)+3rem))]">
          <div className="m-auto flex w-full max-w-2xl flex-col gap-2">
            <div className="flex items-center gap-2">
              <Portrait look={DSPEAK.davi.look} className="h-14 w-14 short:h-11 short:w-11" />
              <Portrait look={JONATAS} className="h-14 w-14 short:h-11 short:w-11" />
              <div className="rpg-frame rpg-text flex-1 px-2 py-1 text-sm leading-snug short:text-xs">
                <span className="text-base text-[#ffe08a]">Modo Dupla — Davi e Jônatas</span>
                <br />
                Jogue com um amigo, cada um no seu celular. Quem cria a sala é Davi; quem entra é Jônatas.
              </div>
            </div>
            {!room && (
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={host} className="rpg-wood flex flex-col items-center gap-1 p-3 text-lg">
                  <Users size={22} /> Criar sala
                  <span className="text-xs opacity-80">Você será Davi</span>
                </button>
                <div className="rpg-frame rpg-text flex flex-col gap-1.5 p-2">
                  <span className="text-sm">Entrar numa sala (você será Jônatas)</span>
                  <div className="flex gap-1.5">
                    <input
                      value={code}
                      onChange={(e) => setCode(cleanCode(e.target.value))}
                      placeholder="CÓDIGO"
                      aria-label="Código da sala"
                      maxLength={5}
                      className="min-w-0 flex-1 rounded-sm border-2 border-[#5b3a1e] bg-[#f4e4c0] px-2 py-1 text-center text-xl tracking-[0.3em] text-[#3a2414] uppercase"
                    />
                    <button onClick={enter} disabled={cleanCode(code).length !== 5} className={cx('rpg-wood px-3 text-base', cleanCode(code).length !== 5 && 'opacity-50')}>
                      Entrar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {room && !open && (
              <div className="rpg-frame rpg-text flex flex-col items-center gap-2 p-3 text-center">
                {status === 'error' || status === 'closed' ? (
                  <>
                    <WifiOff size={26} />
                    <p className="text-base">{room.error || 'A conexão foi encerrada.'}</p>
                    <button className="rpg-wood px-4 py-1.5 text-base" onClick={leave}>
                      Voltar
                    </button>
                  </>
                ) : room.role === 'host' ? (
                  <>
                    <p className="text-sm">{status === 'waiting' ? 'Sala criada! Passe este código para o seu amigo:' : 'Criando a sala...'}</p>
                    {status === 'waiting' && (
                      <>
                        <p className="rounded-sm bg-[#2a1a10] px-4 py-1 text-4xl tracking-[0.35em] text-[#ffe08a]" aria-label="Código da sala">
                          {room.code}
                        </p>
                        <button className="rpg-wood flex items-center gap-2 px-3 py-1.5 text-base" onClick={share}>
                          {copied ? <Check size={18} /> : navigator.share ? <Share2 size={18} /> : <Copy size={18} />} {copied ? 'Link copiado!' : 'Enviar convite'}
                        </button>
                        <p className="animate-pulse text-sm">Esperando Jônatas entrar...</p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="animate-pulse text-base">Entrando na sala {room.code}...</p>
                )}
              </div>
            )}
            {room && open && (
              <>
                <div className="rpg-frame rpg-text flex items-center gap-2 px-2 py-1 text-sm">
                  <Wifi size={16} className="text-[#2a8a3a]" /> Conectados! Sala {room.code} · {room.rtt ? `${room.rtt} ms` : ''}
                  <span className="ml-auto text-[#ffe08a]">Você é {room.role === 'host' ? 'Davi' : 'Jônatas'}</span>
                </div>
                <p className="px-1 text-sm">{room.role === 'host' ? 'Escolha o capítulo:' : 'Davi escolhe o capítulo. Fique atento!'}</p>
                <ol className="grid gap-1.5 sm:grid-cols-2">
                  {DUO_CHAPTERS.map((c, i) => {
                    const st = stars[`davidDuo:${c.id}`] ?? 0;
                    return (
                      <li key={c.id}>
                        <button disabled={room.role !== 'host'} onClick={() => pick(c)} className={cx('rpg-frame rpg-text flex w-full items-center gap-2 px-2 py-1.5 text-left', room.role !== 'host' && 'cursor-default')}>
                          <span className={cx('grid h-8 w-8 shrink-0 place-items-center border-2 border-[#5b3a1e] text-lg', done.includes(c.id) ? 'bg-[#6a9a3a]' : 'bg-[#c8975a]')}>
                            {done.includes(c.id) ? <Check size={16} /> : i + 1}
                          </span>
                          <span className="min-w-0 flex-1 leading-tight">
                            {c.title}
                            <span className="block text-sm text-[#ffe08a]">{c.ref}</span>
                          </span>
                          <span className="shrink-0 text-lg tracking-tighter">
                            <span className="text-[#ffd23a]">{'★'.repeat(st)}</span>
                            <span className="opacity-30">{'★'.repeat(3 - st)}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
            {status === 'lost' && <p className="rpg-frame rpg-text px-2 py-1 text-sm">A conexão está instável... tentando continuar.</p>}
            <p className="px-1 text-xs opacity-70">Dica: se não conectar pelo 4G, tentem os dois no mesmo Wi‑Fi.</p>
          </div>
        </div>
      )}
      <button onClick={() => (leave(), onExit())} aria-label="Sair do modo dupla" className="rpg-wood rpg-text absolute left-[max(0.5rem,env(safe-area-inset-left))] top-2 z-30 grid h-10 w-10 place-items-center">
        <X size={18} />
      </button>
      {room && chapter && status !== 'open' && (
        <div className="absolute inset-0 z-40 flex bg-black/70 p-3">
          <div className="rpg-frame rpg-text m-auto flex max-w-md flex-col items-center gap-2 p-3 text-center">
            <WifiOff size={26} />
            <p>{status === 'lost' ? 'A conexão com o outro jogador caiu. Esperando ele voltar...' : room.error || 'O outro jogador saiu.'}</p>
            <button className="rpg-wood px-4 py-1.5" onClick={leave}>
              Voltar ao menu
            </button>
          </div>
        </div>
      )}
      <RotateHint onExit={() => (leave(), onExit())} />
    </div>,
    document.body,
  );
}

type Phase = 'intro' | 'wait' | 'game' | 'outro' | 'end';

function Chapter({ room, chapter, diff, onLeave, onNext }: { room: Room; chapter: DuoChapter; diff: number; onLeave: () => void; onNext: (c: DuoChapter) => void }) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(0);
  const [earned, setEarned] = useState(0);
  const ready = useRef({ me: false, mate: false });
  useBgm(phase === 'game' ? null : 'davi', 4);
  const tryStart = () => {
    if (room.role === 'host' && ready.current.me && ready.current.mate) {
      const s = Math.floor(Math.random() * 1e9);
      room.send({ t: 'start', seed: s, chapter: chapter.id });
      setSeed(s);
      setPhase('game');
    }
  };
  useMsg(room, 'ready', () => {
    ready.current.mate = true;
    tryStart();
  });
  useMsg(room, 'start', (m) => {
    if (m.chapter !== chapter.id) return;
    setSeed(m.seed as number);
    setPhase('game');
  });
  const introDone = () => {
    ready.current.me = true;
    room.send({ t: 'ready' });
    setPhase('wait');
    tryStart();
  };
  const win = (st: number) => {
    setEarned(st);
    const key = `davidDuo:${chapter.id}`;
    set({ davidDuoDone: [...new Set([...get().davidDuoDone, chapter.id])], stars: { ...get().stars, [key]: Math.max(get().stars[key] ?? 0, st) } });
    setPhase('outro');
  };
  const idx = DUO_CHAPTERS.indexOf(chapter);
  const following = DUO_CHAPTERS[idx + 1];
  const props = { room, role: room.role, diff, seed, onWin: win };
  if (import.meta.env.DEV) (window as unknown as { __duoChapter: unknown }).__duoChapter = { phase, setPhase, introDone };
  return (
    <>
      {phase === 'game' &&
        (chapter.game === 'stage1' ? (
          <DuoStage {...props} level={STAGE1} />
        ) : chapter.game === 'stage2' ? (
          <DuoStage {...props} level={STAGE2} />
        ) : chapter.game === 'defense' ? (
          <Defense {...props} />
        ) : (
          <Arrows {...props} />
        ))}
      {phase !== 'game' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#4a3420,#1a1410)]">
          <p className="absolute inset-x-0 top-[18%] text-center text-[#ffe08a]">
            <span className="block text-sm">Modo Dupla</span>
            <span className="text-3xl">{chapter.title}</span>
            <span className="block text-sm opacity-80">{chapter.ref}</span>
          </p>
        </div>
      )}
      {phase === 'intro' && <Talk lines={chapter.intro} speakers={DUO_SPEAK} onDone={introDone} />}
      {phase === 'wait' && (
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <p className="rpg-frame rpg-text animate-pulse px-3 py-2 text-base">Esperando {room.role === 'host' ? 'Jônatas' : 'Davi'} terminar de ler...</p>
        </div>
      )}
      {phase === 'outro' && <Talk lines={chapter.outro} speakers={DUO_SPEAK} onDone={() => setPhase('end')} />}
      {phase === 'end' && (
        <div className="absolute inset-0 z-20 flex overflow-y-auto bg-black/60 p-3">
          <div className="rpg-frame rpg-text m-auto flex max-w-md flex-col items-center gap-2 p-3 text-center">
            <div className="flex gap-2">
              <Portrait look={DSPEAK.davi.look} mood="happy" className="h-14 w-14" />
              <Portrait look={JONATAS} mood="happy" className="h-14 w-14" />
            </div>
            <p className="text-xl">Capítulo concluído em dupla!</p>
            <p className="text-3xl text-[#ffd23a]">
              {'★'.repeat(earned)}
              <span className="opacity-25">{'★'.repeat(3 - earned)}</span>
            </p>
            {room.role === 'host' ? (
              <>
                {following && (
                  <button className="rpg-wood min-h-11 w-full px-2 text-lg" onClick={() => onNext(following)}>
                    Próximo: {following.title}
                  </button>
                )}
                <button className="rpg-wood h-10 w-full text-base" onClick={onLeave}>
                  Escolher outro capítulo
                </button>
              </>
            ) : (
              <p className="text-sm text-[#ffe08a]">Davi escolhe o próximo capítulo.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
