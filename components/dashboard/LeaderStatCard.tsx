import Link from 'next/link';
import { CountUp } from '@/components/ui/CountUp';
import { Icon, type IconName } from '@/components/ui/Icon';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { MascotImage } from '@/components/ui/MascotImage';
import { getManager } from '@/lib/data/managers';
import { cn } from '@/lib/utils/cn';

/**
 * A KPI card led by a square image.
 *
 * When it's about a manager (pass `managerId`), their mascot fills the square
 * on their team colour and the whole card links to their profile. When the stat
 * belongs to the league rather than any one person (leave `managerId` out), the
 * square shows the HornPub shield on the brand dark and the card doesn't link.
 *
 * The label, headline figure (count-up animated), unit and a supporting line
 * sit to the right. Used across the dashboard leaders and the league-history
 * summary so every headline stat has a face.
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
  /** The manager this stat is about. Omit for a league-wide stat (HornPub logo). */
  managerId?: string;
  label: string;
  value: string;
  unit?: string;
  /** Supporting line, e.g. the record. */
  sub?: string;
  icon: IconName;
  className?: string;
}) {
  const manager = managerId ? getManager(managerId) : null;

  const cardClass = cn(
    'group relative flex overflow-hidden rounded-card border bg-surface shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-raised',
    className,
  );

  const square = manager ? (
    // Manager mascot on their team colour.
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
  ) : (
    // League-wide: the HornPub shield on the brand dark.
    <div className="relative aspect-square w-[86px] shrink-0 overflow-hidden bg-dark sm:w-[92px]">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 120% at 30% 20%, color-mix(in oklab, var(--accent) 40%, transparent), transparent 60%)',
        }}
      />
      <span className="absolute inset-0 grid place-items-center p-3.5">
        <LeagueLogo variant="shield" className="h-full w-full" />
      </span>
    </div>
  );

  const body = (
    <>
      {square}

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

        {sub && <p className="truncate text-[11px] font-bold tracking-[0.2px] text-ink-dim">{sub}</p>}
      </div>
    </>
  );

  // A manager card links to their profile; a league card is a plain panel.
  if (manager) {
    return (
      <Link href={`/teams/${manager.id}`} style={{ borderColor: 'var(--dark)' }} className={cardClass}>
        {body}
      </Link>
    );
  }

  return (
    <div style={{ borderColor: 'var(--dark)' }} className={cardClass}>
      {body}
    </div>
  );
}
