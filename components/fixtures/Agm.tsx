'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { StatCard } from '@/components/ui/StatCard';
import { RULE_CATEGORIES, ruleTally, type Rule, type RuleStatus } from '@/lib/data/agm';
import { cn } from '@/lib/utils/cn';

type Filter = 'all' | RuleStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'locked', label: 'Locked' },
  { value: 'vote', label: 'To vote' },
  { value: 'proposed', label: 'Proposed' },
];

const STATUS_META: Record<RuleStatus, { label: string; tone: 'positive' | 'warning' | 'neutral'; icon: IconName }> = {
  locked: { label: 'Locked in', tone: 'positive', icon: 'check' },
  vote: { label: 'To vote', tone: 'warning', icon: 'flag' },
  proposed: { label: 'Proposed', tone: 'neutral', icon: 'sparkle' },
};

/**
 * The AGM: the league rulebook and pre-season checklist.
 *
 * Rules are grouped by area and tagged locked / to-vote / proposed, so the page
 * doubles as the agenda for the annual general meeting — work down the "to vote"
 * items, decide them, and flip them to locked in lib/data/agm.ts.
 */
export function Agm({ seasonLabel }: { seasonLabel: string }) {
  const tally = useMemo(() => ruleTally(), []);
  const [filter, setFilter] = useState<Filter>('all');

  const categories = useMemo(
    () =>
      RULE_CATEGORIES.map((category) => ({
        ...category,
        rules: filter === 'all' ? category.rules : category.rules.filter((r) => r.status === filter),
      })).filter((category) => category.rules.length > 0),
    [filter],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Locked in" value={`${tally.locked}`} unit={`of ${tally.total} rules`} icon="check" />
        <StatCard label="Still to vote" value={`${tally.vote}`} unit="decide at the AGM" icon="flag" />
        <StatCard label="Proposed" value={`${tally.proposed}`} unit="ideas on the table" icon="sparkle" />
      </section>

      <Card className="on-dark rail-wash px-4 py-3.5" accentEdge>
        <div className="flex items-start gap-3">
          <span className="accent-chip mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <Icon name="book" size={16} />
          </span>
          <p className="text-[0.8125rem] leading-relaxed text-white/75">
            The rulebook for the <strong className="font-bold text-white">{seasonLabel}</strong> season.
            Locked rules are settled; work through the <strong className="font-bold text-accent-2">to
            vote</strong> items at the AGM and lock them in before tip-off. Anything here can be edited
            in one place as the league decides.
          </p>
        </div>
      </Card>

      {/* Status filter */}
      <div className="flex items-center justify-between gap-3">
        <Segmented options={FILTERS} value={filter} onChange={setFilter} size="sm" ariaLabel="Filter rules by status" />
      </div>

      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader
            label={
              <span className="flex items-center gap-2">
                <Icon name={category.icon as IconName} size={15} />
                {category.name}
              </span>
            }
            meta={`${category.rules.length} ${category.rules.length === 1 ? 'rule' : 'rules'}`}
          />
          <p className="border-b border-line bg-surface-2 px-[18px] py-2 text-[11.5px] font-semibold text-ink-mute">
            {category.blurb}
          </p>
          <ul className="divide-y divide-line">
            {category.rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function RuleRow({ rule }: { rule: Rule }) {
  const meta = STATUS_META[rule.status];
  return (
    <li className="flex flex-col gap-1.5 px-[18px] py-3.5">
      <div className="flex items-start justify-between gap-3">
        <h4
          className={cn(
            'text-[14px] font-extrabold tracking-[-0.01em] text-ink',
            rule.status === 'locked' && 'flex items-center gap-1.5',
          )}
        >
          {rule.title}
        </h4>
        <Badge tone={meta.tone} className="shrink-0 gap-1">
          <Icon name={meta.icon} size={10} />
          {meta.label}
        </Badge>
      </div>
      <p className="text-[12.5px] leading-relaxed text-ink-dim">{rule.detail}</p>
      {rule.rationale && (
        <p className="mt-0.5 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-mute">
          <Icon name="target" size={12} className="mt-0.5 shrink-0 text-ink-mute" aria-hidden />
          <span>{rule.rationale}</span>
        </p>
      )}
    </li>
  );
}
