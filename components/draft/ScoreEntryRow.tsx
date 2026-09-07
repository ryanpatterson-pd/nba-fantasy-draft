'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { formatScore, parseScore, scoreInputMode, scorePlaceholder } from '@/lib/draft/score-format';
import { formatPoints } from '@/lib/draft/scoring';
import type { DraftGame, GamePlacing, Manager } from '@/lib/types';
import { ordinal } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * One manager's score input for one game.
 *
 * Local draft state keeps the field responsive while typing; the value is
 * committed to the store on every keystroke that parses, so the placings update
 * live. Invalid text is flagged rather than silently discarded.
 */
export function ScoreEntryRow({
  manager,
  game,
  score,
  placing,
  onChange,
}: {
  manager: Manager;
  game: DraftGame;
  score: number | undefined;
  placing: GamePlacing | undefined;
  onChange: (score: number | null) => void;
}) {
  const committed = score === undefined ? '' : formatScore(score, game.scoring.format, game.scoring.decimals);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? committed;
  const invalid = draft !== null && draft.trim() !== '' && parseScore(draft, game.scoring.format) === null;

  function commit(next: string) {
    setDraft(next);
    if (next.trim() === '') {
      onChange(null);
      return;
    }
    const parsed = parseScore(next, game.scoring.format);
    if (parsed !== null) onChange(parsed);
  }

  const isLeader = placing?.placing === 1;

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-tile border px-2.5 py-2 transition-colors',
        isLeader ? 'border-accent bg-accent-bg' : 'border-line bg-surface',
      )}
    >
      <Avatar manager={manager} size="xs" ring={false} />
      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-ink">
        {manager.name}
      </span>

      <span className="relative w-[92px] shrink-0">
        <input
          value={value}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => setDraft(null)}
          inputMode={scoreInputMode(game.scoring.format)}
          placeholder={scorePlaceholder(game.scoring.format)}
          aria-label={`${manager.name} ${game.scoring.unit}`}
          className={cn(
            'tabular h-8 w-full rounded-[6px] border bg-surface px-2 text-right text-[0.8125rem] font-semibold text-ink',
            'placeholder:font-normal placeholder:text-ink-mute focus:outline-none',
            invalid ? 'border-negative' : 'border-line focus:border-accent',
          )}
        />
      </span>

      {score !== undefined && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange(null);
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-ink-mute transition-colors hover:bg-surface-3 hover:text-negative"
          aria-label={`Clear ${manager.name}'s score`}
        >
          <Icon name="x" size={12} />
        </button>
      )}

      <span className="w-[74px] shrink-0 text-right">
        {placing ? (
          <>
            <span
              className={cn(
                'tabular block text-[0.8125rem] font-bold',
                isLeader ? 'text-accent-deep' : 'text-ink',
              )}
            >
              {ordinal(placing.placing)}
              {placing.tied && <span className="font-normal text-ink-mute"> =</span>}
            </span>
            <span className="tabular block text-[0.66rem] text-ink-mute">
              {formatPoints(placing.points)} pts
            </span>
          </>
        ) : (
          <span className="text-[0.66rem] text-ink-mute">—</span>
        )}
      </span>
    </div>
  );
}
