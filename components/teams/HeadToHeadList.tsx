import Link from 'next/link';
import { ManagerTag } from '@/components/ui/Avatar';
import { SplitBar } from '@/components/ui/Bar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable } from '@/components/ui/DataTable';
import { getManager } from '@/lib/data/managers';
import { headToHeadRow } from '@/lib/stats/head-to-head';
import { winRate } from '@/lib/stats/tally';
import type { HeadToHead } from '@/lib/types';
import { num, pct, record } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/** A manager's all-time ledger against each of the other eleven. */
export function HeadToHeadList({ managerId }: { managerId: string }) {
  const rows = headToHeadRow(managerId).sort((a, b) => winRate(b) - winRate(a));

  const columns: Column<HeadToHead>[] = [
    {
      key: 'opponent',
      header: 'Opponent',
      cell: (row) => {
        const manager = getManager(row.opponentId);
        return (
          <Link href={`/teams/${manager.id}`}>
            <ManagerTag manager={manager} size="xs" />
          </Link>
        );
      },
    },
    {
      key: 'record',
      header: 'Record',
      numeric: true,
      cell: (row) => <span className="font-semibold">{record(row.wins, row.losses, row.ties)}</span>,
    },
    {
      key: 'rate',
      header: 'Win %',
      numeric: true,
      align: 'right',
      cell: (row) => (
        <span
          className={cn(
            'font-semibold',
            row.wins > row.losses ? 'text-positive' : row.wins < row.losses ? 'text-negative' : 'text-ink-dim',
          )}
        >
          {row.games ? pct(winRate(row)) : '—'}
        </span>
      ),
    },
    {
      key: 'bar',
      header: 'Split',
      width: 'w-24',
      hideOnMobile: true,
      cell: (row) => <SplitBar wins={row.wins} losses={row.losses} ties={row.ties} />,
    },
    {
      key: 'pf',
      header: 'Points for',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => num(row.pointsFor),
    },
    {
      key: 'pa',
      header: 'Against',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-dim">{num(row.pointsAgainst)}</span>,
    },
    {
      key: 'diff',
      header: 'Diff',
      numeric: true,
      align: 'right',
      cell: (row) => {
        const diff = row.pointsFor - row.pointsAgainst;
        return (
          <span className={cn('font-semibold', diff >= 0 ? 'text-positive' : 'text-negative')}>
            {diff >= 0 ? '+' : ''}
            {num(diff)}
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader label="Head to head" meta="All time, every opponent" />
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.opponentId} compact />
    </Card>
  );
}
