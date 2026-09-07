'use client';

import { useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getManager } from '@/lib/data/managers';
import { ordinal, pct } from '@/lib/utils/format';

/** Full-screen reveal shown the moment the wheel settles on a name. */
export function PickReveal({
  managerId,
  pick,
  chance,
  onDismiss,
}: {
  managerId: string;
  pick: number;
  chance: number | null;
  onDismiss: () => void;
}) {
  const manager = getManager(managerId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' || event.key === 'Enter') onDismiss();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pick ${pick} drawn`}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className="on-dark dark-wash animate-rise w-full max-w-md rounded-card p-7 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="eyebrow">On the clock</p>
        <p className="tabular mt-1 text-6xl leading-none font-extrabold text-accent-deep">
          {String(pick).padStart(2, '0')}
        </p>
        <p className="label-xs mt-1">{ordinal(pick)} selection</p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Avatar manager={manager} size="xl" />
          <h2 className="text-3xl font-extrabold text-ink">{manager.name}</h2>
          <p className="text-sm font-semibold text-ink-dim">{manager.fullName}</p>
          {chance !== null && <p className="label-xs">Drawn at {pct(chance)}</p>}
        </div>

        <Button variant="primary" size="lg" className="mt-7 w-full" onClick={onDismiss} icon="check">
          Lock it in
        </Button>
        <p className="mt-2 text-[0.68rem] text-ink-mute">
          Press enter, or click outside this card, to continue
        </p>
      </div>
    </div>
  );
}
