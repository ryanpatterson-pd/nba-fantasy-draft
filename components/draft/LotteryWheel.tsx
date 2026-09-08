'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getManager } from '@/lib/data/managers';
import { buzz, playReveal } from '@/lib/draft/celebrate';
import { drawFromOdds, rotationForSegment, wheelSegments, type OddsRow } from '@/lib/draft/lottery';
import { cn } from '@/lib/utils/cn';

const SPIN_MS = 5200;
/** Segments smaller than this are left unlabelled to avoid a wall of text. */
const LABEL_THRESHOLD = 0.05;

/**
 * The lottery wheel — the centrepiece of draft night.
 *
 * Segment sizes ARE the odds; there is no cosmetic fudging. The winner is drawn
 * first from the weighted entries, then the wheel is rotated so that segment
 * lands under the pointer, so the animation reflects a real draw. A glossy
 * overlay, a glowing rim and a metallic hub dress it up without touching the
 * honesty of the maths.
 */
export function LotteryWheel({
  odds,
  nextPick,
  disabled = false,
  soundOn = true,
  onResult,
  onSpinStart,
  className,
}: {
  odds: OddsRow[];
  nextPick: number | null;
  disabled?: boolean;
  soundOn?: boolean;
  onResult: (managerId: string) => void;
  /** Fired the instant a spin begins, e.g. to dim the room / start a drumroll. */
  onSpinStart?: () => void;
  className?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number | null>(null);

  const segments = useMemo(() => wheelSegments(odds), [odds]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const gradient = useMemo(() => {
    if (segments.length === 0) return 'var(--surface-3)';
    const stops = segments
      .map((segment) => {
        const colour = getManager(segment.managerId).colours.primary;
        return `${colour} ${segment.startAngle.toFixed(3)}deg ${segment.endAngle.toFixed(3)}deg`;
      })
      .join(', ');
    return `conic-gradient(from 0deg, ${stops})`;
  }, [segments]);

  function spin() {
    if (spinning || disabled || odds.length === 0) return;

    const winnerId = drawFromOdds(odds, Math.random());
    const segment = segments.find((s) => s.managerId === winnerId);
    if (!winnerId || !segment) return;

    onSpinStart?.();
    buzz(30);
    setSpinning(true);
    setAnnouncement('Spinning the wheel.');
    setRotation((current) => rotationForSegment(segment, current, 7));

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setAnnouncement(`${getManager(winnerId).name} drawn.`);
      playReveal(soundOn);
      onResult(winnerId);
    }, SPIN_MS);
  }

  const canSpin = !spinning && !disabled && odds.length > 0;

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      <div className="relative aspect-square w-full max-w-[min(78vw,520px)]">
        {/* Ambient glow behind the wheel. */}
        <div
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full blur-2xl transition-opacity duration-500',
            spinning ? 'opacity-70' : 'opacity-40',
          )}
          style={{
            background:
              'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 70%)',
          }}
        />

        {/* Pointer at 12 o'clock. */}
        <div className="absolute -top-2 left-1/2 z-30 -translate-x-1/2">
          <div
            className="h-0 w-0 border-x-[13px] border-t-[22px] border-x-transparent drop-shadow-[0_3px_5px_rgba(0,0,0,0.45)]"
            style={{ borderTopColor: 'var(--accent)' }}
            aria-hidden
          />
        </div>

        {/* Outer bezel: dark metallic ring with a lit top edge. */}
        <div className="on-dark relative h-full w-full rounded-full p-[3.5%] shadow-[0_30px_70px_rgba(2,8,23,0.45)]">
          <div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, #2a2d38, #14151b, #2a2d38, #14151b, #2a2d38)',
            }}
          />
          <span
            aria-hidden
            className="absolute inset-x-[18%] top-[1.5%] h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"
          />

          {/* The wheel face. */}
          <div className="relative h-full w-full overflow-hidden rounded-full ring-1 ring-black/20">
            <div
              className="relative h-full w-full rounded-full"
              style={{
                background: gradient,
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.83, 0.02, 1)`
                  : 'none',
              }}
            >
              {segments.map((segment) =>
                segment.chance >= LABEL_THRESHOLD ? (
                  <span
                    key={segment.managerId}
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ transform: `rotate(${segment.midAngle}deg)` }}
                  >
                    <span
                      className="absolute top-[6%] left-1/2 -translate-x-1/2 text-[clamp(0.6rem,2vw,0.85rem)] font-black tracking-wide whitespace-nowrap uppercase"
                      style={{
                        color: getManager(segment.managerId).colours.secondary,
                        textShadow: '0 1px 1px rgba(255,255,255,0.25)',
                      }}
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
                  'radial-gradient(120% 80% at 30% 18%, rgba(255,255,255,0.28), transparent 45%), radial-gradient(100% 100% at 70% 95%, rgba(0,0,0,0.22), transparent 55%)',
              }}
            />
          </div>

          {/* Metallic centre hub. */}
          <div className="absolute top-1/2 left-1/2 z-20 flex h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-white/20 text-center shadow-[0_8px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35)]"
            style={{ background: 'radial-gradient(circle at 50% 35%, #2a2d38, #101116 70%)' }}
          >
            <span className="text-[9px] font-black tracking-[1.4px] text-white/55 uppercase sm:text-[10px]">
              Pick
            </span>
            <span
              className="tabular text-[clamp(1.4rem,5vw,2.2rem)] leading-none font-black"
              style={{ color: 'var(--accent-2)' }}
            >
              {nextPick === null ? '—' : String(nextPick).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        icon="wheel"
        onClick={spin}
        disabled={!canSpin}
        className="w-full max-w-[420px]"
      >
        {spinning ? 'Spinning…' : odds.length === 0 ? 'Draft order complete' : 'Spin the wheel'}
      </Button>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
