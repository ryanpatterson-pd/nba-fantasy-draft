'use client';

import { useState } from 'react';
import { LEAGUE } from '@/lib/league';
import { cn } from '@/lib/utils/cn';

type Variant = 'full' | 'shield' | 'word';

/**
 * The league logo.
 *
 * Renders one of the brand images from public/league-logos. Only the full
 * lockup exists today, so `shield`/`word` fall back to `full`, and if the image
 * itself is missing it falls back to the monogram tile — so nothing ever shows
 * a broken image. Served as a plain <img> (not the Next optimiser) for the same
 * reliability reasons as the mascots.
 */
export function LeagueLogo({
  variant = 'full',
  className,
  imgClassName,
}: {
  variant?: Variant;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = LEAGUE.logos[variant] ?? LEAGUE.logos.full;

  if (failed) {
    return (
      <span
        className={cn(
          'accent-solid grid place-items-center rounded-[14px] font-black tracking-tight',
          className,
        )}
      >
        {LEAGUE.monogram}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand asset served directly; see file header
    <img
      src={src}
      alt={LEAGUE.name}
      onError={() => setFailed(true)}
      className={cn('object-contain', className, imgClassName)}
    />
  );
}
