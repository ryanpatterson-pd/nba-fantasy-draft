/**
 * Draft-night celebration effects: confetti, a sound cue and haptics.
 *
 * All three are best-effort and self-contained (no dependencies): confetti is a
 * short-lived canvas overlay, the sound is a couple of WebAudio tones, and the
 * buzz uses the Vibration API where it exists. Everything is a no-op when it
 * cannot run (SSR, reduced motion, muted, or unsupported), so callers never
 * need to guard.
 */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  );
}

/* --------------------------------------------------------------- confetti */

type ConfettiOptions = {
  /** Colours to draw from, e.g. the two managers' team colours. */
  colours?: string[];
  /** Roughly how many pieces. Scaled down under reduced motion. */
  count?: number;
  /** Milliseconds the burst lives for. */
  durationMs?: number;
};

/**
 * Fires a one-shot confetti burst over the whole viewport.
 *
 * Draws to a fixed, pointer-transparent canvas that removes itself when the
 * pieces have fallen, so it never interferes with the page beneath.
 */
export function burstConfetti({
  colours = ['#ef6511', '#ff8534', '#d4af37', '#f4dd8a', '#ffffff'],
  count = 160,
  durationMs = 2600,
}: ConfettiOptions = {}): void {
  if (typeof document === 'undefined') return;
  if (prefersReducedMotion()) return;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '100',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  type Piece = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rot: number;
    vr: number;
    colour: string;
  };

  const pieces: Piece[] = Array.from({ length: count }, () => ({
    // Launch from the two top corners and the centre, arcing inward.
    x: w * (0.1 + Math.random() * 0.8),
    y: -20 - Math.random() * h * 0.2,
    vx: (Math.random() - 0.5) * 8,
    vy: 3 + Math.random() * 5,
    size: 6 + Math.random() * 7,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    colour: colours[Math.floor(Math.random() * colours.length)],
  }));

  const start = performance.now();
  const gravity = 0.12;

  function frame(now: number) {
    const elapsed = now - start;
    ctx!.clearRect(0, 0, w, h);

    for (const p of pieces) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.colour;
      // A tumbling ribbon reads better than a flat square.
      ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx!.restore();
    }

    if (elapsed < durationMs) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ sound */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

/**
 * A short rising two-note cue for a pick reveal. `enabled` lets a mute toggle
 * silence it without the caller branching.
 */
export function playReveal(enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  // Browsers start the context suspended until a gesture; a spin click counts.
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;
  const notes = [
    { freq: 523.25, at: 0 }, // C5
    { freq: 783.99, at: 0.12 }, // G5
  ];

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(0.0001, now + note.at);
    gain.gain.exponentialRampToValueAtTime(0.18, now + note.at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + note.at);
    osc.stop(now + note.at + 0.4);
  }
}

/** A soft tick, e.g. as the final order counts down. */
export function playTick(enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.14);
}

/* --------------------------------------------------------------- haptics */

/** Best-effort vibration; silently absent on desktop and unsupported browsers. */
export function buzz(pattern: number | number[] = [0, 40, 30, 80]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers throw when vibration is disabled by the user; ignore.
  }
}
