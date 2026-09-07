'use client';

import { useEffect, useState } from 'react';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { LEAGUE } from '@/lib/league';
import { cn } from '@/lib/utils/cn';

/**
 * Branded splash / loading screen.
 *
 * A full-screen cinematic overlay shown while the app first paints — the league
 * shield on the arena field, the wordmark, and a loading bar — then it fades
 * away. It runs once per browser session (tracked in sessionStorage) so it
 * greets you on arrival without interrupting in-app navigation, and it collapses
 * to an instant fade for anyone who prefers reduced motion.
 *
 * The overlay is fixed and above everything, so the app renders underneath and
 * is ready the moment the splash lifts.
 */
export function SplashScreen() {
  // Start shown; an effect immediately hides it if we've already greeted this
  // session. Rendering it on the first client paint (rather than gating on an
  // effect) means there's no flash of the bare app before the splash appears.
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only greet once per session.
    let alreadySeen = false;
    try {
      alreadySeen = window.sessionStorage.getItem('hp-splash-seen') === '1';
    } catch {
      alreadySeen = false;
    }

    if (alreadySeen) {
      setPhase('gone');
      return;
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    // Hold long enough for the loading bar to fill completely before fading.
    // The bar runs 1500ms after a 260ms delay (see globals.css), so it finishes
    // at ~1760ms; hold a touch past that so it reaches 100% first.
    const holdMs = reduce ? 350 : 1850; // time the brand is held before fading
    const fadeMs = reduce ? 150 : 620; // fade-out duration (keep in sync with CSS)

    const holdTimer = window.setTimeout(() => setPhase('out'), holdMs);
    const doneTimer = window.setTimeout(() => {
      setPhase('gone');
      try {
        window.sessionStorage.setItem('hp-splash-seen', '1');
      } catch {
        /* private mode — the splash simply shows again next visit */
      }
    }, holdMs + fadeMs);

    // Lock scroll while the splash is up.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(doneTimer);
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (phase === 'gone') document.body.style.overflow = '';
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      aria-hidden
      className={cn(
        'arena-wash court-lines fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden',
        'transition-opacity duration-[620ms] ease-out',
        phase === 'out' ? 'pointer-events-none opacity-0' : 'opacity-100',
      )}
    >
      {/* Vignette so the centre pops. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_38%,transparent_38%,rgba(0,0,0,0.55)_100%)]"
      />

      {/* A slow sweep of light across the field. */}
      <span aria-hidden className="hp-splash-sheen pointer-events-none absolute inset-0" />

      <div className="relative flex flex-col items-center px-8">
        {/* Shield in a lit ring. */}
        <div className="hp-splash-logo relative">
          <span
            aria-hidden
            className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(255,133,52,0.45),transparent_68%)] blur-xl"
          />
          <LeagueLogo
            variant="full"
            className="relative h-32 w-auto drop-shadow-[0_18px_40px_rgba(0,0,0,0.6)] sm:h-44"
          />
        </div>

        {/* Wordmark + tagline. */}
        <div className="hp-splash-word mt-7 flex flex-col items-center text-center">
          <p className="text-[11px] font-black tracking-[5px] text-accent-2 uppercase">
            {LEAGUE.subtitle}
          </p>
          <h1 className="mt-2 text-3xl leading-[0.95] font-black tracking-[-0.03em] text-white uppercase sm:text-4xl">
            {LEAGUE.name}
          </h1>
          <p className="mt-2.5 text-[11px] font-semibold tracking-[2.5px] text-white/45 uppercase">
            The all-time database
          </p>
        </div>

        {/* Loading bar. */}
        <div className="hp-splash-word mt-9 h-[3px] w-44 overflow-hidden rounded-full bg-white/12 sm:w-56">
          <span className="hp-splash-bar block h-full w-full rounded-full bg-gradient-to-r from-accent to-accent-2" />
        </div>
      </div>
    </div>
  );
}
