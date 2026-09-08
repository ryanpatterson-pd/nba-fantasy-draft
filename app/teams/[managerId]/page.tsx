import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/PageHeader';
import { HeadToHeadList } from '@/components/teams/HeadToHeadList';
import { ManagerSeasonTable } from '@/components/teams/ManagerSeasonTable';
import { ProfileHero, type HeroStat } from '@/components/teams/ProfileHero';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MiniStat } from '@/components/ui/StatCard';
import { MANAGERS, findManager, getManager } from '@/lib/data/managers';
import { allTimeFor } from '@/lib/stats/all-time';
import { rivalries } from '@/lib/stats/head-to-head';
import { championshipRingsFor, latestTeamName } from '@/lib/stats/season';
import { winRate } from '@/lib/stats/tally';
import { num, ordinal, pct, record } from '@/lib/utils/format';

type Params = { managerId: string };

export function generateStaticParams(): Params[] {
  return MANAGERS.map((manager) => ({ managerId: manager.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { managerId } = await params;
  const manager = findManager(managerId);
  if (!manager) return { title: 'Manager not found' };
  const career = allTimeFor(manager.id);
  return {
    title: manager.name,
    description: career
      ? `${manager.name}: ${record(career.wins, career.losses, career.ties)} all time, ${career.titles} championship${career.titles === 1 ? '' : 's'}.`
      : manager.name,
  };
}

export default async function ManagerPage({ params }: { params: Promise<Params> }) {
  const { managerId } = await params;
  const manager = findManager(managerId);
  const career = manager ? allTimeFor(manager.id) : undefined;

  if (!manager || !career) notFound();

  const { bully, nemesis } = rivalries(manager.id);
  const teamName = latestTeamName(manager.id);
  const rings = championshipRingsFor(manager.id);
  const playoffGames =
    career.playoffRecord.wins + career.playoffRecord.losses + career.playoffRecord.ties;

  const index = MANAGERS.findIndex((m) => m.id === manager.id);
  const previous = MANAGERS[(index - 1 + MANAGERS.length) % MANAGERS.length];
  const next = MANAGERS[(index + 1) % MANAGERS.length];

  const heroStats: HeroStat[] = [
    {
      label: 'All-time record',
      value: record(career.wins, career.losses, career.ties),
      unit: `${num(career.gamesPlayed)} games`,
      pill: `${pct(career.winPct)} win rate`,
    },
    {
      label: 'Championships',
      value: String(career.titles),
      unit: `${career.finalsAppearances} grand final${career.finalsAppearances === 1 ? '' : 's'}`,
      pill:
        career.finalsAppearances > 0
          ? `${record(career.finalsRecord.wins, career.finalsRecord.losses, career.finalsRecord.ties)} in finals`
          : undefined,
      rings: rings.map((ring) => ({ label: ring.label, image: ring.image })),
    },
    {
      label: 'Playoff rate',
      value: `${career.playoffAppearances}/${career.seasonsPlayed}`,
      unit: 'seasons',
      pill:
        playoffGames > 0
          ? `${record(career.playoffRecord.wins, career.playoffRecord.losses, career.playoffRecord.ties)} in playoffs`
          : undefined,
    },
    {
      label: 'Best ladder finish',
      value: career.bestLadder ? ordinal(career.bestLadder) : '—',
      unit: `avg ${career.avgLadder.toFixed(1)}`,
      pill: `worst ${ordinal(career.worstLadder)}`,
    },
  ];

  return (
    <PageShell>
      <ProfileHero
        manager={manager}
        kicker={manager.nickname || manager.fullName}
        teamName={teamName ?? undefined}
        summary={`${record(career.wins, career.losses, career.ties)} all time at ${pct(career.winPct)} · ${career.titles} championship${career.titles === 1 ? '' : 's'} · ${career.seasonsPlayed} season${career.seasonsPlayed === 1 ? '' : 's'} played`}
        stats={heroStats}
        nav={{ previous, next }}
      />

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat raised label="Points for" value={num(career.pointsFor)} />
        <MiniStat raised label="Points against" value={num(career.pointsAgainst)} />
        <MiniStat
          raised
          label="Point diff"
          value={`${career.pointDiff >= 0 ? '+' : ''}${num(career.pointDiff)}`}
          // Sub line only from sm up; on mobile it just wastes a line.
          sub={
            <span className="hidden sm:inline">
              {career.pointDiff >= 0 ? 'net positive' : 'net negative'}
            </span>
          }
        />
        <MiniStat raised label="Avg week" value={num(Math.round(career.avgScore))} />
        <MiniStat raised label="Highest week" value={num(career.highestWeek)} />
        <MiniStat raised label="Lowest week" value={num(career.lowestWeek)} />
        <MiniStat raised label="Longest win streak" value={`${career.longestWinStreak}W`} />
        <MiniStat raised label="Longest losing streak" value={`${career.longestLossStreak}L`} />
        <MiniStat raised label="Minor premierships" value={String(career.regularSeasonCrowns)} />
        <MiniStat raised label="Wooden spoons" value={String(career.woodenSpoons)} />
        <MiniStat raised label="Seasons played" value={String(career.seasonsPlayed)} />
        {/* Replaces a "Matchups" tile that just repeated the games count from
            the All-time record card above. */}
        <MiniStat
          raised
          label="Playoff record"
          value={
            playoffGames > 0
              ? record(career.playoffRecord.wins, career.playoffRecord.losses, career.playoffRecord.ties)
              : '—'
          }
          sub={
            <span className="hidden sm:inline">
              {playoffGames > 0
                ? `${playoffGames} playoff ${playoffGames === 1 ? 'game' : 'games'} · ${career.finalsAppearances} grand ${career.finalsAppearances === 1 ? 'final' : 'finals'}`
                : 'No playoff games yet'}
            </span>
          }
        />
      </section>

      <ManagerSeasonTable managerId={manager.id} />

      <section className="grid gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <HeadToHeadList managerId={manager.id} />

        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader label="Rivalries" meta="Minimum 4 meetings" />
            <div className="grid gap-px bg-line">
              <RivalRow
                title="Favourite opponent"
                icon="crown"
                managerId={bully?.opponentId}
                detail={
                  bully
                    ? `${record(bully.wins, bully.losses, bully.ties)} · ${pct(winRate(bully))} across ${bully.games} meetings`
                    : 'Not enough games yet'
                }
              />
              <RivalRow
                title="Nemesis"
                icon="trend-down"
                managerId={nemesis?.opponentId}
                detail={
                  nemesis
                    ? `${record(nemesis.wins, nemesis.losses, nemesis.ties)} · ${pct(winRate(nemesis))} across ${nemesis.games} meetings`
                    : 'Not enough games yet'
                }
              />
            </div>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}

function RivalRow({
  title,
  icon,
  managerId,
  detail,
}: {
  title: string;
  icon: 'crown' | 'trend-down';
  managerId: string | undefined;
  detail: string;
}) {
  const rival = findManager(managerId);

  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3">
      <span className="accent-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Icon name={icon} size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="label-xs">{title}</p>
        <p className="truncate text-sm font-semibold text-ink">
          {rival ? getManager(rival.id).name : '—'}
        </p>
        <p className="truncate text-[0.68rem] text-ink-mute">{detail}</p>
      </div>
      {rival && <Avatar manager={rival} size="sm" />}
    </div>
  );
}
