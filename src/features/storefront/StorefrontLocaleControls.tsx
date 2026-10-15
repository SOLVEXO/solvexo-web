import { Check, ChevronDown, Languages, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ActionMenu, CurrencySelector } from '@/components/comman/ui';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { LOCALE_NAMES } from '@/i18n';
import { useStorefrontMarketOptional } from './storefrontMarket';

const TRIGGER_CLASS = 'flex items-center gap-1.5 text-[12px] font-semibold text-charcoal px-1 py-1 bg-transparent hover:text-brand-orange transition-colors cursor-pointer shrink-0';

/** Shopify-style "country/region" selector. Hidden unless the store has markets with named countries. */
export function CountrySelector() {
  const { t } = useTranslation('storefront');
  const market = useStorefrontMarketOptional();
  if (!market || market.countries.length === 0) return null;
  const options = market.countries.map(code => ({ code, name: COUNTRY_OPTIONS.find(c => c.code === code)?.name ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const active = options.find(o => o.code === market.country);
  const { setCountry } = market;
  return (
    <ActionMenu
      ariaLabel={t('locale.countryAria', 'Country/region: {{name}}. Change country/region', { name: active?.name ?? t('locale.country', 'Country/region') })}
      trigger={<>
        <MapPin size={14} className="shrink-0" />
        <span className="hidden md:inline">{active?.code ?? t('locale.country', 'Country/region')}</span>
        <ChevronDown size={12} className="hidden md:inline" />
      </>}
      triggerClassName={TRIGGER_CLASS}
      searchable
      searchPlaceholder={t('locale.searchCountries', 'Search countries…')}
      items={options.map(o => ({
        label: (
          <span className="flex items-center gap-2 flex-1">
            <span className="flex-1">{o.name}</span>
            {o.code === market.country && <Check size={13} className="text-brand-orange shrink-0" />}
          </span>
        ),
        onClick: () => setCountry(o.code),
        searchText: `${o.code} ${o.name}`,
      }))}
    />
  );
}

/** Language switcher: only languages the store really offers; hidden with a single language. */
export function LanguageSwitcher() {
  const { t } = useTranslation('storefront');
  const market = useStorefrontMarketOptional();
  if (!market || market.languages.length < 2) return null;
  const options = market.languages.map(code => ({ code, name: LOCALE_NAMES[code] ?? code.toUpperCase() }));
  const active = options.find(o => o.code === market.language) ?? options[0];
  return (
    <ActionMenu
      ariaLabel={t('locale.languageAria', 'Language: {{name}}. Change language', { name: active.name })}
      trigger={<>
        <Languages size={14} className="shrink-0" />
        <span className="hidden md:inline">{active.code.toUpperCase()}</span>
        <ChevronDown size={12} className="hidden md:inline" />
      </>}
      triggerClassName={TRIGGER_CLASS}
      items={options.map(o => ({
        label: (
          <span className="flex items-center gap-2 flex-1">
            <span className="flex-1">{o.name}</span>
            {o.code === active.code && <Check size={13} className="text-brand-orange shrink-0" />}
          </span>
        ),
        onClick: () => { if (o.code !== market.language) market.setLanguage(o.code); },
      }))}
    />
  );
}

/** Country + language + currency, side by side (replaces the bare CurrencySelector in both themes). */
export function StorefrontLocaleControls({ allowedCurrencies }: { allowedCurrencies?: string[] | null }) {
  return (
    <>
      <CountrySelector />
      <LanguageSwitcher />
      <CurrencySelector allowed={allowedCurrencies ?? undefined} />
    </>
  );
}
