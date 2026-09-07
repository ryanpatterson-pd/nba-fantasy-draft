'use client';

import { useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * False during server rendering and the hydration pass, true afterwards.
 *
 * Effect-free, so it does not trigger a cascading render. Use it to hold back
 * UI that depends on browser-only state (localStorage, the current time) until
 * the client has taken over.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
