'use client';

import { useState } from 'react';
import { MascotImage } from '@/components/ui/MascotImage';
import {
  formatScore,
  parseScore,
  scoreInputMode,
  scorePlaceholder,
} from '@/lib/draft/score-format';
import type { DraftGame, GamePlacing, Manager } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

/**
 * One manager's score row on a presentation slide.
 *
 * Styled for the dark "ENTER RESULTS" panel: a circular monogram ring in the
 * manager's colour, the name, then a boxed input on the right. Scoring behaviour
 * matches the control room — commit on every keystroke that parses, flag invalid
 * text, and highlight the current leader.
 *
 * This renders inside an `on-dark` subtree, so it leans on the rebound tokens
 * (surface, line, accent) rather than hard-coded colours.
 */
export function SlideScoreInput({
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
  const committed =
    score === undefined ? '' : formatScore(score, game.scoring.format, game.scoring.decimals);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? committed;
  const invalid =
    draft !== null && draft.trim() !== '' && parseScore(draft, game.scoring.format) === null;

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
        'flex items-center gap-3 rounded-tile border px-3 py-2.5 transition-colors',
        isLeader
          ? 'border-accent/60 bg-accent/10'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20',
      )}
    >
      {/* Circular headshot: the mascot photo layered over a colour-ringed
          monogram. A missing photo simply leaves the monogram showing. */}
      <span
        className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border-2 text-[0.8rem] font-black text-white"
        style={{
          borderColor: manager.colours.primary,
          background: `color-mix(in oklab, ${manager.colours.primary} 28%, #000)`,
        }}
      >
        <span aria-hidden>{manager.name[0].toUpperCase()}</span>
        <MascotImage managerId={manager.id} alt="" className="object-cover" />
      </span>

      <span className="min-w-0 flex-1 truncate text-[0.95rem] font-bold text-white">
        {manager.name}
      </span>

      {placing ? (
        <span
          className={cn(
            'tabular shrink-0 text-[0.7rem] font-bold',
            isLeader ? 'text-accent-2' : 'text-white/45',
          )}
        >
          {placing.placing}
          {placing.tied ? '=' : ''}
        </span>
      ) : null}

      <input
        value={value}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setDraft(null)}
        inputMode={scoreInputMode(game.scoring.format)}
        placeholder={scorePlaceholder(game.scoring.format)}
        aria-label={`${manager.name} ${game.scoring.unit}`}
        className={cn(
          'tabular h-9 w-[74px] shrink-0 rounded-[8px] border bg-black/30 px-2.5 text-right text-[0.95rem] font-bold text-white',
          'placeholder:font-normal placeholder:text-white/30 focus:outline-none',
          invalid ? 'border-negative' : 'border-white/15 focus:border-accent',
        )}
      />
    </div>
  );
}
