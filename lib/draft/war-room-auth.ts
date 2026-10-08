'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { createPersistentStore } from '@/lib/storage/persistent-store';

/**
 * War Room access gate.
 *
 * The draft board is private — it holds the pre-planned pick order you don't
 * want the rest of the league seeing. It sits behind a shared access code and
 * an unlisted route (/draft/war-room) reached only via the padlock in the draft
 * header. This is deterrence, not hard security: it's a static site, so the
 * code lives client-side. It keeps honest leaguemates out, nothing more. If you
 * ever need real security, move the gate to a server route with an env secret.
 *
 * Change the code by setting NEXT_PUBLIC_WAR_ROOM_CODE in .env.local; it falls
 * back to a default so the feature works out of the box in development.
 */
const ACCESS_CODE = process.env.NEXT_PUBLIC_WAR_ROOM_CODE ?? 'hornpub2026';

const UNLOCK_KEY = 'nbafd.warroom.unlocked.v1';

const unlockStore = createPersistentStore<boolean>(UNLOCK_KEY, false, {
  deserialize: (raw) => (raw === true ? true : null),
});

export function useWarRoomAuth() {
  const unlocked = useSyncExternalStore(
    unlockStore.subscribe,
    unlockStore.getSnapshot,
    unlockStore.getServerSnapshot,
  );

  /** Returns true on a correct code (case-insensitive, trimmed). */
  const tryUnlock = useCallback((code: string): boolean => {
    const ok = code.trim().toLowerCase() === ACCESS_CODE.trim().toLowerCase();
    if (ok) unlockStore.set(true);
    return ok;
  }, []);

  const lock = useCallback(() => unlockStore.reset(), []);

  return { unlocked, tryUnlock, lock };
}
