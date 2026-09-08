'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MascotImage } from '@/components/ui/MascotImage';
import { MascotZoomButton } from '@/components/ui/MascotZoomButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS } from '@/lib/data/seasons';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { championshipRingsFor, latestTeamName, recordFor } from '@/lib/stats/season';
import type { AllTimeRecord } from '@/lib/types';
import { ordinal, pct, record } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Roster tile, styled like the coach hero: a cinematic photo across the top
 * with the name and team overlaid, a gold championship shield when they have
 * silverware, then a dark stat strip and a season-finish row beneath.
 *
 * The whole card links to the full profile. The photo fades in over a coloured
 * monogram, so the tile looks right before any /mascots/<id>.png is added.
 */
export function ManagerCard({ row }: { row: AllTimeRecord }) {
  const manager = getManager(row.managerId);
  const teamName = latestTeamName(manager.id);
  const rings = championshipRingsFor(manager.id);

  const finishes = COMPLETED_SEASONS.map((season) => ({
    season,
    finish: recordFor(season.id, row.managerId)?.ladderPosition ?? null,
    won: recordFor(season.id, row.managerId)?.result === 'champion',
    spooned: (() => {
      const rec = recordFor(season.id, row.managerId);
      return rec ? rec.ladderPosition === rec.fieldSize : false;
    })(),
  }));

  return (
    <Link
      href={`/teams/${manager.id}`}
      className="group flex flex-col overflow-hidden rounded-panel border border-line bg-dark shadow-card transition-shadow hover:shadow-raised"
    >
      {/* ------------------------------------------------------ photo hero */}
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={{
          background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 55%, #000))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-[120px] font-black text-white/12 select-none"
        >
          {manager.name[0].toUpperCase()}
        </span>

        <MascotImage
          managerId={manager.id}
          alt={manager.name}
          sizes="400px"
          imgClassName="object-top transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25"
        />

        {/* Tap the photo to open it full size (over the card's profile link). */}
        <MascotZoomButton managerId={manager.id} caption={teamName ?? undefined} />

        {/* Championship rings, top-right. Clickable to view full size. */}
        {rings.length > 0 && (
          <div className="absolute top-2.5 right-2.5 z-[4] flex items-center gap-1">
            {rings.map((ring) => (
              <RingBadge key={ring.image} label={ring.label} image={ring.image} />
            ))}
          </div>
        )}

        {/* Name + team, bottom-left. */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-[30px] leading-[0.9] font-black tracking-[-0.04em] text-white">
            {manager.name}
          </h3>
          {teamName && (
            <p className="mt-1 text-[13px] font-black tracking-[-0.01em] text-accent-2">
              {teamName}
            </p>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------ stat strip */}
      <div className="on-dark flex flex-col gap-3 bg-dark p-3.5">
        <div className="grid grid-cols-3 gap-2">
          <StatTile icon="chart" label="Record" value={record(row.wins, row.losses, row.ties)} />
          <StatTile icon="target" label="Win rate" value={pct(row.winPct)} accent />
          <StatTile
            icon="medal"
            label="Best"
            value={row.bestLadder ? ordinal(row.bestLadder) : '—'}
          />
        </div>

        {/* ---------------------------------------------------- finishes */}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Icon name="trophy" size={12} className="text-accent-2" aria-hidden />
            <span className="text-[10px] font-black tracking-[1px] text-white/55 uppercase">
              Finishes
            </span>
          </div>
          <div className="flex items-stretch gap-1">
            {finishes.map(({ season, finish, won, spooned }) => (
              <span
                key={season.id}
                title={`${season.label}: ${finish ? ordinal(finish) : 'did not play'}${won ? ' · champion' : spooned ? ' · wooden spoon' : ''}`}
                className={cn(
                  'tabular grid flex-1 place-items-center rounded-tile border py-1.5 text-[13px] font-black',
                  won
                    ? 'border-accent/50 bg-gradient-to-b from-accent to-accent-deep text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                    : finish === null
                      ? 'border-white/10 bg-white/[0.03] text-white/30'
                      : 'border-white/10 bg-white/[0.05] text-white/75',
                )}
              >
                {won ? (
                  <Icon name="crown" size={13} strokeWidth={2.4} aria-label="Champion" />
                ) : (
                  (finish ?? '–')
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * A championship ring, top-right of the card.
 *
 * The image is scaled beyond its layout box so it reads large without changing
 * the card. Clicking opens the full ring in the lightbox; because the card is a
 * link, the click is stopped before it reaches it. Falls back to a gold disc
 * when the artwork for that year is not yet in public/rings.
 */
function RingBadge({ label, image }: { label: string; image: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const viewer = usePhotoViewer();

  const openViewer = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    viewer?.open({ src: image, name: `${label} championship ring` });
  };

  if (failed) {
    return (
      <button
        type="button"
        onClick={openViewer}
        title={`${label} championship`}
        aria-label={`View ${label} championship ring`}
        className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-[#2a1707] shadow-[0_2px_8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]"
      >
        <Icon name="ring" size={15} strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openViewer}
      title={`${label} championship`}
      aria-label={`View ${label} championship ring`}
      className="relative h-9 w-8 shrink-0 cursor-zoom-in overflow-visible"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local asset with a gold-disc fallback */}
      <img
        src={image}
        alt={`${label} championship ring`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'absolute top-1/2 left-1/2 h-[58px] w-[58px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)] transition-[opacity,transform] duration-200 hover:scale-110',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 rounded-tile border border-white/10 bg-white/[0.04] px-2 py-2">
      <span
        className={cn(
          'grid h-6 w-6 shrink-0 place-items-center rounded-md border',
          accent
            ? 'border-accent/40 bg-accent/15 text-accent-2'
            : 'border-white/10 bg-white/[0.06] text-white/60',
        )}
      >
        <Icon name={icon} size={13} strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-[9px] font-black tracking-[0.6px] text-white/45 uppercase">
          {label}
        </span>
        {/* No truncation: a drawn record like 66–35–1 must show in full. */}
        <span
          className={cn(
            'tabular block text-[14px] leading-tight font-black tracking-[-0.03em] whitespace-nowrap',
            accent ? 'text-accent-2' : 'text-white',
          )}
        >
          {value}
        </span>
      </span>
    </div>
  );
}
