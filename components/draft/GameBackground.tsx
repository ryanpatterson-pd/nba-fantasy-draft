'use client';

import { useState } from 'react';
import { GameScene } from '@/components/draft/GameScene';
import { cn } from '@/lib/utils/cn';

/** Photo convention: drop public/draft-games/<id>.png and it appears. */
export function gamePhotoSrc(gameId: string): string {
  return `/draft-games/${gameId}.png`;
}

/**
 * The cinematic backdrop for a game slide.
 *
 * Tries a photographic background at /draft-games/<id>.png first — drop a file
 * in and it takes over with no code change, exactly like the mascots and the
 * page header.
 *
 * The treatment adapts to what's available:
 *   with a photo  — a light left-weighted scrim keeps the title readable
 *                   without muddying the image.
 *   without one   — a fuller arena composition (amber glow, floor bounce,
 *                   court arc and the game's line art) so the slide reads as
 *                   designed rather than as an empty black panel.
 */
export function GameBackground({
  gameId,
  className,
  showSceneFallback = true,
}: {
  gameId: string;
  className?: string;
  showSceneFallback?: boolean;
}) {
  // `hasPhoto` tracks whether the image loaded. The caller mounts this with a
  // per-game `key`, so each slide gets a fresh instance and the fallback from
  // one game's missing image never carries over to another.
  const [hasPhoto, setHasPhoto] = useState(true);

  return (
    <div className={cn('absolute inset-0 overflow-hidden', className)} aria-hidden>
      {/* Near-black base. */}
      <div className="absolute inset-0 bg-[#0a0b0e]" />

      {hasPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- optional local backdrop, served directly */}
          <img
            src={gamePhotoSrc(gameId)}
            alt=""
            onError={() => setHasPhoto(false)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Light, left-weighted scrim so the photo stays vivid on the right. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b]/55 via-transparent to-[#07080b]/25" />
        </>
      ) : (
        <>
          {/* --- No-photo composition: make the empty area feel lit --- */}

          {/* Big warm arena glow from the top-right. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(130% 150% at 100% -15%, rgba(239,101,17,0.5) 0%, rgba(239,101,17,0.16) 26%, transparent 56%)',
            }}
          />
          {/* Cool rim light, top-left, to add depth opposite the warm side. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 90% at -5% 0%, rgba(120,150,210,0.12) 0%, transparent 46%)',
            }}
          />
          {/* Floor bounce, bottom. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(100% 80% at 60% 118%, rgba(255,133,52,0.16) 0%, transparent 55%)',
            }}
          />
          {/* A sweeping court arc, bottom-left, like the page header. */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(60% 120% at 10% 120%, transparent 38%, rgba(212,175,55,0.14) 39.3%, transparent 40.6%), radial-gradient(40% 85% at 10% 120%, transparent 38%, rgba(212,175,55,0.1) 39.3%, transparent 40.6%)',
            }}
          />

          {/* The game's line art as a large faint watermark, centred in the
              empty left/centre space. */}
          {showSceneFallback && (
            <div className="absolute inset-y-0 left-0 flex w-[62%] items-center justify-center text-accent">
              <GameScene gameId={gameId} className="h-[78%] w-auto opacity-[0.1]" />
            </div>
          )}

          {/* Vignette + title scrim. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/40 to-[#07080b]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b]/85 via-transparent to-[#07080b]/35" />
        </>
      )}
    </div>
  );
}
