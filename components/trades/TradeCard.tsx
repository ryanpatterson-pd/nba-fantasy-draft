import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { latestTeamName } from '@/lib/stats/season';
import type { Trade, TradePlayer } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

/**
 * One trade, laid out as a face-off.
 *
 * The two managers' mascots anchor the left and right edges; the middle shows
 * the players moving between them. Each arrow points toward the manager who
 * received those players, so the direction of every piece is unambiguous.
 *
 * ESPN's activity feed sometimes only retains one leg of a deal, so a side may
 * have received nothing on record — that renders as a single directed move
 * rather than an even swap.
 */
export function TradeCard({ trade }: { trade: Trade }) {
  const a = getManager(trade.sideA.managerId);
  const b = getManager(trade.sideB.managerId);

  const date = new Date(trade.date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <article className="overflow-hidden rounded-panel border border-line bg-surface shadow-card">
      {/* Meta strip */}
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex items-center gap-2 text-[11px] font-black tracking-[0.4px] text-ink-dim uppercase">
          <Icon name="swap" size={14} className="text-accent-deep" aria-hidden />
          Trade
        </span>
        <span className="flex items-center gap-2">
          <Link
            href={`/history/${trade.seasonId}`}
            className="tabular text-[11px] font-bold text-ink-mute hover:text-accent-deep"
          >
            {trade.seasonLabel}
          </Link>
          <span className="tabular text-[11px] font-semibold text-ink-mute">{date}</span>
        </span>
      </div>

      {/* Face-off: mascot · players · mascot */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch gap-2 p-3 sm:gap-4 sm:p-4">
        <ManagerColumn managerId={a.id} align="left" />

        <div className="flex flex-col justify-center gap-2 py-1">
          {/* Players heading to A (i.e. from B) */}
          <MoveRow players={trade.sideA.receives} direction="left" />
          <div className="h-px bg-line" aria-hidden />
          {/* Players heading to B (i.e. from A) */}
          <MoveRow players={trade.sideB.receives} direction="right" />
        </div>

        <ManagerColumn managerId={b.id} align="right" />
      </div>
    </article>
  );
}

/** A manager's mascot, name and current team, anchored to one edge. */
function ManagerColumn({ managerId, align }: { managerId: string; align: 'left' | 'right' }) {
  const manager = getManager(managerId);
  const teamName = latestTeamName(manager.id);

  return (
    <Link
      href={`/teams/${manager.id}`}
      className={cn(
        'group flex w-[76px] flex-col items-center gap-1.5 sm:w-[104px]',
        align === 'left' ? 'text-left' : 'text-right',
      )}
    >
      <span
        className="relative aspect-square w-full overflow-hidden rounded-tile ring-1 ring-black/[0.06]"
        style={{
          background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 60%, #000))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-4xl font-black text-white/90 select-none sm:text-5xl"
        >
          {manager.name[0].toUpperCase()}
        </span>
        <Avatar
          manager={manager}
          size="hero"
          ring={false}
          className="!absolute !inset-0 !h-full !w-full !rounded-none"
        />
      </span>
      <span className="w-full text-center">
        <span className="block truncate text-[13px] font-black tracking-[-0.02em] text-ink group-hover:text-accent-deep">
          {manager.name}
        </span>
        {teamName && (
          <span className="block truncate text-[10px] font-semibold text-ink-mute">{teamName}</span>
        )}
      </span>
    </Link>
  );
}

/**
 * A row of players moving in one direction.
 *
 * `direction` is where the players are going: "left" means they went to the
 * left-hand manager, so the arrow points left.
 */
function MoveRow({ players, direction }: { players: TradePlayer[]; direction: 'left' | 'right' }) {
  const arrow = direction === 'left' ? 'arrow-left' : 'arrow-right';
  const empty = players.length === 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        direction === 'left' ? 'flex-row' : 'flex-row-reverse',
      )}
    >
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-full border',
          empty
            ? 'border-line bg-surface-2 text-ink-mute'
            : 'border-accent-border bg-accent-bg text-accent-deep',
        )}
      >
        <Icon name={arrow} size={13} strokeWidth={2.2} aria-hidden />
      </span>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-wrap items-center gap-1.5',
          direction === 'left' ? 'justify-start' : 'justify-end',
        )}
      >
        {empty ? (
          <span className="text-[11px] font-semibold text-ink-mute italic">Nothing on record</span>
        ) : (
          players.map((player) => (
            <span
              key={player.playerId}
              className="rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[12px] font-bold tracking-[-0.01em] text-ink"
            >
              {player.name}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
