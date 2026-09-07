import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/** Native select at the reference metrics: 46px tall, 10px radius. */
export function Select({
  label,
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className={cn('grid gap-[7px]', className)}>
      {label && (
        <span className="text-[11px] font-extrabold text-ink-mute uppercase tracking-[0.5px]">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        <select
          className={cn(
            'h-[46px] w-full cursor-pointer appearance-none rounded-tile border border-line-strong bg-surface pr-9 pl-3.5',
            'text-[13px] font-bold text-ink shadow-[0_1px_2px_rgba(15,23,42,.04)]',
            'transition focus:border-accent focus:outline-none',
          )}
          {...rest}
        >
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={15}
          strokeWidth={2.4}
          className="pointer-events-none absolute right-3 text-ink-mute"
        />
      </span>
    </label>
  );
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('grid gap-[7px]', className)}>
      <span className="text-[11px] font-extrabold tracking-[0.5px] text-ink-mute uppercase">
        {label}
      </span>
      {children}
      {hint && <span className="text-[11px] font-medium text-ink-dim">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-[46px] w-full rounded-tile border border-line-strong bg-surface px-3.5 text-[13px] font-bold text-ink',
        'placeholder:font-medium placeholder:text-ink-dim shadow-[0_1px_2px_rgba(15,23,42,.04)]',
        'transition focus:border-accent focus:outline-none',
        className,
      )}
      {...rest}
    />
  );
}
