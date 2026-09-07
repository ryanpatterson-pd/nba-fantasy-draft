import { MANAGER_IDS, getManager } from '@/lib/data/managers';
import { MATCHUPS } from '@/lib/data/league';
import { COMPLETED_SEASONS, getSeason } from '@/lib/data/seasons';
import type { Matchup } from '@/lib/types';
import { record as formatRecord } from '@/lib/utils/format';
import { ALL_TIME, allTimeFor } from './all-time';
import { ALL_SEASON_RECORDS } from './season';
import { isDraw } from './tally';

/**
 * The record book.
 *
 * Every entry is computed from the matchup list, so the numbers can never drift
 * out of sync with the rest of the site.
 */

export type RecordEntry = {
  id: string;
  title: string;
  /** Headline figure. */
  value: string;
  /** Who holds it. */
  holder: string;
  /** Manager id when a single manager holds it, for avatars and links. */
  managerId?: string;
  /** Supporting line: season, opponent, context. */
  detail: string;
  /** Grouping for the records page. */
  group: 'career' | 'season' | 'single-game' | 'silverware';
};

/** Minimum seasons before a rate-based record counts. */
const MIN_SEASONS_FOR_RATE = 1;

const STAGE_LABELS: Partial<Record<Matchup['stage'], string>> = {
  final: 'Grand Final',
  semi: 'Semi final',
  quarter: 'Quarter final',
  playoff: 'Playoffs',
};

function margin(game: Matchup): number {
  return Math.abs(game.homeScore - game.awayScore);
}

function seasonLabel(seasonId: string): string {
  return getSeason(seasonId)?.label ?? seasonId;
}

function nameOf(managerId: string): string {
  return getManager(managerId).name;
}

function describeGame(game: Matchup): string {
  const stage = STAGE_LABELS[game.stage] ?? `Week ${game.week}`;
  const context = `${seasonLabel(game.seasonId)} ${stage}`;

  if (isDraw(game)) {
    return `${nameOf(game.homeId)} drew with ${nameOf(game.awayId)} on ${game.homeScore.toLocaleString()} · ${context}`;
  }

  const winnerIsHome = game.homeScore > game.awayScore;
  const winner = winnerIsHome ? game.homeId : game.awayId;
  const loser = winnerIsHome ? game.awayId : game.homeId;
  const high = Math.max(game.homeScore, game.awayScore);
  const low = Math.min(game.homeScore, game.awayScore);
  return `${nameOf(winner)} ${high.toLocaleString()} d. ${nameOf(loser)} ${low.toLocaleString()} · ${context}`;
}

/** Highest and lowest single-week scores across all of history. */
function weekExtremes() {
  let highest = { managerId: '', score: -Infinity, game: MATCHUPS[0] };
  let lowest = { managerId: '', score: Infinity, game: MATCHUPS[0] };

  for (const game of MATCHUPS) {
    const sides = [
      { managerId: game.homeId, score: game.homeScore },
      { managerId: game.awayId, score: game.awayScore },
    ];
    for (const side of sides) {
      if (side.score > highest.score) highest = { ...side, game };
      if (side.score < lowest.score) lowest = { ...side, game };
    }
  }

  return { highest, lowest };
}

function gameExtremes() {
  const sorted = [...MATCHUPS].sort((a, b) => margin(a) - margin(b));
  const finals = MATCHUPS.filter((g) => g.stage === 'final').sort((a, b) => margin(a) - margin(b));
  return {
    closest: sorted[0],
    biggest: sorted[sorted.length - 1],
    closestFinal: finals[0],
    biggestFinal: finals[finals.length - 1],
  };
}

function topBy<T>(items: T[], value: (item: T) => number): { winners: T[]; value: number } {
  const best = items.reduce((max, item) => Math.max(max, value(item)), -Infinity);
  return { winners: items.filter((item) => value(item) === best), value: best };
}

function holderLabel(ids: string[]): string {
  if (ids.length === 1) return nameOf(ids[0]);
  if (ids.length <= 3) return ids.map(nameOf).join(' · ');
  return `${ids.length}-way tie`;
}

export function buildRecordBook(): RecordEntry[] {
  const { highest, lowest } = weekExtremes();
  const { closest, biggest, closestFinal, biggestFinal } = gameExtremes();

  const eligibleForRate = ALL_TIME.filter((r) => r.seasonsPlayed >= MIN_SEASONS_FOR_RATE);
  const mostTitles = topBy(ALL_TIME, (r) => r.titles);
  const mostWins = topBy(ALL_TIME, (r) => r.wins);
  const bestRate = topBy(eligibleForRate, (r) => r.winPct);
  const mostPoints = topBy(ALL_TIME, (r) => r.pointsFor);
  const mostFinals = topBy(ALL_TIME, (r) => r.finalsAppearances);
  const mostPlayoffs = topBy(ALL_TIME, (r) => r.playoffAppearances);
  const mostCrowns = topBy(ALL_TIME, (r) => r.regularSeasonCrowns);
  const mostSpoons = topBy(ALL_TIME, (r) => r.woodenSpoons);
  const longestStreak = topBy(ALL_TIME, (r) => r.longestWinStreak);

  const bestSeason = [...ALL_SEASON_RECORDS].sort(
    (a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor,
  )[0];
  const worstSeason = [...ALL_SEASON_RECORDS].sort(
    (a, b) => a.wins - b.wins || a.pointsFor - b.pointsFor,
  )[0];
  const highestSeasonPoints = [...ALL_SEASON_RECORDS].sort((a, b) => b.pointsFor - a.pointsFor)[0];

  const entries: RecordEntry[] = [
    {
      id: 'most-titles',
      group: 'silverware',
      title: 'Most championships',
      value: `${mostTitles.value}`,
      holder: holderLabel(mostTitles.winners.map((r) => r.managerId)),
      managerId: mostTitles.winners.length === 1 ? mostTitles.winners[0].managerId : undefined,
      detail: `Across ${COMPLETED_SEASONS.length} completed seasons`,
    },
    {
      id: 'most-finals',
      group: 'silverware',
      title: 'Most grand finals',
      value: `${mostFinals.value}`,
      holder: holderLabel(mostFinals.winners.map((r) => r.managerId)),
      managerId: mostFinals.winners.length === 1 ? mostFinals.winners[0].managerId : undefined,
      detail:
        mostFinals.winners.length === 1
          ? `Finals record ${formatRecord(
              mostFinals.winners[0].finalsRecord.wins,
              mostFinals.winners[0].finalsRecord.losses,
              mostFinals.winners[0].finalsRecord.ties,
            )}`
          : 'Shared record',
    },
    {
      id: 'most-crowns',
      group: 'silverware',
      title: 'Minor premierships',
      value: `${mostCrowns.value}`,
      holder: holderLabel(mostCrowns.winners.map((r) => r.managerId)),
      managerId: mostCrowns.winners.length === 1 ? mostCrowns.winners[0].managerId : undefined,
      detail: 'Finished the regular season as the number one seed',
    },
    {
      id: 'most-playoffs',
      group: 'silverware',
      title: 'Most playoff appearances',
      value: `${mostPlayoffs.value}`,
      holder: holderLabel(mostPlayoffs.winners.map((r) => r.managerId)),
      managerId: mostPlayoffs.winners.length === 1 ? mostPlayoffs.winners[0].managerId : undefined,
      detail: `Out of ${COMPLETED_SEASONS.length} possible`,
    },
    {
      id: 'most-wins',
      group: 'career',
      title: 'Most all-time wins',
      value: `${mostWins.value}`,
      holder: holderLabel(mostWins.winners.map((r) => r.managerId)),
      managerId: mostWins.winners.length === 1 ? mostWins.winners[0].managerId : undefined,
      detail:
        mostWins.winners.length === 1
          ? `${formatRecord(
              mostWins.winners[0].wins,
              mostWins.winners[0].losses,
              mostWins.winners[0].ties,
            )} from ${mostWins.winners[0].gamesPlayed} games`
          : 'Shared record',
    },
    {
      id: 'best-rate',
      group: 'career',
      title: 'Best win rate',
      value: `${(bestRate.value * 100).toFixed(1)}%`,
      holder: holderLabel(bestRate.winners.map((r) => r.managerId)),
      managerId: bestRate.winners.length === 1 ? bestRate.winners[0].managerId : undefined,
      detail:
        bestRate.winners.length === 1
          ? `${formatRecord(
              bestRate.winners[0].wins,
              bestRate.winners[0].losses,
              bestRate.winners[0].ties,
            )} from ${bestRate.winners[0].gamesPlayed} games`
          : 'Shared record',
    },
    {
      id: 'most-points',
      group: 'career',
      title: 'Most career points',
      value: mostPoints.value.toLocaleString(),
      holder: holderLabel(mostPoints.winners.map((r) => r.managerId)),
      managerId: mostPoints.winners.length === 1 ? mostPoints.winners[0].managerId : undefined,
      detail: 'Regular season fantasy points',
    },
    {
      id: 'longest-streak',
      group: 'career',
      title: 'Longest winning streak',
      value: `${longestStreak.value}`,
      holder: holderLabel(longestStreak.winners.map((r) => r.managerId)),
      managerId: longestStreak.winners.length === 1 ? longestStreak.winners[0].managerId : undefined,
      detail: 'Consecutive weeks won inside a single season',
    },
    {
      id: 'most-spoons',
      group: 'career',
      title: 'Wooden spoons',
      value: `${mostSpoons.value}`,
      holder: holderLabel(mostSpoons.winners.map((r) => r.managerId)),
      managerId: mostSpoons.winners.length === 1 ? mostSpoons.winners[0].managerId : undefined,
      detail: 'Finished last. Permanently recorded.',
    },
    {
      id: 'best-season',
      group: 'season',
      title: 'Best regular season',
      value: formatRecord(bestSeason.wins, bestSeason.losses, bestSeason.ties),
      holder: nameOf(bestSeason.managerId),
      managerId: bestSeason.managerId,
      detail: `${seasonLabel(bestSeason.seasonId)} · ${bestSeason.pointsFor.toLocaleString()} points`,
    },
    {
      id: 'worst-season',
      group: 'season',
      title: 'Worst regular season',
      value: formatRecord(worstSeason.wins, worstSeason.losses, worstSeason.ties),
      holder: nameOf(worstSeason.managerId),
      managerId: worstSeason.managerId,
      detail: `${seasonLabel(worstSeason.seasonId)} · ${worstSeason.pointsFor.toLocaleString()} points`,
    },
    {
      id: 'season-points',
      group: 'season',
      title: 'Most points in a season',
      value: highestSeasonPoints.pointsFor.toLocaleString(),
      holder: nameOf(highestSeasonPoints.managerId),
      managerId: highestSeasonPoints.managerId,
      detail: `${seasonLabel(highestSeasonPoints.seasonId)} · ${highestSeasonPoints.avgScore.toLocaleString()} per week`,
    },
    {
      id: 'highest-week',
      group: 'single-game',
      title: 'Highest single week',
      value: highest.score.toLocaleString(),
      holder: nameOf(highest.managerId),
      managerId: highest.managerId,
      detail: describeGame(highest.game),
    },
    {
      id: 'lowest-week',
      group: 'single-game',
      title: 'Lowest single week',
      value: lowest.score.toLocaleString(),
      holder: nameOf(lowest.managerId),
      managerId: lowest.managerId,
      detail: describeGame(lowest.game),
    },
    {
      id: 'biggest-blowout',
      group: 'single-game',
      title: 'Biggest blowout',
      value: `+${margin(biggest).toLocaleString()}`,
      holder: nameOf(biggest.homeScore >= biggest.awayScore ? biggest.homeId : biggest.awayId),
      managerId: biggest.homeScore >= biggest.awayScore ? biggest.homeId : biggest.awayId,
      detail: describeGame(biggest),
    },
    {
      id: 'closest-game',
      group: 'single-game',
      title: 'Closest game',
      // A drawn game is as close as it gets, so it has no single holder.
      value: isDraw(closest) ? 'Draw' : `+${margin(closest).toLocaleString()}`,
      holder: isDraw(closest)
        ? `${nameOf(closest.homeId)} · ${nameOf(closest.awayId)}`
        : nameOf(closest.homeScore > closest.awayScore ? closest.homeId : closest.awayId),
      managerId: isDraw(closest)
        ? undefined
        : closest.homeScore > closest.awayScore
          ? closest.homeId
          : closest.awayId,
      detail: describeGame(closest),
    },
  ];

  if (biggestFinal) {
    entries.push({
      id: 'biggest-final',
      group: 'single-game',
      title: 'Biggest grand final win',
      value: `+${margin(biggestFinal).toLocaleString()}`,
      holder: nameOf(
        biggestFinal.homeScore >= biggestFinal.awayScore ? biggestFinal.homeId : biggestFinal.awayId,
      ),
      managerId:
        biggestFinal.homeScore >= biggestFinal.awayScore ? biggestFinal.homeId : biggestFinal.awayId,
      detail: describeGame(biggestFinal),
    });
  }

  if (closestFinal) {
    entries.push({
      id: 'closest-final',
      group: 'single-game',
      title: 'Closest grand final',
      value: `+${margin(closestFinal).toLocaleString()}`,
      holder: nameOf(
        closestFinal.homeScore >= closestFinal.awayScore ? closestFinal.homeId : closestFinal.awayId,
      ),
      managerId:
        closestFinal.homeScore >= closestFinal.awayScore ? closestFinal.homeId : closestFinal.awayId,
      detail: describeGame(closestFinal),
    });
  }

  return entries;
}

export const RECORD_BOOK: RecordEntry[] = buildRecordBook();

export const RECORD_GROUPS: { id: RecordEntry['group']; label: string; blurb: string }[] = [
  { id: 'silverware', label: 'Silverware', blurb: 'Rings, finals and minor premierships.' },
  { id: 'career', label: 'Career', blurb: 'Everything accumulated across five seasons.' },
  { id: 'season', label: 'Single season', blurb: 'The best and worst individual campaigns.' },
  { id: 'single-game', label: 'Single game', blurb: 'One week, permanently on the wall.' },
];

/** Career line for a manager, e.g. "54–27 · 4 grand finals · 1 ring". */
export function careerLine(managerId: string): string {
  const record = allTimeFor(managerId);
  if (!record) return '';
  const parts = [formatRecord(record.wins, record.losses, record.ties)];
  if (record.titles > 0) parts.push(`${record.titles} ${record.titles === 1 ? 'ring' : 'rings'}`);
  parts.push(`${record.playoffAppearances}/${record.seasonsPlayed} playoffs`);
  return parts.join(' · ');
}

export const MANAGER_COUNT = MANAGER_IDS.length;
