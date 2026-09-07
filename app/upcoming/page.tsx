import type { Metadata } from 'next';
import { CountdownCard } from '@/components/dashboard/CountdownCard';
import { UpcomingSeason } from '@/components/fixtures/UpcomingSeason';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { UPCOMING_CONFERENCES } from '@/lib/data/conferences';
import { UPCOMING_PARTICIPANTS, UPCOMING_SEASON } from '@/lib/data/seasons';
import { FORM_SEASON, previewFor } from '@/lib/fixtures/preview';
import { UPCOMING_ROUNDS } from '@/lib/fixtures/schedule';
import { num } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: `${UPCOMING_SEASON.label} Season`,
  description: `Round-by-round fixtures and previews for the ${UPCOMING_SEASON.label} season.`,
};

export default function UpcomingSeasonPage() {
  const rounds = UPCOMING_ROUNDS.map((round) => ({
    round: round.round,
    previews: round.fixtures.map((fixture) => previewFor(fixture)),
  }));

  const totalFixtures = rounds.reduce((sum, round) => sum + round.previews.length, 0);

  return (
    <PageShell>
      <PageHeader
        kicker={`Season ${UPCOMING_SEASON.startYear - 2020} · upcoming`}
        title={`${UPCOMING_SEASON.label} Season`}
        copy={`${UPCOMING_SEASON.regularSeasonWeeks} rounds, ${UPCOMING_PARTICIPANTS.length} managers, ${num(totalFixtures)} fixtures. Pick a fixture for a full preview built from the all-time head-to-head record and ${FORM_SEASON.label} scoring form.`}
        aside={
          UPCOMING_SEASON.draftDate ? (
            <CountdownCard
              targetIso={UPCOMING_SEASON.draftDate}
              seasonLabel={UPCOMING_SEASON.label}
            />
          ) : undefined
        }
      />

      <UpcomingSeason
        rounds={rounds}
        managerIds={UPCOMING_PARTICIPANTS}
        conferences={UPCOMING_CONFERENCES}
        seasonLabel={UPCOMING_SEASON.label}
      />
    </PageShell>
  );
}
