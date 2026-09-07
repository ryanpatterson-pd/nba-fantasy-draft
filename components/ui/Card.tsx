import { cn } from '@/lib/utils/cn';

/**
 * White card on the tinted page: hairline border, 16px radius and the soft
 * long-throw shadow from the reference design system.
 */
export function Card({
  className,
  accentEdge = false,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { accentEdge?: boolean }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-line bg-surface shadow-card',
        className,
      )}
      {...rest}
    >
      {accentEdge && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-accent to-accent-2"
        />
      )}
      {children}
    </div>
  );
}

/**
 * Panel header strip: bold title on the left, optional control on the right.
 * Each data panel is a white card capped by a dark header.
 *
 * The strip must carry its own background. `on-dark` and `on-royal` only rebind
 * the colour tokens — without a fill the white title would land on the card's
 * white surface and vanish.
 *
 * `tone="royal"` is the ceremony variant: deep purple with a gold hairline and
 * gold meta text, used where the league hands out silverware.
 */
export function CardHeader({
  label,
  meta,
  action,
  tone = 'dark',
  className,
}: {
  label: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  tone?: 'dark' | 'royal';
  className?: string;
}) {
  const royal = tone === 'royal';

  return (
    <div
      className={cn(
        'relative flex min-h-[52px] items-center justify-between gap-3 px-[18px] py-2.5',
        royal ? 'on-royal royal-wash' : 'on-dark bg-dark',
        className,
      )}
    >
      <span className="panel-title truncate">{label}</span>
      {action ?? (meta ? <span className="label-xs shrink-0 whitespace-nowrap">{meta}</span> : null)}

      {royal && <span aria-hidden className="gold-edge absolute inset-x-0 bottom-0 h-px opacity-80" />}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('p-[18px]', className)}>{children}</div>;
}
