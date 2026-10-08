'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameBackground } from '@/components/draft/GameBackground';
import { SlideScoreInput } from '@/components/draft/SlideScoreInput';
import { SheetSettings } from '@/components/draft/SheetSettings';
import { useDraftNight } from '@/components/draft/useDraftNight';
import { LeagueLogo } from '@/components/layout/LeagueLogo';
import { Icon } from '@/components/ui/Icon';
import { FORMAT_LABELS, DRAFT_GAMES } from '@/lib/data/draft-games';
import { ACTIVE_MANAGERS } from '@/lib/data/managers';
import { placingsFor } from '@/lib/draft/scoring';
import { hasSheetUrl, pushToSheet } from '@/lib/draft/sheet-sync';
import { cn } from '@/lib/utils/cn';

/** Short, screen-friendly hint for what to type per scoring format. */
function entryHint(unit: string, format: string): string {
  if (format === 'time') return 'Enter the finishing time for each player.';
  if (format === 'placing') return 'Enter finishing position for each player.';
  return `Enter ${unit} for each player.`;
}

/**
 * Presentation-style score sheet — the "draft games" deck.
 *
 * Cinematic one-game-per-slide layout: an arena top bar with the league logo
 * and the game number, a huge display title over a photographic backdrop, and
 * the dark ENTER RESULTS panel with every manager's score input. Prev/Next (and
 * the arrow keys) page through like a slide deck; a numbered pager jumps around.
 *
 * All scoring runs through the same `useDraftNight` store as the control room,
 * so anything typed here flows straight into the ladder, odds and board. An
 * optional Google Sheet backup pushes a full snapshot on demand.
 */
export function DraftSlideshow({ seasonId }: { seasonId: string }) {
  const draft = useDraftNight(seasonId);
  const [index, setIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [sync, setSync] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const stageRef = useRef<HTMLDivElement>(null);

  const game = DRAFT_GAMES[index];
  const total = DRAFT_GAMES.length;
  const num = String(game.order).padStart(2, '0');

  const scores = useMemo(
    () => draft.state.results[game.id]?.scores ?? {},
    [draft.state.results, game.id],
  );
  const placings = useMemo(() => placingsFor(game, scores), [game, scores]);
  const placingByManager = useMemo(
    () => new Map(placings.map((p) => [p.managerId, p])),
    [placings],
  );
  const entered = placings.length;

  const goTo = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(total - 1, next))),
    [total],
  );
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }, []);

  const saveToSheet = useCallback(async () => {
    if (!hasSheetUrl()) {
      setShowSettings(true);
      return;
    }
    setSync('saving');
    const result = await pushToSheet(draft.state);
    setSync(result.ok ? 'saved' : 'error');
    window.setTimeout(() => setSync('idle'), 2600);
  }, [draft.state]);

  if (!draft.hydrated) {
    return (
      <div className="on-dark rail-wash flex min-h-[70vh] flex-col items-center justify-center gap-3 rounded-panel text-center">
        <span className="accent-chip flex h-11 w-11 items-center justify-center rounded-full">
          <Icon name="dice" size={20} />
        </span>
        <p className="text-base font-bold text-white">Loading score sheet</p>
      </div>
    );
  }

  // Column A/B split so the panel reads top-to-bottom, left column then right.
  const half = Math.ceil(ACTIVE_MANAGERS.length / 2);
  const columns = [ACTIVE_MANAGERS.slice(0, half), ACTIVE_MANAGERS.slice(half)];

  return (
    <div className="flex flex-col gap-3">
      {/* Utility bar — not part of the slide; hidden in fullscreen via CSS. */}
      <div className="flex flex-wrap items-center justify-end gap-2" data-slide-chrome>
        <button
          type="button"
          onClick={saveToSheet}
          disabled={sync === 'saving'}
          className={cn(
            'inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[12px] font-bold transition',
            sync === 'error'
              ? 'border-negative-line bg-negative-soft text-negative'
              : 'border-line-strong bg-surface text-ink hover:border-accent hover:text-accent-deep',
          )}
        >
          <Icon name={sync === 'saved' ? 'check' : 'upload'} size={14} />
          {sync === 'saving'
            ? 'Saving…'
            : sync === 'saved'
              ? 'Saved to sheet'
              : sync === 'error'
                ? 'Save failed'
                : 'Save to sheet'}
        </button>
        <button
          type="button"
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 py-2 text-[12px] font-bold text-ink transition hover:border-accent hover:text-accent-deep"
        >
          <Icon name="sliders" size={14} />
          Sheet setup
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 py-2 text-[12px] font-bold text-ink transition hover:border-accent hover:text-accent-deep"
        >
          <Icon name="sparkle" size={14} />
          Fullscreen
        </button>
      </div>

      {showSettings && <SheetSettings onClose={() => setShowSettings(false)} />}

      {/* ============ THE SLIDE STAGE ============ */}
      <div
        ref={stageRef}
        className="on-dark relative isolate flex aspect-[16/9] max-h-[82vh] min-h-[520px] w-full flex-col overflow-hidden rounded-panel border border-accent/20 bg-dark-deep shadow-raised"
      >
        <GameBackground key={game.id} gameId={game.id} />

        {/* ---- Top bar ---- */}
        <header className="relative z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-black/30 px-5 py-3 backdrop-blur-sm sm:px-7">
          <div className="flex items-center gap-3 sm:gap-4">
            <LeagueLogo variant="full" className="h-8 w-auto sm:h-10" />
            <span className="hidden h-6 w-px bg-white/15 sm:block" />
            <span className="hidden text-[0.72rem] font-black tracking-[0.3em] text-white/70 uppercase sm:inline">
              Draft Games
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[0.7rem] font-black tracking-[0.25em] text-white/55 uppercase">
              Game
            </span>
            <span className="text-2xl font-black tracking-tight text-accent-2 sm:text-3xl">
              {num}
            </span>
          </div>
        </header>

        {/* ---- Body: title column + results panel ---- */}
        <div className="relative z-10 grid flex-1 grid-cols-1 gap-4 overflow-hidden p-5 sm:p-7 lg:grid-cols-[1fr_minmax(430px,1.05fr)]">
          {/* Left: the big title block. When the background art already carries
              the title (game.titleInArt), the code heading is suppressed so the
              two don't stack — only the lower meta + description remain. */}
          <div className="flex min-w-0 flex-col justify-between">
            <div>
              {!game.titleInArt && (
                <>
                  <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
                    Game {num} · {FORMAT_LABELS[game.format]}
                  </p>
                  <h1 className="mt-2 bg-gradient-to-br from-white via-[#ffe9d4] to-[#ffb061] bg-clip-text text-[2.4rem] leading-[0.92] font-black tracking-[-0.03em] text-transparent uppercase sm:text-[3.2rem] lg:text-[3.8rem]">
                    {game.name}
                  </h1>
                </>
              )}
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.72rem] font-bold tracking-wide text-white/70 uppercase">
                <span className="inline-flex items-center gap-2">
                  <Icon name="book" size={14} className="text-accent-2" />
                  {game.format === 'hybrid' && game.scoring.rule.includes('TBD')
                    ? 'Format TBD'
                    : game.scoring.rule}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="flag" size={14} className="text-accent-2" />
                  {game.scoring.format === 'placing'
                    ? 'Position based'
                    : game.scoring.format === 'time'
                      ? 'Timed'
                      : `${game.scoring.unit}`}
                </span>
              </div>
              <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-white/75">
                {game.description}
              </p>
            </div>
          </div>

          {/* Right: ENTER RESULTS panel */}
          <div className="flex min-h-0 flex-col rounded-panel border border-white/12 bg-black/45 p-4 backdrop-blur-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white uppercase">
                  Enter Results
                </h2>
                <p className="mt-0.5 text-[0.78rem] text-white/55">
                  {entryHint(game.scoring.unit, game.scoring.format)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => draft.clearGame(game.id)}
                disabled={entered === 0}
                className="inline-flex shrink-0 items-center gap-1.5 text-[0.75rem] font-semibold text-white/55 transition-colors hover:text-accent-2 disabled:opacity-35"
              >
                <Icon name="refresh" size={13} />
                Clear
              </button>
            </div>

            <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-x-3 gap-y-1.5 overflow-y-auto pr-0.5 sm:grid-cols-2">
              {columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  {col.map((manager) => (
                    <SlideScoreInput
                      key={manager.id}
                      manager={manager}
                      game={game}
                      score={scores[manager.id]}
                      placing={placingByManager.get(manager.id)}
                      onChange={(value) => draft.setScore(game.id, manager.id, value)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---- Footer pager ---- */}
        <footer className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 bg-black/35 px-4 py-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="inline-flex items-center gap-2 rounded-[10px] border border-white/15 bg-white/5 px-3 py-2 text-[0.78rem] font-bold text-white transition hover:border-white/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
          >
            <Icon name="chevron-left" size={15} />
            <span className="hidden sm:inline">Previous game</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {DRAFT_GAMES.map((g, i) => (
              <button
                key={g.id}
                type="button"
                aria-label={`Go to game ${i + 1}: ${g.name}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={cn(
                  'tabular grid h-8 min-w-8 place-items-center rounded-[8px] px-1.5 text-[0.8rem] font-black transition',
                  i === index
                    ? 'accent-solid'
                    : draft.completedGameIds.includes(g.id)
                      ? 'text-accent-2/80 hover:bg-white/10'
                      : 'text-white/45 hover:bg-white/10 hover:text-white/80',
                )}
              >
                {String(g.order).padStart(2, '0')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={next}
            disabled={index === total - 1}
            className="accent-solid inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-[0.78rem] font-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
          >
            <span className="hidden sm:inline">Next game</span>
            <span className="sm:hidden">Next</span>
            <Icon name="chevron-right" size={15} />
          </button>
        </footer>
      </div>

      <p className="text-center text-[0.72rem] text-ink-mute">
        Use ← → to move between games · scores save on this device as you type
      </p>
    </div>
  );
}
