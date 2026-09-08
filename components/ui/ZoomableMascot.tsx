'use client';

import { useState } from 'react';
import { MascotImage, mascotSrc } from '@/components/ui/MascotImage';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { getManager } from '@/lib/data/managers';
import { cn } from '@/lib/utils/cn';

/**
 * A manager's mascot filling a square (or any positioned) tile, that opens the
 * full photo in the shared lightbox when clicked.
 *
 * Same behaviour as Avatar's zoom, extracted for the larger fill layouts (stat
 * cards) where the photo isn't a round avatar. The zoom target is a transparent
 * overlay button over the photo, so a click opens the lightbox even when the
 * tile sits inside a link — it stops the click before the link fires. When no
 * photo has loaded (or there's no viewer provider), the overlay isn't rendered
 * and clicks fall through to whatever wraps it.
 */
export function ZoomableMascot({
  managerId,
  caption,
  className,
  imgClassName,
}: {
  managerId: string;
  /** Extra line under the name in the lightbox, e.g. a team name. */
  caption?: string;
  className?: string;
  imgClassName?: string;
}) {
  const manager = getManager(managerId);
  const [loaded, setLoaded] = useState(false);
  const viewer = usePhotoViewer();
  const canZoom = loaded && viewer !== null;

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 50%, #000))`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-4xl font-black text-white/20 select-none"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt={manager.name}
        sizes="92px"
        imgClassName={imgClassName}
        onReady={() => setLoaded(true)}
      />

      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/25"
      />

      {canZoom && (
        <button
          type="button"
          title={`View ${manager.name}`}
          aria-label={`View ${manager.name} photo`}
          onClick={(event) => {
            // Open the lightbox instead of following the surrounding link.
            event.preventDefault();
            event.stopPropagation();
            viewer?.open({ src: mascotSrc(manager.id), name: manager.name, caption });
          }}
          className="absolute inset-0 z-[2] cursor-zoom-in bg-transparent transition-colors hover:bg-black/10"
        />
      )}
    </div>
  );
}
