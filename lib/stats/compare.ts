import { getManager } from '@/lib/data/managers';
import type { Manager } from '@/lib/types';
import { allTimeFor } from '@/lib/stats/all-time';
import { headToHead } from '@/lib/stats/head-to-head';
import { latestTeamName } from '@/lib/stats/season';
import { num, pct, record } from '@/lib/utils/format';

/**
 * The manager-vs-manager comparison model.
 *
 * Everything is derived from the existing all-time and head-to-head layers, so a
 * comparison can never disagree with the rest of the site. A row carries both
 * managers' display values plus the numeric basis for a meter and which side (if
 * either) is ahead — the view only renders.
 */

/** Which side leads a row, or neither. */
export type Side = 'a' | 'b' | 'tie';

export type CompareRow = {
  key: string;
  label: string;
  /** Display strings, already formatted. */
  aDisplay: string;
  bDisplay: string;
  /** Raw numbers, for the dueling meter. */
  aValue: number;
  bValue: number;
  /** Winner of this row. `higherIsBetter` decides the direction. */
  leader: Side;
  /** Some rows (like avg ladder) are better when lower. */
  higherIsBetter: boolean;
};

export type CompareHeadline = {
  managerId: string;
  name: string;
  teamName?: string;
  nickname?: string;
  /** Career win rate as a display string, e.g. "62.5%". */
  winPctDisplay: string;
  /** All-time record display, e.g. "76–32". */
  recordDisplay: string;
  titles: number;
};

export type Comparison = {
  a: CompareHeadline;
  b: CompareHeadline;
  rows: CompareRow[];
  /** The all-time series between the two, from A's perspective. */
  series: {
    games: number;
    aWins: number;
    bWins: number;
    ties: number;
    /** Formatted line, e.g. "Ryan leads 9–2" or "First meeting". */
    line: string;
    /** Who leads the series. */
    leader: Side;
  };
};

function leaderOf(a: number, b: number, higherIsBetter: boolean): Side {
  if (a === b) return 'tie';
  const aAhead = higherIsBetter ? a > b : a < b;
  return aAhead ? 'a' : 'b';
}

function headline(managerId: string): CompareHeadline {
  const manager: Manager = getManager(managerId);
  const career = allTimeFor(managerId);
  return {
    managerId,
    name: manager.name,
    teamName: latestTeamName(managerId) ?? undefined,
    nickname: manager.nickname || undefined,
    winPctDisplay: career ? pct(career.winPct) : '—',
    recordDisplay: career ? record(career.wins, career.losses, career.ties) : '—',
    titles: career?.titles ?? 0,
  };
}

/**
 * Builds the full comparison between two managers.
 *
 * Rows cover the headline career metrics people actually argue about: rings,
 * win rate, total wins, points, scoring average, playoff appearances and ladder
 * finishes. Averages that reward a low number (ladder position) are flagged so
 * the meter and the winner read the right way round.
 */
export function compareManagers(aId: string, bId: string): Comparison {
  const a = allTimeFor(aId);
  const b = allTimeFor(bId);

  const rows: CompareRow[] = [];

  const push = (
    key: string,
    label: string,
    aValue: number,
    bValue: number,
    aDisplay: string,
    bDisplay: string,
    higherIsBetter = true,
  ) => {
    rows.push({
      key,
      label,
      aValue,
      bValue,
      aDisplay,
      bDisplay,
      higherIsBetter,
      leader: leaderOf(aValue, bValue, higherIsBetter),
    });
  };

  if (a && b) {
    push('titles', 'Championships', a.titles, b.titles, String(a.titles), String(b.titles));
    push(
      'winPct',
      'Win rate',
      a.winPct,
      b.winPct,
      pct(a.winPct),
      pct(b.winPct),
    );
    push('wins', 'Total wins', a.wins, b.wins, num(a.wins), num(b.wins));
    push(
      'finals',
      'Grand finals',
      a.finalsAppearances,
      b.finalsAppearances,
      String(a.finalsAppearances),
      String(b.finalsAppearances),
    );
    push(
      'playoffs',
      'Playoff appearances',
      a.playoffAppearances,
      b.playoffAppearances,
      `${a.playoffAppearances}/${a.seasonsPlayed}`,
      `${b.playoffAppearances}/${b.seasonsPlayed}`,
    );
    push(
      'avgScore',
      'Avg week',
      a.avgScore,
      b.avgScore,
      num(Math.round(a.avgScore)),
      num(Math.round(b.avgScore)),
    );
    push(
      'pointsFor',
      'Points for',
      a.pointsFor,
      b.pointsFor,
      num(a.pointsFor),
      num(b.pointsFor),
    );
    push(
      'highestWeek',
      'Highest week',
      a.highestWeek,
      b.highestWeek,
      num(a.highestWeek),
      num(b.highestWeek),
    );
    push(
      'crowns',
      'Minor premierships',
      a.regularSeasonCrowns,
      b.regularSeasonCrowns,
      String(a.regularSeasonCrowns),
      String(b.regularSeasonCrowns),
    );
    push(
      'avgLadder',
      'Avg ladder finish',
      a.avgLadder,
      b.avgLadder,
      a.avgLadder ? a.avgLadder.toFixed(1) : '—',
      b.avgLadder ? b.avgLadder.toFixed(1) : '—',
      false, // lower ladder position is better
    );
  }

  const cell = headToHead(aId, bId);
  const games = cell?.games ?? 0;
  const aWins = cell?.wins ?? 0;
  const bWins = cell?.losses ?? 0;
  const ties = cell?.ties ?? 0;

  const seriesLeader: Side = games === 0 ? 'tie' : leaderOf(aWins, bWins, true);
  const aName = getManager(aId).name;
  const bName = getManager(bId).name;
  const line =
    games === 0
      ? 'First meeting'
      : aWins === bWins
        ? `Level at ${record(aWins, bWins, ties)}`
        : aWins > bWins
          ? `${aName} leads ${record(aWins, bWins, ties)}`
          : `${bName} leads ${record(bWins, aWins, ties)}`;

  return {
    a: headline(aId),
    b: headline(bId),
    rows,
    series: { games, aWins, bWins, ties, line, leader: seriesLeader },
  };
}
