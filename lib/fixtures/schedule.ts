import { liveSeason } from '@/lib/data/upcoming';
import { UPCOMING_PARTICIPANTS, UPCOMING_SEASON } from '@/lib/data/seasons';
import type { SeasonId } from '@/lib/types';

/**
 * Fixture list for the upcoming season.
 *
 * The real ESPN draw is imported into lib/data/upcoming.ts (see
 * scripts/espn-import.mjs --live) and used when present, so the page shows
 * exactly the fixtures ESPN has — and picks up any change on re-import.
 *
 * When that file has no fixtures (before the league exists on ESPN), this falls
 * back to a **provisional** generated round-robin over the returning field. It
 * is deterministic — the same field always produces the same draw — so previews
 * and links stay stable between builds until the real schedule lands.
 */

export type Fixture = {
  seasonId: SeasonId;
  /** 1-based round, which is also the week number. */
  round: number;
  homeId: string;
  awayId: string;
};

export type Round = {
  round: number;
  fixtures: Fixture[];
};

/** Placeholder used by the circle method when the field size is odd. */
const BYE = '__bye__';

/**
 * One complete round-robin using the circle method.
 *
 * The first team stays put while the rest rotate, which yields n-1 rounds where
 * every team meets every other team exactly once.
 */
function singleRoundRobin(participants: string[]): [string, string][][] {
  const teams = [...participants];
  if (teams.length % 2 === 1) teams.push(BYE);

  const size = teams.length;
  const half = size / 2;
  const fixed = teams[0];
  const rotating = teams.slice(1);
  const rounds: [string, string][][] = [];

  for (let round = 0; round < size - 1; round += 1) {
    const pairs: [string, string][] = [[fixed, rotating[round % rotating.length]]];

    for (let i = 1; i < half; i += 1) {
      const home = rotating[(round + i) % rotating.length];
      const away = rotating[(round + rotating.length - i) % rotating.length];
      pairs.push([home, away]);
    }

    rounds.push(pairs);
  }

  return rounds;
}

/**
 * Builds `weeks` rounds of fixtures for a field.
 *
 * A 12-team field gives 11 rounds per full cycle, so a 19-week season is one
 * complete round-robin plus the first 8 rounds of a second. Venues swap on the
 * second cycle so a repeat fixture is the reverse of the first meeting.
 */
export function buildSchedule(
  participants: string[],
  weeks: number,
  seasonId: SeasonId,
): Round[] {
  if (participants.length < 2 || weeks < 1) return [];

  const cycle = singleRoundRobin(participants);
  const rounds: Round[] = [];

  for (let week = 0; week < weeks; week += 1) {
    const pairs = cycle[week % cycle.length];
    const reversed = Math.floor(week / cycle.length) % 2 === 1;

    const fixtures = pairs
      .filter(([home, away]) => home !== BYE && away !== BYE)
      .map(([home, away]) => ({
        seasonId,
        round: week + 1,
        homeId: reversed ? away : home,
        awayId: reversed ? home : away,
      }));

    rounds.push({ round: week + 1, fixtures });
  }

  return rounds;
}

/** True when ESPN's real draw has been imported. */
export const HAS_LIVE_SCHEDULE: boolean = (liveSeason.fixtures?.length ?? 0) > 0;

/** Groups the imported live fixtures into rounds, in round order. */
function liveRounds(): Round[] {
  const byRound = new Map<number, Fixture[]>();
  for (const fixture of liveSeason.fixtures) {
    const list = byRound.get(fixture.round) ?? [];
    list.push({
      seasonId: liveSeason.id,
      round: fixture.round,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
    });
    byRound.set(fixture.round, list);
  }
  return [...byRound.keys()]
    .sort((a, b) => a - b)
    .map((round) => ({ round, fixtures: byRound.get(round) ?? [] }));
}

/**
 * The draw for the upcoming season: ESPN's real fixtures when imported,
 * otherwise the provisional generated round-robin.
 */
export const UPCOMING_ROUNDS: Round[] = HAS_LIVE_SCHEDULE
  ? liveRounds()
  : buildSchedule(UPCOMING_PARTICIPANTS, UPCOMING_SEASON.regularSeasonWeeks, UPCOMING_SEASON.id);

export const UPCOMING_FIXTURES: Fixture[] = UPCOMING_ROUNDS.flatMap((round) => round.fixtures);

/** How many times a pairing appears in the generated draw. */
export function meetingsInDraw(managerId: string, opponentId: string): number {
  return UPCOMING_FIXTURES.filter(
    (fixture) =>
      (fixture.homeId === managerId && fixture.awayId === opponentId) ||
      (fixture.homeId === opponentId && fixture.awayId === managerId),
  ).length;
}

/** Every fixture involving a manager, in round order. */
export function fixturesFor(managerId: string): Fixture[] {
  return UPCOMING_FIXTURES.filter(
    (fixture) => fixture.homeId === managerId || fixture.awayId === managerId,
  );
}

/** A stable id for linking to or keying a fixture. */
export function fixtureKey(fixture: Fixture): string {
  return `r${fixture.round}-${fixture.homeId}-${fixture.awayId}`;
}

/**
 * The round in progress right now, clamped to the season.
 *
 * Rounds are weekly and the season is modelled as starting on draft night, so
 * this is the number of whole weeks since the draft, plus one. Before the draft
 * it is round 1; after the final round it stays on the last round. `now` is
 * injected so the caller controls the clock (and server/client agree).
 */
export function currentRound(now: number = Date.now()): number {
  const weeks = UPCOMING_SEASON.regularSeasonWeeks;
  const start = UPCOMING_SEASON.draftDate ? Date.parse(UPCOMING_SEASON.draftDate) : NaN;
  if (!Number.isFinite(start) || weeks < 1) return 1;

  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const elapsed = now - start;
  if (elapsed < 0) return 1;

  const round = Math.floor(elapsed / WEEK) + 1;
  return Math.min(Math.max(round, 1), weeks);
}
