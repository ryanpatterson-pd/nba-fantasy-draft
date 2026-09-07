import type { Metadata } from 'next';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { AllTimeLadder } from '@/components/league/AllTimeLadder';
import { ManagerCard } from '@/components/teams/ManagerCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { HONOUR_ORDER, LEAGUE_TOTALS } from '@/lib/stats/all-time';
import { num } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Teams',
  description: 'All twelve managers, their full career records and season-by-season finishes.',
};

export default function TeamsPage() {
  return (
    <PageShell>
      <PageHeader
        kicker="The field"
        title="Teams"
        copy={`${LEAGUE_TOTALS.managers} managers, ${COMPLETED_SEASONS.length} seasons each, ${num(LEAGUE_TOTALS.matchups)} matchups logged. Regular season and playoff results, silverware, scoring extremes and the head-to-head ledger.`}
      />

      <SectionHeader
        kicker="Roster"
        title="Career snapshots"
        copy="Ordered by silverware, then win rate."
        actions={[
          { href: '/head-to-head', label: 'Head-to-head matrix' },
          { href: '#all-time-ladder', label: 'All-time ladder', icon: 'arrow-down' },
        ]}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {HONOUR_ORDER.map((row) => (
          <ManagerCard key={row.managerId} row={row} />
        ))}
      </section>

      <div id="all-time-ladder" className="scroll-mt-4">
        <SectionHeader kicker="Full database" title="All-time ladder" />
      </div>
      <AllTimeLadder showAction={false} />
    </PageShell>
  );
}
