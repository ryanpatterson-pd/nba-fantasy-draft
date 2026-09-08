'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MascotImage } from '@/components/ui/MascotImage';
import { MascotZoomButton } from '@/components/ui/MascotZoomButton';
import { MANAGERS, getManager } from '@/lib/data/managers';
import { compareManagers, type Side } from '@/lib/stats/compare';
import { cn } from '@/lib/utils/cn';

/**
 * The manager comparison board.
 *
 * Two managers face off, mascot-first: a large square photo panel each, on the
 * manager's own colour, with a picker to swap either side and a centre control
 * to flip the two. Below the face-off, every headline career stat is drawn as a
 * dueling row — each side's figure with a shared meter between them and the
 * leader lit in their colour.
 *
 * The two managers live in the URL (`?a=ryan&b=andrew`) so a comparison is
 * shareable and links straight from a profile. Changing a picker replaces the
 * query, which re-renders the board without a full navigation.
 */
export function CompareBoard({ initialA, initialB }: { initialA: string; initialB: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const aId = params.get('a') ?? initialA;
  const bId = params.get('b') ?? initialB;

  const setSides = useCallback(
    (nextA: string, nextB: string) => {
      const query = new URLSearchParams({ a: nextA, b: nextB });
      router.replace(`/head-to-head/compare?${query.toString()}`, { scroll: false });
    },
    [router],
  );

  // Guard against picking the same manager on both sides: if a side is set to
  // the other's current manager, swap them instead of showing a mirror.
  const pickA = (id: string) => setSides(id, id === bId ? aId : bId);
  const pickB = (id: string) => setSides(id === aId ? bId : aId, id);
  const swap = () => setSides(bId, aId);

  const comparison = useMemo(() => compareManagers(aId, bId), [aId, bId]);
  const { a, b, rows, series } = comparison;

  return (
    <div className="flex flex-col gap-4">
      {/* Face-off */}
      <div className="on-dark arena-wash court-lines relative overflow-hidden rounded-panel border border-gold/25 shadow-raised">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 z-[2] h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        />

        <div className="relative z-[1] grid grid-cols-[1fr_auto_1fr]">
          <FaceoffSide side="a" managerId={aId} onPick={pickA} align="left" />

          {/* Centre seam: VS medallion + swap control. */}
          <div className="relative flex flex-col items-center justify-center gap-3 px-1 py-6 sm:px-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/55 text-[11px] font-black tracking-[1.5px] text-white uppercase shadow-[0_6px_18px_rgba(0,0,0,0.5)] backdrop-blur sm:h-14 sm:w-14 sm:text-[13px]">
              vs
            </span>
            <button
              type="button"
              onClick={swap}
              aria-label="Swap sides"
              className="group grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white/80 transition-colors hover:border-accent-2 hover:text-accent-2"
            >
              <Icon name="swap" size={15} strokeWidth={2.2} className="transition-transform group-hover:rotate-180" />
            </button>
          </div>

          <FaceoffSide side="b" managerId={bId} onPick={pickB} align="right" />
        </div>

        {/* Series strip across the base. */}
        <div className="relative z-[1] flex items-center justify-center gap-2 border-t border-white/10 bg-black/30 px-4 py-2.5 text-center">
          <Icon name="swap" size={12} className="text-white/50" aria-hidden />
          <span className="text-[11px] font-black tracking-[0.5px] text-white/80 uppercase">
            {series.games > 0 ? `${series.line} · ${series.games} meetings` : series.line}
          </span>
        </div>
      </div>

      {/* Dueling stat rows */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3">
          <SideTag managerId={aId} align="left" />
          <span className="label-xs shrink-0">Career</span>
          <SideTag managerId={bId} align="right" />
        </div>

        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <StatDuel
              key={row.key}
              label={row.label}
              aDisplay={row.aDisplay}
              bDisplay={row.bDisplay}
              aValue={row.aValue}
              bValue={row.bValue}
              leader={row.leader}
              aColour={getManager(aId).colours.primary}
              bColour={getManager(bId).colours.primary}
            />
          ))}
        </ul>
      </Card>

      {/* Deep links to each profile. */}
      <div className="flex items-center justify-between gap-3">
        <ProfileLink managerId={aId} />
        <ProfileLink managerId={bId} align="right" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- face-off side */

function FaceoffSide({
  managerId,
  onPick,
  align,
}: {
  side: Side;
  managerId: string;
  onPick: (id: string) => void;
  align: 'left' | 'right';
}) {
  const manager = getManager(managerId);

  return (
    <div className="relative">
      {/* Square mascot on the manager's colour. */}
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{
          background: `linear-gradient(${align === 'left' ? '150deg' : '210deg'}, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 45%, #000))`,
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-[92px] font-black text-white/12 select-none sm:text-[150px]"
        >
          {manager.name[0].toUpperCase()}
        </span>

        <MascotImage
          managerId={manager.id}
          alt={manager.name}
          sizes="(max-width: 640px) 50vw, 380px"
          imgClassName="object-top"
        />

        {/* Bottom-up scrim for the name, plus a seam-side fade. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"
        />
        <span
          aria-hidden
          className={cn(
            'absolute inset-0',
            align === 'left'
              ? 'bg-gradient-to-r from-transparent via-transparent to-black/45'
              : 'bg-gradient-to-l from-transparent via-transparent to-black/45',
          )}
        />

        {/* Tap the mascot to open it full size. */}
        <MascotZoomButton managerId={manager.id} />

        {/* Name + nickname over the photo. */}
        <div className={cn('absolute inset-x-0 bottom-0 z-[2] p-3 sm:p-4', align === 'right' && 'text-right')}>
          {manager.nickname && (
            <span className="block text-[9px] font-black tracking-[1px] text-accent-2 uppercase sm:text-[10px]">
              {manager.nickname}
            </span>
          )}
          <span className="block truncate text-[22px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase sm:text-[34px]">
            {manager.name}
          </span>
        </div>
      </div>

      {/* Picker below the photo. */}
      <SidePicker value={managerId} onPick={onPick} />
    </div>
  );
}

/** Native select styled as a dark control, sitting under a mascot. */
function SidePicker({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  return (
    <label className="relative block border-t border-white/10">
      <span className="sr-only">Choose manager</span>
      <select
        value={value}
        onChange={(event) => onPick(event.target.value)}
        className="h-11 w-full cursor-pointer appearance-none bg-black/40 px-3 pr-8 text-center text-[12px] font-black tracking-[0.4px] text-white uppercase transition-colors hover:bg-black/55 focus:outline-none"
      >
        {MANAGERS.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.name}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        strokeWidth={2.4}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-white/60"
      />
    </label>
  );
}

/* --------------------------------------------------------------- stat duel */

function StatDuel({
  label,
  aDisplay,
  bDisplay,
  aValue,
  bValue,
  leader,
  aColour,
  bColour,
}: {
  label: string;
  aDisplay: string;
  bDisplay: string;
  aValue: number;
  bValue: number;
  leader: Side;
  aColour: string;
  bColour: string;
}) {
  // Meter split: each side's share of the pair total, so the bar leans toward
  // the bigger number. When both are zero the bar sits centred.
  const total = aValue + bValue;
  const aShare = total > 0 ? (aValue / total) * 100 : 50;
  const bShare = 100 - aShare;

  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'tabular text-[15px] font-black tracking-[-0.02em] transition-colors sm:text-base',
            leader === 'a' ? 'text-ink' : 'text-ink-dim',
          )}
        >
          {aDisplay}
          {leader === 'a' && <WinDot />}
        </span>
        <span className="label-xs shrink-0 px-2 text-center">{label}</span>
        <span
          className={cn(
            'tabular text-right text-[15px] font-black tracking-[-0.02em] transition-colors sm:text-base',
            leader === 'b' ? 'text-ink' : 'text-ink-dim',
          )}
        >
          {leader === 'b' && <WinDot before />}
          {bDisplay}
        </span>
      </div>

      {/* Dueling meter: A grows from the left, B from the right. */}
      <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-surface-3">
        <span
          className="h-full rounded-l-full transition-[width] duration-500 ease-out"
          style={{
            width: `${aShare}%`,
            background: aColour,
            opacity: leader === 'a' ? 1 : 0.5,
          }}
        />
        <span
          className="h-full rounded-r-full transition-[width] duration-500 ease-out"
          style={{
            width: `${bShare}%`,
            background: bColour,
            opacity: leader === 'b' ? 1 : 0.5,
          }}
        />
      </div>
    </li>
  );
}

/** Small lit marker beside the leading figure. */
function WinDot({ before = false }: { before?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle',
        before ? 'mr-1.5' : 'ml-1.5',
      )}
      aria-label="leads"
    />
  );
}

/* ------------------------------------------------------------------ labels */

function SideTag({ managerId, align }: { managerId: string; align: 'left' | 'right' }) {
  const manager = getManager(managerId);
  return (
    <span
      className={cn(
        'flex min-w-0 items-center gap-2',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ background: manager.colours.primary }}
        aria-hidden
      />
      <span className="truncate text-[13px] font-black tracking-[-0.015em] text-ink">
        {manager.name}
      </span>
    </span>
  );
}

function ProfileLink({ managerId, align = 'left' }: { managerId: string; align?: 'left' | 'right' }) {
  const manager = getManager(managerId);
  return (
    <Link
      href={`/teams/${manager.id}`}
      className={cn(
        'inline-flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.12em] text-accent-deep uppercase hover:underline',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {align === 'left' && <Icon name="arrow-right" size={12} className="rotate-180" />}
      {manager.name}&apos;s profile
      {align === 'right' && <Icon name="arrow-right" size={12} />}
    </Link>
  );
}
