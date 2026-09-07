'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { MascotImage, mascotSrc } from '@/components/ui/MascotImage';
import { usePhotoViewer } from '@/components/ui/PhotoViewer';
import { getManager } from '@/lib/data/managers';
import { getSeason } from '@/lib/data/seasons';
import { FORM_SEASON, seriesLine, type ManagerForm, type MatchPreview } from '@/lib/fixtures/preview';
import { latestTeamName } from '@/lib/stats/season';
import { num } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Manager } from '@/lib/types';

/**
 * One fixture and its preview.
 *
 * Reads top to bottom: who is playing, what the model makes of it, the history
 * between them, how each side is tracking, then the written case.
 */
export function FixtureCard({ preview }: { preview: MatchPreview }) {
  const [homeForm, awayForm] = preview.form;
  const home = getManager(preview.fixture.homeId);
  const away = getManager(preview.fixture.awayId);
  const favouriteIsHome = preview.favouriteId === preview.fixture.homeId;
  const percent = Math.round(preview.probability * 100);

  return (
    <article className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {/* Cinematic photo header: the two mascots face off, names and team names
          laid over a gradient scrim. */}
      <div className="relative grid grid-cols-2">
        <TeamPanel manager={home} favoured={favouriteIsHome} align="left" />
        <TeamPanel manager={away} favoured={!favouriteIsHome} align="right" />

        {/* Centre VS medallion, straddling the seam. */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[3] flex -translate-x-1/2 items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/60 text-[10px] font-black tracking-[1px] text-white uppercase shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur">
            vs
          </span>
        </div>
      </div>

      {/* Projection */}
      <div className="border-t border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="label-xs">Projection</span>
          <span
            className={cn(
              'pill border',
              preview.edge === 'line ball'
                ? 'border-line-strong bg-surface text-ink-dim'
                : 'border-accent-border bg-accent-bg text-accent-deep',
            )}
          >
            {preview.edge}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="tabular w-[42px] shrink-0 text-[13px] font-black text-ink">
            {percent}%
          </span>
          <span className="flex h-2 flex-1 overflow-hidden rounded-full bg-line">
            <span
              className="h-full bg-gradient-to-r from-accent to-accent-2"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="tabular w-[42px] shrink-0 text-right text-[13px] font-bold text-ink-dim">
            {100 - percent}%
          </span>
        </div>
        <p className="mt-1.5 text-[11px] font-semibold text-ink-dim">
          {getManager(preview.favouriteId).name} to beat {getManager(preview.underdogId).name}
        </p>
      </div>

      {/* History */}
      <div className="grid gap-px bg-line sm:grid-cols-2">
        <div className="bg-surface px-4 py-3">
          <p className="label-xs">All-time series</p>
          <p className="mt-1 text-[13px] font-extrabold text-ink">{seriesLine(preview)}</p>
          {preview.h2h.lastMeeting ? (
            <p className="mt-0.5 text-[11px] font-semibold text-ink-dim">
              Last met {getSeason(preview.h2h.lastMeeting.seasonId)?.label ?? ''}
              {preview.h2h.lastMeeting.stage === 'regular'
                ? ` week ${preview.h2h.lastMeeting.week}`
                : ' in the finals'}
              {' · '}
              {num(Math.max(preview.h2h.lastMeeting.homeScore, preview.h2h.lastMeeting.awayScore))}–
              {num(Math.min(preview.h2h.lastMeeting.homeScore, preview.h2h.lastMeeting.awayScore))}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] font-semibold text-ink-mute">No previous meetings</p>
          )}
        </div>

        <div className="bg-surface px-4 py-3">
          <p className="label-xs">Form · {FORM_SEASON.label}</p>
          <div className="mt-1.5 flex flex-col gap-1.5">
            <FormLine form={homeForm} />
            <FormLine form={awayForm} />
          </div>
        </div>
      </div>

      {/* The written case */}
      <div className="border-t border-line px-4 py-3.5">
        <p className="label-xs">The case</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {preview.reasons.map((reason, index) => (
            <li key={index} className="flex gap-2 text-[12.5px] leading-snug text-ink-dim">
              <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 flex gap-2 border-t border-line pt-3 text-[12.5px] leading-snug font-semibold text-ink">
          <Icon
            name="sparkle"
            size={13}
            className="mt-[2px] shrink-0 text-accent-deep"
            aria-hidden
          />
          <span>{preview.verdict}</span>
        </p>
      </div>
    </article>
  );
}

/**
 * One side of the photo header.
 *
 * The mascot photo is the feature — it fills the panel edge to edge with the
 * manager's colour behind it and a bottom-up scrim so the name always reads.
 * Mirrors the coach-page hero. The whole panel links to the manager, while a
 * small badge marks the projected winner.
 */
function TeamPanel({
  manager,
  favoured,
  align,
}: {
  manager: Manager;
  favoured: boolean;
  align: 'left' | 'right';
}) {
  const teamName = latestTeamName(manager.id);
  const viewer = usePhotoViewer();

  return (
    <Link
      href={`/teams/${manager.id}`}
      className="group/panel relative block min-h-[164px] overflow-hidden sm:min-h-[188px]"
      style={{
        background: `linear-gradient(${align === 'left' ? '150deg' : '210deg'}, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 52%, #000))`,
      }}
    >
      {/* Monogram behind the photo so the panel is never empty. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-[96px] font-black text-white/12 select-none"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt={manager.name}
        sizes="(max-width: 640px) 50vw, 260px"
        imgClassName="object-top"
      />

      {/* Scrims: bottom-up for the name, plus a seam-side fade toward centre so
          the VS medallion reads and the two photos meet cleanly. */}
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

      {favoured && (
        <span
          className={cn(
            'absolute top-2.5 z-[2] inline-flex items-center gap-1 rounded-full border border-accent/50 bg-black/55 px-2 py-0.5 text-[9px] font-black tracking-[0.6px] text-accent-2 uppercase backdrop-blur',
            align === 'left' ? 'left-2.5' : 'right-2.5',
          )}
        >
          <Icon name="star" size={9} className="text-accent-2" aria-hidden />
          Pick
        </span>
      )}

      {/* Name + team name over the photo. */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-[2] p-3',
          align === 'right' && 'text-right',
        )}
      >
        <span className="block truncate text-[19px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
          {manager.name}
        </span>
        {teamName && (
          <span className="mt-1 block truncate text-[9.5px] leading-tight font-black tracking-[0.5px] text-accent-2 uppercase">
            {teamName}
          </span>
        )}
      </div>

      {/* Click-to-zoom overlay, matching the rest of the site. Stops the click
          reaching the link so the photo opens in the lightbox. */}
      {viewer && (
        <button
          type="button"
          aria-label={`View ${manager.name} photo`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            viewer.open({ src: mascotSrc(manager.id), name: manager.name, caption: teamName });
          }}
          className="absolute inset-x-0 top-0 bottom-[52px] z-[1] cursor-zoom-in"
        />
      )}
    </Link>
  );
}

/** Last five results plus the weekly average. */
function FormLine({ form }: { form: ManagerForm }) {
  const manager = getManager(form.managerId);

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-[11.5px] font-bold text-ink">
        {manager.name}
      </span>

      <span className="flex shrink-0 gap-1">
        {form.recent.length === 0 ? (
          <span className="text-[10px] font-bold text-ink-mute">No games</span>
        ) : (
          // Oldest to newest reads more naturally as a run of form.
          [...form.recent].reverse().map((result) => (
            <span
              key={`${result.week}-${result.opponentId}`}
              title={`Week ${result.week} v ${getManager(result.opponentId).name}: ${num(result.score)}–${num(result.against)}`}
              className={cn(
                'grid h-[17px] w-[17px] place-items-center rounded-[4px] text-[9.5px] font-black',
                result.outcome === 'W' && 'bg-positive-soft text-positive',
                result.outcome === 'L' && 'bg-negative-soft text-negative',
                result.outcome === 'D' && 'bg-surface-3 text-ink-dim',
              )}
            >
              {result.outcome}
            </span>
          ))
        )}
      </span>

      <span className="tabular w-[46px] shrink-0 text-right text-[11.5px] font-bold text-ink-dim">
        {form.mean > 0 ? num(Math.round(form.mean)) : '—'}
      </span>
    </div>
  );
}
