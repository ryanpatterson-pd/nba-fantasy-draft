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
      'Hit the buzzer to start your timer. Open a new bottle of water, drink however much you want, then land one bottle flip with your opposite hand. Hit the buzzer to stop the clock.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Shortest time wins' },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'beer-pong',
    order: 2,
    name: 'Three Cup Beer Pong',
    format: 'skill',
    description:
      'Hit the buzzer to start your timer. Three balls in play with two people retrieving for you. Sink a ball in all three cups, then hit the buzzer to stop the clock.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Shortest time wins' },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'footy-bin',
    order: 3,
    name: 'Footy Bin Challenge',
    format: 'skill',
    description:
      'Hit the buzzer to start your timer. From 10 metres, handball a footy into the bin once with your preferred hand and once with your non-preferred hand. Hit the buzzer to stop the clock.',
    scoring: { direction: 'lower-wins', format: 'time', unit: 'seconds', rule: 'Shortest time wins' },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'carrot-cut',
    order: 4,
    name: 'Carrot Cutting Challenge',
    format: 'skill',
    description:
      'Everyone gets a carrot and cuts it in half. Both halves are weighed, and your score is the difference in weight between the two halves. The closer the two halves, the better — lowest difference wins.',
    scoring: {
      direction: 'lower-wins',
      format: 'number',
      unit: 'g difference',
      rule: 'Smallest weight difference wins',
      decimals: 1,
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'closest-to-pin',
    order: 5,
    name: 'Closest to the Pin',
    format: 'skill',
    description:
      'Throw a golf ball at the pin from 10 metres. Three attempts each — your closest throw is your score.',
    scoring: {
      direction: 'lower-wins',
      format: 'number',
      unit: 'cm to pin',
      rule: 'Closest throw wins',
      decimals: 1,
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'kahoot',
    order: 6,
    name: 'Kahoot',
    format: 'hybrid',
    description:
      'A Kahoot chosen at random on the day, 20 questions. Finish higher on the leaderboard to earn more points.',
    scoring: {
      direction: 'lower-wins',
      format: 'placing',
      unit: 'position',
      rule: 'Kahoot finish, 1st to 12th',
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'ping-pong',
    order: 7,
    name: 'Ping Pong Challenge',
    format: 'skill',
    description:
      'Three stacks of two cups are set up in three positions on the far side of the table. Hit the buzzer to start your timer, then knock all three stacks over. Three balls in play with two collectors feeding you. Hit the buzzer to stop the clock.',
    scoring: {
      direction: 'lower-wins',
      format: 'time',
      unit: 'seconds',
      rule: 'Shortest time wins',
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'donut',
    order: 8,
    name: 'Donut Challenge',
    format: 'skill',
    description:
      'Hit the buzzer, eat two Krispy Kreme donuts as fast as you can, show an empty mouth, then hit the buzzer to stop the clock.',
    scoring: {
      direction: 'lower-wins',
      format: 'time',
      unit: 'seconds',
      rule: 'Shortest time wins',
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'pool-roll',
    order: 9,
    name: 'Pool Table Contest',
    format: 'skill',
    description:
      'Roll a ball down the pool table, three rolls each. Your score is your closest ball to the far end — the fewer centimetres from the end cushion, the better.',
    scoring: {
      direction: 'lower-wins',
      format: 'number',
      unit: 'cm from end',
      rule: 'Closest to the end wins',
      decimals: 1,
    },
    slot: 'Placeholder slot',
    venue: 'Placeholder venue',
  },
  {
    id: 'beer-pong-knockout',
    order: 10,
    name: 'Beer Pong Knockout',
    format: 'skill',
    description:
      'Basketball-knockout rules. Throw from across the table; the person behind can only go once you have thrown. Miss and you retrieve your own ball, then bounce it in from close. If the player behind sinks it first, the player in front is eliminated. Order resets each round to record the finishing order.',
    scoring: {
      direction: 'lower-wins',
      format: 'placing',
      unit: 'position',
      rule: 'Knockout finish, 1st to 12th',
    },
    slot: 'Placeholder slot',
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
