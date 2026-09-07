'use client';

import { useEffect, useRef, useState } from 'react';
import { useIsHydrated } from '@/lib/hooks/useIsHydrated';

/**
 * Count-up figure.
 *
 * Accepts the final display string (e.g. "62.5%", "1,335", "3", or a name like
 * "Ryan") and, when it is a number, animates from zero up to it the first time
 * it scrolls into view. Anything that is not a leading number is rendered as-is,
 * so passing a manager's name just prints the name.
 *
 * The split preserves a non-numeric prefix and suffix: "62.5%" counts the 62.5
 * and keeps the "%"; "+128" keeps the sign; "1,335" counts the grouped number.
 * Decimal places and thousands separators in the target are matched on the way
 * up so the animation never shows a different format than the final value.
 *
 * Server render and the hydration pass show the final value outright — the
 * animation only ever runs client-side after mount — so there is no layout
 * shift and no hydration mismatch. `prefers-reduced-motion` skips the animation
 * entirely.
 */
export function CountUp({
  value,
  durationMs = 1100,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const parsed = parseValue(value);
  const hydrated = useIsHydrated();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string>(value);

  useEffect(() => {
    // Nothing to animate for a non-numeric value; leave it as the final string.
    if (!parsed) {
      setDisplay(value);
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const node = ref.current;
    if (!node) return;

    let raf = 0;
    let start = 0;
    let done = false;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic — quick off the mark, gentle landing.
      const eased = 1 - Math.pow(1 - t, 3);
      const current = parsed.value * eased;
      setDisplay(`${parsed.prefix}${formatLike(current, parsed)}${parsed.suffix}`);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(value); // land exactly on the source string
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !done) {
            done = true;
            setDisplay(`${parsed.prefix}0${parsed.suffix}`);
            raf = requestAnimationFrame(step);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    // Re-run if the target value changes.
  }, [value, durationMs, parsed?.value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Until hydrated, render the plain final value so SSR and first paint match.
  return (
    <span ref={ref} className={className}>
      {hydrated ? display : value}
    </span>
  );
}

type Parsed = {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
  grouped: boolean;
};

/**
 * Splits a display string into an optional prefix, a numeric core, and an
 * optional suffix. Returns null when there is no number to animate.
 */
function parseValue(raw: string): Parsed | null {
  const match = raw.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, numberStr, suffix] = match;
  const grouped = numberStr.includes(',');
  const plain = numberStr.replace(/,/g, '');
  const value = Number(plain);
  if (!Number.isFinite(value)) return null;

  const dot = plain.indexOf('.');
  const decimals = dot === -1 ? 0 : plain.length - dot - 1;

  return { prefix, suffix, value, decimals, grouped };
}

/** Formats an in-flight number to match the target's decimals and grouping. */
function formatLike(n: number, parsed: Parsed): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
    useGrouping: parsed.grouped,
  });
}
