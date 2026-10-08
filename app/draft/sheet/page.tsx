import type { Metadata } from 'next';
import Link from 'next/link';
import { DraftSlideshow } from '@/components/draft/DraftSlideshow';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
import { DRAFT_GAMES } from '@/lib/data/draft-games';
import { ACTIVE_SEASON } from '@/lib/data/seasons';

export const metadata: Metadata = {
  title: 'Draft Games Sheet',
  description:
    'The live draft-night games, one slide at a time: rules, graphic and score entry for every manager.',
};

export default function DraftSheetPage() {
  return (
    <PageShell>
      <PageHeader
        kicker={`${ACTIVE_SEASON.label} draft weekend`}
        title="Draft Games Sheet"
        copy={`Run the ${DRAFT_GAMES.length} games one slide at a time. Enter each manager's score live and it flows straight into the ladder, lottery and board. Scores save on this device, with an optional push to a Google Sheet.`}
        aside={
          <Link
            href="/draft"
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-bold text-white/70 transition hover:border-white/25 hover:text-white"
          >
            <Icon name="chevron-left" size={14} />
            Back to control room
          </Link>
        }
      />

      <DraftSlideshow seasonId={ACTIVE_SEASON.id} />
    </PageShell>
  );
}
