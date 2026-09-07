import { MATCHUPS, isPlayoffGame, matchupsForSeason } from '@/lib/data/league';
import { getManager } from '@/lib/data/managers';
import { LATEST_COMPLETED_SEASON, getSeason } from '@/lib/data/seasons';
import { allTimeFor } from '@/lib/stats/all-time';
import { headToHead } from '@/lib/stats/head-to-head';
import { recordFor } from '@/lib/stats/season';
import { isDraw, winnerOf } from '@/lib/stats/tally';
import type { Matchup } from '@/lib/types';
import { num, ordinal, record } from '@/lib/utils/format';
import type { Fixture } from './schedule';

/**
 * Match previews for the upcoming season.
 *
 * Everything here is derived. The projection is a plain scoring-distribution
 * model: each manager gets a mean weekly score and a standard deviation from
 * their most recent completed season, and the chance of one beating the other is
 * the probability that a draw from the first distribution lands above a draw
 * from the second.
 *
 *     P(A beats B) = Φ( (μA − μB) / √(σA² + σB²) )
 *
 * That is deliberately modest. It knows nothing about who drafted well, injuries
 * or trades — it is last season's scoring shape and nothing more, which is all
 * the data available before a ball is bounced. The written reasons cite head to
 * head and form separately so a reader can disagree with the model on the
 * evidence rather than on vibes.
 */

export type FormResult = {
  week: number;
  opponentId: string;
  score: number;
  against: number;
  outcome: 'W' | 'L' | 'D';
};

export type ManagerForm = {
  managerId: string;
  /** Most recent first, capped at five. */
  recent: FormResult[];
  wins: number;
  losses: number;
  ties: number;
  mean: number;
  sd: number;
  games: number;
  ladderPosition?: number;
  /** Signed run of the same outcome ending the season: +3 = three straight wins. */
  streak: number;
};

export type MatchPreview = {
  fixture: Fixture;
  /** Ordered [home, away]. */
  form: [ManagerForm, ManagerForm];
  h2h: {
    games: number;
    /** From the home manager's perspective. */
    homeWins: number;
    awayWins: number;
    ties: number;
    lastMeeting?: Matchup;
  };
  favouriteId: string;
  underdogId: string;
  /** Probability the favourite wins, 0.5–1. */
  probability: number;
  edge: 'line ball' | 'slight edge' | 'clear favourite' | 'heavy favourite';
  /** Two to four grounded observations. */
  reasons: string[];
  /** One-line call, with a bit of personality. */
  verdict: string;
};

/** The season the form guide is read from. */
export const FORM_SEASON = LATEST_COMPLETED_SEASON;

/* ------------------------------------------------------------------ maths */

/** Abramowitz & Stegun 7.1.26. Plenty accurate for a win probability. */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mu = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - mu) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/* ------------------------------------------------------------------- form */

/** Regular-season games for a manager in one season, oldest first. */
function regularSeasonGames(seasonId: string, managerId: string): Matchup[] {
  return matchupsForSeason(seasonId)
    .filter((game) => !isPlayoffGame(game))
    .filter((game) => game.homeId === managerId || game.awayId === managerId)
    .sort((a, b) => a.week - b.week);
}

function toFormResult(game: Matchup, managerId: string): FormResult {
  const isHome = game.homeId === managerId;
  const score = isHome ? game.homeScore : game.awayScore;
  const against = isHome ? game.awayScore : game.homeScore;
  const outcome = isDraw(game) ? 'D' : winnerOf(game) === managerId ? 'W' : 'L';
  return {
    week: game.week,
    opponentId: isHome ? game.awayId : game.homeId,
    score,
    against,
    outcome,
  };
}

/** Run of identical outcomes at the end of the season. Positive for wins. */
function trailingStreak(results: FormResult[]): number {
  if (results.length === 0) return 0;
  const last = results[results.length - 1].outcome;
  if (last === 'D') return 0;

  let run = 0;
  for (let i = results.length - 1; i >= 0; i -= 1) {
    if (results[i].outcome !== last) break;
    run += 1;
  }
  return last === 'W' ? run : -run;
}

export function formFor(managerId: string, seasonId: string = FORM_SEASON.id): ManagerForm {
  const games = regularSeasonGames(seasonId, managerId);
  const results = games.map((game) => toFormResult(game, managerId));
  const scores = results.map((result) => result.score);
  const career = allTimeFor(managerId);

  // A manager new to the league has no season to read; fall back to their career
  // shape so the projection still has something honest to work with.
  const usable = scores.length >= 2;

  return {
    managerId,
    recent: [...results].reverse().slice(0, 5),
    wins: results.filter((r) => r.outcome === 'W').length,
    losses: results.filter((r) => r.outcome === 'L').length,
    ties: results.filter((r) => r.outcome === 'D').length,
    mean: usable ? mean(scores) : (career?.avgScore ?? 0),
    // Without a season to measure, assume league-typical volatility rather than
    // pretending to a certainty the data cannot support.
    sd: usable ? stdDev(scores) : 260,
    games: results.length,
    ladderPosition: recordFor(seasonId, managerId)?.ladderPosition,
    streak: trailingStreak(results),
  };
}

/* -------------------------------------------------------------- narrative */

function nameOf(managerId: string): string {
  return getManager(managerId).name;
}

function edgeFor(probability: number): MatchPreview['edge'] {
  if (probability < 0.55) return 'line ball';
  if (probability < 0.62) return 'slight edge';
  if (probability < 0.72) return 'clear favourite';
  return 'heavy favourite';
}

function streakPhrase(form: ManagerForm): string | undefined {
  if (form.streak >= 3) return `${nameOf(form.managerId)} signed off on a ${form.streak}-game winning run`;
  if (form.streak <= -3)
    return `${nameOf(form.managerId)} limped out of last season on a ${Math.abs(form.streak)}-game losing run`;
  return undefined;
}

/**
 * Builds the written case. Each candidate only fires when the underlying number
 * is actually notable, so a preview never pads itself with filler like "both
 * teams will look to score points".
 */
function buildReasons(
  favourite: ManagerForm,
  underdog: ManagerForm,
  h2h: MatchPreview['h2h'],
  homeId: string,
): string[] {
  const reasons: string[] = [];
  const favName = nameOf(favourite.managerId);
  const dogName = nameOf(underdog.managerId);
  const gap = Math.round(favourite.mean - underdog.mean);

  // 1. The scoring gap, which is what the model actually runs on.
  if (gap >= 60) {
    reasons.push(
      `${favName} averaged ${num(Math.round(favourite.mean))} a week in ${FORM_SEASON.label}, ${num(gap)} clear of ${dogName}.`,
    );
  } else if (gap >= 20) {
    reasons.push(
      `${favName} holds a modest ${num(gap)}-point edge on last season's weekly average (${num(Math.round(favourite.mean))} to ${num(Math.round(underdog.mean))}).`,
    );
  } else if (gap <= 1) {
    reasons.push(
      `Nothing to separate them: their ${FORM_SEASON.label} weekly averages are within a point of each other.`,
    );
  } else {
    reasons.push(
      `Almost nothing in it on scoring: ${num(gap)} points separate their ${FORM_SEASON.label} averages.`,
    );
  }

  // 2. Head to head, but only once there is enough of it to mean something.
  if (h2h.games >= 3) {
    const favWins = favourite.managerId === homeId ? h2h.homeWins : h2h.awayWins;
    const dogWins = favourite.managerId === homeId ? h2h.awayWins : h2h.homeWins;

    if (dogWins === 0) {
      reasons.push(
        `${favName} has never lost to ${dogName}, ${favWins} from ${favWins} across league history.`,
      );
    } else if (favWins === 0) {
      reasons.push(
        `History says otherwise: ${dogName} leads the all-time series ${dogWins}–${favWins}.`,
      );
    } else if (favWins > dogWins) {
      reasons.push(`${favName} leads the all-time series ${favWins}–${dogWins}.`);
    } else if (dogWins > favWins) {
      reasons.push(
        `${dogName} owns the history, ${dogWins}–${favWins}, which is the one thing arguing against the numbers here.`,
      );
    } else {
      reasons.push(`Dead level all time at ${favWins}–${dogWins}, so form is the only tiebreaker.`);
    }
  } else if (h2h.games > 0) {
    reasons.push(
      `They have only met ${h2h.games} ${h2h.games === 1 ? 'time' : 'times'}, too little to read anything into.`,
    );
  } else {
    reasons.push('A first meeting, with no history to lean on.');
  }

  // 3. How each side finished, if it says something.
  const favStreak = streakPhrase(favourite);
  const dogStreak = streakPhrase(underdog);
  if (favStreak) reasons.push(`${favStreak}.`);
  if (dogStreak) reasons.push(`${dogStreak}.`);
  if (!favStreak && !dogStreak && favourite.ladderPosition && underdog.ladderPosition) {
    reasons.push(
      `${favName} finished ${ordinal(favourite.ladderPosition)} last season, ${dogName} ${ordinal(underdog.ladderPosition)}.`,
    );
  }

  // 4. Consistency, which decides the close ones.
  const sdGap = Math.round(underdog.sd - favourite.sd);
  if (sdGap >= 45) {
    reasons.push(
      `${favName} is the steadier of the two, swinging ±${num(Math.round(favourite.sd))} a week against ±${num(Math.round(underdog.sd))}.`,
    );
  } else if (sdGap <= -45) {
    reasons.push(
      `${dogName} is the more volatile side in the best sense — ±${num(Math.round(underdog.sd))} a week means the ceiling is there for an upset.`,
    );
  }

  return reasons.slice(0, 4);
}

function buildVerdict(
  favourite: ManagerForm,
  underdog: ManagerForm,
  probability: number,
  edge: MatchPreview['edge'],
): string {
  const favName = nameOf(favourite.managerId);
  const dogName = nameOf(underdog.managerId);
  const chance = Math.round(probability * 100);

  switch (edge) {
    case 'line ball':
      return `Coin toss. ${favName} by a nose at ${chance}%, and anyone claiming to know more than that is guessing.`;
    case 'slight edge':
      return `${favName} at ${chance}%, but ${dogName} only needs one good week to make it look silly.`;
    case 'clear favourite':
      return `${favName} should handle this at ${chance}%. An upset would be a genuine talking point.`;
    default:
      return `${favName} at ${chance}%. On paper this is over before it starts, which is of course exactly when it isn't.`;
  }
}

/* ----------------------------------------------------------------- public */

export function previewFor(fixture: Fixture, formSeasonId: string = FORM_SEASON.id): MatchPreview {
  const homeForm = formFor(fixture.homeId, formSeasonId);
  const awayForm = formFor(fixture.awayId, formSeasonId);

  const cell = headToHead(fixture.homeId, fixture.awayId);

  const h2h: MatchPreview['h2h'] = {
    games: cell?.games ?? 0,
    homeWins: cell?.wins ?? 0,
    awayWins: cell?.losses ?? 0,
    ties: cell?.ties ?? 0,
    lastMeeting: lastMeetingOf(fixture.homeId, fixture.awayId),
  };

  // Spread of the difference between two independent weekly scores.
  const spread = Math.sqrt(homeForm.sd ** 2 + awayForm.sd ** 2) || 1;
  const homeChance = normalCdf((homeForm.mean - awayForm.mean) / spread);

  const homeFavoured = homeChance >= 0.5;
  const favourite = homeFavoured ? homeForm : awayForm;
  const underdog = homeFavoured ? awayForm : homeForm;
  const probability = homeFavoured ? homeChance : 1 - homeChance;
  const edge = edgeFor(probability);

  return {
    fixture,
    form: [homeForm, awayForm],
    h2h,
    favouriteId: favourite.managerId,
    underdogId: underdog.managerId,
    probability,
    edge,
    reasons: buildReasons(favourite, underdog, h2h, fixture.homeId),
    verdict: buildVerdict(favourite, underdog, probability, edge),
  };
}

/**
 * The most recent completed game between two managers, if any.
 *
 * MATCHUPS is already in season then week order, so the last match is the latest.
 */
export function lastMeetingOf(managerId: string, opponentId: string): Matchup | undefined {
  const meetings = MATCHUPS.filter(
    (game) =>
      (game.homeId === managerId && game.awayId === opponentId) ||
      (game.homeId === opponentId && game.awayId === managerId),
  );
  return meetings[meetings.length - 1];
}

/** Series summary line, e.g. "Andrew leads 9–2". */
export function seriesLine(preview: MatchPreview): string {
  const { h2h, fixture } = preview;
  if (h2h.games === 0) return 'First meeting';

  const homeName = nameOf(fixture.homeId);
  const awayName = nameOf(fixture.awayId);

  if (h2h.homeWins === h2h.awayWins) {
    return `Level at ${record(h2h.homeWins, h2h.awayWins, h2h.ties)}`;
  }
  return h2h.homeWins > h2h.awayWins
    ? `${homeName} leads ${record(h2h.homeWins, h2h.awayWins, h2h.ties)}`
    : `${awayName} leads ${record(h2h.awayWins, h2h.homeWins, h2h.ties)}`;
}

/** Season label used in the form-guide heading. */
export function formSeasonLabel(): string {
  return getSeason(FORM_SEASON.id)?.label ?? FORM_SEASON.label;
}
