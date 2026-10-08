/**
 * War Room live sync.
 *
 * The drafted list is the one piece of state that ideally syncs across devices
 * on draft night — you cross a player off on the laptop and it greys out on
 * your phone. Your personal shortlist stays local (it's private to you).
 *
 * This talks to Supabase over plain REST (fetch), so there's no npm dependency
 * to install — it keeps the project's zero-dependency stance. When Supabase
 * isn't configured it degrades to a no-op and the board runs purely on
 * localStorage exactly as before.
 *
 * Backend setup (one-off), if you want live sync:
 *   1. Create a Supabase project, add the URL + anon key to .env.local:
 *        NEXT_PUBLIC_SUPABASE_URL=...
 *        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
 *   2. Create a table:
 *        create table war_room_board (
 *          season_id text primary key,
 *          drafted   jsonb not null default '[]',
 *          updated_at timestamptz not null default now()
 *        );
 *   3. Enable RLS with a permissive policy (it's a private, code-gated board):
 *        alter table war_room_board enable row level security;
 *        create policy "anon rw" on war_room_board
 *          for all using (true) with check (true);
 *
 * Security note: the anon key is public by design. Anyone with the key could
 * read/write the table, so this is deterrence-grade like the access code, not
 * hard security. Good enough for a private league board.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TABLE = 'war_room_board';

/** True when a backend is configured; the UI uses this to show a live badge. */
export const SYNC_ENABLED = Boolean(URL && KEY);

function headers(): HeadersInit {
  return {
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  };
}

export type BoardSnapshot = { drafted: string[]; updatedAt: string };

/**
 * Reads the shared drafted list for a season. Returns null when sync is off or
 * on any error — callers fall back to local state, so a flaky network never
 * blocks the board.
 */
export async function pullBoard(seasonId: string): Promise<BoardSnapshot | null> {
  if (!SYNC_ENABLED) return null;
  try {
    const res = await fetch(
      `${URL}/rest/v1/${TABLE}?season_id=eq.${encodeURIComponent(seasonId)}&select=drafted,updated_at`,
      { headers: headers(), cache: 'no-store' },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { drafted: string[]; updated_at: string }[];
    if (!Array.isArray(rows) || rows.length === 0) return { drafted: [], updatedAt: '' };
    const row = rows[0];
    return {
      drafted: Array.isArray(row.drafted) ? row.drafted : [],
      updatedAt: row.updated_at ?? '',
    };
  } catch {
    return null;
  }
}

/**
 * Upserts the shared drafted list for a season. Returns true on success. Uses
 * Prefer: resolution=merge-duplicates so the primary key upserts cleanly.
 */
export async function pushBoard(seasonId: string, drafted: string[]): Promise<boolean> {
  if (!SYNC_ENABLED) return false;
  try {
    const res = await fetch(`${URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        { season_id: seasonId, drafted, updated_at: new Date().toISOString() },
      ]),
    });
    return res.ok;
  } catch {
    return false;
  }
}
