import type { Metadata } from 'next';
import { WarRoom } from '@/components/draft/war-room/WarRoom';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { ACTIVE_SEASON } from '@/lib/data/seasons';

// Unlisted and private: keep it out of search engines and the sitemap.
export const metadata: Metadata = {
  title: 'War Room',
  description: 'Private draft board.',
  robots: { index: false, follow: false },
};

export default function WarRoomPage() {
  return (
    <PageShell>
      <PageHeader
        kicker={`${ACTIVE_SEASON.label} · private`}
        title="Draft War Room"
        copy="Your AI-informed big board scored through our league settings, live availability tracking and your own editable pick order. Everything here is saved to this device only."
      />
      <WarRoom seasonId={ACTIVE_SEASON.id} />
    </PageShell>
  );
}
