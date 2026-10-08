import type { Metadata } from 'next';
import Link from 'next/link';
import { CountdownCard } from '@/components/dashboard/CountdownCard';
import { DraftHub } from '@/components/draft/DraftHub';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { Icon } from '@/components/ui/Icon';
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
          <div className="flex flex-col items-stretch gap-2 xl:items-end">
            {ACTIVE_SEASON.draftDate && (
              <CountdownCard targetIso={ACTIVE_SEASON.draftDate} seasonLabel={ACTIVE_SEASON.label} />
            )}
            <div className="flex items-center gap-2">
              {/* The presentation score sheet — the headline way to run the night. */}
              <Link
                href="/draft/sheet"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] border border-accent/40 bg-accent/15 px-3 py-2 text-[12px] font-black tracking-[-0.01em] text-white transition hover:bg-accent/25"
              >
                <Icon name="sparkle" size={14} />
                Run the games sheet
              </Link>
              {/* Discreet padlock to the private War Room. Unlisted on purpose —
                  only whoever knows to click it (and has the code) gets in. */}
              <Link
                href="/draft/war-room"
                aria-label="Private draft board"
                title="Private"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/5 text-white/40 transition hover:border-white/25 hover:text-white/80"
              >
                <Icon name="lock" size={14} />
              </Link>
            </div>
          </div>
        }
      />

      <DraftHub seasonId={ACTIVE_SEASON.id} />
    </PageShell>
  );
}
