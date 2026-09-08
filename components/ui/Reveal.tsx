'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Fades and lifts its children into view the first time they scroll onto
 * screen, then leaves them alone.
 *
 * Mirrors the site's existing `rise` motion (a short fade + 8px lift), driven by
 * an IntersectionObserver so it reacts to the scroll position rather than firing
 * on mount. Built to degrade safely:
 *
 *  - Before hydration / with no JS, children render fully visible — nothing is
 *    ever hidden behind a script that might not run.
 *  - `prefers-reduced-motion` skips the animation and shows content immediately.
 *  - Content already in view on first paint reveals on the next frame, so a
 *    dashboard above the fold doesn't sit blank.
 *
 * `delay` staggers a row of siblings; keep it small (each card +60ms or so).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  /** Stagger in milliseconds before this item animates in. */
  delay?: number;
  className?: string;
  /** Element to render as. Defaults to a div. */
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  // Whether we should animate at all. Decided after mount so SSR markup is the
  // visible state and there is never a hydration mismatch.
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // No IntersectionObserver or reduced motion: just show it.
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    setAnimate(true);
    const node = ref.current;
    if (!node) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      // Reveal a little before the element is fully on screen.
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // @ts-expect-error — ref typing across the small union of tags is fine here.
      ref={ref}
      className={cn(
        animate && 'transition-[opacity,transform] duration-[550ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]',
        animate && !shown && 'translate-y-2 opacity-0',
        className,
      )}
      style={animate && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
