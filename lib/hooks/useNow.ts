'use client';

import { useSyncExternalStore } from 'react';

/**
 * A ticking clock modelled as an external store.
 *
 * The snapshot is the current time truncated to `resolution`, so React only
 * re-renders when the displayed value would actually change. Returns null while
 * server rendering and during hydration, which keeps the markup stable.
 */
function createClock(resolution: number) {
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (timer === null) {
      timer = setInterval(() => {
        for (const l of listeners) l();
      }, Math.min(resolution, 500));
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
  }

  function getSnapshot(): number {
    return Math.floor(Date.now() / resolution) * resolution;
  }

  return { subscribe, getSnapshot };
}

const SECOND_CLOCK = createClock(1000);

/** Current time in ms, updated every second. Null until hydrated. */
export function useNow(): number | null {
  return useSyncExternalStore(
    SECOND_CLOCK.subscribe,
    SECOND_CLOCK.getSnapshot,
    () => null,
  );
}
