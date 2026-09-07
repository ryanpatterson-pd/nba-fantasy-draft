'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable, type SortState } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import type { SeasonRecord, SeasonResultLabel } from '@/lib/types';
import { num, record } from '@/lib/utils/format';
import { winRate } from '@/lib/stats/tally';

const RESULT_LABEL: Record<SeasonResultLabel, string> = {
  champion: 'Champion',
  'runner-up': 'Runner-up',
  'semi-finalist': 'Semi final',
  'quarter-finalist': 'Quarter final',
  'missed-playoffs': 'Missed',
};

/** How deep a run was, so the Result column sorts by achievement. */
const RESULT_RANK: Record<SeasonResultLabel, number> = {
  champion: 0,
  'runner-up': 1,
  'semi-finalist': 2,
  'quarter-finalist': 3,
  'missed-playoffs': 4,
};

/** On-brand tones: orange for the champion, tapering down to neutral/outline. */
const RESULT_TONE: Record<SeasonResultLabel, 'accent' | 'warning' | 'neutral' | 'outline'> = {
  champion: 'accent',
  'runner-up': 'warning',
  'semi-finalist': 'neutral',
  'quarter-finalist': 'outline',
  'missed-playoffs': 'outline',
};

/** Final table for one season. Sortable by every column, filterable by name. */
export function SeasonTable({ rows, label }: { rows: SeasonRecord[]; label?: string }) {
  const [sort, setSort] = useState<SortState>({ key: 'ladder', dir: 'asc' });
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => {
      const manager = getManager(row.managerId);
      return (
        manager.name.toLowerCase().includes(needle) ||
        manager.fullName.toLowerCase().includes(needle) ||
        row.teamName.toLowerCase().includes(needle)
      );
    });
  }, [rows, query]);

  // Clicking a new column starts on its most useful direction: ascending for
  // ladder position and result, descending for anything you want the best of.
  const toggleSort = (key: string) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'ladder' || key === 'result' || key === 'manager' ? 'asc' : 'desc' },
    );

  const columns: Column<SeasonRecord>[] = [
    {
      key: 'ladder',
      header: '#',
      width: 'w-10',
      align: 'left',
      sortValue: (row) => row.ladderPosition,
      // Plain rank number, matching the dashboard's all-time ladder. Champion
      // rows are highlighted at the row level, so no per-cell gold is needed.
      cell: (row) => (
        <span className="tabular text-lg font-extrabold text-ink-mute">{row.ladderPosition}</span>
      ),
    },
    {
      key: 'manager',
      // Explicitly left-aligned. Without this the column inherits the table's
      // right-alignment default and the names drift out of line with each other,
      // because each block is only as wide as its own team name.
      align: 'left',
      header: 'Manager',
      sortValue: (row) => getManager(row.managerId).name,
      cell: (row) => {
        const manager = getManager(row.managerId);
        return (
          <Link
            href={`/teams/${manager.id}`}
            className="group/name flex min-w-0 items-center gap-2.5 text-left"
          >
            <Avatar manager={manager} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] leading-tight font-extrabold tracking-[-0.015em] text-ink group-hover/name:text-accent-deep">
                {manager.name}
              </span>
              <span className="mt-0.5 hidden truncate text-[10px] leading-tight font-bold tracking-[0.4px] text-ink-dim uppercase sm:block">
                {row.teamName}
              </span>
            </span>
          </Link>
        );
      },
    },
    {
      key: 'record',
      header: 'W–L',
      numeric: true,
      align: 'right',
      sortValue: (row) => winRate(row),
      cell: (row) => <span className="font-bold">{record(row.wins, row.losses, row.ties)}</span>,
    },
    {
      key: 'playoffs',
      header: 'Playoffs',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.playoffWins - row.playoffLosses,
      cell: (row) =>
        row.playoffWins + row.playoffLosses > 0 ? (
          <span className="text-ink-dim">{record(row.playoffWins, row.playoffLosses)}</span>
        ) : (
          <span className="text-ink-mute">—</span>
        ),
    },
    {
      key: 'pf',
      header: 'Points for',
      numeric: true,
      align: 'right',
      sortValue: (row) => row.pointsFor,
      cell: (row) => num(row.pointsFor),
    },
    {
      key: 'pa',
      header: 'Points against',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.pointsAgainst,
      cell: (row) => <span className="text-ink-dim">{num(row.pointsAgainst)}</span>,
    },
    {
      key: 'avg',
      header: 'Avg',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.avgScore,
      cell: (row) => <span className="text-ink-dim">{num(row.avgScore)}</span>,
    },
    {
      key: 'high',
      header: 'High',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.highestWeek,
      cell: (row) => <span className="text-ink-dim">{num(row.highestWeek)}</span>,
    },
    {
      key: 'streak',
      header: 'Streak',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      sortValue: (row) => row.bestStreak,
      cell: (row) => <span className="text-ink-dim">{row.bestStreak}W</span>,
    },
    {
      key: 'result',
      header: 'Result',
      align: 'right',
      sortValue: (row) => RESULT_RANK[row.result],
      cell: (row) => <Badge tone={RESULT_TONE[row.result]}>{RESULT_LABEL[row.result]}</Badge>,
    },
  ];

  const sortedBy = columns.find((column) => column.key === sort.key)?.header;

  return (
    <Card>
      <CardHeader
        label={label ?? 'Final table'}
        action={
          <div className="flex shrink-0 items-center gap-3">
            <span className="label-xs hidden whitespace-nowrap sm:inline">
              By {typeof sortedBy === 'string' ? sortedBy : 'ladder'}
              {sort.dir === 'asc' ? ' ↑' : ' ↓'}
            </span>
            <label className="relative block">
              <span className="sr-only">Filter by manager or team name</span>
              <Icon
                name="search"
                size={12}
                strokeWidth={2.6}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-white/50"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter"
                className="h-8 w-[112px] rounded-full border border-white/15 bg-white/[0.07] pr-2.5 pl-7 text-[12px] font-bold text-white transition-[width,border-color] placeholder:text-white/45 focus:w-[150px] focus:border-accent/70 focus:outline-none sm:w-[132px]"
              />
            </label>
          </div>
        }
      />

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.managerId}
        compact
        stickyFirst
        sort={sort}
        onSortChange={toggleSort}
        onRowHighlight={(row) => row.result === 'champion'}
        emptyMessage={`No manager matches “${query}”.`}
      />

      <p className="flex items-center justify-between gap-3 border-t border-line px-[18px] py-2.5 text-[11px] font-semibold text-ink-dim">
        <span>Select any column heading to reorder the table.</span>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="font-bold text-accent-deep hover:underline"
          >
            Clear filter
          </button>
        )}
      </p>
    </Card>
  );
}


