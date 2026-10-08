'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

/**
 * The lock screen for the War Room.
 *
 * A single access-code field. Wrong codes shake and clear; a correct one hands
 * control back to the parent, which persists the unlock so a refresh stays in.
 */
export function WarRoomGate({ onUnlock }: { onUnlock: (code: string) => boolean }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const ok = onUnlock(code);
    if (!ok) {
      setError(true);
      setCode('');
      // Drop the error styling after the shake so a retry starts clean.
      window.setTimeout(() => setError(false), 600);
    }
  }

  return (
    <div className="flex min-h-[52vh] items-center justify-center">
      <Card
        className={cn(
          'on-dark rail-wash w-full max-w-md px-6 py-10 text-center',
          error && 'animate-shake',
        )}
        accentEdge
      >
        <span className="accent-chip mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full">
          <Icon name="lock" size={24} />
        </span>
        <p className="eyebrow" style={{ color: 'var(--accent-2)' }}>
          Private · invite only
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-white">Draft War Room</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">
          The pre-planned board, live availability and the AI-informed pick order. Enter the access
          code to open it.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoFocus
            placeholder="Access code"
            aria-label="War Room access code"
            aria-invalid={error}
            className={cn(
              'h-12 w-full rounded-tile border bg-white/[0.06] px-4 text-center text-base font-bold tracking-[0.15em] text-white',
              'placeholder:font-medium placeholder:tracking-normal placeholder:text-white/40',
              'transition focus:bg-white/[0.1] focus:outline-none',
              error ? 'border-negative' : 'border-white/15 focus:border-white/30',
            )}
          />
          {error && (
            <p className="text-xs font-bold text-negative">Wrong code — try again.</p>
          )}
          <Button type="submit" variant="primary" size="lg" icon="lock" className="w-full">
            Unlock the War Room
          </Button>
        </form>
      </Card>
    </div>
  );
}
