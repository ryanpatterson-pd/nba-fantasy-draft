import type { ScoreFormat } from '@/lib/types';

/**
 * Parsing and display of raw game scores.
 *
 * Times are stored canonically as seconds (to 3dp), so they stay readable in
 * localStorage and can be compared with a plain numeric sort. Entry is
 * deliberately forgiving because these get typed on a phone, one-handed,
 * outdoors: `48.21`, `1:12.5`, `1:02`, `72` all work.
 */

const MM_SS = /^(\d{1,3}):(\d{1,2}(?:\.\d{1,3})?)$/;

export function parseScore(input: string, format: ScoreFormat): number | null {
  const raw = input.trim();
  if (raw === '') return null;

  if (format === 'time') {
    const mmss = MM_SS.exec(raw);
    if (mmss) {
      const minutes = Number(mmss[1]);
      const seconds = Number(mmss[2]);
      if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || seconds >= 60) return null;
      return round(minutes * 60 + seconds, 3);
    }
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds < 0) return null;
    return round(seconds, 3);
  }

  if (format === 'placing') {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) return null;
    return value;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return round(value, 3);
}

export function formatScore(value: number, format: ScoreFormat, decimals = 0): string {
  if (format === 'time') return formatTime(value);
  if (format === 'placing') return String(Math.round(value));
  return value.toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Seconds to `48.21` under a minute, `1:12.50` over it. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  if (seconds < 60) return seconds.toFixed(2);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(2).padStart(5, '0')}`;
}

/** Placeholder text for the input, so the expected shape is obvious. */
export function scorePlaceholder(format: ScoreFormat): string {
  if (format === 'time') return '48.21';
  if (format === 'placing') return '1';
  return '0';
}

export function scoreInputMode(format: ScoreFormat): 'decimal' | 'numeric' {
  return format === 'placing' ? 'numeric' : 'decimal';
}

function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
