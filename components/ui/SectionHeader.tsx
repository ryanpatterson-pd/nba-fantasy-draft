import { ButtonLink } from '@/components/ui/Button';
import type { IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

type SectionAction = {
  href: string;
  label: string;
  /** Trailing icon; defaults to an arrow. Use e.g. `arrow-down` for in-page jumps. */
  icon?: IconName;
};

/** Section divider: small kicker, bold title, optional line of copy and links. */
export function SectionHeader({
  kicker,
  title,
  copy,
  action,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  copy?: string;
  /** A single trailing link. */
  action?: SectionAction;
  /** Several trailing links, rendered in order. Takes precedence over `action`. */
  actions?: SectionAction[];
  className?: string;
}) {
  const links = actions ?? (action ? [action] : []);

  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-3 pt-2', className)}>
      <div className="max-w-2xl">
        {kicker && <p className="eyebrow text-[0.6rem]">{kicker}</p>}
        <h2 className="mt-1 text-xl text-ink sm:text-[1.4rem]">{title}</h2>
        {copy && <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{copy}</p>}
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <ButtonLink
              key={link.href + link.label}
              href={link.href}
              variant="outline"
              size="sm"
              iconRight={link.icon ?? 'arrow-right'}
            >
              {link.label}
            </ButtonLink>
          ))}
        </div>
      )}
    </div>
  );
}
