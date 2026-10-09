'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { getManager } from '@/lib/data/managers';
import { buzz, playReveal } from '@/lib/draft/celebrate';
import { drawFromOdds, rotationForSegment, wheelSegments, type OddsRow } from '@/lib/draft/lottery';
import { cn } from '@/lib/utils/cn';

/**
 * Each spin picks a random duration and a random number of full turns, so no
 * two spins share the same motion. A fixed duration/turn count was what made
 * the old wheel feel predictable — the eye learned the rhythm even though the
 * winner was already random. Varying both breaks that read completely.
 */
const SPIN_MS_MIN = 4200;
const SPIN_MS_MAX = 8200;
const TURNS_MIN = 5;
const TURNS_MAX = 10;

/** Segments smaller than this are left unlabelled to avoid a wall of text. */
const LABEL_THRESHOLD = 0.03;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * The HornPub lottery wheel — the centrepiece of draft night.
 *
 * Segment sizes ARE the odds; the winner is drawn first and the wheel lands on
 * it, so the animation reflects a real draw. Segments alternate through the
 * HornPub palette (charcoal, smokey grey, brand orange) rather than each team's
 * own colour, so names always read clearly and the whole thing is on brand. The
 * league shield sits in the hub.
 */

/** HornPub segment palette, cycled around the wheel. */
const SEGMENT_COLOURS = ['#16171d', '#ef6511', '#3a3d47', '#ff8534', '#26272f', '#c2410c'];

export function LotteryWheel({
  odds,
  nextPick,
  disabled = false,
  soundOn = true,
  onResult,
  onSpinStart,
  beforeSpin,
  className,
}: {
  odds: OddsRow[];
  nextPick: number | null;
  disabled?: boolean;
  soundOn?: boolean;
  onResult: (managerId: string) => void;
  /** Fired the instant a spin begins, e.g. to dim the room / start a drumroll. */
  onSpinStart?: () => void;
  /**
   * Guard run when the spin button is pressed, before anything moves. Return
   * false to cancel this spin — used by the house-rule protection prompt, which
   * intercepts the press to offer the next pick to a protected manager first.
   */
  beforeSpin?: () => boolean;
  className?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  // Duration of the spin currently running, and the live countdown shown under
  // the wheel. Both are set fresh on every spin so neither is predictable.
  const [spinMs, setSpinMs] = useState(SPIN_MS_MAX);
  const [remainingMs, setRemainingMs] = useState(0);
  const timer = useRef<number | null>(null);
  const countdown = useRef<number | null>(null);

  const segments = useMemo(() => wheelSegments(odds), [odds]);

  // A stable colour per segment: alternate through the brand palette, and make
  // sure the first and last segments differ so the seam at 12 o'clock is clean.
  const colourFor = useMemo(() => {
    const map = new Map<string, string>();
    const n = segments.length;
    segments.forEach((segment, i) => {
      let colour = SEGMENT_COLOURS[i % SEGMENT_COLOURS.length];
      if (i === n - 1 && colour === map.get(segments[0].managerId)) {
        colour = SEGMENT_COLOURS[(i + 1) % SEGMENT_COLOURS.length];
      }
      map.set(segment.managerId, colour);
    });
    return map;
  }, [segments]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (countdown.current) window.clearInterval(countdown.current);
    },
    [],
  );

  const gradient = useMemo(() => {
    if (segments.length === 0) return 'var(--surface-3)';
    const stops = segments
      .map((segment) => {
        const colour = colourFor.get(segment.managerId) ?? '#16171d';
        return `${colour} ${segment.startAngle.toFixed(3)}deg ${segment.endAngle.toFixed(3)}deg`;
      })
      .join(', ');
    return `conic-gradient(from 0deg, ${stops})`;
  }, [segments, colourFor]);

  function spin() {
    if (spinning || disabled || odds.length === 0) return;

    // Let the caller intercept before anything moves (protection prompt).
    if (beforeSpin && beforeSpin() === false) return;

    const winnerId = drawFromOdds(odds, Math.random());
    const segment = segments.find((s) => s.managerId === winnerId);
    if (!winnerId || !segment) return;

    // Fresh randomness every spin: duration, number of turns, and where inside
    // the winning wedge the pointer settles. The winner itself was already
    // drawn from the odds above — this only varies the motion, never the result.
    const duration = Math.round(randomBetween(SPIN_MS_MIN, SPIN_MS_MAX));
    const turns = Math.round(randomBetween(TURNS_MIN, TURNS_MAX));
    const landFraction = Math.random();

    onSpinStart?.();
    buzz(30);
    setSpinMs(duration);
    setRemainingMs(duration);
    setSpinning(true);
    setAnnouncement('Spinning the wheel.');
    setRotation((current) => rotationForSegment(segment, current, turns, landFraction));

    // Live countdown under the wheel, ticking toward zero as it slows.
    if (countdown.current) window.clearInterval(countdown.current);
    const startedAt = performance.now();
    countdown.current = window.setInterval(() => {
      const left = Math.max(0, duration - (performance.now() - startedAt));
      setRemainingMs(left);
      if (left <= 0 && countdown.current) {
        window.clearInterval(countdown.current);
        countdown.current = null;
      }
    }, 90);

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setRemainingMs(0);
      setAnnouncement(`${getManager(winnerId).name} drawn.`);
      playReveal(soundOn);
      onResult(winnerId);
    }, duration);
  }

  const canSpin = !spinning && !disabled && odds.length > 0;

  return (
    <div className={cn('flex w-full flex-col items-center gap-6', className)}>
      <div className="relative aspect-square w-full max-w-[min(92vw,760px)]">
        {/* Ambient glow behind the wheel. */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full blur-3xl transition-opacity duration-500',
            spinning ? 'opacity-80' : 'opacity-45',
          )}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 68%)',
          }}
        />

        {/* Pointer at 12 o'clock. */}
        <div className="absolute -top-1 left-1/2 z-30 -translate-x-1/2">
          <div
            className="h-0 w-0 border-x-[16px] border-t-[28px] border-x-transparent drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
            style={{ borderTopColor: 'var(--accent)' }}
            aria-hidden
          />
        </div>

        {/* Outer bezel: dark metallic ring with a lit top edge. */}
        <div className="on-dark relative h-full w-full rounded-full p-[3%] shadow-[0_40px_90px_rgba(2,8,23,0.5)]">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg, #3a3d47, #101116, #3a3d47, #101116, #3a3d47, #101116, #3a3d47)',
            }}
          />
          <span
            aria-hidden
            className="absolute inset-x-[16%] top-[1.2%] h-px bg-gradient-to-r from-transparent via-white/55 to-transparent"
          />

          {/* The wheel face. */}
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-black/30">
            <div
              className="relative h-full w-full rounded-full"
              style={{
                background: gradient,
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${spinMs}ms cubic-bezier(0.15, 0.83, 0.02, 1)`
                  : 'none',
              }}
            >
              {/* Thin dividers between segments for a crisp, spoked look. */}
              {segments.map((segment) => (
                <span
                  key={`divider-${segment.managerId}`}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-1/2 h-1/2 w-px origin-top bg-white/15"
                  style={{ transform: `rotate(${segment.startAngle}deg)` }}
                />
              ))}

              {/* Names ride each segment's mid-angle, near the rim. White with a
                  shadow reads on both the charcoal and orange wedges. */}
              {segments.map((segment) =>
                segment.chance >= LABEL_THRESHOLD ? (
                  <span
                    key={segment.managerId}
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ transform: `rotate(${segment.midAngle}deg)` }}
                  >
                    <span
                      className="absolute top-[5%] left-1/2 -translate-x-1/2 text-[clamp(0.7rem,2.2vw,1.15rem)] font-black tracking-wide whitespace-nowrap text-white uppercase"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                    >
                      {getManager(segment.managerId).name}
                    </span>
                  </span>
                ) : null,
              )}
            </div>

            {/* Glossy highlight over the whole face — sits still while it spins. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  'radial-gradient(120% 80% at 30% 16%, rgba(255,255,255,0.22), transparent 46%), radial-gradient(100% 100% at 70% 96%, rgba(0,0,0,0.28), transparent 55%)',
              }}
            />
          </div>

          {/* Centre hub: the HornPub shield. */}
          <div
            className="absolute top-1/2 left-1/2 z-20 flex h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white/15 p-[3%] shadow-[0_10px_26px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]"
            style={{ background: 'radial-gradient(circle at 50% 32%, #2a2d38, #0b0c10 72%)' }}
          >
            <LeagueLogo variant="shield" className="h-full w-full" imgClassName="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
            {/* Pick number as a small badge on the hub's lower edge. */}
            {nextPick !== null && (
              <span
                className="tabular absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/20 px-2 py-0.5 text-[clamp(0.65rem,1.6vw,0.85rem)] font-black text-white shadow-md"
                style={{ background: 'var(--accent)' }}
              >
                PICK {String(nextPick).padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        icon="wheel"
        onClick={spin}
        disabled={!canSpin}
        className="w-full max-w-[460px]"
      >
        {spinning ? 'Spinning…' : odds.length === 0 ? 'Draft order complete' : 'Spin the wheel'}
      </Button>

      {/* Spin countdown: how long this spin will run, ticking to zero. The
          duration is random each spin, so this number genuinely varies. */}
      <div
        className={cn(
          'flex items-center gap-2 text-sm font-bold transition-opacity duration-300',
          spinning ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden={!spinning}
      >
        <span className="tabular text-[clamp(1.6rem,5vw,2.4rem)] font-black tracking-tight text-accent-deep">
          {(remainingMs / 1000).toFixed(1)}
        </span>
        <span className="label-xs">seconds left</span>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
