'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getManager } from '@/lib/data/managers';
import { drawFromOdds, rotationForSegment, wheelSegments, type OddsRow } from '@/lib/draft/lottery';
import { cn } from '@/lib/utils/cn';

const SPIN_MS = 4200;
/** Segments smaller than this are left unlabelled to avoid a wall of text. */
const LABEL_THRESHOLD = 0.045;

/**
 * The lottery wheel.
 *
 * Segment sizes are the odds — there is no cosmetic fudging. The winner is
 * drawn first from the weighted entries, then the wheel is rotated so that
 * segment lands under the pointer, which keeps the animation honest.
 */
export function LotteryWheel({
  odds,
  nextPick,
  disabled = false,
  onResult,
  className,
}: {
  odds: OddsRow[];
  nextPick: number | null;
  disabled?: boolean;
  onResult: (managerId: string) => void;
  className?: string;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const timer = useRef<number | null>(null);

  const segments = useMemo(() => wheelSegments(odds), [odds]);

  // Cancel a spin in flight if the wheel is unmounted (e.g. tab switch), so the
  // pick is never assigned after the user has navigated away.
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

    setSpinning(true);
    setAnnouncement('Spinning the wheel.');
    setRotation((current) => rotationForSegment(segment, current, 6));

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setSpinning(false);
      setAnnouncement(`${getManager(winnerId).name} drawn for pick ${nextPick ?? ''}.`);
      onResult(winnerId);
    }, SPIN_MS);
  }

  const canSpin = !spinning && !disabled && odds.length > 0;

  return (
    <div className={cn('flex flex-col items-center gap-5', className)}>
      <div className="relative w-full max-w-[420px]">
        {/* Pointer */}
        <div className="absolute -top-1 left-1/2 z-20 -translate-x-1/2">
          <div
            className="h-4 w-4 rotate-45 rounded-[3px] border-2 border-accent bg-surface shadow-md"
            aria-hidden
          />
        </div>

        <div className="card-shadow relative aspect-square w-full rounded-full border border-line bg-surface p-2.5">
          <div
            className="relative h-full w-full rounded-full ring-1 ring-black/10"
            style={{
              background: gradient,
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.16, 0.82, 0.04, 1)` : 'none',
            }}
          >
            {/* Labels ride along each segment's mid-angle, near the rim. */}
            {segments.map((segment) =>
              segment.chance >= LABEL_THRESHOLD ? (
                <span
                  key={segment.managerId}
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ transform: `rotate(${segment.midAngle}deg)` }}
                >
                  <span
                    className="absolute top-[7%] left-1/2 -translate-x-1/2 text-[0.68rem] font-extrabold tracking-wider whitespace-nowrap"
                    style={{ color: getManager(segment.managerId).colours.secondary }}
                  >
                    {getManager(segment.managerId).name.toUpperCase()}
                  </span>
                </span>
              ) : null,
            )}

            {/* Hub */}
            <div className="on-dark absolute top-1/2 left-1/2 flex h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center">
              <span className="label-xs">Pick</span>
              <span className="tabular text-2xl leading-none font-extrabold text-accent-deep">
                {nextPick === null ? '—' : String(nextPick).padStart(2, '0')}
              </span>
            </div>
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
        {spinning
          ? 'Spinning…'
          : odds.length === 0
            ? 'Draft order complete'
            : `Spin for pick ${nextPick ?? ''}`}
      </Button>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
