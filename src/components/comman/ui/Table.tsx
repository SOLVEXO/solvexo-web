import { useLayoutEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ArrowUpDown, Inbox } from 'lucide-react';
import { Pagination } from './Pagination';
import { SkeletonBox } from './SkeletonBox';
import { EmptyState } from './EmptyState';

export interface TableColumn<T = Record<string, unknown>> {
  key:       string;
  header:    string;
  render?:   (row: T, index: number) => ReactNode;
  align?:    'left' | 'center' | 'right';
  width?:    string;
  sortable?: boolean;
}

export interface TablePagination {
  page:     number;
  total:    number;
  perPage?: number;
  onChange: (page: number) => void;
  label?:   string;
}

export interface TableSort {
  key:       string;
  direction: 'asc' | 'desc';
}

interface EmptyStateConfig {
  icon?:        ReactNode;
  title:        string;
  description?: string;
  action?:      { label: string; onClick: () => void; icon?: ReactNode };
}

interface TableProps<T = Record<string, unknown>> {
  columns:           TableColumn<T>[];
  data:              T[];
  keyExtractor:      (row: T, index: number) => string | number;
  onRowClick?:       (row: T) => void;
  pagination?:       TablePagination;
  className?:        string;
  sort?:             TableSort;
  onSortChange?:     (key: string) => void;
  selectable?:       boolean;
  selectedKeys?:     Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  bulkActions?:      (selectedKeys: Set<string | number>) => ReactNode;
  /** When true, renders skeleton rows in place of data. */
  loading?:          boolean;
  /** Number of skeleton rows to render while loading. Defaults to 5. */
  loadingRows?:      number;
  /**
   * Empty-state content shown when `data` is empty and `loading` is false.
   * Pass `false` to opt out and render a bare empty table instead.
   */
  emptyState?:       EmptyStateConfig | false;
}

const TH =
  'text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] ' +
  'px-5 py-[12px] whitespace-nowrap';

// ── Mobile row ────────────────────────────────────────────────────────────────
// On desktop these same columns get their own `<td>` and are always visible.
// On mobile there is no room for an actions column, so a row with icon-only
// columns (a kebab menu, Fulfil/Refund buttons) hides them off-canvas to the
// right and reveals them on a horizontal swipe — the native list-item gesture.
// `touch-action: pan-y` is what makes this safe: the browser keeps vertical
// scrolling (and fires `touchcancel`, which we treat as an abort), and only
// hands us the gesture once horizontal movement clearly wins.
const SWIPE_AXIS_THRESHOLD = 10;

interface MobileRowProps<T> {
  row:            T;
  index:          number;
  rowKey:         string | number;
  labeledColumns: TableColumn<T>[];
  actionColumns:  TableColumn<T>[];
  onRowClick?:    (row: T) => void;
  selectable?:    boolean;
  selected?:      boolean;
  onToggleSelect?: (key: string | number) => void;
  open:           boolean;
  anyOpen:        boolean;
  onOpenChange:   (key: string | number | null) => void;
}

function MobileRow<T>({
  row, index, rowKey, labeledColumns, actionColumns, onRowClick,
  selectable, selected, onToggleSelect, open, anyOpen, onOpenChange,
}: MobileRowProps<T>) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [revealWidth, setRevealWidth] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);

  const dragRef = useRef(0);
  const gesture = useRef({ x: 0, y: 0, axis: 'none' as 'none' | 'h' | 'v', aborted: true });
  // Set when a real swipe happened, so the synthetic click that follows
  // `touchend` doesn't also open the row.
  const consumedClick = useRef(false);

  useLayoutEffect(() => {
    const el = stripRef.current;
    if (el) setRevealWidth(el.offsetWidth);
  }, [actionColumns, index]);

  const canSwipe = actionColumns.length > 0 && revealWidth > 0;
  const base = open ? -revealWidth : 0;
  const offset = dragging ? drag : base;

  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    const t = e.touches[0];
    gesture.current = { x: t.clientX, y: t.clientY, axis: 'none', aborted: false };
  };

  const onTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (g.aborted) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;

    if (g.axis === 'none') {
      if (Math.abs(dx) > SWIPE_AXIS_THRESHOLD && Math.abs(dx) > Math.abs(dy)) g.axis = 'h';
      else if (Math.abs(dy) > SWIPE_AXIS_THRESHOLD) { g.aborted = true; return; }
      else return;
      setDragging(true);
    }
    if (g.axis === 'h') {
      const next = Math.max(-revealWidth, Math.min(0, dx + base));
      dragRef.current = next;
      setDrag(next);
    }
  };

  const onTouchEnd = () => {
    const wasSwipe = !gesture.current.aborted && gesture.current.axis === 'h';
    gesture.current = { x: 0, y: 0, axis: 'none', aborted: true };
    if (!wasSwipe) return;
    const nextOpen = dragRef.current < -revealWidth / 2;
    consumedClick.current = true;
    setDragging(false);
    setDrag(nextOpen ? -revealWidth : 0);
    onOpenChange(nextOpen ? rowKey : null);
  };

  const onTouchCancel = () => {
    if (!gesture.current.aborted) {
      setDragging(false);
      setDrag(base);
    }
    gesture.current = { x: 0, y: 0, axis: 'none', aborted: true };
  };

  const onClick = () => {
    if (consumedClick.current) { consumedClick.current = false; return; }
    if (anyOpen) { onOpenChange(null); return; }
    onRowClick?.(row);
  };

  return (
    <div className="relative overflow-hidden">
      {actionColumns.length > 0 && (
        <div
          ref={stripRef}
          className="absolute top-0 right-0 bottom-0 flex items-center gap-2 px-4 pointer-events-none [&>*]:pointer-events-auto"
        >
          {actionColumns.map(col => (
            <span key={col.key}>{col.render ? col.render(row, index) : null}</span>
          ))}
        </div>
      )}
      <div
        className={clsx(
          'relative bg-white px-4 py-3 flex items-start gap-3',
          canSwipe && 'touch-pan-y',
          onRowClick && 'cursor-pointer active:bg-cream',
          !dragging && 'transition-transform duration-[220ms] ease-out',
          open && 'shadow-[inset_2px_0_0_0_var(--color-brand-orange)]',
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onClick={onClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        {selectable && (
          <input
            type="checkbox"
            aria-label="Select row"
            checked={selected}
            onClick={e => e.stopPropagation()}
            onChange={() => onToggleSelect?.(rowKey)}
            className="accent-brand-orange shrink-0 cursor-pointer size-5 pointer-coarse:size-6 mt-[3px]"
          />
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          {labeledColumns.map((col, ci) => ci === 0 ? (
            // First column is the row's title: full width, no label, like a native list row.
            <div key={col.key} className="min-w-0 text-[15px] font-medium text-carbon leading-[1.35] [&_span]:max-w-none [&_span]:overflow-visible [&_span]:whitespace-normal [&_span]:break-words">
              {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
            </div>
          ) : (
            <div key={col.key} className="flex items-center justify-between gap-3">
              <span className="text-[12px] font-medium text-slate shrink-0">{col.header}</span>
              {/* Callers write these cells for a fixed-width desktop column, so
                  many of them carry `max-w-[180px] truncate`. Inside a stacked
                  phone card there is no column to fit, and clipped names read as
                  broken — the descendant overrides below neutralise that truncation
                  for small screens only (this branch is `sm:hidden`). */}
              <span className="text-[14px] text-carbon text-right min-w-0 leading-[1.35] [&_span]:max-w-none [&_span]:overflow-visible [&_span]:whitespace-normal [&_span]:break-words">
                {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Table<T = Record<string, unknown>>({
  columns, data, keyExtractor, onRowClick, pagination, className,
  sort, onSortChange, selectable, selectedKeys, onSelectionChange, bulkActions,
  loading = false, loadingRows = 5, emptyState,
}: TableProps<T>) {
  // Only one mobile row is left swiped-open at a time, the way a native list
  // behaves — otherwise two rows could both hold their actions out.
  const [swipedKey, setSwipedKey] = useState<string | number | null>(null);

  const perPage    = pagination?.perPage ?? 10;
  const start      = pagination ? (pagination.page - 1) * perPage + 1 : 1;
  const end        = pagination ? Math.min(pagination.page * perPage, pagination.total) : data.length;
  const label      = pagination?.label ?? 'items';

  const keys        = selectedKeys ?? new Set<string | number>();
  const rowKeys     = data.map((row, i) => keyExtractor(row, i));
  const allSelected = selectable && rowKeys.length > 0 && rowKeys.every(k => keys.has(k));
  const someSelected = selectable && rowKeys.some(k => keys.has(k));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rowKeys));
    }
  };

  const toggleRow = (key: string | number) => {
    if (!onSelectionChange) return;
    const next = new Set(keys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectionChange(next);
  };

  // Below `sm`, columns stack into label/value pairs on a card per row instead
  // of forcing a horizontally-scrolling table — a column with no header (an
  // actions/icon-only column) has nothing meaningful to label, so its cells
  // render together in a trailing unlabeled strip instead of a blank-labeled row.
  // A "#" counter has no meaning on a phone card, and an "Actions" column belongs in the swipe strip, not in a labelled row.
  const isActionCol      = (c: TableColumn<T>) => !c.header || /^actions?$/i.test(c.header.trim());
  const labeledColumns   = columns.filter(c => c.header && !isActionCol(c) && c.header.trim() !== '#');
  const unlabeledColumns = columns.filter(isActionCol);

  const showEmptyState = !loading && data.length === 0 && emptyState !== false;

  return (
    <div className={className}>
      {selectable && keys.size > 0 && bulkActions && (
        // On a phone a selection bar belongs at the bottom, over the content —
        // pinned just above the store tab bar (`--store-tabbar-h` is only set
        // while that nav is mounted, so elsewhere it falls back to 0). From
        // `sm` up it stays an inline strip at the top of the card.
        <div className="fixed bottom-[calc(var(--store-tabbar-h,0px)+env(safe-area-inset-bottom))] left-0 right-0 z-[9998] flex items-center gap-3 px-4 py-3 bg-white border-t border-bone shadow-[0_-6px_18px_rgba(20,15,10,0.10)] sm:static sm:z-auto sm:bg-brand-pale-orange/40 sm:border-t-0 sm:border-b sm:px-5 sm:py-2.5 sm:shadow-none">
          <span className="text-[13px] font-medium text-charcoal">{keys.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            {bulkActions(keys)}
          </div>
        </div>
      )}

      {showEmptyState ? (
        <EmptyState
          icon={emptyState?.icon ?? <Inbox size={28} className="text-slate/50" />}
          title={emptyState?.title ?? 'No data yet'}
          description={emptyState?.description ?? 'Nothing to show here right now.'}
          action={emptyState?.action}
        />
      ) : (
        <>
          {/* ── Desktop / tablet — full table ── */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-[1]">
                <tr className="border-y border-bone bg-cream">
                  {selectable && (
                    <th className={clsx(TH, 'w-[40px]')}>
                      <input
                        type="checkbox"
                        className="accent-brand-orange cursor-pointer"
                        checked={!!allSelected}
                        ref={el => { if (el) el.indeterminate = !allSelected && !!someSelected; }}
                        onChange={toggleAll}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  {columns.map(col => {
                    const isSorted   = sort?.key === col.key;
                    const ariaSort: 'ascending' | 'descending' | 'none' =
                      isSorted ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                    return (
                      <th
                        key={col.key}
                        className={clsx(TH, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                        style={col.width ? { width: col.width } : undefined}
                        aria-sort={col.sortable ? ariaSort : undefined}
                      >
                        {col.sortable ? (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={() => onSortChange?.(col.key)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSortChange?.(col.key); } }}
                            className={clsx(
                              'inline-flex items-center gap-1 cursor-pointer select-none',
                              col.align === 'right' && 'flex-row-reverse',
                            )}
                          >
                            {col.header}
                            {isSorted
                              ? (sort!.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
                              : <ArrowUpDown size={12} className="text-slate/60" />}
                          </span>
                        ) : (
                          col.header
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: loadingRows }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className={clsx(i < loadingRows - 1 && 'border-b border-[#f0eee6]')}>
                      {selectable && (
                        <td className="px-5 py-[14px]"><SkeletonBox width={16} height={16} rounded="4px" /></td>
                      )}
                      {columns.map(col => (
                        <td key={col.key} className="px-5 py-[14px]">
                          <SkeletonBox height={14} rounded="4px" className="w-full max-w-[160px]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  data.map((row, i) => {
                  const rowKey = keyExtractor(row, i);
                  return (
                    <tr
                      key={rowKey}
                      className={clsx(
                        i < data.length - 1 && 'border-b border-[#f0eee6]',
                        onRowClick && 'cursor-pointer',
                        // A thin inset left accent (box-shadow, not a real
                        // border — no layout shift) instead of a flat
                        // background tint is the row-level version of the
                        // same "surface catches the light" language as
                        // surface-panel, scoped to just this one row.
                        'transition-[background-color,box-shadow] duration-fast ease-out hover:bg-brand-pale-orange/[0.16] hover:shadow-[inset_2px_0_0_0_var(--color-brand-orange)]',
                        selectable && keys.has(rowKey) && 'bg-brand-pale-orange/[0.10]',
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className="px-5 py-[14px]" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-brand-orange cursor-pointer"
                            checked={keys.has(rowKey)}
                            onChange={() => toggleRow(rowKey)}
                            aria-label="Select row"
                          />
                        </td>
                      )}
                      {columns.map(col => (
                        <td
                          key={col.key}
                          className={clsx(
                            'px-5 py-[14px] text-carbon',
                            col.align === 'right'  && 'text-right',
                            col.align === 'center' && 'text-center',
                          )}
                        >
                          {col.render
                            ? col.render(row, i)
                            : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile — one card per row, columns stacked as label/value ── */}
          <div className="sm:hidden divide-y divide-[#f0eee6]">
            {loading ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <div key={`skeleton-${i}`} className="px-4 py-3 flex flex-col gap-2">
                  <SkeletonBox height={13} width="60%" rounded="4px" />
                  <SkeletonBox height={12} width="40%" rounded="4px" />
                </div>
              ))
            ) : (
              data.map((row, i) => {
                const rowKey = keyExtractor(row, i);
                return (
                  <MobileRow
                    key={rowKey}
                    row={row}
                    index={i}
                    rowKey={rowKey}
                    labeledColumns={labeledColumns}
                    actionColumns={unlabeledColumns}
                    onRowClick={onRowClick}
                    selectable={selectable}
                    selected={keys.has(rowKey)}
                    onToggleSelect={toggleRow}
                    open={swipedKey === rowKey}
                    anyOpen={swipedKey !== null}
                    onOpenChange={setSwipedKey}
                  />
                );
              })
            )}
          </div>
        </>
      )}

      {/* Pagination footer */}
      {!loading && data.length > 0 && pagination && pagination.total > 0 && (
        <div className="px-5 py-3 border-t border-bone flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <span className="text-[12px] text-slate whitespace-nowrap">
            Showing {start}–{end} of {pagination.total.toLocaleString()} {label}
          </span>
          <Pagination
            page={pagination.page}
            total={pagination.total}
            perPage={perPage}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  );
}
