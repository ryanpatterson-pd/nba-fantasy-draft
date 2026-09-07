'use client';

import { useMemo, useState } from 'react';
import { ScoreEntryRow } from '@/components/draft/ScoreEntryRow';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { FORMAT_LABELS } from '@/lib/data/draft-games';
import { ACTIVE_MANAGERS, getManager } from '@/lib/data/managers';
import { formatScore } from '@/lib/draft/score-format';
import { FIELD_SIZE, formatPoints, placingsFor } from '@/lib/draft/scoring';
import type { DraftGame, GameResult } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

const FORMAT_TONE = {
  skill: 'accent',
  luck: 'warning',
  hybrid: 'neutral',
} as const;

/**
 * One draft-night game with live score entry.
 *
 * You type in raw scores — times, makes, strokes — and the placings and points
 * are derived on every keystroke. Nothing is ranked by hand, so a mistyped time
 * is a one-field fix rather than a re-rank.
 */
export function GameCard({
  game,
  result,
  onScore,
  onClear,
}: {
  game: DraftGame;
  result: GameResult | undefined;
  onScore: (managerId: string, score: number | null) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  // Stabilised so the placings memo does not recompute on every render when no
  // scores have been entered yet.
  const scores = useMemo(() => result?.scores ?? {}, [result?.scores]);
  const placings = useMemo(() => placingsFor(game, scores), [game, scores]);
  const placingByManager = useMemo(
    () => new Map(placings.map((placing) => [placing.managerId, placing])),
    [placings],
  );

  const entered = placings.length;
  const complete = entered === FIELD_SIZE;
  const leader = placings[0];

  return (
    <Card accentEdge={complete} className="flex flex-col">
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            'tabular flex h-9 w-9 shrink-0 items-center justify-center rounded-tile text-[0.8rem] font-extrabold',
            complete ? 'accent-solid' : 'border border-line bg-surface-2 text-ink-mute',
          )}
        >
          {String(game.order).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[0.95rem] font-extrabold tracking-tight text-ink">{game.name}</h3>
            <Badge tone={FORMAT_TONE[game.format]}>{FORMAT_LABELS[game.format]}</Badge>
            {complete ? (
              <Badge tone="positive">
                <Icon name="check" size={11} />
                Complete
              </Badge>
            ) : entered > 0 ? (
              <Badge tone="warning">
                {entered}/{FIELD_SIZE} entered
              </Badge>
            ) : (
              <Badge tone="outline">Not started</Badge>
            )}
          </div>

          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-dim">{game.description}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-ink-mute">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="calendar" size={12} />
              {game.slot}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="target" size={12} />
              {game.scoring.rule}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="flag" size={12} />
              {game.venue}
            </span>
          </div>
        </div>

        <Button
          variant={entered > 0 ? 'outline' : 'primary'}
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
          iconRight={open ? 'chevron-up' : 'chevron-down'}
          aria-expanded={open}
        >
          {complete ? 'Scores' : entered > 0 ? 'Continue' : 'Enter scores'}
        </Button>
      </div>

      {/* Collapsed summary: the podium */}
      {entered > 0 && !open && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-4 py-3">
          {placings.slice(0, 4).map((placing) => {
            const manager = getManager(placing.managerId);
            return (
              <span
                key={placing.managerId}
                className={cn(
                  'flex items-center gap-1.5 rounded-tile border py-0.5 pr-2.5 pl-0.5',
                  placing.placing === 1 ? 'border-accent bg-accent-bg' : 'border-line bg-surface-2',
                )}
              >
                <Avatar manager={manager} size="xs" ring={false} />
                <span className="text-[0.72rem] font-semibold text-ink">{manager.name}</span>
                <span className="tabular text-[0.68rem] text-ink-dim">
                  {formatScore(placing.score, game.scoring.format, game.scoring.decimals)}
                </span>
                <span className="tabular text-[0.66rem] font-bold text-accent-deep">
                  {formatPoints(placing.points)}
                </span>
              </span>
            );
          })}
          {placings.length > 4 && (
            <span className="label-xs">+{placings.length - 4} more</span>
          )}
        </div>
      )}

      {/* Score entry */}
      {open && (
        <div className="border-t border-line p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label-xs">
                {game.scoring.rule} · enter {game.scoring.unit}
              </p>
              {game.scoring.format === 'time' && (
                <p className="mt-1 text-[0.7rem] text-ink-mute">
                  Seconds, or <code className="font-mono">m:ss.xx</code> for anything over a minute.
                </p>
              )}
              {game.scoring.format === 'placing' && (
                <p className="mt-1 text-[0.7rem] text-ink-mute">
                  Enter the finishing position, 1 through {FIELD_SIZE}.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="tabular label-xs">
                {entered}/{FIELD_SIZE} entered
              </span>
              <Button
                variant="ghost"
                size="sm"
                icon="refresh"
                onClick={onClear}
                disabled={entered === 0}
              >
                Clear all
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-1.5 lg:grid-cols-2">
            {ACTIVE_MANAGERS.map((manager) => (
              <ScoreEntryRow
                key={manager.id}
                manager={manager}
                game={game}
                score={scores[manager.id]}
                placing={placingByManager.get(manager.id)}
                onChange={(score) => onScore(manager.id, score)}
              />
            ))}
          </div>

          {leader && (
            <p className="mt-3 border-t border-line pt-3 text-[0.75rem] text-ink-dim">
              Leading:{' '}
              <strong className="font-bold text-ink">{getManager(leader.managerId).name}</strong> on{' '}
              <strong className="tabular font-bold text-accent-deep">
                {formatScore(leader.score, game.scoring.format, game.scoring.decimals)}
              </strong>{' '}
              {game.scoring.unit}
              {complete ? '. All scores in.' : `. ${FIELD_SIZE - entered} still to go.`}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
