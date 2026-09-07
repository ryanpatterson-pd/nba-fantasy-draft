import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'ghost' | 'outline' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'accent-solid hover:brightness-[1.06]',
  ghost: 'border border-transparent text-ink-dim hover:bg-surface-2 hover:text-ink',
  outline:
    'border border-line-strong bg-surface text-ink shadow-[0_1px_2px_rgba(15,23,42,.04)] hover:border-accent hover:text-accent-deep',
  subtle: 'border border-line bg-surface-2 text-ink hover:bg-surface-3',
  danger: 'border border-negative-line bg-negative-soft text-negative hover:brightness-[0.98]',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-[34px] px-3 text-[12px]',
  md: 'min-h-[40px] px-4 text-[13px]',
  lg: 'min-h-[46px] px-5 text-[14px]',
};

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-tile font-extrabold tracking-[-0.015em] transition duration-[180ms] disabled:cursor-not-allowed disabled:opacity-45';

export function Button({
  variant = 'outline',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
}) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {icon && <Icon name={icon} size={16} strokeWidth={2.2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} strokeWidth={2.2} />}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'outline',
  size = 'md',
  icon,
  iconRight,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)}>
      {icon && <Icon name={icon} size={16} strokeWidth={2.2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={16} strokeWidth={2.2} />}
    </Link>
  );
}
