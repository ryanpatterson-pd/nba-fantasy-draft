import { isPlayoffGame, matchupsForSeason } from '@/lib/data/league';
import {
  COMPLETED_SEASONS,
  fieldSizeOf,
  getImportedSeason,
  participantsOf,
} from '@/lib/data/seasons';
import type { Matchup, SeasonRecord, SeasonResultLabel } from '@/lib/types';
import { longestWinStreak, scoresFor, tally, winnerOf } from './tally';

/**
 * Season records.
 *
 * A season is judged on the home-and-away ladder plus the championship bracket.
 * Placement games are not imported, so `ladderPosition` is the league's measure
 * of where someone finished — the wooden spoon is last on the ladder.
 *
 * Ladder position and team names come from ESPN. Everything else is derived from
 * the matchup list.
 */

export type PlayoffBracket = {
  quarterFinals: Matchup[];
  semiFinals: Matchup[];
  grandFinal: Matchup | undefined;
};

function splitBracket(games: Matchup[]): PlayoffBracket {
  return {
    quarterFinals: games.filter((g) => g.stage === 'quarter'),
    semiFinals: games.filter((g) => g.stage === 'semi'),
    grandFinal: games.find((g) => g.stage === 'final'),
  };
}

export function bracketFor(seasonId: string): PlayoffBracket {
  return splitBracket(matchupsForSeason(seasonId));
}

/** How far a manager got in the championship bracket. */
function resultFor(
  managerId: string,
  ladderPosition: number,
  playoffTeams: number,
  bracket: PlayoffBracket,
): SeasonResultLabel {
  const { grandFinal, semiFinals, quarterFinals } = bracket;

  if (grandFinal && (grandFinal.homeId === managerId || grandFinal.awayId === managerId)) {
    return winnerOf(grandFinal) === managerId ? 'champion' : 'runner-up';
  }
  if (semiFinals.some((g) => g.homeId === managerId || g.awayId === managerId)) {
    return 'semi-finalist';
  }
  if (quarterFinals.some((g) => g.homeId === managerId || g.awayId === managerId)) {
    return 'quarter-finalist';
  }
  return ladderPosition > 0 && ladderPosition <= playoffTeams
    ? 'quarter-finalist'
    : 'missed-playoffs';
}

export function seasonRecords(seasonId: string): SeasonRecord[] {
  const imported = getImportedSeason(seasonId);
  if (!imported) return [];

  const games = matchupsForSeason(seasonId);
  const ids = participantsOf(seasonId);
  const regular = games.filter((g) => g.stage === 'regular');
  const playoffs = games.filter(isPlayoffGame);

  const regularTally = tally(regular, ids);
  const playoffTally = tally(playoffs, ids);
  const bracket = splitBracket(games);
  const fieldSize = imported.teams.length;

  return imported.teams.map((team) => {
    const row = regularTally.get(team.managerId);
    const playoffRow = playoffTally.get(team.managerId);
    // High, low and average use every counted game, playoffs included — a big
    // semi-final is a genuine season high.
    const allScores = scoresFor(games, team.managerId);

    return {
      seasonId,
      managerId: team.managerId,
      teamName: team.teamName,
      wins: row?.wins ?? 0,
      losses: row?.losses ?? 0,
      ties: row?.ties ?? 0,
      playoffWins: playoffRow?.wins ?? 0,
      playoffLosses: playoffRow?.losses ?? 0,
      pointsFor: row?.pointsFor ?? 0,
      pointsAgainst: row?.pointsAgainst ?? 0,
      ladderPosition: team.ladderPosition,
      fieldSize,
      madePlayoffs: team.ladderPosition > 0 && team.ladderPosition <= imported.playoffTeams,
      result: resultFor(team.managerId, team.ladderPosition, imported.playoffTeams, bracket),
      bestStreak: longestWinStreak(games, team.managerId),
      highestWeek: allScores.length ? Math.max(...allScores) : 0,
      lowestWeek: allScores.length ? Math.min(...allScores) : 0,
      avgScore: allScores.length
        ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
        : 0,
    } satisfies SeasonRecord;
  });
}

const recordCache = new Map<string, SeasonRecord[]>();

export function getSeasonRecords(seasonId: string): SeasonRecord[] {
  const cached = recordCache.get(seasonId);
  if (cached) return cached;
  const built = seasonRecords(seasonId);
  recordCache.set(seasonId, built);
  return built;
}

export const ALL_SEASON_RECORDS: SeasonRecord[] = COMPLETED_SEASONS.flatMap((s) =>
  getSeasonRecords(s.id),
);

/** The season table, ordered by the home-and-away ladder. */
export function seasonTable(seasonId: string): SeasonRecord[] {
  return [...getSeasonRecords(seasonId)].sort((a, b) => a.ladderPosition - b.ladderPosition);
}

export function championOf(seasonId: string): SeasonRecord | undefined {
  return getSeasonRecords(seasonId).find((r) => r.result === 'champion');
}

export function runnerUpOf(seasonId: string): SeasonRecord | undefined {
  return getSeasonRecords(seasonId).find((r) => r.result === 'runner-up');
}

export function minorPremierOf(seasonId: string): SeasonRecord | undefined {
  return getSeasonRecords(seasonId).find((r) => r.ladderPosition === 1);
}

export function woodenSpoonOf(seasonId: string): SeasonRecord | undefined {
  const last = fieldSizeOf(seasonId);
  return getSeasonRecords(seasonId).find((r) => r.ladderPosition === last);
}

export function recordFor(seasonId: string, managerId: string): SeasonRecord | undefined {
  return getSeasonRecords(seasonId).find((r) => r.managerId === managerId);
}

/* --------------------------------------------------------------- team names */

/** That season's team name for a manager. These change year to year. */
export function teamNameFor(seasonId: string, managerId: string): string | undefined {
  return getImportedSeason(seasonId)?.teams.find((t) => t.managerId === managerId)?.teamName;
}

/** Most recent team name a manager used, for profile headers and rosters. */
export function latestTeamName(managerId: string): string | undefined {
  for (let i = COMPLETED_SEASONS.length - 1; i >= 0; i -= 1) {
    const name = teamNameFor(COMPLETED_SEASONS[i].id, managerId);
    if (name) return name;
  }
  return undefined;
}

/** Seasons a manager actually played in. */
export function seasonsPlayedBy(managerId: string): string[] {
  return COMPLETED_SEASONS.filter((s) => participantsOf(s.id).includes(managerId)).map((s) => s.id);
}

export type ChampionshipRing = {
  seasonId: string;
  /** Display label, e.g. "2022/23". */
  label: string;
  /** Ending calendar year, used for the ring image filename. */
  year: number;
  /** public/ path, e.g. "/rings/2023-ring.png". */
  image: string;
};

/**
 * A manager's championship rings, oldest first.
 *
 * The image filename uses the season's ending calendar year, so the 2022/23
 * season maps to /rings/2023-ring.png. Drop one PNG per winning year into
 * public/rings and it appears; a missing file falls back to a gold disc.
 */
export function championshipRingsFor(managerId: string): ChampionshipRing[] {
  return COMPLETED_SEASONS.filter(
    (season) => championOf(season.id)?.managerId === managerId,
  ).map((season) => {
    const year = season.startYear + 1;
    return {
      seasonId: season.id,
      label: season.label,
      year,
      image: `/rings/${year}-ring.png`,
    };
  });
}
