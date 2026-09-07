'use client';

import { useMemo, useState } from 'react';
import { DraftBoard } from '@/components/draft/DraftBoard';
import { DraftLadder } from '@/components/draft/DraftLadder';
import { GameCard } from '@/components/draft/GameCard';
import { LotteryWheel } from '@/components/draft/LotteryWheel';
import { OddsPanel } from '@/components/draft/OddsPanel';
import { PickReveal } from '@/components/draft/PickReveal';
import { useDraftNight } from '@/components/draft/useDraftNight';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { Segmented } from '@/components/ui/Segmented';
import { StatCard } from '@/components/ui/StatCard';
import { DRAFT_GAMES } from '@/lib/data/draft-games';
import { computeOdds } from '@/lib/draft/lottery';
import {
  FIELD_SIZE,
  MAX_POSSIBLE_POINTS,
  POINTS_LADDER,
  formatPoints,
  pointsRemaining,
} from '@/lib/draft/scoring';
import { getManager } from '@/lib/data/managers';
import { num } from '@/lib/utils/format';

type Tab = 'games' | 'ladder' | 'lottery' | 'board';

const TABS: { value: Tab; label: string }[] = [
  { value: 'games', label: 'Games' },
  { value: 'ladder', label: 'Ladder' },
  { value: 'lottery', label: 'Lottery' },
  { value: 'board', label: 'Draft board' },
];

/**
 * Draft night control room.
 *
 * Games feed points, points feed lottery entries, the wheel converts entries
 * into a pick order. All four steps live behind one set of tabs so the night
 * can be run from a single screen.
 */
export function DraftHub({ seasonId }: { seasonId: string }) {
  const draft = useDraftNight(seasonId);
  const [tab, setTab] = useState<Tab>('games');
  const [reveal, setReveal] = useState<{ managerId: string; pick: number; chance: number | null } | null>(
    null,
  );

  const odds = useMemo(
    () => computeOdds(draft.standings, draft.state.weighting, draft.remainingIds),
    [draft.standings, draft.state.weighting, draft.remainingIds],
  );

  const nextPick = draft.draftComplete ? null : draft.state.picks.length + 1;
  const leader = draft.standings[0];
  const remainingPoints = pointsRemaining(draft.state.results);

  function handleResult(managerId: string) {
    const chance = odds.find((row) => row.managerId === managerId)?.chance ?? null;
    const pick = draft.state.picks.length + 1;
    draft.assignPick(managerId);
    setReveal({ managerId, pick, chance });
  }

  // Hold the UI back for one tick while the saved state is read, otherwise the
  // first paint would show an empty ladder before the real results arrive.
  if (!draft.hydrated) {
    return (
      <Card className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <span className="accent-chip flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="dice" size={20} />
        </span>
        <p className="text-base font-bold text-ink">Loading draft night</p>
        <p className="max-w-sm text-sm text-ink-mute">
          Reading this weekend&apos;s saved results from your browser.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status row. Mobile: one card at a time in a horizontal swipe row (each
          ~85% wide so the next peeks). sm and up: the usual grid. */}
      <section className="flex w-full max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible xl:grid-cols-4 [&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-auto [&::-webkit-scrollbar]:hidden">
        <StatCard
          label="Games scored"
          value={`${draft.completedGameIds.length}/${DRAFT_GAMES.length}`}
          unit="complete"
          icon="dice"
          trend={{ value: `${num(remainingPoints)} pts still live`, direction: 'flat' }}
        />
        <StatCard
          label="Ladder leader"
          value={leader && leader.points > 0 ? getManager(leader.managerId).name : '—'}
          unit={leader && leader.points > 0 ? `${formatPoints(leader.points)} pts` : 'no results yet'}
          icon="crown"
          trend={
            leader && leader.points > 0
              ? { value: `${leader.firsts} game ${leader.firsts === 1 ? 'win' : 'wins'}`, direction: 'up' }
              : undefined
          }
        />
        <StatCard
          label="Best next-spin odds"
          value={odds.length > 0 ? `${(odds[0].chance * 100).toFixed(1)}%` : '—'}
          unit={odds.length > 0 ? getManager(odds[0].managerId).name : 'draft complete'}
          icon="wheel"
        />
        <StatCard
          label="Picks drawn"
          value={`${draft.state.picks.length}/${FIELD_SIZE}`}
          unit={nextPick ? `pick ${nextPick} next` : 'order locked'}
          icon="target"
        />
      </section>

      {/* Tabs + reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented options={TABS} value={tab} onChange={setTab} ariaLabel="Draft night sections" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="outline">
            <Icon name="lock" size={11} />
            Saved on this device
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            icon="minus"
            onClick={draft.undoLastPick}
            disabled={draft.state.picks.length === 0}
          >
            Undo pick
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon="refresh"
            onClick={() => {
              if (window.confirm('Clear every game result and the draft board for this weekend?')) {
                draft.resetEverything();
              }
            }}
          >
            Reset night
          </Button>
        </div>
      </div>

      {tab === 'games' && (
        <section className="flex flex-col gap-3">
          <Card className="px-4 py-3">
            <p className="text-[0.8125rem] text-ink-dim">
              Enter each manager&apos;s raw score and the placings work themselves out. Every game is
              worth the same: first place scores{' '}
              <strong className="font-bold text-accent-deep">{FIELD_SIZE} points</strong>, last scores{' '}
              <strong className="font-bold text-ink">1</strong>, and a perfect weekend is{' '}
              <strong className="font-bold text-ink">{MAX_POSSIBLE_POINTS}</strong>. Equal scores tie
              and split the points for the places they occupy. Only fully entered games count towards
              the ladder.
            </p>
          </Card>
          {DRAFT_GAMES.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              result={draft.state.results[game.id]}
              onScore={(managerId, score) => draft.setScore(game.id, managerId, score)}
              onClear={() => draft.clearGame(game.id)}
            />
          ))}
        </section>
      )}

      {tab === 'ladder' && (
        <section className="grid gap-3 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <DraftLadder
            standings={draft.standings}
            odds={odds}
            completedCount={draft.completedGameIds.length}
          />
          <Card>
            <CardHeader label="Points ladder" meta="Per game" />
            <ul className="grid grid-cols-2 gap-px bg-line">
              {POINTS_LADDER.map((entry) => (
                <li key={entry.placing} className="flex items-center justify-between bg-surface px-3 py-2">
                  <span className="label-xs">{entry.placing}. place</span>
                  <span className="tabular text-sm font-bold text-ink">
                    {entry.points}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-4 py-3 text-[0.7rem] leading-snug text-ink-mute">
              Ties on points are separated by game wins, then by average placing. The ladder decides
              lottery entries, not the draft order itself.
            </div>
          </Card>
        </section>
      )}

      {tab === 'lottery' && (
        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="flex items-center justify-center p-6">
            {draft.completedGameIds.length === 0 ? (
              <EmptyState
                icon="dice"
                title="No results entered yet"
                copy="Score at least one game and the wheel will load with real odds. Until then everyone would be on identical entries."
                action={
                  <Button variant="primary" size="sm" onClick={() => setTab('games')} iconRight="arrow-right">
                    Enter game results
                  </Button>
                }
              />
            ) : (
              <LotteryWheel
                odds={odds}
                nextPick={nextPick}
                disabled={draft.draftComplete}
                onResult={handleResult}
              />
            )}
          </Card>
          <OddsPanel odds={odds} weighting={draft.state.weighting} onWeightingChange={draft.setWeighting} />
        </section>
      )}

      {tab === 'board' && (
        <section className="flex flex-col gap-3">
          <DraftBoard picks={draft.state.picks} standings={draft.standings} />
          {draft.draftComplete ? (
            <Card className="on-dark dark-wash px-4 py-4 text-center">
              <p className="eyebrow">Order locked</p>
              <p className="mt-1 text-sm text-ink-dim">
                Twelve picks drawn. Copy this order into ESPN and the weekend is officially over.
              </p>
            </Card>
          ) : (
            <Card className="px-4 py-4">
              <p className="text-sm text-ink-dim">
                {draft.state.picks.length === 0
                  ? 'No picks drawn yet. Head to the lottery tab and spin for pick one.'
                  : `Pick ${nextPick} is next. Spin again on the lottery tab.`}
              </p>
            </Card>
          )}
        </section>
      )}

      {reveal && (
        <PickReveal
          managerId={reveal.managerId}
          pick={reveal.pick}
          chance={reveal.chance}
          onDismiss={() => {
            setReveal(null);
            setTab('board');
          }}
        />
      )}
    </div>
  );
}
