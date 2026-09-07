import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { CompareBoard } from '@/components/teams/CompareBoard';
import { Icon } from '@/components/ui/Icon';
import { MANAGER_IDS, findManager } from '@/lib/data/managers';

export const metadata: Metadata = {
  title: 'Compare Managers',
  description: 'Put any two managers head to head: careers, rings and the all-time series, side by side.',
};

/** Default face-off when the URL names no valid managers. */
const DEFAULT_A = 'ryan';
const DEFAULT_B = 'andrew';

type Search = { a?: string; b?: string };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { a, b } = await searchParams;

  // Only trust ids that are real managers; fall back to the defaults otherwise.
  const validA = findManager(a) ? (a as string) : DEFAULT_A;
  let validB = findManager(b) ? (b as string) : DEFAULT_B;
  // Never open on a manager compared against themselves.
  if (validB === validA) validB = MANAGER_IDS.find((id) => id !== validA) ?? DEFAULT_B;

  return (
    <PageShell>
      <PageHeader
        kicker="The tale of the tape"
        title="Compare Managers"
        copy="Put any two managers side by side — their careers, championships and the all-time series between them. Swap either side to build a new match-up."
        aside={
          <Link
            href="/head-to-head"
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[0.68rem] font-bold tracking-[0.12em] text-white uppercase transition-colors hover:border-accent-2 hover:text-accent-2"
          >
            <Icon name="grid" size={13} />
            Back to matrix
          </Link>
        }
      />

      <Suspense fallback={null}>
        <CompareBoard initialA={validA} initialB={validB} />
      </Suspense>
    </PageShell>
  );
}
