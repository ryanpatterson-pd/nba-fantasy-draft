import { DRAFT_GAMES, DRAFT_GAME_MAP } from '@/lib/data/draft-games';
import { ACTIVE_MANAGERS } from '@/lib/data/managers';
import type { DraftGame, GamePlacing, GameResult, ManagerId } from '@/lib/types';

/**
 * Draft night scoring.
 *
 * You enter raw scores; this derives everything else. In a field of twelve,
 * first place earns 12 points and last earns 1, so every game carries identical
 * weight and nobody is mathematically out of it until the final event.
 *
 * Ties are not broken. Managers on the same raw score share a placing and split
 * the points for the slots they occupy, which keeps the pool at exactly 78
 * points per game no matter how many people tie.
 */

// Draft night is for the active roster only — departed managers are excluded.
export const FIELD_SIZE = ACTIVE_MANAGERS.length;

export function pointsForPlacing(placing: number, fieldSize = FIELD_SIZE): number {
  if (placing < 1 || placing > fieldSize) return 0;
  return fieldSize + 1 - placing;
}

/** Points available per game, top to bottom. Used by the rules panel. */
export const POINTS_LADDER = Array.from({ length: FIELD_SIZE }, (_, i) => ({
  placing: i + 1,
  points: pointsForPlacing(i + 1),
}));

export const MAX_POSSIBLE_POINTS = DRAFT_GAMES.length * FIELD_SIZE;

/** Total points handed out in a single game, regardless of ties. */
export const POINTS_PER_GAME = POINTS_LADDER.reduce((sum, entry) => sum + entry.points, 0);

/**
 * Ranks the entered scores for one game.
 *
 * Returns one entry per manager who has a score, ordered best to worst.
 * Managers without a score are simply absent.
 */
export function placingsFor(game: DraftGame, scores: Record<ManagerId, number>): GamePlacing[] {
  const entered = Object.entries(scores)
    .filter(([, score]) => typeof score === 'number' && Number.isFinite(score))
    .map(([managerId, score]) => ({ managerId, score }));

  if (entered.length === 0) return [];

  const sign = game.scoring.direction === 'lower-wins' ? 1 : -1;
  entered.sort((a, b) => sign * (a.score - b.score));

  const out: GamePlacing[] = [];
  let index = 0;

  while (index < entered.length) {
    // Collect everyone on this exact score.
    let end = index + 1;
    while (end < entered.length && entered[end].score === entered[index].score) end += 1;

    const groupSize = end - index;
    const placing = index + 1;

    // Split the points for the slots this group occupies.
    let pool = 0;
    for (let slot = placing; slot < placing + groupSize; slot += 1) {
      pool += pointsForPlacing(slot);
    }
    const points = pool / groupSize;

    for (let i = index; i < end; i += 1) {
      out.push({
        managerId: entered[i].managerId,
        score: entered[i].score,
        placing,
        points,
        tied: groupSize > 1,
      });
    }

    index = end;
  }

  return out;
}

export function enteredCount(result: GameResult | undefined): number {
  if (!result) return 0;
  return Object.values(result.scores).filter((score) => typeof score === 'number' && Number.isFinite(score))
    .length;
}

export function isGameComplete(result: GameResult | undefined, fieldSize = FIELD_SIZE): boolean {
  return enteredCount(result) === fieldSize;
}

export function completedGameIds(results: Record<string, GameResult>): string[] {
  return DRAFT_GAMES.filter((game) => isGameComplete(results[game.id])).map((game) => game.id);
}

export type DraftStandingRow = {
  managerId: ManagerId;
  points: number;
  gamesPlayed: number;
  /** Placings indexed by game id. */
  placings: Record<string, number>;
  firsts: number;
  podiums: number;
  bestPlacing: number | null;
  averagePlacing: number | null;
  /** Position on the overall ladder, 1-based. */
  rank: number;
  /** True when this manager is tied on points with another. */
  tied: boolean;
};

/**
 * Builds the overall ladder from whatever results have been entered so far.
 * Only fully entered games count, so a half-finished event never distorts odds.
 */
export function buildStandings(results: Record<string, GameResult>): DraftStandingRow[] {
  const rows = new Map<ManagerId, DraftStandingRow>(
    ACTIVE_MANAGERS.map((manager) => [
      manager.id,
      {
        managerId: manager.id,
        points: 0,
        gamesPlayed: 0,
        placings: {},
        firsts: 0,
        podiums: 0,
        bestPlacing: null,
        averagePlacing: null,
        rank: 0,
        tied: false,
      },
    ]),
  );

  for (const gameId of completedGameIds(results)) {
    const game = DRAFT_GAME_MAP[gameId];
    if (!game) continue;

    for (const placing of placingsFor(game, results[gameId].scores)) {
      const row = rows.get(placing.managerId);
      if (!row) continue;
      row.placings[gameId] = placing.placing;
      row.points += placing.points;
      row.gamesPlayed += 1;
      if (placing.placing === 1) row.firsts += 1;
      if (placing.placing <= 3) row.podiums += 1;
      row.bestPlacing =
        row.bestPlacing === null ? placing.placing : Math.min(row.bestPlacing, placing.placing);
    }
  }

  const list = [...rows.values()].map((row) => {
    const placings = Object.values(row.placings);
    return {
      ...row,
      // Guard against float drift from split points.
      points: Math.round(row.points * 100) / 100,
      averagePlacing: placings.length
        ? placings.reduce((sum, p) => sum + p, 0) / placings.length
        : null,
    };
  });

  // Points, then most wins, then best average placing, then id for stability.
  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.firsts !== a.firsts) return b.firsts - a.firsts;
    const avgA = a.averagePlacing ?? 99;
    const avgB = b.averagePlacing ?? 99;
    if (avgA !== avgB) return avgA - avgB;
    return a.managerId.localeCompare(b.managerId);
  });

  return list.map((row, index) => ({
    ...row,
    rank: index + 1,
    tied: list.some((other) => other.managerId !== row.managerId && other.points === row.points),
  }));
}

/** Points still on the table across the remaining games. */
export function pointsRemaining(results: Record<string, GameResult>): number {
  const done = completedGameIds(results).length;
  return (DRAFT_GAMES.length - done) * FIELD_SIZE;
}

export function progressLabel(results: Record<string, GameResult>): string {
  const done = completedGameIds(results).length;
  return `${done} of ${DRAFT_GAMES.length} games`;
}

/** Ladder points can be fractional after a tie, so trim the trailing `.0`. */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
