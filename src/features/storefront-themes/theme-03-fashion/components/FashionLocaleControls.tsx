import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Languages, MapPin, Search } from 'lucide-react';
import { resolveMarket } from '@/api/services/markets';
import { useStorefrontMarketOptional } from '@/features/storefront/storefrontMarket';
import { localizedCountryOptions } from '../../core/countryOptions';
import { activeLocale } from '../../core/locale';
import { LOCALE_NAMES } from '@/i18n';
import { fashionTheme as t } from '../theme.config';

interface Option { value: string; label: string; hint?: string; search: string }

const SEARCH_AFTER = 8;
const PANEL_MAX_H = 320;

/** Pill trigger + portal popover listbox. Keyboard: Enter/Space/Arrow opens, Arrows move, Enter picks, Esc closes. */
function LocaleMenu({ icon, code, ariaLabel, options, value, onPick, searchPlaceholder }: {
  icon: ReactNode; code: string; ariaLabel: string; options: Option[]; value: string | null; onPick: (value: string) => void; searchPlaceholder: string;
}) {
  const { t: tr } = useTranslation('storefront');
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<CSSProperties>({});
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerId = useId();
  const listId = useId();
  const searchable = options.length > SEARCH_AFTER;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.search.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = (restore = true) => { setOpen(false); setQuery(''); if (restore) btnRef.current?.focus(); };
  const show = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom;
    const up = below < PANEL_MAX_H + 16 && rect.top > below;
    const width = 260;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    setPos(up ? { bottom: window.innerHeight - rect.top + 8, left, width } : { top: rect.bottom + 8, left, width });
    setCursor(Math.max(0, options.findIndex(o => o.value === value)));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    if (searchable) searchRef.current?.focus(); else panelRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      const n = e.target as Node;
      if (!btnRef.current?.contains(n) && !panelRef.current?.contains(n)) { setOpen(false); setQuery(''); }
    };
    const onScroll = (e: Event) => { if (!panelRef.current?.contains(e.target as Node)) { setOpen(false); setQuery(''); } };
    const onResize = () => { setOpen(false); setQuery(''); };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, searchable]);

  const pick = (o: Option) => { onPick(o.value); close(); };
  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(visible.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(0, c - 1)); }
    else if (e.key === 'Enter' && visible[cursor]) { e.preventDefault(); pick(visible[cursor]); }
    else if (e.key === 'Tab') close(false);
  };
  const safeCursor = Math.min(cursor, Math.max(0, visible.length - 1));

  return (
    <>
      <button ref={btnRef} id={triggerId} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-label={ariaLabel}
        onClick={() => (open ? close() : show())}
        onKeyDown={e => { if (!open && e.key === 'ArrowDown') { e.preventDefault(); show(); } }}
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[13px] font-medium transition-colors hover:bg-[color-mix(in_srgb,currentColor_8%,transparent)]"
        style={{ color: 'inherit', fontFamily: t.fonts.body }}>
        {icon}<span className="max-w-[200px] truncate">{code}</span><ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
      </button>
      {open && createPortal(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keyboard handling for the popover lives on its container
        <div ref={panelRef} tabIndex={-1} onKeyDown={onPanelKey} className="fx-pop fixed z-[10001] flex flex-col overflow-hidden outline-none"
          style={{ ...pos, maxHeight: PANEL_MAX_H, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, border: `1px solid ${t.colors.border}`, borderRadius: 20 }}>
          {searchable && (
            <div className="shrink-0 p-2.5" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
              <label className="relative block">
                <span className="sr-only">{searchPlaceholder}</span>
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: t.colors.inkMuted }} />
                <input ref={searchRef} type="text" value={query} onChange={e => { setQuery(e.target.value); setCursor(0); }} placeholder={searchPlaceholder}
                  role="combobox" aria-expanded="true" aria-controls={listId} aria-autocomplete="list"
                  className="w-full rounded-full border-0 py-2 pl-9 pr-3 text-[13px] outline-none" style={{ background: t.colors.bgAlt, color: t.colors.ink }} />
              </label>
            </div>
          )}
          <ul id={listId} role="listbox" aria-labelledby={triggerId} className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-1.5">
            {visible.length === 0 && <li className="px-3.5 py-3 text-[13px]" style={{ color: t.colors.inkMuted }}>{tr('locale.noMatches', 'No matches')}</li>}
            {visible.map((o, i) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- options are driven by the arrow/enter keys on the panel
              <li key={o.value} role="option" aria-selected={o.value === value}
                ref={el => { if (el && i === safeCursor) el.scrollIntoView({ block: 'nearest' }); }}
                onMouseEnter={() => setCursor(i)} onClick={() => pick(o)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px]"
                style={{ background: i === safeCursor ? t.colors.bgAlt : 'transparent', fontWeight: o.value === value ? 600 : 400 }}>
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && <span className="shrink-0 text-xs" style={{ color: t.colors.inkMuted }}>{o.hint}</span>}
                {o.value === value && <Check size={14} className="shrink-0" />}
              </li>
            ))}
          </ul>
        </div>,
        document.body,
      )}
    </>
  );
}

/** "PKR Rs" / "USD $" — currency code beside its symbol, like Shopify's "United States (USD $)". */
function currencyLabel(code: string): string {
  try {
    const sym = new Intl.NumberFormat(activeLocale(), { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(p => p.type === 'currency')?.value;
    return sym && sym !== code ? `${code} ${sym}` : code;
  } catch { return code; }
}

/** Country/region selector. Hidden unless the store has markets with named countries. */
export function FashionCountrySelector() {
  const { t: tr } = useTranslation('storefront');
  const market = useStorefrontMarketOptional();
  const options = useMemo<Option[]>(() => (market?.countries ?? [])
    .map(code => {
      const name = localizedCountryOptions().find(c => c.code === code)?.label ?? code;
      const currency = resolveMarket(market?.markets ?? [], code)?.currency;
      return { value: code, label: currency ? `${name} (${currencyLabel(currency)})` : name, search: `${code} ${name} ${currency ?? ''}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, activeLocale())), [market?.countries, market?.markets]);
  if (!market || options.length === 0) return null;
  // No saved or detected country yet: show the resolved (primary) market's country, like Shopify, not a bare placeholder.
  const active = options.find(o => o.value === market.country)
    ?? options.find(o => o.value === market.market?.countries?.[0]?.toUpperCase());
  return (
    <LocaleMenu icon={<MapPin size={15} />} code={active?.label ?? tr('locale.country', 'Country/region')} value={active?.value ?? market.country} options={options} onPick={market.setCountry}
      ariaLabel={tr('locale.countryAria', 'Country/region: {{name}}. Change country/region', { name: active?.label ?? tr('locale.country', 'Country/region') })}
      searchPlaceholder={tr('locale.searchCountries', 'Search countries…')} />
  );
}

/** Language switcher: only languages the store really offers; hidden with a single language. */
export function FashionLanguageSwitcher() {
  const { t: tr } = useTranslation('storefront');
  const market = useStorefrontMarketOptional();
  if (!market || market.languages.length < 2) return null;
  const options: Option[] = market.languages.map(code => { const name = LOCALE_NAMES[code] ?? code.toUpperCase(); return { value: code, label: name, hint: code.toUpperCase(), search: `${code} ${name}` }; });
  const active = options.find(o => o.value === market.language) ?? options[0];
  return (
    <LocaleMenu icon={<Languages size={15} />} code={active.value.toUpperCase()} value={active.value} options={options}
      onPick={code => { if (code !== market.language) market.setLanguage(code); }}
      ariaLabel={tr('locale.languageAria', 'Language: {{name}}. Change language', { name: active.label })}
      searchPlaceholder={tr('locale.searchLanguages', 'Search languages…')} />
  );
}

/** Country + language side by side. Currency has no selector of its own (Shopify): it follows the country's market. */
export function FashionLocaleControls() {
  return (
    <>
      <FashionCountrySelector />
      <FashionLanguageSwitcher />
    </>
  );
}
