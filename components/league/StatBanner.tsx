import { cn } from '@/lib/utils/cn';

/**
 * Full-width headline figure on a charcoal strip: label left, figure centred,
 * context right. The banner from the reference layout. Once per page at most.
 */
export function StatBanner({
  label,
  value,
  caption,
  footnote,
  className,
}: {
  label: string;
  value: string;
  caption?: string;
  footnote?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'on-dark dark-wash relative grid gap-2 overflow-hidden rounded-card px-5 py-3.5',
        'sm:grid-cols-[1fr_auto_1fr] sm:items-center',
        className,
      )}
    >
      <span className="label-xs">{label}</span>
      <span className="flex items-baseline justify-center gap-2">
        <span className="figure-xl text-ink">{value}</span>
        {caption && <span className="label-xs">{caption}</span>}
      </span>
      <span className="label-xs sm:text-right">{footnote}</span>
    </div>
  );
}
