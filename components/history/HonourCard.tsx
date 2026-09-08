import { MascotImage } from '@/components/ui/MascotImage';
import { MascotZoomButton } from '@/components/ui/MascotZoomButton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { getManager } from '@/lib/data/managers';
import { cn } from '@/lib/utils/cn';

export type HonourTone = 'champion' | 'finalist' | 'honour' | 'spoon';

/**
 * A single season honour.
 *
 * A square mascot photo on the left, a smoky-charcoal detail panel on the right:
 * the honour label with its icon, the manager's name, a supporting line (ladder
 * position) and the record chip. On brand with the rest of the site — charcoal
 * and orange, no purple or gold. The champion is lifted with an orange accent
 * edge and a warm glow; the wooden spoon is muted.
 */
export function HonourCard({
  label,
  managerId,
  detail,
  chip,
  icon,
  tone = 'honour',
  className,
}: {
  label: string;
  /** Undefined renders an empty plaque rather than disappearing. */
  managerId?: string;
  detail?: string;
  chip?: string;
  icon: IconName;
  tone?: HonourTone;
  className?: string;
}) {
  const manager = managerId ? getManager(managerId) : undefined;
  const isChampion = tone === 'champion';
  const isSpoon = tone === 'spoon';

  return (
    <div
      className={cn(
        'group relative flex overflow-hidden rounded-card border bg-dark shadow-card',
        isChampion
          ? 'border-accent/55 shadow-[0_14px_34px_rgba(239,101,17,0.22)]'
          : 'border-white/10',
        className,
      )}
    >
      {/* Champion gets an orange top edge, echoing the site's accent cards. */}
      {isChampion && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-[3] h-[3px] bg-gradient-to-r from-accent to-accent-2"
        />
      )}

      {/* Square mascot photo, left. */}
      <div
        className="relative aspect-square w-[38%] max-w-[128px] shrink-0 overflow-hidden"
        style={{
          background: manager
            ? `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} ${isChampion ? 52 : 46}%, #000))`
            : 'var(--dark-2)',
        }}
      >
        {manager ? (
          <>
            <span
              aria-hidden
              className="absolute inset-0 grid place-items-center text-[64px] leading-none font-black text-white/15 select-none"
            >
              {manager.name[0].toUpperCase()}
            </span>
            <MascotImage
              managerId={manager.id}
              alt={manager.name}
              sizes="128px"
              imgClassName={cn('object-top', isSpoon && 'opacity-90 grayscale-[0.55]')}
            />
            {/* Seam fade toward the detail panel so the two sides meet cleanly. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/40"
            />
            {isChampion && (
              <span
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,133,52,0.25),transparent_60%)]"
              />
            )}
            <MascotZoomButton managerId={manager.id} caption={detail} />
          </>
        ) : (
          <span className="absolute inset-0 grid place-items-center text-3xl font-black text-white/25">
            —
          </span>
        )}
      </div>

      {/* Detail panel, right. */}
      <div className="on-dark flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3">
        <p className="flex items-center gap-1.5">
          <span
            className={cn(
              'grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border',
              isChampion
                ? 'border-accent/50 bg-accent/20 text-accent-2'
                : isSpoon
                  ? 'border-white/12 bg-white/[0.06] text-white/45'
                  : 'border-white/12 bg-white/[0.06] text-white/70',
            )}
          >
            <Icon name={icon} size={11} strokeWidth={2.1} aria-hidden />
          </span>
          <span
            className={cn(
              'text-[10px] font-black tracking-[0.9px] uppercase',
              isChampion ? 'text-accent-2' : 'text-white/55',
            )}
          >
            {label}
          </span>
        </p>

        <p
          className={cn(
            'truncate text-[22px] leading-[0.95] font-black tracking-[-0.03em]',
            isSpoon ? 'text-white/85' : 'text-white',
          )}
          title={manager?.name}
        >
          {manager?.name ?? '—'}
        </p>

        {detail && (
          <p className="truncate text-[11px] font-semibold text-white/55">{detail}</p>
        )}

        {chip && (
          <span
            className={cn(
              'tabular mt-1 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10.5px] font-black tracking-[0.4px]',
              isChampion
                ? 'border-accent/45 bg-accent/15 text-accent-2'
                : 'border-white/12 bg-white/[0.05] text-white/70',
            )}
          >
            {chip}
          </span>
        )}
      </div>
    </div>
  );
}
