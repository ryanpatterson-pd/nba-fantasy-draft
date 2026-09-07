'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MascotImage } from '@/components/ui/MascotImage';
import { Icon } from '@/components/ui/Icon';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { bracketFor, championOf, championshipRingsFor, runnerUpOf } from '@/lib/stats/season';
import { num } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

type ChampionCard = {
  seasonId: string;
  label: string;
  managerId: string;
  managerName: string;
  colour: string;
  defeated?: string;
  score?: string;
  ring?: string;
  reigning: boolean;
};

/**
 * The honour roll: one champion per completed season, newest first.
 *
 * A full-width row of cinematic cards — the winner's photo across the top, the
 * reigning champion flagged, and a footer with the year, their ring, name and
 * who they beat. The whole card links to that season; the ring opens full size.
 */
export function HonourRoll() {
  const seasons = [...COMPLETED_SEASONS].reverse();

  const cards: ChampionCard[] = seasons
    .map((season, index): ChampionCard | null => {
      const champion = championOf(season.id);
      if (!champion) return null;

      const runnerUp = runnerUpOf(season.id);
      const grandFinal = bracketFor(season.id).grandFinal;
      const manager = getManager(champion.managerId);
      const ring = championshipRingsFor(champion.managerId).find(
        (r) => r.seasonId === season.id,
      )?.image;

      return {
        seasonId: season.id,
        label: season.label,
        managerId: manager.id,
        managerName: manager.name,
        colour: manager.colours.primary,
        defeated: runnerUp ? getManager(runnerUp.managerId).name : undefined,
        score: grandFinal
          ? `${num(Math.max(grandFinal.homeScore, grandFinal.awayScore))}–${num(
              Math.min(grandFinal.homeScore, grandFinal.awayScore),
            )}`
          : undefined,
        ring,
        // The first completed season in the reversed list is the most recent.
        reigning: index === 0,
      };
    })
    .filter((card): card is ChampionCard => card !== null);

  if (cards.length === 0) return null;

  return (
    <section
      className="on-dark overflow-hidden rounded-panel border border-white/10 shadow-raised"
      style={{ background: 'radial-gradient(120% 90% at 15% 0%, #24262e 0%, #16171d 48%, #0c0d11 100%)' }}
    >
      {/* Header band */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-gradient-to-b from-gold/15 to-transparent shadow-[inset_0_1px_0_rgba(212,175,55,0.3)]">
            <Icon name="trophy" size={19} strokeWidth={2} className="text-gold-2" aria-hidden />
          </span>
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.03em] text-white">Honour Roll</h2>
            <p className="mt-0.5 text-[10px] font-black tracking-[1.3px] text-gold-2 uppercase">
              {cards.length} {cards.length === 1 ? 'season' : 'seasons'} · every champion
            </p>
          </div>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black tracking-[1px] text-accent-2 uppercase transition-colors hover:border-accent/40 hover:bg-accent/10"
        >
          All seasons
          <Icon name="arrow-right" size={12} aria-hidden />
        </Link>
      </div>

      {/* Gold rule under the header. */}
      <span
        aria-hidden
        className="mx-5 block h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent"
      />

      {/* Champion cards.
          Mobile: a horizontal swipe carousel that snaps card to card, with the
          next one peeking so it reads as swipeable.
          sm and up: the full grid, since the whole row fits. */}
      <div
        className={cn(
          'flex snap-x snap-mandatory gap-3.5 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'sm:grid sm:snap-none sm:overflow-visible sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        )}
      >
        {cards.map((card) => (
          <div
            key={card.seasonId}
            className="w-[80%] shrink-0 snap-center sm:w-auto sm:shrink"
          >
            <ChampionTile card={card} />
          </div>
        ))}
      </div>

      {/* Swipe hint dots, mobile only. */}
      <div className="flex items-center justify-center gap-1.5 pb-3 sm:hidden">
        {cards.map((card) => (
          <span
            key={card.seasonId}
            aria-hidden
            className={cn(
              'h-1.5 rounded-full transition-all',
              card.reigning ? 'w-4 bg-accent' : 'w-1.5 bg-white/25',
            )}
          />
        ))}
      </div>
    </section>
  );
}

function ChampionTile({ card }: { card: ChampionCard }) {
  return (
    <Link
      href={`/history/${card.seasonId}`}
      className={cn(
        'group relative flex h-full w-full flex-col overflow-hidden rounded-card border transition-all duration-300 hover:-translate-y-0.5',
        card.reigning
          ? 'border-accent/60 shadow-[0_16px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(239,101,17,0.25)]'
          : 'border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:border-white/20',
      )}
      style={{ background: 'linear-gradient(180deg, #22242b 0%, #16171d 62%, #101116 100%)' }}
    >
      {/* Photo */}
      <div
        className="relative aspect-[3/4] overflow-hidden"
        style={{
          background: `linear-gradient(150deg, color-mix(in oklab, ${card.colour} 60%, #16171d), #101116)`,
        }}
      >
        {/* Reigning-champion banner overlays the top of the photo, so every
            card's photo starts at the same line and the row stays aligned. */}
        {card.reigning && (
          <div className="absolute inset-x-0 top-0 z-[3] flex items-center justify-center gap-1.5 bg-gradient-to-r from-accent-deep via-accent to-accent-deep py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
            <Icon name="crown" size={11} strokeWidth={2.4} className="text-white" aria-hidden />
            <span className="text-[9px] font-black tracking-[1.4px] text-white uppercase">
              Reigning Champion
            </span>
          </div>
        )}
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-[92px] font-black text-white/10 select-none"
        >
          {card.managerName[0].toUpperCase()}
        </span>

        <MascotImage
          managerId={card.managerId}
          alt={card.managerName}
          sizes="320px"
          imgClassName="object-top transition-transform duration-500 group-hover:scale-[1.05]"
        />

        {/* Smokey charcoal wash: darkens the edges and melts the photo into the
            footer rather than a hard photo/footer seam. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#101116] via-black/15 to-black/35"
        />
        <div
          aria-hidden
          className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]"
        />
      </div>

      {/* Footer, seamless with the photo's smoke. */}
      <div className="relative -mt-px flex flex-col items-center gap-2 px-3.5 pt-2 pb-3.5">
        {/* Gold hairline that fades at both ends. */}
        <span
          aria-hidden
          className="h-px w-full max-w-[80%] bg-gradient-to-r from-transparent via-gold/45 to-transparent"
        />

        <p className="tabular text-[19px] leading-none font-black tracking-[-0.01em] text-gold-2">
          {card.label}
        </p>

        <div className="flex w-full items-center gap-2.5">
          {card.ring ? (
            <RingMark image={card.ring} label={card.label} />
          ) : (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-[#2a1707]">
              <Icon name="ring" size={14} strokeWidth={2} aria-hidden />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[18px] leading-tight font-black tracking-[-0.03em] text-white">
              {card.managerName}
            </span>
            {card.defeated && (
              <span className="block truncate text-[11px] font-semibold text-white/45">
                defeated {card.defeated}
                {card.score ? ` · ${card.score}` : ''}
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** The small ring beside the champion's name; clicks open the full image. */
function RingMark({ image, label }: { image: string; label: string }) {
  const [failed, setFailed] = useState(false);
  const viewer = usePhotoViewer();

  if (failed) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-[#2a1707]">
        <Icon name="ring" size={13} strokeWidth={2} aria-hidden />
      </span>
    );
  }

  return (
    <button
      type="button"
      title={`${label} championship ring`}
      aria-label={`View ${label} championship ring`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        viewer?.open({ src: image, name: `${label} championship ring` });
      }}
      className="relative h-8 w-7 shrink-0 cursor-zoom-in overflow-visible"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local asset with a gold-disc fallback */}
      <img
        src={image}
        alt={`${label} championship ring`}
        onError={() => setFailed(true)}
        className="absolute top-1/2 left-1/2 h-[46px] w-[46px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_2px_7px_rgba(0,0,0,0.6)] transition-transform hover:scale-110"
      />
    </button>
  );
}
