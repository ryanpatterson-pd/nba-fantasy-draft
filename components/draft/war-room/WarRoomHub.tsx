'use client';

import { useMemo, useState } from 'react';
import { PosChip } from '@/components/draft/war-room/bits';
import { useWarRoom, type Bargain, type SyncStatus } from '@/components/draft/war-room/useWarRoom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column, type SortState } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { StatCard } from '@/components/ui/StatCard';
import { SCORING_ROWS } from '@/lib/draft/fantasy-scoring';
import type { Position, StatRow } from '@/lib/draft/stats-board';
import { cn } from '@/lib/utils/cn';

type Tab = 'board' | 'order' | 'bargains' | 'scoring';

const TABS: { value: Tab; label: string }[] = [
  { value: 'board', label: '2026 Stats' },
  { value: 'order', label: 'My order' },
  { value: 'bargains', label: 'Bargains & targets' },
  { value: 'scoring', label: 'Scoring' },
];

const POS_FILTERS: { value: Position | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PG', label: 'PG' },
  { value: 'SG', label: 'SG' },
  { value: 'SF', label: 'SF' },
  { value: 'PF', label: 'PF' },
  { value: 'C', label: 'C' },
];

const one = (n: number) => n.toFixed(1);
const two = (n: number) => n.toFixed(2);
const pct = (n: number) => (n > 0 ? `.${Math.round(n * 1000).toString().padStart(3, '0')}` : '—');

/** Connection pill: live cross-device sync vs local-only. */
function SyncBadge({ status }: { status: SyncStatus }) {
  if (status === 'off')
    return (
      <Badge tone="outline">
        <Icon name="lock" size={11} />
        Saved on this device
      </Badge>
    );
  if (status === 'live')
    return (
      <Badge tone="positive">
        <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-[#168347]" />
        Live · synced
      </Badge>
    );
  if (status === 'error')
    return (
      <Badge tone="warning">
        <Icon name="cloud" size={11} />
        Offline · local only
      </Badge>
    );
  return (
    <Badge tone="neutral">
      <Icon name="cloud" size={11} />
      Connecting…
    </Badge>
  );
}

/** A rank chip shown next to a fantasy-points figure. */
function RankTag({ rank }: { rank: number }) {
  if (!rank) return null;
  return (
    <span
      className={cn(
        'ml-1 inline-grid h-4 min-w-[20px] place-items-center rounded-[5px] px-1 text-[9px] font-black tabular',
        rank <= 12
          ? 'bg-accent-bg text-accent-deep'
          : rank <= 50
            ? 'bg-surface-2 text-ink-dim'
            : 'bg-surface-2 text-ink-mute',
      )}
      title={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

/**
 * The War Room control room.
 *
 * The primary board is the 2026 Stats Board — real last-season actuals scored
 * in our league. Drafted state + your shortlist persist and sync; everything is
 * keyed by the same player ids as the stats data.
 */
export function WarRoomHub({ seasonId, onLock }: { seasonId: string; onLock: () => void }) {
  const wr = useWarRoom(seasonId);
  const [tab, setTab] = useState<Tab>('board');
  const [pos, setPos] = useState<Position | 'ALL'>('ALL');
  const [hideDrafted, setHideDrafted] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'totalFpts', dir: 'desc' });

  const nextBest = wr.bestAvailable[0];
  const draftedCount = wr.drafted.length;

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return wr.rows.filter((r) => {
      if (pos !== 'ALL' && r.pos !== pos) return false;
      if (hideDrafted && wr.isDrafted(r.id)) return false;
      if (needle && !r.name.toLowerCase().includes(needle) && !r.team.toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [wr, pos, hideDrafted, query]);

  if (!wr.hydrated) {
    return (
      <Card className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <span className="accent-chip flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="chart" size={20} />
        </span>
        <p className="text-base font-bold text-ink">Loading the board</p>
        <p className="max-w-sm text-sm text-ink-mute">Reading your saved draft board from this device.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status strip */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Best available now"
          value={nextBest ? nextBest.name : '—'}
          unit={nextBest ? `${one(nextBest.avgFpts)} avg fpts` : 'board clear'}
          icon="crown"
        />
        <StatCard
          label="Players off the board"
          value={`${draftedCount}`}
          unit={`${wr.rows.length - draftedCount} still available`}
          icon="check"
        />
        <StatCard
          label="Your shortlist"
          value={`${wr.queue.length}`}
          unit={wr.queue.length ? 'targets queued' : 'nothing queued yet'}
          icon="target"
        />
        <StatCard
          label="Top bargain"
          value={wr.bargains[0] ? wr.bargains[0].name : '—'}
          unit={wr.bargains[0] ? `${wr.bargains[0].valueGap} spots of value` : '—'}
          icon="flame"
        />
      </section>

      {/* Tabs + controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="War Room sections" />
        <div className="flex flex-wrap items-center gap-2">
          <SyncBadge status={wr.syncStatus} />
          <Button
            variant="danger"
            size="sm"
            icon="refresh"
            onClick={() => {
              if (window.confirm('Clear all drafted players and your shortlist?')) wr.resetAll();
            }}
          >
            Reset board
          </Button>
          <Button variant="ghost" size="sm" icon="lock" onClick={onLock}>
            Lock
          </Button>
        </div>
      </div>

      {tab === 'board' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented options={POS_FILTERS} value={pos} onChange={setPos} size="sm" ariaLabel="Position filter" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Icon name="search" size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-mute" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find player"
                  aria-label="Find player"
                  className="h-[34px] w-44 rounded-tile border border-line bg-surface pr-3 pl-9 text-xs font-semibold text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none"
                />
              </div>
              <Button
                variant={hideDrafted ? 'primary' : 'outline'}
                size="sm"
                icon={hideDrafted ? 'check' : 'minus'}
                onClick={() => setHideDrafted((v) => !v)}
              >
                {hideDrafted ? 'Hiding drafted' : 'Hide drafted'}
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader
              label="2026 Stats Board"
              meta={`${visibleRows.length} players · last season's real numbers, our scoring`}
            />
            <StatsTable
              rows={visibleRows}
              wr={wr}
              sort={sort}
              onSortChange={(key) =>
                setSort((s) => ({ key, dir: s.key === key && s.dir === 'desc' ? 'asc' : 'desc' }))
              }
            />
          </Card>
          <p className="px-1 text-[11px] leading-snug text-ink-mute">
            <strong className="font-bold text-ink-dim">Avg</strong> and{' '}
            <strong className="font-bold text-ink-dim">Total</strong> are last season&apos;s fantasy
            points in our league scoring, each with its rank. Totals reward availability (more games);
            averages reward per-game production. Players who missed last season show no data.
          </p>
        </>
      )}

      {tab === 'order' && <MyOrderTab wr={wr} />}
      {tab === 'bargains' && <BargainsTab wr={wr} />}
      {tab === 'scoring' && <ScoringTab />}
    </div>
  );
}

/* ── Stats table ─────────────────────────────────────────────────────────── */

function StatsTable({
  rows,
  wr,
  sort,
  onSortChange,
}: {
  rows: StatRow[];
  wr: ReturnType<typeof useWarRoom>;
  sort: SortState;
  onSortChange: (key: string) => void;
}) {
  const num = (get: (r: StatRow) => number, digits = 1, dash = true) => (r: StatRow) =>
    !r.hasData && dash ? <span className="text-ink-mute">—</span> : (
      <span className="tabular text-sm">{get(r).toFixed(digits)}</span>
    );

  const columns: Column<StatRow>[] = [
    {
      key: 'player',
      header: 'Player',
      align: 'left',
      sortValue: (r) => r.name,
      cell: (r) => (
        <div className={cn('flex items-center gap-2', wr.isDrafted(r.id) && 'opacity-45')}>
          <PosChip pos={r.pos} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('truncate text-sm font-bold text-ink', wr.isDrafted(r.id) && 'line-through')}>
                {r.name}
              </span>
              {r.injuryStatus === 'OUT' && <Badge tone="negative">OUT</Badge>}
            </div>
            <span className="text-[11px] font-semibold text-ink-mute">{r.team} · ESPN #{r.espnRank}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'avgFpts',
      header: 'Avg FPTS',
      align: 'right',
      sortValue: (r) => r.avgFpts,
      cell: (r) =>
        r.hasData ? (
          <span className="whitespace-nowrap">
            <span className="tabular text-sm font-black text-accent-deep">{one(r.avgFpts)}</span>
            <RankTag rank={r.avgRank} />
          </span>
        ) : (
          <span className="text-ink-mute">—</span>
        ),
    },
    {
      key: 'totalFpts',
      header: 'Total FPTS',
      align: 'right',
      sortValue: (r) => r.totalFpts,
      cell: (r) =>
        r.hasData ? (
          <span className="whitespace-nowrap">
            <span className="tabular text-sm font-black text-ink">{r.totalFpts}</span>
            <RankTag rank={r.totalRank} />
          </span>
        ) : (
          <span className="text-ink-mute">no 2026 data</span>
        ),
    },
    { key: 'gp', header: 'GP', align: 'right', numeric: true, sortValue: (r) => r.gp, cell: num((r) => r.gp, 0) },
    { key: 'min', header: 'MIN', align: 'right', numeric: true, hideOnMobile: true, sortValue: (r) => r.min, cell: num((r) => r.min) },
    {
      key: 'fgPct',
      header: 'FG%',
      align: 'right',
      numeric: true,
      hideOnMobile: true,
      sortValue: (r) => r.fgPct,
      cell: (r) => <span className="tabular text-sm">{pct(r.fgPct)}</span>,
    },
    {
      key: 'ftPct',
      header: 'FT%',
      align: 'right',
      numeric: true,
      hideOnMobile: true,
      sortValue: (r) => r.ftPct,
      cell: (r) => <span className="tabular text-sm">{pct(r.ftPct)}</span>,
    },
    { key: 'tpm', header: '3PM', align: 'right', numeric: true, hideOnMobile: true, sortValue: (r) => r.tpm, cell: num((r) => r.tpm) },
    { key: 'reb', header: 'REB', align: 'right', numeric: true, sortValue: (r) => r.reb, cell: num((r) => r.reb) },
    { key: 'ast', header: 'AST', align: 'right', numeric: true, sortValue: (r) => r.ast, cell: num((r) => r.ast) },
    { key: 'stl', header: 'STL', align: 'right', numeric: true, hideOnMobile: true, sortValue: (r) => r.stl, cell: num((r) => r.stl, 2) },
    { key: 'blk', header: 'BLK', align: 'right', numeric: true, hideOnMobile: true, sortValue: (r) => r.blk, cell: num((r) => r.blk, 2) },
    { key: 'to', header: 'TO', align: 'right', numeric: true, hideOnMobile: true, sortValue: (r) => r.to, cell: num((r) => r.to) },
    { key: 'pts', header: 'PTS', align: 'right', numeric: true, sortValue: (r) => r.pts, cell: num((r) => r.pts) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-24',
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => wr.toggleQueue(r.id)}
            title={wr.isQueued(r.id) ? 'Remove from your order' : 'Add to your order'}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-[8px] border transition',
              wr.isQueued(r.id)
                ? 'border-accent-border bg-accent-bg text-accent-deep'
                : 'border-line bg-surface text-ink-mute hover:text-ink',
            )}
          >
            <Icon name={wr.isQueued(r.id) ? 'check' : 'plus'} size={13} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={() => wr.toggleDrafted(r.id)}
            title={wr.isDrafted(r.id) ? 'Put back on the board' : 'Mark drafted (cross out)'}
            className={cn(
              'grid h-7 w-7 place-items-center rounded-[8px] border transition',
              wr.isDrafted(r.id)
                ? 'border-negative-line bg-negative-soft text-negative'
                : 'border-line bg-surface text-ink-mute hover:text-ink',
            )}
          >
            <Icon name={wr.isDrafted(r.id) ? 'refresh' : 'x'} size={13} strokeWidth={2.4} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r) => r.id}
      sort={sort}
      onSortChange={onSortChange}
      stickyFirst={1}
      emptyMessage="No players match these filters."
    />
  );
}

/* ── My order tab ────────────────────────────────────────────────────────── */

function MyOrderTab({ wr }: { wr: ReturnType<typeof useWarRoom> }) {
  const queued = wr.queue.map((id) => wr.statsMap[id]).filter((r): r is StatRow => Boolean(r));

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-[0.8125rem] text-ink-dim">
          Your personal draft order — move priorities up and down. Auto-fill seeds it from the top of
          the board by average fantasy points, then tweak by hand. It saves as you go.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" icon="sparkle" onClick={() => wr.autoFillQueue(15)}>
            Auto-fill top 15
          </Button>
          <Button variant="ghost" size="sm" icon="minus" onClick={wr.clearQueue} disabled={wr.queue.length === 0}>
            Clear
          </Button>
        </div>
      </Card>

      {queued.length === 0 ? (
        <EmptyState
          icon="target"
          title="No targets queued"
          copy="Add players from the stats board with the + button, or auto-fill from the top and reorder to taste."
        />
      ) : (
        <Card>
          <CardHeader label="My draft order" meta={`${queued.length} targets`} />
          <ul className="divide-y divide-line">
            {queued.map((r, index) => (
              <li
                key={r.id}
                className={cn('flex items-center gap-3 px-4 py-2.5', wr.isDrafted(r.id) && 'opacity-45')}
              >
                <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-surface-2 text-[12px] font-black text-ink">
                  {index + 1}
                </span>
                <PosChip pos={r.pos} />
                <div className="min-w-0 flex-1">
                  <span className={cn('truncate text-sm font-bold text-ink', wr.isDrafted(r.id) && 'line-through')}>
                    {r.name}
                  </span>
                  <span className="block text-[11px] font-semibold text-ink-mute">
                    {r.team} · {r.hasData ? `${one(r.avgFpts)} avg (#${r.avgRank}) · ${r.totalFpts} total` : 'no 2026 data'} · ESPN #{r.espnRank}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconBtn icon="arrow-up" title="Move up" onClick={() => wr.moveInQueue(r.id, -1)} disabled={index === 0} />
                  <IconBtn icon="arrow-down" title="Move down" onClick={() => wr.moveInQueue(r.id, 1)} disabled={index === queued.length - 1} />
                  <IconBtn
                    icon={wr.isDrafted(r.id) ? 'refresh' : 'x'}
                    title={wr.isDrafted(r.id) ? 'Put back on board' : 'Mark drafted'}
                    tone={wr.isDrafted(r.id) ? 'danger' : 'default'}
                    onClick={() => wr.toggleDrafted(r.id)}
                  />
                  <IconBtn icon="minus" title="Remove from order" onClick={() => wr.removeFromQueue(r.id)} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function IconBtn({
  icon,
  title,
  onClick,
  disabled,
  tone = 'default',
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'grid h-7 w-7 place-items-center rounded-[8px] border transition disabled:opacity-30',
        tone === 'danger'
          ? 'border-negative-line bg-negative-soft text-negative'
          : 'border-line bg-surface text-ink-mute hover:text-ink',
      )}
    >
      <Icon name={icon} size={13} strokeWidth={2.4} />
    </button>
  );
}

/* ── Bargains & targets tab ──────────────────────────────────────────────── */

function BargainsTab({ wr }: { wr: ReturnType<typeof useWarRoom> }) {
  const available = wr.bargains.filter((b) => !wr.isDrafted(b.id));

  return (
    <div className="flex flex-col gap-3">
      <Card className="px-4 py-3">
        <p className="text-[0.8125rem] text-ink-dim">
          Players who <strong className="font-bold text-ink">produced</strong> last season well ahead of
          where ESPN is drafting them this year — the guys the room lets slide too far. Value is
          ESPN&apos;s draft rank minus their average-fantasy-points rank, so a big gap means star-level
          output going late.
        </p>
      </Card>

      <Card>
        <CardHeader label="Bargains & watch targets" meta={`${available.length} undrafted`} />
        {available.length === 0 ? (
          <EmptyState icon="flame" title="No bargains left" copy="Every value pick has come off the board." />
        ) : (
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {available.map((b) => (
              <BargainCell key={b.id} bargain={b} wr={wr} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function BargainCell({ bargain, wr }: { bargain: Bargain; wr: ReturnType<typeof useWarRoom> }) {
  return (
    <div className="flex items-start justify-between gap-3 bg-surface p-3.5">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <PosChip pos={bargain.pos} />
          <span className="truncate text-sm font-bold text-ink">{bargain.name}</span>
        </div>
        <p className="mt-1 text-[11px] font-semibold text-ink-mute">
          {bargain.team} · {one(bargain.avgFpts)} avg fpts · {bargain.totalFpts} total · {bargain.gp} GP
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] font-bold">
          <span className="text-ink-dim">ESPN #{bargain.espnRank}</span>
          <Icon name="arrow-right" size={10} className="text-ink-mute" />
          <span className="text-accent-deep">Produced like #{bargain.avgRank}</span>
          <Badge tone="positive">+{bargain.valueGap} value</Badge>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        <IconBtn
          icon={wr.isQueued(bargain.id) ? 'check' : 'plus'}
          title={wr.isQueued(bargain.id) ? 'Queued' : 'Add to order'}
          onClick={() => wr.toggleQueue(bargain.id)}
        />
        <IconBtn icon="x" title="Mark drafted" onClick={() => wr.toggleDrafted(bargain.id)} />
      </div>
    </div>
  );
}

/* ── Scoring tab ─────────────────────────────────────────────────────────── */

function ScoringTab() {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader label="Our league scoring" meta="Horn Pub Ligue 1" />
        <ul className="divide-y divide-line">
          {SCORING_ROWS.map((row) => (
            <li key={row.abbr} className="flex items-center justify-between px-4 py-2">
              <span className="text-sm font-semibold text-ink-dim">
                {row.label} <span className="text-ink-mute">({row.abbr})</span>
              </span>
              <span className={cn('tabular text-sm font-black', row.value < 0 ? 'text-negative' : 'text-ink')}>
                {row.value > 0 ? `+${row.value}` : row.value}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader label="How to read the board" meta="Fact, not projection" />
        <CardBody className="flex flex-col gap-3 text-sm leading-relaxed text-ink-dim">
          <p>
            Every number on the stats board is <strong className="font-bold text-ink">last season&apos;s
            real production</strong>, scored in our exact league settings — the same fantasy totals
            ESPN shows, because ESPN already totals them for Horn Pub Ligue 1. No projections, no
            guessing.
          </p>
          <p>
            <strong className="font-bold text-ink">Total FPTS</strong> rewards availability — more games,
            more banked points, which is what wins a season of head-to-head weeks.{' '}
            <strong className="font-bold text-ink">Avg FPTS</strong> is per-game production, the better
            read on a player who missed time. A big gap between the two ranks is the story: durable
            grinders climb the total list; hurt stars rank higher on average.
          </p>
          <p>
            Because steals and blocks pay 4 each and double-doubles +7, defensive bigs and high-assist
            playmakers score better here than in ESPN&apos;s default ranking — which is exactly where the
            bargains come from.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
