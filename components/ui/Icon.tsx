import type { SVGProps } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Inline icon set.
 *
 * Hand-rolled rather than pulled from a package: the site needs about thirty
 * glyphs, they all inherit `currentColor` so they pick up whatever colour the
 * surrounding text uses, and it keeps the dependency list at zero.
 */

const ICONS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3v18" />
      <path d="M6 4.8c3 3.6 3 11 0 14.4M18 4.8c-3 3.6-3 11 0 14.4" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v4.5a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5.5A2.5 2.5 0 0 0 8 10M16 5.5h2.5A2.5 2.5 0 0 1 16 10" />
      <path d="M12 12.5V16M8.5 20h7M9.5 20l.6-4h3.8l.6 4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3.5 2" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v18H6.5A1.5 1.5 0 0 1 5 19.5z" />
      <path d="M5 17.5h14M9 3v14" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.5-5.5 5.5-5.5s5.5 2.3 5.5 5.5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 6.2M17.5 20c0-2.4-.9-4.3-2.4-5.5 3.1-.3 5.4 2 5.4 5.5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 7h10M18.5 7H20M4 17h4M12.5 17H20" />
      <circle cx="16" cy="7" r="2.2" />
      <circle cx="10" cy="17" r="2.2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </>
  ),
  'chevron-left': <path d="M14.5 5 8 12l6.5 7" />,
  'chevron-right': <path d="M9.5 5 16 12l-6.5 7" />,
  'chevron-down': <path d="M5 9.5 12 16l7-6.5" />,
  'chevron-up': <path d="M5 14.5 12 8l7 6.5" />,
  'arrow-right': (
    <>
      <path d="M4 12h15" />
      <path d="M13.5 6.5 20 12l-6.5 5.5" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M20 12H5" />
      <path d="M10.5 6.5 4 12l6.5 5.5" />
    </>
  ),
  'arrow-up': (
    <>
      <path d="M12 20V5" />
      <path d="M6.5 10.5 12 5l5.5 5.5" />
    </>
  ),
  'arrow-down': (
    <>
      <path d="M12 4v15" />
      <path d="M6.5 13.5 12 19l5.5-5.5" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.3 9.9l6.1-.8z" />,
  flame: (
    <>
      <path d="M12 2.5c4 3.7 5.5 6.4 5.5 9.4a5.5 5.5 0 0 1-11 0c0-1.8.7-3.2 1.8-4.4" />
      <path d="M12 20a2.6 2.6 0 0 0 2.6-2.6c0-1.6-1.3-2.5-2.6-4.4-1.3 1.9-2.6 2.8-2.6 4.4A2.6 2.6 0 0 0 12 20z" />
    </>
  ),
  shield: <path d="M12 3l8 2.8v5.9c0 4.9-3.4 8.2-8 9.3-4.6-1.1-8-4.4-8-9.3V5.8z" />,
  bolt: <path d="M13.5 2.5 5 13.5h5.5l-1 8L19 10h-6z" />,
  cloud: <path d="M7 18.5a4.2 4.2 0 0 1-.4-8.4A6 6 0 0 1 18 11.2a3.7 3.7 0 0 1-.6 7.3z" />,
  crack: <path d="M13 3l-3 6h4l-4 5h3.5l-2.5 7" />,
  spoon: (
    <>
      <ellipse cx="14.5" cy="7" rx="4" ry="5" transform="rotate(30 14.5 7)" />
      <path d="M11 11 5 20" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  'trend-down': (
    <>
      <path d="M4 7l7 7 3-3 6 6" />
      <path d="M20 12v5h-5" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8.5h13M13.5 5 17 8.5 13.5 12" />
      <path d="M20 15.5H7M10.5 12 7 15.5 10.5 19" />
    </>
  ),
  clown: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12.5" r="1.6" />
      <path d="M8 15.5c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4" />
      <path d="M8.5 9.5h.01M15.5 9.5h.01" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14.5" r="5.5" />
      <path d="M8.5 9.5 6 3h5l2 4M15.5 9.5 18 3h-5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4.5 19h15" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V3.5" />
      <path d="M7.5 8 12 3.5 16.5 8" />
      <path d="M4.5 19h15" />
    </>
  ),
  check: <path d="M5 12.5 10 17.5 19.5 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  wheel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v8.5l7.5 4.2M12 12 4.5 16.2" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5l1.7 4.8 4.8 1.7-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7z" />
      <path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M7 19V11M12 19V6M17 19v-5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5h11l-2 4 2 4H6" />
    </>
  ),
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3.5-4 3.5h-1.5a2 2 0 0 0-1.3 3.5A2 2 0 0 1 12 21z" />
      <path d="M7.5 10h.01M11 7h.01M15.5 8.5h.01" />
    </>
  ),
  crown: (
    <>
      <path d="M3.5 7.5 7 12l5-7 5 7 3.5-4.5-1.5 11h-14z" />
      <path d="M5 20.5h14" />
    </>
  ),
  fire: (
    <>
      <path d="M12 2.5c4 3.7 5.5 6.4 5.5 9.4a5.5 5.5 0 0 1-11 0c0-1.8.7-3.2 1.8-4.4" />
    </>
  ),
  // Championship ring: a band with a raised jewel on top.
  ring: (
    <>
      <circle cx="12" cy="15" r="5.5" />
      <path d="M9 10.2 10.4 6h3.2L15 10.2" />
      <path d="m12 12.6 1.4 1.4-1.4 1.4-1.4-1.4z" />
    </>
  ),
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof ICONS;

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  size?: number;
  strokeWidth?: number;
};

export function Icon({ name, size = 18, strokeWidth = 1.6, className, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
      {...rest}
    >
      {ICONS[name]}
    </svg>
  );
}

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
