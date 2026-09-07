import { cn } from '@/lib/utils/cn';

/** Horizontal meter. `colour` overrides the accent for per-manager bars. */
export function Bar({
  value,
  max = 1,
  colour,
  className,
  height = 6,
}: {
  value: number;
  max?: number;
  colour?: string;
  className?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <span
      className={cn('block w-full overflow-hidden rounded-full bg-surface-3', className)}
      style={{ height }}
      role="presentation"
    >
      <span
        className="block h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, background: colour ?? 'var(--accent)' }}
      />
    </span>
  );
}

/** Win/loss split bar used on team pages. Drawn games get their own segment. */
export function SplitBar({
  wins,
  losses,
  ties = 0,
  className,
}: {
  wins: number;
  losses: number;
  ties?: number;
  className?: string;
}) {
  const total = Math.max(1, wins + losses + ties);
  return (
    <span className={cn('flex h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}>
      <span className="h-full bg-accent" style={{ width: `${(wins / total) * 100}%` }} />
      <span className="h-full bg-accent-2" style={{ width: `${(ties / total) * 100}%` }} />
      <span className="h-full bg-line-strong" style={{ width: `${(losses / total) * 100}%` }} />
    </span>
  );
}

/** Compact bar chart for weekly scores and season shapes. */
export function SparkBars({
  values,
  colour,
  className,
  height = 34,
}: {
  values: number[];
  colour?: string;
  className?: string;
  height?: number;
}) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return (
    <span className={cn('flex items-end gap-[3px]', className)} style={{ height }} role="presentation">
      {values.map((value, index) => {
        const ratio = (value - min) / span;
        return (
          <span
            key={index}
            className="flex-1 rounded-[2px]"
            style={{
              height: `${18 + ratio * 82}%`,
              background: colour ?? 'var(--accent)',
              opacity: 0.4 + ratio * 0.6,
            }}
          />
        );
      })}
    </span>
  );
}
