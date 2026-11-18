/**
 * Offline play: registers the service worker (production builds only) and
 * downloads the background music into the same cache the music player uses,
 * so every game works without internet after one visit online.
 */
import { useSyncExternalStore } from 'react';
import type { Track } from './games/bgm';

const MUSIC_CACHE = 'aurapads-music-v1';
const TRACKS: Track[] = ['menu', 'davi', 'sansao', 'pedro', 'noite', 'noe', 'jesus', 'getsemani', 'canaa', 'deserto', 'egito', 'prisao', 'reencontro', 'enigma'];

export interface OfflineState {
  /** 'unsupported': browser can't; 'preparing': saving the game; 'ready': game saved. */
  app: 'unsupported' | 'preparing' | 'ready' | 'error';
  musicDone: number;
  musicTotal: number;
  downloading: boolean;
}

let state: OfflineState = { app: 'preparing', musicDone: 0, musicTotal: TRACKS.length, downloading: false };
const listeners = new Set<() => void>();
const update = (patch: Partial<OfflineState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => (listeners.add(l), () => listeners.delete(l));

export const useOffline = () => useSyncExternalStore(subscribe, () => state);
export const offlineState = () => state;

const musicUrl = (t: string) => `${import.meta.env.BASE_URL}music/${t}.mp3`;

/** Saves every music track that is not cached yet (one at a time, quietly). */
export async function downloadMusic() {
  if (state.downloading || !('caches' in window)) return;
  update({ downloading: true });
  try {
    const cache = await caches.open(MUSIC_CACHE);
    let done = 0;
    for (const t of TRACKS) {
      const url = musicUrl(t);
      if (!(await cache.match(url))) {
        if (!navigator.onLine) break;
        try {
          const res = await fetch(url, { cache: 'no-store' });
          const type = res.headers.get('content-type') ?? '';
          if (!res.ok || (type && !/audio|mpeg|octet-stream/.test(type))) continue;
          const blob = await res.blob();
          if (blob.size < 1024) continue;
          await cache.put(url, new Response(blob, { headers: { 'content-type': type || 'audio/mpeg' } }));
        } catch {
          continue;
        }
      }
      update({ musicDone: ++done });
    }
  } catch {
    /* storage blocked */
  } finally {
    update({ downloading: false });
  }
}

export function setupOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !('caches' in window)) {
    update({ app: 'unsupported' });
    return;
  }
  // Ask the browser not to clear our saved files when space runs low.
  navigator.storage?.persist?.().catch(() => {});
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      update({ app: 'ready' });
      downloadMusic();
    } catch {
      update({ app: 'error' });
    }
  });
  window.addEventListener('online', () => downloadMusic());
}
