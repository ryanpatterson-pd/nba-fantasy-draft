import type { Matchup } from '@/lib/types';

/**
 * Pure tally helpers over a list of matchups.
 *
 * These deliberately take data as arguments rather than importing it, so the
 * stats engine and any future backend can reuse them.
 *
 * Drawn games are real: the league has had one (2022/23 week 17). They count as
 * a tie for both managers rather than a win for whoever happened to be at home.
 */

export type TallyRow = {
  managerId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  games: number;
  scores: number[];
};

export function emptyRow(managerId: string): TallyRow {
  return {
    managerId,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    games: 0,
    scores: [],
  };
}

export function tally(matchups: Matchup[], managerIds: string[]): Map<string, TallyRow> {
  const rows = new Map<string, TallyRow>(managerIds.map((id) => [id, emptyRow(id)]));

  for (const game of matchups) {
    const home = rows.get(game.homeId);
    const away = rows.get(game.awayId);
    if (!home || !away) continue;

    home.games += 1;
    away.games += 1;
    home.pointsFor += game.homeScore;
    home.pointsAgainst += game.awayScore;
    away.pointsFor += game.awayScore;
    away.pointsAgainst += game.homeScore;
    home.scores.push(game.homeScore);
    away.scores.push(game.awayScore);

    if (game.homeScore > game.awayScore) {
      home.wins += 1;
      away.losses += 1;
    } else if (game.awayScore > game.homeScore) {
      away.wins += 1;
      home.losses += 1;
    } else {
      home.ties += 1;
      away.ties += 1;
    }
  }

  return rows;
}

/** A tie counts as half a win, which is how ESPN computes its percentage. */
export function winRate(row: { wins: number; losses: number; ties: number }): number {
  const games = row.wins + row.losses + row.ties;
  return games === 0 ? 0 : (row.wins + row.ties * 0.5) / games;
}

/** Wins, then points for. Matches how ESPN breaks ties in H2H points leagues. */
export function compareStandings(a: TallyRow, b: TallyRow): number {
  if (b.wins !== a.wins) return b.wins - a.wins;
  return b.pointsFor - a.pointsFor;
}

export function standingsFrom(matchups: Matchup[], managerIds: string[]): TallyRow[] {
  return [...tally(matchups, managerIds).values()].sort(compareStandings);
}

export function isDraw(game: Matchup): boolean {
  return game.homeScore === game.awayScore;
}

/** The winner, or null for a drawn game. */
export function winnerOf(game: Matchup): string | null {
  if (isDraw(game)) return null;
  return game.homeScore > game.awayScore ? game.homeId : game.awayId;
}

/** The loser, or null for a drawn game. */
export function loserOf(game: Matchup): string | null {
  if (isDraw(game)) return null;
  return game.homeScore > game.awayScore ? game.awayId : game.homeId;
}

/** Longest run of consecutive wins. A draw ends a streak. */
export function longestWinStreak(matchups: Matchup[], managerId: string): number {
  const ordered = matchups
    .filter((m) => m.homeId === managerId || m.awayId === managerId)
    .sort((a, b) => a.week - b.week);

  let best = 0;
  let current = 0;
  for (const game of ordered) {
    if (winnerOf(game) === managerId) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function scoresFor(matchups: Matchup[], managerId: string): number[] {
  const out: number[] = [];
  for (const game of matchups) {
    if (game.homeId === managerId) out.push(game.homeScore);
    else if (game.awayId === managerId) out.push(game.awayScore);
  }
  return out;
}
