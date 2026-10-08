/**
 * League fantasy scoring engine.
 *
 * These weights are our league's exact scoring settings (Horn Pub Ligue 1),
 * taken straight from the ESPN league settings page. Every projection on the
 * War Room draft board is scored through this one function so the board always
 * reflects how *we* actually score points — not ESPN's generic default ranking.
 *
 * ESPN matchups run over a 7-day period with multiple games per player, so two
 * numbers matter and the board surfaces both:
 *   - perGame:  fantasy points in a single game (efficiency / ceiling)
 *   - perWeek:  perGame × games in a typical week (volume — the number that
 *               actually wins h2h weeks, which is why availability + games
 *               played are weighted so heavily in the ranking model)
 */

/** Per-stat point values. Edit here if the league ever re-scores. */
export const SCORING = {
  fgm: 2, // Field goals made
  fga: -1, // Field goals attempted
  ftm: 1, // Free throws made
  fta: -1, // Free throws attempted
  tpm: 1, // Three pointers made
  reb: 1, // Rebounds
  ast: 2, // Assists
  stl: 4, // Steals
  blk: 4, // Blocks
  to: -2, // Turnovers
  pf: -1, // Personal fouls
  dd: 7, // Double-doubles
  td: 12, // Triple-doubles
  qd: 25, // Quadruple-doubles (basically never, kept for completeness)
  pts: 1, // Points
  tw: 5, // Team win (awarded to the fantasy team, not the player — see note)
} as const;

/** Human-readable rows for the scoring reference panel. */
export const SCORING_ROWS: { label: string; abbr: string; value: number }[] = [
  { label: 'Field Goals Made', abbr: 'FGM', value: SCORING.fgm },
  { label: 'Field Goals Attempted', abbr: 'FGA', value: SCORING.fga },
  { label: 'Free Throws Made', abbr: 'FTM', value: SCORING.ftm },
  { label: 'Free Throws Attempted', abbr: 'FTA', value: SCORING.fta },
  { label: 'Three Pointers Made', abbr: '3PM', value: SCORING.tpm },
  { label: 'Rebounds', abbr: 'REB', value: SCORING.reb },
  { label: 'Assists', abbr: 'AST', value: SCORING.ast },
  { label: 'Steals', abbr: 'STL', value: SCORING.stl },
  { label: 'Blocks', abbr: 'BLK', value: SCORING.blk },
  { label: 'Turnovers', abbr: 'TO', value: SCORING.to },
  { label: 'Personal Fouls', abbr: 'PF', value: SCORING.pf },
  { label: 'Double Doubles', abbr: 'DD', value: SCORING.dd },
  { label: 'Triple Doubles', abbr: 'TD', value: SCORING.td },
  { label: 'Points', abbr: 'PTS', value: SCORING.pts },
  { label: 'Team Win', abbr: 'TW', value: SCORING.tw },
];

/**
 * A per-game statistical projection for one player.
 *
 * Everything is a per-game average (ESPN projected pace), which is how the
 * source projections are published. Rate fields (fgPct, ftPct) let us derive
 * makes from attempts so the negative FGA/FTA weights bite realistically.
 */
export type StatLine = {
  /** Points per game. */
  pts: number;
  /** Rebounds per game. */
  reb: number;
  /** Assists per game. */
  ast: number;
  /** Steals per game. */
  stl: number;
  /** Blocks per game. */
  blk: number;
  /** Turnovers per game. */
  to: number;
  /** Three-pointers made per game. */
  tpm: number;
  /** Field goals attempted per game. */
  fga: number;
  /** Field goal percentage, 0-1. */
  fgPct: number;
  /** Free throws attempted per game. */
  fta: number;
  /** Free throw percentage, 0-1. */
  ftPct: number;
  /** Personal fouls per game. */
  pf: number;
  /** Expected double-doubles rate per game, 0-1 (probability a game is a DD). */
  ddRate: number;
  /** Expected triple-doubles rate per game, 0-1. */
  tdRate: number;
};

/**
 * Fantasy points for a single game from a per-game projection.
 *
 * Team wins (TW) are excluded here: they're a fantasy-team outcome, not a
 * player stat, so they can't be attributed to an individual projection. They
 * still matter for the league, they just don't belong in a per-player value.
 */
export function fantasyPointsPerGame(line: StatLine): number {
  const fgm = line.fga * line.fgPct;
  const ftm = line.fta * line.ftPct;

  const scoring =
    fgm * SCORING.fgm +
    line.fga * SCORING.fga +
    ftm * SCORING.ftm +
    line.fta * SCORING.fta +
    line.tpm * SCORING.tpm +
    line.reb * SCORING.reb +
    line.ast * SCORING.ast +
    line.stl * SCORING.stl +
    line.blk * SCORING.blk +
    line.to * SCORING.to +
    line.pf * SCORING.pf +
    line.pts * SCORING.pts;

  const bonuses = line.ddRate * SCORING.dd + line.tdRate * SCORING.td;

  return scoring + bonuses;
}

/** ESPN weeks are ~7 days; most players get 3-4 games, a few get 2 or 5. */
export const DEFAULT_GAMES_PER_WEEK = 3.5;

/**
 * Fantasy points across a typical scoring week.
 *
 * Volume, not efficiency, wins head-to-head weeks: a player who plays four
 * games at a modest per-game value will out-score a spectacular player who
 * plays two. `gamesPerWeek` defaults to the league average but a player's own
 * durability (games projected / 82) nudges it in the ranking model.
 */
export function fantasyPointsPerWeek(line: StatLine, gamesPerWeek = DEFAULT_GAMES_PER_WEEK): number {
  return fantasyPointsPerGame(line) * gamesPerWeek;
}
