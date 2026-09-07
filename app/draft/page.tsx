import type { Metadata } from 'next';
import { CountdownCard } from '@/components/dashboard/CountdownCard';
import { DraftHub } from '@/components/draft/DraftHub';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { DRAFT_GAMES } from '@/lib/data/draft-games';
import { ACTIVE_SEASON } from '@/lib/data/seasons';
import { FIELD_SIZE, MAX_POSSIBLE_POINTS } from '@/lib/draft/scoring';

export const metadata: Metadata = {
  title: 'Draft Night',
  description:
    'The draft night control room: games, live scoring, lottery odds and the wheel that sets the selection order.',
};

export default function DraftPage() {
  return (
    <PageShell>
      <PageHeader
        kicker={`${ACTIVE_SEASON.label} draft weekend`}
        title="Draft Night"
        copy={`${DRAFT_GAMES.length} games ranking all ${FIELD_SIZE} managers from first to last. First place banks ${FIELD_SIZE} points, last banks 1, and ${MAX_POSSIBLE_POINTS} are on offer across the weekend. Points buy lottery entries; the wheel sets the order.`}
        aside={
          ACTIVE_SEASON.draftDate ? (
            <CountdownCard targetIso={ACTIVE_SEASON.draftDate} seasonLabel={ACTIVE_SEASON.label} />
          ) : undefined
        }
      />

      <DraftHub seasonId={ACTIVE_SEASON.id} />
    </PageShell>
  );
}
