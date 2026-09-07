import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils/cn';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Tailwind width class, e.g. 'w-16'. */
  width?: string;
  /** Hide below the md breakpoint to keep tables readable on phones. */
  hideOnMobile?: boolean;
  numeric?: boolean;
  /**
   * Makes the column sortable. Return the value to order by — numbers sort
   * numerically, strings alphabetically. Columns without this stay static.
   */
  sortValue?: (row: T) => number | string;
};

export type SortState = { key: string; dir: 'asc' | 'desc' };

const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

const JUSTIFY = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
} as const;

/**
 * Data table.
 *
 * Follows the reference spec: tinted sticky header row with 11px/900 uppercase
 * labels, 13px/14px cell padding, hairline dividers, body cells at weight 750,
 * and every column after the first right-aligned by default.
 *
 * Deliberately stateless. Sorting is driven by `sort` + `onSortChange` so the
 * component stays usable from both server and client trees — the owning client
 * component holds the state and this one only does the ordering.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowHighlight,
  className,
  compact = false,
  emptyMessage = 'Nothing to show yet.',
  headTone = 'default',
  sort,
  onSortChange,
  stickyFirst = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Return true to give a row the accent-tinted treatment. */
  onRowHighlight?: (row: T, index: number) => boolean;
  className?: string;
  compact?: boolean;
  emptyMessage?: string;
  /** `royal` is the purple-and-gold ceremony header. */
  headTone?: 'default' | 'royal';
  sort?: SortState;
  /** Provide to make sortable columns interactive. */
  onSortChange?: (key: string) => void;
  /**
   * Pin the leading columns (and their headers) to the left edge while the rest
   * of the table scrolls horizontally, keeping the identity columns — the rank
   * and manager — in view on narrow screens. The number is how many columns to
   * pin. `true` pins the first two, which suits the rank + manager tables.
   *
   * Pinned columns are laid out left-to-right; the first sits flush at 0 and
   * each subsequent one is offset by the widths before it.
   */
  stickyFirst?: boolean | number;
}) {
  const royal = headTone === 'royal';
  // How many leading columns to pin, and where each pinned column starts. The
  // offsets assume a narrow fixed-width rank column (w-10 = 2.5rem) leads.
  const pinCount = stickyFirst === true ? 2 : typeof stickyFirst === 'number' ? stickyFirst : 0;
  const PIN_LEFT = ['left-0', 'left-10', 'left-20'];

  /** Numeric and trailing columns right-align unless told otherwise. */
  const alignFor = (column: Column<T>, index: number) =>
    column.align ?? (index === 0 ? 'left' : 'right');

  const sortColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const ordered =
    sort && sortColumn?.sortValue
      ? [...rows].sort((a, b) => {
          const left = sortColumn.sortValue!(a);
          const right = sortColumn.sortValue!(b);
          const diff =
            typeof left === 'number' && typeof right === 'number'
              ? left - right
              : String(left).localeCompare(String(right), 'en-AU');
          return sort.dir === 'asc' ? diff : -diff;
        })
      : rows;

  if (ordered.length === 0) {
    return <p className="px-[18px] py-6 text-[13px] font-semibold text-ink-dim">{emptyMessage}</p>;
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-ink">
        <thead className={cn(royal && 'on-royal')}>
          <tr>
            {columns.map((column, index) => {
              const align = alignFor(column, index);
              const sortable = Boolean(onSortChange && column.sortValue);
              const active = sort?.key === column.key;

              const pinned = index < pinCount;
              const lastPinned = pinned && index === pinCount - 1;

              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'tbl-head sticky top-0 z-[1] whitespace-nowrap',
                    // Flat fill, not a gradient: a 90deg wash would restart in
                    // every cell and band across the row.
                    royal
                      ? 'border-t border-b border-gold/30 bg-royal-deep'
                      : 'border-t border-b border-line bg-surface-2',
                    // Pin the leading headers to the left too, above their row
                    // peers; the last pinned one carries a hairline seam.
                    pinned && cn('z-[3]', PIN_LEFT[index]),
                    lastPinned &&
                      'after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-line',
                    // Sortable headers place their own padding inside the button
                    // so the whole cell is the hit target.
                    sortable ? 'p-0' : 'px-3.5 py-3.5',
                    ALIGN[align],
                    column.width,
                    column.hideOnMobile && 'hidden md:table-cell',
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange!(column.key)}
                      className={cn(
                        'flex w-full items-center gap-1 px-3.5 py-3.5 transition-colors',
                        JUSTIFY[align],
                        royal
                          ? 'hover:text-gold-2 focus-visible:text-gold-2'
                          : 'hover:text-ink focus-visible:text-ink',
                        active && (royal ? 'text-gold-2' : 'text-ink'),
                      )}
                      title={`Sort by ${typeof column.header === 'string' ? column.header : column.key}`}
                    >
                      {/* Right-aligned headers read better with the caret trailing. */}
                      {align === 'right' && <SortCaret active={active} dir={sort?.dir} />}
                      <span className="truncate">{column.header}</span>
                      {align !== 'right' && <SortCaret active={active} dir={sort?.dir} />}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map((row, index) => {
            const highlighted = onRowHighlight?.(row, index) ?? false;
            return (
              <tr key={rowKey(row, index)} className="group">
                {columns.map((column, columnIndex) => {
                  const pinned = columnIndex < pinCount;
                  const lastPinned = pinned && columnIndex === pinCount - 1;
                  return (
                    <td
                      key={column.key}
                      className={cn(
                        'tbl-cell border-b border-line transition-colors',
                        compact ? 'px-3.5 py-2.5' : 'px-3.5 py-3.5',
                        ALIGN[alignFor(column, columnIndex)],
                        column.numeric && 'tabular',
                        column.hideOnMobile && 'hidden md:table-cell',
                        // Pinned columns need an opaque background so the
                        // scrolling cells never show through underneath them;
                        // the last pinned one carries a hairline seam.
                        pinned && cn('sticky z-[1]', PIN_LEFT[columnIndex]),
                        lastPinned &&
                          'after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-line',
                        highlighted
                          ? royal
                            ? 'bg-gold-bg'
                            : 'bg-accent-bg'
                          : pinned
                            ? 'bg-surface group-hover:bg-surface-3'
                            : 'group-hover:bg-surface-3',
                      )}
                    >
                      {column.cell(row, index)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Sort affordance: dimmed until the column is the active one. */
function SortCaret({ active, dir }: { active?: boolean; dir?: 'asc' | 'desc' }) {
  return (
    <Icon
      name={active && dir === 'asc' ? 'chevron-up' : 'chevron-down'}
      size={11}
      strokeWidth={3}
      className={cn('shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-30')}
      aria-hidden
    />
  );
}
