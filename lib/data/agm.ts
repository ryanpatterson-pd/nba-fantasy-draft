/**
 * The AGM — the league rulebook for the upcoming season.
 *
 * Every rule the league runs on, grouped by area. Each rule has a status so the
 * board doubles as a pre-season checklist: `locked` rules are settled, `vote`
 * rules still need a decision at the AGM, and `proposed` rules are ideas on the
 * table. Edit this file to change wording, add rules, or flip a status once the
 * group votes — the AGM page renders straight off it.
 *
 * The stated house rules (trade window, six-to-uphold, elimination locks, last
 * place by the home-and-away ladder) are seeded as `locked`. The rest are
 * sensible fantasy-league regulations worth ratifying before tip-off.
 */

export type RuleStatus = 'locked' | 'vote' | 'proposed';

export type Rule = {
  id: string;
  title: string;
  /** The rule in full. Plain sentences; shown as the body of the card. */
  detail: string;
  status: RuleStatus;
  /** Optional one-liner on why the rule exists / what it prevents. */
  rationale?: string;
};

export type RuleCategory = {
  id: string;
  name: string;
  /** Short blurb under the category heading. */
  blurb: string;
  icon: string;
  rules: Rule[];
};

export const AGM_SEASON_LABEL = '2026/27';

export const RULE_CATEGORIES: RuleCategory[] = [
  {
    id: 'trades',
    name: 'Trades',
    blurb: 'When trades can happen and how they clear.',
    icon: 'swap',
    rules: [
      {
        id: 'trade-window',
        title: 'Trade window: Monday to Thursday only',
        detail:
          'Trades can only be proposed and accepted between Monday and Thursday (league time). No trades over the weekend or on game-heavy Fridays, so the run into each matchup lock is clean.',
        status: 'locked',
        rationale: 'Stops last-minute weekend collusion and lineup dumping before a lock.',
      },
      {
        id: 'trade-uphold',
        title: 'Six managers must uphold a trade',
        detail:
          'For a trade to stand, at least six managers must support it — and that count includes the two managers making the trade. So four other managers, plus the two involved, must be on side. If fewer than six uphold it, the trade is void.',
        status: 'locked',
        rationale: 'A simple majority of the league has to be comfortable with every deal.',
      },
      {
        id: 'trade-review-period',
        title: '24-hour review before a trade processes',
        detail:
          'Once accepted, a trade sits in review for 24 hours (still within the Mon–Thu window) so managers can cast veto/uphold votes before it processes. A trade accepted Thursday must complete its review by end of Thursday or it rolls void.',
        status: 'vote',
        rationale: 'Gives the league time to actually vote rather than rubber-stamping.',
      },
      {
        id: 'trade-deadline',
        title: 'Season trade deadline',
        detail:
          'No trades after the end of the regular (home-and-away) season. Playoff rosters are set by what you carried out of the regular season plus waivers where still eligible.',
        status: 'vote',
        rationale: 'Prevents contenders loading up mid-playoffs via a non-contender.',
      },
      {
        id: 'draft-pick-trades',
        title: 'No trading future draft picks',
        detail:
          'Trades are players-for-players only. Future draft picks and lottery position are not tradeable assets.',
        status: 'proposed',
        rationale: 'Keeps the draft lottery clean and stops tanking-for-picks deals.',
      },
    ],
  },
  {
    id: 'veto',
    name: 'Veto & fair play',
    blurb: 'How dodgy trades get stopped and what counts as collusion.',
    icon: 'shield',
    rules: [
      {
        id: 'veto-threshold',
        title: 'Veto is the flip side of the six-to-uphold rule',
        detail:
          'A trade is blocked if it fails to reach six upholding managers within the review window. There is no separate veto tally — not enough support is a veto by default.',
        status: 'locked',
      },
      {
        id: 'veto-grounds',
        title: 'Vetoes must be for competitive reasons',
        detail:
          'A trade should only be opposed on the grounds that it is lopsided, collusive, or damages competitive balance — not because you simply dislike a rival getting better. Grudge vetoes are discouraged.',
        status: 'vote',
        rationale: 'Keeps the veto power about fairness, not politics.',
      },
      {
        id: 'collusion',
        title: 'Collusion is an automatic void + commissioner review',
        detail:
          'Any arrangement designed to dump talent to one team, tank a matchup for a friend, or manipulate the lottery is collusion. Confirmed collusion voids the deal and the managers involved face a commissioner review, up to loss of waiver priority.',
        status: 'vote',
      },
      {
        id: 'tanking',
        title: 'No deliberate tanking',
        detail:
          'Managers must field a full, legal, best-available lineup every matchup. Deliberately starting injured/out players or an incomplete lineup to lose is not allowed.',
        status: 'vote',
        rationale: 'Protects the integrity of the last-place race and everyone’s matchups.',
      },
    ],
  },
  {
    id: 'roster-locks',
    name: 'Roster locks',
    blurb: 'When managers lose the ability to add, drop or trade.',
    icon: 'lock',
    rules: [
      {
        id: 'eliminated-regular',
        title: 'Missed the top-6: roster frozen',
        detail:
          'Once a team is mathematically out of the top-6 playoff race, that manager can no longer drop or acquire players (no waivers, no free agents, no trades). Their roster is frozen for the rest of the season.',
        status: 'locked',
        rationale: 'Stops eliminated teams from becoming a farm for contenders.',
      },
      {
        id: 'eliminated-finals',
        title: 'Knocked out of finals: that’s it',
        detail:
          'Once a team is eliminated from the playoffs, their season is over — no further adds, drops or lineup changes. The roster they lost with is the roster they finish with.',
        status: 'locked',
      },
      {
        id: 'waiver-system',
        title: 'Waiver system',
        detail:
          'Dropped players clear waivers before becoming free agents. Waiver priority runs in reverse ladder order (worst team gets first claim) and resets weekly.',
        status: 'vote',
        rationale: 'Gives struggling-but-alive teams a fair shot at replacements.',
      },
      {
        id: 'acquisition-cap',
        title: 'Weekly acquisition limit',
        detail:
          'Cap on the number of add/drops per matchup week (proposed: unlimited in the regular season, but a cap during playoffs to prevent streaming abuse).',
        status: 'proposed',
      },
    ],
  },
  {
    id: 'standings',
    name: 'Standings & last place',
    blurb: 'How the ladder is decided and who wears the wooden spoon.',
    icon: 'flag',
    rules: [
      {
        id: 'last-place',
        title: 'Last place is decided by the home-and-away season',
        detail:
          'The wooden spoon (and any last-place forfeit) is determined by the regular home-and-away ladder — NOT the playoffs. Whoever finishes bottom of the regular season is last, regardless of what happens in the finals.',
        status: 'locked',
        rationale: 'The finals decide the champion; the full season decides the loser.',
      },
      {
        id: 'ladder-tiebreak',
        title: 'Ladder tie-breakers',
        detail:
          'Teams level on wins are separated by: 1) head-to-head record, 2) total points for, 3) points against. Applied in that order.',
        status: 'vote',
      },
      {
        id: 'playoff-teams',
        title: 'Top 6 make the playoffs',
        detail:
          'The top six teams on the regular-season ladder qualify for the finals. Top two earn a first-round bye (proposed).',
        status: 'vote',
      },
      {
        id: 'divisions',
        title: 'Two conferences / divisions',
        detail:
          'The league runs two conferences as set in ESPN. Confirm whether playoff seeding is by overall record or guarantees conference winners a top seed.',
        status: 'vote',
      },
    ],
  },
  {
    id: 'playoffs',
    name: 'Playoffs & finals',
    blurb: 'Finals format, seeding and matchup length.',
    icon: 'trophy',
    rules: [
      {
        id: 'finals-length',
        title: 'Finals matchup length',
        detail:
          'Confirm whether finals matchups run the standard 7-day scoring week or a longer two-week championship series.',
        status: 'vote',
      },
      {
        id: 'reseeding',
        title: 'Re-seed each round',
        detail:
          'After each playoff round, remaining teams are re-seeded so the highest surviving seed always plays the lowest. Alternative is a fixed bracket.',
        status: 'proposed',
      },
      {
        id: 'tie-in-matchup',
        title: 'Tied playoff matchup tie-breaker',
        detail:
          'If a playoff matchup ends level on fantasy points, the higher regular-season seed advances.',
        status: 'vote',
      },
    ],
  },
  {
    id: 'general',
    name: 'General & governance',
    blurb: 'Buy-in, payouts, punishments and how rules change.',
    icon: 'book',
    rules: [
      {
        id: 'draft-order',
        title: 'Draft order set by the draft-night lottery',
        detail:
          'The pick order for the next draft is set by the draft-night games and lottery wheel, as run on the Draft Night page. Not by reverse ladder alone.',
        status: 'locked',
      },
      {
        id: 'buy-in',
        title: 'Buy-in and payouts',
        detail:
          'Confirm the season buy-in amount and the payout split between champion, runner-up and regular-season minor premier.',
        status: 'vote',
      },
      {
        id: 'wooden-spoon',
        title: 'Wooden-spoon punishment',
        detail:
          'Agree the forfeit for finishing last on the home-and-away ladder (e.g. sets next season’s draft-night theme, or a nominated punishment).',
        status: 'vote',
      },
      {
        id: 'lineup-deadline',
        title: 'Lineups lock at tip-off',
        detail:
          'Each player’s slot locks at their game’s tip-off (ESPN default). Managers are responsible for setting active lineups before then.',
        status: 'locked',
      },
      {
        id: 'rule-changes',
        title: 'Rule changes need a two-thirds vote',
        detail:
          'Once the season starts, any change to a locked rule requires a two-thirds majority of the league. Before tip-off, a simple majority at the AGM locks a rule in.',
        status: 'vote',
        rationale: 'Stops the rulebook shifting mid-season to suit whoever’s benefiting.',
      },
    ],
  },
];

/** Tally of rules by status, for the summary strip. */
export function ruleTally(): { locked: number; vote: number; proposed: number; total: number } {
  let locked = 0;
  let vote = 0;
  let proposed = 0;
  for (const category of RULE_CATEGORIES) {
    for (const rule of category.rules) {
      if (rule.status === 'locked') locked += 1;
      else if (rule.status === 'vote') vote += 1;
      else proposed += 1;
    }
  }
  return { locked, vote, proposed, total: locked + vote + proposed };
}
