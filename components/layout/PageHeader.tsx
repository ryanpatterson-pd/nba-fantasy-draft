'use client';

import { useEffect, useRef, useState } from 'react';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { cn } from '@/lib/utils/cn';

/**
 * Page header.
 *
 * A premium cinematic banner: an arena-lit charcoal backdrop with a gold hairline
 * border, the accent eyebrow, a tightly tracked title and one line of copy. Drop
 * a file at public/header.jpg (or pass `image`) and it layers behind the wash.
 *
 * On scroll it collapses into a slim sticky bar that keeps the title and any
 * aside controls visible without taking the full hero height.
 */
export function PageHeader({
  kicker,
  title,
  copy,
  aside,
  meta,
  image = '/header.jpg',
  className,
}: {
  kicker: string;
  title: React.ReactNode;
  copy?: string;
  /** Filters, countdown or actions, docked right on wide screens. */
  aside?: React.ReactNode;
  /** Optional chips under the copy. Used sparingly. */
  meta?: React.ReactNode;
  /** Background image path; falls back to the CSS arena wash if missing. */
  image?: string;
  className?: string;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    // Reveal the slim bar only once the hero has fully scrolled out of view.
    const onScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;
      const bottom = hero.getBoundingClientRect().bottom;
      setStuck(bottom < 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <>
      {/* Full hero */}
      <header
        ref={heroRef}
        className={cn(
          'on-dark arena-wash court-lines relative overflow-hidden rounded-panel border border-gold/25 px-4 py-3.5 shadow-raised sm:px-9 sm:py-6',
          className,
        )}
      >
        {/* Optional background photo, faded so text stays readable. */}
        <HeaderImage image={image} />

        {/* Gold sheen along the top edge. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />

        <div className="relative z-[2] flex flex-col gap-4 sm:gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
              {kicker}
            </p>
            <h1 className="mt-1 mb-1.5 text-[28px] leading-[0.98] text-white sm:mt-1.5 sm:mb-2 sm:text-[48px] sm:leading-[0.95]">
              {title}
            </h1>
            {copy && (
              <p className="body-copy hidden text-[12.5px] font-medium text-white/70 sm:block sm:text-[14px]">
                {copy}
              </p>
            )}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">{meta}</div>}
          </div>
          {aside && <div className="w-full shrink-0 xl:w-auto xl:max-w-sm">{aside}</div>}
        </div>
      </header>

      {/* Slim sticky bar. A zero-height sticky wrapper keeps this entirely out
          of the layout (no margins that would eat the hero's spacing); the bar
          itself is absolutely positioned inside it and fades in only once the
          hero has fully scrolled past. */}
      <div className="pointer-events-none sticky top-0 z-30 -mt-4 hidden h-0 lg:block">
        <div
          className={cn(
            'absolute inset-x-0 top-3 transition-[opacity,transform] duration-200',
            stuck ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0',
          )}
          aria-hidden={!stuck}
        >
          <div
            className={cn(
              'on-dark arena-wash relative flex items-center gap-3 overflow-hidden rounded-full border border-gold/25 px-4 py-2.5 shadow-raised',
              stuck && 'pointer-events-auto',
            )}
          >
            <LeagueLogo variant="shield" className="h-6 w-6 shrink-0" />
            <div className="relative z-[1] flex min-w-0 items-baseline gap-2">
              <span
                className="hidden text-[10px] font-black tracking-[1.2px] uppercase sm:inline"
                style={{ color: 'var(--accent-2)' }}
              >
                {kicker}
              </span>
              <span className="truncate text-[21px] font-black tracking-[-0.02em] text-white">
                {title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Background photo that quietly hides itself if the file is not present. */
function HeaderImage({ image }: { image: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- optional local backdrop, served directly */}
      <img
        src={image}
        alt=""
        aria-hidden
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      {/* Darkening scrim so any photo keeps text legible. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-[#0a0b10]/90 via-[#0a0b10]/45 to-[#0a0b10]/70"
      />
    </>
  );
}

/** Standard page wrapper: consistent max width and vertical rhythm. */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto flex w-full max-w-[1600px] flex-col gap-4', className)}>{children}</div>
  );
}
