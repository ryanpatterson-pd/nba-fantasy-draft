/**
 * League identity.
 *
 * Static configuration — edit here. There is no runtime theme or branding
 * editor; the site has one fixed look defined in app/globals.css.
 */
export const LEAGUE = {
  /** Full league name, shown in the sidebar and page titles. */
  name: 'Horn Pub Ligue 1',
  /** Short line under the league name. */
  subtitle: 'NBA Fantasy',
  /** One or two characters for the sidebar logo tile. */
  monogram: 'HP',
  /**
   * Brand artwork in public/league-logos.
   *  full   — shield + wordmark lockup
   *  shield — mark only (square-ish)
   *  word   — wordmark only
   * Only `full` exists today; the others fall back to it until added.
   */
  logos: {
    full: '/league-logos/hornpub-logo-full.png',
    shield: '/league-logos/hornpub-logo-shield.png',
    word: '/league-logos/hornpub-logo-word.png',
  },
} as const;
