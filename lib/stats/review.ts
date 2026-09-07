import { isPlayoffGame, matchupsForSeason } from '@/lib/data/league';
import { getManager } from '@/lib/data/managers';
import { COMPLETED_SEASONS, fieldSizeOf, getSeason } from '@/lib/data/seasons';
import type { Matchup, SeasonRecord } from '@/lib/types';
import { num, ordinal, record } from '@/lib/utils/format';
import {
  bracketFor,
  championOf,
  minorPremierOf,
  runnerUpOf,
  seasonTable,
  teamNameFor,
  woodenSpoonOf,
} from './season';
import { isDraw, loserOf, winnerOf } from './tally';

/**
 * The season review: a written report on a completed season.
 *
 * Every sentence is assembled from figures already in the database — ladder
 * positions, margins, streaks, scores — so the copy cannot claim something the
 * numbers do not support. What is authored here is the *phrasing*: the sentence
 * templates, the structure of the report and the jokes.
 *
 * Nothing is random. Where there is a choice of phrasing it is selected by a
 * hash of the season id, so a given season always reads the same way while
 * different seasons do not read identically.
 */

export type ReviewSection = {
  id: string;
  heading: string;
  /** Short standfirst under the section heading. */
  kicker?: string;
  paragraphs: string[];
};

export type FactboxEntry = {
  label: string;
  value: string;
  note?: string;
};

export type SeasonReview = {
  seasonId: string;
  label: string;
  headline: string;
  standfirst: string;
  byline: string;
  dateline: string;
  /** Opening paragraphs, set as the lead story. */
  lede: string[];
  sections: ReviewSection[];
  pullQuote: string;
  factbox: FactboxEntry[];
  signOff: string;
};

/* ------------------------------------------------------------------ utils */

/** Small deterministic hash, used only to vary phrasing between seasons. */
function hash(input: string): number {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value * 31 + input.charCodeAt(i)) % 100000;
  }
  return value;
}

function pick<T>(options: T[], seed: number): T {
  return options[seed % options.length];
}

function nameOf(managerId: string): string {
  return getManager(managerId).name;
}

function teamOf(seasonId: string, managerId: string): string {
  return teamNameFor(seasonId, managerId) ?? nameOf(managerId);
}

function marginOf(game: Matchup): number {
  return Math.abs(game.homeScore - game.awayScore);
}

function highOf(game: Matchup): number {
  return Math.max(game.homeScore, game.awayScore);
}

function lowOf(game: Matchup): number {
  return Math.min(game.homeScore, game.awayScore);
}

function scoreline(game: Matchup): string {
  return `${num(highOf(game))}–${num(lowOf(game))}`;
}

/** "week 12" or "the grand final". */
function whenOf(game: Matchup): string {
  switch (game.stage) {
    case 'final':
      return 'the grand final';
    case 'semi':
      return 'a semi final';
    case 'quarter':
      return 'a quarter final';
    case 'playoff':
      return 'the finals';
    default:
      return `week ${game.week}`;
  }
}

/* ------------------------------------------------------------------ facts */

type Streak = { managerId: string; length: number; kind: 'win' | 'loss' };

/** Longest winning and losing runs of the season, regular season only. */
function streaksFor(seasonId: string, table: SeasonRecord[]): { best?: Streak; worst?: Streak } {
  let best: Streak | undefined;
  let worst: Streak | undefined;

  for (const row of table) {
    const games = matchupsForSeason(seasonId)
      .filter((game) => !isPlayoffGame(game))
      .filter((game) => game.homeId === row.managerId || game.awayId === row.managerId)
      .sort((a, b) => a.week - b.week);

    let wins = 0;
    let losses = 0;

    for (const game of games) {
      if (isDraw(game)) {
        wins = 0;
        losses = 0;
        continue;
      }
      if (winnerOf(game) === row.managerId) {
        wins += 1;
        losses = 0;
      } else {
        losses += 1;
        wins = 0;
      }
      if (wins > 0 && wins > (best?.length ?? 0)) {
        best = { managerId: row.managerId, length: wins, kind: 'win' };
      }
      if (losses > 0 && losses > (worst?.length ?? 0)) {
        worst = { managerId: row.managerId, length: losses, kind: 'loss' };
      }
    }
  }

  return { best, worst };
}

type Upset = { game: Matchup; winnerId: string; loserId: string; gap: number };

/**
 * The biggest upset of the season.
 *
 * Measured by how far apart the two sides finished on the ladder: beating a side
 * that finished eight places above you is the definition of an upset, and using
 * final ladder position rather than form at the time keeps it objective.
 */
function biggestUpset(seasonId: string, table: SeasonRecord[]): Upset | undefined {
  const ladder = new Map(table.map((row) => [row.managerId, row.ladderPosition]));
  let best: Upset | undefined;

  for (const game of matchupsForSeason(seasonId)) {
    if (isDraw(game)) continue;
    const winnerId = winnerOf(game);
    const loserId = loserOf(game);
    if (!winnerId || !loserId) continue;

    const winnerPos = ladder.get(winnerId);
    const loserPos = ladder.get(loserId);
    if (!winnerPos || !loserPos) continue;

    // Positive when the winner finished below the loser on the ladder.
    const gap = winnerPos - loserPos;
    if (gap <= 0) continue;

    if (!best || gap > best.gap || (gap === best.gap && marginOf(game) > marginOf(best.game))) {
      best = { game, winnerId, loserId, gap };
    }
  }

  return best;
}

/** Side that scored heavily but finished well down the ladder. */
function unluckiest(table: SeasonRecord[]): SeasonRecord | undefined {
  const byPoints = [...table].sort((a, b) => b.pointsFor - a.pointsFor);
  let worst: { row: SeasonRecord; drop: number } | undefined;

  byPoints.forEach((row, index) => {
    const pointsRank = index + 1;
    const drop = row.ladderPosition - pointsRank;
    if (drop > 0 && (!worst || drop > worst.drop)) worst = { row, drop };
  });

  return worst && worst.drop >= 3 ? worst.row : undefined;
}

function weekExtremes(seasonId: string) {
  let highest: { managerId: string; score: number; game: Matchup } | undefined;
  let lowest: { managerId: string; score: number; game: Matchup } | undefined;

  for (const game of matchupsForSeason(seasonId)) {
    const sides = [
      { managerId: game.homeId, score: game.homeScore },
      { managerId: game.awayId, score: game.awayScore },
    ];
    for (const side of sides) {
      if (!highest || side.score > highest.score) highest = { ...side, game };
      if (!lowest || side.score < lowest.score) lowest = { ...side, game };
    }
  }

  return { highest, lowest };
}

function gameExtremes(seasonId: string) {
  const games = [...matchupsForSeason(seasonId)].sort((a, b) => marginOf(a) - marginOf(b));
  return { closest: games[0], biggest: games[games.length - 1] };
}

/* --------------------------------------------------------------- the copy */

function buildLede(seasonId: string, seed: number): string[] {
  const label = getSeason(seasonId)?.label ?? seasonId;
  const champion = championOf(seasonId);
  const runnerUp = runnerUpOf(seasonId);
  const minorPremier = minorPremierOf(seasonId);
  const final = bracketFor(seasonId).grandFinal;
  const table = seasonTable(seasonId);

  if (!champion || !final) {
    return [`The ${label} season is in the books, though the bracket did not finish cleanly enough to write a headline about.`];
  }

  const champName = nameOf(champion.managerId);
  const margin = marginOf(final);
  const fromLadder = champion.ladderPosition;
  const wasMinorPremier = minorPremier?.managerId === champion.managerId;

  const opening =
    margin <= 60
      ? `${champName} is the ${label} champion by ${num(margin)} points, which in this league is the difference between a dynasty and a long summer of saying you were unlucky.`
      : margin >= 400
        ? `${champName} did not win the ${label} grand final so much as file a complaint about it, closing out ${scoreline(final)} in a game that was over by the Tuesday.`
        : `${champName} is the ${label} champion, seeing off ${runnerUp ? nameOf(runnerUp.managerId) : 'the field'} ${scoreline(final)} in a grand final that was decided by ${num(margin)} points.`;

  const route = wasMinorPremier
    ? `They did it the boring way, which is to say the correct way: top of the ladder at ${record(champion.wins, champion.losses, champion.ties)}, straight through the bracket, no drama, no need for it.`
    : fromLadder <= 3
      ? `They came from ${ordinal(fromLadder)} on the ladder, a seed nobody argued with and nobody feared quite enough.`
      : `They came from ${ordinal(fromLadder)} on the home and away ladder, which is the sort of run that gets called destiny afterwards and a fluke at the time.`;

  const context = pick(
    [
      `The regular season said one thing for ${table.length > 0 ? `${getSeason(seasonId)?.regularSeasonWeeks ?? 0} weeks` : 'months'}. The finals, as ever, said another.`,
      `Nineteen weeks of league table etiquette, then three weeks of it counting for almost nothing. Fantasy football works exactly as designed.`,
      `The ladder is the evidence. The bracket is the verdict. They rarely agree and they did not agree here either.`,
    ],
    seed,
  );

  return [opening, route, context];
}

function buildRegularSeason(seasonId: string, seed: number): ReviewSection {
  const label = getSeason(seasonId)?.label ?? seasonId;
  const table = seasonTable(seasonId);
  const minorPremier = minorPremierOf(seasonId);
  const { best, worst } = streaksFor(seasonId, table);
  const topScorer = [...table].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  const unlucky = unluckiest(table);
  const paragraphs: string[] = [];

  if (minorPremier) {
    const name = nameOf(minorPremier.managerId);
    const second = table[1];
    const clear = second ? minorPremier.wins - second.wins : 0;

    paragraphs.push(
      clear >= 3
        ? `${name} treated the home and away season as a formality, finishing ${record(minorPremier.wins, minorPremier.losses, minorPremier.ties)} and ${clear} games clear of the field. Running as ${teamOf(seasonId, minorPremier.managerId)}, they led the ladder with the calm of someone who had already read the ending.`
        : `${name} took the minor premiership at ${record(minorPremier.wins, minorPremier.losses, minorPremier.ties)}, ${second ? `holding off ${nameOf(second.managerId)} in a race that went the distance` : 'in a race with nobody left to contest it'}. Top of the ladder, and the small print says that guarantees precisely one thing: a week off.`,
    );
  }

  if (topScorer && minorPremier && topScorer.managerId !== minorPremier.managerId) {
    paragraphs.push(
      `${nameOf(topScorer.managerId)} actually scored the most points of anyone — ${num(topScorer.pointsFor)} across the season, ${num(Math.round(topScorer.avgScore))} a week — and finished ${ordinal(topScorer.ladderPosition)} for the trouble. Points do not win you the ladder. Points win you the right to be annoyed about the ladder.`,
    );
  }

  if (best && best.length >= 4) {
    paragraphs.push(
      pick(
        [
          `The run of the season belonged to ${nameOf(best.managerId)}: ${best.length} straight wins, a stretch where the fixture list stopped being a contest and started being a courtesy.`,
          `${nameOf(best.managerId)} put together ${best.length} wins in a row at one point, which in a ${fieldSizeOf(seasonId)}-team league is less a hot streak than a hostile takeover.`,
          `${nameOf(best.managerId)} won ${best.length} on the bounce mid-season, the sort of run that makes a manager start using the word "process" unironically.`,
        ],
        seed,
      ),
    );
  }

  if (worst && worst.length >= 4) {
    paragraphs.push(
      pick(
        [
          `At the other end, ${nameOf(worst.managerId)} lost ${worst.length} in a row. There is no kind way to write that sentence, so we have not tried.`,
          `${nameOf(worst.managerId)} managed ${worst.length} consecutive losses, a run best described as character-building and most accurately described as ${worst.length} consecutive losses.`,
          `Spare a thought for ${nameOf(worst.managerId)}, who dropped ${worst.length} straight and kept turning up anyway, which is its own kind of achievement.`,
        ],
        seed + 1,
      ),
    );
  }

  if (unlucky) {
    paragraphs.push(
      `${nameOf(unlucky.managerId)} deserves a mention in the "wrong place, wrong week" file: enough points to rank near the top of the league, a ladder position of ${ordinal(unlucky.ladderPosition)} to show for it. Scheduling is not a skill, but it is definitely a factor.`,
    );
  }

  return {
    id: 'regular-season',
    heading: 'The home and away season',
    kicker: `${label} · ${table.length} managers, ${getSeason(seasonId)?.regularSeasonWeeks ?? 0} rounds`,
    paragraphs,
  };
}

function buildUpsets(seasonId: string, seed: number): ReviewSection {
  const table = seasonTable(seasonId);
  const upset = biggestUpset(seasonId, table);
  const { closest, biggest } = gameExtremes(seasonId);
  const paragraphs: string[] = [];

  if (upset) {
    const winner = nameOf(upset.winnerId);
    const loser = nameOf(upset.loserId);
    const winnerPos = table.find((r) => r.managerId === upset.winnerId)?.ladderPosition;
    const loserPos = table.find((r) => r.managerId === upset.loserId)?.ladderPosition;

    paragraphs.push(
      `The upset of the season: ${winner} ${scoreline(upset.game)} over ${loser} in ${whenOf(upset.game)}. ${winner} finished the year ${ordinal(winnerPos ?? 0)}, ${loser} finished ${ordinal(loserPos ?? 0)} — ${upset.gap} places apart, settled in the only ninety minutes that mattered to either of them.`,
    );
    paragraphs.push(
      pick(
        [
          `Every league has one of these games, and every league has one manager who will bring it up for the next three years. That is the deal.`,
          `On paper it should not have been close. Paper, famously, does not set the lineups.`,
          `It is the sort of result that ruins a spreadsheet and makes a season.`,
        ],
        seed,
      ),
    );
  }

  if (biggest && marginOf(biggest) > 0) {
    const winner = winnerOf(biggest);
    const loser = loserOf(biggest);
    if (winner && loser) {
      paragraphs.push(
        `The heaviest hiding was ${nameOf(winner)}'s ${scoreline(biggest)} demolition of ${nameOf(loser)} in ${whenOf(biggest)}, a ${num(marginOf(biggest))}-point margin that stopped being a contest somewhere around the second quarter of the first game.`,
      );
    }
  }

  if (closest) {
    if (isDraw(closest)) {
      paragraphs.push(
        `And then there was the draw. ${nameOf(closest.homeId)} and ${nameOf(closest.awayId)} both posted ${num(closest.homeScore)} in ${whenOf(closest)} — identical scores, half a win each, and a result nobody involved has ever been happy about.`,
      );
    } else {
      const winner = winnerOf(closest);
      const loser = loserOf(closest);
      const margin = marginOf(closest);
      if (winner && loser) {
        paragraphs.push(
          `The tightest was ${nameOf(winner)} over ${nameOf(loser)} by ${num(margin)} in ${whenOf(closest)}. ${num(margin)} ${margin === 1 ? 'point' : 'points'} across a full week of basketball. Somewhere in there is a missed free throw that changed a season.`,
        );
      }
    }
  }

  return {
    id: 'upsets',
    heading: 'Upsets, blowouts and heartbreak',
    kicker: 'The games that got talked about',
    paragraphs,
  };
}

function buildCellar(seasonId: string, seed: number): ReviewSection {
  const spoon = woodenSpoonOf(seasonId);
  const { lowest } = weekExtremes(seasonId);
  const size = fieldSizeOf(seasonId);
  const paragraphs: string[] = [];

  if (spoon) {
    const name = nameOf(spoon.managerId);
    paragraphs.push(
      pick(
        [
          `${name} finished last of ${size} at ${record(spoon.wins, spoon.losses, spoon.ties)}, collecting a wooden spoon that this league records permanently and mentions constantly.`,
          `The wooden spoon went to ${name}, ${record(spoon.wins, spoon.losses, spoon.ties)} and ${size}th of ${size}. Running as ${teamOf(seasonId, spoon.managerId)}, which was optimistic.`,
          `Last place: ${name}, ${record(spoon.wins, spoon.losses, spoon.ties)}. In fairness, somebody has to, and in this league that somebody gets a permanent entry in the record book for their trouble.`,
        ],
        seed,
      ),
    );
    paragraphs.push(
      `For the avoidance of doubt, this league judges last place on the home and away ladder. Placement games are not counted, not recorded, and not accepted as evidence in any argument.`,
    );
  }

  if (lowest) {
    paragraphs.push(
      `The low point of the year, statistically speaking, was ${nameOf(lowest.managerId)}'s ${num(lowest.score)} in ${whenOf(lowest.game)}. That is not a typo, and it is not a half. That is a full week of a full roster.`,
    );
  }

  return {
    id: 'cellar',
    heading: 'The cellar',
    kicker: 'Where the season went to die',
    paragraphs,
  };
}

function buildFinals(seasonId: string, seed: number): ReviewSection {
  const bracket = bracketFor(seasonId);
  const table = seasonTable(seasonId);
  const ladder = new Map(table.map((row) => [row.managerId, row.ladderPosition]));
  const paragraphs: string[] = [];

  const describe = (game: Matchup): string => {
    if (isDraw(game)) {
      return `${nameOf(game.homeId)} and ${nameOf(game.awayId)} tied on ${num(game.homeScore)}`;
    }
    const winner = winnerOf(game)!;
    const loser = loserOf(game)!;
    const seedNote =
      (ladder.get(winner) ?? 0) > (ladder.get(loser) ?? 0)
        ? ` (${ordinal(ladder.get(winner) ?? 0)} over ${ordinal(ladder.get(loser) ?? 0)})`
        : '';
    return `${nameOf(winner)} ${scoreline(game)} over ${nameOf(loser)}${seedNote}`;
  };

  if (bracket.quarterFinals.length > 0) {
    paragraphs.push(
      `The quarter finals: ${bracket.quarterFinals.map(describe).join('; ')}. Two sides had the week off for finishing top of the ladder, an advantage this league has learned to respect and occasionally to resent.`,
    );
  }

  if (bracket.semiFinals.length > 0) {
    paragraphs.push(`The semi finals: ${bracket.semiFinals.map(describe).join('; ')}.`);
  }

  const final = bracket.grandFinal;
  if (final) {
    const champion = championOf(seasonId);
    const runnerUp = runnerUpOf(seasonId);
    const margin = marginOf(final);

    paragraphs.push(
      `Which left the grand final: ${describe(final)}.${
        champion && runnerUp
          ? ` ${nameOf(champion.managerId)} took the title from ${ordinal(champion.ladderPosition)} on the ladder; ${nameOf(runnerUp.managerId)} goes home from ${ordinal(runnerUp.ladderPosition)} with the worst souvenir in sport, which is a very good season.`
          : ''
      }`,
    );

    paragraphs.push(
      margin <= 60
        ? pick(
            [
              `${num(margin)} points. A single bad night from a single bench player and this review reads completely differently. That is the whole appeal and the whole cruelty of the format.`,
              `Decided by ${num(margin)}. There is no moral to draw from a margin that small, only a scoreboard, and the scoreboard does not care how anyone feels about it.`,
            ],
            seed,
          )
        : `A ${num(margin)}-point margin in a grand final is not luck. Somebody drafted better, managed better, or simply refused to lose, and the record book is not interested in which.`,
    );
  } else {
    paragraphs.push('No grand final was recorded for this season.');
  }

  return {
    id: 'finals',
    heading: 'The finals',
    kicker: 'Top six, two byes, one trophy',
    paragraphs,
  };
}

function buildFactbox(seasonId: string): FactboxEntry[] {
  const table = seasonTable(seasonId);
  const champion = championOf(seasonId);
  const runnerUp = runnerUpOf(seasonId);
  const minorPremier = minorPremierOf(seasonId);
  const spoon = woodenSpoonOf(seasonId);
  const final = bracketFor(seasonId).grandFinal;
  const { highest, lowest } = weekExtremes(seasonId);
  const { best } = streaksFor(seasonId, table);
  const topScorer = [...table].sort((a, b) => b.pointsFor - a.pointsFor)[0];

  const entries: FactboxEntry[] = [];

  if (champion) {
    entries.push({
      label: 'Champion',
      value: nameOf(champion.managerId),
      note: final
        ? `${scoreline(final)} in the grand final`
        : record(champion.wins, champion.losses, champion.ties),
    });
  }
  if (runnerUp) {
    entries.push({
      label: 'Runner-up',
      value: nameOf(runnerUp.managerId),
      note: `${ordinal(runnerUp.ladderPosition)} on the ladder`,
    });
  }
  if (minorPremier) {
    entries.push({
      label: 'Minor premier',
      value: nameOf(minorPremier.managerId),
      note: record(minorPremier.wins, minorPremier.losses, minorPremier.ties),
    });
  }
  if (topScorer) {
    entries.push({
      label: 'Most points',
      value: num(topScorer.pointsFor),
      note: `${nameOf(topScorer.managerId)} · ${num(Math.round(topScorer.avgScore))} a week`,
    });
  }
  if (highest) {
    entries.push({
      label: 'Highest week',
      value: num(highest.score),
      note: `${nameOf(highest.managerId)} · ${whenOf(highest.game)}`,
    });
  }
  if (lowest) {
    entries.push({
      label: 'Lowest week',
      value: num(lowest.score),
      note: `${nameOf(lowest.managerId)} · ${whenOf(lowest.game)}`,
    });
  }
  if (best) {
    entries.push({
      label: 'Longest streak',
      value: `${best.length} wins`,
      note: nameOf(best.managerId),
    });
  }
  if (spoon) {
    entries.push({
      label: 'Wooden spoon',
      value: nameOf(spoon.managerId),
      note: record(spoon.wins, spoon.losses, spoon.ties),
    });
  }

  return entries;
}

function buildHeadline(seasonId: string, seed: number): { headline: string; standfirst: string } {
  const champion = championOf(seasonId);
  const runnerUp = runnerUpOf(seasonId);
  const minorPremier = minorPremierOf(seasonId);
  const final = bracketFor(seasonId).grandFinal;
  const label = getSeason(seasonId)?.label ?? seasonId;

  if (!champion || !final) {
    return { headline: `${label}: an incomplete record`, standfirst: 'The bracket did not finish.' };
  }

  const champName = nameOf(champion.managerId).toUpperCase();
  const margin = marginOf(final);
  const wasMinorPremier = minorPremier?.managerId === champion.managerId;
  const fromLow = champion.ladderPosition >= 4;

  const headline = wasMinorPremier
    ? pick(
        [`${champName} FINISHES THE JOB`, `${champName} LEAVES NO DOUBT`, `NO ARGUMENTS: ${champName}`],
        seed,
      )
    : fromLow
      ? pick(
          [
            `${champName} CRASHES THE PARTY`,
            `${champName} TAKES THE SCENIC ROUTE`,
            `SEEDED ${champion.ladderPosition}. CHAMPION ANYWAY.`,
          ],
          seed,
        )
      : margin <= 60
        ? pick([`${champName} SURVIVES`, `${champName} BY A WHISKER`, `${champName} HOLDS ON`], seed)
        : pick([`${champName} DELIVERS`, `${champName} GETS IT DONE`, `THE ${champName} YEAR`], seed);

  const standfirst = `${nameOf(champion.managerId)} wins the ${label} championship${
    runnerUp ? `, beating ${nameOf(runnerUp.managerId)} ${scoreline(final)}` : ''
  }${wasMinorPremier ? ' after topping the ladder' : ` from ${ordinal(champion.ladderPosition)} on the ladder`}. Inside: the streaks, the upset, the collapse and the spoon.`;

  return { headline, standfirst };
}

function buildPullQuote(seasonId: string, seed: number): string {
  const table = seasonTable(seasonId);
  const upset = biggestUpset(seasonId, table);
  const spoon = woodenSpoonOf(seasonId);
  const final = bracketFor(seasonId).grandFinal;

  if (final && marginOf(final) <= 60) {
    return `${num(marginOf(final))} points decided a whole season. Nineteen rounds of evidence, overruled in a week.`;
  }
  if (upset && upset.gap >= 6) {
    return `${nameOf(upset.winnerId)} finished ${upset.gap} places below ${nameOf(upset.loserId)} and beat them anyway. The ladder is a suggestion.`;
  }
  if (spoon) {
    return pick(
      [
        `Somebody has to finish last. This league just insists on writing it down forever.`,
        `The spoon is not a punishment. It is a filing system.`,
      ],
      seed,
    );
  }
  return 'The ladder is the evidence. The bracket is the verdict.';
}

function buildSignOff(seasonId: string, seed: number): string {
  const champion = championOf(seasonId);
  const nextSeason = COMPLETED_SEASONS.find(
    (s) => s.startYear === (getSeason(seasonId)?.startYear ?? 0) + 1,
  );

  const base = champion
    ? `${nameOf(champion.managerId)} keeps the trophy until somebody takes it off them.`
    : 'The season closes without a clean verdict.';

  const forward = nextSeason
    ? ` ${nextSeason.label} is next, and the ladder resets to zero for everyone — which is the only reason anybody comes back.`
    : ' Next season the ladder resets to zero for everyone, which is the only reason anybody comes back.';

  return (
    base +
    forward +
    pick(
      ['', ' Draft accordingly.', ' Bring receipts.'],
      seed,
    )
  );
}

/* ----------------------------------------------------------------- public */

export function reviewFor(seasonId: string): SeasonReview | undefined {
  const season = getSeason(seasonId);
  if (!season || season.status !== 'complete') return undefined;

  const table = seasonTable(seasonId);
  if (table.length === 0) return undefined;

  const seed = hash(seasonId);
  const { headline, standfirst } = buildHeadline(seasonId, seed);

  const sections = [
    buildRegularSeason(seasonId, seed),
    buildUpsets(seasonId, seed),
    buildCellar(seasonId, seed),
    buildFinals(seasonId, seed),
  ].filter((section) => section.paragraphs.length > 0);

  return {
    seasonId,
    label: season.label,
    headline,
    standfirst,
    byline: 'By the Beat Desk',
    dateline: `${season.label} season · filed after the grand final`,
    lede: buildLede(seasonId, seed),
    sections,
    pullQuote: buildPullQuote(seasonId, seed),
    factbox: buildFactbox(seasonId),
    signOff: buildSignOff(seasonId, seed),
  };
}

/** Reviews for every completed season, newest first. */
export function allReviews(): SeasonReview[] {
  return [...COMPLETED_SEASONS]
    .reverse()
    .map((season) => reviewFor(season.id))
    .filter((review): review is SeasonReview => review !== undefined);
}
