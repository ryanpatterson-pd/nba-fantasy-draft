import { MANAGERS, MANAGER_IDS } from '@/lib/data/managers';
import { MATCHUPS, isPlayoffGame, matchupsForManager } from '@/lib/data/league';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import type { AllTimeRecord, Matchup, SeasonRecord } from '@/lib/types';
import { getSeasonRecords } from './season';
import { longestLossStreak, longestWinStreak, scoresFor, tally, winRate, winnerOf } from './tally';

/**
 * The all-time database.
 *
 * Every number is derived from the matchup list, so "16 of 19" is a computed
 * fact rather than a typed-in claim.
 *
 * Consolation-ladder games count toward games played, wins, losses and points —
 * they were really played. They are excluded from `playoffRecord`, which
 * reflects the championship bracket only.
 */

function recordsByManager(): Map<string, SeasonRecord[]> {
  const map = new Map<string, SeasonRecord[]>(MANAGER_IDS.map((id) => [id, []]));
  for (const season of COMPLETED_SEASONS) {
    for (const record of getSeasonRecords(season.id)) {
      map.get(record.managerId)?.push(record);
    }
  }
  return map;
}

function stageRecord(games: Matchup[], managerId: string, include: (game: Matchup) => boolean) {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  for (const game of games) {
    if (!include(game)) continue;
    if (game.homeId !== managerId && game.awayId !== managerId) continue;
    const winner = winnerOf(game);
    if (winner === null) ties += 1;
    else if (winner === managerId) wins += 1;
    else losses += 1;
  }
  return { wins, losses, ties };
}

function buildAllTime(): AllTimeRecord[] {
  const seasonMap = recordsByManager();
  const totals = tally(MATCHUPS, MANAGER_IDS);

  return MANAGER_IDS.map((managerId) => {
    const seasons = seasonMap.get(managerId) ?? [];
    const row = totals.get(managerId);
    const games = matchupsForManager(managerId);
    const scores = scoresFor(games, managerId);
    const ladders = seasons.map((s) => s.ladderPosition);

    const wins = row?.wins ?? 0;
    const losses = row?.losses ?? 0;
    const ties = row?.ties ?? 0;
    const gamesPlayed = wins + losses + ties;
    const pointsFor = row?.pointsFor ?? 0;
    const pointsAgainst = row?.pointsAgainst ?? 0;

    return {
      managerId,
      seasonsPlayed: seasons.length,
      gamesPlayed,
      wins,
      losses,
      ties,
      winPct: winRate({ wins, losses, ties }),
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      avgScore: scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0,
      titles: seasons.filter((s) => s.result === 'champion').length,
      finalsAppearances: seasons.filter(
        (s) => s.result === 'champion' || s.result === 'runner-up',
      ).length,
      playoffAppearances: seasons.filter((s) => s.madePlayoffs).length,
      bestLadder: ladders.length ? Math.min(...ladders) : 0,
      worstLadder: ladders.length ? Math.max(...ladders) : 0,
      avgLadder: ladders.length ? ladders.reduce((sum, f) => sum + f, 0) / ladders.length : 0,
      highestWeek: scores.length ? Math.max(...scores) : 0,
      lowestWeek: scores.length ? Math.min(...scores) : 0,
      longestWinStreak: Math.max(
        0,
        ...COMPLETED_SEASONS.map((s) =>
          longestWinStreak(
            games.filter((g) => g.seasonId === s.id),
            managerId,
          ),
        ),
      ),
      longestLossStreak: Math.max(
        0,
        ...COMPLETED_SEASONS.map((s) =>
          longestLossStreak(
            games.filter((g) => g.seasonId === s.id),
            managerId,
          ),
        ),
      ),
      regularSeasonCrowns: seasons.filter((s) => s.ladderPosition === 1).length,
      // Last place is measured against that season's field size — 10 in 2021/22.
      woodenSpoons: seasons.filter((s) => s.ladderPosition === s.fieldSize).length,
      finalsRecord: stageRecord(games, managerId, (g) => g.stage === 'final'),
      playoffRecord: stageRecord(games, managerId, isPlayoffGame),
    } satisfies AllTimeRecord;
  }).filter((row) => row.seasonsPlayed > 0);
}

export const ALL_TIME: AllTimeRecord[] = buildAllTime();

const allTimeMap = new Map(ALL_TIME.map((r) => [r.managerId, r]));

export function allTimeFor(managerId: string): AllTimeRecord | undefined {
  return allTimeMap.get(managerId);
}

export type AllTimeSortKey = 'winPct' | 'wins' | 'titles' | 'pointsFor' | 'avgScore' | 'avgLadder';

export function sortAllTime(key: AllTimeSortKey = 'winPct'): AllTimeRecord[] {
  const rows = [...ALL_TIME];
  if (key === 'avgLadder') return rows.sort((a, b) => a.avgLadder - b.avgLadder);
  return rows.sort((a, b) => {
    const diff = (b[key] as number) - (a[key] as number);
    return diff !== 0 ? diff : b.winPct - a.winPct;
  });
}

/** The honour-roll order: titles, then finals, then win rate. */
export const HONOUR_ORDER: AllTimeRecord[] = [...ALL_TIME].sort((a, b) => {
  if (b.titles !== a.titles) return b.titles - a.titles;
  if (b.finalsAppearances !== a.finalsAppearances) return b.finalsAppearances - a.finalsAppearances;
  return b.winPct - a.winPct;
});

export const LEAGUE_TOTALS = {
  seasons: COMPLETED_SEASONS.length,
  managers: MANAGERS.length,
  matchups: MATCHUPS.length,
  pointsScored: MATCHUPS.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0),
  distinctChampions: new Set(
    COMPLETED_SEASONS.map(
      (s) => getSeasonRecords(s.id).find((r) => r.result === 'champion')?.managerId,
    ).filter(Boolean),
  ).size,
};
