'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Select } from '@/components/ui/Select';
import { getManager } from '@/lib/data/managers';
import type { SeasonRecord, SeasonResultLabel } from '@/lib/types';
import { num, record } from '@/lib/utils/format';

export type SnapshotSeason = {
  id: string;
  label: string;
  /** Optional editorial line. Omitted for imported seasons. */
  headline?: string;
  rows: SeasonRecord[];
};

const RESULT_TONE: Record<SeasonResultLabel, 'accent' | 'neutral' | 'outline'> = {
  champion: 'accent',
  'runner-up': 'accent',
  'semi-finalist': 'neutral',
  'quarter-finalist': 'neutral',
  'missed-playoffs': 'outline',
};

const RESULT_LABEL: Record<SeasonResultLabel, string> = {
  champion: 'Champion',
  'runner-up': 'Runner-up',
  'semi-finalist': 'Semi final',
  'quarter-finalist': 'Quarter final',
  'missed-playoffs': 'Missed',
};

/**
 * Final table for a single season, with a season switcher. Data is passed in
 * from the server so the stats engine never ships to the browser.
 */
export function SeasonSnapshot({ seasons }: { seasons: SnapshotSeason[] }) {
  const [seasonId, setSeasonId] = useState(seasons[seasons.length - 1]?.id ?? '');
  const season = seasons.find((s) => s.id === seasonId) ?? seasons[seasons.length - 1];

  if (!season) return null;

  const columns: Column<SeasonRecord>[] = [
    {
      key: 'ladder',
      // Compact "#" on mobile to keep this column narrow; full "Ladder" from sm.
      header: (
        <>
          <span className="sm:hidden">#</span>
          <span className="hidden sm:inline">Ladder</span>
        </>
      ),
      width: 'w-10',
      align: 'left',
      // Plain number, matching the Career leaders list rather than a pill.
      cell: (row) => (
        <span className="tabular text-lg font-extrabold text-ink-mute">{row.ladderPosition}</span>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      // Left-aligned so the names stack flush; without this it inherits the
      // table's right-align default and each block drifts to its own width.
      align: 'left',
      cell: (row) => {
        const manager = getManager(row.managerId);
        return (
          <Link
            href={`/teams/${manager.id}`}
            className="group/name flex min-w-0 max-w-[150px] items-center gap-2.5 text-left"
          >
            <Avatar manager={manager} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] leading-tight font-extrabold tracking-[-0.015em] text-ink group-hover/name:text-accent-deep">
                {manager.name}
              </span>
              {/* Team name eats width on a phone, so it only shows from sm up. */}
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
      cell: (row) => (
        <span className="font-semibold whitespace-nowrap">
          {record(row.wins, row.losses, row.ties)}
        </span>
      ),
    },
    {
      key: 'pf',
      header: 'Points for',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="whitespace-nowrap">{num(row.pointsFor)}</span>,
    },
    {
      key: 'pa',
      header: 'Points against',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="whitespace-nowrap text-ink-dim">{num(row.pointsAgainst)}</span>,
    },
    {
      key: 'avg',
      header: 'Avg week',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="whitespace-nowrap text-ink-dim">{num(row.avgScore)}</span>,
    },
    {
      key: 'best',
      header: 'High week',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="whitespace-nowrap text-ink-dim">{num(row.highestWeek)}</span>,
    },
    {
      key: 'result',
      header: 'Result',
      align: 'right',
      cell: (row) => <Badge tone={RESULT_TONE[row.result]}>{RESULT_LABEL[row.result]}</Badge>,
    },
  ];

  return (
    <Card>
      <CardHeader
        label="Season snapshot"
        action={
          <Select
            aria-label="Choose season"
            value={season.id}
            onChange={(event) => setSeasonId(event.target.value)}
            className="w-36"
          >
            {[...seasons].reverse().map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        }
      />
      {season.headline && (
        <p className="border-b border-line px-[18px] py-3 text-[13px] font-medium text-ink-dim">
          {season.headline}
        </p>
      )}
      <DataTable
        columns={columns}
        rows={season.rows}
        rowKey={(row) => row.managerId}
        compact
        stickyFirst
        onRowHighlight={(row) => row.result === 'champion'}
      />
    </Card>
  );
}
