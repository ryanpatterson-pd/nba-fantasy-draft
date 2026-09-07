'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MascotImage, mascotSrc } from '@/components/ui/MascotImage';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { getManager } from '@/lib/data/managers';
import { latestTeamName } from '@/lib/stats/season';
import type { HeadToHead, Manager } from '@/lib/types';
import { cn } from '@/lib/utils/cn';

/**
 * A headline head-to-head pairing, told photo-first.
 *
 * The two mascots face off — leader on the left, trailing on the right — with
 * the record on a medallion straddling the seam, mirroring the fixture preview
 * header. The label and detail sit in a compact footer beneath.
 */
export function PairingCard({
  label,
  cell,
  detail,
  icon,
}: {
  label: string;
  cell: HeadToHead;
  detail: string;
  icon: IconName;
}) {
  const leaderId = cell.wins >= cell.losses ? cell.managerId : cell.opponentId;
  const trailingId = leaderId === cell.managerId ? cell.opponentId : cell.managerId;
  const leader = getManager(leaderId);
  const trailing = getManager(trailingId);
  const leaderWins = leaderId === cell.managerId ? cell.wins : cell.losses;
  const trailingWins = cell.games - leaderWins;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      {/* Photo face-off */}
      <div className="relative grid grid-cols-2">
        <PairingPanel manager={leader} align="left" />
        <PairingPanel manager={trailing} align="right" />

        {/* Record medallion, straddling the seam. */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[3] flex -translate-x-1/2 items-center">
          <span className="tabular grid h-12 min-w-12 place-items-center rounded-full border border-white/25 bg-black/65 px-2 text-[16px] font-black text-white shadow-[0_4px_14px_rgba(0,0,0,0.55)] backdrop-blur">
            {leaderWins}–{trailingWins}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-3.5 py-3 text-center">
        <span className="flex items-center justify-center gap-2 text-[14px] font-black tracking-[0.6px] text-accent-deep uppercase">
          <Icon name={icon} size={14} className="text-accent" aria-hidden />
          {label}
        </span>
        <p className="text-[12px] leading-snug font-semibold text-ink-dim">{detail}</p>
      </div>
    </Card>
  );
}

/** One side of the pairing photo header. */
function PairingPanel({ manager, align }: { manager: Manager; align: 'left' | 'right' }) {
  const teamName = latestTeamName(manager.id);
  const viewer = usePhotoViewer();

  return (
    <Link
      href={`/teams/${manager.id}`}
      className="group/panel relative block min-h-[132px] overflow-hidden sm:min-h-[150px]"
      style={{
        background: `linear-gradient(${align === 'left' ? '150deg' : '210deg'}, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 52%, #000))`,
      }}
    >
      {/* Monogram behind the photo so the panel is never empty. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-[76px] font-black text-white/12 select-none"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt={manager.name}
        sizes="(max-width: 640px) 50vw, 220px"
        imgClassName="object-top"
      />

      {/* Scrims: bottom-up for the name, plus a seam-side fade toward centre. */}
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent"
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

      {/* Name over the photo. */}
      <div className={cn('absolute inset-x-0 bottom-0 z-[2] p-2.5', align === 'right' && 'text-right')}>
        <span className="block truncate text-[15px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
          {manager.name}
        </span>
        {teamName && (
          <span className="mt-0.5 block truncate text-[8.5px] leading-tight font-black tracking-[0.5px] text-accent-2 uppercase">
            {teamName}
          </span>
        )}
      </div>

      {/* Click-to-zoom overlay, matching the rest of the site. */}
      {viewer && (
        <button
          type="button"
          aria-label={`View ${manager.name} photo`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            viewer.open({ src: mascotSrc(manager.id), name: manager.name, caption: teamName });
          }}
          className="absolute inset-x-0 top-0 bottom-[40px] z-[1] cursor-zoom-in"
        />
      )}
    </Link>
  );
}
