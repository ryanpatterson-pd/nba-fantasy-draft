import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { bracketFor, championOf, runnerUpOf } from '@/lib/stats/season';
import { num } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Full-width charcoal strip listing every champion, newest first.
 *
 * The roll of honour rather than a headline number. Entries flex to share the
 * strip evenly, so the row fills the width at any season count instead of
 * bunching up on the left.
 *
 * The accent glow is anchored behind the label on the left rather than using the
 * standard `dark-wash` (which brightens the right edge) — that would have lit
 * the oldest season and left the cells reading unevenly across the row.
 */
export function ChampionsBanner({ className }: { className?: string }) {
  const seasons = [...COMPLETED_SEASONS].reverse();

  const champions = seasons
    .map((season) => {
      const champion = championOf(season.id);
      if (!champion) return null;

      const runnerUp = runnerUpOf(season.id);
      const grandFinal = bracketFor(season.id).grandFinal;

      return {
        seasonId: season.id,
        label: season.label,
        manager: getManager(champion.managerId),
        beat: runnerUp ? getManager(runnerUp.managerId).name : undefined,
        score: grandFinal
          ? `${num(Math.max(grandFinal.homeScore, grandFinal.awayScore))}–${num(
              Math.min(grandFinal.homeScore, grandFinal.awayScore),
            )}`
          : undefined,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (champions.length === 0) return null;

  return (
    <div
      className={cn(
        'on-dark relative overflow-hidden rounded-card bg-dark shadow-card',
        'flex flex-col gap-3.5 px-4 py-4 lg:flex-row lg:items-stretch lg:gap-5 lg:px-5',
        className,
      )}
    >
      {/* Accent glow behind the label, and a hairline lit top edge. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-10 h-40 w-72 rounded-full bg-accent/25 blur-3xl"
      />
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      {/* Label block */}
      <div className="relative flex shrink-0 items-center gap-3 lg:border-r lg:border-white/10 lg:pr-5">
        <span className="icon-medallion h-9 w-9 shrink-0">
          <Icon name="trophy" size={17} strokeWidth={2.2} />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] leading-tight font-black tracking-[-0.02em] text-ink">
            Roll of honour
          </span>
          <span className="mt-0.5 block text-[10px] leading-tight font-bold tracking-[0.7px] text-ink-dim uppercase">
            {champions.length} {champions.length === 1 ? 'season' : 'seasons'} · every champion
          </span>
        </span>
      </div>

      {/* Champions. Grid on small screens, then flex so each cell shares the row. */}
      <ul className="relative grid flex-1 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:gap-2.5">
        {champions.map((entry, index) => {
          const reigning = index === 0;

          return (
            <li key={entry.seasonId} className="min-w-0 lg:flex-1">
              <Link
                href={`/history/${entry.seasonId}`}
                title={
                  entry.beat && entry.score
                    ? `${entry.label}: ${entry.manager.name} def. ${entry.beat} ${entry.score}`
                    : `${entry.label}: ${entry.manager.name}`
                }
                className={cn(
                  'group/champ flex h-full items-center gap-2.5 rounded-tile border px-2.5 py-2.5 transition-all',
                  reigning
                    ? 'border-accent/60 bg-accent/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-accent hover:bg-accent/25'
                    : 'border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.08]',
                )}
              >
                {/* Monogram now, the manager's photo once
                    public/mascots/<id>.png exists. */}
                <Avatar
                  manager={entry.manager}
                  size="md"
                  ring={false}
                  className="shrink-0 transition-transform group-hover/champ:scale-105"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="tabular text-[10px] leading-tight font-black tracking-[0.7px] text-accent-deep">
                      {entry.label}
                    </span>
                    {reigning && (
                      <Icon
                        name="crown"
                        size={10}
                        strokeWidth={2.6}
                        className="shrink-0 text-accent-deep"
                        aria-label="Reigning champion"
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-[14px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    {entry.manager.name}
                  </span>
                  {entry.beat && (
                    <span className="mt-0.5 hidden truncate text-[10px] leading-tight font-semibold text-ink-dim xl:block">
                      def. {entry.beat}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
