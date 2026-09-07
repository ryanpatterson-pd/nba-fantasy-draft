import { Icon, type IconName } from '@/components/ui/Icon';
import { SparkBars } from '@/components/ui/Bar';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

/**
 * KPI tile.
 *
 * Three rows, tight:
 *
 *   Social Media                    (icon)   <- 14px/800 dark, title case
 *   49.51M  Total Views      ▁▃▅▇            <- figure + inline unit + spark
 *   ↑ +93.5% vs 2025 YTD                     <- tinted pill
 *
 * The unit sits on the figure's baseline rather than below it, and the card is
 * sized by its content — no min-height.
 */
export function StatCard({
  label,
  value,
  unit,
  icon,
  trend,
  spark,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  spark?: number[];
  className?: string;
}) {
  return (
    <Card
      accentEdge
      // Inline border colour reliably wins over the Card's default hairline
      // (cn is a plain joiner, so a second border-* class would be ambiguous).
      style={{ borderColor: 'var(--dark)' }}
      className={cn(
        // Charcoal border all the way around, orange accent edge on top,
        // tighter padding/gaps to keep the card compact.
        'group flex flex-col gap-1.5 px-3.5 pt-2.5 pb-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-raised',
        className,
      )}
    >
      {/* Label + icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black tracking-[1px] text-accent-deep uppercase">
          {label}
        </span>
        {icon && (
          <span className="icon-medallion h-7 w-7 shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Icon name={icon} size={14} strokeWidth={2.2} />
          </span>
        )}
      </div>

      {/* Figure on its own line, so a long value (a name) is never clipped
          against the unit. Unit sits inline beside it. */}
      <div className="flex items-end justify-between gap-2">
        <p className="figure-lg min-w-0 truncate text-ink" title={value}>
          {value}
          {unit && (
            <span className="ml-1.5 text-[11px] font-bold tracking-[0.2px] text-ink-dim">
              {unit}
            </span>
          )}
        </p>
        {spark && spark.length > 1 && (
          <SparkBars values={spark} className="w-[56px] shrink-0" height={24} />
        )}
      </div>

      {trend && (
        <span
          className={cn(
            'tabular mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-[3px] text-[10px] font-black tracking-[0.2px]',
            trend.direction === 'up' && 'border-positive-line bg-positive-soft text-positive',
            trend.direction === 'down' && 'border-negative-line bg-negative-soft text-negative',
            trend.direction === 'flat' && 'border-line-strong bg-surface-2 text-ink-dim',
          )}
        >
          {trend.direction !== 'flat' && (
            <Icon
              name={trend.direction === 'down' ? 'arrow-down' : 'arrow-up'}
              size={10}
              strokeWidth={3}
            />
          )}
          {trend.value}
        </span>
      )}
    </Card>
  );
}

/** Slim label/value pair used inside panels and profile headers. */
export function MiniStat({
  label,
  value,
  sub,
  raised = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /**
   * A charcoal top edge, matching the profile hero above, plus a lift on hover.
   * Used for the career stat grid on the coach page.
   */
  raised?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-tile border border-line bg-surface px-3.5 py-3 shadow-card',
        raised &&
          'border-t-[3px] border-t-dark transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-raised',
        className,
      )}
    >
      <div className="text-[10px] font-black tracking-[0.7px] text-ink-dim uppercase">{label}</div>
      <div className="tabular mt-1.5 text-[19px] font-extrabold tracking-[-0.04em] text-ink">
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] font-semibold text-ink-dim">{sub}</div> : null}
    </div>
  );
}
