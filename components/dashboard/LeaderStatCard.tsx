import Link from 'next/link';
import { CountUp } from '@/components/ui/CountUp';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MascotImage } from '@/components/ui/MascotImage';
import { getManager } from '@/lib/data/managers';
import { cn } from '@/lib/utils/cn';

/**
 * A dashboard KPI card led by the manager it's about.
 *
 * The manager's mascot fills a square tile on the left (on their team colour);
 * the label, headline figure, unit and a supporting line sit to the right. Used
 * for the top-of-dashboard leaders (reigning champion, best win rate, etc.) so
 * each stat has a face. Links through to that manager's profile.
 */
export function LeaderStatCard({
  managerId,
  label,
  value,
  unit,
  sub,
  icon,
  className,
}: {
  managerId: string;
  label: string;
  value: string;
  unit?: string;
  /** Supporting line, e.g. the record. */
  sub?: string;
  icon: IconName;
  className?: string;
}) {
  const manager = getManager(managerId);

  return (
    <Link
      href={`/teams/${manager.id}`}
      style={{ borderColor: 'var(--dark)' }}
      className={cn(
        'group relative flex overflow-hidden rounded-card border bg-surface shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-raised',
        className,
      )}
    >
      {/* Square mascot, left. */}
      <div
        className="relative aspect-square w-[86px] shrink-0 overflow-hidden sm:w-[92px]"
        style={{
          background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 50%, #000))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-4xl font-black text-white/20 select-none"
        >
          {manager.name[0].toUpperCase()}
        </span>
        <MascotImage managerId={manager.id} alt={manager.name} sizes="92px" imgClassName="object-top" />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/25"
        />
      </div>

      {/* Details, right. */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3">
        <p className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-black tracking-[1px] text-accent-deep uppercase">
            {label}
          </span>
          <span className="icon-medallion h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110">
            <Icon name={icon} size={12} strokeWidth={2.2} />
          </span>
        </p>

        <p className="figure-lg min-w-0 truncate leading-none text-ink" title={value}>
          <CountUp value={value} />
          {unit && (
            <span className="ml-1.5 text-[11px] font-bold tracking-[0.2px] text-ink-dim">{unit}</span>
          )}
        </p>

        {sub && (
          <p className="truncate text-[11px] font-bold tracking-[0.2px] text-ink-dim">{sub}</p>
        )}
      </div>
    </Link>
  );
}
