import type { Manager } from '@/lib/types';

/**
 * Everyone who has ever played in the league.
 *
 * Identities come from the ESPN member list. Team names are not here because
 * they change year to year — those live on each imported season and are read
 * with `teamNameFor()` / `latestTeamName()` in lib/stats/season.ts.
 *
 * Which managers played in a given season is derived from that season's data,
 * so people joining or leaving needs no change here beyond adding a row.
 *
 * `nickname` and `scout` are the only editorial fields — write whatever you like.
 */
export const MANAGERS: Manager[] = [
  {
    id: 'ryan',
    name: 'Ryan',
    fullName: 'Ryan Patterson',
    colours: { primary: '#ff7a1a', secondary: '#1c0a00' },
    nickname: 'The Commissioner',
    scout: '',
  },
  {
    id: 'andrew',
    name: 'Andrew',
    fullName: 'Andrew Starling',
    colours: { primary: '#e0562d', secondary: '#1c0600' },
    nickname: '',
    scout: '',
  },
  {
    id: 'luke',
    name: 'Luke',
    fullName: 'Luke Levey',
    colours: { primary: '#f2a83b', secondary: '#1e1200' },
    nickname: '',
    scout: '',
  },
  {
    id: 'dylan',
    name: 'Dylan',
    fullName: 'Dylan Cameron',
    colours: { primary: '#d99a4e', secondary: '#1c1200' },
    nickname: '',
    scout: '',
  },
  {
    id: 'laven',
    name: 'Laven',
    fullName: 'Laven Nathan',
    colours: { primary: '#c2703a', secondary: '#180900' },
    nickname: '',
    scout: '',
  },
  {
    id: 'aaron',
    name: 'Aaron',
    fullName: 'Aaron Sutherland',
    colours: { primary: '#e8871e', secondary: '#1c0d00' },
    nickname: '',
    scout: '',
  },
  {
    id: 'izzy',
    name: 'Izzy',
    fullName: 'Isaiah Luzares',
    colours: { primary: '#ff5c2b', secondary: '#1c0500' },
    nickname: '',
    scout: '',
  },
  {
    id: 'tuan',
    name: 'Tuan',
    fullName: 'Tuan Le',
    colours: { primary: '#a8552e', secondary: '#160600' },
    nickname: '',
    scout: '',
  },
  {
    id: 'daniel',
    name: 'Daniel',
    fullName: 'Daniel Starling',
    colours: { primary: '#ffb765', secondary: '#201200' },
    nickname: '',
    scout: '',
  },
  {
    id: 'tyler',
    name: 'Tyler',
    fullName: 'Tyler Halls-Ferguson',
    colours: { primary: '#f5cd7c', secondary: '#201800' },
    nickname: '',
    scout: '',
  },
  {
    id: 'jason',
    name: 'Jason',
    fullName: 'Jason Galbis',
    colours: { primary: '#9a9188', secondary: '#141210' },
    nickname: '',
    scout: '',
  },
  {
    id: 'nathan',
    name: 'Nathan',
    fullName: 'Nathan Moore',
    colours: { primary: '#8f6b4a', secondary: '#140c05' },
    nickname: '',
    scout: '',
  },
  {
    id: 'titian',
    name: 'Titian',
    fullName: 'Titian Nheu',
    colours: { primary: '#cf6a3c', secondary: '#1a0800' },
    nickname: '',
    scout: '',
    departed: true,
  },
  {
    id: 'imran',
    name: 'Imran',
    fullName: 'Imran Nishib',
    colours: { primary: '#6f7378', secondary: '#101112' },
    nickname: '',
    scout: '',
    departed: true,
  },
];

export const MANAGER_MAP: Record<string, Manager> = Object.fromEntries(
  MANAGERS.map((manager) => [manager.id, manager]),
);

export function getManager(id: string): Manager {
  const manager = MANAGER_MAP[id];
  if (!manager) throw new Error(`Unknown manager id: ${id}`);
  return manager;
}

/** Safe lookup for UI paths where the id may come from storage or a URL. */
export function findManager(id: string | undefined | null): Manager | undefined {
  return id ? MANAGER_MAP[id] : undefined;
}

export const MANAGER_IDS = MANAGERS.map((m) => m.id);

/**
 * Managers currently in the league — everyone who hasn't left.
 *
 * Use this for anything about the active/upcoming season (draft night in
 * particular). Historical views keep using the full `MANAGERS` list so departed
 * managers still show up in past seasons, all-time tables and brackets.
 */
export const ACTIVE_MANAGERS = MANAGERS.filter((m) => !m.departed);

export const ACTIVE_MANAGER_IDS = ACTIVE_MANAGERS.map((m) => m.id);
