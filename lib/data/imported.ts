import type { MatchupStage } from '@/lib/types';

/**
 * Shape of the generated season files in lib/data/seasons/.
 *
 * Written by scripts/espn-import.mjs and treated as read-only. Seeds, final
 * placings and team names are ESPN's own values; everything else the site shows
 * is derived from `matchups`.
 */

export type ImportedTeam = {
  managerId: string;
  espnTeamId: number;
  /** Team name for that season. These change year to year. */
  teamName: string;
  /**
   * ESPN division/conference id, when the league is split into conferences.
   * Matches an entry in {@link ImportedSeason.conferences}.
   */
  conferenceId?: string;
  /**
   * Home-and-away ladder position, 1-based (ESPN's `playoffSeed`). This is the
   * league's measure of a season; ESPN's post-placement `rankCalculatedFinal` is
   * recorded below for reference but is not used.
   */
  ladderPosition: number;
  /** ESPN's own totals, kept so the importer can assert against them. */
  espn: {
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    pointsAgainst: number;
    /** ESPN's final rank including placement games. Not used for stats. */
    finalRank: number;
  };
};

export type ImportedMatchup = {
  /** ESPN matchup period. Regular season runs 1..regularSeasonWeeks. */
  week: number;
  stage: MatchupStage;
  homeId: string;
  homeScore: number;
  awayId: string;
  awayScore: number;
};

export type ImportedSeason = {
  /** e.g. "2025-26" */
  id: string;
  /** ESPN's season number, one ahead of the start year. */
  espnSeasonId: number;
  /** e.g. "2025/26" */
  label: string;
  leagueName: string;
  /** e.g. "H2H_POINTS" */
  scoringType: string;
  regularSeasonWeeks: number;
  playoffTeams: number;
  /**
   * ESPN conferences (divisions), when the league is split into them. Each team
   * references one by `conferenceId`. Absent for seasons played as one group.
   */
  conferences?: ImportedConference[];
  teams: ImportedTeam[];
  matchups: ImportedMatchup[];
};

export type ImportedConference = {
  /** ESPN division id, as a string. */
  id: string;
  /** Division name, e.g. "Eastern Conference". */
  name: string;
};

/* --------------------------------------------------------- live / upcoming */

/**
 * One real fixture in the live/upcoming season, as ESPN has it scheduled.
 *
 * ESPN publishes the full home-and-away draw as soon as the league exists, so
 * these are the actual pairings — not a generated round-robin. `homeScore`,
 * `awayScore` and `winner` fill in as rounds are played; before a game they are
 * 0 / 0 / 'undecided'. Re-importing overwrites them, so a fixture ESPN moves is
 * reflected exactly on the next import.
 */
export type LiveFixture = {
  /** ESPN matchup period, 1-based, also the round/week number. */
  round: number;
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  /** Whose win it was, once decided. 'undecided' until the round is graded. */
  winner: 'home' | 'away' | 'tie' | 'undecided';
};

/**
 * One team's standing in the live/upcoming season, straight from ESPN's own
 * record. Used to render the conference ladders without re-deriving anything.
 */
export type LiveStanding = {
  managerId: string;
  /** ESPN division id, as a string. Matches a {@link ImportedConference}. */
  conferenceId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  /** ESPN's ladder seed within the standings, 0 before any game is played. */
  ladderPosition: number;
};

/**
 * The generated live/upcoming-season file (lib/data/upcoming.ts).
 *
 * Written by scripts/espn-import.mjs when importing the season ESPN currently
 * has open, and treated as read-only. Deliberately NOT part of the completed
 * `IMPORTED_SEASONS` list — it holds an in-progress season, so it must never
 * reach the history, records or all-time stats. The `/upcoming` page reads it
 * directly and falls back to a provisional draw when the file is absent.
 */
export type LiveSeason = {
  /** e.g. "2026-27" — matches the upcoming season's id. */
  id: string;
  /** ESPN's season number, one ahead of the start year. */
  espnSeasonId: number;
  /** e.g. "2026/27" */
  label: string;
  leagueName: string;
  regularSeasonWeeks: number;
  playoffTeams: number;
  /**
   * True once at least one game has been played (any decided fixture). Drives
   * the "season hasn't started" notice and whether the ladder shows real rows.
   */
  started: boolean;
  /** ISO timestamp of the import, shown as a "last updated" line. */
  importedAt: string;
  /** ESPN conferences (divisions). Both are always present for this league. */
  conferences: ImportedConference[];
  /** Every fixture in the season, in round then home-manager order. */
  fixtures: LiveFixture[];
  /** Per-team standings, in ladder order. */
  standings: LiveStanding[];
};
