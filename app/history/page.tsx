import type { Metadata } from 'next';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { SeasonTimeline } from '@/components/history/SeasonTimeline';
import { Avatar } from '@/components/ui/Avatar';
import { Bar } from '@/components/ui/Bar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from '@/components/ui/StatCard';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { ALL_TIME, HONOUR_ORDER, LEAGUE_TOTALS } from '@/lib/stats/all-time';
import { num, pct } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'League History',
  description: 'Every season, every champion and every grand final since the league began.',
};

export default function HistoryPage() {
  const titleHolders = ALL_TIME.filter((row) => row.titles > 0).sort((a, b) => b.titles - a.titles);
  const maxTitles = Math.max(1, ...titleHolders.map((row) => row.titles));
  const nearlyMen = [...ALL_TIME]
    .filter((row) => row.titles === 0 && row.finalsAppearances > 0)
    .sort((a, b) => b.finalsAppearances - a.finalsAppearances);
  const mostFinals = HONOUR_ORDER.reduce((best, row) =>
    row.finalsAppearances > best.finalsAppearances ? row : best,
  );

  return (
    <PageShell>
      <PageHeader
        kicker={`Est. ${COMPLETED_SEASONS[0].startYear}`}
        title="League History"
        copy={`The complete archive: ${COMPLETED_SEASONS.length} seasons, ${LEAGUE_TOTALS.distinctChampions} different champions and ${num(LEAGUE_TOTALS.matchups)} matchups. Champions, runners-up, minor premiers and wooden spoons, all calculated from the record.`}
      />

      {/* Mobile: a single horizontal swipe row (each card ~85% wide so the next
          one peeks). sm and up: the usual grid. */}
      <section
        className={cn(
          'flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4',
          '[&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto',
        )}
      >
        <StatCard
          label="Seasons archived"
          value={String(COMPLETED_SEASONS.length)}
          unit={`${COMPLETED_SEASONS[0].label} – ${COMPLETED_SEASONS[COMPLETED_SEASONS.length - 1].label}`}
          icon="calendar"
        />
        <StatCard
          label="Different champions"
          value={String(LEAGUE_TOTALS.distinctChampions)}
          unit={`of ${COMPLETED_SEASONS.length} seasons`}
          icon="crown"
        />
        <StatCard
          label="Most grand finals"
          value={String(mostFinals.finalsAppearances)}
          unit={getManager(mostFinals.managerId).name}
          icon="medal"
          trend={{
            value: `${mostFinals.finalsRecord.wins}–${mostFinals.finalsRecord.losses} in finals`,
            direction: mostFinals.finalsRecord.wins >= mostFinals.finalsRecord.losses ? 'up' : 'down',
          }}
        />
        <StatCard
          label="Still waiting"
          value={String(ALL_TIME.filter((row) => row.titles === 0).length)}
          unit="managers without a ring"
          icon="clock"
        />
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <SeasonTimeline />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <Card>
            <CardHeader label="Championship count" meta="All time" />
            <ul className="divide-y divide-line">
              {titleHolders.map((row) => {
                const manager = getManager(row.managerId);
                return (
                  <li key={row.managerId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar manager={manager} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {manager.name}
                      </span>
                      <Bar
                        value={row.titles}
                        max={maxTitles}
                        colour={manager.colours.primary}
                        height={4}
                        className="mt-1.5"
                      />
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-accent-deep">
                      <Icon name="trophy" size={13} />
                      {row.titles}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader label="The nearly men" meta="Finals, no ring" />
            {nearlyMen.length === 0 ? (
              <p className="px-4 py-5 text-sm text-ink-mute">
                Everyone who has reached a grand final has won one.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {nearlyMen.map((row) => {
                  const manager = getManager(row.managerId);
                  return (
                    <li key={row.managerId} className="flex items-center gap-3 px-4 py-3">
                      <Avatar manager={manager} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {manager.name}
                        </span>
                        <span className="block truncate text-[0.7rem] text-ink-mute">
                          {row.finalsAppearances} grand{' '}
                          {row.finalsAppearances === 1 ? 'final' : 'finals'} · {pct(row.winPct)} win rate
                        </span>
                      </span>
                      <span className="tabular text-sm font-semibold text-ink-dim">
                        {row.playoffAppearances}/{row.seasonsPlayed}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </section>
    </PageShell>
  );
}
