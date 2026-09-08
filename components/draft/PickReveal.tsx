'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getManager } from '@/lib/data/managers';
import { burstConfetti } from '@/lib/draft/celebrate';
import { ordinal, pct } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * The reveal + choose-your-slot flow, shown the moment the wheel settles.
 *
 * Two beats: first the drawn manager's name lands (with a confetti burst), then
 * they choose any still-open pick from the board. Nothing is locked until they
 * confirm a slot, so the draw and the choice stay distinct — a drawn team can
 * take an early pick or gamble on a later one.
 */
export function PickReveal({
  managerId,
  chance,
  openPicks,
  onChoose,
  onCancel,
}: {
  managerId: string;
  chance: number | null;
  /** Pick numbers still available, ascending. */
  openPicks: number[];
  /** Locks the drawn manager into the chosen pick. */
  onChoose: (pick: number) => void;
  /** Abandons this draw without locking (re-opens the wheel). */
  onCancel: () => void;
}) {
  const manager = getManager(managerId);
  const [selected, setSelected] = useState<number | null>(
    openPicks.length === 1 ? openPicks[0] : null,
  );

  // Celebrate on mount, in the manager's own colours.
  useEffect(() => {
    burstConfetti({
      colours: [manager.colours.primary, manager.colours.secondary, '#ef6511', '#ffffff'],
    });
  }, [manager.colours.primary, manager.colours.secondary]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
      if (event.key === 'Enter' && selected !== null) onChoose(selected);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, onChoose, selected]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${manager.name} drawn — choose a pick`}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <div className="on-dark dark-wash animate-rise relative w-full max-w-lg overflow-hidden rounded-panel p-6 text-center shadow-2xl sm:p-8">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-2/70 to-transparent"
        />

        <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
          Out of the barrel
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Avatar manager={manager} size="xl" zoomable={false} />
          <h2 className="text-[clamp(28px,7vw,44px)] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
            {manager.name}
          </h2>
          <p className="text-sm font-semibold text-white/70">{manager.fullName}</p>
          {chance !== null && (
            <span className="tabular inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.5px] text-accent-2 uppercase">
              Drawn at {pct(chance)}
            </span>
          )}
        </div>

        {/* Choose an open slot. */}
        <div className="mt-6">
          <p className="label-xs mb-2.5">
            {manager.name}, choose your pick
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {openPicks.map((pick) => {
              const isSelected = pick === selected;
              return (
                <button
                  key={pick}
                  type="button"
                  onClick={() => setSelected(pick)}
                  aria-pressed={isSelected}
                  className={cn(
                    'tabular flex h-12 items-center justify-center rounded-tile border text-lg font-black transition-all',
                    isSelected
                      ? 'accent-solid scale-105 border-transparent'
                      : 'border-white/15 bg-white/5 text-white/80 hover:border-accent-2/60 hover:bg-white/10',
                  )}
                >
                  {pick}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          icon="check"
          disabled={selected === null}
          onClick={() => selected !== null && onChoose(selected)}
        >
          {selected !== null ? `Lock in pick ${selected}` : 'Choose a pick to continue'}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2.5 text-[0.68rem] font-bold tracking-[0.1em] text-white/45 uppercase transition-colors hover:text-white/70"
        >
          Cancel this draw
        </button>
        {selected !== null && (
          <p className="mt-2 text-[0.68rem] text-white/40">
            {manager.name} takes the {ordinal(selected)} pick · press enter to confirm
          </p>
        )}
      </div>
    </div>
  );
}
