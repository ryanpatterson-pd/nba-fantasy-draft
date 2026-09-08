'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { FixtureCard } from '@/components/fixtures/FixtureCard';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { MascotImage } from '@/components/ui/MascotImage';
import { MascotZoomButton } from '@/components/ui/MascotZoomButton';
import { Segmented } from '@/components/ui/Segmented';
import { getManager } from '@/lib/data/managers';
import type { Manager } from '@/lib/types';
import { currentRound, fixtureKey } from '@/lib/fixtures/schedule';
import { seriesLine, type MatchPreview } from '@/lib/fixtures/preview';
import { useNow } from '@/lib/hooks/useNow';
import { record } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export type RoundData = { round: number; previews: MatchPreview[] };
export type ConferenceData = { id: string; name: string; managerIds: string[] };
/** Real ladder rows per conference id, from the imported live season. */
export type StandingsData = Record<
  string,
  { managerId: string; wins: number; losses: number; ties: number; pointsFor: number }[]
>;

type Tab = 'fixtures' | 'ladder';
/** Sentinel for "no team filter". */
const ALL = '__all__';

/**
 * The upcoming season: a Fixtures tab (master-detail — a fixture list on the
 * left, the full preview on the right) and a Ladder tab (split by conference).
 *
 * Everything is passed in from the server so the stats/preview engine never
 * ships to the browser; this component only handles the view state.
 */
export function UpcomingSeason({
  rounds,
  managerIds,
  conferences,
  standings,
  started,
  seasonLabel,
}: {
  rounds: RoundData[];
  managerIds: string[];
  conferences: ConferenceData[];
  standings: StandingsData;
  started: boolean;
  seasonLabel: string;
}) {
  const [tab, setTab] = useState<Tab>('fixtures');

  return (
    <div className="flex flex-col gap-4">
      <Segmented<Tab>
        ariaLabel="Season view"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'fixtures', label: 'Fixtures' },
          { value: 'ladder', label: 'Ladder' },
        ]}
      />

      {tab === 'fixtures' ? (
        <FixturesTab rounds={rounds} managerIds={managerIds} seasonLabel={seasonLabel} />
      ) : (
        <LadderTab
          conferences={conferences}
          standings={standings}
          started={started}
          seasonLabel={seasonLabel}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- fixtures */

function FixturesTab({
  rounds,
  managerIds,
  seasonLabel,
}: {
  rounds: RoundData[];
  managerIds: string[];
  seasonLabel: string;
}) {
  // The round the user explicitly picked. Until they pick one, the view follows
  // the current round (derived from the clock), defaulting to the first round
  // before the season starts. Deriving avoids a hydration-mismatched initial
  // state and a state-syncing effect.
  const [pickedRound, setPickedRound] = useState<number | null>(null);
  const [team, setTeam] = useState<string>(ALL);
  // The fixture the user explicitly picked. The active fixture is derived from
  // it so the selection follows the list without a state-syncing effect.
  const [picked, setPicked] = useState<string | null>(null);

  const now = useNow();
  const firstRound = rounds[0]?.round ?? 1;
  const defaultRound = now === null ? firstRound : currentRound(now);
  const round = pickedRound ?? defaultRound;
  const setRound = setPickedRound;

  const teamOptions = useMemo(
    () =>
      [...managerIds]
        .map((id) => ({ id, name: getManager(id).name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [managerIds],
  );

  // A team filter ignores the round selector and shows that team's whole season.
  const filtering = team !== ALL;

  const shown: { round: number; preview: MatchPreview }[] = useMemo(() => {
    if (filtering) {
      return rounds.flatMap((r) =>
        r.previews
          .filter((p) => p.fixture.homeId === team || p.fixture.awayId === team)
          .map((preview) => ({ round: r.round, preview })),
      );
    }
    const current = rounds.find((r) => r.round === round);
    return (current?.previews ?? []).map((preview) => ({ round, preview }));
  }, [filtering, rounds, round, team]);

  // The active fixture: the user's pick if it's in the current list, otherwise
  // the first one. Derived at render so it always tracks the visible fixtures.
  const active =
    shown.find(({ preview }) => fixtureKey(preview.fixture) === picked) ?? shown[0];
  const selectedKey = active ? fixtureKey(active.preview.fixture) : null;

  // On mobile the preview sits below the list, so bring it into view on select.
  // The xl breakpoint (1280px) is where the two go side by side, so above that
  // there is nothing to scroll to.
  const previewRef = useRef<HTMLDivElement>(null);
  const selectFixture = useCallback((key: string) => {
    setPicked(key);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      // Wait a frame so the preview has switched to the chosen fixture first.
      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls: round selector + team filter */}
      <div className="flex flex-col gap-3">
        {!filtering && (
          <Card>
            <CardHeader label="Rounds" meta={`${rounds.length} rounds`} />
            {/* Mobile: a single scrollable row so the card stays short.
                sm and up: a wrapping grid that stretches to fill the width. */}
            <div
              className="flex gap-1.5 overflow-x-auto p-4 [scrollbar-width:none] sm:grid [&::-webkit-scrollbar]:hidden"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(2.25rem, 1fr))' }}
            >
              {rounds.map((r) => {
                const isActive = r.round === round;
                return (
                  <button
                    key={r.round}
                    type="button"
                    onClick={() => setRound(r.round)}
                    aria-pressed={isActive}
                    className={cn(
                      'tabular inline-grid h-9 w-9 shrink-0 place-items-center rounded-tile border px-2 text-[13px] font-black transition-colors sm:w-auto',
                      isActive
                        ? 'accent-solid border-transparent'
                        : 'border-line bg-surface-2 text-ink-dim hover:border-accent hover:bg-accent-bg hover:text-accent-deep',
                    )}
                  >
                    {r.round}
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 px-0.5">
          <h2 className="text-[17px] font-black tracking-[-0.02em] text-ink">
            {filtering ? `${getManager(team).name}'s ${seasonLabel} fixtures` : `Round ${round}`}
          </h2>
          <TeamFilter options={teamOptions} value={team} onChange={setTeam} />
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No fixtures"
          copy="Nothing scheduled for this selection."
        />
      ) : (
        /* Master-detail: fixture grid on the left, full preview on the right. */
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] xl:items-start">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {shown.map(({ round: r, preview }) => {
              const key = fixtureKey(preview.fixture);
              return (
                <FixtureListItem
                  key={key}
                  preview={preview}
                  round={r}
                  selected={key === selectedKey}
                  onSelect={() => selectFixture(key)}
                />
              );
            })}
          </div>

          <div ref={previewRef} className="min-w-0 scroll-mt-4 xl:sticky xl:top-4">
            {active ? (
              <FixtureCard key={fixtureKey(active.preview.fixture)} preview={active.preview} />
            ) : (
              <EmptyState
                icon="sparkle"
                title="Select a fixture"
                copy="Pick a match for the full preview."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One row in the fixture list.
 *
 * Shows the essentials the user asked to see up front — recent form, the last
 * meeting and the career head-to-head against that opponent — with the full
 * breakdown opening on the right once selected.
 */
function FixtureListItem({
  preview,
  round,
  selected,
  onSelect,
}: {
  preview: MatchPreview;
  round: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const home = getManager(preview.fixture.homeId);
  const away = getManager(preview.fixture.awayId);
  const [homeForm, awayForm] = preview.form;
  const favouriteIsHome = preview.favouriteId === preview.fixture.homeId;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group w-full overflow-hidden rounded-card border text-left transition-all',
        selected
          ? 'border-accent bg-accent-bg shadow-card'
          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
      )}
    >
      {/* Mascot face-off top bar, mirroring the preview header. The two photos
          fill the width edge to edge with names laid over a scrim, the round
          and edge chips pinned to the corners and a VS medallion on the seam. */}
      <div className="relative grid grid-cols-2">
        <ListTeamPanel manager={home} favoured={favouriteIsHome} align="left" />
        <ListTeamPanel manager={away} favoured={!favouriteIsHome} align="right" />

        {/* Corner chips over the photo. */}
        <span className="pointer-events-none absolute top-2 left-2 z-[4] rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-black tracking-[0.5px] text-white/90 uppercase backdrop-blur">
          Round {round}
        </span>
        <span className="pointer-events-none absolute top-2 right-2 z-[4] rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-black tracking-[0.5px] text-white/80 uppercase backdrop-blur">
          {preview.edge}
        </span>

        {/* Centre VS medallion, straddling the seam. */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-[3] flex -translate-x-1/2 items-center">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-black/60 text-[9px] font-black tracking-[1px] text-white uppercase shadow-[0_4px_14px_rgba(0,0,0,0.5)] backdrop-blur">
            vs
          </span>
        </div>
      </div>

      {/* The three things up front: form, career H2H, form */}
      <dl className="grid grid-cols-3 gap-px border-t border-line bg-line text-center">
        <MiniFact label="Form">
          <FormDots outcomes={homeForm.recent.map((r) => r.outcome)} />
        </MiniFact>
        <MiniFact label="H2H">
          <span className="text-[11px] leading-tight font-extrabold text-ink">
            {seriesLine(preview)}
          </span>
        </MiniFact>
        <MiniFact label="Form">
          <FormDots outcomes={awayForm.recent.map((r) => r.outcome)} />
        </MiniFact>
      </dl>
    </button>
  );
}

/**
 * One mascot panel in a fixture list item's top bar.
 *
 * A compact echo of the preview's TeamPanel: the mascot photo fills the panel
 * edge to edge over the manager's colour, with a bottom-up scrim and the name
 * laid over it. Deliberately not its own link or zoom target — the whole list
 * item is a single select button, so tapping anywhere opens the full preview.
 */
function ListTeamPanel({
  manager,
  favoured,
  align,
}: {
  manager: Manager;
  favoured: boolean;
  align: 'left' | 'right';
}) {
  return (
    <div
      className="relative min-h-[118px] overflow-hidden sm:min-h-[128px]"
      style={{
        background: `linear-gradient(${align === 'left' ? '150deg' : '210deg'}, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 52%, #000))`,
      }}
    >
      {/* Monogram behind the photo so the panel is never empty. */}
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center text-[64px] font-black text-white/12 select-none"
      >
        {manager.name[0].toUpperCase()}
      </span>

      <MascotImage
        managerId={manager.id}
        alt={manager.name}
        sizes="(max-width: 640px) 50vw, 200px"
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

      <MascotZoomButton managerId={manager.id} />

      {favoured && (
        <span
          className={cn(
            'absolute top-2 z-[2] inline-flex items-center gap-1 rounded-full border border-accent/50 bg-black/55 px-2 py-0.5 text-[8.5px] font-black tracking-[0.5px] text-accent-2 uppercase backdrop-blur',
            // Sits inboard of the round/edge chips so they never collide.
            align === 'left' ? 'left-2 top-9' : 'right-2 top-9',
          )}
        >
          <Icon name="star" size={8} className="text-accent-2" aria-hidden />
          Pick
        </span>
      )}

      {/* Name over the photo. */}
      <div className={cn('absolute inset-x-0 bottom-0 z-[2] p-2.5', align === 'right' && 'text-right')}>
        <span className="block truncate text-[15px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
          {manager.name}
        </span>
      </div>
    </div>
  );
}

function MiniFact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-surface px-1.5 py-3">
      <dt className="text-[8px] font-black tracking-[0.4px] text-ink-mute uppercase">{label}</dt>
      <dd className="flex min-h-[14px] items-center">{children}</dd>
    </div>
  );
}

/** Compact last-five run, oldest to newest. */
function FormDots({ outcomes }: { outcomes: ('W' | 'L' | 'D')[] }) {
  if (outcomes.length === 0) {
    return <span className="text-[9px] font-bold text-ink-mute">—</span>;
  }
  return (
    <span className="flex gap-0.5">
      {[...outcomes].reverse().map((outcome, index) => (
        <span
          key={index}
          className={cn(
            'grid h-[13px] w-[13px] place-items-center rounded-[3px] text-[8px] font-black',
            outcome === 'W' && 'bg-positive-soft text-positive',
            outcome === 'L' && 'bg-negative-soft text-negative',
            outcome === 'D' && 'bg-surface-3 text-ink-dim',
          )}
        >
          {outcome}
        </span>
      ))}
    </span>
  );
}

/** Dropdown-style team filter. */
function TeamFilter({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <Icon name="users" size={14} className="text-ink-mute" aria-hidden />
      <span className="sr-only">Filter fixtures by team</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-tile border border-line bg-surface px-3 text-[13px] font-bold text-ink focus:border-accent focus:outline-none"
      >
        <option value={ALL}>All teams</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

/* ----------------------------------------------------------------- ladder */

type LadderRow = {
  managerId: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
};

/**
 * Live ladder for the upcoming season, split by conference the way ESPN runs
 * it. Before the season starts every manager sits at 0–0 with a notice; once
 * games are played and re-imported, the real ESPN records fill in.
 */
function LadderTab({
  conferences,
  standings,
  started,
  seasonLabel,
}: {
  conferences: ConferenceData[];
  standings: StandingsData;
  started: boolean;
  seasonLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {!started && (
        <div className="flex items-center gap-2 rounded-card border border-line bg-surface-2 px-4 py-3">
          <Icon name="clock" size={14} className="shrink-0 text-ink-mute" aria-hidden />
          <p className="text-[12.5px] font-semibold text-ink-dim">
            The {seasonLabel} season hasn&apos;t started. Each conference ladder shows the ESPN
            division line-up and fills in with records once games are played.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {conferences.map((conference) => (
          <ConferenceLadder
            key={conference.id}
            conference={conference}
            rows={standings[conference.id]}
          />
        ))}
      </div>
    </div>
  );
}

function ConferenceLadder({
  conference,
  rows: realRows,
}: {
  conference: ConferenceData;
  rows?: LadderRow[];
}) {
  // Real imported standings when present; otherwise zeroed placeholder rows in
  // the conference's line-up order.
  const rows: LadderRow[] =
    realRows && realRows.length > 0
      ? realRows
      : conference.managerIds.map((managerId) => ({
          managerId,
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
        }));

  const columns: Column<LadderRow>[] = [
    {
      key: 'rank',
      header: '#',
      width: 'w-9',
      align: 'left',
      cell: (_row, index) => (
        <span className="tabular inline-grid h-7 w-7 place-items-center rounded-[9px] border border-line bg-surface-2 text-[12px] font-black text-ink-dim">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'manager',
      header: 'Manager',
      align: 'left',
      cell: (row) => {
        const manager = getManager(row.managerId);
        return (
          <span className="flex min-w-0 items-center gap-2.5">
            <Avatar manager={manager} size="sm" />
            <span className="truncate text-[13px] font-extrabold tracking-[-0.015em] text-ink">
              {manager.name}
            </span>
          </span>
        );
      },
    },
    {
      key: 'record',
      header: 'W–L',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="font-bold">{record(row.wins, row.losses, row.ties)}</span>,
    },
    {
      key: 'pf',
      header: 'PF',
      numeric: true,
      align: 'right',
      cell: (row) => <span className="text-ink-dim">{row.pointsFor.toLocaleString()}</span>,
    },
  ];

  return (
    <Card>
      <CardHeader label={conference.name} meta={`${rows.length} teams`} />
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.managerId} compact />
    </Card>
  );
}
