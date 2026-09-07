import type { Matchup } from '@/lib/types';
import { IMPORTED_SEASONS } from './seasons';

/**
 * Single source of truth for every game ever played.
 *
 * Flattened from the imported season files. Every stat on the site derives from
 * this list, so a corrected score in an imported file ripples everywhere.
 */
export const MATCHUPS: Matchup[] = IMPORTED_SEASONS.flatMap((season) =>
  season.matchups.map((game) => ({
    seasonId: season.id,
    week: game.week,
    stage: game.stage,
    homeId: game.homeId,
    awayId: game.awayId,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
  })),
);

const bySeason = new Map<string, Matchup[]>();
for (const game of MATCHUPS) {
  const list = bySeason.get(game.seasonId);
  if (list) list.push(game);
  else bySeason.set(game.seasonId, [game]);
}

export function matchupsForSeason(seasonId: string): Matchup[] {
  return bySeason.get(seasonId) ?? [];
}

export function matchupsForManager(managerId: string): Matchup[] {
  return MATCHUPS.filter((m) => m.homeId === managerId || m.awayId === managerId);
}

/** Championship-bracket stages. Consolation ladders are excluded. */
export const PLAYOFF_STAGES: Matchup['stage'][] = ['quarter', 'semi', 'final', 'playoff'];

export function isPlayoffGame(game: Matchup): boolean {
  return PLAYOFF_STAGES.includes(game.stage);
}

/** False now that real ESPN results are in place. */
export const USING_SAMPLE_DATA = false;
