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
    // Only the full lockup exists so far, so the shield/word variants point at
    // it too. Drop dedicated crops in public/league-logos and update these
    // paths when you have them.
    shield: '/league-logos/hornpub-logo-full.png',
    word: '/league-logos/hornpub-logo-full.png',
  },
} as const;
