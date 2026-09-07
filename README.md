# NBA Fantasy League Platform

The permanent home of our NBA fantasy league: the full all-time database, the season archive, the
awards ceremony, and the draft-night games and lottery.

Built with Next.js 16 (App Router), React 19 and Tailwind CSS v4. No backend — the history is
imported from ESPN into typed data files at build time, and the only things that persist at runtime
(draft-night results) live in the browser.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## The pages

| Route | What it does |
| --- | --- |
| `/` | Dashboard. Reigning champion, career leaders, all-time ladder, honour roll, draft countdown. |
| `/draft` | Draft-night control room. Enter raw scores live, watch the ladder move, spin the lottery. |
| `/awards` | Awards night. Categories per season, plus a ceremony mode for reading them out. |
| `/history` | Season archive with a detail page per season (`/history/2024-25`). |
| `/teams` | The roster, with a full career profile per manager (`/teams/ryan`). |
| `/head-to-head` | The all-time head-to-head matrix. |
| `/records` | The record book. |

## The league history

Five completed seasons, all imported from ESPN league `803871539`:

| Season | ESPN season id | Field | Home and away |
| --- | --- | --- | --- |
| 2021/22 | 2022 | 10 | 18 weeks |
| 2022/23 | 2023 | 12 | 21 weeks |
| 2023/24 | 2024 | 12 | 19 weeks |
| 2024/25 | 2025 | 12 | 19 weeks |
| 2025/26 | 2026 | 12 | 19 weeks |

Fourteen managers appear across those seasons; two of them (Titian, Imran) played a single season.

### Rules the data follows

- **Placement games are not imported at all.** This league has never counted them, so they cannot
  reach the win-loss records, the points totals or the record book. The importer drops them at the
  source rather than filtering later.
- **Season position is the home-and-away ladder** (`ladderPosition`, ESPN's `playoffSeed`), not
  ESPN's post-placement final rank. That is why the wooden spoon is whoever finished last before
  the placement round.
- **Drawn games are real.** There has been one — 2022/23 week 17, Ryan 1,335 to Izzy 1,335. A draw
  is displayed as a third component (`13–7–1`) and counts as half a win in every percentage, which
  is how ESPN computes it. It is never silently awarded to the home side.

### Re-importing

```bash
node --env-file=.env.local scripts/espn-import.mjs 2026
```

The argument is the **ESPN season id**, which is the calendar year the season ends in. Output goes to
`lib/data/seasons/<seasonId>.ts` plus a human-readable summary in `scripts/.espn-import-report.txt`.

`.env.local` (gitignored) needs:

```
ESPN_LEAGUE_ID=803871539
ESPN_S2=<cookie value>
SWID="{...}"
```

Managers are matched by SWID via `scripts/espn-managers.json`. The importer **fails loudly** on an
unrecognised SWID rather than inventing a manager — that is how it caught one manager holding two
ESPN accounts, which would otherwise have split his career in half.

### Keeping the upcoming season (`/upcoming`) up to date

The **2026/27** tab shows ESPN's **real** fixtures and a live conference ladder, imported the same
way — but with the `--live` flag, which writes a separate generated file:

```bash
node --env-file=.env.local scripts/espn-import.mjs 2027 --live
```

The argument is the ESPN season id (`2027` = the 2026/27 season). This reads the real home-and-away
draw, ESPN's division split (East/West) and each team's running record, and writes
`lib/data/upcoming.ts` plus the usual summary in `scripts/.espn-import-report.txt`.

Key points:

- **It is separate from completed seasons.** The live file is *not* part of the completed-season
  history, so an in-progress season can never leak into the records, all-time ladder or head-to-head
  matrix. Only the `/upcoming` page reads it.
- **Re-run it whenever you want the site to reflect the latest games.** Each run overwrites
  `lib/data/upcoming.ts` with ESPN's current state, so scores, records and the ladder move, and any
  fixture ESPN reschedules is picked up exactly.
- **Before the season starts** every fixture is shown as scheduled with a "hasn't started" notice on
  the ladder; the notice clears automatically once any game has been decided (`started` flips true).
- **If the live file is absent** (e.g. a fresh checkout before the first live import), the page falls
  back to a provisional generated round-robin so it always renders.

The typical in-season loop, roughly weekly:

```bash
node --env-file=.env.local scripts/espn-import.mjs 2027 --live
git add lib/data/upcoming.ts
git commit -m "Update 2026/27 fixtures and ladder"
git push          # Vercel redeploys automatically
```

> On Windows, the importer may print `node: Assertion failed ... async.c` **after** it has written
> the file and printed its report. That is a harmless Node/libuv teardown quirk on exit — if you saw
> "Wrote lib/data/upcoming.ts", the import succeeded.

## How draft night works

1. Games are defined in `lib/data/draft-games.ts`. Some are skill, some are pure luck.
2. You enter each manager's **raw score** — a time (`48.21` or `1:12.5`), a plain number, or a
   direct placing, depending on the game. The site works out the order itself, so a bottle-flip
   sheet of times becomes 1st through 12th with no manual ranking.
3. **First place scores 12 points, last scores 1**, so every game carries identical weight and
   nobody is eliminated until the final event. Ties split the points across the slots they occupy,
   which keeps each game's pool constant and stops a tie from distorting the lottery.
4. Only fully entered games count towards the ladder, so a half-finished event never moves the odds.
5. Ladder points convert into **lottery entries**, and the **wheel** is spun once per pick. The
   winner is drawn from the weighted entries first, then the wheel is rotated so that segment lands
   under the pointer — the animation reflects a real draw rather than decorating a fake one.

Draft-night state is saved to `localStorage`, so a refresh or a flat battery mid-weekend does not
lose the results. There is a reset control on the draft page.

## Styling

One fixed palette, defined once in `app/globals.css` as CSS custom properties and mapped onto
Tailwind utilities via `@theme inline`. There is no runtime theme editor and no per-section colours.

- **Page** off-white (`--page-bg`), **cards** white with a hairline border and a 1px lift
- **Chrome** charcoal black: the sidebar, page headers, panel header strips and banners
- **Accent** a single orange, used for kicker text, the active nav item, card top hairlines, icon
  medallions and meters

Page headers and banners use `dark-wash`: charcoal that fades into orange on the right.

Typography is **Inter** throughout, self-hosted by Next at build time (`lib/theme/fonts.ts`). The
premium feel comes from the details rather than the typeface: a global `-0.01em` letter-spacing,
heading weights of 750–900, and tighter negative tracking on large figures.

### Dark subtrees

Rather than maintaining two sets of classes, any dark area is wrapped in the `on-dark` utility. It
rebinds the surface, text, border and accent-text custom properties to their charcoal equivalents,
so the same components (`text-ink`, `label-xs`, `border-line`, `eyebrow`, `panel-title`) read
correctly on either background with no conditional styling.

That is how the sidebar, page header, `CardHeader` strips and `StatBanner` are built — and it is why
accent text uses `text-accent-deep` everywhere: on white it resolves to a darker orange that passes
contrast, and inside `on-dark` it resolves to the brand orange.

## Data model

Everything on the site is **derived**, not typed in. The single source of truth is the matchup list
assembled in `lib/data/league.ts` from the imported seasons; from there:

- `lib/stats/tally.ts` — the shared win/loss/tie primitives every other module builds on
- `lib/stats/season.ts` — each season's final table, seeds and playoff bracket
- `lib/stats/all-time.ts` — career records (wins, win rate, rings, finals, playoff rate)
- `lib/stats/head-to-head.ts` — the full matrix
- `lib/stats/records.ts` — the record book
- `lib/stats/awards.ts` — the calculated award categories

So a claim like "76–32 from 108 games, four grand finals from five seasons" is computed, and it
cannot drift out of sync with the rest of the site.

### Editing data by hand

| File | Contents |
| --- | --- |
| `lib/data/managers.ts` | The managers: names, colours, nicknames |
| `lib/data/seasons/` | One generated file per imported season. Do not hand-edit; re-run the importer |
| `lib/data/imported.ts` | The shape those generated files conform to |
| `lib/data/seasons.ts` | Season registry, labels, draft dates, field sizes |
| `lib/data/league.ts` | Flattens every season into the matchup list the stats layer reads |
| `lib/data/awards.ts` | Award categories, and the voted results per season (`VOTED_RESULTS`) |
| `lib/data/draft-games.ts` | The draft-night games, formats, scoring rules and time slots |

Manager mascots are optional: drop `public/mascots/<id>.png` (e.g. `ryan.png`) and it will be used,
otherwise a monogram tile in that manager's colours is shown.

## Project structure

```
app/                    routes (one folder per page)
components/
  layout/               app shell, sidebar, page header
  ui/                   design system: Card, DataTable, StatCard, Badge, Icon, Button…
  dashboard/            dashboard-only panels
  league/               shared league views (ladder, honour roll, season snapshot)
  draft/                draft-night hub, games, score entry, wheel, board
  awards/               award cards and the ceremony
  history/              timeline, season table, bracket
  teams/                roster cards, season table, head-to-head views
lib/
  data/                 source data, including seasons/ imported from ESPN
  stats/                the derivation layer
  draft/                scoring, score parsing and lottery maths
  theme/                font loading
  storage/              localStorage helpers and the external-store adapter
  hooks/ utils/         small shared helpers
scripts/
  espn-import.mjs       season importer
  espn-managers.json    SWID to manager id mapping
  espn-probe.mjs        raw endpoint inspection when the import looks wrong
```
## Deployment

The site is hosted on **Vercel** and connected to this GitHub repo, so deploys are automatic.

- **Live site:** https://nbafantasy-hornpub.vercel.app
- **Repo:** https://github.com/ryanpatterson-pd/nba-fantasy-draft

### The deploy flow

Vercel watches the `main` branch. Any push to `main` triggers a new production build and deploy —
there is no separate deploy command to run.

```bash
git add -A
git commit -m "your message"
git push            # Vercel builds and deploys automatically
```

Pushing to any other branch (or opening a pull request) gets its own **preview** deployment on a
temporary URL, so you can check a change before it reaches production.

### Environment variables on Vercel

Only one variable is set on Vercel:

| Variable | Value | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://nbafantasy-hornpub.vercel.app` | Builds the `metadataBase` for Open Graph / share-preview links in `app/layout.tsx`. |

The `NEXT_PUBLIC_` prefix is required — the code reads `process.env.NEXT_PUBLIC_SITE_URL`. Vercel
shows a warning that public-prefixed values are exposed to the browser and suggests removing the
prefix. That warning is safe to dismiss here: the value is the site's own public address, not a
secret. Never put a real secret (API key, token, password) behind `NEXT_PUBLIC_`, but a public URL
is exactly what it is for. If the prefix is removed, the code will not find the variable and will
silently fall back to `http://localhost:3000`, which would point share previews at localhost.

### ESPN credentials stay local

`ESPN_S2`, `SWID` and `ESPN_LEAGUE_ID` are **not** set on Vercel and must never be. They are only
used by the local import scripts in `scripts/`, never at build or runtime. They live in `.env.local`
(gitignored) and never leave your machine. To refresh league data: run the importer locally, then
commit and push the regenerated files in `lib/data/seasons/` — Vercel redeploys with the new data.
