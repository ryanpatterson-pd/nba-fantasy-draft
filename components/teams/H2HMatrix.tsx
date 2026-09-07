import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardHeader } from '@/components/ui/Card';
import { MANAGERS } from '@/lib/data/managers';
import { headToHead } from '@/lib/stats/head-to-head';
import { winRate } from '@/lib/stats/tally';
import { record } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

/**
 * The full 12x12 ledger. Read across a row for that manager's record against
 * each opponent. Cells are tinted by dominance so the grid is scannable.
 */
export function H2HMatrix() {
  return (
    <Card>
      <CardHeader label="All-time head-to-head" meta="Row manager vs column manager" />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="label-xs sticky left-0 z-10 border-r border-b border-line bg-surface px-3 py-2 text-left"
              >
                Manager
              </th>
              {MANAGERS.map((manager) => (
                <th
                  key={manager.id}
                  scope="col"
                  className="label-xs border-b border-line px-2 py-2 text-center whitespace-nowrap"
                >
                  {manager.name.slice(0, 3)}
                </th>
              ))}
              <th
                scope="col"
                className="label-xs border-b border-l border-line px-3 py-2 text-right whitespace-nowrap"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {MANAGERS.map((row) => {
              let wins = 0;
              let losses = 0;
              let ties = 0;
              for (const column of MANAGERS) {
                if (column.id === row.id) continue;
                const cell = headToHead(row.id, column.id);
                wins += cell?.wins ?? 0;
                losses += cell?.losses ?? 0;
                ties += cell?.ties ?? 0;
              }

              return (
                <tr key={row.id} className="border-b border-line/60 last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-line bg-surface px-3 py-2 text-left font-normal"
                  >
                    <Link href={`/teams/${row.id}`} className="flex items-center gap-2 hover:text-accent-deep">
                      <Avatar manager={row} size="xs" ring={false} />
                      <span className="text-xs font-semibold whitespace-nowrap text-ink">{row.name}</span>
                    </Link>
                  </th>

                  {MANAGERS.map((column) => {
                    if (column.id === row.id) {
                      return (
                        <td
                          key={column.id}
                          className="bg-surface-3/60 px-2 py-2 text-center text-ink-mute"
                          aria-label="Same manager"
                        >
                          ·
                        </td>
                      );
                    }

                    const cell = headToHead(row.id, column.id);
                    const games = cell?.games ?? 0;
                    const label = cell ? record(cell.wins, cell.losses, cell.ties) : '0–0';
                    const rate = cell && games > 0 ? winRate(cell) : 0.5;
                    const dominant = rate > 0.5;
                    const strength = Math.abs(rate - 0.5) * 2;

                    return (
                      <td
                        key={column.id}
                        title={`${row.name} vs ${column.name}: ${label}`}
                        className="tabular px-2 py-2 text-center text-xs"
                        style={{
                          background:
                            games === 0
                              ? undefined
                              : `color-mix(in oklab, ${dominant ? 'var(--positive)' : 'var(--negative)'} ${Math.round(
                                  strength * 26,
                                )}%, transparent)`,
                        }}
                      >
                        {games === 0 ? (
                          <span className="text-ink-mute">—</span>
                        ) : (
                          <span
                            className={cn(
                              'font-semibold',
                              dominant ? 'text-positive' : rate < 0.5 ? 'text-negative' : 'text-ink-dim',
                            )}
                          >
                            {label}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="tabular border-l border-line px-3 py-2 text-right text-xs font-bold text-ink">
                    {record(wins, losses, ties)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-3 text-[0.7rem] leading-snug text-ink-mute">
        Green cells mean the row manager holds the advantage, red means they trail. Includes playoff
        meetings.
      </p>
    </Card>
  );
}
