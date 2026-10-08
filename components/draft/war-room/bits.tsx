'use client';

import type { Position } from '@/lib/draft/stats-board';
import { cn } from '@/lib/utils/cn';

/** Small colour-coded chip for the player's position. */
const POS_TONE: Record<Position, string> = {
  PG: 'bg-[#e8f0ff] text-[#2563a6] border-[#cfe0f7]',
  SG: 'bg-[#eafaf0] text-[#168347] border-[#c6ecd4]',
  SF: 'bg-[#fff4e5] text-[#c76c09] border-[#f3d39f]',
  PF: 'bg-[#f3eefb] text-[#7c3aed] border-[#e0d3f7]',
  C: 'bg-[#fdeef0] text-[#c02b41] border-[#f5cdd4]',
};

export function PosChip({ pos }: { pos: Position }) {
  return (
    <span
      className={cn(
        'inline-grid h-6 min-w-[30px] place-items-center rounded-[7px] border px-1.5 text-[10px] font-black tracking-[0.5px]',
        POS_TONE[pos],
      )}
    >
      {pos}
    </span>
  );
}
