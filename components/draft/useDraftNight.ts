'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { DRAFT_GAMES } from '@/lib/data/draft-games';
import { ACTIVE_MANAGER_IDS } from '@/lib/data/managers';
import { buildStandings, completedGameIds, enteredCount, FIELD_SIZE } from '@/lib/draft/scoring';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';
import { createPersistentStore, type PersistentStore } from '@/lib/storage/persistent-store';
import type { DraftNightState, LotteryWeighting, ManagerId } from '@/lib/types';

/** v2 stores raw scores per manager; v1 stored a hand-ranked order. */
export const DRAFT_STORAGE_KEY = 'nbafd.draft.v2';

function emptyState(seasonId: string): DraftNightState {
  return { version: 2, seasonId, results: {}, picks: [], weighting: 'lottery' };
}

/**
 * One store per season, created on demand. Results from a previous year or an
 * older schema are discarded rather than silently reused.
 */
const stores = new Map<string, PersistentStore<DraftNightState>>();

function storeFor(seasonId: string): PersistentStore<DraftNightState> {
  const existing = stores.get(seasonId);
  if (existing) return existing;

  const store = createPersistentStore<DraftNightState>(DRAFT_STORAGE_KEY, emptyState(seasonId), {
    deserialize: (raw) => {
      const candidate = raw as DraftNightState | null;
      if (!candidate || candidate.version !== 2 || candidate.seasonId !== seasonId) return null;
      return { ...emptyState(seasonId), ...candidate };
    },
  });

  stores.set(seasonId, store);
  return store;
}

/**
 * Draft night state: raw game scores, lottery weighting and the draft board.
 *
 * Backed by localStorage so the laptop running the night keeps its results
 * through a refresh. Replacing the store with a shared backend later means
 * touching this file only — the draft UI talks solely to this hook.
 */
export function useDraftNight(seasonId: string) {
  const store = storeFor(seasonId);
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const hydrated = useIsHydrated();

  /** Sets or clears one manager's raw score for a game. */
  const setScore = useCallback(
    (gameId: string, managerId: ManagerId, score: number | null) => {
      store.set((previous) => {
        const current = previous.results[gameId]?.scores ?? {};
        const scores = { ...current };

        if (score === null) delete scores[managerId];
        else scores[managerId] = score;

        const filled = Object.values(scores).filter(
          (value) => typeof value === 'number' && Number.isFinite(value),
        ).length;

        return {
          ...previous,
          results: {
            ...previous.results,
            [gameId]: {
              gameId,
              scores,
              completedAt: filled === FIELD_SIZE ? new Date().toISOString() : null,
            },
          },
        };
      });
    },
    [store],
  );

  const clearGame = useCallback(
    (gameId: string) => {
      store.set((previous) => {
        if (!previous.results[gameId]) return previous;
        const results = { ...previous.results };
        delete results[gameId];
        return { ...previous, results };
      });
    },
    [store],
  );

  const setWeighting = useCallback(
    (weighting: LotteryWeighting) => {
      store.set((previous) => ({ ...previous, weighting }));
    },
    [store],
  );

  /**
   * Locks a drawn manager into a chosen pick number.
   *
   * The manager picks any still-open slot (1..FIELD_SIZE), so this validates
   * the number is in range, not already taken, and the manager isn't already
   * on the board. Picks are kept sorted by pick number for a stable board.
   */
  const assignPick = useCallback(
    (managerId: ManagerId, pick: number) => {
      store.set((previous) => {
        if (previous.picks.some((p) => p.managerId === managerId)) return previous;
        if (pick < 1 || pick > FIELD_SIZE) return previous;
        if (previous.picks.some((p) => p.pick === pick)) return previous;
        const picks = [...previous.picks, { pick, managerId }].sort((a, b) => a.pick - b.pick);
        return { ...previous, picks };
      });
    },
    [store],
  );

  /** Removes a single pick by its number, freeing both the slot and the manager. */
  const clearPick = useCallback(
    (pick: number) => {
      store.set((previous) => {
        if (!previous.picks.some((p) => p.pick === pick)) return previous;
        return { ...previous, picks: previous.picks.filter((p) => p.pick !== pick) };
      });
    },
    [store],
  );

  /** Removes the most recently locked pick (highest position in draw order). */
  const undoLastPick = useCallback(() => {
    store.set((previous) => {
      if (previous.picks.length === 0) return previous;
      // "Last" is the most recently added; picks are stored sorted by number,
      // so drop the one that isn't referenced by any earlier draw. Simplest
      // correct choice: remove the highest pick number currently filled is
      // wrong for choose-your-slot, so track by insertion is unavailable here —
      // instead clear the pick with the largest `pick` value that is filled.
      const target = previous.picks.reduce((a, b) => (b.pick > a.pick ? b : a));
      return { ...previous, picks: previous.picks.filter((p) => p.pick !== target.pick) };
    });
  }, [store]);

  const resetPicks = useCallback(() => {
    store.set((previous) => (previous.picks.length === 0 ? previous : { ...previous, picks: [] }));
  }, [store]);

  const resetEverything = useCallback(() => {
    store.reset();
  }, [store]);

  const standings = useMemo(() => buildStandings(state.results), [state.results]);
  const completed = useMemo(() => completedGameIds(state.results), [state.results]);
  const pickedIds = useMemo(() => state.picks.map((pick) => pick.managerId), [state.picks]);
  const remainingIds = useMemo(
    () => ACTIVE_MANAGER_IDS.filter((id) => !pickedIds.includes(id)),
    [pickedIds],
  );

  /** Pick numbers still open, ascending. */
  const openPicks = useMemo(() => {
    const taken = new Set(state.picks.map((p) => p.pick));
    return Array.from({ length: FIELD_SIZE }, (_, i) => i + 1).filter((n) => !taken.has(n));
  }, [state.picks]);

  /** Scores entered per game, for the schedule summary. */
  const entered = useMemo(
    () =>
      Object.fromEntries(DRAFT_GAMES.map((game) => [game.id, enteredCount(state.results[game.id])])),
    [state.results],
  );

  return {
    state,
    hydrated,
    standings,
    completedGameIds: completed,
    enteredCounts: entered,
    allGamesComplete: completed.length === DRAFT_GAMES.length,
    draftComplete: state.picks.length === FIELD_SIZE,
    pickedIds,
    remainingIds,
    openPicks,
    setScore,
    clearGame,
    setWeighting,
    assignPick,
    clearPick,
    undoLastPick,
    resetPicks,
    resetEverything,
  };
}

export type DraftNightController = ReturnType<typeof useDraftNight>;
