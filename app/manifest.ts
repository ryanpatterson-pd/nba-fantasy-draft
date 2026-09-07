import type { MetadataRoute } from 'next';
import { LEAGUE } from '@/lib/league';

/**
 * Web app manifest — drives "Add to Home Screen" / PWA install.
 *
 * Uses the league app icon and brand colours so a saved shortcut looks like a
 * real app: the icon on the home screen, the league name as the label, and the
 * charcoal theme behind the status bar / splash.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${LEAGUE.name} · NBA Fantasy`,
    short_name: LEAGUE.name,
    description:
      'The all-time database for our NBA fantasy league: history, records, trades and draft night.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0c10',
    theme_color: '#16171d',
    icons: [
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/app-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
