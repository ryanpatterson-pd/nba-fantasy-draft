import Link from 'next/link';
import { Badge, RankPill } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Column, DataTable } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { recordFor } from '@/lib/stats/season';
import type { SeasonRecord, SeasonResultLabel } from '@/lib/types';
import { num, record } from '@/lib/utils/format';

const RESULT_LABEL: Record<SeasonResultLabel, string> = {
  champion: 'Champion',
  'runner-up': 'Runner-up',
  'semi-finalist': 'Semi final',
  'quarter-finalist': 'Quarter final',
  'missed-playoffs': 'Missed',
};

const RESULT_TONE: Record<SeasonResultLabel, 'accent' | 'neutral' | 'outline'> = {
  champion: 'accent',
  'runner-up': 'accent',
  'semi-finalist': 'neutral',
  'quarter-finalist': 'neutral',
  'missed-playoffs': 'outline',
};

type Row = SeasonRecord & { label: string };

/** One manager's career, season by season. */
export function ManagerSeasonTable({ managerId }: { managerId: string }) {
  const rows: Row[] = COMPLETED_SEASONS.map((season) => {
    const seasonRecord = recordFor(season.id, managerId);
    return seasonRecord ? { ...seasonRecord, label: season.label } : null;
  }).filter((row): row is Row => row !== null);

  const distinctNames = new Set(rows.map((row) => row.teamName)).size;

  const columns: Column<Row>[] = [
    {
      key: 'season',
      header: 'Season',
      cell: (row) => {
        const wonIt = row.result === 'champion';
        // Last on the home-and-away ladder that season = wooden spoon.
        const spooned = row.ladderPosition === row.fieldSize;

        return (
          <Link
            href={`/history/${row.seasonId}`}
            className="flex items-center gap-1.5 hover:text-accent-deep"
          >
            <span className="tabular text-sm font-bold text-ink">{row.label}</span>
            {wonIt && (
              <Icon
                name="trophy"
                size={14}
                strokeWidth={2.2}
                className="shrink-0 text-gold-deep"
                aria-label="Champion"
              />
            )}
            {spooned && (
              <Icon
                name="spoon"
                size={14}
                strokeWidth={2.2}
                className="shrink-0 text-ink-mute"
                aria-label="Wooden spoon"
              />
            )}
          </Link>
        );
      },
    },
    {
      key: 'team',
      header: 'Team name',
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-dim">{row.teamName}</span>,
    },
    {
      key: 'ladder',
      header: 'Ladder',
      width: 'w-14',
      cell: (row) => <RankPill rank={row.ladderPosition} />,
    },
    {
      key: 'record',
      header: 'W–L',
      numeric: true,
      cell: (row) => (
        <span className="font-semibold whitespace-nowrap">{record(row.wins, row.losses, row.ties)}</span>
      ),
    },
    {
      key: 'playoffs',
      header: 'Playoffs',
      numeric: true,
      align: 'center',
      hideOnMobile: true,
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
      key: 'avg',
      header: 'Avg',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-dim">{num(row.avgScore)}</span>,
    },
    {
      key: 'high',
      header: 'High',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-dim">{num(row.highestWeek)}</span>,
    },
    {
      key: 'low',
      header: 'Low',
      numeric: true,
      align: 'right',
      hideOnMobile: true,
      cell: (row) => <span className="text-ink-mute">{num(row.lowestWeek)}</span>,
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
        label="Season by season"
        meta={`${rows.length} ${rows.length === 1 ? 'season' : 'seasons'}${
          distinctNames > 1 ? ` · ${distinctNames} team names` : ''
        }`}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.seasonId}
        compact
        onRowHighlight={(row) => row.result === 'champion'}
      />
    </Card>
  );
}
