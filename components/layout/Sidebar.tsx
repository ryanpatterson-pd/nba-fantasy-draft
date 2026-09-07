'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { Icon } from '@/components/ui/Icon';
import { LEAGUE } from '@/lib/league';
import { NAV_ITEMS, activeNavItem } from '@/lib/nav';
import { createPersistentStore } from '@/lib/storage/persistent-store';
import { cn } from '@/lib/utils/cn';

export const COLLAPSE_KEY = 'nbafd.sidebar.collapsed';

/** Collapsed state persists so the rail stays how you left it. */
const collapseStore = createPersistentStore<boolean>(COLLAPSE_KEY, false, {
  deserialize: (raw) => (typeof raw === 'boolean' ? raw : null),
});

export type SidebarFooter = {
  /** Tiny letterspaced label, e.g. "ALL-TIME LEADER". */
  label: string;
  /** Neutral tag beside the label. */
  tag: string;
  /** Bold one-liner. */
  headline: string;
  /** Small supporting line. */
  detail: string;
  /** 0–1, drives the meter along the bottom. */
  progress: number;
};

/**
 * Navigation rail.
 *
 * Structure and metrics follow the reference design: 104px brand header with a
 * hairline beneath it, 46px nav rows at weight 800, an accent gradient pill with
 * a lit top edge for the active item, and the collapse control pinned to the
 * bottom. `on-dark` rebinds the colour tokens so shared utilities read correctly.
 */
export function Sidebar({
  footer,
  mobileOpen,
  onCloseMobile,
}: {
  footer: SidebarFooter;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(
    collapseStore.subscribe,
    collapseStore.getSnapshot,
    collapseStore.getServerSnapshot,
  );
  const [query, setQuery] = useState('');

  const active = activeNavItem(pathname);
  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) || item.blurb.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <>
      {/* Mobile scrim */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/45 transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
        aria-hidden
      />

      <aside
        className={cn(
          'on-dark rail-wash fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col overflow-hidden',
          'border-r border-white/10 shadow-[14px_0_40px_rgba(2,8,23,.22)]',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          'transition-[width,transform,padding] duration-[220ms] ease-out',
          collapsed ? 'lg:w-[84px] lg:px-3' : 'lg:w-[250px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ paddingTop: 18, paddingBottom: 18, paddingLeft: collapsed ? undefined : 14, paddingRight: collapsed ? undefined : 14 }}
      >
        {/* Brand header */}
        <div
          className={cn(
            'mb-3.5 flex items-center justify-center border-b border-white/10 pt-2 pb-4',
            collapsed ? 'h-[112px]' : 'h-[152px]',
          )}
        >
          <Link
            href="/"
            onClick={onCloseMobile}
            aria-label={LEAGUE.name}
            className="flex min-w-0 items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,.22)]"
          >
            {/* Collapsed rail shows the shield mark only; expanded shows the
                full lockup. Both fall back gracefully if the art is missing. */}
            <LeagueLogo
              variant={collapsed ? 'shield' : 'full'}
              className={collapsed ? 'h-16 w-16' : 'max-h-[112px] w-auto'}
            />
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            className="absolute top-4 right-3 grid h-9 w-9 place-items-center rounded-[14px] border border-white/10 bg-white/5 text-ink-dim lg:hidden"
            aria-label="Close navigation"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Search */}
        <div className={cn('mb-4', collapsed && 'lg:hidden')}>
          <div className="relative">
            <Icon
              name="search"
              size={15}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-mute"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search league"
              aria-label="Search navigation"
              className={cn(
                'nav-label h-[44px] w-full rounded-[14px] border border-white/10 bg-white/[0.055] pr-3.5 pl-10',
                'text-ink placeholder:font-medium placeholder:text-ink-mute',
                'transition duration-[180ms] focus:border-white/20 focus:bg-white/[0.09] focus:outline-none',
              )}
            />
          </div>
        </div>

        {/* Nav — one flat list */}
        <nav className="grid gap-1.5 overflow-y-auto">
          {items.map((item) => {
            const isActive = active?.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'nav-label flex min-h-[46px] w-full items-center gap-[11px] rounded-[14px] border px-[13px] py-3 text-left transition duration-[180ms]',
                  collapsed && 'lg:justify-center lg:gap-0 lg:px-0',
                  isActive
                    ? 'accent-solid'
                    : 'border-transparent bg-transparent text-ink-dim hover:border-white/10 hover:bg-white/[0.065] hover:text-ink',
                )}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  strokeWidth={2}
                  className={isActive ? 'text-white' : 'text-ink-mute'}
                />
                <span className={cn('truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            );
          })}
          {items.length === 0 && (
            <p className="px-1 text-[13px] font-semibold text-ink-mute">
              No sections match “{query}”.
            </p>
          )}
        </nav>

        {/* Collapse control, pinned to the bottom */}
        <button
          type="button"
          onClick={() => collapseStore.set((previous) => !previous)}
          className={cn(
            'mt-auto mb-3 hidden min-h-[44px] w-full items-center justify-center gap-2.5 rounded-[14px]',
            'border border-white/10 bg-white/[0.055] text-[13px] font-extrabold text-ink-dim',
            'transition duration-[180ms] hover:bg-white/10 hover:text-ink lg:flex',
          )}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} strokeWidth={2.4} />
          <span className={cn(collapsed && 'lg:hidden')}>Collapse</span>
        </button>

        {/* Footer highlight */}
        <div className={cn(collapsed && 'lg:hidden')}>
          <div className="overflow-hidden rounded-[14px] border border-white/10 bg-white/[0.055]">
            <div className="px-3.5 pt-3 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[1.2px] text-accent-deep uppercase">
                  {footer.label}
                </span>
                <span className="rounded-[5px] bg-white/10 px-1.5 py-px text-[9px] font-black tracking-[0.8px] text-ink-mute uppercase">
                  {footer.tag}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-snug font-extrabold tracking-[-0.015em] text-ink">
                {footer.headline}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-ink-dim">{footer.detail}</p>
            </div>
            <div className="h-[3px] w-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-accent to-accent-2"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, footer.progress)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
