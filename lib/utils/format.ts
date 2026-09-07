/** Display formatting helpers shared across every page. */

export function num(value: number, fractionDigits = 0): string {
  return value.toLocaleString('en-AU', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function pct(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${num(value)}`;
}

/** `13–7` normally, `13–7–1` when there are drawn games. */
export function record(wins: number, losses: number, ties = 0): string {
  return ties > 0 ? `${wins}\u2013${losses}\u2013${ties}` : `${wins}\u2013${losses}`;
}

export function ordinal(n: number): string {
  const table = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${table[(v - 20) % 10] ?? table[v] ?? table[0]}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

export function countdownTo(iso: string, from: number = Date.now()): Countdown {
  const diff = new Date(iso).getTime() - from;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    done: false,
  };
}

/** Splits a seasonId like "2024-25" into a display label. */
export function seasonLabelFromId(id: string): string {
  return id.replace('-', '/');
}
