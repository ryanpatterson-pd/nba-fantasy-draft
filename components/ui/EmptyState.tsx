import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  icon = 'sparkle',
  title,
  copy,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  copy?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line-strong px-6 py-12 text-center',
        className,
      )}
    >
      <span className="accent-chip flex h-11 w-11 items-center justify-center rounded-full">
        <Icon name={icon} size={20} />
      </span>
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {copy && <p className="max-w-sm text-sm text-ink-dim">{copy}</p>}
      {action}
    </div>
  );
}
