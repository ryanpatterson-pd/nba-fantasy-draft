import type { DraftGame } from '@/lib/types';

/**
 * Draft night games.
 *
 * Each game declares how its raw score works, and the site does the rest: you
 * type in twelve scores and the placings, points and lottery odds all fall out
 * of it. Nothing is ranked by hand.
 *
 *   direction  'lower-wins' for times, strokes and distances
 *              'higher-wins' for makes, points and correct answers
 *   format     'time'    seconds, entered as 48.21 or 1:12.5
 *              'number'  a count or measurement
 *              'placing' the finishing position itself, for brackets and draws
 *
 * Edit freely — the schedule, entry screens, standings, odds and wheel all read
 * from this list.
 */
export const DRAFT_GAMES: DraftGame[] = [
  {
    id: 'bottle-flip',
    order: 1,
    name: 'Bottle Flip Challenge',
    format: 'skill',
    description:
      'Start with a full bottle of water. The timer starts, you drink as much as you want, then you have to land one bottle flip before the timer stops.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Shortest time wins' },
    slot: 'Fri · 4:00 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'beer-pong',
    order: 2,
    name: 'Three Cup Beer Pong',
    format: 'skill',
    description:
      'Timer starts, you need to sink three beer pong cups, then the timer stops. Rebounds allowed, no defence.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Shortest time wins' },
    slot: 'Fri · 5:00 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'go-kart',
    order: 3,
    name: 'Go Kart Grand Prix',
    format: 'skill',
    description: 'Ten laps, rolling start, one qualifying run each. Fastest single lap counts.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Fastest lap wins' },
    slot: 'Fri · 6:30 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'trivia',
    order: 4,
    name: 'NBA Trivia',
    format: 'skill',
    description:
      'Forty questions across eras, stats and one deliberately unfair round on the 1997 draft class.',
    scoring: {
      direction: 'higher-wins',
      format: 'number',
      unit: 'correct',
      rule: 'Most correct answers wins',
    },
    slot: 'Fri · 8:00 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'free-throws',
    order: 5,
    name: 'Free Throw Gauntlet',
    format: 'skill',
    description: 'Twenty-five attempts from the line. No warm-up, full crowd noise permitted.',
    scoring: {
      direction: 'higher-wins',
      format: 'number',
      unit: 'makes',
      rule: 'Most makes from 25 wins',
    },
    slot: 'Sat · 9:30 AM',
    venue: 'Placeholder venue',
  },
  {
    id: 'half-court',
    order: 6,
    name: 'Half Court Heave',
    format: 'luck',
    description: 'Five attempts from half court. Historically decided by pure divine intervention.',
    scoring: {
      direction: 'higher-wins',
      format: 'number',
      unit: 'makes',
      rule: 'Most makes from 5 wins',
    },
    slot: 'Sat · 10:30 AM',
    venue: 'Placeholder venue',
  },
  {
    id: 'lawn-bowls',
    order: 7,
    name: 'Lawn Bowls',
    format: 'hybrid',
    description: 'Two bowls each, single end. Dignity optional, whites strongly encouraged.',
    scoring: {
      direction: 'lower-wins',
      format: 'number',
      unit: 'cm to jack',
      rule: 'Closest to the jack wins',
      decimals: 1,
    },
    slot: 'Sat · 12:30 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'putting',
    order: 8,
    name: 'Putting Challenge',
    format: 'skill',
    description: 'Nine holes of mini golf. Strokes counted honestly, allegedly.',
    scoring: {
      direction: 'lower-wins',
      format: 'number',
      unit: 'strokes',
      rule: 'Fewest strokes wins',
    },
    slot: 'Sat · 2:00 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'darts',
    order: 9,
    name: 'Darts 301',
    format: 'hybrid',
    description: 'Straight in, double out. Head-to-head bracket, so the finishing position is entered directly.',
    scoring: {
      direction: 'lower-wins',
      format: 'placing',
      unit: 'position',
      rule: 'Bracket finish, 1st to 12th',
    },
    slot: 'Sat · 3:30 PM',
    venue: 'Placeholder venue',
  },
  {
    id: 'mystery',
    order: 10,
    name: 'The Mystery Event',
    format: 'hybrid',
    description:
      'Rules revealed live, on the night, with no preparation permitted. Worth the same as every other game.',
    scoring: {
      direction: 'lower-wins',
      format: 'placing',
      unit: 'position',
      rule: 'Revealed at the event',
    },
    slot: 'Sat · 5:00 PM',
    venue: 'Placeholder venue',
  },
];

export const DRAFT_GAME_MAP: Record<string, DraftGame> = Object.fromEntries(
  DRAFT_GAMES.map((game) => [game.id, game]),
);

export const FORMAT_LABELS: Record<DraftGame['format'], string> = {
  skill: 'Skill',
  luck: 'Luck',
  hybrid: 'Skill + Luck',
};
