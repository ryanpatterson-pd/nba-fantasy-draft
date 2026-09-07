import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS, LEAGUE_NAME, getSeason } from '@/lib/data/seasons';
import { championOf, runnerUpOf, seasonTable } from '@/lib/stats/season';
import { reviewFor } from '@/lib/stats/review';
import { num, record } from '@/lib/utils/format';

type Params = { seasonId: string };

export function generateStaticParams(): Params[] {
  return COMPLETED_SEASONS.map((season) => ({ seasonId: season.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { seasonId } = await params;
  const review = reviewFor(seasonId);
  if (!review) return { title: 'Season review not found' };
  return {
    title: `${review.label} Season Review`,
    description: review.standfirst,
  };
}

export default async function SeasonReviewPage({ params }: { params: Promise<Params> }) {
  const { seasonId } = await params;
  const season = getSeason(seasonId);
  const review = reviewFor(seasonId);

  if (!season || !review) notFound();

  const champion = championOf(seasonId);
  const runnerUp = runnerUpOf(seasonId);
  const table = seasonTable(seasonId);

  const index = COMPLETED_SEASONS.findIndex((s) => s.id === seasonId);
  const previous = COMPLETED_SEASONS[index - 1];
  const next = COMPLETED_SEASONS[index + 1];

  return (
    <PageShell>
      {/* Controls sit outside the paper so the paper itself stays clean. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ButtonLink href={`/history/${seasonId}`} variant="outline" size="sm" icon="chevron-left">
          {season.label} season
        </ButtonLink>
        <div className="flex flex-wrap gap-2">
          {previous && (
            <ButtonLink
              href={`/history/${previous.id}/review`}
              variant="subtle"
              size="sm"
              icon="chevron-left"
            >
              {previous.label} review
            </ButtonLink>
          )}
          {next && (
            <ButtonLink
              href={`/history/${next.id}/review`}
              variant="subtle"
              size="sm"
              iconRight="chevron-right"
            >
              {next.label} review
            </ButtonLink>
          )}
        </div>
      </div>

      <article className="newsprint overflow-hidden rounded-card border border-news-rule shadow-card">
        <div className="mx-auto max-w-[1000px] px-5 py-7 sm:px-8 sm:py-9">
          {/* ------------------------------------------------ nameplate */}
          <header>
            <div className="flex items-end justify-between gap-3 border-b border-news-rule pb-1.5">
              <span className="news-label">Vol. {index + 1} · No. 1</span>
              <span className="news-label hidden sm:inline">{LEAGUE_NAME || 'The League'}</span>
              <span className="news-label">Price: one wooden spoon</span>
            </div>

            <h1 className="news-masthead mt-3 text-center">The Season Review</h1>

            <div className="news-rule-double mt-3" />
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
              <span className="news-label">{review.dateline}</span>
              <span aria-hidden className="news-label">
                ·
              </span>
              <span className="news-label">{review.byline}</span>
            </div>
          </header>

          {/* ------------------------------------------------ lead story */}
          <div className="mt-7 border-b-2 border-news-ink pb-6">
            <h2 className="news-headline text-center">{review.headline}</h2>
            <p className="news-body mx-auto mt-3 max-w-[62ch] text-center text-[16.5px] italic">
              {review.standfirst}
            </p>

            {champion && (
              <div className="mt-5 flex items-center justify-center gap-4 border-y border-news-rule py-3.5">
                <span className="rounded-[10px] border border-news-rule bg-news-paper-2 p-[3px]">
                  <Avatar
                    manager={getManager(champion.managerId)}
                    size="lg"
                    ring={false}
                    zoomable
                    caption="Champion"
                  />
                </span>
                <span className="min-w-0">
                  <span className="news-label block">Champion</span>
                  <span className="news-subhead mt-0.5 block text-[22px]">
                    {getManager(champion.managerId).name}
                  </span>
                  <span className="news-body block text-[13px] text-news-ink-dim">
                    {record(champion.wins, champion.losses, champion.ties)} home and away
                    {runnerUp ? ` · def. ${getManager(runnerUp.managerId).name} in the final` : ''}
                  </span>
                </span>
              </div>
            )}

            <div className="news-body news-columns news-dropcap mt-5 text-justify sm:columns-2">
              {review.lede.map((paragraph, i) => (
                <p key={i} className={i === 0 ? 'mt-0' : 'mt-3'}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ body + rail */}
          <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="flex flex-col gap-6">
              {review.sections.map((section, sectionIndex) => (
                <section key={section.id}>
                  <div className="flex items-baseline gap-2.5 border-b border-news-ink pb-1.5">
                    <span className="news-label shrink-0">
                      {String(sectionIndex + 1).padStart(2, '0')}
                    </span>
                    <h3 className="news-subhead min-w-0 flex-1">{section.heading}</h3>
                    {section.kicker && (
                      <span className="news-label hidden shrink-0 sm:inline">{section.kicker}</span>
                    )}
                  </div>

                  <div className="news-body news-columns mt-3 text-justify sm:columns-2">
                    {section.paragraphs.map((paragraph, i) => (
                      <p key={i} className={i === 0 ? 'mt-0' : 'mt-3'}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Pull quote breaks up the middle of the paper. */}
                  {sectionIndex === 1 && (
                    <blockquote className="my-5 border-y-2 border-news-ink px-2 py-4 text-center">
                      <p className="news-body text-[19px] leading-snug font-bold italic">
                        “{review.pullQuote}”
                      </p>
                    </blockquote>
                  )}
                </section>
              ))}

              <p className="news-body border-t border-news-rule pt-4 text-[15px] font-bold italic">
                {review.signOff}
              </p>
            </div>

            {/* ------------------------------------------------ factbox */}
            <aside className="flex flex-col gap-5">
              <div className="border-2 border-news-ink p-3.5">
                <p className="news-label border-b border-news-rule pb-1.5 text-center">
                  {review.label} at a glance
                </p>
                <dl className="mt-2 flex flex-col divide-y divide-news-rule">
                  {review.factbox.map((entry) => (
                    <div key={entry.label} className="py-2 first:pt-0 last:pb-0">
                      <dt className="news-label">{entry.label}</dt>
                      <dd className="news-body mt-0.5 text-[15px] leading-tight font-bold">
                        {entry.value}
                      </dd>
                      {entry.note && (
                        <dd className="news-body mt-0.5 text-[12px] leading-snug text-news-ink-dim">
                          {entry.note}
                        </dd>
                      )}
                    </div>
                  ))}
                </dl>
              </div>

              {/* Final ladder, set as an agate table. */}
              <div className="border border-news-rule p-3.5">
                <p className="news-label border-b border-news-rule pb-1.5 text-center">
                  Final ladder
                </p>
                <ol className="mt-2 flex flex-col">
                  {table.map((row) => (
                    <li
                      key={row.managerId}
                      className="news-body flex items-baseline gap-2 border-b border-news-rule/60 py-1 text-[13px] last:border-0"
                    >
                      <span className="tabular w-4 shrink-0 text-right font-bold">
                        {row.ladderPosition}
                      </span>
                      <Link
                        href={`/teams/${row.managerId}`}
                        className="min-w-0 flex-1 truncate hover:underline"
                      >
                        {getManager(row.managerId).name}
                      </Link>
                      <span className="tabular shrink-0 font-bold">
                        {record(row.wins, row.losses, row.ties)}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="news-body mt-2 text-[11px] leading-snug text-news-ink-dim">
                  Home and away only. Placement games are not counted by this league.
                </p>
              </div>

              <p className="news-body text-[11px] leading-snug text-news-ink-dim">
                Every figure in this report is calculated from the league&apos;s full matchup record.
                Every opinion is the desk&apos;s own and is worth exactly what you paid for it.
              </p>
            </aside>
          </div>

          {/* ------------------------------------------------ footer */}
          <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t-2 border-news-ink pt-3">
            <span className="news-label">
              {review.label} · {num(table.length)} managers
            </span>
            <Link
              href={`/history/${seasonId}`}
              className="news-label inline-flex items-center gap-1 hover:underline"
            >
              Full season record
              <Icon name="arrow-right" size={11} aria-hidden />
            </Link>
          </footer>
        </div>
      </article>
    </PageShell>
  );
}
