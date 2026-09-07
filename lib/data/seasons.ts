import type { Season } from '@/lib/types';
import type { ImportedSeason } from './imported';
import { season as season2021 } from './seasons/2021-22';
import { season as season2022 } from './seasons/2022-23';
import { season as season2023 } from './seasons/2023-24';
import { season as season2024 } from './seasons/2024-25';
import { season as season2025 } from './seasons/2025-26';

/**
 * Season registry.
 *
 * Completed seasons come from the generated files in lib/data/seasons/, written
 * by scripts/espn-import.mjs. Add a season by importing it here — nothing else
 * needs to change.
 *
 * The upcoming season is configured by hand because it has no results yet; it is
 * what drives the draft-night countdown and tools.
 */
export const IMPORTED_SEASONS: ImportedSeason[] = [
  season2021,
  season2022,
  season2023,
  season2024,
  season2025,
];

export const IMPORTED_SEASON_MAP: Record<string, ImportedSeason> = Object.fromEntries(
  IMPORTED_SEASONS.map((season) => [season.id, season]),
);

/** The season the draft-night tools operate on. */
const UPCOMING: Season = {
  id: '2026-27',
  label: '2026/27',
  startYear: 2026,
  regularSeasonWeeks: 19,
  playoffTeams: 6,
  status: 'upcoming',
  draftDate: '2026-10-09T19:00:00+11:00',
  headline: 'Draft weekend. Ten games, twelve managers, one selection order.',
};

function toSeason(imported: ImportedSeason): Season {
  return {
    id: imported.id,
    label: imported.label,
    startYear: imported.espnSeasonId - 1,
    regularSeasonWeeks: imported.regularSeasonWeeks,
    playoffTeams: imported.playoffTeams,
    status: 'complete',
  };
}

export const SEASONS: Season[] = [
  ...IMPORTED_SEASONS.map(toSeason).sort((a, b) => a.startYear - b.startYear),
  UPCOMING,
];

export const COMPLETED_SEASONS = SEASONS.filter((s) => s.status === 'complete');

export const ACTIVE_SEASON = SEASONS.find((s) => s.status !== 'complete') ?? SEASONS[SEASONS.length - 1];

export const LATEST_COMPLETED_SEASON = COMPLETED_SEASONS[COMPLETED_SEASONS.length - 1];

export function getSeason(id: string): Season | undefined {
  return SEASONS.find((s) => s.id === id);
}

export function getImportedSeason(id: string): ImportedSeason | undefined {
  return IMPORTED_SEASON_MAP[id];
}

/** Manager ids that actually played in a season, in final-standings order. */
export function participantsOf(seasonId: string): string[] {
  return (IMPORTED_SEASON_MAP[seasonId]?.teams ?? []).map((team) => team.managerId);
}

/** Field size for a season — not assumed to be 12 forever. */
export function fieldSizeOf(seasonId: string): number {
  return IMPORTED_SEASON_MAP[seasonId]?.teams.length ?? 0;
}

/** The league name as ESPN had it for the most recent imported season. */
export const LEAGUE_NAME = IMPORTED_SEASONS[IMPORTED_SEASONS.length - 1]?.leagueName ?? '';

/**
 * The field for the upcoming season.
 *
 * Defaults to whoever played the most recent completed season, in that season's
 * finishing order. Edit this list when someone joins or drops out — the fixture
 * list and every preview are generated from it.
 */
export const UPCOMING_PARTICIPANTS: string[] = participantsOf(LATEST_COMPLETED_SEASON.id);

/** The season the fixture list is generated for. */
export const UPCOMING_SEASON = UPCOMING;
