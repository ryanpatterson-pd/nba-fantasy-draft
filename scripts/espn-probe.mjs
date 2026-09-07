/**
 * One-off probe: check whether the ESPN league is readable and report its shape.
 * Writes the raw payload to scripts/.espn-raw.json and a summary to
 * scripts/.espn-summary.txt so the results can be inspected reliably.
 */
import { writeFileSync } from 'node:fs';

const SEASON = process.argv[2] ?? '2026';
const LEAGUE = process.argv[3] ?? process.env.ESPN_LEAGUE_ID ?? '803871539';

const BASES = [
  `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${SEASON}/segments/0/leagues/${LEAGUE}`,
  `https://fantasy.espn.com/apis/v3/games/fba/seasons/${SEASON}/segments/0/leagues/${LEAGUE}`,
];

const VIEWS = ['mTeam', 'mSettings', 'mMatchupScore', 'mScoreboard'];

const lines = [];
const log = (msg) => {
  lines.push(msg);
  console.log(msg);
};

const headers = {
  accept: 'application/json',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
};

// Cookies only get attached if present — a public league needs none.
if (process.env.ESPN_S2 && process.env.SWID) {
  // SWID must be brace-wrapped; tolerate it either way in the env file.
  const swid = process.env.SWID.startsWith('{') ? process.env.SWID : `{${process.env.SWID}}`;
  headers.cookie = `espn_s2=${process.env.ESPN_S2}; SWID=${swid}`;
  log(`Using cookies from the environment (SWID ${swid.slice(0, 10)}…, espn_s2 ${process.env.ESPN_S2.length} chars).`);
} else {
  log('No cookies set — attempting as a public league.');
}

let payload = null;

for (const base of BASES) {
  const url = `${base}?${VIEWS.map((v) => `view=${v}`).join('&')}`;
  try {
    const response = await fetch(url, { headers });
    log(`\n${response.status} ${response.statusText}  ${base.split('/apis')[0]}`);

    const text = await response.text();
    if (!response.ok) {
      log(`  body: ${text.slice(0, 300)}`);
      continue;
    }

    payload = JSON.parse(text);
    log('  parsed OK');
    break;
  } catch (error) {
    log(`  request failed: ${error.message}`);
  }
}

if (!payload) {
  log('\nRESULT: could not read the league.');
} else {
  writeFileSync('scripts/.espn-raw.json', JSON.stringify(payload, null, 2));

  const settings = payload.settings ?? {};
  const scoring = settings.scoringSettings ?? {};
  const schedule = settings.scheduleSettings ?? {};

  log('\n--- LEAGUE ---');
  log(`name: ${settings.name ?? '(none)'}`);
  log(`size: ${settings.size ?? '?'}   currentScoringPeriod: ${payload.scoringPeriodId ?? '?'}`);
  log(`status.currentMatchupPeriod: ${payload.status?.currentMatchupPeriod ?? '?'}`);
  log(`status.finalScoringPeriod: ${payload.status?.finalScoringPeriod ?? '?'}`);
  log(`scoringType: ${scoring.scoringType ?? '?'}`);
  log(`matchupPeriodCount: ${schedule.matchupPeriodCount ?? '?'}`);
  log(`playoffTeamCount: ${schedule.playoffTeamCount ?? '?'}`);
  log(`playoffMatchupPeriodLength: ${schedule.playoffMatchupPeriodLength ?? '?'}`);

  log('\n--- TEAMS ---');
  for (const team of payload.teams ?? []) {
    const name = team.name ?? `${team.location ?? ''} ${team.nickname ?? ''}`.trim();
    const rec = team.record?.overall ?? {};
    log(
      `id=${team.id}  ${name}  |  ${rec.wins ?? '?'}-${rec.losses ?? '?'}-${rec.ties ?? 0}  ` +
        `PF=${(rec.pointsFor ?? 0).toFixed?.(1) ?? rec.pointsFor}  ` +
        `PA=${(rec.pointsAgainst ?? 0).toFixed?.(1) ?? rec.pointsAgainst}  ` +
        `seed=${team.playoffSeed ?? '?'}  rank=${team.rankCalculatedFinal ?? team.currentProjectedRank ?? '?'}`,
    );
  }

  const schedules = payload.schedule ?? [];
  log(`\n--- SCHEDULE: ${schedules.length} matchups ---`);
  const byType = {};
  for (const game of schedules) {
    const key = `${game.playoffTierType ?? 'NONE'}`;
    byType[key] = (byType[key] ?? 0) + 1;
  }
  log(`playoffTierType counts: ${JSON.stringify(byType)}`);

  const periods = [...new Set(schedules.map((g) => g.matchupPeriodId))].sort((a, b) => a - b);
  log(`matchupPeriodIds: ${periods.join(', ')}`);

  log('\nfirst 3 matchups (raw shape):');
  for (const game of schedules.slice(0, 3)) {
    log(JSON.stringify(game, null, 2).slice(0, 900));
  }

  log('\nlast 3 matchups (raw shape):');
  for (const game of schedules.slice(-3)) {
    log(JSON.stringify(game, null, 2).slice(0, 900));
  }
}

writeFileSync('scripts/.espn-summary.txt', lines.join('\n'));
