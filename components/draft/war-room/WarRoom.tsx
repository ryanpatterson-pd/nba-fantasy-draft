'use client';

import { WarRoomGate } from '@/components/draft/war-room/WarRoomGate';
import { WarRoomHub } from '@/components/draft/war-room/WarRoomHub';
import { useWarRoomAuth } from '@/lib/draft/war-room-auth';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';

/**
 * War Room entry point: shows the lock screen until the access code is entered,
 * then the full board. The unlock persists, so once you're in it stays in on
 * this device until you press Lock.
 */
export function WarRoom({ seasonId }: { seasonId: string }) {
  const { unlocked, tryUnlock, lock } = useWarRoomAuth();
  const hydrated = useIsHydrated();

  // Until the client has read the persisted unlock, render nothing decisive so
  // the server and first client paint agree (both locked = false pre-hydration
  // is fine, but we avoid flashing the gate for already-unlocked users).
  if (!hydrated) return null;

  return unlocked ? (
    <WarRoomHub seasonId={seasonId} onLock={lock} />
  ) : (
    <WarRoomGate onUnlock={tryUnlock} />
  );
}
