import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { PhotoViewerProvider } from '@/components/ui/PhotoViewer';
import { LEAGUE } from '@/lib/league';
import { fontClassNames } from '@/lib/theme/fonts';
import { getManager } from '@/lib/data/managers';
import { sortAllTime } from '@/lib/stats/all-time';
import { num, pct, record } from '@/lib/utils/format';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${LEAGUE.name} · NBA Fantasy League`,
    template: `%s · ${LEAGUE.name}`,
  },
  description:
    'The permanent home of our NBA fantasy league: full all-time database, season history, every trade and the draft night games and lottery.',
  openGraph: {
    title: `${LEAGUE.name} · NBA Fantasy League`,
    description: 'All-time records, league trades and the draft lottery.',
    images: ['/og.png'],
  },
  // The league app icon drives the browser favicon and the iOS home-screen icon.
  icons: {
    icon: [{ url: '/app-icon.png', type: 'image/png', sizes: '512x512' }],
    shortcut: ['/app-icon.png'],
    apple: [{ url: '/app-icon.png', sizes: '512x512' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#16171d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The rail footer carries a live headline stat rather than a static blurb.
  const leader = sortAllTime('winPct')[0];
  const footer = {
    label: 'All-time leader',
    tag: 'Win rate',
    headline: `${getManager(leader.managerId).name} leads on ${pct(leader.winPct)}`,
    detail: `${record(leader.wins, leader.losses, leader.ties)} from ${num(leader.gamesPlayed)} matchups`,
    progress: leader.winPct,
  };

  return (
    <html lang="en-AU" className={fontClassNames}>
      <body>
        <SplashScreen />
        <PhotoViewerProvider>
          <AppShell footer={footer}>{children}</AppShell>
        </PhotoViewerProvider>
      </body>
    </html>
  );
}
