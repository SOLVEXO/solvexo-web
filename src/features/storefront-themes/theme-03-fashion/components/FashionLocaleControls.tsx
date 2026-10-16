import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe, Languages, MapPin, Search } from 'lucide-react';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useStorefrontMarketOptional } from '@/features/storefront/storefrontMarket';
import { COUNTRY_OPTIONS } from '@/utils/countries';
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
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[13px] font-medium transition-colors hover:bg-black/5"
        style={{ color: 'inherit', fontFamily: t.fonts.body }}>
        {icon}<span>{code}</span><ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .2s' }} />
      </button>
      {open && createPortal(
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- keyboard handling for the popover lives on its container
        <div ref={panelRef} tabIndex={-1} onKeyDown={onPanelKey} className="fx-pop fixed z-[10001] flex flex-col overflow-hidden outline-none"
          style={{ ...pos, maxHeight: PANEL_MAX_H, background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, border: `1px solid ${t.colors.border}`, borderRadius: 20, boxShadow: '0 18px 48px rgba(0,0,0,.16)' }}>
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

/** Country/region selector. Hidden unless the store has markets with named countries. */
export function FashionCountrySelector() {
  const { t: tr } = useTranslation('storefront');
  const market = useStorefrontMarketOptional();
  const options = useMemo<Option[]>(() => (market?.countries ?? [])
    .map(code => { const name = COUNTRY_OPTIONS.find(c => c.code === code)?.name ?? code; return { value: code, label: name, hint: code, search: `${code} ${name}` }; })
    .sort((a, b) => a.label.localeCompare(b.label)), [market?.countries]);
  if (!market || options.length === 0) return null;
  const active = options.find(o => o.value === market.country);
  return (
    <LocaleMenu icon={<MapPin size={15} />} code={active?.value ?? tr('locale.country', 'Country/region')} value={market.country} options={options} onPick={market.setCountry}
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

function currencyName(code: string): string {
  try { return new Intl.DisplayNames(undefined, { type: 'currency' }).of(code) ?? code; } catch { return code; }
}

/** Display-currency selector, limited to the store's enabled currencies. Hidden with a single currency. */
export function FashionCurrencySelector({ allowed }: { allowed?: string[] | null }) {
  const { t: tr } = useTranslation('storefront');
  const { currency, setCurrency, enabledCurrencies } = useCurrencyPreference();
  const codes = allowed ? enabledCurrencies.filter(c => allowed.includes(c)) : enabledCurrencies;
  const options = useMemo<Option[]>(() => codes.map(code => { const name = currencyName(code); return { value: code, label: `${code} — ${name}`, search: `${code} ${name}` }; }), [codes]);
  if (options.length <= 1) return null;
  const active = options.find(o => o.value === currency) ?? options[0];
  return (
    <LocaleMenu icon={<Globe size={15} />} code={active.value} value={active.value} options={options}
      onPick={code => { const next = codes.find(c => c === code); if (next) setCurrency(next); }}
      ariaLabel={tr('locale.currencyAria', 'Currency: {{code}}. Change currency', { code: active.value })}
      searchPlaceholder={tr('locale.searchCurrencies', 'Search currencies…')} />
  );
}

/** Country + language + currency, side by side. */
export function FashionLocaleControls({ allowedCurrencies }: { allowedCurrencies?: string[] | null }) {
  return (
    <>
      <FashionCountrySelector />
      <FashionLanguageSwitcher />
      <FashionCurrencySelector allowed={allowedCurrencies} />
    </>
  );
}
