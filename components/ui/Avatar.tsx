'use client';

import { useState } from 'react';
import { MascotImage, mascotSrc } from '@/components/ui/MascotImage';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import type { Manager } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

export { mascotSrc };

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-[13px]',
  lg: 'h-12 w-12 text-[17px]',
  xl: 'h-16 w-16 text-[22px]',
  hero: 'h-[112px] w-[112px] text-[42px] sm:h-[140px] sm:w-[140px] sm:text-[54px]',
} as const;

/** Larger radius for the oversized profile header photo. */
const RADII: Partial<Record<keyof typeof SIZES, string>> = {
  hero: 'rounded-[18px]',
};

/** Rendered pixel size per avatar size, so the optimiser fetches ~2x for retina. */
const SIZE_HINT: Record<keyof typeof SIZES, string> = {
  xs: '48px',
  sm: '56px',
  md: '72px',
  lg: '96px',
  xl: '128px',
  hero: '280px',
};

/**
 * Manager avatar.
 *
 * The monogram is always rendered; an optional /mascots/<id>.png is layered on
 * top and faded in only once it has actually loaded. That way a missing image
 * never shows the browser's broken-image glyph, and dropping files into
 * public/mascots later starts working with no code change.
 *
 * Once a real photo has loaded it is clickable everywhere and opens the shared
 * lightbox (see PhotoViewer). The zoom target is a transparent overlay button
 * layered over the photo, so it works even when the avatar sits inside a link:
 * the overlay stops the click before it reaches the link. When no photo loads,
 * or the avatar is used somewhere with no provider, the overlay is not rendered
 * and the plain monogram shows through — it never pretends to be clickable.
 *
 * Pass `zoomable={false}` to opt a specific avatar out.
 */
export function Avatar({
  manager,
  size = 'md',
  ring = true,
  zoomable = true,
  caption,
  className,
}: {
  manager: Manager;
  size?: keyof typeof SIZES;
  ring?: boolean;
  /** Allow clicking to open the full photo once it has loaded. Default true. */
  zoomable?: boolean;
  /** Extra line under the name in the lightbox, e.g. a team name. */
  caption?: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const viewer = usePhotoViewer();

  const canZoom = zoomable && loaded && viewer !== null;

  return (
    <span
      className={cn(
        'relative inline-block shrink-0 overflow-hidden',
        RADII[size] ?? 'rounded-[7px]',
        SIZES[size],
        ring && 'ring-1 ring-black/[0.06]',
        className,
      )}
      style={{
        background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 62%, #000))`,
      }}
      title={manager.name}
    >
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-extrabold tracking-tight text-white/95"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt=""
        sizes={SIZE_HINT[size]}
        onReady={() => setLoaded(true)}
      />

      {canZoom && (
        <button
          type="button"
          title={`View ${manager.name}`}
          aria-label={`View ${manager.name} photo`}
          // Sits on top of the photo. Preventing default and stopping
          // propagation means a click opens the lightbox even when this avatar
          // is nested inside a link or another button.
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            viewer?.open({ src: mascotSrc(manager.id), name: manager.name, caption });
          }}
          className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent transition-colors hover:bg-black/10"
        />
      )}
    </span>
  );
}

/** Avatar plus name, the most repeated pairing on the site. */
export function ManagerTag({
  manager,
  size = 'sm',
  secondary,
  className,
}: {
  manager: Manager;
  size?: keyof typeof SIZES;
  secondary?: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar manager={manager} size={size} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-extrabold tracking-[-0.015em] text-ink">
          {manager.name}
        </span>
        {secondary ? (
          <span className="block truncate text-[10px] font-bold tracking-[0.4px] text-ink-dim uppercase">
            {secondary}
          </span>
        ) : null}
      </span>
    </span>
  );
}
