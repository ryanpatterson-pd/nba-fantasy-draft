import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MascotImage } from '@/components/ui/MascotImage';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { bracketFor, championOf, minorPremierOf, runnerUpOf, woodenSpoonOf } from '@/lib/stats/season';
import { num, ordinal, record } from '@/lib/utils/format';
import type { Manager } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

/**
 * The history spine: one panel per completed season, newest first.
 *
 * Each season reads as a small gallery — a season marker, then four honour
 * cards led by the champion. The mascot photos are square, so they sit in
 * square frames as the hero of every card. The champion card is deliberately
 * elevated (gold frame, crown medallion, winner's colour glow) so the eye lands
 * on the winner first; the runner-up, minor premier and wooden spoon follow as
 * quieter, equal cards. The wooden spoon is muted to read as the bottom of the
 * table. The whole panel opens onto the full season record.
 */
export function SeasonTimeline() {
  const seasons = [...COMPLETED_SEASONS].reverse();

  return (
    <ol className="flex flex-col gap-3">
      {seasons.map((season, index) => {
        const champion = championOf(season.id);
        const runnerUp = runnerUpOf(season.id);
        const minorPremier = minorPremierOf(season.id);
        const spoon = woodenSpoonOf(season.id);
        const grandFinal = bracketFor(season.id).grandFinal;
        if (!champion || !runnerUp || !grandFinal) return null;

        const champManager = getManager(champion.managerId);
        const champScore = Math.max(grandFinal.homeScore, grandFinal.awayScore);
        const runnerScore = Math.min(grandFinal.homeScore, grandFinal.awayScore);
        const margin = champScore - runnerScore;

        return (
          <li key={season.id}>
            <Card accentEdge={index === 0} className="group">
              <Link href={`/history/${season.id}`} className="block p-4 sm:p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
                  {/* Season marker */}
                  <div className="flex items-center justify-between gap-4 xl:w-36 xl:shrink-0 xl:flex-col xl:items-start xl:justify-center">
                    <span className="tabular text-4xl leading-none font-black tracking-[-0.03em] text-ink">
                      {season.label}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {index === 0 && <Badge tone="accent">Most recent</Badge>}
                      <span className="label-xs">Season {COMPLETED_SEASONS.length - index}</span>
                    </div>
                    <Icon
                      name="chevron-right"
                      size={18}
                      className="hidden shrink-0 text-ink-mute transition-transform group-hover:translate-x-1 group-hover:text-accent-deep xl:block"
                      aria-hidden
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Honour gallery: champion leads, then the three others.
                        Mobile: one horizontal swipe row (each card ~62% wide so
                        the next peeks). lg and up: an equal-height 4-up grid.
                        The grand final score runs as a slim bar beneath. */}
                    <div
                      className={cn(
                        'flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                        'lg:grid lg:snap-none lg:grid-cols-4 lg:items-stretch lg:overflow-visible',
                        '[&>*]:w-[62%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[42%] lg:[&>*]:w-auto',
                      )}
                    >
                      <ChampionCard
                        manager={champManager}
                        detail={`${record(champion.wins, champion.losses, champion.ties)} home and away · ${ordinal(champion.ladderPosition)} on the ladder`}
                      />
                      <HonourCard
                        manager={getManager(runnerUp.managerId)}
                        label="Runner-up"
                        icon="medal"
                        detail={`${ordinal(runnerUp.ladderPosition)} on ladder`}
                      />
                      <HonourCard
                        manager={minorPremier ? getManager(minorPremier.managerId) : undefined}
                        label="Minor premier"
                        icon="shield"
                        detail={
                          minorPremier
                            ? record(minorPremier.wins, minorPremier.losses, minorPremier.ties)
                            : undefined
                        }
                      />
                      <HonourCard
                        manager={spoon ? getManager(spoon.managerId) : undefined}
                        label="Wooden spoon"
                        icon="spoon"
                        detail={spoon ? record(spoon.wins, spoon.losses, spoon.ties) : undefined}
                        muted
                      />
                    </div>

                    {/* Grand final result, as a slim gold bar spanning the row.
                        flex-wrap + min-w-0 let it wrap and shrink on narrow
                        phones instead of forcing the card wider than the screen. */}
                    <div className="mt-3 flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-tile border border-gold-border bg-gold-bg px-3 py-2">
                      <Icon name="trophy" size={13} className="shrink-0 text-gold-deep" aria-hidden />
                      <span className="text-[9px] font-black tracking-[0.9px] text-gold-deep/70 uppercase">
                        Grand final
                      </span>
                      <span className="tabular text-[15px] font-black tracking-[-0.01em] text-gold-deep">
                        {num(champScore)}–{num(runnerScore)}
                      </span>
                      <span className="min-w-0 truncate text-[11px] font-bold text-gold-deep/70">
                        {champManager.name} by {num(margin)}
                      </span>
                    </div>
                  </div>
                </div>

                {season.headline && (
                  <p className="mt-4 border-t border-line pt-3 text-sm text-ink-mute">
                    {season.headline}
                  </p>
                )}
              </Link>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}

/* --------------------------------------------------------------- champion */

/**
 * The champion card — the hero of the season.
 *
 * A gold-framed tile with the winner's colour glow, a square mascot photo under
 * a soft scrim, a gold crown medallion, and the grand-final score called out in
 * a gold pill. Sized to stand above the other three honour cards.
 */
function ChampionCard({ manager, detail }: { manager: Manager; detail: string }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-card border border-gold-border bg-gold-bg shadow-[0_14px_34px_rgba(212,175,55,0.18)]"
      style={{
        // A whisper of the champion's colour bleeding up from the base.
        backgroundImage: `linear-gradient(180deg, transparent 62%, color-mix(in oklab, ${manager.colours.primary} 12%, transparent) 100%)`,
      }}
    >
      {/* Gold top edge marks it as the winner. */}
      <span aria-hidden className="gold-edge absolute inset-x-0 top-0 z-[3] h-[3px]" />

      <SquareMascot manager={manager} tone="champion" />

      <div className="flex flex-1 flex-col p-3.5">
        <p className="ceremony-label flex items-center gap-1.5">
          <span className="gold-medallion h-5 w-5">
            <Icon name="trophy" size={12} strokeWidth={2.2} aria-hidden />
          </span>
          Champion
        </p>
        <h3 className="mt-1.5 truncate text-[26px] leading-[0.95] font-black tracking-[-0.03em] text-ink">
          {manager.name}
        </h3>
        <p className="mt-1.5 text-[12px] leading-snug text-ink-dim">{detail}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- placegetters */

/**
 * A supporting honour card: runner-up, minor premier or wooden spoon.
 *
 * Same square-mascot treatment as the champion but quieter — a plain surface,
 * a tinted icon chip, name and stat. `muted` desaturates the photo for the
 * wooden spoon so it reads as the bottom of the table. Falls back to a neutral
 * tile when a season has no recorded holder.
 */
function HonourCard({
  manager,
  label,
  icon,
  detail,
  muted = false,
}: {
  manager: Manager | undefined;
  label: string;
  icon: IconName;
  detail?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {manager ? (
        <SquareMascot manager={manager} tone={muted ? 'muted' : 'default'} />
      ) : (
        <span className="grid aspect-square w-full place-items-center bg-surface-3 text-5xl font-black text-ink-mute">
          —
        </span>
      )}

      <div className="flex flex-col p-3">
        <p className="flex items-center gap-1.5 text-[9px] font-black tracking-[0.6px] text-ink-mute uppercase">
          <span
            className={cn(
              'grid h-4 w-4 place-items-center rounded-[5px]',
              muted ? 'bg-surface-3 text-ink-mute' : 'bg-accent-bg text-accent-deep',
            )}
          >
            <Icon name={icon} size={10} strokeWidth={2} aria-hidden />
          </span>
          {label}
        </p>
        <p className="mt-1 truncate text-[19px] leading-tight font-black tracking-[-0.02em] text-ink">
          {manager ? manager.name : '—'}
        </p>
        {detail && <p className="tabular mt-0.5 truncate text-[11px] text-ink-mute">{detail}</p>}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- mascot */

/**
 * A square mascot photo, the shared hero of every honour card.
 *
 * The image is square so it fills a square frame cleanly. A colour wash and
 * monogram sit behind it as the fallback, and a bottom-up scrim keeps the frame
 * grounded against the details below. `champion` gets a warmer, brighter wash;
 * `muted` desaturates for the wooden spoon.
 */
function SquareMascot({
  manager,
  tone = 'default',
}: {
  manager: Manager;
  tone?: 'champion' | 'default' | 'muted';
}) {
  return (
    <span
      className="relative block aspect-square w-full overflow-hidden"
      style={{
        background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} ${tone === 'champion' ? 52 : 46}%, #000))`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-[88px] leading-none font-black text-white/15 select-none"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt={manager.name}
        sizes="(max-width: 1024px) 50vw, 260px"
        imgClassName={cn('object-top', tone === 'muted' && 'opacity-90 grayscale-[0.55]')}
      />

      {/* Grounding scrim at the base of the frame. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent"
      />

      {/* Champion sheen: a soft gold vignette in the top corners. */}
      {tone === 'champion' && (
        <span
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(244,221,138,0.28),transparent_55%)]"
        />
      )}
    </span>
  );
}
