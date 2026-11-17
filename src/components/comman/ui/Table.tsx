import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, Inbox, SlidersHorizontal, X } from 'lucide-react';
import { DialogShell, useDialogClose } from './DialogShell';
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
  /** Needs `columnsKey` on the table: starts hidden until the user turns it on in "Columns". */
  defaultHidden?: boolean;
  /** Needs `columnsKey`: cannot be hidden in "Columns". (The first column and the actions column never can.) */
  essential?: boolean;
}

export interface TablePagination {
  page:     number;
  total:    number;
  perPage?: number;
  onChange: (page: number) => void;
  label?:   string;
  /** Shows a "Show N per page" picker in the footer when both are set. */
  perPageOptions?:  readonly number[];
  onPerPageChange?: (perPage: number) => void;
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
  /**
   * Adds a "Columns" button so each user chooses which columns to show; the choice is remembered in this browser under
   * this key (use a stable id such as "seller-returns").
   */
  columnsKey?:       string;
  /** Row click opens this content in a side panel (bottom sheet on phones), so the table can stay short. */
  renderDetail?:     (row: T, close: () => void) => ReactNode;
  detailTitle?:      (row: T) => string;
  /**
   * Row click opens a side panel built from the table's own columns (every column, hidden ones included, then the
   * actions). No per-page code; use `renderDetail` instead when a page needs its own content.
   */
  rowPanel?:         boolean;
}

const TH =
  'text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] ' +
  'px-5 py-[12px] whitespace-nowrap bg-cream';

const COL_STORAGE = 'sx-table-cols:v1:';
const CHECK_COL_W = 56;
const INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"], [role="menuitem"]';

function readHidden(key: string | undefined): string[] | null {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(COL_STORAGE + key);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : null;
  } catch { return null; }
}

function DetailPanel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <DialogShell onClose={onClose} align="right" ariaLabel={title}>
      <DetailHeader title={title} onClose={onClose} />
      <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
    </DialogShell>
  );
}

function DetailHeader({ title, onClose }: { title: string; onClose: () => void }) {
  const close = useDialogClose(onClose);
  return (
    <div className="flex items-center justify-between gap-3 border-b border-bone px-5 py-3.5">
      <h2 className="m-0 min-w-0 truncate text-[16px] font-semibold text-carbon">{title}</h2>
      <button type="button" onClick={close} aria-label="Close" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-slate hover:bg-cream">
        <X size={18} />
      </button>
    </div>
  );
}

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

function showEmptyStateFlag(loading: boolean, count: number, emptyState: unknown): boolean {
  return !loading && count === 0 && emptyState !== false;
}

export function Table<T = Record<string, unknown>>({
  columns: allColumns, data, keyExtractor, onRowClick, pagination, className,
  sort, onSortChange, selectable, selectedKeys, onSelectionChange, bulkActions,
  loading = false, loadingRows = 5, emptyState, columnsKey, renderDetail: renderDetailProp, detailTitle, rowPanel,
}: TableProps<T>) {
  // Only one mobile row is left swiped-open at a time, the way a native list
  // behaves — otherwise two rows could both hold their actions out.
  const [swipedKey, setSwipedKey] = useState<string | number | null>(null);

  // ── Which columns are shown (opt-in "Columns" picker) ──
  const [hiddenKeys, setHiddenKeys] = useState<string[] | null>(() => readHidden(columnsKey));
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isActionColumn = (c: TableColumn<T>) => !c.header || /^actions?$/i.test(c.header.trim());
  const isCounter = (c: TableColumn<T>) => c.header.trim() === '#';
  const firstDataOf = (cols: TableColumn<T>[]) => cols.findIndex(c => !isActionColumn(c) && !isCounter(c));
  const firstDataKey = allColumns[firstDataOf(allColumns)]?.key;
  const isLocked = (c: TableColumn<T>) => c.key === firstDataKey || c.essential || isActionColumn(c) || isCounter(c);
  const hiddenSet = new Set(columnsKey ? (hiddenKeys ?? allColumns.filter(c => c.defaultHidden).map(c => c.key)) : []);
  const columns = columnsKey ? allColumns.filter(c => isLocked(c) || !hiddenSet.has(c.key)) : allColumns;
  const firstData = firstDataOf(columns);
  const toggleColumn = (key: string) => {
    const next = new Set(hiddenSet);
    if (next.has(key)) next.delete(key); else next.add(key);
    const arr = [...next];
    setHiddenKeys(arr);
    try { if (columnsKey) localStorage.setItem(COL_STORAGE + columnsKey, JSON.stringify(arr)); } catch { /* storage blocked: choice lasts for this visit */ }
  };
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e: MouseEvent) => { if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickerOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [pickerOpen]);

  // ── Side panel for a clicked row ──
  const [detailRow, setDetailRow] = useState<T | null>(null);
  const autoDetail = (row: T, close: () => void) => {
    const rowIdx = data.indexOf(row);
    const cell = (c: TableColumn<T>) => (c.render ? c.render(row, rowIdx) : String((row as Record<string, unknown>)[c.key] ?? ''));
    const actions = allColumns.filter(isActionColumn);
    return (
      <div className="flex flex-col gap-4">
        <dl className="m-0 flex flex-col gap-3">
          {allColumns.filter(c => !isActionColumn(c) && !isCounter(c)).map(c => (
            <div key={c.key} className="flex items-start justify-between gap-4 border-b border-[#f0eee6] pb-2.5 text-[13.5px]">
              <dt className="shrink-0 text-slate">{c.header}</dt>
              <dd className="m-0 min-w-0 break-words text-right font-medium text-carbon [&_*]:max-w-none [&_*]:whitespace-normal">{cell(c)}</dd>
            </div>
          ))}
        </dl>
        {actions.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            onClick={e => { const el = e.target as HTMLElement; if (el.closest('button, a') && !el.closest('[aria-haspopup], [aria-expanded]')) close(); }}
          >
            {actions.map(c => <span key={c.key}>{cell(c)}</span>)}
          </div>
        )}
      </div>
    );
  };
  const renderDetail = renderDetailProp ?? (rowPanel ? autoDetail : undefined);
  const openRow = (row: T) => { onRowClick?.(row); if (renderDetail) setDetailRow(row); };

  // ── Wide table: edge hints, sticky edge columns and arrow buttons ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const [m, setM] = useState({ overflow: false, left: false, right: false, sw: 0, lw: 0, rw: 0 });
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const overflow = el.scrollWidth > el.clientWidth + 1;
    const lw = Array.from(el.querySelectorAll<HTMLElement>('thead .sx-sticky-l')).reduce((n, c) => n + c.offsetWidth, 0);
    const rw = el.querySelector<HTMLElement>('thead .sx-sticky-r')?.offsetWidth ?? 0;
    const next = { overflow, left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1, sw: el.scrollWidth, lw, rw };
    setM(p => (p.overflow === next.overflow && p.left === next.left && p.right === next.right && p.sw === next.sw && p.lw === next.lw && p.rw === next.rw ? p : next));
  }, []);
  useLayoutEffect(() => { measure(); }, [measure, data, loading, hiddenKeys, allColumns.length]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const table = el.querySelector('table');
    if (table) ro.observe(table);
    return () => ro.disconnect();
  }, [measure, showEmptyStateFlag(loading, data.length, emptyState)]);
  const onScrollMain = () => { measure(); };
  const nudge = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (el) el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.6), behavior: 'smooth' });
  };

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
          {columnsKey && (
            <div ref={pickerRef} className="relative hidden justify-end px-4 pb-2 pt-1 sm:flex">
              <button
                type="button"
                onClick={() => setPickerOpen(o => !o)}
                aria-expanded={pickerOpen}
                aria-haspopup="true"
                className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-bone bg-white px-3 text-[12.5px] font-medium text-carbon hover:bg-cream"
              >
                <SlidersHorizontal size={14} aria-hidden /> Columns
              </button>
              {pickerOpen && (
                <div role="group" aria-label="Show columns" className="absolute right-4 top-full z-20 mt-1 w-[220px] rounded-xl border border-bone bg-white p-2 shadow-raised">
                  {allColumns.map(c => {
                    if (isActionColumn(c) || isCounter(c)) return null;
                    const locked = isLocked(c);
                    return (
                      <label key={c.key} className={clsx('flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] text-carbon', locked ? 'opacity-60' : 'cursor-pointer hover:bg-cream')}>
                        <input type="checkbox" className="accent-brand-orange" checked={locked || !hiddenSet.has(c.key)} disabled={locked} onChange={() => toggleColumn(c.key)} />
                        {c.header}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Desktop / tablet — full table ── */}
          <div className="sx-tbl hidden sm:block" data-overflow={m.overflow ? '1' : '0'} data-left={m.left ? '1' : '0'} data-right={m.right ? '1' : '0'}>
          <div className="relative">
          <div ref={scrollRef} onScroll={onScrollMain} className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-[1]">
                <tr className="border-y border-bone bg-cream">
                  {selectable && (
                    <th className={clsx(TH, 'sx-sticky-l')} style={{ left: 0, width: CHECK_COL_W, minWidth: CHECK_COL_W }}>
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
                  {columns.map((col, ci) => {
                    const stickyL = ci === firstData;
                    const stickyR = isActionColumn(col) && ci === columns.length - 1;
                    const isSorted   = sort?.key === col.key;
                    const ariaSort: 'ascending' | 'descending' | 'none' =
                      isSorted ? (sort!.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                    return (
                      <th
                        key={col.key}
                        className={clsx(TH, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', stickyL && 'sx-sticky-l sx-sticky-l-last', stickyR && 'sx-sticky-r')}
                        style={{ ...(col.width ? { width: col.width } : {}), ...(stickyL ? { left: selectable ? CHECK_COL_W : 0 } : {}), ...(stickyR ? { right: 0 } : {}) }}
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
                        (onRowClick || renderDetail) && 'cursor-pointer',
                        // A thin inset left accent (box-shadow, not a real
                        // border — no layout shift) instead of a flat
                        // background tint is the row-level version of the
                        // same "surface catches the light" language as
                        // surface-panel, scoped to just this one row.
                        'transition-[background-color,box-shadow] duration-fast ease-out hover:bg-brand-pale-orange/[0.16] hover:shadow-[inset_2px_0_0_0_var(--color-brand-orange)]',
                        selectable && keys.has(rowKey) && 'bg-brand-pale-orange/[0.10]',
                      )}
                      onClick={e => { if (renderDetail && (e.target as HTMLElement).closest(INTERACTIVE)) return; openRow(row); }}
                    >
                      {selectable && (
                        <td className="sx-sticky-l px-5 py-[14px]" style={{ left: 0, width: CHECK_COL_W, minWidth: CHECK_COL_W }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="accent-brand-orange cursor-pointer"
                            checked={keys.has(rowKey)}
                            onChange={() => toggleRow(rowKey)}
                            aria-label="Select row"
                          />
                        </td>
                      )}
                      {columns.map((col, ci) => {
                        const stickyL = ci === firstData;
                        const stickyR = isActionColumn(col) && ci === columns.length - 1;
                        return (
                        <td
                          key={col.key}
                          className={clsx(
                            'px-5 py-[14px] text-carbon',
                            col.align === 'right'  && 'text-right',
                            col.align === 'center' && 'text-center',
                            stickyL && 'sx-sticky-l sx-sticky-l-last',
                            stickyR && 'sx-sticky-r',
                          )}
                          style={{ ...(stickyL ? { left: selectable ? CHECK_COL_W : 0 } : {}), ...(stickyR ? { right: 0 } : {}) }}
                        >
                          {col.render
                            ? col.render(row, i)
                            : String((row as Record<string, unknown>)[col.key] ?? '')}
                        </td>
                        );
                      })}
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
          {m.overflow && m.right && (
            <>
              <div aria-hidden className="pointer-events-none absolute bottom-0 top-0 w-10 bg-gradient-to-l from-black/[0.07] to-transparent" style={{ right: m.rw }} />
              <button type="button" onClick={() => nudge(1)} aria-label="Scroll table right" className="absolute top-1.5 z-[4] flex size-8 cursor-pointer items-center justify-center rounded-full border border-bone bg-white text-carbon shadow-md hover:bg-cream" style={{ right: m.rw + 8 }}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
          {m.overflow && m.left && (
            <>
              <div aria-hidden className="pointer-events-none absolute bottom-0 top-0 w-10 bg-gradient-to-r from-black/[0.07] to-transparent" style={{ left: m.lw }} />
              <button type="button" onClick={() => nudge(-1)} aria-label="Scroll table left" className="absolute top-1.5 z-[4] flex size-8 cursor-pointer items-center justify-center rounded-full border border-bone bg-white text-carbon shadow-md hover:bg-cream" style={{ left: m.lw + 8 }}>
                <ChevronLeft size={16} />
              </button>
            </>
          )}
          </div>
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
                    onRowClick={renderDetail || onRowClick ? openRow : undefined}
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

      {renderDetail && detailRow && (
        <DetailPanel title={detailTitle ? detailTitle(detailRow) : String(((detailRow as Record<string, unknown>)[allColumns[firstData]?.key ?? ''] ?? 'Details') as string)} onClose={() => setDetailRow(null)}>
          {renderDetail(detailRow, () => setDetailRow(null))}
        </DetailPanel>
      )}

      {/* Pagination footer */}
      {!loading && data.length > 0 && pagination && pagination.total > 0 && (
        <div className="px-5 py-3 border-t border-bone flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="text-[12px] text-slate whitespace-nowrap">
              Showing {start}–{end} of {pagination.total.toLocaleString()} {label}
            </span>
            {pagination.perPageOptions && pagination.onPerPageChange && (
              <label className="flex items-center gap-1.5 text-[12px] text-slate whitespace-nowrap">
                Show
                <select
                  value={perPage}
                  onChange={e => pagination.onPerPageChange?.(Number(e.target.value))}
                  aria-label={`${label} per page`}
                  className="h-8 rounded-md border border-bone bg-white px-2 text-[12.5px] text-carbon cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                >
                  {pagination.perPageOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                per page
              </label>
            )}
          </div>
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
