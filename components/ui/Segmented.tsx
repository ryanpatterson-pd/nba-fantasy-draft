'use client';

import { cn } from '@/lib/utils/cn';

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

/** Small pill switch used for tabs, sort keys and lottery weighting modes. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-tile border border-line bg-surface p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[calc(var(--radius-sm)-2px)] font-semibold whitespace-nowrap transition-all',
              size === 'sm' ? 'px-2.5 py-1 text-[0.7rem]' : 'px-3 py-1.5 text-xs',
              active ? 'accent-solid' : 'text-ink-dim hover:bg-surface-3 hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
