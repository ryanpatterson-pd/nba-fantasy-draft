'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

/** The photo path convention. Drop public/mascots/<id>.png and it appears. */
export function mascotSrc(managerId: string): string {
  return `/mascots/${managerId}.png`;
}

/**
 * A manager's mascot photo.
 *
 * Served as a plain <img> straight from /public — deliberately NOT through the
 * Next image optimiser. The optimiser was the source of the "photos don't load"
 * problem: on the larger fill layouts (honour roll, coach hero) it had to
 * transform the source PNGs on first request and those requests failed or timed
 * out, leaving the cards stuck on their monogram fallback. A direct static file
 * always loads, so this is the reliable, permanent behaviour.
 *
 * The image is visible from the start (no JS-gated fade, which previously left
 * photos invisible when onLoad fired before hydration). The monogram sits behind
 * it as the fallback; a genuinely missing file triggers onError, which unmounts
 * this and reveals the monogram. The parent must be positioned (relative).
 *
 * `sizes`/`priority`/`quality` are accepted for call-site compatibility but no
 * longer used — the file is served as-is. The source PNGs are pre-shrunk to
 * ~1.2 MB, which is fine for the handful shown per page.
 */
export function MascotImage({
  managerId,
  alt,
  className,
  imgClassName,
  priority = false,
  onReady,
}: {
  managerId: string;
  alt: string;
  /** Accepted for compatibility; unused now the file is served directly. */
  sizes?: string;
  quality?: number;
  className?: string;
  /** Applied to the image itself, e.g. object-position. */
  imgClassName?: string;
  priority?: boolean;
  /** Called once the image has painted, e.g. to enable a zoom overlay. */
  onReady?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- served directly on purpose; see file header
    <img
      src={mascotSrc(managerId)}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => onReady?.()}
      onError={() => setFailed(true)}
      className={cn('absolute inset-0 h-full w-full object-cover', className, imgClassName)}
    />
  );
}
