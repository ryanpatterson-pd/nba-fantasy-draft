/**
 * ESPN season importer.
 *
 *   node --env-file=.env.local scripts/espn-import.mjs <espnSeasonId>
 *
 * Fetches one season from the ESPN fantasy API and writes a typed data file to
 * lib/data/seasons/<id>.ts. The generated file is the source of truth for that
 * season — every stat on the site is derived from its matchup list.
 *
 * ESPN's own win/loss and points totals are captured alongside so the app can
 * assert its derived figures against them (see lib/data/league.ts).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
// The live/upcoming season is imported in a separate mode: it has no completed
// results, so the strict "derived record must equal ESPN" verification the
// completed path runs would always fail. `--live` writes lib/data/upcoming.ts
// instead of a completed-season file and skips that verification.
const LIVE = args.includes('--live');
const ESPN_SEASON = Number(args.find((a) => !a.startsWith('--')) ?? 2026);
const LEAGUE = process.env.ESPN_LEAGUE_ID;

if (!LEAGUE) {
  console.error('ESPN_LEAGUE_ID is not set. Run with --env-file=.env.local');
  process.exit(1);
}
if (!process.env.ESPN_S2 || !process.env.SWID) {
  console.error('ESPN_S2 / SWID are not set. Run with --env-file=.env.local');
  process.exit(1);
}

const OWNERS = JSON.parse(readFileSync('scripts/espn-managers.json', 'utf8'));

const swid = process.env.SWID.startsWith('{') ? process.env.SWID : `{${process.env.SWID}}`;
const url =
  `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${ESPN_SEASON}` +
  `/segments/0/leagues/${LEAGUE}?view=mTeam&view=mSettings&view=mMatchupScore&view=mScoreboard`;

const response = await fetch(url, {
  headers: {
    accept: 'application/json',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    cookie: `espn_s2=${process.env.ESPN_S2}; SWID=${swid}`,
  },
});

if (!response.ok) {
  console.error(`ESPN returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  process.exit(1);
}

const payload = await response.json();

/* ---------------------------------------------------------------- metadata */

const settings = payload.settings ?? {};
const schedule = settings.scheduleSettings ?? {};
const regularSeasonWeeks = schedule.matchupPeriodCount;
const playoffTeams = schedule.playoffTeamCount;

// ESPN conferences (divisions). Only meaningful when the league runs more than
// one; a single-division league is left without conferences on the season file.
const rawDivisions = schedule.divisions ?? [];
const conferences =
  rawDivisions.length > 1
    ? rawDivisions.map((division) => ({
        id: String(division.id),
        name: (division.name ?? '').trim() || `Division ${division.id}`,
      }))
    : [];

const startYear = ESPN_SEASON - 1;
const seasonId = `${startYear}-${String(ESPN_SEASON).slice(2)}`;
const label = `${startYear}/${String(ESPN_SEASON).slice(2)}`;

if (!regularSeasonWeeks) {
  console.error('Could not read matchupPeriodCount from settings — aborting.');
  process.exit(1);
}

/* -------------------------------------------------- live / upcoming season */

if (LIVE) {
  importLiveSeason();
  process.exit(0);
}

/**
 * Writes lib/data/upcoming.ts from the in-progress season ESPN currently has
 * open. Reads the real home-and-away draw, the real division split and each
 * team's live record, and marks the season started once any game is decided.
 *
 * This is deliberately separate from the completed-season path below: an
 * in-progress season is all zeros until games are played, so the strict
 * record-verification the completed path runs cannot apply here. Nothing here
 * touches the completed IMPORTED_SEASONS list, so the live season can never
 * leak into history, records or all-time stats.
 */
function importLiveSeason() {
  if (rawDivisions.length < 2) {
    console.error(
      `Expected ESPN divisions (conferences) but found ${rawDivisions.length}. Aborting live import.`,
    );
    process.exit(1);
  }

  const liveProblems = [];
  const managerByTeam = new Map();
  const conferenceByTeam = new Map();

  const standings = (payload.teams ?? []).map((team) => {
    const ownerSwid = (team.owners ?? [])[0];
    const owner = OWNERS[ownerSwid];
    if (!owner) {
      liveProblems.push(
        `Unknown owner SWID ${ownerSwid} for team ${team.id} "${team.name}" ` +
          `(ESPN member: ${memberName(ownerSwid)}). Add it to scripts/espn-managers.json.`,
      );
      return null;
    }

    managerByTeam.set(team.id, owner.id);
    conferenceByTeam.set(team.id, String(team.divisionId ?? ''));

    const overall = team.record?.overall ?? {};
    return {
      managerId: owner.id,
      conferenceId: String(team.divisionId ?? ''),
      wins: overall.wins ?? 0,
      losses: overall.losses ?? 0,
      ties: overall.ties ?? 0,
      pointsFor: Math.round(overall.pointsFor ?? 0),
      pointsAgainst: Math.round(overall.pointsAgainst ?? 0),
      ladderPosition: team.playoffSeed ?? 0,
    };
  });

  if (liveProblems.length > 0) {
    for (const problem of liveProblems) console.error(`ERROR: ${problem}`);
    process.exit(1);
  }

  // Ladder order: seeded teams first (by seed), then the rest by wins then PF,
  // so a pre-season ladder (all seed 0) still reads sensibly.
  standings.sort(
    (a, b) =>
      (a.ladderPosition || 99) - (b.ladderPosition || 99) ||
      b.wins - a.wins ||
      b.pointsFor - a.pointsFor,
  );

  const raw = payload.schedule ?? [];
  const fixtures = [];
  for (const game of raw) {
    // Only the home-and-away rounds — the upcoming view is the regular season.
    if (game.matchupPeriodId > regularSeasonWeeks) continue;

    const home = game.home ?? {};
    const away = game.away ?? {};
    if (home.teamId == null || away.teamId == null) continue; // bye placeholder

    const homeId = managerByTeam.get(home.teamId);
    const awayId = managerByTeam.get(away.teamId);
    if (!homeId || !awayId) {
      console.error(
        `ERROR: live matchup references an unmapped team (${home.teamId} vs ${away.teamId}).`,
      );
      process.exit(1);
    }

    const winnerRaw = (game.winner ?? 'UNDECIDED').toUpperCase();
    const winner =
      winnerRaw === 'HOME'
        ? 'home'
        : winnerRaw === 'AWAY'
          ? 'away'
          : winnerRaw === 'TIE'
            ? 'tie'
            : 'undecided';

    fixtures.push({
      round: game.matchupPeriodId,
      homeId,
      homeScore: Math.round(home.totalPoints ?? 0),
      awayId,
      awayScore: Math.round(away.totalPoints ?? 0),
      winner,
    });
  }

  fixtures.sort((a, b) => a.round - b.round || a.homeId.localeCompare(b.homeId));

  const started = fixtures.some((f) => f.winner !== 'undecided');

  const liveConferences = rawDivisions.map((division) => ({
    id: String(division.id),
    name: (division.name ?? '').trim() || `Division ${division.id}`,
  }));

  const liveSeason = {
    id: seasonId,
    espnSeasonId: ESPN_SEASON,
    label,
    leagueName: settings.name ?? '',
    regularSeasonWeeks,
    playoffTeams,
    started,
    importedAt: new Date().toISOString(),
    conferences: liveConferences,
    fixtures,
    standings,
  };

  const liveHeader = `// GENERATED by scripts/espn-import.mjs --live — do not edit by hand.
// Source: ESPN league ${LEAGUE}, in-progress season ${ESPN_SEASON}. Imported ${new Date().toISOString().slice(0, 10)}.
//
// The live/upcoming season: ESPN's real fixtures, division split and running
// ladder. NOT part of the completed IMPORTED_SEASONS, so it never reaches the
// history, records or all-time stats. Re-run the import to refresh scores and
// pick up any fixture changes.

import type { LiveSeason } from '@/lib/data/imported';

export const liveSeason: LiveSeason = ${JSON.stringify(liveSeason, null, 2)};
`;

  mkdirSync('lib/data', { recursive: true });
  writeFileSync('lib/data/upcoming.ts', liveHeader);

  const decided = fixtures.filter((f) => f.winner !== 'undecided').length;
  const liveReport = [
    `LIVE import — ${settings.name}`,
    `Season: ${label}  (espnSeasonId ${ESPN_SEASON})`,
    `Regular season weeks: ${regularSeasonWeeks}   Playoff teams: ${playoffTeams}`,
    `Conferences: ${liveConferences.map((c) => c.name).join(', ')}`,
    `Fixtures: ${fixtures.length}  (${decided} decided, ${fixtures.length - decided} to play)`,
    `Season started: ${started ? 'yes' : 'no (pre-season, all fixtures undecided)'}`,
    '',
    'Ladder (as ESPN has it):',
    ...standings.map(
      (s, i) =>
        `  ${String(i + 1).padStart(2)}. ${s.managerId.padEnd(7)} ` +
        `${s.wins}-${s.losses}${s.ties ? `-${s.ties}` : ''}  PF ${s.pointsFor}  ` +
        `[${liveConferences.find((c) => c.id === s.conferenceId)?.name ?? s.conferenceId}]`,
    ),
  ].join('\n');

  writeFileSync('scripts/.espn-import-report.txt', liveReport);
  console.log(liveReport);
  console.log(`\nWrote lib/data/upcoming.ts`);
}

/* ------------------------------------------------------------------- teams */

const problems = [];
const managerByTeamId = new Map();

/** ESPN member name for a SWID, so an unmapped owner is easy to identify. */
function memberName(swid) {
  const member = (payload.members ?? []).find((m) => m.id === swid);
  if (!member) return 'unknown';
  return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.displayName || 'unknown';
}

const teams = (payload.teams ?? []).map((team) => {
  const ownerSwid = (team.owners ?? [])[0];
  const owner = OWNERS[ownerSwid];

  if (!owner) {
    problems.push(
      `Unknown owner SWID ${ownerSwid} for team ${team.id} "${team.name}" ` +
        `(ESPN member: ${memberName(ownerSwid)}). Add it to scripts/espn-managers.json.`,
    );
    return null;
  }

  managerByTeamId.set(team.id, owner.id);

  const overall = team.record?.overall ?? {};
  return {
    managerId: owner.id,
    espnTeamId: team.id,
    teamName: (team.name ?? '').trim(),
    // Only recorded when the league actually has multiple conferences.
    ...(conferences.length > 1 && team.divisionId != null
      ? { conferenceId: String(team.divisionId) }
      : {}),
    // The home-and-away ladder position. This is how the league judges the
    // season — placement games are not counted, so ESPN's post-placement
    // `rankCalculatedFinal` is deliberately not used.
    ladderPosition: team.playoffSeed ?? 0,
    espn: {
      wins: overall.wins ?? 0,
      losses: overall.losses ?? 0,
      ties: overall.ties ?? 0,
      pointsFor: Math.round(overall.pointsFor ?? 0),
      pointsAgainst: Math.round(overall.pointsAgainst ?? 0),
      finalRank: team.rankCalculatedFinal ?? 0,
    },
  };
});

if (problems.length > 0) {
  for (const problem of problems) console.error(`ERROR: ${problem}`);
  process.exit(1);
}

teams.sort((a, b) => a.ladderPosition - b.ladderPosition);

/* ---------------------------------------------------------------- matchups */

const raw = payload.schedule ?? [];

/**
 * Championship-bracket periods only.
 *
 * Consolation / placement ladders are deliberately excluded — the league does
 * not count them, so they are dropped at the source rather than imported and
 * filtered later. That makes it impossible for them to leak into a stat.
 */
const bracketPeriods = [
  ...new Set(
    raw
      .filter((g) => g.playoffTierType === 'WINNERS_BRACKET' && g.matchupPeriodId > regularSeasonWeeks)
      .map((g) => g.matchupPeriodId),
  ),
].sort((a, b) => a - b);

/** Names the winners-bracket rounds backwards from the final. */
function bracketStage(period) {
  const fromEnd = bracketPeriods.length - 1 - bracketPeriods.indexOf(period);
  if (fromEnd === 0) return 'final';
  if (fromEnd === 1) return 'semi';
  if (fromEnd === 2) return 'quarter';
  return 'playoff';
}

const matchups = [];
let byes = 0;
let placementSkipped = 0;

for (const game of raw) {
  const home = game.home ?? {};
  const away = game.away ?? {};
  const isPlayoffPeriod = game.matchupPeriodId > regularSeasonWeeks;

  // Placement games are not part of this league's record.
  if (isPlayoffPeriod && game.playoffTierType !== 'WINNERS_BRACKET') {
    placementSkipped += 1;
    continue;
  }

  // A playoff bye is stored as a one-sided matchup. It is not a played game.
  if (home.teamId == null || away.teamId == null) {
    byes += 1;
    continue;
  }

  const homeId = managerByTeamId.get(home.teamId);
  const awayId = managerByTeamId.get(away.teamId);
  if (!homeId || !awayId) {
    console.error(`ERROR: matchup references an unmapped team (${home.teamId} vs ${away.teamId}).`);
    process.exit(1);
  }

  matchups.push({
    week: game.matchupPeriodId,
    stage: isPlayoffPeriod ? bracketStage(game.matchupPeriodId) : 'regular',
    homeId,
    homeScore: Math.round(home.totalPoints ?? 0),
    awayId,
    awayScore: Math.round(away.totalPoints ?? 0),
  });
}

matchups.sort((a, b) => a.week - b.week || a.homeId.localeCompare(b.homeId));

/* ------------------------------------------------------------ verification */

const derived = new Map(teams.map((t) => [t.managerId, { wins: 0, losses: 0, pf: 0, pa: 0 }]));

for (const game of matchups) {
  if (game.stage !== 'regular') continue;
  const home = derived.get(game.homeId);
  const away = derived.get(game.awayId);
  home.pf += game.homeScore;
  home.pa += game.awayScore;
  away.pf += game.awayScore;
  away.pa += game.homeScore;
  if (game.homeScore > game.awayScore) {
    home.wins += 1;
    away.losses += 1;
  } else if (game.awayScore > game.homeScore) {
    away.wins += 1;
    home.losses += 1;
  }
}

const mismatches = [];
for (const team of teams) {
  const mine = derived.get(team.managerId);
  const theirs = team.espn;
  if (mine.wins !== theirs.wins || mine.losses !== theirs.losses) {
    mismatches.push(
      `${team.managerId}: record ${mine.wins}-${mine.losses} vs ESPN ${theirs.wins}-${theirs.losses}`,
    );
  }
  if (Math.abs(mine.pf - theirs.pointsFor) > 1) {
    mismatches.push(`${team.managerId}: PF ${mine.pf} vs ESPN ${theirs.pointsFor}`);
  }
  if (Math.abs(mine.pa - theirs.pointsAgainst) > 1) {
    mismatches.push(`${team.managerId}: PA ${mine.pa} vs ESPN ${theirs.pointsAgainst}`);
  }
}

/* ------------------------------------------------------------------ output */

const stageCounts = matchups.reduce((acc, g) => {
  acc[g.stage] = (acc[g.stage] ?? 0) + 1;
  return acc;
}, {});

const header = `// GENERATED by scripts/espn-import.mjs — do not edit by hand.
// Source: ESPN league ${LEAGUE}, season ${ESPN_SEASON}. Imported ${new Date().toISOString().slice(0, 10)}.
//
// Team names, seeds and final placings come straight from ESPN. Everything the
// site displays is derived from the matchup list below.

import type { ImportedSeason } from '@/lib/data/imported';

export const season: ImportedSeason = ${JSON.stringify(
  {
    id: seasonId,
    espnSeasonId: ESPN_SEASON,
    label,
    leagueName: settings.name ?? '',
    scoringType: settings.scoringSettings?.scoringType ?? 'UNKNOWN',
    regularSeasonWeeks,
    playoffTeams,
    ...(conferences.length > 1 ? { conferences } : {}),
    teams,
    matchups,
  },
  null,
  2,
)};
`;

mkdirSync('lib/data/seasons', { recursive: true });
writeFileSync(`lib/data/seasons/${seasonId}.ts`, header);

const report = [
  `League: ${settings.name}  (${settings.scoringSettings?.scoringType})`,
  `Season: ${label}  (espnSeasonId ${ESPN_SEASON})`,
  `Regular season weeks: ${regularSeasonWeeks}   Playoff teams: ${playoffTeams}`,
  `Conferences: ${conferences.length > 1 ? conferences.map((c) => c.name).join(', ') : 'none (single division)'}`,
  `Championship bracket periods: ${bracketPeriods.join(', ') || 'none'}`,
  `Matchups written: ${matchups.length}  ${JSON.stringify(stageCounts)}`,
  `Skipped: ${byes} byes, ${placementSkipped} placement games (not counted by this league)`,
  '',
  'Home-and-away ladder:',
  ...teams.map(
    (t) =>
      `  ${String(t.ladderPosition).padStart(2)}. ${t.managerId.padEnd(7)} ` +
      `${t.espn.wins}-${t.espn.losses}  PF ${t.espn.pointsFor}  PA ${t.espn.pointsAgainst}  "${t.teamName}"`,
  ),
  '',
  mismatches.length === 0
    ? 'VERIFICATION: derived regular-season records and points match ESPN exactly.'
    : `VERIFICATION FAILED:\n${mismatches.map((m) => `  ${m}`).join('\n')}`,
].join('\n');

writeFileSync('scripts/.espn-import-report.txt', report);
console.log(report);
console.log(`\nWrote lib/data/seasons/${seasonId}.ts`);
