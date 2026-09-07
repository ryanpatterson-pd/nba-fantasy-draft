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
  points: 'Points proportional',
  squared: 'Points weighted (steep)',
  rank: 'Rank table (NBA style)',
};

export const WEIGHTING_HINTS: Record<LotteryWeighting, string> = {
  points: 'Entries scale directly with points. Closest ladder, flattest odds.',
  squared: 'Points are squared before entries are assigned. Winning the weekend matters more.',
  rank: 'Fixed entry counts by finishing position, ignoring the size of the gaps.',
};

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
 * of the wheel, plus a few full turns for the spin itself.
 */
export function rotationForSegment(segment: WheelSegment, currentRotation: number, turns = 6): number {
  const settled = ((currentRotation % 360) + 360) % 360;
  // Pointer sits at 0deg (12 o'clock); the wheel spins clockwise.
  const needed = (360 - segment.midAngle - settled + 360) % 360;
  return currentRotation + turns * 360 + needed;
}

export const PICK_NUMBERS = Array.from({ length: FIELD_SIZE }, (_, i) => i + 1);
