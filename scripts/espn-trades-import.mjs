/**
 * ESPN trades importer (forward-only).
 *
 *   node --env-file=.env.local scripts/espn-trades-import.mjs            # current season on
 *   node --env-file=.env.local scripts/espn-trades-import.mjs 2026 2027  # explicit seasons
 *
 * Reconstructs accepted trades from ESPN's league activity feed and writes a
 * typed data file to lib/data/trades.ts.
 *
 * Why forward-only
 * ----------------
 * ESPN only serves its activity feed for a short window of recent seasons, and
 * for older seasons it drops the return leg of each deal — leaving trades that
 * look one-sided. Rather than ship that broken history, we record trades from
 * FIRST_TRADE_SEASON onward, while both legs are still in the feed. Bump the
 * constant only if you deliberately want to (re)capture an earlier season.
 *
 * How ESPN stores a trade
 * -----------------------
 * The feed (view=kona_league_communication) is a list of "topics". A trade is a
 * topic of type ACTIVITY_TRANSACTIONS whose messages carry messageTypeId 239 —
 * one per player that changed hands:
 *
 *   { messageTypeId: 239, targetId: <espnPlayerId>, from: <fromTeamId>, for: <toTeamId> }
 *
 * `from` gives the player up, `for` receives it. ESPN stamps every message in
 * one accepted trade with the same topic-level `targetId` (its transaction id),
 * so we group by that to rebuild the whole deal — both directions when the feed
 * still has them. Player names come from the season's players resource.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

/** Earliest ESPN season we trust the feed for. 2026 = the 2025/26 season. */
const FIRST_TRADE_SEASON = 2026;

const LEAGUE = process.env.ESPN_LEAGUE_ID;

if (!LEAGUE) {
  console.error('ESPN_LEAGUE_ID is not set. Run with --env-file=.env.local');
  process.exit(1);
}
if (!process.env.ESPN_S2 || !process.env.SWID) {
  console.error('ESPN_S2 / SWID are not set. Run with --env-file=.env.local');
  process.exit(1);
}

// Seasons to import: explicit args if given, otherwise the current season on.
// Anything before FIRST_TRADE_SEASON is dropped so stale, half-recorded history
// can never leak back into the site.
const requested = process.argv.slice(2).map(Number).filter((n) => Number.isFinite(n));
const currentSeason = (() => {
  const now = new Date();
  // ESPN's basketball season number is the calendar year it ends in; the new
  // season effectively starts around October, so roll over from October.
  return now.getUTCMonth() >= 9 ? now.getUTCFullYear() + 1 : now.getUTCFullYear();
})();

const SEASONS = (requested.length ? requested : [currentSeason]).filter((s) => {
  if (s < FIRST_TRADE_SEASON) {
    console.warn(`Skipping season ${s}: before FIRST_TRADE_SEASON (${FIRST_TRADE_SEASON}).`);
    return false;
  }
  return true;
});

if (SEASONS.length === 0) {
  console.error('No seasons to import (all were before FIRST_TRADE_SEASON).');
  process.exit(1);
}

const OWNERS = JSON.parse(readFileSync('scripts/espn-managers.json', 'utf8'));
const swid = process.env.SWID.startsWith('{') ? process.env.SWID : `{${process.env.SWID}}`;
const cookie = `espn_s2=${process.env.ESPN_S2}; SWID=${swid}`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

async function espn(url, headers = {}) {
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': UA, cookie, ...headers },
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    return { ok: false, status: response.status, body, json: null };
  }
  return { ok: true, status: response.status, json: await response.json() };
}

const TRADE_MESSAGE_TYPE = 239;

/** Resolve espn player ids to full names via the dedicated players resource. */
async function resolvePlayerNames(season, ids) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {};
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${season}/players?scoringPeriodId=0&view=players_wl`;
  const res = await espn(url, { 'x-fantasy-filter': JSON.stringify({ filterIds: { value: unique } }) });
  const names = {};
  if (res.ok && Array.isArray(res.json)) {
    for (const p of res.json) if (p.id != null) names[p.id] = p.fullName ?? `Player ${p.id}`;
  }
  for (const id of unique) if (!names[id]) names[id] = `Player ${id}`;
  return names;
}

const allTrades = [];
const report = [];

for (const espnSeason of SEASONS) {
  const startYear = espnSeason - 1;
  const seasonId = `${startYear}-${String(espnSeason).slice(2)}`;
  const label = `${startYear}/${String(espnSeason).slice(2)}`;
  const base = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/fba/seasons/${espnSeason}/segments/0/leagues/${LEAGUE}`;

  const res = await espn(`${base}?view=kona_league_communication&view=mTeam`);
  if (!res.ok) {
    report.push(`${label}: activity feed unavailable (HTTP ${res.status})`);
    continue;
  }

  const topics = res.json.communication?.topics ?? [];
  const teams = res.json.teams ?? [];

  // Team id -> manager id (team ids are per-season).
  const managerByTeamId = new Map();
  for (const team of teams) {
    const owner = OWNERS[(team.owners ?? [])[0]];
    if (owner) managerByTeamId.set(team.id, owner.id);
  }

  // Every trade player-move, tagged with the transaction id ESPN groups it under
  // (the topic-level targetId). Falls back to the topic id if that's missing.
  const moves = [];
  for (const topic of topics) {
    if (topic.type !== 'ACTIVITY_TRANSACTIONS') continue;
    const txId = topic.targetId ?? topic.id;
    for (const m of topic.messages ?? []) {
      if (m.messageTypeId !== TRADE_MESSAGE_TYPE) continue;
      if (m.from == null || m.for == null || m.targetId == null) continue;
      moves.push({ txId, playerId: m.targetId, from: m.from, to: m.for, date: m.date ?? topic.date });
    }
  }

  if (moves.length === 0) {
    report.push(`${label}: 0 trades`);
    continue;
  }

  // Group by ESPN's transaction id — every player in one accepted deal shares it.
  const groups = new Map();
  for (const mv of moves) {
    if (!groups.has(mv.txId)) groups.set(mv.txId, { txId: mv.txId, date: mv.date, moves: [] });
    const g = groups.get(mv.txId);
    g.moves.push(mv);
    if (mv.date < g.date) g.date = mv.date; // earliest stamp represents the deal
  }

  const names = await resolvePlayerNames(espnSeason, moves.map((m) => m.playerId));

  let seasonCount = 0;
  let skipped = 0;
  for (const group of groups.values()) {
    // The two franchises in the deal are the distinct teams that appear as a
    // giver or receiver. Standard trades have exactly two.
    const teamIds = [...new Set(group.moves.flatMap((m) => [m.from, m.to]))];
    if (teamIds.length !== 2) {
      skipped += 1; // multi-team or malformed batch — don't guess at it
      continue;
    }

    const [teamA, teamB] = teamIds;
    const managerA = managerByTeamId.get(teamA);
    const managerB = managerByTeamId.get(teamB);
    if (!managerA || !managerB) {
      skipped += 1;
      continue;
    }

    const receivesFor = (teamId) =>
      group.moves
        .filter((m) => m.to === teamId)
        .map((m) => ({ playerId: m.playerId, name: names[m.playerId] ?? `Player ${m.playerId}` }));

    allTrades.push({
      id: `${seasonId}-${group.txId}`,
      seasonId,
      seasonLabel: label,
      date: new Date(group.date).toISOString(),
      sideA: { managerId: managerA, receives: receivesFor(teamA) },
      sideB: { managerId: managerB, receives: receivesFor(teamB) },
    });
    seasonCount += 1;
  }

  report.push(
    `${label}: ${seasonCount} trade${seasonCount === 1 ? '' : 's'}` +
      (skipped ? ` (${skipped} multi-team/unmapped batch${skipped === 1 ? '' : 'es'} skipped)` : ''),
  );
}

// Newest first.
allTrades.sort((a, b) => b.date.localeCompare(a.date));

const header = `// GENERATED by scripts/espn-trades-import.mjs — do not edit by hand.
// Source: ESPN league ${LEAGUE}. Imported ${new Date().toISOString().slice(0, 10)}.
//
// Accepted trades from ESPN's activity feed, recorded from the ${FIRST_TRADE_SEASON - 1}/${String(
  FIRST_TRADE_SEASON,
).slice(2)} season onward. Each side lists the manager and the players they
// received in the deal.

import type { Trade } from '@/lib/types';

export const TRADES: Trade[] = ${JSON.stringify(allTrades, null, 2)};
`;

mkdirSync('lib/data', { recursive: true });
writeFileSync('lib/data/trades.ts', header);

const summary = [...report, '', `Wrote ${allTrades.length} trades to lib/data/trades.ts`].join('\n');
writeFileSync('scripts/.espn-trades-report.txt', summary);
console.log(summary);
