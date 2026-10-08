import { cn } from '@/lib/utils/cn';

/**
 * Big illustrated "scene" for a game, shown on the presentation slide.
 *
 * These are hand-rolled inline SVGs rather than image assets: zero dependencies,
 * crisp at any size on a projector, and they theme automatically. Each scene is
 * drawn on a 240×180 canvas and keyed by the game id. Add a new game to
 * draft-games.ts and give it a matching entry here.
 *
 * The art leans on two CSS variables the rest of the site already defines —
 * `--accent` and `--accent-2` — so it stays on-brand in either theme.
 */

const ACCENT = 'var(--accent, #ff7a1a)';
const ACCENT_2 = 'var(--accent-2, #ffb061)';

type SceneProps = { className?: string };

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 180"
      className={cn('h-full w-full', className)}
      role="img"
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Soft ground line used by several scenes. */
function Ground() {
  return <path d="M20 150h200" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />;
}

const SCENES: Record<string, (props: SceneProps) => React.ReactNode> = {
  // 1 — Bottle Flip: a bottle mid-rotation with a motion arc.
  'bottle-flip': ({ className }) => (
    <Frame className={className}>
      <Ground />
      <path d="M70 120a60 55 0 0 1 100 0" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
      <g transform="rotate(28 120 95)">
        <rect x="108" y="60" width="24" height="58" rx="10" stroke={ACCENT} strokeWidth="4" />
        <path d="M114 60v-8a6 6 0 0 1 12 0v8" stroke={ACCENT} strokeWidth="4" />
        <rect x="112" y="46" width="16" height="7" rx="2" fill={ACCENT} />
        <path d="M108 92h24" stroke={ACCENT} strokeWidth="3" opacity="0.5" />
        <rect x="108" y="92" width="24" height="26" rx="9" fill={ACCENT} opacity="0.18" />
      </g>
      <circle cx="60" cy="70" r="3" fill={ACCENT_2} />
      <circle cx="182" cy="84" r="2.5" fill={ACCENT_2} />
    </Frame>
  ),

  // 2 — Three Cup Beer Pong: three cups and a ball arcing in.
  'beer-pong': ({ className }) => (
    <Frame className={className}>
      <Ground />
      <path d="M44 70q50 -46 96 10" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
      <circle cx="44" cy="70" r="7" fill={ACCENT} />
      {[150, 182].map((x) => (
        <path key={x} d={`M${x} 108l6 34h20l6-34z`} stroke={ACCENT} strokeWidth="3.5" />
      ))}
      <path d="M166 108l6 34h20l6-34z" stroke={ACCENT} strokeWidth="3.5" fill={ACCENT} fillOpacity="0.18" />
      <ellipse cx="182" cy="108" rx="16" ry="4" fill={ACCENT} opacity="0.4" />
    </Frame>
  ),

  // 3 — Footy Bin Challenge: an oval ball heading into a bin.
  'footy-bin': ({ className }) => (
    <Frame className={className}>
      <Ground />
      <path d="M48 92q50 -40 110 -6" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
      <ellipse cx="52" cy="96" rx="15" ry="9" stroke={ACCENT} strokeWidth="4" transform="rotate(-24 52 96)" />
      <path d="M44 92l16 8M50 86l10 18" stroke={ACCENT} strokeWidth="2.5" transform="rotate(-24 52 96)" />
      <path d="M158 96l10 54h34l10-54z" stroke={ACCENT} strokeWidth="4" />
      <path d="M152 96h74" stroke={ACCENT} strokeWidth="5" />
      <path d="M172 108v34M186 108v34M200 108v34" stroke={ACCENT} strokeWidth="2" opacity="0.4" />
    </Frame>
  ),

  // 4 — Egg and Spoon: a spoon cradling an egg, with turn-around arrows.
  'egg-and-spoon': ({ className }) => (
    <Frame className={className}>
      <Ground />
      <ellipse cx="120" cy="86" rx="22" ry="14" stroke={ACCENT} strokeWidth="4" transform="rotate(-10 120 86)" />
      <path d="M138 92l44 26" stroke={ACCENT} strokeWidth="4" />
      <ellipse cx="118" cy="78" rx="13" ry="16" fill={ACCENT} fillOpacity="0.2" stroke={ACCENT} strokeWidth="3" />
      <path d="M60 120a16 16 0 1 1 4 -11" stroke={ACCENT_2} strokeWidth="3" />
      <path d="M60 100l5 9 9 -3" stroke={ACCENT_2} strokeWidth="3" />
      <path d="M196 60a16 16 0 1 0 -4 11" stroke={ACCENT_2} strokeWidth="3" />
      <path d="M196 80l-5 -9 -9 3" stroke={ACCENT_2} strokeWidth="3" />
    </Frame>
  ),

  // 5 — Closest to the Pin: a flag on a green with a golf ball nearby.
  'closest-to-pin': ({ className }) => (
    <Frame className={className}>
      <ellipse cx="150" cy="140" rx="78" ry="22" stroke={ACCENT} strokeWidth="3" opacity="0.4" />
      <path d="M150 140V54" stroke={ACCENT} strokeWidth="4" />
      <path d="M150 56h40l-10 11 10 11h-40" fill={ACCENT} fillOpacity="0.2" stroke={ACCENT} strokeWidth="3" />
      <circle cx="150" cy="140" r="4" fill={ACCENT} />
      <circle cx="96" cy="146" r="8" stroke={ACCENT} strokeWidth="3.5" />
      <path d="M44 150q26 -24 48 -6" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
      <circle cx="44" cy="150" r="6" fill={ACCENT} />
    </Frame>
  ),

  // 6 — Kahoot: a quiz screen with answer shapes and a timer.
  kahoot: ({ className }) => (
    <Frame className={className}>
      <rect x="52" y="38" width="136" height="86" rx="10" stroke={ACCENT} strokeWidth="4" />
      <path d="M70 60h100" stroke={ACCENT} strokeWidth="4" opacity="0.5" />
      <path d="M78 88l10 -14 10 14z" fill={ACCENT} />
      <rect x="116" y="78" width="18" height="18" rx="3" fill={ACCENT} fillOpacity="0.4" stroke={ACCENT} strokeWidth="2.5" />
      <circle cx="152" cy="87" r="9" stroke={ACCENT} strokeWidth="3" />
      <path d="M120 124v12M100 136h40" stroke={ACCENT} strokeWidth="3" />
      <circle cx="120" cy="150" r="12" stroke={ACCENT_2} strokeWidth="3" />
      <path d="M120 150V143M120 150l6 4" stroke={ACCENT_2} strokeWidth="2.5" />
    </Frame>
  ),

  // 7 — Basketball Challenge: ball on a rim (workshopping, so lightly drawn).
  basketball: ({ className }) => (
    <Frame className={className}>
      <path d="M150 36v26" stroke={ACCENT} strokeWidth="4" />
      <rect x="128" y="34" width="44" height="6" rx="3" fill={ACCENT} />
      <path d="M132 62h36l-5 20h-26z" stroke={ACCENT} strokeWidth="3" />
      <path d="M136 70h28M140 78h20" stroke={ACCENT} strokeWidth="1.6" opacity="0.5" />
      <circle cx="96" cy="118" r="22" stroke={ACCENT} strokeWidth="4" />
      <path d="M74 118h44M96 96v44" stroke={ACCENT} strokeWidth="2.5" opacity="0.7" />
      <path d="M80 102c10 9 10 23 0 32M112 102c-10 9 -10 23 0 32" stroke={ACCENT} strokeWidth="2.5" opacity="0.7" />
      <path d="M118 96q24 -20 32 -10" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
    </Frame>
  ),

  // 8 — Donut Challenge: two stacked ring donuts with sprinkles.
  donut: ({ className }) => (
    <Frame className={className}>
      <Ground />
      <g>
        <circle cx="120" cy="88" r="40" stroke={ACCENT} strokeWidth="4" />
        <circle cx="120" cy="88" r="14" stroke={ACCENT} strokeWidth="4" />
        <path d="M82 80a40 40 0 0 1 76 0" stroke={ACCENT_2} strokeWidth="6" opacity="0.6" />
        <path d="M100 66l4 7M118 60l1 8M136 64l-3 7M148 78l-6 5M96 100l6 4M140 102l-5 5" stroke={ACCENT} strokeWidth="2.5" />
      </g>
      <circle cx="176" cy="128" r="22" stroke={ACCENT} strokeWidth="3.5" opacity="0.7" />
      <circle cx="176" cy="128" r="7" stroke={ACCENT} strokeWidth="3.5" opacity="0.7" />
    </Frame>
  ),

  // 9 — Darts Challenge: a dartboard with three darts clustered.
  darts: ({ className }) => (
    <Frame className={className}>
      <circle cx="120" cy="90" r="54" stroke={ACCENT} strokeWidth="4" />
      <circle cx="120" cy="90" r="36" stroke={ACCENT} strokeWidth="2.5" opacity="0.6" />
      <circle cx="120" cy="90" r="18" stroke={ACCENT} strokeWidth="2.5" opacity="0.6" />
      <circle cx="120" cy="90" r="6" fill={ACCENT} />
      <path d="M120 36v108M66 90h108" stroke={ACCENT} strokeWidth="1.4" opacity="0.3" />
      <g stroke={ACCENT} strokeWidth="3">
        <path d="M126 84l40 -26M166 58l-7 2 2 -8" />
        <path d="M112 96l-42 20M70 116l8 -1 -2 8" />
        <path d="M128 100l34 34M162 134l-1 -8 -8 1" />
      </g>
    </Frame>
  ),

  // 10 — Beer Pong Knockout: two cups in a knockout queue with arcing balls.
  'beer-pong-knockout': ({ className }) => (
    <Frame className={className}>
      <Ground />
      <path d="M40 78q40 -34 70 0" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.7" />
      <path d="M70 70q40 -34 70 0" stroke={ACCENT_2} strokeWidth="3" strokeDasharray="4 7" opacity="0.5" />
      <circle cx="40" cy="78" r="7" fill={ACCENT} />
      <circle cx="70" cy="70" r="6" fill={ACCENT} opacity="0.55" />
      <path d="M150 104l6 38h22l6 -38z" stroke={ACCENT} strokeWidth="3.5" fill={ACCENT} fillOpacity="0.18" />
      <ellipse cx="161" cy="104" rx="18" ry="4.5" fill={ACCENT} opacity="0.4" />
      <path d="M196 118l4 24h16l4 -24z" stroke={ACCENT} strokeWidth="3" opacity="0.6" />
    </Frame>
  ),
};

/** Fallback scene for a game with no bespoke art yet. */
function GenericScene({ className }: SceneProps) {
  return (
    <Frame className={className}>
      <circle cx="120" cy="90" r="46" stroke={ACCENT} strokeWidth="4" />
      <path d="M120 44l12 34h36l-29 21 11 34-30 -21-30 21 11-34-29-21h36z" stroke={ACCENT_2} strokeWidth="3" opacity="0.6" />
    </Frame>
  );
}

export function GameScene({ gameId, className }: { gameId: string; className?: string }) {
  const Scene = SCENES[gameId] ?? GenericScene;
  return <Scene className={className} />;
}

export function hasGameScene(gameId: string): boolean {
  return gameId in SCENES;
}
