/** Core domain types for the league database. */

export type ManagerId = string;
export type SeasonId = string;

export type Manager = {
  id: ManagerId;
  /** Display name, used everywhere in the UI. */
  name: string;
  /** Full name from the ESPN member list. */
  fullName: string;
  /** Team colours, used for charts, wheel segments and avatars. */
  colours: { primary: string; secondary: string };
  /** Short scouting-report style line for the profile page. Optional. */
  scout: string;
  /** Nickname used in profile copy. Optional. */
  nickname: string;
  /**
   * True for managers who have left the league. They stay in the database and
   * appear everywhere historical (season tables, all-time ladders, brackets),
   * but are excluded from the active roster used for draft night.
   */
  departed?: boolean;
};

/**
 * Where a game sat in the season.
 *
 * Only the home-and-away season and the championship bracket exist here. ESPN's
 * consolation / placement ladders are not imported at all — this league does not
 * count them, so they cannot reach any statistic.
 */
export type MatchupStage = 'regular' | 'quarter' | 'semi' | 'final' | 'playoff';

export type Matchup = {
  seasonId: SeasonId;
  week: number;
  stage: MatchupStage;
  homeId: ManagerId;
  awayId: ManagerId;
  homeScore: number;
  awayScore: number;
};

export type SeasonStatus = 'complete' | 'live' | 'upcoming';

export type Season = {
  id: SeasonId;
  /** Display label, e.g. "2025/26". */
  label: string;
  startYear: number;
  regularSeasonWeeks: number;
  playoffTeams: number;
  status: SeasonStatus;
  /** ISO date of that season's draft night, when known. */
  draftDate?: string;
  /** Optional editorial line. Pages fall back to derived facts without it. */
  headline?: string;
};

export type SeasonResultLabel =
  | 'champion'
  | 'runner-up'
  | 'semi-finalist'
  | 'quarter-finalist'
  | 'missed-playoffs';

/** A manager's completed record within one season. */
export type SeasonRecord = {
  seasonId: SeasonId;
  managerId: ManagerId;
  /** The team name used that season. */
  teamName: string;
  /** Regular season only. */
  wins: number;
  losses: number;
  /** Drawn games. The league has had one, in 2022/23. */
  ties: number;
  playoffWins: number;
  playoffLosses: number;
  /** Regular season points. */
  pointsFor: number;
  pointsAgainst: number;
  /**
   * Position on the home-and-away ladder, 1-based. This is how the league
   * judges a season: the wooden spoon is last here, not last after placement
   * games. Doubles as the playoff seed.
   */
  ladderPosition: number;
  /** Field size that season — 10 in 2021/22, 12 since. */
  fieldSize: number;
  madePlayoffs: boolean;
  result: SeasonResultLabel;
  /** Longest winning streak across the whole season. */
  bestStreak: number;
  highestWeek: number;
  lowestWeek: number;
  avgScore: number;
};

export type AllTimeRecord = {
  managerId: ManagerId;
  seasonsPlayed: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  /** Ties count as half a win, matching ESPN's percentage. */
  winPct: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  avgScore: number;
  titles: number;
  finalsAppearances: number;
  playoffAppearances: number;
  /** Best, worst and mean home-and-away ladder position. */
  bestLadder: number;
  worstLadder: number;
  avgLadder: number;
  highestWeek: number;
  lowestWeek: number;
  longestWinStreak: number;
  regularSeasonCrowns: number;
  woodenSpoons: number;
  /** Championship-round record, e.g. 1-3. */
  finalsRecord: { wins: number; losses: number; ties: number };
  playoffRecord: { wins: number; losses: number; ties: number };
};

export type HeadToHead = {
  managerId: ManagerId;
  opponentId: ManagerId;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  games: number;
};

/* ------------------------------------------------------------------ trades */

/** A single player that changed hands in a trade. */
export type TradePlayer = {
  /** ESPN player id, kept so the importer stays idempotent. */
  playerId: number;
  /** Full player name, resolved at import time. */
  name: string;
};

/** One manager's side of a trade: who they are and what they received. */
export type TradeSide = {
  managerId: ManagerId;
  /** Players this manager received in the deal. May be empty for a one-way
   *  move — ESPN's activity feed does not always retain the return leg. */
  receives: TradePlayer[];
};

/**
 * An accepted trade, reconstructed from ESPN's league activity feed.
 *
 * Written by scripts/espn-trades-import.mjs into lib/data/trades.ts and treated
 * as read-only. Each trade is between two managers; `sideA.receives` are the
 * players that went to sideA (i.e. came from sideB) and vice versa.
 */
export type Trade = {
  id: string;
  seasonId: SeasonId;
  /** Display label for the season, e.g. "2023/24". */
  seasonLabel: string;
  /** ISO timestamp ESPN processed the trade. */
  date: string;
  sideA: TradeSide;
  sideB: TradeSide;
};

/* ------------------------------------------------------------- draft night */

export type GameFormat = 'skill' | 'luck' | 'hybrid';

/** Whether a low raw score or a high one is better. */
export type ScoreDirection = 'lower-wins' | 'higher-wins';

/**
 * How a raw score is typed in and displayed.
 *
 *  time     seconds, entered as `48.21` or `1:12.5`
 *  number   a count or a measurement (makes, strokes, centimetres)
 *  placing  the finishing position itself, 1–12, for bracket or draw events
 */
export type ScoreFormat = 'time' | 'number' | 'placing';

export type ScoringRule = {
  direction: ScoreDirection;
  format: ScoreFormat;
  /** Shown beside the input, e.g. "seconds", "makes", "cm". */
  unit: string;
  /** Plain-English rule read out on the night. */
  rule: string;
  /** Decimal places used when displaying a `number` score. */
  decimals?: number;
};

export type DraftGame = {
  id: string;
  order: number;
  name: string;
  format: GameFormat;
  /** What you actually do. */
  description: string;
  scoring: ScoringRule;
  /** Human-friendly slot, e.g. "Sat · 11:00". */
  slot: string;
  venue: string;
};

/**
 * Live result for one game: the raw score each manager posted.
 *
 * Placings and points are always derived from these scores (see
 * lib/draft/scoring.ts) rather than stored, so a corrected score instantly
 * reshuffles the placings and the ladder.
 */
export type GameResult = {
  gameId: string;
  /** Raw score per manager. A missing key means "not entered yet". */
  scores: Record<ManagerId, number>;
  completedAt: string | null;
};

/** A manager's derived result in one game. */
export type GamePlacing = {
  managerId: ManagerId;
  score: number;
  /** 1-based. Tied scores share the same placing. */
  placing: number;
  /** Points earned. Tied managers split the points for the slots they occupy. */
  points: number;
  /** True when at least one other manager posted the same score. */
  tied: boolean;
};

export type DraftPick = {
  pick: number;
  managerId: ManagerId;
};

export type LotteryWeighting = 'points' | 'squared' | 'rank';

export type DraftNightState = {
  version: 2;
  seasonId: SeasonId;
  results: Record<string, GameResult>;
  picks: DraftPick[];
  weighting: LotteryWeighting;
};
