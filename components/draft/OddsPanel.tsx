'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Bar } from '@/components/ui/Bar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { WEIGHTING_HINTS, WEIGHTING_LABELS, type OddsRow } from '@/lib/draft/lottery';
import { getManager } from '@/lib/data/managers';
import type { LotteryWeighting } from '@/lib/types';
import { num, pct } from '@/lib/utils/format';

const WEIGHTINGS: LotteryWeighting[] = ['lottery', 'points', 'squared', 'rank'];

/**
 * Lottery odds for the next spin, plus the weighting model that produced them.
 * Changing the model is deliberately visible — everyone should be able to see
 * exactly how points were turned into entries.
 */
export function OddsPanel({
  odds,
  weighting,
  onWeightingChange,
  className,
}: {
  odds: OddsRow[];
  weighting: LotteryWeighting;
  onWeightingChange: (weighting: LotteryWeighting) => void;
  className?: string;
}) {
  const topChance = Math.max(0.0001, ...odds.map((row) => row.chance));
  const totalEntries = odds.reduce((sum, row) => sum + row.entries, 0);

  return (
    <Card className={className}>
      <CardHeader label="Lottery odds" meta={`${num(totalEntries)} entries in the barrel`} />

      <div className="border-b border-line px-4 py-3">
        <Segmented
          ariaLabel="Lottery weighting model"
          options={WEIGHTINGS.map((value) => ({
            value,
            label: WEIGHTING_LABELS[value],
            hint: WEIGHTING_HINTS[value],
          }))}
          value={weighting}
          onChange={onWeightingChange}
          size="sm"
          className="w-full"
        />
        <p className="mt-2 text-[0.7rem] leading-snug text-ink-mute">{WEIGHTING_HINTS[weighting]}</p>
      </div>

      {odds.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-mute">
          Every pick has been drawn. The draft order is locked.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {odds.map((row) => {
            const manager = getManager(row.managerId);
            return (
              <li key={row.managerId} className="flex items-center gap-3 px-4 py-2.5">
                <span className="tabular w-5 text-xs font-bold text-ink-mute">
                  {row.rank}
                </span>
                <Avatar manager={manager} size="xs" ring={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{manager.name}</span>
                  <Bar
                    value={row.chance}
                    max={topChance}
                    colour={manager.colours.primary}
                    height={4}
                    className="mt-1"
                  />
                </span>
                <span className="w-14 text-right">
                  <span className="tabular block text-[0.7rem] text-ink-mute">{row.entries} ent.</span>
                  <span className="tabular block text-sm font-bold text-accent-deep">{pct(row.chance)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
