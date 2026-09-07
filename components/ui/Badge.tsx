import { cn } from '@/lib/utils/cn';

type Tone =
  | 'accent'
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'warning'
  | 'outline'
  /** Ceremony tones, for silverware and finals runs. */
  | 'gold'
  | 'gold-soft'
  | 'royal'
  | 'royal-soft';

/** Exact tints from the reference pill set, plus the ceremony additions. */
const TONES: Record<Tone, string> = {
  accent: 'border-accent-border bg-accent-bg text-accent-deep',
  neutral: 'border-[#dfe4eb] bg-[#f1f3f6] text-[#6b7280]',
  positive: 'border-[#bce8cd] bg-[#e8f8ee] text-[#168347]',
  negative: 'border-negative-line bg-negative-soft text-negative',
  warning: 'border-[#f3d39f] bg-[#fff4e5] text-[#c76c09]',
  outline: 'border-line-strong bg-surface text-ink-dim',
  gold: 'border-[#e9d78f] bg-gradient-to-b from-gold-2 to-gold text-[#2a1707] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]',
  'gold-soft': 'border-gold-border bg-gold-bg text-gold-deep',
  royal: 'border-royal-2/25 bg-[#f3eefb] text-royal-2',
  'royal-soft': 'border-[#e5deef] bg-[#faf8fd] text-royal-2',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn('pill', TONES[tone], className)}>{children}</span>;
}

/** Placing pill used by ladders and season tables. */
export function RankPill({ rank, className }: { rank: number; className?: string }) {
  const tone =
    rank === 1
      ? 'accent-solid'
      : rank <= 3
        ? 'border border-accent-border bg-accent-bg text-accent-deep'
        : 'border border-line bg-surface-2 text-ink-dim';

  return (
    <span
      className={cn(
        'tabular inline-grid h-7 w-7 place-items-center rounded-[9px] text-[12px] font-black',
        tone,
        className,
      )}
    >
      {rank}
    </span>
  );
}
