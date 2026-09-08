import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { StatBanner } from '@/components/league/StatBanner';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { CountUp } from '@/components/ui/CountUp';
import { Reveal } from '@/components/ui/Reveal';
import { findManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { LEAGUE_TOTALS } from '@/lib/stats/all-time';
import { RECORD_BOOK, RECORD_GROUPS, type RecordEntry } from '@/lib/stats/records';
import { num } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Record Book',
  description: 'Permanent league records: highs, lows, streaks and silverware.',
};

export default function RecordsPage() {
  return (
    <PageShell>
      <PageHeader
        kicker="The permanent scoreboard"
        title="Record Book"
        copy={`${RECORD_BOOK.length} records tracked across ${COMPLETED_SEASONS.length} seasons and ${num(LEAGUE_TOTALS.matchups)} matchups. Each one is calculated from the database, so it updates itself the moment new results land.`}
      />

      <StatBanner
        label="Records derived from"
        value={num(LEAGUE_TOTALS.matchups * 2)}
        caption="individual scores"
        footnote={`${num(LEAGUE_TOTALS.pointsScored)} total points · ${LEAGUE_TOTALS.managers} managers`}
      />

      {RECORD_GROUPS.map((group) => {
        const entries = RECORD_BOOK.filter((entry) => entry.group === group.id);
        if (entries.length === 0) return null;

        return (
          <section key={group.id} className="flex flex-col gap-3">
            <SectionHeader kicker={group.label} title={group.blurb} />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry, index) => (
                <Reveal key={entry.id} delay={index * 50}>
                  <RecordTile entry={entry} />
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}
    </PageShell>
  );
}

function RecordTile({ entry }: { entry: RecordEntry }) {
  const manager = findManager(entry.managerId);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="label-xs">{entry.title}</p>

      <p className="tabular text-[2.4rem] leading-none font-extrabold text-ink">
        <CountUp value={entry.value} />
      </p>

      <div className="flex items-center gap-2.5">
        {manager ? (
          <>
            <Avatar manager={manager} size="sm" />
            <Link
              href={`/teams/${manager.id}`}
              className="truncate text-sm font-bold text-accent-deep hover:underline"
            >
              {entry.holder}
            </Link>
          </>
        ) : (
          <>
            <span className="accent-chip flex h-8 w-8 items-center justify-center rounded-full">
              <Icon name="users" size={14} />
            </span>
            <span className="truncate text-sm font-bold text-accent-deep">{entry.holder}</span>
          </>
        )}
      </div>

      <p className="mt-auto border-t border-line pt-3 text-[0.72rem] leading-snug text-ink-mute">
        {entry.detail}
      </p>
    </Card>
  );
}
