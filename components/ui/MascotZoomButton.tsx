'use client';

import { useEffect, useState } from 'react';
import { mascotSrc } from '@/components/ui/MascotImage';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { getManager } from '@/lib/data/managers';

/**
 * A transparent, absolutely-positioned overlay that opens a manager's full
 * photo in the shared lightbox when clicked.
 *
 * Drop it as the last child inside any positioned container that already renders
 * a mascot photo (stat cards, honour cards, roster tiles). It layers over the
 * photo and, on click, stops propagation so the lightbox opens even when the
 * tile is wrapped in a link. It only becomes active once the manager's photo
 * has actually loaded, so it never pretends a missing image is clickable, and
 * it renders nothing when there's no viewer provider.
 */
export function MascotZoomButton({
  managerId,
  caption,
}: {
  managerId: string;
  /** Extra line under the name in the lightbox, e.g. a team name. */
  caption?: string;
}) {
  const viewer = usePhotoViewer();
  const [loaded, setLoaded] = useState(false);

  // Probe the photo out-of-band: the surrounding card renders its own <img>,
  // so this just checks the same cached file resolves before enabling zoom.
  useEffect(() => {
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (live) setLoaded(true);
    };
    img.src = mascotSrc(managerId);
    return () => {
      live = false;
    };
  }, [managerId]);

  if (!viewer || !loaded) return null;

  const manager = getManager(managerId);

  return (
    <button
      type="button"
      title={`View ${manager.name}`}
      aria-label={`View ${manager.name} photo`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        viewer.open({ src: mascotSrc(managerId), name: manager.name, caption });
      }}
      className="absolute inset-0 z-[3] cursor-zoom-in bg-transparent transition-colors hover:bg-black/10"
    />
  );
}
