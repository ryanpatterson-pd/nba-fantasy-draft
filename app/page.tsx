import Link from 'next/link';
import { CountdownCard } from '@/components/dashboard/CountdownCard';
import { LeaderStatCard } from '@/components/dashboard/LeaderStatCard';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { AllTimeLadder } from '@/components/league/AllTimeLadder';
import { HonourRoll } from '@/components/league/HonourRoll';
import { SeasonSnapshot, type SnapshotSeason } from '@/components/league/SeasonSnapshot';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { DRAFT_GAMES, FORMAT_LABELS } from '@/lib/data/draft-games';
import { getManager } from '@/lib/data/managers';
import {
  ACTIVE_SEASON,
  COMPLETED_SEASONS,
  LATEST_COMPLETED_SEASON,
  LEAGUE_NAME,
} from '@/lib/data/seasons';
import { ALL_TIME, HONOUR_ORDER, LEAGUE_TOTALS, sortAllTime } from '@/lib/stats/all-time';
import { RECORD_BOOK } from '@/lib/stats/records';
import { championOf, seasonTable } from '@/lib/stats/season';
import { num, pct, record } from '@/lib/utils/format';

export default function DashboardPage() {
  const snapshots: SnapshotSeason[] = COMPLETED_SEASONS.map((season) => ({
    id: season.id,
    label: season.label,
    headline: season.headline,
    rows: seasonTable(season.id),
  }));

  const winRateRanked = sortAllTime('winPct');
  const winRateLeader = winRateRanked[0];
  const winRateRunnerUp = winRateRanked[1];
  // Most wooden spoons — the league's most-decorated last-place finisher. Ties
  // broken by fewer games played (a worse rate of spoons), then name.
  const spoonLeader = [...ALL_TIME].sort(
    (a, b) =>
      b.woodenSpoons - a.woodenSpoons ||
      a.gamesPlayed - b.gamesPlayed ||
      a.managerId.localeCompare(b.managerId),
  )[0];
  const reigningChampion = championOf(LATEST_COMPLETED_SEASON.id);
  const champManager = reigningChampion ? getManager(reigningChampion.managerId) : undefined;

  const highlightRecords = RECORD_BOOK.filter((entry) =>
    ['most-titles', 'best-rate', 'highest-week', 'biggest-blowout'].includes(entry.id),
  );

  return (
    <PageShell>
      <PageHeader
        kicker="League overview"
        title="Dashboard"
        copy={`${COMPLETED_SEASONS.length} completed seasons across ${LEAGUE_TOTALS.managers} managers. Every figure below is calculated from the full matchup database.`}
        aside={
          ACTIVE_SEASON.draftDate ? (
            <CountdownCard targetIso={ACTIVE_SEASON.draftDate} seasonLabel={ACTIVE_SEASON.label} />
          ) : undefined
        }
      />

      {/* KPI row.
          Mobile: one card at a time, swipe sideways to the next (snap carousel).
          sm and up: the full grid. Each card is wrapped so it can size to the
          viewport on mobile and to the grid track above it. */}
      <section
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden"
      >
        {champManager && reigningChampion && (
          <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
            <LeaderStatCard
              managerId={champManager.id}
              label="Reigning champion"
              value={champManager.name}
              unit={LATEST_COMPLETED_SEASON.label}
              sub={`${record(reigningChampion.wins, reigningChampion.losses, reigningChampion.ties)} regular season`}
              icon="trophy"
              className="h-full"
            />
          </div>
        )}
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <LeaderStatCard
            managerId={winRateLeader.managerId}
            label="Best win rate"
            value={pct(winRateLeader.winPct)}
            unit={getManager(winRateLeader.managerId).name}
            sub={`${record(winRateLeader.wins, winRateLeader.losses, winRateLeader.ties)} all time`}
            icon="chart"
            className="h-full"
          />
        </div>
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <LeaderStatCard
            managerId={winRateRunnerUp.managerId}
            label="2nd best win rate"
            value={pct(winRateRunnerUp.winPct)}
            unit={getManager(winRateRunnerUp.managerId).name}
            sub={`${record(winRateRunnerUp.wins, winRateRunnerUp.losses, winRateRunnerUp.ties)} all time`}
            icon="chart"
            className="h-full"
          />
        </div>
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <LeaderStatCard
            managerId={spoonLeader.managerId}
            label="Most wooden spoons"
            value={String(spoonLeader.woodenSpoons)}
            unit={spoonLeader.woodenSpoons === 1 ? 'spoon' : 'spoons'}
            sub={getManager(spoonLeader.managerId).name}
            icon="spoon"
            className="h-full"
          />
        </div>
      </section>

      {/* Honour roll: full-width row of champion cards. */}
      <HonourRoll />

      {/* Ladder + career leaders */}
      <section className="grid gap-3 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        <AllTimeLadder collapseTo={8} />
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader label="Career leaders" meta="Every ring winner" />
            <ul className="divide-y divide-line">
              {HONOUR_ORDER.filter((row) => row.titles > 0).map((row, index) => {
                const manager = getManager(row.managerId);
                return (
                  <li key={row.managerId}>
                    <Link
                      href={`/teams/${manager.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
                    >
                      <span className="tabular text-lg font-extrabold text-ink-mute">
                        {index + 1}
                      </span>
                      <Avatar manager={manager} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {manager.name}
                        </span>
                        <span className="block truncate text-[0.7rem] text-ink-mute">
                          {row.titles} {row.titles === 1 ? 'ring' : 'rings'} · {row.finalsAppearances} grand{' '}
                          {row.finalsAppearances === 1 ? 'final' : 'finals'}
                        </span>
                      </span>
                      <span className="tabular text-sm font-semibold text-accent-deep">{pct(row.winPct)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </section>

      <SeasonSnapshot seasons={snapshots} />

      {/* Draft night preview + record highlights */}
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader
            label="Draft night runsheet"
            action={
              <Link
                href="/draft"
                className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.12em] text-accent-deep uppercase hover:underline"
              >
                Open draft hub
                <Icon name="arrow-right" size={12} />
              </Link>
            }
          />
          <ul className="divide-y divide-line">
            {DRAFT_GAMES.slice(0, 4).map((game) => (
              <li key={game.id} className="flex items-center gap-3 px-4 py-3">
                <span className="accent-chip flex h-8 w-8 items-center justify-center rounded-tile text-xs font-bold">
                  {String(game.order).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{game.name}</span>
                  <span className="block truncate text-[0.7rem] text-ink-mute">
                    {game.scoring.rule}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="label-xs block">{game.slot}</span>
                  <span className="text-[0.7rem] text-ink-dim">{FORMAT_LABELS[game.format]}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line px-4 py-3 text-[0.7rem] text-ink-mute">
            {DRAFT_GAMES.length} games · 1st place scores {DRAFT_GAMES.length > 0 ? 12 : 0} points, 12th
            scores 1. Points set your lottery odds.
          </div>
        </Card>

        <Card>
          <CardHeader
            label="From the record book"
            action={
              <Link
                href="/records"
                className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.12em] text-accent-deep uppercase hover:underline"
              >
                All records
                <Icon name="arrow-right" size={12} />
              </Link>
            }
          />
          <ul className="grid gap-px bg-line sm:grid-cols-2">
            {highlightRecords.map((entry) => (
              <li key={entry.id} className="bg-surface p-4">
                <p className="label-xs">{entry.title}</p>
                <p className="tabular mt-1.5 text-2xl font-extrabold text-ink">
                  {entry.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-accent-deep">{entry.holder}</p>
                <p className="mt-1 text-[0.7rem] leading-snug text-ink-mute">{entry.detail}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="px-1 pb-1 text-[11px] font-medium text-ink-dim">
        Imported from ESPN league {LEAGUE_NAME}. Every figure is derived from the full matchup record.
      </p>
    </PageShell>
  );
}
