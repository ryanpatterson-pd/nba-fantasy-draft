'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { STATS, STATS_MAP, STATS_WITH_DATA, type StatRow } from '@/lib/draft/stats-board';
import { pullBoard, pushBoard, SYNC_ENABLED } from '@/lib/draft/war-room-sync';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { createPersistentStore } from '@/lib/storage/persistent-store';

/** A stat row plus how far ESPN's draft rank sits from its avg-FPTS rank. */
export type Bargain = StatRow & { valueGap: number };

/** How often to poll the shared board for other devices' changes. */
const POLL_MS = 5000;

export type SyncStatus = 'off' | 'connecting' | 'live' | 'error';

/**
 * War Room board state.
 *
 * Two things persist to the browser so the board survives a refresh mid-draft:
 *   - `drafted`: player ids that have come off the board (crossed out live)
 *   - `queue`:   your own pre-ranked shortlist, in the order you'd take them
 *
 * The composite ranking itself is computed, not stored — it's derived from the
 * player pool and re-runs identically every time, so there's nothing to save.
 *
 * As with draft night, everything talks to this one hook. Swapping localStorage
 * for a shared realtime backend later (so the whole draft syncs live across
 * devices) means changing only this file.
 */

const STORAGE_KEY = 'nbafd.warroom.board.v1';

type BoardState = {
  version: 1;
  /** Player ids already selected (by anyone) — crossed off the board. */
  drafted: string[];
  /** Your personal target order, player ids, best first. */
  queue: string[];
};

const emptyState: BoardState = { version: 1, drafted: [], queue: [] };

const store = createPersistentStore<BoardState>(STORAGE_KEY, emptyState, {
  deserialize: (raw) => {
    const candidate = raw as BoardState | null;
    if (!candidate || candidate.version !== 1) return null;
    return {
      version: 1,
      drafted: Array.isArray(candidate.drafted) ? candidate.drafted.filter((id) => STATS_MAP[id]) : [],
      queue: Array.isArray(candidate.queue) ? candidate.queue.filter((id) => STATS_MAP[id]) : [],
    };
  },
});

export function useWarRoom(seasonId = 'default') {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useIsHydrated();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(SYNC_ENABLED ? 'connecting' : 'off');
  // The last drafted list we sent to (or received from) the server. Lets the
  // push effect skip no-op writes and the poll effect skip echoing our own
  // changes back into the store.
  const lastSyncedRef = useRef<string>('');

  const draftedSet = useMemo(() => new Set(state.drafted), [state.drafted]);
  const queueSet = useMemo(() => new Set(state.queue), [state.queue]);

  // ── Live sync ─────────────────────────────────────────────────────────────
  // The drafted list (only) syncs across devices when a backend is configured.
  // On first load we merge the remote list with anything already crossed off
  // locally, so no device loses picks. After that, local edits push up and a
  // poll pulls other devices' edits down. Your personal `queue` never leaves
  // this device.
  useEffect(() => {
    if (!SYNC_ENABLED || !hydrated) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function initialMerge() {
      const remote = await pullBoard(seasonId);
      if (cancelled) return;
      if (!remote) {
        setSyncStatus('error');
        return;
      }
      // Union of local + remote, so the first sync never drops a pick made
      // offline on either side.
      const local = store.getSnapshot().drafted;
      const merged = Array.from(new Set([...remote.drafted, ...local])).filter((id) => STATS_MAP[id]);
      lastSyncedRef.current = JSON.stringify([...merged].sort());
      store.set((prev) => ({ ...prev, drafted: merged }));
      if (merged.length !== remote.drafted.length) void pushBoard(seasonId, merged);
      setSyncStatus('live');

      timer = setInterval(async () => {
        const snap = await pullBoard(seasonId);
        if (cancelled || !snap) return;
        const key = JSON.stringify([...snap.drafted].sort());
        // Only apply if the remote differs from what we last synced — avoids
        // clobbering an in-flight local edit with a stale poll.
        if (key !== lastSyncedRef.current) {
          lastSyncedRef.current = key;
          const clean = snap.drafted.filter((id) => STATS_MAP[id]);
          store.set((prev) => ({ ...prev, drafted: clean }));
        }
      }, POLL_MS);
    }

    void initialMerge();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [seasonId, hydrated]);

  // Push local drafted changes up. Debounced by comparing against the last
  // synced signature so rapid toggles collapse into one write per settle.
  useEffect(() => {
    if (!SYNC_ENABLED || !hydrated || syncStatus === 'connecting') return;
    const key = JSON.stringify([...state.drafted].sort());
    if (key === lastSyncedRef.current) return;
    lastSyncedRef.current = key;
    const t = setTimeout(() => {
      void pushBoard(seasonId, state.drafted).then((ok) => setSyncStatus(ok ? 'live' : 'error'));
    }, 350);
    return () => clearTimeout(t);
  }, [state.drafted, seasonId, hydrated, syncStatus]);

  // The stats board: real last-season actuals. Static, so no recompute needed.
  const rows = STATS;

  /**
   * Bargains — players whose last-season production (avg-FPTS rank) sits well
   * ahead of where ESPN drafts them this year. valueGap = espnRank − avgRank;
   * a big positive gap means "produced like a star, going late". Only players
   * with real data and a genuine gap qualify.
   */
  const bargains = useMemo<Bargain[]>(
    () =>
      STATS_WITH_DATA.map((r) => ({ ...r, valueGap: r.espnRank - r.avgRank }))
        .filter((r) => r.valueGap >= 12)
        .sort((a, b) => b.valueGap - a.valueGap),
    [],
  );

  /** Best available now: top undrafted by average fantasy points. */
  const bestAvailable = useMemo(
    () =>
      [...STATS_WITH_DATA]
        .filter((r) => !draftedSet.has(r.id))
        .sort((a, b) => b.avgFpts - a.avgFpts),
    [draftedSet],
  );

  const toggleDrafted = useCallback((id: string) => {
    store.set((prev) => {
      const drafted = prev.drafted.includes(id)
        ? prev.drafted.filter((x) => x !== id)
        : [...prev.drafted, id];
      return { ...prev, drafted };
    });
  }, []);

  const addToQueue = useCallback((id: string) => {
    store.set((prev) => (prev.queue.includes(id) ? prev : { ...prev, queue: [...prev.queue, id] }));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    store.set((prev) => ({ ...prev, queue: prev.queue.filter((x) => x !== id) }));
  }, []);

  const toggleQueue = useCallback((id: string) => {
    store.set((prev) =>
      prev.queue.includes(id)
        ? { ...prev, queue: prev.queue.filter((x) => x !== id) }
        : { ...prev, queue: [...prev.queue, id] },
    );
  }, []);

  /** Move a queued player up (dir -1) or down (dir +1) in your shortlist. */
  const moveInQueue = useCallback((id: string, dir: -1 | 1) => {
    store.set((prev) => {
      const idx = prev.queue.indexOf(id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.queue.length) return prev;
      const queue = [...prev.queue];
      [queue[idx], queue[target]] = [queue[target], queue[idx]];
      return { ...prev, queue };
    });
  }, []);

  /** Seed your shortlist from the top of the board by avg FPTS (undrafted). */
  const autoFillQueue = useCallback(
    (count = 15) => {
      store.set((prev) => {
        const drafted = new Set(prev.drafted);
        const top = [...STATS_WITH_DATA]
          .filter((r) => !drafted.has(r.id))
          .sort((a, b) => b.avgFpts - a.avgFpts)
          .slice(0, count)
          .map((r) => r.id);
        return { ...prev, queue: top };
      });
    },
    [],
  );

  const clearQueue = useCallback(() => {
    store.set((prev) => (prev.queue.length === 0 ? prev : { ...prev, queue: [] }));
  }, []);

  const resetAll = useCallback(() => {
    store.reset();
    // Clear the shared board too, so a reset propagates to other devices
    // instead of the next poll re-hydrating everyone with the old picks.
    if (SYNC_ENABLED) {
      lastSyncedRef.current = JSON.stringify([]);
      void pushBoard(seasonId, []);
    }
  }, [seasonId]);

  return {
    hydrated,
    syncStatus,
    rows,
    bargains,
    bestAvailable,
    statsMap: STATS_MAP,
    drafted: state.drafted,
    draftedSet,
    queue: state.queue,
    queueSet,
    isDrafted: (id: string) => draftedSet.has(id),
    isQueued: (id: string) => queueSet.has(id),
    toggleDrafted,
    addToQueue,
    removeFromQueue,
    toggleQueue,
    moveInQueue,
    autoFillQueue,
    clearQueue,
    resetAll,
  };
}

export type WarRoomController = ReturnType<typeof useWarRoom>;
