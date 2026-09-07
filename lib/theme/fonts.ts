import { Inter } from 'next/font/google';

/**
 * Typography — Inter, variable axis.
 *
 * Loaded as a variable font (no `weight` array) because the reference design
 * uses the full range including non-standard steps: table cells sit at 750,
 * labels and micro caps at 900.
 *
 * Self-hosted by Next at build time — no runtime request to Google.
 */
export const uiFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const fontClassNames = uiFont.variable;
