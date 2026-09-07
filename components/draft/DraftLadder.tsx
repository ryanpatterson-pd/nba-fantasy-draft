'use client';

import { ManagerTag } from '@/components/ui/Avatar';
import { RankPill } from '@/components/ui/Badge';
import { Bar } from '@/components/ui/Bar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { DRAFT_GAMES } from '@/lib/data/draft-games';
import type { DraftStandingRow } from '@/lib/draft/scoring';
import { formatPoints, MAX_POSSIBLE_POINTS } from '@/lib/draft/scoring';
import type { OddsRow } from '@/lib/draft/lottery';
import { ordinal, pct } from '@/lib/utils/format';

/**
 * The overall games ladder. This is the table everyone stares at all weekend,
 * because position here is what buys lottery entries.
 */
export function DraftLadder({
  standings,
  odds,
  completedCount,
  className,
}: {
  standings: DraftStandingRow[];
  /** Odds for the next spin, keyed by manager, when the lottery is live. */
  odds: OddsRow[];
  completedCount: number;
  className?: string;
}) {
  const leaderPoints = Math.max(1, ...standings.map((row) => row.points));
  const oddsMap = new Map(odds.map((row) => [row.managerId, row]));

  const columns: Column<DraftStandingRow>[] = [
    {
      key: 'rank',
      header: '#',
      width: 'w-10',
      cell: (row) => <RankPill rank={row.rank} />,
    },
    {
      key: 'manager',
      header: 'Manager',
      cell: (row) => (
        <ManagerTag
          manager={getManager(row.managerId)}
          secondary={row.gamesPlayed > 0 ? `${row.gamesPlayed} games scored` : 'Awaiting results'}
        />
      ),
    },
    {
      key: 'points',
      header: 'Points',
      numeric: true,
      align: 'right',
      cell: (row) => (
        <span className="figure-lg text-[0.95rem] text-ink">{formatPoints(row.points)}</span>
      ),
    },
    {
      key: 'bar',
      header: 'Share',
      width: 'w-24',
      hideOnMobile: true,
      cell: (row) => <Bar value={row.points} max={leaderPoints} />,
    },
    {
      key: 'firsts',
      header: 'Wins',
      numeric: true,
      align: 'center',
      hideOnMobile: true,
      cell: (row) =>
        row.firsts > 0 ? (
          <span className="inline-flex items-center gap-1 text-accent-deep">
            <Icon name="crown" size={13} />
            {row.firsts}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        ),
    },
    {
      key: 'best',
      header: 'Best',
      numeric: true,
      align: 'center',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-dim">{row.bestPlacing ? ordinal(row.bestPlacing) : '—'}</span>
      ),
    },
    {
      key: 'avg',
      header: 'Avg place',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-ink-dim">
          {row.averagePlacing === null ? '—' : row.averagePlacing.toFixed(1)}
        </span>
      ),
    },
    {
      key: 'chance',
      header: 'Next spin',
      numeric: true,
      align: 'right',
      cell: (row) => {
        const odd = oddsMap.get(row.managerId);
        if (!odd) return <span className="text-[0.7rem] text-ink-mute">Picked</span>;
        return <span className="font-semibold text-accent-deep">{pct(odd.chance)}</span>;
      },
    },
  ];

  return (
    <Card className={className}>
      <CardHeader
        label="Overall ladder"
        meta={`${completedCount} of ${DRAFT_GAMES.length} games · max ${MAX_POSSIBLE_POINTS} pts`}
      />
      <DataTable
        columns={columns}
        rows={standings}
        rowKey={(row) => row.managerId}
        compact
        onRowHighlight={(row) => row.rank === 1 && row.points > 0}
      />
    </Card>
  );
}
