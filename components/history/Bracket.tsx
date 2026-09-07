import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MascotImage } from '@/components/ui/MascotImage';
import { getManager } from '@/lib/data/managers';
import type { PlayoffBracket } from '@/lib/stats/season';
import { teamNameFor } from '@/lib/stats/season';
import type { Matchup } from '@/lib/types';
import { num } from '@/lib/utils/format';
import { isDraw } from '@/lib/stats/tally';
import { cn } from '@/lib/utils/cn';

type Round = { label: string; games: Matchup[]; ordinal: string };

/**
 * Playoff bracket for a season — built like a broadcast graphic.
 *
 * Four columns run left to right: quarter finals, semi finals, the grand final,
 * then the crowned champion. Every tie is a face-off of the two mascots (the
 * photo is the hero, team name headlined, score called out); the champion column
 * is the trophy lift. Each column is vertically centred so the single grand
 * final and champion line up against the taller QF/SF stacks.
 *
 * On mobile it becomes a horizontal snap-scroll — swipe through the rounds to
 * the winner — rather than a long vertical scroll.
 */
export function Bracket({ bracket, playoffTeams }: { bracket: PlayoffBracket; playoffTeams: number }) {
  const rounds: Round[] = [
    { label: 'Quarter finals', games: bracket.quarterFinals, ordinal: 'I' },
    { label: 'Semi finals', games: bracket.semiFinals, ordinal: 'II' },
    { label: 'Grand final', games: bracket.grandFinal ? [bracket.grandFinal] : [], ordinal: 'III' },
  ];

  const byeCount = Math.max(0, playoffTeams - bracket.quarterFinals.length * 2);

  const final = bracket.grandFinal;
  const championId = final
    ? final.homeScore >= final.awayScore
      ? final.homeId
      : final.awayId
    : undefined;

  return (
    <Card>
      <CardHeader label="Playoff bracket" meta={`Top ${playoffTeams}${byeCount > 0 ? ` · ${byeCount} first-round ${byeCount === 1 ? 'bye' : 'byes'}` : ''}`} />

      <div className="on-dark rail-wash relative px-4 py-5 sm:px-6 sm:py-7">
        {/* Mobile: horizontal swipe through the columns. lg: an even 4-up grid.
            Every column centres its content vertically so the grand final and
            champion align to the middle of the taller QF/SF stacks. */}
        <div
          className={cn(
            'flex snap-x snap-mandatory gap-5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-visible',
            '[&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[52%] lg:[&>*]:w-auto',
          )}
        >
          {rounds.map((round, roundIndex) => (
            <BracketColumn
              key={round.label}
              round={round}
              withDivider={roundIndex > 0}
            />
          ))}

          {/* Champion column — the trophy lift, far right. */}
          <div className="relative flex flex-col lg:border-l lg:border-white/10 lg:pl-5">
            <ColumnHeader ordinal="★" label="Champion" />
            <div className="flex flex-1 flex-col justify-center">
              {championId && final ? (
                <ChampionColumn managerId={championId} final={final} />
              ) : (
                <p className="rounded-tile border border-dashed border-white/20 px-3 py-6 text-center text-[11px] font-bold tracking-[0.5px] text-white/45 uppercase">
                  To be decided
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ColumnHeader({ ordinal, label }: { ordinal: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-accent/45 bg-accent/15 text-[10px] font-black text-accent-2">
        {ordinal}
      </span>
      <span className="text-[11px] font-black tracking-[1.4px] text-accent-2 uppercase">{label}</span>
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
    </div>
  );
}

function BracketColumn({ round, withDivider }: { round: Round; withDivider: boolean }) {
  return (
    <div className={cn('relative flex flex-col', withDivider && 'lg:border-l lg:border-white/10 lg:pl-5 lg:pr-0')}>
      <ColumnHeader ordinal={round.ordinal} label={round.label} />
      <div className="flex flex-1 flex-col justify-center gap-4">
        {round.games.length === 0 ? (
          <p className="rounded-tile border border-dashed border-white/20 px-3 py-6 text-center text-[11px] font-bold tracking-[0.5px] text-white/45 uppercase">
            Not played
          </p>
        ) : (
          round.games.map((game, index) => (
            <BracketGame key={`${round.label}-${index}`} game={game} grand={round.label === 'Grand final'} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * One tie, as a face-off of the two mascots.
 *
 * Two stacked photo strips with a VS medallion centred on the seam between them.
 * The winner is in full colour with an accent score; the loser is dimmed and
 * desaturated. The grand final variant is taller and accent-framed.
 */
function BracketGame({ game, grand = false }: { game: Matchup; grand?: boolean }) {
  const drawn = isDraw(game);
  const homeWon = game.homeScore > game.awayScore;
  const margin = Math.abs(game.homeScore - game.awayScore);

  const sides = [
    { managerId: game.homeId, score: game.homeScore, won: drawn || homeWon },
    { managerId: game.awayId, score: game.awayScore, won: drawn || !homeWon },
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border shadow-[0_10px_28px_rgba(0,0,0,0.35)]',
        grand ? 'border-accent/55' : 'border-white/12',
      )}
    >
      {grand && (
        <span aria-hidden className="absolute inset-x-0 top-0 z-[4] h-[3px] bg-gradient-to-r from-accent to-accent-2" />
      )}

      {/* The two photo strips. The VS medallion is centred on their shared seam
          (this wrapper), so it never drifts toward the footer below. */}
      <div className="relative">
        {sides.map((side, index) => (
          <TeamStrip
            key={side.managerId}
            seasonId={game.seasonId}
            managerId={side.managerId}
            score={side.score}
            won={side.won}
            drawn={drawn}
            grand={grand}
            crown={grand && side.won && !drawn}
            divider={index === 0}
          />
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] flex -translate-y-1/2 items-center justify-center">
          <span
            className={cn(
              'grid place-items-center rounded-full border border-white/25 bg-black/70 font-black tracking-[1px] text-white uppercase shadow-[0_4px_14px_rgba(0,0,0,0.6)] backdrop-blur',
              grand ? 'h-9 w-9 text-[10px]' : 'h-7 w-7 text-[8.5px]',
            )}
          >
            vs
          </span>
        </div>
      </div>

      {/* Footer: round context + margin. */}
      <div className="relative z-[2] flex items-center justify-between gap-2 border-t border-white/10 bg-dark px-3 py-1.5">
        <span className="text-[9px] font-black tracking-[0.9px] text-white/50 uppercase">
          {game.stage === 'final' ? 'Grand final' : `Week ${game.week}`}
        </span>
        <span className="tabular text-[9px] font-black tracking-[0.5px] text-accent-2/85 uppercase">
          {drawn ? 'Drawn' : `${num(margin)} margin`}
        </span>
      </div>
    </div>
  );
}

/**
 * One team's photo strip inside a tie: the mascot fills the frame with the team
 * name and manager laid over a scrim, and the score anchored to the right.
 */
function TeamStrip({
  seasonId,
  managerId,
  score,
  won,
  drawn,
  grand,
  crown,
  divider,
}: {
  seasonId: string;
  managerId: string;
  score: number;
  won: boolean;
  drawn: boolean;
  grand: boolean;
  crown: boolean;
  divider: boolean;
}) {
  const manager = getManager(managerId);
  const teamName = teamNameFor(seasonId, manager.id);
  const dim = !won && !drawn;

  return (
    <div
      className={cn(
        'relative flex items-center overflow-hidden',
        grand ? 'h-[112px]' : 'h-[88px]',
        divider && 'border-b border-white/10',
      )}
      style={{
        background: `linear-gradient(90deg, color-mix(in oklab, ${manager.colours.primary} ${dim ? 34 : 62}%, #0b0c10) 0%, #0b0c10 78%)`,
      }}
    >
      {/* Mascot photo — the hero. Fills the left, faded into the strip. */}
      <div className="relative h-full w-[42%] max-w-[150px] shrink-0 overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center text-5xl font-black text-white/15 select-none"
        >
          {manager.name[0].toUpperCase()}
        </span>
        <MascotImage
          managerId={manager.id}
          alt={manager.name}
          sizes="150px"
          imgClassName={cn('object-top', dim && 'grayscale-[0.7] opacity-70')}
        />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b0c10]" />

        {/* Mobile: the name sits at the bottom-left of the image itself, since
            the wider centre panel is hidden on small screens. */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 to-transparent sm:hidden"
        />
        <p
          className={cn(
            'absolute inset-x-0 bottom-0 z-[1] flex items-center gap-1 truncate px-2 pb-1.5 font-black tracking-[-0.02em] uppercase sm:hidden',
            grand ? 'text-[14px] leading-[1]' : 'text-[12px] leading-[1.05]',
            won ? 'text-white' : 'text-white/80',
            dim && 'opacity-75',
          )}
          title={manager.name}
        >
          {manager.name}
          {crown && <Icon name="crown" size={11} className="shrink-0 text-accent-2" aria-label="Winner" />}
        </p>
      </div>

      {/* Team + manager in the centre panel — desktop and up. On mobile this is
          hidden and the name is drawn over the image instead (above). */}
      <div className={cn('relative z-[1] hidden min-w-0 flex-1 flex-col justify-center px-3 sm:flex', dim && 'opacity-70')}>
        <p
          className={cn(
            'truncate font-black tracking-[-0.02em] uppercase',
            grand ? 'text-[16px] leading-[1]' : 'text-[13px] leading-[1.05]',
            won ? 'text-white' : 'text-white/80',
          )}
          title={teamName ?? manager.name}
        >
          {teamName ?? manager.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-bold tracking-[0.3px] text-white/55">
          {manager.name}
          {crown && <Icon name="crown" size={11} className="shrink-0 text-accent-2" aria-label="Winner" />}
        </p>
      </div>

      {/* Score, anchored right. ml-auto keeps it pinned to the right edge on
          mobile, where the centre name panel is hidden. */}
      <div className="relative z-[1] ml-auto flex shrink-0 items-center pr-3.5 pl-2">
        <span
          className={cn(
            'tabular font-black tracking-[-0.03em]',
            grand ? 'text-[34px]' : 'text-[26px]',
            won ? 'text-accent-2' : 'text-white/45',
          )}
        >
          {num(score)}
        </span>
      </div>

      {won && !drawn && (
        <span aria-hidden className="absolute inset-y-0 right-0 z-[2] w-[3px] bg-gradient-to-b from-accent to-accent-2" />
      )}
    </div>
  );
}

/**
 * The champion column — the trophy lift on the far right.
 *
 * A big square mascot image is the centrepiece: the winner's photo fills an
 * accent-framed tile with the team name and a trophy over a scrim, and a large
 * CHAMPION wordmark beneath. The grand final score isn't repeated here — it's
 * already in the final tile beside it.
 */
function ChampionColumn({ managerId, final }: { managerId: string; final: Matchup }) {
  const manager = getManager(managerId);
  const teamName = teamNameFor(final.seasonId, manager.id);

  return (
    <div className="flex flex-col">
      {/* Big champion image, the hero of the column. */}
      <Link
        href={`/history/${final.seasonId}/review`}
        className="group/champ relative block overflow-hidden rounded-card border-2 border-accent/60 shadow-[0_18px_40px_rgba(239,101,17,0.4)]"
      >
        <span
          aria-hidden
          className="block aspect-square w-full"
          style={{
            background: `linear-gradient(150deg, ${manager.colours.primary}, color-mix(in oklab, ${manager.colours.primary} 50%, #000))`,
          }}
        >
          <span className="absolute inset-0 grid place-items-center text-[120px] leading-none font-black text-white/15 select-none">
            {manager.name[0].toUpperCase()}
          </span>
        </span>

        <MascotImage
          managerId={manager.id}
          alt={manager.name}
          sizes="(max-width: 1024px) 78vw, 320px"
          imgClassName="object-top transition-transform duration-300 group-hover/champ:scale-[1.03]"
        />

        {/* Warm gold-orange vignette + bottom scrim for the label. */}
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(255,133,52,0.28),transparent_55%)]" />
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {/* Trophy medallion, top-right. */}
        <span className="absolute top-3 right-3 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-gradient-to-b from-accent to-accent-deep text-white shadow-[0_4px_14px_rgba(0,0,0,0.5)]">
          <Icon name="trophy" size={18} strokeWidth={2.2} aria-hidden />
        </span>

        {/* Team + manager over the base of the photo. */}
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          {teamName ? (
            <>
              <p className="truncate text-[19px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
                {teamName}
              </p>
              <p className="mt-1 truncate text-[11px] font-black tracking-[0.4px] text-accent-2 uppercase">
                {manager.name}
              </p>
            </>
          ) : (
            <p className="truncate text-[22px] leading-[0.95] font-black tracking-[-0.03em] text-white uppercase">
              {manager.name}
            </p>
          )}
        </div>
      </Link>

      {/* Big CHAMPION wordmark beneath the image. */}
      <p className="mt-3.5 text-center text-[26px] leading-none font-black tracking-[0.14em] text-accent-2 uppercase">
        Champion
      </p>
      <span aria-hidden className="mx-auto mt-2.5 h-px w-20 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

      <Link
        href={`/history/${final.seasonId}/review`}
        className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-accent/55 bg-accent/15 px-3.5 py-2 text-[11px] font-black tracking-[0.5px] text-accent-2 uppercase transition-colors hover:border-accent hover:bg-accent/25"
      >
        <Icon name="book" size={12} strokeWidth={2.2} aria-hidden />
        Season review
      </Link>
    </div>
  );
}
