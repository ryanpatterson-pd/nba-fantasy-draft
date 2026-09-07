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
