import { liveSeason } from '@/lib/data/upcoming';
import { getImportedSeason, UPCOMING_PARTICIPANTS, UPCOMING_SEASON } from '@/lib/data/seasons';

/**
 * Conferences for the upcoming season.
 *
 * ESPN splits the league into two conferences (divisions). Until the {@link
 * UPCOMING_SEASON} is drafted and imported there is no official split to read,
 * so a provisional one is defined here and can be edited before the season
 * starts. Once the real season is imported — with `conferences` populated from
 * ESPN's `divisionId`s — that takes over automatically.
 */

export type Conference = {
  id: string;
  name: string;
  /** Manager ids in this conference. */
  managerIds: string[];
};

/**
 * Provisional split.
 *
 * Alternates the upcoming field into two even conferences by finishing order so
 * each side is roughly balanced. Replace the id lists by hand if you want a
 * specific split before the draft; the real one lands with the ESPN import.
 */
function provisionalConferences(): Conference[] {
  const east: string[] = [];
  const west: string[] = [];
  UPCOMING_PARTICIPANTS.forEach((id, index) => {
    (index % 2 === 0 ? east : west).push(id);
  });
  return [
    { id: 'east', name: 'Eastern Conference', managerIds: east },
    { id: 'west', name: 'Western Conference', managerIds: west },
  ];
}

/**
 * Conferences taken from an imported season, if it carries them.
 *
 * When `scripts/espn-import.mjs` imports the upcoming season it records each
 * team's ESPN division, which is grouped into conferences on the season file.
 */
function importedConferences(): Conference[] | undefined {
  const imported = getImportedSeason(UPCOMING_SEASON.id);
  if (!imported?.conferences?.length) return undefined;

  return imported.conferences.map((conference) => ({
    id: conference.id,
    name: conference.name,
    managerIds: imported.teams
      .filter((team) => team.conferenceId === conference.id)
      .sort((a, b) => a.ladderPosition - b.ladderPosition)
      .map((team) => team.managerId),
  }));
}

/**
 * Conferences from the imported live/upcoming season, if it has been imported.
 *
 * This is the real ESPN division split, with each conference's managers in
 * ESPN's own ladder order.
 */
function liveConferences(): Conference[] | undefined {
  if (!liveSeason.conferences?.length || !liveSeason.standings?.length) return undefined;

  return liveSeason.conferences.map((conference) => ({
    id: conference.id,
    name: conference.name,
    managerIds: liveSeason.standings
      .filter((team) => team.conferenceId === conference.id)
      .map((team) => team.managerId),
  }));
}

/** The conferences shown on the upcoming-season ladder. */
export const UPCOMING_CONFERENCES: Conference[] =
  liveConferences() ?? importedConferences() ?? provisionalConferences();

/** One team's row on the live conference ladder. */
export type LadderStanding = {
  managerId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
};

/**
 * Real standings per conference from the imported live season, keyed by
 * conference id. Empty when the season has not been imported yet, in which case
 * the ladder falls back to zeroed placeholder rows.
 */
export const UPCOMING_STANDINGS: Record<string, LadderStanding[]> = Object.fromEntries(
  (liveSeason.conferences ?? []).map((conference) => [
    conference.id,
    (liveSeason.standings ?? [])
      .filter((team) => team.conferenceId === conference.id)
      .map((team) => ({
        managerId: team.managerId,
        wins: team.wins,
        losses: team.losses,
        ties: team.ties,
        pointsFor: team.pointsFor,
      })),
  ]),
);

/** True once at least one game in the live season has been decided. */
export const UPCOMING_STARTED: boolean = Boolean(liveSeason.started);
