'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { burstConfetti, buzz, playReveal, playTick } from '@/lib/draft/celebrate';
import type { DraftPick } from '@/lib/types';
import { ordinal } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * The finale: once all picks are locked, reveal the board one at a time from
 * the last pick up to the first, the way a real draft order is read out. Each
 * step drops in a manager with a tick; pick one lands with a fanfare and
 * confetti. A control lets you reveal the next, or skip to the full board.
 */
export function FinalReveal({
  picks,
  soundOn = true,
  onClose,
}: {
  picks: DraftPick[];
  soundOn?: boolean;
  onClose: () => void;
}) {
  // Reveal order: highest pick number first, down to pick 1.
  const order = useMemo(() => [...picks].sort((a, b) => b.pick - a.pick), [picks]);

  // How many have been revealed so far.
  const [shown, setShown] = useState(0);
  const done = shown >= order.length;

  const revealNext = useCallback(() => {
    setShown((n) => Math.min(order.length, n + 1));
  }, [order.length]);

  const revealAll = useCallback(() => setShown(order.length), [order.length]);

  // Effects on each newly revealed pick.
  useEffect(() => {
    if (shown === 0) return;
    const justShown = order[shown - 1];
    if (!justShown) return;
    if (justShown.pick === 1) {
      playReveal(soundOn);
      buzz([0, 60, 40, 120]);
      burstConfetti({ count: 220, durationMs: 3200 });
    } else {
      playTick(soundOn);
      buzz(20);
    }
  }, [shown, order, soundOn]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (done) onClose();
        else revealNext();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, onClose, revealNext]);

  // The revealed rows, in board order (pick 1 at the top) so the list builds
  // upward as lower picks come in.
  const revealed = order.slice(0, shown);
  const nextToReveal = order[shown];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Final draft order reveal"
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm"
    >
      <div className="on-dark dark-wash flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
            The draft order
          </p>
          <p className="text-lg font-black tracking-[-0.02em] text-white">
            {done ? 'The board is set' : `Counting down from pick ${order[0]?.pick ?? ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reveal"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white/70 transition-colors hover:text-white"
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Scrolling stage. Newest reveal sits at the bottom edge, above the bar. */}
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-y-auto px-4 py-4 sm:px-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
          {[...revealed]
            // Show pick 1 at the top, highest revealed at the bottom.
            .sort((a, b) => a.pick - b.pick)
            .map((pick) => (
              <RevealRow key={pick.pick} pick={pick} champion={pick.pick === 1} />
            ))}
        </div>
      </div>

      {/* Control bar. */}
      <div className="on-dark border-t border-white/10 bg-black/40 px-5 py-4">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
          <span className="tabular text-[13px] font-bold text-white/60">
            {shown}/{order.length} revealed
          </span>
          <div className="flex items-center gap-2">
            {!done && (
              <Button variant="ghost" size="sm" onClick={revealAll} className="text-white/70">
                Reveal all
              </Button>
            )}
            {done ? (
              <Button variant="primary" size="md" icon="check" onClick={onClose}>
                See the board
              </Button>
            ) : (
              <Button variant="primary" size="md" iconRight="chevron-right" onClick={revealNext}>
                {nextToReveal ? `Reveal pick ${nextToReveal.pick}` : 'Reveal next'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RevealRow({ pick, champion }: { pick: DraftPick; champion: boolean }) {
  const manager = getManager(pick.managerId);
  return (
    <div
      className={cn(
        'animate-rise flex items-center gap-4 rounded-card border px-4 py-3',
        champion
          ? 'border-accent-2/50 bg-gradient-to-r from-accent/25 to-transparent'
          : 'border-white/10 bg-white/5',
      )}
    >
      <span
        className={cn(
          'tabular grid h-12 w-12 shrink-0 place-items-center rounded-tile text-xl font-black',
          champion ? 'accent-solid' : 'border border-white/15 bg-white/10 text-white',
        )}
      >
        {pick.pick}
      </span>
      <Avatar manager={manager} size="lg" zoomable={false} />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-xl font-black tracking-[-0.02em] text-white">{manager.name}</p>
        <p className="text-[11px] font-black tracking-[0.6px] text-white/50 uppercase">
          {ordinal(pick.pick)} pick{champion ? ' · first overall' : ''}
        </p>
      </div>
      {champion && <Icon name="crown" size={22} className="shrink-0 text-accent-2" />}
    </div>
  );
}
