import type { Metadata } from 'next';
import { PageHeader, PageShell } from '@/components/layout/PageHeader';
import { TradeCard } from '@/components/trades/TradeCard';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TRADES } from '@/lib/data/trades';
import type { Trade } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Trades',
  description: 'Every trade in league history: who sent what to whom, season by season.',
};

/** Trades grouped by season, newest season first. */
function bySeason(trades: Trade[]): { seasonId: string; label: string; trades: Trade[] }[] {
  const groups = new Map<string, { seasonId: string; label: string; trades: Trade[] }>();
  for (const trade of trades) {
    if (!groups.has(trade.seasonId)) {
      groups.set(trade.seasonId, { seasonId: trade.seasonId, label: trade.seasonLabel, trades: [] });
    }
    groups.get(trade.seasonId)!.trades.push(trade);
  }
  return [...groups.values()].sort((a, b) => b.seasonId.localeCompare(a.seasonId));
}

export default function TradesPage() {
  const seasons = bySeason(TRADES);
  const total = TRADES.length;

  return (
    <PageShell>
      <PageHeader
        kicker="The wheeling and dealing"
        title="Trades"
        copy="Every accepted trade in league history, pulled straight from ESPN. Each deal shows both managers with the players that changed hands between them."
        meta={
          <>
            <Badge tone="accent">{total} trades</Badge>
            <Badge tone="outline">{seasons.length} season{seasons.length === 1 ? '' : 's'}</Badge>
          </>
        }
      />

      {total === 0 ? (
        <EmptyState
          icon="swap"
          title="No trades on record"
          copy="ESPN's activity feed hasn't surfaced any trades yet. Once a deal goes through, it'll show up here."
        />
      ) : (
        seasons.map((season) => (
          <section key={season.seasonId} className="flex flex-col gap-3">
            <SectionHeader
              kicker={`${season.trades.length} trade${season.trades.length === 1 ? '' : 's'}`}
              title={`${season.label} season`}
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {season.trades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          </section>
        ))
      )}
    </PageShell>
  );
}
