'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar, type SidebarFooter } from '@/components/layout/Sidebar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { NAV_ITEMS, activeNavItem, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils/cn';

/** The four sections pinned to the mobile bottom bar, in order. */
const BOTTOM_NAV_HREFS = ['/', '/upcoming', '/teams', '/head-to-head'] as const;

/** Shorter labels so the five slots fit a phone width. */
const BOTTOM_NAV_LABELS: Record<string, string> = {
  '/': 'Dashboard',
  '/upcoming': '2027',
  '/teams': 'Teams',
  '/head-to-head': 'H2H',
};

/**
 * Application chrome: sticky rail plus a fluid content column.
 *
 * Content padding is 26px, matching the reference shell.
 */
export function AppShell({
  footer,
  children,
}: {
  footer: SidebarFooter;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The drawer is closed by the nav links and the scrim themselves, so no
  // route-change effect is needed here.
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = activeNavItem(pathname);

  // Land every navigation at the very top. Mobile browsers restore the previous
  // scroll position on client navigations, which left hero pages (team profile,
  // match preview) opening slightly scrolled down with the top of the header
  // image tucked under the sticky mobile bar. Turning off the browser's own
  // restoration and snapping to 0 on each route change fixes that.
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Instant, not smooth: globals.css sets scroll-behavior: smooth, and an
    // animated jump on every navigation would be jarring.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  const bottomItems = BOTTOM_NAV_HREFS.map((href) =>
    NAV_ITEMS.find((item) => item.href === href),
  ).filter((item): item is NavItem => Boolean(item));

  return (
    <div className="flex min-h-screen bg-app">
      <Sidebar footer={footer} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        {/* Mobile header. Sticks to the top on all screens so the menu button
            and page title stay reachable while scrolling. */}
        <header className="on-dark rail-wash sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/10 bg-white/5 text-ink-dim"
            aria-label="Open navigation"
          >
            <Icon name="dashboard" size={18} strokeWidth={2} />
          </button>
          <span className="panel-title">{active?.label ?? 'Dashboard'}</span>
        </header>

        {/* pb accounts for the fixed bottom bar on mobile so nothing hides
            behind it; safe-area inset keeps clear of the home indicator. */}
        <main className="min-w-0 max-w-full flex-1 overflow-x-clip p-4 pb-[calc(72px+env(safe-area-inset-bottom))] sm:p-[26px] sm:pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-[26px]">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="on-dark rail-wash fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(2,8,23,0.28)] lg:hidden"
      >
        {bottomItems.map((item) => (
          <BottomNavButton
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={BOTTOM_NAV_LABELS[item.href] ?? item.label}
            active={active?.href === item.href && !mobileOpen}
          />
        ))}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="More sections"
          aria-expanded={mobileOpen}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors',
            mobileOpen ? 'text-accent-2' : 'text-ink-mute hover:text-ink',
          )}
        >
          <Icon name="sliders" size={20} strokeWidth={2} />
          <span className="text-[10px] font-black tracking-[0.4px]">More</span>
        </button>
      </nav>
    </div>
  );
}

/** One tab in the mobile bottom bar. */
function BottomNavButton({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: IconName;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors',
        active ? 'text-accent-2' : 'text-ink-mute hover:text-ink',
      )}
    >
      <Icon name={icon} size={20} strokeWidth={2} />
      <span className="text-[10px] font-black tracking-[0.4px]">{label}</span>
    </Link>
  );
}
