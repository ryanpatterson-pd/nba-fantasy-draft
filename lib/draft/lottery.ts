import type { LotteryWeighting, ManagerId } from '@/lib/types';
import type { DraftStandingRow } from './scoring';
import { FIELD_SIZE } from './scoring';

/**
 * Draft lottery odds.
 *
 * The games weekend produces a points ladder. That ladder is converted into
 * lottery entries, so finishing top gives the best chance at pick one without
 * ever guaranteeing it — which is the entire reason the wheel exists.
 *
 * Three weighting models are supported:
 *
 *  points   entries proportional to points scored. Gentle spread.
 *  squared  entries proportional to points squared. Rewards the top end harder.
 *  rank     a fixed NBA-style entry table by ladder position. Most predictable.
 */

export const WEIGHTING_LABELS: Record<LotteryWeighting, string> = {
  lottery: 'Lottery odds (house rules)',
  points: 'Points proportional',
  squared: 'Points weighted (steep)',
  rank: 'Rank table (NBA style)',
};

export const WEIGHTING_HINTS: Record<LotteryWeighting, string> = {
  lottery:
    'The house odds: 1st gets 30% at pick one, sliding down to 1% for last. Odds rise for everyone still in the barrel after each draw.',
  points: 'Entries scale directly with points. Closest ladder, flattest odds.',
  squared: 'Points are squared before entries are assigned. Winning the weekend matters more.',
  rank: 'Fixed entry counts by finishing position, ignoring the size of the gaps.',
};

/**
 * The house lottery table: chance of the top pick by finishing position, 1st
 * through 12th, exactly as agreed. These are the pick-one percentages; because
 * a drawn team leaves the barrel and the rest re-normalise, everyone still
 * waiting sees their chance rise on the next spin.
 *
 * Stored ×10 so the two 1.5% slots stay integers and the maths avoids floats.
 */
export const LOTTERY_ENTRY_TABLE = [300, 200, 150, 100, 70, 50, 40, 30, 20, 15, 15, 10];

/** Entry counts by ladder position for the `rank` model, 1st through 12th. */
export const RANK_ENTRY_TABLE = [140, 125, 110, 95, 80, 66, 54, 42, 32, 23, 15, 8];

export type OddsRow = {
  managerId: ManagerId;
  rank: number;
  points: number;
  entries: number;
  /** Chance of being drawn on the next spin, 0–1. */
  chance: number;
  /** Cumulative chance, used to build the wheel geometry. */
  cumulative: number;
};

function entriesFor(row: DraftStandingRow, weighting: LotteryWeighting): number {
  switch (weighting) {
    case 'lottery':
      return LOTTERY_ENTRY_TABLE[row.rank - 1] ?? 1;
    case 'rank':
      return RANK_ENTRY_TABLE[row.rank - 1] ?? 1;
    case 'squared':
      // +1 keeps a manager on zero points in the draw rather than excluded.
      return Math.max(1, Math.round(Math.pow(row.points + 1, 2) / 10));
    case 'points':
    default:
      return Math.max(1, row.points);
  }
}

/**
 * Odds for the next spin, given the managers still waiting on a pick.
 * Excluded managers are dropped and the remaining entries re-normalised.
 */
export function computeOdds(
  standings: DraftStandingRow[],
  weighting: LotteryWeighting,
  remaining?: ManagerId[],
): OddsRow[] {
  const pool = remaining ? standings.filter((row) => remaining.includes(row.managerId)) : standings;
  const withEntries = pool.map((row) => ({ row, entries: entriesFor(row, weighting) }));
  const total = withEntries.reduce((sum, item) => sum + item.entries, 0) || 1;

  let cumulative = 0;
  return withEntries.map(({ row, entries }) => {
    const chance = entries / total;
    cumulative += chance;
    return {
      managerId: row.managerId,
      rank: row.rank,
      points: row.points,
      entries,
      chance,
      cumulative,
    };
  });
}

/**
 * Picks a winner from the odds using a supplied random value in [0, 1).
 * Kept pure and injectable so the draw can be replayed or tested.
 */
export function drawFromOdds(odds: OddsRow[], random: number): ManagerId | undefined {
  if (odds.length === 0) return undefined;
  const target = Math.min(Math.max(random, 0), 0.999999);
  for (const row of odds) {
    if (target <= row.cumulative) return row.managerId;
  }
  return odds[odds.length - 1].managerId;
}

/** Wheel segment geometry in degrees, matching the odds exactly. */
export type WheelSegment = {
  managerId: ManagerId;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  chance: number;
};

export function wheelSegments(odds: OddsRow[]): WheelSegment[] {
  let start = 0;
  return odds.map((row) => {
    const sweep = row.chance * 360;
    const segment: WheelSegment = {
      managerId: row.managerId,
      startAngle: start,
      endAngle: start + sweep,
      midAngle: start + sweep / 2,
      chance: row.chance,
    };
    start += sweep;
    return segment;
  });
}

/**
 * Rotation (in degrees) needed to bring a segment under the pointer at the top
 * of the wheel, plus `turns` full turns for the spin itself.
 *
 * `landFraction` (0–1) chooses where *within* the segment the pointer settles,
 * defaulting to the middle. Passing a random fraction means the wheel doesn't
 * stop at the exact same spot every time it lands on a given manager, which
 * removes the last tell that made the spin feel scripted. A small inset keeps
 * it clear of the segment edges so the result is never ambiguous.
 */
export function rotationForSegment(
  segment: WheelSegment,
  currentRotation: number,
  turns = 6,
  landFraction = 0.5,
): number {
  const settled = ((currentRotation % 360) + 360) % 360;
  const sweep = segment.endAngle - segment.startAngle;
  // Clamp the landing point to the inner 80% of the wedge.
  const inset = Math.min(0.1, sweep > 0 ? 6 / sweep : 0.1);
  const frac = inset + Math.min(Math.max(landFraction, 0), 1) * (1 - 2 * inset);
  const landAngle = segment.startAngle + sweep * frac;
  // Pointer sits at 0deg (12 o'clock); the wheel spins clockwise.
  const needed = (360 - landAngle - settled + 360) % 360;
  return currentRotation + turns * 360 + needed;
}

export const PICK_NUMBERS = Array.from({ length: FIELD_SIZE }, (_, i) => i + 1);

/**
 * House rule: a manager can never fall more than this many pick slots below
 * their ladder finishing position. Finish 1st and you are protected from pick 6
 * or lower; finish 2nd and you are protected from pick 7; and so on.
 */
export const MAX_SLOTS_BELOW_FINISH = 5;

/**
 * Before spinning for `nextPick`, check whether assigning that pick would push
 * anyone still in the barrel to exactly their protection limit — i.e. the pick
 * is `MAX_SLOTS_BELOW_FINISH` worse than their ladder finish.
 *
 * Returns the single manager who should be offered the pick (the one who
 * finished highest, if more than one is at their limit), or null when nobody is
 * protected on this pick. The caller then asks "give [name] pick N?" — yes locks
 * it, no spins as normal.
 *
 * `standings` carries each manager's ladder `rank`; `remaining` are the ids
 * still waiting on a pick.
 */
export function protectionCandidate(
  standings: DraftStandingRow[],
  remaining: ManagerId[],
  nextPick: number,
): { managerId: ManagerId; rank: number } | null {
  const remainingSet = new Set(remaining);

  const atLimit = standings
    .filter((row) => remainingSet.has(row.managerId))
    // The pick would be exactly the protection limit below their finish, or
    // worse. In sequential drafting it can only ever reach the limit exactly,
    // but `>=` keeps it correct if picks are ever skipped.
    .filter((row) => nextPick - row.rank >= MAX_SLOTS_BELOW_FINISH)
    .sort((a, b) => a.rank - b.rank);

  if (atLimit.length === 0) return null;
  return { managerId: atLimit[0].managerId, rank: atLimit[0].rank };
}
