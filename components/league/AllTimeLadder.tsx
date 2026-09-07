'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { sortAllTime } from '@/lib/stats/all-time';
import type { AllTimeRecord } from '@/lib/types';
import { num, pct, record } from '@/lib/utils/format';

/**
 * The all-time ladder. Ordered by win rate by default, which is the fairest
 * career ranking when everyone has played a different number of seasons.
 *
 * `collapseTo` shows a shortened board with a control to reveal the rest, so the
 * dashboard can lead with the top of the table without hiding anyone.
 */
export function AllTimeLadder({
  collapseTo,
  showAction = true,
}: {
  collapseTo?: number;
  showAction?: boolean;
}) {
  const all = sortAllTime('winPct');
  const [expanded, setExpanded] = useState(false);

  const collapsible = collapseTo !== undefined && all.length > collapseTo;
  const rows = collapsible && !expanded ? all.slice(0, collapseTo) : all;
  const hidden = all.length - (collapseTo ?? 0);

  const columns: Column<AllTimeRecord>[] = [
    {
      key: 'rank',
      header: '#',
      width: 'w-10',
      align: 'left',
      // Plain number, matching the Career leaders list rather than a pill.
      cell: (_row, index) => (
        <span className="tabular text-lg font-extrabold text-ink-mute">{index + 1}</span>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      // Explicitly left-aligned. Every column after the first right-aligns by
      // default, which pushed each name to the right edge of its own block and
      // left the column looking ragged.
      align: 'left',
      cell: (row) => {
        const manager = getManager(row.managerId);
        return (
          <Link
            href={`/teams/${manager.id}`}
            className="group/name flex min-w-0 max-w-[150px] items-center gap-3 text-left"
          >
            <Avatar manager={manager} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] leading-tight font-extrabold tracking-[-0.015em] text-ink group-hover/name:text-accent-deep">
                {manager.name}
              </span>
              <span className="mt-0.5 block truncate text-[10px] leading-tight font-bold tracking-[0.4px] text-ink-dim uppercase">
                {row.seasonsPlayed} {row.seasonsPlayed === 1 ? 'season' : 'seasons'}
              </span>
            </span>
          </Link>
        );
      },
    },
    {
      key: 'record',
      header: 'Record',
      numeric: true,
      align: 'right',
      cell: (row) => (
        <span className="font-bold whitespace-nowrap">{record(row.wins, row.losses, row.ties)}</span>
      ),
    },
    {
      key: 'winPct',
      header: 'Win %',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="font-bold whitespace-nowrap text-ink">{pct(row.winPct)}</span>,
    },
    {
      key: 'titles',
      header: 'Rings',
      numeric: true,
      align: 'right',
      cell: (row) =>
        row.titles > 0 ? (
          <span className="font-extrabold text-accent-deep">{row.titles}</span>
        ) : (
          <span className="text-ink-dim">—</span>
        ),
    },
    {
      key: 'finals',
      header: 'Grand finals',
      numeric: true,
      align: 'right',
      cell: (row) => row.finalsAppearances,
    },
    {
      key: 'playoffs',
      header: 'Playoffs',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="whitespace-nowrap">{`${row.playoffAppearances}/${row.seasonsPlayed}`}</span>,
    },
    {
      key: 'playoffRecord',
      header: 'Playoff W–L',
      numeric: true,
      align: 'right',
      cell: (row) =>
        row.playoffRecord.wins + row.playoffRecord.losses + row.playoffRecord.ties > 0 ? (
          <span className="whitespace-nowrap text-ink-dim">
            {record(row.playoffRecord.wins, row.playoffRecord.losses, row.playoffRecord.ties)}
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        ),
    },
    {
      key: 'points',
      header: 'Points for',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => num(row.pointsFor),
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader
        label="All-time ladder"
        action={
          showAction ? (
            <Link
              href="/teams"
              className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.12em] text-accent-deep uppercase hover:underline"
            >
              Full database
              <Icon name="arrow-right" size={12} />
            </Link>
          ) : (
            <span className="label-xs">Ranked by win rate</span>
          )
        }
      />

      <DataTable columns={columns} rows={rows} rowKey={(row) => row.managerId} compact stickyFirst />

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          className="group/more mt-auto flex items-center justify-center gap-1.5 px-4 py-3.5 text-[11px] font-black tracking-[0.85px] text-ink-dim uppercase transition-colors hover:bg-surface-2 hover:text-accent-deep"
        >
          {expanded ? 'Show top 8 only' : `See all ${all.length} managers`}
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            strokeWidth={3}
            className="transition-transform group-hover/more:translate-y-px"
          />
          {!expanded && (
            <span className="text-ink-mute normal-case">
              ({hidden} more)
            </span>
          )}
        </button>
      )}
    </Card>
  );
}
