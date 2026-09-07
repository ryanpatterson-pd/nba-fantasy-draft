import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { H2HMatrix } from '@/components/teams/H2HMatrix';
import { PairingCard } from '@/components/teams/PairingCard';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MANAGERS, getManager } from '@/lib/data/managers';
import { headToHead, rivalries } from '@/lib/stats/head-to-head';
import { winRate } from '@/lib/stats/tally';
import type { HeadToHead } from '@/lib/types';
import { num, pct, record } from '@/lib/utils/format';

export const metadata: Metadata = {
  title: 'Head to Head',
  description: 'The all-time head-to-head matrix. Every rivalry in the league, settled by the record.',
};

/** Every unique pairing, counted once. */
function uniquePairings(): HeadToHead[] {
  const seen = new Set<string>();
  const out: HeadToHead[] = [];

  for (const a of MANAGERS) {
    for (const b of MANAGERS) {
      if (a.id === b.id) continue;
      const key = [a.id, b.id].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const cell = headToHead(a.id, b.id);
      if (cell && cell.games > 0) out.push(cell);
    }
  }

  return out;
}

export default function HeadToHeadPage() {
  const pairings = uniquePairings();

  const mostLopsided = [...pairings].sort((a, b) => {
    const gapA = Math.abs(a.wins - a.losses) / a.games;
    const gapB = Math.abs(b.wins - b.losses) / b.games;
    return gapB - gapA || b.games - a.games;
  })[0];

  const tightest = [...pairings].sort((a, b) => {
    const gapA = Math.abs(a.wins - a.losses);
    const gapB = Math.abs(b.wins - b.losses);
    return gapA - gapB || b.games - a.games;
  })[0];

  const mostPlayed = [...pairings].sort((a, b) => b.games - a.games)[0];

  const highestScoring = [...pairings].sort(
    (a, b) =>
      (b.pointsFor + b.pointsAgainst) / b.games - (a.pointsFor + a.pointsAgainst) / a.games,
  )[0];

  const totalMeetings = pairings.reduce((sum, cell) => sum + cell.games, 0);

  return (
    <PageShell>
      <PageHeader
        kicker="The ledger"
        title="Head to Head"
        copy={`${pairings.length} pairings across ${num(totalMeetings)} meetings. The complete matrix of who has beaten whom, playoff games included.`}
      />

      {/* Mobile: one card at a time, swipe sideways. sm and up: the full grid. */}
      <section className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <PairingCard
            label="Most lopsided"
            cell={mostLopsided}
            detail={`${pct(winRate(mostLopsided))} across ${mostLopsided.games} meetings`}
            icon="crown"
          />
        </div>
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <PairingCard
            label="Tightest rivalry"
            cell={tightest}
            detail={`Separated by ${Math.abs(tightest.wins - tightest.losses)} game${
              Math.abs(tightest.wins - tightest.losses) === 1 ? '' : 's'
            } in ${tightest.games} meetings`}
            icon="swap"
          />
        </div>
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <PairingCard
            label="Most played"
            cell={mostPlayed}
            detail={`${mostPlayed.games} meetings, more than any other pairing`}
            icon="calendar"
          />
        </div>
        <div className="w-[85%] shrink-0 snap-center sm:w-auto sm:shrink">
          <PairingCard
            label="Highest scoring"
            cell={highestScoring}
            detail={`${num(
              Math.round(
                (highestScoring.pointsFor + highestScoring.pointsAgainst) / highestScoring.games,
              ),
            )} combined points per meeting`}
            icon="flame"
          />
        </div>
      </section>

      <H2HMatrix />

      <SectionHeader
        kicker="Dominance"
        title="Best and worst matchups by manager"
        copy="For each manager, the opponent they beat most often and the one they cannot solve. Minimum four meetings, and only against managers who have played more than one season — the full ledger for everyone is in the matrix above."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MANAGERS.map((manager) => {
          const { bully: best, nemesis: worst } = rivalries(manager.id);
          if (!best || !worst) return null;

          return (
            <Card key={manager.id}>
              <CardHeader
                label={manager.name}
                action={
                  <Link
                    href={`/teams/${manager.id}`}
                    className="inline-flex items-center gap-1 text-[0.66rem] font-bold tracking-[0.12em] text-accent-deep uppercase hover:underline"
                  >
                    Profile
                    <Icon name="arrow-right" size={11} />
                  </Link>
                }
              />
              <div className="grid gap-px bg-line">
                <MatchupRow label="Owns" cell={best} positive />
                <MatchupRow label="Struggles against" cell={worst} positive={false} />
              </div>
            </Card>
          );
        })}
      </section>
    </PageShell>
  );
}

function MatchupRow({
  label,
  cell,
  positive,
}: {
  label: string;
  cell: HeadToHead;
  positive: boolean;
}) {
  const opponent = getManager(cell.opponentId);

  return (
    <div className="flex items-center gap-3 bg-surface px-4 py-3">
      <Avatar manager={opponent} size="sm" ring={false} />
      <div className="min-w-0 flex-1">
        <p className="label-xs">{label}</p>
        <p className="truncate text-sm font-semibold text-ink">{opponent.name}</p>
      </div>
      <div className="text-right">
        <p className="tabular text-sm font-bold text-ink">{record(cell.wins, cell.losses, cell.ties)}</p>
        <p className={`tabular text-[0.68rem] ${positive ? 'text-positive' : 'text-negative'}`}>
          {pct(winRate(cell))}
        </p>
      </div>
    </div>
  );
}
