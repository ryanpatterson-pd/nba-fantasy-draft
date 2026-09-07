import type { IconName } from '@/components/ui/Icon';

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  blurb: string;
};

/**
 * A single flat list, matching the reference layout — no group headings.
 * Order is the order it appears in the rail.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: 'dashboard',
    blurb: 'Live snapshot of the league, the ladder and the countdown.',
  },
  {
    href: '/upcoming',
    label: '2027 Season',
    icon: 'calendar',
    blurb: 'Every round of the upcoming season, with a preview for each match.',
  },
  {
    href: '/draft',
    label: 'Draft Night',
    icon: 'dice',
    blurb: 'Games, points, lottery odds and the wheel.',
  },
  {
    href: '/trades',
    label: 'Trades',
    icon: 'swap',
    blurb: 'Every trade in league history, who sent what to whom.',
  },
  {
    href: '/history',
    label: 'League History',
    icon: 'clock',
    blurb: 'Every season, every champion, every grand final.',
  },
  {
    href: '/teams',
    label: 'Teams',
    icon: 'users',
    blurb: 'All twelve managers and their full career records.',
  },
  {
    href: '/head-to-head',
    label: 'Head to Head',
    icon: 'grid',
    blurb: 'The all-time matrix. Every rivalry, settled.',
  },
  {
    href: '/records',
    label: 'Record Book',
    icon: 'book',
    blurb: 'Permanent highs, lows and statistical ammunition.',
  },
];

/** Longest-prefix match so nested routes keep their parent highlighted. */
export function activeNavItem(pathname: string): NavItem | undefined {
  if (pathname === '/') return NAV_ITEMS.find((item) => item.href === '/');
  return NAV_ITEMS.filter((item) => item.href !== '/' && pathname.startsWith(item.href)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}
