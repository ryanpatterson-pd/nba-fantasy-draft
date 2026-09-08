import type { Metadata } from 'next';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { SeasonTimeline } from '@/components/history/SeasonTimeline';
import { LeaderStatCard } from '@/components/dashboard/LeaderStatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { ALL_TIME, HONOUR_ORDER, LEAGUE_TOTALS } from '@/lib/stats/all-time';
import { num } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const metadata: Metadata = {
  title: 'League History',
  description: 'Every season, every champion and every grand final since the league began.',
};

export default function HistoryPage() {
  const titleHolders = ALL_TIME.filter((row) => row.titles > 0).sort((a, b) => b.titles - a.titles);
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
        <LeaderStatCard
          label="Seasons archived"
          value={String(COMPLETED_SEASONS.length)}
          unit="seasons"
          sub={`${COMPLETED_SEASONS[0].label} – ${COMPLETED_SEASONS[COMPLETED_SEASONS.length - 1].label}`}
          icon="calendar"
        />
        <LeaderStatCard
          label="Different champions"
          value={String(LEAGUE_TOTALS.distinctChampions)}
          sub={`of ${COMPLETED_SEASONS.length} seasons`}
          icon="crown"
        />
        <LeaderStatCard
          managerId={mostFinals.managerId}
          label="Most grand finals"
          value={String(mostFinals.finalsAppearances)}
          unit="finals"
          sub={`${getManager(mostFinals.managerId).name} · ${mostFinals.finalsRecord.wins}–${mostFinals.finalsRecord.losses} in finals`}
          icon="medal"
        />
        <LeaderStatCard
          label="Still waiting"
          value={String(ALL_TIME.filter((row) => row.titles === 0).length)}
          sub="managers without a ring"
          icon="clock"
        />
      </section>

      {/* Championship-count strip: each title-holder with their mascot and ring
          tally. The chips flex to fill the bar's width, so they spread evenly
          across the desktop row and shrink as more champions are added; on
          mobile they stack full-width beneath the label. */}
      <Card className="on-dark bg-dark flex flex-col gap-3 border-transparent px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:py-3.5">
        <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-black tracking-[1px] text-accent-2 uppercase sm:w-[112px]">
          <Icon name="trophy" size={14} />
          Championship count
        </span>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:gap-2.5">
          {titleHolders.map((row) => {
            const manager = getManager(row.managerId);
            return (
              <span
                key={row.managerId}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-tile border border-white/10 bg-white/[0.05] py-2 pr-3 pl-2"
              >
                <Avatar manager={manager} size="md" ring={false} />
                <span className="min-w-0 flex-1 truncate text-[14px] font-extrabold tracking-[-0.015em] text-white">
                  {manager.name}
                </span>
                <span className="tabular inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-[13px] font-black text-accent-2">
                  <Icon name="trophy" size={12} />
                  {row.titles}
                </span>
              </span>
            );
          })}
        </div>
      </Card>

      {/* Season timeline, full width. */}
      <SeasonTimeline />
    </PageShell>
  );
}
