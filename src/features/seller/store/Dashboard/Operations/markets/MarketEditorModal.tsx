import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button, Input, Select, Toggle } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { LANGUAGE_OPTIONS } from '@/utils/languages';
import { getCurrencyDecimals } from '@/utils/currency';
import {
  previewMarketPrice, validateMarketDomain, validateSubfolder,
  type MarketPricingType, type MarketRoundingRule,
} from '@/utils/marketPricing';
import type { SellerMarket, SellerMarketPayload } from '@/api/services/marketsSeller';
import { SearchableMultiSelect } from './SearchableMultiSelect';

const COUNTRY_MULTI = COUNTRY_OPTIONS.map(c => ({ value: c.code, label: c.name }));
const LANGUAGE_MULTI = LANGUAGE_OPTIONS.map(l => ({ value: l.code, label: l.name }));

const PRICING_TYPES: { value: MarketPricingType; label: string }[] = [
  { value: 'auto', label: 'Automatic (exchange rate)' },
  { value: 'percentage', label: 'Exchange rate plus a % adjustment' },
  { value: 'manual', label: 'Manual' },
  { value: 'fixed', label: 'Fixed' },
];
const ROUNDING_RULES: { value: MarketRoundingRule; label: string }[] = [
  { value: '0.99', label: 'End in .99' },
  { value: '0.95', label: 'End in .95' },
  { value: '1.00', label: 'Whole number' },
  { value: 'nearest', label: 'Nearest whole unit' },
];

interface Props {
  market: SellerMarket | null; // null = create
  currencies: string[];
  storeCurrency: string;
  onClose: () => void;
  /** The language the store is written in; a new market starts with it. */
  storeLanguage?: string;
  /** Rejects with the server message. */
  onSave: (payload: SellerMarketPayload) => Promise<void>;
}

const numOrEmpty = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

export function MarketEditorModal({ market, currencies, storeCurrency, storeLanguage = 'en', onClose, onSave }: Props) {
  const [name, setName] = useState(market?.name ?? '');
  const [countries, setCountries] = useState<string[]>(market?.countries ?? []);
  const [currency, setCurrency] = useState(market?.currency ?? currencies.find(c => c !== storeCurrency) ?? currencies[0] ?? 'USD');
  const [languages, setLanguages] = useState<string[]>(market?.languages ?? [storeLanguage]);
  const [domainType, setDomainType] = useState<'primary' | 'subdomain' | 'subfolder'>(market?.domainType ?? 'primary');
  const [domain, setDomain] = useState(market?.domain ?? '');
  const [subfolder, setSubfolder] = useState(market?.subfolder ?? '');
  const [isActive, setIsActive] = useState(market?.isActive ?? true);
  const [isPrimary, setIsPrimary] = useState(market?.isPrimary ?? false);
  const rule = market?.pricingRule;
  const [ruleType, setRuleType] = useState<MarketPricingType>(rule?.type ?? 'auto');
  const [pct, setPct] = useState(numOrEmpty(rule?.percentageAdjustment));
  const [fee, setFee] = useState(numOrEmpty(rule?.conversionFee));
  const [useRounding, setUseRounding] = useState(rule?.useRounding ?? false);
  const [roundingRule, setRoundingRule] = useState<MarketRoundingRule>(rule?.roundingRule ?? '0.99');
  const [exampleRate, setExampleRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const pctNum = pct.trim() === '' ? 0 : Number(pct);
  const feeNum = fee.trim() === '' ? 0 : Number(fee);
  const errors = {
    name: name.trim() ? '' : 'Enter a market name.',
    pct: ruleType === 'percentage' && (!Number.isFinite(pctNum) || pctNum < -90 || pctNum > 500) ? 'Enter a number from -90 to 500.' : '',
    fee: !Number.isFinite(feeNum) || feeNum < 0 || feeNum > 50 ? 'Enter a number from 0 to 50.' : '',
    domain: domainType === 'subdomain' ? validateMarketDomain(domain.trim()) : '',
    subfolder: domainType === 'subfolder' ? validateSubfolder(subfolder.trim()) : '',
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : '');

  // Illustrative example only: 1000 in the store's currency, at a rate the seller can type (live rates are not known here).
  const sameCurrency = currency === storeCurrency;
  const rateNum = sameCurrency ? 1 : Number(exampleRate);
  const example = useMemo(() => {
    if (!(rateNum > 0)) return null;
    return previewMarketPrice({
      amount: 1000, rate: rateNum, currency,
      rule: { type: ruleType, percentageAdjustment: pctNum, conversionFee: feeNum, useRounding, roundingRule },
    });
  }, [rateNum, currency, ruleType, pctNum, feeNum, useRounding, roundingRule]);
  const decimals = getCurrencyDecimals(currency);

  const submit = async () => {
    setTouched(true);
    if (invalid) return;
    setSaving(true);
    setError('');
    const payload: SellerMarketPayload = {
      name: name.trim(),
      countries,
      currency,
      languages,
      domainType,
      isActive,
      isPrimary,
      pricingRule: {
        type: ruleType,
        useRounding,
        roundingRule,
        ...(ruleType === 'percentage' ? { percentageAdjustment: pctNum } : {}),
        conversionFee: feeNum,
      },
    };
    if (domainType === 'subdomain') payload.domain = domain.trim();
    if (domainType === 'subfolder') payload.subfolder = subfolder.trim();
    try {
      await onSave(payload);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to save the market.');
      setSaving(false);
    }
  };

  return (
    <Modal
      title={market ? `Edit ${market.name}` : 'Add market'}
      onClose={() => { if (!saving) onClose(); }}
      width={680}
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={submit} loading={saving}>{market ? 'Save market' : 'Add market'}</Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-5">
        <Input label="Market name" value={name} maxLength={80} onChange={e => setName(e.target.value)} error={show('name')} placeholder="e.g. Europe" />

        <SearchableMultiSelect
          legend="Countries / regions"
          options={COUNTRY_MULTI}
          selected={countries}
          onChange={setCountries}
          searchPlaceholder="Search countries"
          emptyText="No countries: this market is the catch-all for everyone else"
          hint="A buyer is matched to the first active market that lists their country. Leave empty for a domestic / catch-all market."
        />

        <Select label="Currency" value={currency} onChange={e => setCurrency(e.target.value)}>
          {currencies.map(c => <option key={c} value={c}>{c}</option>)}
        </Select>

        <SearchableMultiSelect
          legend="Languages"
          options={LANGUAGE_MULTI}
          selected={languages}
          onChange={setLanguages}
          searchPlaceholder="Search languages"
          hint="Buyers on this market can switch between these. Translate your content in Online Store, Translate & adapt."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Where this market lives" value={domainType} onChange={e => setDomainType(e.target.value as typeof domainType)}>
            <option value="primary">Main store address</option>
            <option value="subdomain">Its own subdomain</option>
            <option value="subfolder">A subfolder of the store</option>
          </Select>
          {domainType === 'subdomain' && (
            <Input label="Subdomain" value={domain} onChange={e => setDomain(e.target.value.trim())} placeholder="eu.mystore.com" error={show('domain')} />
          )}
          {domainType === 'subfolder' && (
            <Input label="Subfolder" leftAddon="/" value={subfolder} onChange={e => setSubfolder(e.target.value.trim().toLowerCase())} placeholder="en-ca" error={show('subfolder')} />
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-bone px-3 py-2.5">
            <div><p className="text-[12.5px] font-medium text-charcoal">Primary market</p><p className="text-[11px] text-slate">Used when no market matches the buyer&apos;s country.</p></div>
            <Toggle checked={isPrimary} onChange={setIsPrimary} ariaLabel="Primary market" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-bone px-3 py-2.5">
            <div><p className="text-[12.5px] font-medium text-charcoal">Active</p><p className="text-[11px] text-slate">Inactive markets are ignored at checkout.</p></div>
            <Toggle checked={isActive} onChange={setIsActive} ariaLabel="Market active" />
          </div>
        </div>

        <section aria-label="Pricing" className="rounded-xl border border-bone p-4 flex flex-col gap-4">
          <div>
            <h4 className="text-[13px] font-bold text-carbon">Pricing</h4>
            <p className="text-[11.5px] text-slate mt-0.5">These rules apply only when the buyer pays in {currency}. Otherwise the plain exchange rate is used.</p>
          </div>
          <Select label="Pricing rule" value={ruleType} onChange={e => setRuleType(e.target.value as MarketPricingType)}>
            {PRICING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          {(ruleType === 'manual' || ruleType === 'fixed') && (
            <p className="text-[11.5px] text-slate">Per-product market prices are not available yet, so this behaves like Automatic for now.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {ruleType === 'percentage' && (
              <Input label="Adjustment (%)" type="number" inputMode="decimal" value={pct} onChange={e => setPct(e.target.value)} error={show('pct')} placeholder="e.g. 5" />
            )}
            <Input label="Currency conversion fee (%)" type="number" inputMode="decimal" min={0} value={fee} onChange={e => setFee(e.target.value)} error={show('fee')} placeholder="e.g. 2" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] font-medium text-charcoal">Round prices</p>
            <Toggle checked={useRounding} onChange={setUseRounding} ariaLabel="Round prices" />
          </div>
          {useRounding && (
            <div>
              <Select label="Rounding" value={roundingRule} onChange={e => setRoundingRule(e.target.value as MarketRoundingRule)}>
                {ROUNDING_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
              {decimals !== 2 && (roundingRule === '0.95' || roundingRule === '0.99') && (
                <p className="mt-1 text-[11px] text-slate">{currency} has no .95/.99 cents, so prices round to the nearest whole unit.</p>
              )}
            </div>
          )}

          <div className="rounded-lg bg-cream px-3 py-3 text-[12.5px] text-charcoal" aria-live="polite">
            <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.06em] mb-1">Example only, not a live price</p>
            {!sameCurrency && (
              <div className="mb-2 max-w-[260px]">
                <Input label={`Example rate: 1 ${storeCurrency} = ? ${currency}`} type="number" inputMode="decimal" min={0} value={exampleRate} onChange={e => setExampleRate(e.target.value)} placeholder="e.g. 0.0036" />
              </div>
            )}
            {example === null
              ? <p className="text-slate">Enter an example rate to see how a price would change.</p>
              : <p>A product priced <b>1000 {storeCurrency}</b> would show as about <b>{example.toFixed(decimals)} {currency}</b> to buyers paying in {currency}.</p>}
          </div>
        </section>

        {error && <p role="alert" className="flex items-start gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}</p>}
      </div>
    </Modal>
  );
}
