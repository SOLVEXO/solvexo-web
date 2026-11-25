import {
  Children, Fragment, forwardRef, isValidElement, useEffect, useId, useMemo, useRef, useState,
  type ButtonHTMLAttributes, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type ReactNode,
  type Ref, type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { CONTROL_BASE, CONTROL_FILTER } from './controlStyles';

/* ──────────────────────────────────────────────────────────────────────────────────────────────
 * ONE dropdown for the whole dashboard.
 *  - `Select`        drop-in for the old `<select>` / shared `Select`: takes `<option>` / `<optgroup>` children and
 *                    calls `onChange(e)` with `e.target.value`, so old pages work without being rewritten.
 *  - `MultiSelect`   several values, shown as removable chips.
 *  Everything below (search, icons, descriptions, groups, "Create new", clear, loading, keyboard, bottom sheet on a
 *  phone) is built once here; a page only switches on what it needs.
 * ────────────────────────────────────────────────────────────────────────────────────────────── */

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Options with the same group are listed under one heading. */
  group?: string;
  disabled?: boolean;
  /** Extra words the search also matches. */
  keywords?: string;
}

const SEARCH_AUTO_THRESHOLD = 8;
const PANEL_Z = 10050; // above DialogShell (9999)

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

/** Reads old-style `<option>` / `<optgroup>` children (also inside fragments and `.map()` arrays). */
export function parseOptions(children: ReactNode, group?: string, out: DropdownOption[] = []): DropdownOption[] {
  Children.forEach(children, child => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<Record<string, unknown>>;
    if (el.type === Fragment) { parseOptions(el.props.children as ReactNode, group, out); return; }
    // A small plain component that returns <option>s (e.g. <TypeOptions />). It must be pure: no hooks.
    if (typeof el.type === 'function') {
      try { parseOptions((el.type as (p: unknown) => ReactNode)(el.props), group, out); } catch { /* a component that needs hooks cannot be read: it shows no options */ }
      return;
    }
    if (el.type === 'optgroup') { parseOptions(el.props.children as ReactNode, String(el.props.label ?? ''), out); return; }
    if (el.type === 'option') {
      const label = textOf(el.props.children as ReactNode);
      const raw = el.props.value;
      out.push({
        value: raw !== undefined && raw !== null ? String(raw) : label,
        label,
        disabled: !!el.props.disabled,
        group,
        description: typeof el.props['data-description'] === 'string' ? (el.props['data-description'] as string) : undefined,
      });
    }
  });
  return out;
}

interface Place { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

const noop = () => {};

interface CoreProps {
  id: string;
  options: DropdownOption[];
  values: string[];
  multiple?: boolean;
  onPick: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  searchable?: boolean | 'auto';
  searchPlaceholder?: string;
  emptyText?: string;
  onCreate?: (query: string) => void;
  createLabel?: string;
  className?: string;
  variant?: 'field' | 'filter';
  invalid?: boolean;
  name?: string;
  required?: boolean;
  title?: string;
  sheetTitle?: string;
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  triggerRef?: Ref<HTMLElement>;
  /** id of the label element, for triggers that are not a button (the multi-select box). */
  labelledBy?: string;
}

function DropdownCore(p: CoreProps) {
  const {
    id, options, values, multiple, onPick, onClear, placeholder, disabled, loading, clearable, searchable = 'auto',
    searchPlaceholder = 'Search…', emptyText = 'No results', onCreate, createLabel, className, variant = 'field',
    invalid, name, required, title, sheetTitle, triggerProps, triggerRef, labelledBy,
  } = p;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const [sheet, setSheet] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  const trigger = useRef<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement | null>(null);
  const searchEl = useRef<HTMLInputElement | null>(null);
  const typed = useRef({ text: '', at: 0 });

  const setTrigger = (el: HTMLElement | null) => {
    trigger.current = el;
    if (typeof triggerRef === 'function') triggerRef(el);
    else if (triggerRef && 'current' in triggerRef) (triggerRef as { current: HTMLElement | null }).current = el;
  };

  const showSearch = searchable === true || (searchable === 'auto' && options.length > SEARCH_AUTO_THRESHOLD);
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(o => `${o.label} ${o.description ?? ''} ${o.keywords ?? ''} ${o.group ?? ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const valueSet = useMemo(() => new Set(values), [values]);
  const selected = options.find(o => valueSet.has(o.value));
  const canCreate = !!onCreate;

  const measure = (): Place | null => {
    const el = trigger.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const wanted = Math.min(options.length * 38 + (showSearch ? 56 : 8) + (canCreate ? 44 : 0) + 12, 340);
    const below = window.innerHeight - r.bottom - margin;
    const above = r.top - margin;
    const up = below < Math.min(wanted, 220) && above > below;
    const width = Math.min(Math.max(r.width, 200), window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
    return up
      ? { left, width, bottom: window.innerHeight - r.top + 4, maxHeight: Math.max(140, Math.min(above - 4, 340)) }
      : { left, width, top: r.bottom + 4, maxHeight: Math.max(140, Math.min(below - 4, 340)) };
  };

  const close = (focusBack = false) => {
    setOpen(false);
    setQuery('');
    if (focusBack) trigger.current?.focus();
  };

  const openPanel = () => {
    if (disabled) return;
    const isSheet = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches;
    setSheet(isSheet);
    setQuery('');
    setPlace(isSheet ? null : measure());
    const at = options.findIndex(o => valueSet.has(o.value) && !o.disabled);
    setActive(at >= 0 ? at : options.findIndex(o => !o.disabled));
    setOpen(true);
  };

  // Outside click, reposition on scroll/resize, Escape (captured so a dialog behind us stays open).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (trigger.current?.contains(t) || panel.current?.contains(t)) return;
      setOpen(false); setQuery('');
    };
    const onMove = (e: Event) => {
      if (e.target instanceof Node && panel.current?.contains(e.target)) return;
      if (sheet) return;
      const el = trigger.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { setOpen(false); setQuery(''); return; }
      setPlace(measure());
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setOpen(false); setQuery('');
      trigger.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('keydown', onEsc, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('keydown', onEsc, true);
    };
    // measure() reads current props through closure on purpose: it is re-created each render and only used in events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sheet]);

  // Focus the search box on a computer (on a phone it would pop the keyboard before the person asked for it).
  useEffect(() => {
    if (open && showSearch && !sheet) searchEl.current?.focus();
  }, [open, showSearch, sheet]);

  // Keep the highlighted row visible.
  useEffect(() => {
    if (open && active >= 0) document.getElementById(optId(active))?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const choose = (o: DropdownOption) => {
    if (o.disabled) return;
    onPick(o.value);
    if (!multiple) close(true);
  };

  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < rows.length; i += dir) if (!rows[i].disabled) return i;
    return from;
  };

  const onKey = (e: ReactKeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => step(a, 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => step(a, -1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(step(-1, 1)); }
    else if (e.key === 'End') { e.preventDefault(); setActive(step(rows.length, -1)); }
    else if (e.key === 'Enter' || (e.key === ' ' && !showSearch)) {
      e.preventDefault();
      const o = rows[active];
      if (o) choose(o);
    } else if (e.key === 'Tab') { close(); }
    else if (!showSearch && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      typed.current.text = now - typed.current.at > 600 ? e.key.toLowerCase() : typed.current.text + e.key.toLowerCase();
      typed.current.at = now;
      const at = rows.findIndex(o => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text));
      if (at >= 0) setActive(at);
    }
  };

  const activeId = open && active >= 0 && rows[active] ? optId(active) : undefined;
  const clearVisible = clearable && !disabled && !multiple && !!selected && selected.value !== '';

  /* ─ trigger ─ */
  const triggerClass = clsx(
    variant === 'filter' ? CONTROL_FILTER : CONTROL_BASE,
    'flex items-center gap-2 text-left',
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    open && 'border-brand-orange ring-2 ring-brand-orange/10',
    invalid && 'border-error!',
    className,
  );

  const chevron = loading
    ? <Loader2 size={13} className="shrink-0 animate-spin text-slate" aria-hidden />
    : <ChevronDown size={13} className={clsx('shrink-0 text-slate transition-transform', open && 'rotate-180')} aria-hidden />;

  const clearBtn = clearVisible && (
    <span
      role="button"
      tabIndex={-1}
      aria-label="Clear selection"
      onMouseDown={e => e.preventDefault()}
      onClick={e => { e.stopPropagation(); onClear?.(); }}
      className="grid size-5 shrink-0 cursor-pointer place-items-center rounded text-slate hover:bg-cream hover:text-carbon"
    ><X size={12} aria-hidden /></span>
  );

  const common = {
    id, role: 'combobox' as const,
    'aria-haspopup': 'listbox' as const, 'aria-expanded': open, 'aria-controls': open ? listId : undefined,
    'aria-activedescendant': showSearch ? undefined : activeId,
    'aria-labelledby': labelledBy, 'aria-invalid': invalid || undefined, 'aria-required': required || undefined,
    title, onKeyDown: onKey,
  };

  const triggerEl = multiple ? (
    <div
      {...common}
      ref={setTrigger as Ref<HTMLDivElement>}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={() => (open ? close() : openPanel())}
      className={clsx(triggerClass, 'h-auto min-h-9 py-1.5')}
    >
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {values.length === 0 && <span className="text-slate">{placeholder ?? ''}</span>}
        {values.map(v => {
          const o = options.find(x => x.value === v);
          return (
            <span key={v} className="inline-flex max-w-full items-center gap-1 rounded-md bg-cream py-0.5 pl-2 pr-1 text-[12px] text-carbon">
              <span className="truncate">{o?.label ?? v}</span>
              {!disabled && (
                <button
                  type="button"
                  aria-label={`Remove ${o?.label ?? v}`}
                  onClick={e => { e.stopPropagation(); onPick(v); }}
                  className="grid size-4 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-slate hover:bg-bone hover:text-carbon"
                ><X size={11} aria-hidden /></button>
              )}
            </span>
          );
        })}
      </span>
      {chevron}
    </div>
  ) : (
    <button
      {...(triggerProps ?? {})}
      {...common}
      ref={setTrigger as Ref<HTMLButtonElement>}
      type="button"
      disabled={disabled}
      onClick={e => { triggerProps?.onClick?.(e); if (!e.defaultPrevented) (open ? close() : openPanel()); }}
      className={clsx(triggerClass, triggerProps?.className)}
    >
      {selected?.icon && <span className="shrink-0">{selected.icon}</span>}
      <span className={clsx('min-w-0 flex-1 truncate', !selected && placeholder && 'text-slate')}>{selected ? selected.label : (placeholder ?? '')}</span>
      {clearBtn}
      {chevron}
    </button>
  );

  /* ─ list ─ */
  let lastGroup: string | undefined;
  const list = (
    <div
      id={listId}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      aria-label={sheetTitle}
      className="flex flex-col gap-px overflow-y-auto overscroll-contain p-1.5"
      style={{ maxHeight: sheet ? '50vh' : undefined }}
    >
      {rows.map((o, i) => {
        const showGroup = o.group && o.group !== lastGroup;
        lastGroup = o.group ?? lastGroup;
        const isSel = valueSet.has(o.value);
        return (
          <Fragment key={`${o.value}-${i}`}>
            {showGroup && <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate">{o.group}</div>}
            <div
              id={optId(i)}
              data-value={o.value}
              role="option"
              aria-selected={isSel}
              aria-disabled={o.disabled || undefined}
              onMouseEnter={() => !o.disabled && setActive(i)}
              onMouseDown={e => e.preventDefault()}
              onClick={() => choose(o)}
              className={clsx(
                'flex min-h-[34px] pointer-coarse:min-h-11 items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] pointer-coarse:text-[15px] text-carbon',
                o.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                i === active && !o.disabled && 'bg-cream',
                isSel && 'bg-brand-pale-orange',
              )}
            >
              {multiple && (
                <span className={clsx('grid size-4 shrink-0 place-items-center rounded border', isSel ? 'border-brand-orange bg-brand-orange text-white' : 'border-bone bg-white')}>
                  {isSel && <Check size={11} aria-hidden />}
                </span>
              )}
              {o.icon && <span className="grid size-6 shrink-0 place-items-center rounded-md bg-cream text-charcoal">{o.icon}</span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate">{o.label}</span>
                {o.description && <span className="block truncate text-[11.5px] text-slate">{o.description}</span>}
              </span>
              {o.badge}
              {!multiple && isSel && <Check size={14} className="shrink-0 text-brand-orange" aria-hidden />}
            </div>
          </Fragment>
        );
      })}
      {rows.length === 0 && !loading && <div className="px-2 py-4 text-center text-[13px] text-slate">{emptyText}</div>}
      {loading && (
        <div className="flex items-center justify-center gap-2 px-2 py-3 text-[13px] text-slate" role="status">
          <Loader2 size={14} className="animate-spin" aria-hidden /> Loading…
        </div>
      )}
    </div>
  );

  const searchBox = showSearch && (
    <div className="flex items-center gap-2 border-b border-bone px-3 py-2 text-slate">
      <Search size={13} className="shrink-0" aria-hidden />
      <input
        ref={searchEl}
        value={query}
        onChange={e => { setQuery(e.target.value); setActive(0); }}
        onKeyDown={onKey}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        aria-controls={listId}
        aria-activedescendant={activeId}
        role="searchbox"
        className="min-w-0 flex-1 border-0 bg-transparent text-[13px] pointer-coarse:text-[16px] text-carbon outline-none placeholder:text-slate"
      />
      {query && (
        <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); searchEl.current?.focus(); }}
          className="grid size-5 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 text-slate hover:bg-cream"><X size={12} aria-hidden /></button>
      )}
    </div>
  );

  const createRow = canCreate && (
    <div className="border-t border-bone p-1.5">
      <button
        type="button"
        onClick={() => { onCreate?.(query.trim()); close(); }}
        className="flex min-h-[34px] pointer-coarse:min-h-11 w-full cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-left text-[13px] pointer-coarse:text-[15px] font-medium text-brand-orange hover:bg-cream"
      >
        <Plus size={14} aria-hidden />
        <span className="truncate">{query.trim() ? `Create “${query.trim()}”` : (createLabel ?? 'Create new')}</span>
      </button>
    </div>
  );

  const panelEl = open && createPortal(
    sheet ? (
      <div className="fixed inset-0" style={{ zIndex: PANEL_Z }}>
        <div className="absolute inset-0 bg-black/40" onMouseDown={() => close()} aria-hidden />
        <div
          ref={panel}
          className="absolute inset-x-0 bottom-0 flex max-h-[80vh] flex-col rounded-t-2xl bg-white"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-bone" aria-hidden />
          {sheetTitle && <div className="px-4 pb-1 pt-3 text-[14px] font-semibold text-carbon">{sheetTitle}</div>}
          {searchBox}
          {list}
          {createRow}
        </div>
      </div>
    ) : (
      <div
        ref={panel}
        className="fixed flex flex-col overflow-hidden rounded-xl border border-bone bg-white"
        style={{
          zIndex: PANEL_Z, left: place?.left ?? 0, width: place?.width, top: place?.top, bottom: place?.bottom,
          maxHeight: place?.maxHeight, boxShadow: '0 12px 30px -10px rgba(20,20,19,.25)',
        }}
      >
        {searchBox}
        {list}
        {createRow}
      </div>
    ),
    document.body,
  );

  // A real (hidden) <select> keeps native form submit + `required` validation working inside <form>s.
  const nativeEl = (name || required) ? (
    <select
      name={name}
      required={required}
      disabled={disabled}
      value={values[0] ?? ''}
      onChange={noop}
      tabIndex={-1}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
    >
      <option value="" />
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  ) : null;

  return (
    <div className="relative">
      {triggerEl}
      {nativeEl}
      {panelEl}
    </div>
  );
}

/* ───────────────────────────── Select (single value, drop-in for <select>) ───────────────────────────── */

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'multiple' | 'value' | 'defaultValue' | 'children' | 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  value?: string | number | null;
  defaultValue?: string | number;
  /** Old style: receives an event with `e.target.value`. */
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  /** New style: receives the value only. */
  onValueChange?: (value: string) => void;
  /** Either `<option>` children (old pages) or an `options` list. */
  children?: ReactNode;
  options?: DropdownOption[];
  placeholder?: string;
  loading?: boolean;
  clearable?: boolean;
  /** Default 'auto' = a search box appears when there are more than 8 options. */
  searchable?: boolean | 'auto';
  searchPlaceholder?: string;
  emptyText?: string;
  /** Adds a "Create new" row at the bottom; receives what the person typed in the search box. */
  onCreate?: (query: string) => void;
  createLabel?: string;
  variant?: 'field' | 'filter';
  /** Classes for the outer box (width etc.). `className` goes on the trigger. */
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(props, ref) {
  const {
    label, error, hint, value, defaultValue, onChange, onValueChange, children, options, placeholder, loading, clearable,
    searchable, searchPlaceholder, emptyText, onCreate, createLabel, variant = 'field', wrapperClassName, className,
    id, name, required, disabled, title, ...rest
  } = props;
  const generated = useId();
  const fieldId = id ?? generated;
  const list = options ?? parseOptions(children);

  const [inner, setInner] = useState(defaultValue !== undefined ? String(defaultValue) : '');
  const controlled = value !== undefined;
  const current = controlled ? String(value ?? '') : inner;

  const emit = (v: string) => {
    if (!controlled) setInner(v);
    const target = { value: v, name: name ?? '', id: fieldId };
    onChange?.({ target, currentTarget: target, type: 'change' } as unknown as ChangeEvent<HTMLSelectElement>);
    onValueChange?.(v);
  };

  return (
    <div className={clsx(variant === 'filter' ? 'inline-block' : 'w-full', wrapperClassName)}>
      {label && <label htmlFor={fieldId} className="mb-1.5 block text-[12px] font-medium text-charcoal">{label}</label>}
      <DropdownCore
        id={fieldId}
        options={list}
        values={current === '' && !list.some(o => o.value === '') ? [] : [current]}
        onPick={emit}
        onClear={() => emit('')}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        clearable={clearable}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        onCreate={onCreate}
        createLabel={createLabel}
        className={className}
        variant={variant}
        invalid={!!error}
        name={name}
        required={required}
        title={title}
        sheetTitle={label ?? placeholder}
        triggerProps={rest as unknown as ButtonHTMLAttributes<HTMLButtonElement>}
        triggerRef={ref as Ref<HTMLElement>}
      />
      {hint && !error && <p className="mt-1 text-[11px] text-slate">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  );
});
Select.displayName = 'Select';

/* ───────────────────────────── MultiSelect (chips) ───────────────────────────── */

export interface MultiSelectProps {
  id?: string;
  label?: string;
  error?: string;
  hint?: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  children?: ReactNode;
  options?: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean | 'auto';
  searchPlaceholder?: string;
  emptyText?: string;
  onCreate?: (query: string) => void;
  createLabel?: string;
  className?: string;
  wrapperClassName?: string;
  title?: string;
}

export function MultiSelect(props: MultiSelectProps) {
  const {
    id, label, error, hint, values, onValuesChange, children, options, placeholder, disabled, loading, searchable,
    searchPlaceholder, emptyText, onCreate, createLabel, className, wrapperClassName, title,
  } = props;
  const generated = useId();
  const fieldId = id ?? generated;
  const list = options ?? parseOptions(children);
  const toggle = (v: string) => onValuesChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);
  return (
    <div className={clsx('w-full', wrapperClassName)}>
      {label && <label id={`${fieldId}-label`} htmlFor={fieldId} className="mb-1.5 block text-[12px] font-medium text-charcoal">{label}</label>}
      <DropdownCore
        id={fieldId}
        labelledBy={label ? `${fieldId}-label` : undefined}
        options={list}
        values={values}
        multiple
        onPick={toggle}
        placeholder={placeholder}
        disabled={disabled}
        loading={loading}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        onCreate={onCreate}
        createLabel={createLabel}
        className={className}
        invalid={!!error}
        title={title}
        sheetTitle={label ?? placeholder}
      />
      {hint && !error && <p className="mt-1 text-[11px] text-slate">{hint}</p>}
      {error && <p role="alert" className="mt-1 text-[11px] text-error">{error}</p>}
    </div>
  );
}
