'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useNow } from '@/lib/hooks/useNow';
import { countdownTo, formatDateTime } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * Live countdown to draft night. The clock is an external store, so the server
 * renders a stable placeholder and the client takes over after hydration
 * without any state-setting effect.
 */
export function CountdownCard({
  targetIso,
  seasonLabel,
  href = '/draft',
  className,
}: {
  targetIso: string;
  seasonLabel: string;
  href?: string;
  className?: string;
}) {
  const now = useNow();
  const countdown = now === null ? null : countdownTo(targetIso, now);
  const units = countdown
    ? [
        { label: 'Days', value: countdown.days },
        { label: 'Hrs', value: countdown.hours },
        { label: 'Min', value: countdown.minutes },
        { label: 'Sec', value: countdown.seconds },
      ]
    : [
        { label: 'Days', value: null },
        { label: 'Hrs', value: null },
        { label: 'Min', value: null },
        { label: 'Sec', value: null },
      ];

  return (
    <div
      className={cn(
        'on-dark rounded-card border border-line bg-dark-2 p-2.5 sm:p-3.5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="label-xs">{seasonLabel} draft night</span>
        <span className="accent-chip inline-flex items-center gap-1.5 rounded-tile px-2 py-[3px] text-[0.6rem] font-bold tracking-[0.1em] uppercase">
          <span className="animate-pulse-ring inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          {countdown?.done ? 'Live' : 'Scheduled'}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="rounded-tile bg-surface-2 px-2 py-1 text-center sm:py-1.5"
          >
            <div className="figure-lg text-base text-ink sm:text-xl">
              {unit.value === null ? '––' : String(unit.value).padStart(2, '0')}
            </div>
            <div className="label-xs mt-0.5 text-[0.5rem] sm:text-[0.55rem]">{unit.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-2 sm:mt-3 sm:pt-2.5">
        <span className="text-[0.66rem] text-ink-mute sm:text-[0.7rem]">
          {formatDateTime(targetIso)}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-[0.66rem] font-bold tracking-[0.08em] text-accent-deep uppercase hover:underline sm:text-[0.68rem]"
        >
          Draft hub
          <Icon name="arrow-right" size={12} />
        </Link>
      </div>
    </div>
  );
}
