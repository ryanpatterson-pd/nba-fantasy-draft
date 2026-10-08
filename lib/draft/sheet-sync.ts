'use client';

import { DRAFT_GAMES } from '@/lib/data/draft-games';
import { ACTIVE_MANAGERS } from '@/lib/data/managers';
import { formatScore } from '@/lib/draft/score-format';
import { buildStandings, placingsFor } from '@/lib/draft/scoring';
import { readJson, writeJson } from '@/lib/storage/local';
import type { DraftNightState } from '@/lib/types';

/**
 * Optional Google Sheet backup for draft-night scores.
 *
 * localStorage is the source of truth and keeps the night running offline. This
 * module layers a durable, off-device copy on top: you paste the URL of a
 * Google Apps Script web app (deployed as "anyone can access"), and the whole
 * score sheet is POSTed there on demand or after each change.
 *
 * The payload is a flat, spreadsheet-friendly shape so the Apps Script side can
 * be a few lines — see SHEET_WEBHOOK_SETUP below for a copy-paste script.
 *
 * Nothing here is required: with no URL configured the app behaves exactly as
 * before, saving only to the browser.
 */

const WEBHOOK_KEY = 'nbafd.draft.sheetUrl';

export function getSheetUrl(): string {
  return readJson<string>(WEBHOOK_KEY) ?? '';
}

export function setSheetUrl(url: string): void {
  writeJson(WEBHOOK_KEY, url.trim());
}

export function hasSheetUrl(): boolean {
  return getSheetUrl().length > 0;
}

/** One row per (game, manager) with raw score, placing and points. */
export type SheetRow = {
  gameOrder: number;
  gameId: string;
  gameName: string;
  managerId: string;
  managerName: string;
  rawScore: string;
  placing: number | '';
  points: number | '';
};

/** A summary row per manager: total points and overall rank. */
export type SheetStandingRow = {
  rank: number;
  managerId: string;
  managerName: string;
  points: number;
  gamesPlayed: number;
};

export type SheetPayload = {
  seasonId: string;
  /** ISO timestamp the snapshot was taken. */
  savedAt: string;
  rows: SheetRow[];
  standings: SheetStandingRow[];
};

/** Flattens the live draft state into spreadsheet rows. */
export function buildSheetPayload(state: DraftNightState): SheetPayload {
  const rows: SheetRow[] = [];

  for (const game of DRAFT_GAMES) {
    const scores = state.results[game.id]?.scores ?? {};
    const placings = placingsFor(game, scores);
    const placingByManager = new Map(placings.map((p) => [p.managerId, p]));

    for (const manager of ACTIVE_MANAGERS) {
      const score = scores[manager.id];
      const placing = placingByManager.get(manager.id);
      rows.push({
        gameOrder: game.order,
        gameId: game.id,
        gameName: game.name,
        managerId: manager.id,
        managerName: manager.name,
        rawScore:
          typeof score === 'number'
            ? formatScore(score, game.scoring.format, game.scoring.decimals)
            : '',
        placing: placing ? placing.placing : '',
        points: placing ? Math.round(placing.points * 100) / 100 : '',
      });
    }
  }

  const standings: SheetStandingRow[] = buildStandings(state.results).map((row) => ({
    rank: row.rank,
    managerId: row.managerId,
    managerName: ACTIVE_MANAGERS.find((m) => m.id === row.managerId)?.name ?? row.managerId,
    points: row.points,
    gamesPlayed: row.gamesPlayed,
  }));

  return {
    seasonId: state.seasonId,
    savedAt: new Date().toISOString(),
    rows,
    standings,
  };
}

export type SheetSyncResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Pushes the current state to the configured Google Sheet web app.
 *
 * Apps Script web apps don't send permissive CORS headers, so we POST with
 * `mode: 'no-cors'`. That makes the response opaque — we can't read a status
 * code back — so a resolved fetch is treated as success and only a thrown
 * network error is a failure. In practice that's the right trade for a
 * fire-and-forget backup: the sheet is the record of truth you can eyeball.
 */
export async function pushToSheet(state: DraftNightState): Promise<SheetSyncResult> {
  const url = getSheetUrl();
  if (!url) return { ok: false, error: 'No Google Sheet URL configured.' };

  const payload = buildSheetPayload(state);

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Network request failed.',
    };
  }
}

/**
 * Copy-paste Apps Script for the receiving end. Shown in the settings UI so the
 * person running the night can set up their own sheet in a minute.
 *
 * In Google Sheets: Extensions → Apps Script, paste this, Deploy → New
 * deployment → Web app → Execute as "Me", Access "Anyone", then copy the
 * /exec URL into the draft settings.
 */
export const SHEET_WEBHOOK_SETUP = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Scores tab: one row per game + manager.
  var scores = ss.getSheetByName('Scores') || ss.insertSheet('Scores');
  scores.clearContents();
  scores.appendRow(['Game #', 'Game', 'Manager', 'Score', 'Placing', 'Points', 'Saved At']);
  data.rows.forEach(function (r) {
    scores.appendRow([r.gameOrder, r.gameName, r.managerName, r.rawScore, r.placing, r.points, data.savedAt]);
  });

  // Standings tab: the derived ladder.
  var table = ss.getSheetByName('Standings') || ss.insertSheet('Standings');
  table.clearContents();
  table.appendRow(['Rank', 'Manager', 'Points', 'Games']);
  data.standings.forEach(function (s) {
    table.appendRow([s.rank, s.managerName, s.points, s.gamesPlayed]);
  });

  return ContentService.createTextOutput('ok');
}`;
