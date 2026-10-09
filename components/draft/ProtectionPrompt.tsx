'use client';

import { useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { getManager } from '@/lib/data/managers';
import { ordinal } from '@/lib/utils/format';

/**
 * House-rule protection prompt.
 *
 * A manager can never fall more than five pick slots below their ladder finish.
 * When the next pick about to be drawn would hit that limit for someone still
 * in the barrel, this asks whether to hand them that pick instead of spinning.
 *
 *   Give the pick  — the protected manager takes the next pick directly.
 *   Spin anyway    — proceed to the wheel as normal.
 */
export function ProtectionPrompt({
  managerId,
  rank,
  pick,
  onGive,
  onSpin,
}: {
  managerId: string;
  /** The manager's ladder finishing position. */
  rank: number;
  /** The pick number about to be assigned. */
  pick: number;
  onGive: () => void;
  onSpin: () => void;
}) {
  const manager = getManager(managerId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Enter') onGive();
      if (event.key === 'Escape') onSpin();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onGive, onSpin]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Protect ${manager.name}?`}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <div className="on-dark dark-wash animate-rise relative w-full max-w-md overflow-hidden rounded-panel p-6 text-center shadow-2xl sm:p-8">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-2/70 to-transparent"
        />

        <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
          House rule · five-slot protection
        </p>

        <div className="mt-4 flex flex-col items-center gap-3">
          <Avatar manager={manager} size="xl" zoomable={false} />
          <h2 className="text-[clamp(24px,6vw,36px)] leading-[0.98] font-black tracking-[-0.03em] text-white uppercase">
            {manager.name}
          </h2>
          <p className="text-sm font-semibold text-white/70">
            Finished {ordinal(rank)} on the ladder
          </p>
        </div>

        <p className="mt-5 text-[0.95rem] leading-relaxed text-white/80">
          The next pick is <strong className="font-black text-accent-2">pick {pick}</strong> — five
          slots below where {manager.name} finished. By the house rule they can&apos;t fall any
          further. Give {manager.name} the next pick?
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button variant="primary" size="lg" icon="check" onClick={onGive}>
            Give {manager.name} pick {pick}
          </Button>
          <Button variant="outline" size="md" icon="wheel" onClick={onSpin}>
            No — spin as normal
          </Button>
        </div>
        <p className="mt-3 text-[0.68rem] text-white/40">
          Enter to give the pick · Esc to spin
        </p>
      </div>
    </div>
  );
}
