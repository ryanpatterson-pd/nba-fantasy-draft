import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bracket } from '@/components/history/Bracket';
import { HonourCard } from '@/components/history/HonourCard';
import { SeasonTable } from '@/components/history/SeasonTable';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { matchupsForSeason } from '@/lib/data/league';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS, getSeason } from '@/lib/data/seasons';
import {
  bracketFor,
  championOf,
  minorPremierOf,
  runnerUpOf,
  seasonTable,
  woodenSpoonOf,
} from '@/lib/stats/season';
import { num, ordinal, record } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type Params = { seasonId: string };

export function generateStaticParams(): Params[] {
  return COMPLETED_SEASONS.map((season) => ({ seasonId: season.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { seasonId } = await params;
  const season = getSeason(seasonId);
  if (!season) return { title: 'Season not found' };
  const champion = championOf(season.id);
  const name = champion ? getManager(champion.managerId).name : 'Unknown';
  return {
    title: `${season.label} Season`,
    description: `${season.label} season record. Champion: ${name}.`,
  };
}

export default async function SeasonPage({ params }: { params: Promise<Params> }) {
  const { seasonId } = await params;
  const season = getSeason(seasonId);
  const table = season ? seasonTable(season.id) : [];

  if (!season || table.length === 0) notFound();

  const champion = championOf(season.id);
  const runnerUp = runnerUpOf(season.id);
  const minorPremier = minorPremierOf(season.id);
  const spoon = woodenSpoonOf(season.id);
  const bracket = bracketFor(season.id);

  const champManager = champion ? getManager(champion.managerId) : undefined;
  const grandFinal = bracket.grandFinal;

  // Top five individual weeks of the season, computed from the matchups.
  const weeks = matchupsForSeason(season.id)
    .flatMap((game) => [
      { managerId: game.homeId, score: game.homeScore, week: game.week, stage: game.stage },
      { managerId: game.awayId, score: game.awayScore, week: game.week, stage: game.stage },
    ])
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const seasonIndex = COMPLETED_SEASONS.findIndex((s) => s.id === season.id);
  const previous = COMPLETED_SEASONS[seasonIndex - 1];
  const next = COMPLETED_SEASONS[seasonIndex + 1];

  return (
    <PageShell>
      <PageHeader
        kicker={`Season ${seasonIndex + 1} of ${COMPLETED_SEASONS.length}`}
        title={season.label}
        copy={`${season.regularSeasonWeeks} week regular season, top ${season.playoffTeams} into the playoffs.${
          champManager && grandFinal
            ? ` ${champManager.name} won the grand final ${num(Math.max(grandFinal.homeScore, grandFinal.awayScore))}–${num(Math.min(grandFinal.homeScore, grandFinal.awayScore))}.`
            : ''
        }`}
        aside={
          <div className="flex flex-wrap gap-2">
            {previous && (
              <ButtonLink href={`/history/${previous.id}`} variant="outline" size="sm" icon="chevron-left">
                {previous.label}
              </ButtonLink>
            )}
            {next && (
              <ButtonLink href={`/history/${next.id}`} variant="outline" size="sm" iconRight="chevron-right">
                {next.label}
              </ButtonLink>
            )}
            <ButtonLink href="/history" variant="subtle" size="sm" icon="clock">
              All seasons
            </ButtonLink>
          </div>
        }
      />

      {/* Mobile: one honour card at a time in a horizontal swipe row (each ~85%
          wide so the next peeks). sm and up: the usual grid. */}
      <section
        className={cn(
          'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4',
          '[&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto',
        )}
      >
        <HonourCard
          label="Champion"
          icon="trophy"
          tone="champion"
          managerId={champion?.managerId}
          detail={champion ? `${ordinal(champion.ladderPosition)} on the ladder` : undefined}
          chip={champion ? record(champion.wins, champion.losses, champion.ties) : undefined}
        />
        <HonourCard
          label="Runner-up"
          icon="medal"
          tone="finalist"
          managerId={runnerUp?.managerId}
          detail={runnerUp ? `${ordinal(runnerUp.ladderPosition)} on the ladder` : undefined}
          chip={runnerUp ? record(runnerUp.wins, runnerUp.losses, runnerUp.ties) : undefined}
        />
        <HonourCard
          label="Minor premier"
          icon="shield"
          tone="honour"
          managerId={minorPremier?.managerId}
          detail="Top of the home and away ladder"
          chip={
            minorPremier
              ? record(minorPremier.wins, minorPremier.losses, minorPremier.ties)
              : undefined
          }
        />
        <HonourCard
          label="Wooden spoon"
          icon="spoon"
          tone="spoon"
          managerId={spoon?.managerId}
          detail={`Last of ${table.length} on the ladder`}
          chip={spoon ? record(spoon.wins, spoon.losses, spoon.ties) : undefined}
        />
      </section>

      <Bracket bracket={bracket} playoffTeams={season.playoffTeams} />

      <SeasonTable rows={table} label={`${season.label} final table`} />

      <section>
        <Card>
          <CardHeader label="Biggest weeks" meta={`Top ${weeks.length} scores`} />
          <ul className="divide-y divide-line">
            {weeks.map((entry, index) => {
              const manager = getManager(entry.managerId);
              return (
                <li key={`${entry.managerId}-${entry.week}-${index}`} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={
                      index === 0
                        ? 'tabular inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-transparent bg-gradient-to-b from-accent to-accent-deep text-[11px] font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                        : 'tabular inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-[11px] font-bold text-ink-mute'
                    }
                  >
                    {index + 1}
                  </span>
                  <Avatar manager={manager} size="xs" ring={false} />
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/teams/${manager.id}`}
                      className="block truncate text-sm font-semibold text-ink hover:text-accent-deep"
                    >
                      {manager.name}
                    </Link>
                    <span className="block truncate text-[0.68rem] text-ink-mute">
                      {entry.stage === 'regular' ? `Week ${entry.week}` : 'Playoffs'}
                    </span>
                  </span>
                  <span className="tabular text-sm font-black text-accent-deep">
                    {num(entry.score)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>
    </PageShell>
  );
}
