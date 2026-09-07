'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { FIELD_SIZE, type DraftStandingRow } from '@/lib/draft/scoring';
import type { DraftPick } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

/** The board itself: twelve slots, filled in the order the wheel draws them. */
export function DraftBoard({
  picks,
  standings,
  className,
}: {
  picks: DraftPick[];
  standings: DraftStandingRow[];
  className?: string;
}) {
  const pickMap = new Map(picks.map((pick) => [pick.pick, pick.managerId]));
  const pointsMap = new Map(standings.map((row) => [row.managerId, row.points]));
  const ladderMap = new Map(standings.map((row) => [row.managerId, row.rank]));

  return (
    <Card className={className}>
      <CardHeader label="Draft board" meta={`${picks.length} of ${FIELD_SIZE} picks drawn`} />
      <ol className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: FIELD_SIZE }, (_, index) => {
          const pickNumber = index + 1;
          const managerId = pickMap.get(pickNumber);
          const manager = managerId ? getManager(managerId) : undefined;
          const ladderRank = managerId ? ladderMap.get(managerId) : undefined;

          return (
            <li
              key={pickNumber}
              className={cn(
                'flex items-center gap-2.5 bg-surface px-3 py-3',
                manager && 'bg-surface-2',
              )}
            >
              <span
                className={cn(
                  'tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-tile text-xs font-bold',
                  manager ? 'accent-solid' : 'border border-line text-ink-mute',
                )}
              >
                {String(pickNumber).padStart(2, '0')}
              </span>

              {manager ? (
                <>
                  <Avatar manager={manager} size="sm" ring={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {manager.name}
                    </span>
                    <span className="block truncate text-[0.65rem] text-ink-mute">
                      Ladder {ladderRank ?? '—'} · {pointsMap.get(manager.id) ?? 0} pts
                    </span>
                  </span>
                </>
              ) : (
                <span className="flex min-w-0 flex-1 items-center gap-2 text-xs text-ink-mute">
                  <Icon name="lock" size={13} />
                  Awaiting draw
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
