'use client';

import { useState } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { MascotImage, mascotSrc } from '@/components/ui/MascotImage';
import { Icon } from '@/components/ui/Icon';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import type { Manager } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

export type HeroRing = {
  /** e.g. "2022/23", shown on hover. */
  label: string;
  /** public/ image path, e.g. "/rings/2023-ring.png". */
  image: string;
};

export type HeroStat = {
  label: string;
  value: string;
  /** Small grey word beside the figure, e.g. "108 games". */
  unit?: string;
  /** Pill under the figure, e.g. "70.4% win rate". */
  pill?: string;
  /** Championship rings, drawn to the right of the figure as images. */
  rings?: HeroRing[];
};

/**
 * Coach page hero.
 *
 * A cinematic split: a large photo panel on the left with the name laid over
 * the bottom, and a dark stat rail on the right. The photo is the feature — it
 * fills the panel edge to edge (not a rounded avatar tile) and is the click
 * target for the full-size lightbox.
 *
 * When no /mascots/<id>.png exists yet, the panel falls back to a big monogram
 * on the manager's colour, so the layout holds up before photos are added.
 */
export function ProfileHero({
  manager,
  kicker,
  teamName,
  summary,
  stats,
  nav,
}: {
  manager: Manager;
  kicker: string;
  teamName?: string;
  summary: string;
  stats: HeroStat[];
  nav: { previous: { id: string; name: string }; next: { id: string; name: string } };
}) {
  const [loaded, setLoaded] = useState(false);
  const viewer = usePhotoViewer();
  const canZoom = loaded && viewer !== null;

  return (
    <header className="overflow-hidden rounded-panel border border-line bg-dark shadow-raised">
      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* ---------------------------------------------------- photo panel */}
        <div
          className="relative min-h-[340px] overflow-hidden sm:min-h-[420px] lg:min-h-[500px]"
          style={{
            background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 55%, #000))`,
          }}
        >
          {/* Monogram behind the photo, so the panel is never empty. */}
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center text-[168px] font-black text-white/12 select-none"
          >
            {manager.name[0].toUpperCase()}
          </span>

          <MascotImage
            managerId={manager.id}
            alt={manager.name}
            sizes="(max-width: 1024px) 100vw, 700px"
            imgClassName="object-top"
            priority
            onReady={() => setLoaded(true)}
          />

          {/* Bottom-up scrim so the name always reads over the photo. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
          />

          {/* Click-to-zoom, only once a real photo has loaded. */}
          {canZoom && (
            <button
              type="button"
              aria-label={`View ${manager.name} photo`}
              title={`View ${manager.name}`}
              onClick={() =>
                viewer?.open({ src: mascotSrc(manager.id), name: manager.name, caption: teamName })
              }
              className="absolute inset-0 z-[1] cursor-zoom-in"
            />
          )}

          {/* Name overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] p-5 sm:p-7">
            <p className="text-[11px] font-black tracking-[1.6px] text-accent-2 uppercase">
              {kicker}
            </p>
            <h1 className="mt-1 text-[clamp(48px,8vw,96px)] leading-[0.86] font-black tracking-[-0.045em] text-white uppercase">
              {manager.name}
            </h1>
            <p className="mt-3 text-[12px] font-bold tracking-[0.2px] text-white/80">{summary}</p>
            {teamName && (
              <p className="mt-1.5 text-[11px] font-black tracking-[0.8px] text-accent-2 uppercase">
                {teamName}
              </p>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------- stat rail */}
        <div className="on-dark flex flex-col bg-dark px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap justify-end gap-2">
            <ButtonLink
              href={`/teams/${nav.previous.id}`}
              variant="outline"
              size="sm"
              icon="chevron-left"
            >
              Prev
            </ButtonLink>
            <ButtonLink
              href={`/teams/${nav.next.id}`}
              variant="outline"
              size="sm"
              iconRight="chevron-right"
            >
              Next
            </ButtonLink>
            <ButtonLink href="/teams" variant="outline" size="sm" icon="users">
              Roster
            </ButtonLink>
          </div>

          <dl className="mt-5 flex flex-1 flex-col justify-center divide-y divide-white/10">
            {stats.map((stat) => (
              <div key={stat.label} className="py-4 first:pt-0 last:pb-0">
                <dt className="text-[10px] font-black tracking-[1.1px] text-accent-2 uppercase">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 flex items-baseline gap-2.5">
                  {/* tracking-[0.01em] stops the en-dash in records like 76–32
                      from touching the digits at this size. */}
                  <span className="tabular text-[clamp(34px,4vw,48px)] leading-none font-black tracking-[0.01em] text-white">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-[11px] font-bold tracking-[0.6px] text-white/55 uppercase">
                      {stat.unit}
                    </span>
                  )}
                  {stat.rings && stat.rings.length > 0 ? (
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 self-center">
                      {stat.rings.map((ring) => (
                        <RingImage key={ring.image} ring={ring} />
                      ))}
                    </span>
                  ) : null}
                </dd>
                {stat.pill && (
                  <dd className="mt-2">
                    <span className="tabular inline-flex items-center rounded-full border border-accent/40 bg-accent/12 px-2.5 py-1 text-[10px] font-black tracking-[0.5px] text-accent-2 uppercase">
                      {stat.pill}
                    </span>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </header>
  );
}

/**
 * A single championship ring image.
 *
 * Fades in the PNG on load and clicks through to the lightbox. If the file is
 * missing it falls back to a small gold disc, so the row still reads before the
 * artwork for a given year has been added.
 */
function RingImage({ ring }: { ring: HeroRing }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const viewer = usePhotoViewer();

  if (failed) {
    return (
      <span
        title={`${ring.label} championship`}
        aria-label={`${ring.label} championship ring`}
        className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-b from-gold-2 to-gold text-[#2a1707] shadow-[0_2px_8px_rgba(212,175,55,0.4),inset_0_1px_0_rgba(255,255,255,0.5)]"
      >
        <Icon name="ring" size={14} strokeWidth={2} aria-hidden />
      </span>
    );
  }

  return (
    <button
      type="button"
      title={`${ring.label} championship`}
      aria-label={`View ${ring.label} championship ring`}
      onClick={() =>
        viewer?.open({ src: ring.image, name: `${ring.label} championship ring` })
      }
      // The button keeps a small footprint so it never grows the row; the image
      // is scaled well beyond it and centred, overflowing symmetrically.
      className="relative z-[1] h-7 w-9 shrink-0 cursor-zoom-in overflow-visible"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local asset with a gold-disc fallback */}
      <img
        src={ring.image}
        alt={`${ring.label} championship ring`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          'absolute top-1/2 left-1/2 h-[68px] w-[68px] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.55)] transition-[opacity,transform] duration-200 hover:scale-110',
          loaded ? 'opacity-100' : 'opacity-0',
        )}
      />
    </button>
  );
}
