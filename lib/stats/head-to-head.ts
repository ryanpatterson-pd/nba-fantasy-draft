import { MANAGER_IDS } from '@/lib/data/managers';
import { MATCHUPS } from '@/lib/data/league';
import type { HeadToHead } from '@/lib/types';
import { seasonsPlayedBy } from './season';
import { winRate, winnerOf } from './tally';

/** All-time head-to-head grid: every manager against every other manager. */

function buildMatrix(): Map<string, Map<string, HeadToHead>> {
  const matrix = new Map<string, Map<string, HeadToHead>>();

  for (const managerId of MANAGER_IDS) {
    const row = new Map<string, HeadToHead>();
    for (const opponentId of MANAGER_IDS) {
      if (opponentId === managerId) continue;
      row.set(opponentId, {
        managerId,
        opponentId,
        wins: 0,
        losses: 0,
        ties: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        games: 0,
      });
    }
    matrix.set(managerId, row);
  }

  for (const game of MATCHUPS) {
    const winner = winnerOf(game);
    const pairs = [
      { self: game.homeId, opp: game.awayId, selfScore: game.homeScore, oppScore: game.awayScore },
      { self: game.awayId, opp: game.homeId, selfScore: game.awayScore, oppScore: game.homeScore },
    ];

    for (const { self, opp, selfScore, oppScore } of pairs) {
      const cell = matrix.get(self)?.get(opp);
      if (!cell) continue;
      cell.games += 1;
      cell.pointsFor += selfScore;
      cell.pointsAgainst += oppScore;
      if (winner === null) cell.ties += 1;
      else if (winner === self) cell.wins += 1;
      else cell.losses += 1;
    }
  }

  return matrix;
}

export const H2H_MATRIX = buildMatrix();

export function headToHead(managerId: string, opponentId: string): HeadToHead | undefined {
  return H2H_MATRIX.get(managerId)?.get(opponentId);
}

export function headToHeadRow(managerId: string): HeadToHead[] {
  const row = H2H_MATRIX.get(managerId);
  if (!row) return [];
  return MANAGER_IDS.filter((id) => id !== managerId).map((id) => row.get(id)!);
}

/**
 * Best and worst matchups for a manager.
 *
 * Two filters keep the answer meaningful rather than merely true:
 *
 * - `minGames` drops pairings too short to mean anything.
 * - `minSeasons` drops opponents who were only in the league briefly. A 2–0
 *   record against someone who played one season is not a rivalry.
 *
 * Ranking is by win rate, then by **games played**. That tiebreak is the whole
 * point: 10–0 and 4–0 are both 100%, but the ten-game sweep is the real claim.
 * Full ledgers (the matrix, the per-manager list) stay unfiltered — this is only
 * for picking a single headline opponent.
 */
export function rivalries(
  managerId: string,
  { minGames = 4, minSeasons = 2 }: { minGames?: number; minSeasons?: number } = {},
) {
  const row = headToHeadRow(managerId).filter(
    (cell) =>
      cell.games >= minGames && seasonsPlayedBy(cell.opponentId).length >= minSeasons,
  );
  if (row.length === 0) return { bully: undefined, nemesis: undefined };

  // Each end needs its own pass. Taking the first and last of a single sort
  // would hand the nemesis the *fewest* games among equally bad records, which
  // is the opposite of what the tiebreak is for.
  const best = [...row].sort((a, b) => winRate(b) - winRate(a) || b.games - a.games);
  const worst = [...row].sort((a, b) => winRate(a) - winRate(b) || b.games - a.games);

  return { bully: best[0], nemesis: worst[0] };
}
