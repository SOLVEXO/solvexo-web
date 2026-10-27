import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Loader2, CreditCard, Globe, Lock, Clock, EyeOff, ShieldCheck, MapPin, Languages, Landmark, Boxes, Info } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, apiSetWhiteLabel, apiUpdateStorePrivacy, apiCompletePrivacyRequest, apiGetEnabledCurrencies, type ProductType, type SupportedCurrency, type StorePrivacyMode, type StorePrivacyRequest, type TaxRegion, type TaxOverride, type CurrencyDisplay } from '@/api/services/store';
import { currencySymbol, getCurrencyDecimals } from '@/utils/currency';
import { LANGUAGE_OPTIONS } from '@/utils/languages';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { isStaffSession } from '@/hooks/auth/useCan';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { CustomerAccountsSection } from './CustomerAccountsSection';
import { DomainsSection } from './DomainsSection';
import { TaxOverridesEditor } from './TaxOverridesEditor';
import { StoreTaxIdentity } from './StoreTaxIdentity';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';
import { SettingsCard, SettingsRow, SettingsSaveBar, SettingsChoice, SettingsGroupLabel } from '@/components/comman/settings';

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  physical_products:    'Physical Products',
  digital_downloads:    'Digital Downloads',
  educational_resources:'Educational Resources',
  services_bookings:    'Services / Bookings',
  in_person_pos:        'In-Person / POS',
};
const PRODUCT_TYPE_HINTS: Record<ProductType, string> = {
  physical_products:    'Stocked items shipped to the buyer — variants, weight, shipping rates.',
  digital_downloads:    'Files delivered automatically after payment, no shipping step.',
  educational_resources:'Courses and lessons with per-enrolment access.',
  services_bookings:    'Time-slotted appointments the buyer reserves at checkout.',
  in_person_pos:        'Sold face to face — inventory counts down without an online cart.',
};
const ALL_PRODUCT_TYPES: ProductType[] = [
  'physical_products', 'digital_downloads', 'educational_resources',
  'services_bookings', 'in_person_pos',
];

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-[12px] font-semibold text-charcoal block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Sample price for the Price format picker, e.g. "Rs 1,235" / "PKR 1,235" / "Rs 1,235 PKR". */
function moneyPreview(mode: CurrencyDisplay, currency?: string | null): string {
  const code = (currency || 'USD').toUpperCase();
  const d = getCurrencyDecimals(code);
  const body = (1234.5).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  const sym = currencySymbol(code);
  const symText = (/^[A-Za-z]/.test(sym) ? sym + ' ' : sym) + body;
  return mode === 'code' ? code + ' ' + body : mode === 'symbol_code' ? symText + ' ' + code : symText;
}

const inputCls = "w-full px-3 py-[9px] rounded-[10px] text-[13px] border border-bone bg-white text-charcoal outline-none box-border transition-colors placeholder:text-slate/70 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15";

// Shared save bar — every settings tab below uses the same dirty/saving/
// result pattern, so this is one implementation instead of 4 hand-rolled
// copies. It sticks to the bottom of the viewport (the tabs' forms run long —
// a button at the top is off-screen by the time the form is filled in).
function SaveBar({ isDirty, saving, onSave, saveMsg }: {
  isDirty: boolean; saving: boolean; onSave: () => void;
  saveMsg: { ok: boolean; text: string } | null;
}) {
  return <SettingsSaveBar variant="floating" isDirty={isDirty} saving={saving} onSave={onSave} saveMsg={saveMsg} />;
}

// ── Store Profile — Basic Information + general store-identity behavior ────
// ("Product Types", "Payment Methods", "Custom Domain & White Label", and
// "Store Visibility" each moved out to their own Settings Hub tab — see
// `SettingsHub.tsx`'s TABS — since each is its own real configuration
// concern, not a sub-section of "General.")
/** IANA zones the browser knows (every modern browser); a short fallback list otherwise. */
const TIME_ZONES: string[] = (() => {
  try {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone');
    if (list && list.length) return list;
  } catch { /* older browser */ }
  return ['UTC', 'Asia/Karachi', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Riyadh', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Australia/Sydney'];
})();

export function StoreProfileTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [tagline,      setTagline]      = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logo,         setLogo]         = useState('');
  const [faviconUrl,   setFaviconUrl]   = useState('');
  const [reviewModerationEnabled, setReviewModerationEnabled] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [taxRate, setTaxRate] = useState(0);
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [taxShipping, setTaxShipping] = useState(false);
  const [taxId, setTaxId] = useState('');
  const [taxRegistered, setTaxRegistered] = useState(true);
  const [taxPricesIncludeTax, setTaxPricesIncludeTax] = useState(false);
  const [taxOverrides, setTaxOverrides] = useState<TaxOverride[]>([]);
  const [showDutiesNotice, setShowDutiesNotice] = useState(true);
  const [timezone, setTimezone] = useState('');
  const [country, setCountry] = useState('');
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>('symbol');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [saving, setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setTagline(store.tagline ?? '');
    setContactEmail(store.contactEmail ?? '');
    setContactPhone(store.contactPhone ?? '');
    setLogo(store.logo ?? '');
    setFaviconUrl(store.faviconUrl ?? '');
    setReviewModerationEnabled(!!store.reviewModerationEnabled);
    setLowStockThreshold(store.lowStockThreshold ?? 10);
    setTaxRate(store.taxRate ?? 0);
    setTaxRegions(store.taxRegions ?? []);
    setTaxShipping(!!store.taxShipping);
    setTaxId(store.taxId ?? '');
    setTaxRegistered(store.taxRegistered !== false);
    setTaxPricesIncludeTax(!!store.taxPricesIncludeTax);
    setTaxOverrides(store.taxOverrides ?? []);
    setShowDutiesNotice(store.showDutiesNotice !== false);
    setTimezone(store.timezone ?? '');
    setCountry(store.country ?? '');
    setCurrencyDisplay(store.currencyDisplay ?? 'symbol');
    setDefaultLanguage(store.defaultLanguage ?? 'en');
  }, [store]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, tagline, contactEmail, contactPhone, timezone: timezone || null, ...(country && country !== (store?.country ?? '') ? { country } : {}), currencyDisplay, defaultLanguage, logo, faviconUrl: faviconUrl || null, reviewModerationEnabled, lowStockThreshold, taxRate, taxShipping, taxId, taxRegistered, taxPricesIncludeTax, taxOverrides: taxOverrides.filter(o => o.collectionIds.length + o.categoryIds.length > 0), showDutiesNotice, taxRegions: taxRegions.filter(r => r.country.trim()) });
      refetch();
      setSaveMsg({ ok: true, text: 'Store profile updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update store profile.' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    !!store &&
    (name !== store.name ||
      description !== (store.description ?? '') ||
      tagline !== (store.tagline ?? '') ||
      contactEmail !== (store.contactEmail ?? '') ||
      contactPhone !== (store.contactPhone ?? '') ||
      timezone !== (store.timezone ?? '') ||
      country !== (store.country ?? '') ||
      currencyDisplay !== (store.currencyDisplay ?? 'symbol') ||
      defaultLanguage !== (store.defaultLanguage ?? 'en') ||
      logo !== (store.logo ?? '') ||
      faviconUrl !== (store.faviconUrl ?? '') ||
      reviewModerationEnabled !== !!store.reviewModerationEnabled ||
      lowStockThreshold !== (store.lowStockThreshold ?? 10) ||
      taxRate !== (store.taxRate ?? 0) ||
      taxShipping !== !!store.taxShipping ||
      taxId !== (store.taxId ?? '') ||
      taxRegistered !== (store.taxRegistered !== false) ||
      taxPricesIncludeTax !== !!store.taxPricesIncludeTax ||
      JSON.stringify(taxOverrides) !== JSON.stringify(store.taxOverrides ?? []) ||
      showDutiesNotice !== (store.showDutiesNotice !== false) ||
      JSON.stringify(taxRegions) !== JSON.stringify(store.taxRegions ?? []));

  if (loading) return null;

  return (
    <div className="px-4 lg:px-7 py-6">
      {/* Full-width column of focused cards — the page already gets its
          readability limit from the tab panel beside it. */}
      <div className="flex flex-col gap-5">

        <SettingsCard
          title="Store identity"
          icon={<Store size={14} />}
          description="What customers see first — your mark, your name, and the line beside it."
        >
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-xl border border-bone bg-cream/50 p-4">
              <p className="text-[13px] font-semibold text-charcoal">Store logo</p>
              <p className="mb-3 mt-0.5 text-[11.5px] text-slate">Header, emails &amp; invoices</p>
              <ImageUpload value={logo ? [logo] : []} onChange={urls => setLogo(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
              <p className="mt-3 text-[11px] leading-snug text-slate">PNG, JPG or WebP. A transparent background looks best.</p>
            </div>

            <div className="min-w-0 rounded-xl border border-bone bg-cream/50 p-4">
              <p className="text-[13px] font-semibold text-charcoal">Favicon</p>
              <p className="mb-3 mt-0.5 text-[11.5px] text-slate">Browser tab icon</p>
              <ImageUpload value={faviconUrl ? [faviconUrl] : []} onChange={urls => setFaviconUrl(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
              <p className="mt-3 text-[11px] leading-snug text-slate">Square image, at least 32 × 32 px. Without one, your store's tab shows no icon.</p>
            </div>
          </div>

          <Field label="Store Name *">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your store name" className={inputCls} />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your store…" rows={4} className={`${inputCls} resize-y min-h-[90px]`} />
          </Field>

          <Field label="Tagline">
            <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="e.g. Handmade with love since 2020" maxLength={100} className={inputCls} />
            <p className="text-[11px] text-slate mt-1">A short line shown next to your store name on your storefront.</p>
          </Field>
        </SettingsCard>

        <SettingsCard
          title="Contact &amp; location"
          icon={<MapPin size={14} />}
          description="Where buyers reach you, and the country that decides which payment providers you can connect."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact Email">
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="support@yourstore.com" className={inputCls} />
            </Field>
            <Field label="Contact Phone">
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 555 123 4567" className={inputCls} />
            </Field>
          </div>

          <Field label="Store country">
            <select value={country} onChange={e => setCountry(e.target.value)} disabled={isStaffSession()} className={inputCls} aria-label="Store country">
              <option value="">Select your country</option>
              {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
            <p className="text-[11px] text-slate mt-1">Decides which payment providers you can connect (for example Stripe or local gateways). Disconnect your payment providers in Integrations before changing it. Only the store owner can change it.</p>
          </Field>

          <Field label="Time zone">
            <select value={timezone} onChange={e => setTimezone(e.target.value)} className={inputCls} aria-label="Store time zone">
              <option value="">Automatic (from your store country)</option>
              {TIME_ZONES.map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
            </select>
            <p className="text-[11px] text-slate mt-1">Analytics days, "Today" and report dates use this time zone.</p>
          </Field>
        </SettingsCard>

        <SettingsCard
          title="Language &amp; prices"
          icon={<Languages size={14} />}
          description="The language you write your catalog in, and how a price reads for your customers."
        >
          <Field label="Store language">
            <select value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value)} className={inputCls} aria-label="Store language">
              {LANGUAGE_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
            <p className="text-[11px] text-slate mt-1">The language you write your products, pages and menus in. Customers see it with no language folder in the web address; other languages come from Translate &amp; adapt. Changing it does not translate your content.</p>
          </Field>

          <Field label="Price format on your storefront">
            <select value={currencyDisplay} onChange={e => setCurrencyDisplay(e.target.value as CurrencyDisplay)} className={inputCls} aria-label="Price format">
              <option value="symbol">Symbol only — {moneyPreview('symbol', store?.baseCurrency)}</option>
              <option value="code">Currency code only — {moneyPreview('code', store?.baseCurrency)}</option>
              <option value="symbol_code">Symbol and code — {moneyPreview('symbol_code', store?.baseCurrency)}</option>
            </select>
            <p className="text-[11px] text-slate mt-1">How prices read for your customers, in every currency they shop in.</p>
          </Field>
        </SettingsCard>

        {/* ── Tax ── */}
        <SettingsCard
          title="Tax &amp; duties"
          icon={<Landmark size={14} />}
          description="What you add on top of a price, and where. Skip it all if you are not registered."
        >
          <StoreTaxIdentity
            country={country}
            taxId={taxId}
            taxRegistered={taxRegistered}
            regionCountries={taxRegions.map(r => r.country.trim().toUpperCase())}
            onTaxId={setTaxId}
            onTaxRegistered={setTaxRegistered}
            onAddRegion={(cc, rate) => setTaxRegions(rs => [...rs, { country: cc, state: null, rate }])}
          />

          <Field label="Tax Rate (%)">
            <input type="number" min={0} max={100} step={0.01} value={taxRate} onChange={e => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className={inputCls} />
            <p className="text-[11px] text-slate mt-1">The default rate, used only when no tax region below matches the buyer's address (and no TaxJar connection is active — see Integrations).</p>
          </Field>

          <div className="mt-1 divide-y divide-fog border-t border-fog">
            <SettingsRow
              label="Prices include tax"
              description='Checkout then shows "Including $X in taxes" and extracts the tax from the price instead of adding it. You can change this per country in Tax Regions below. TaxJar quotes are always added on top.'
            >
              <Toggle checked={taxPricesIncludeTax} onChange={setTaxPricesIncludeTax} ariaLabel="Prices include tax" />
            </SettingsRow>

            <SettingsRow
              label="Charge tax on shipping rates"
              description="The same rate that applies to the items is charged on shipping. Off = shipping is never taxed."
            >
              <Toggle checked={taxShipping} onChange={setTaxShipping} ariaLabel="Charge tax on shipping rates" />
            </SettingsRow>

            <SettingsRow
              label="International duties notice"
              description="Shown at checkout under the shipping method when the buyer's country differs from your store country. Solvexo does not calculate duties — the carrier collects them on delivery."
            >
              <Toggle checked={showDutiesNotice} onChange={setShowDutiesNotice} ariaLabel="International duties notice" />
            </SettingsRow>
          </div>

          {/* Tax Regions — Shopify-"Tax regions"-style manual per-destination
             rates, checked before the flat Tax Rate above at checkout. */}
          <div className="mb-4 mt-4 border-t border-fog pt-4">
            <p className="text-[13px] font-semibold text-charcoal mb-1">Tax regions</p>
            <p className="text-[11.5px] text-slate mb-3">Charge a different rate for specific countries or states, instead of one flat rate for every buyer. Leave State blank to cover the whole country.</p>
            {taxRegions.map((r, i) => (
              <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  value={r.country}
                  onChange={e => setTaxRegions(rs => rs.map((x, j) => j === i ? { ...x, country: e.target.value.toUpperCase() } : x))}
                  placeholder="US"
                  maxLength={2}
                  className={`${inputCls} w-16 text-center`}
                  title="2-letter country code (e.g. US, PK, GB)"
                />
                <input
                  value={r.state ?? ''}
                  onChange={e => setTaxRegions(rs => rs.map((x, j) => j === i ? { ...x, state: e.target.value || null } : x))}
                  placeholder="State (optional)"
                  className={`${inputCls} flex-1`}
                />
                <input
                  type="number" min={0} max={100} step={0.01}
                  value={r.rate}
                  onChange={e => setTaxRegions(rs => rs.map((x, j) => j === i ? { ...x, rate: Math.min(100, Math.max(0, Number(e.target.value) || 0)) } : x))}
                  className={`${inputCls} w-20`}
                />
                <select
                  value={r.pricesIncludeTax == null ? '' : r.pricesIncludeTax ? 'in' : 'ex'}
                  onChange={e => setTaxRegions(rs => rs.map((x, j) => j === i ? { ...x, pricesIncludeTax: e.target.value === '' ? null : e.target.value === 'in' } : x))}
                  className={`${inputCls} w-28`}
                  aria-label="Prices include tax in this region"
                >
                  <option value="">Store default</option>
                  <option value="in">Tax included</option>
                  <option value="ex">Tax added</option>
                </select>
                <button
                  type="button"
                  onClick={() => setTaxRegions(rs => rs.filter((_, j) => j !== i))}
                  className="size-7 shrink-0 rounded-lg border-0 bg-transparent text-[16px] leading-none text-slate cursor-pointer hover:bg-error-bg hover:text-error"
                  aria-label="Remove tax region"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTaxRegions(rs => [...rs, { country: '', state: null, rate: 0 }])}
              className="text-[12px] font-medium text-brand-orange hover:underline"
            >
              + Add tax region
            </button>
            <div className="mt-3">
              <BulkImportButton
                entityLabel="tax regions"
                basePath={`/api/store/${storeId}/tax-regions`}
                onImported={refetch}
                notes={['Saved immediately (no need to press Save). An existing country + state gets its rate updated.']}
              />
            </div>
          </div>

          <TaxOverridesEditor storeId={storeId} value={taxOverrides} onChange={setTaxOverrides} />
        </SettingsCard>

        {/* ── Inventory & reviews ── */}
        <SettingsCard
          title="Inventory &amp; reviews"
          icon={<Boxes size={14} />}
          description="When a product counts as running low, and whether a review publishes on its own."
        >
          <Field label="Low stock threshold">
            <input type="number" min={1} value={lowStockThreshold} onChange={e => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))} className={`${inputCls} max-w-[140px]`} />
            <p className="text-[11px] text-slate mt-1">Products at or below this stock count are flagged "Low Stock" in your Inventory page and dashboard alerts.</p>
          </Field>

          <SettingsRow
            label="Require review approval"
            description="New reviews stay hidden until you approve them. Off by default — reviews publish instantly."
            className="border-t border-fog"
          >
            <Toggle checked={reviewModerationEnabled} onChange={setReviewModerationEnabled} ariaLabel="Require review approval" />
          </SettingsRow>
        </SettingsCard>

        {/* ── Read-only identity (was a pile of disabled inputs) ── */}
        <SettingsCard
          title="Plan &amp; status"
          icon={<Info size={14} />}
          divided
          description="Set by your subscription and store review — change them from Billing."
        >
          <div className="-my-1 divide-y divide-fog">
            {([
              { label: 'Store URL',   value: store?.slug ? `/${store.slug}` : '—', hint: 'The URL slug cannot be changed.' },
              { label: 'Plan',        value: store?.plan ?? '—',                   hint: 'Upgrade or switch it under Billing.' },
              { label: 'Status',      value: store?.status ?? '—' },
              { label: 'Seller type', value: store?.sellerType ?? '—' },
              { label: 'AI credits',  value: String(store?.aiCredits ?? 0) },
            ] as { label: string; value: string; hint?: string }[]).map(r => (
              <SettingsRow key={r.label} label={r.label} description={r.hint}>
                <span className="text-[12.5px] font-semibold text-charcoal">{r.value}</span>
              </SettingsRow>
            ))}
          </div>
        </SettingsCard>
      </div>

      <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />
    </div>
  );
}

// ── Product Types ────────────────────────────────────────────────────────────
export function ProductTypesTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { if (store) setProductTypes(store.productTypes ?? []); }, [store]);

  const toggleType = (t: ProductType) =>
    setProductTypes(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, productTypes });
      refetch();
      setSaveMsg({ ok: true, text: 'Product types updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update product types.' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty = !!store && JSON.stringify(productTypes.slice().sort()) !== JSON.stringify((store.productTypes ?? []).slice().sort());

  if (loading) return null;

  return (
    <div className="px-4 lg:px-7 py-6">
      <div className="flex flex-col gap-5">
        <SettingsCard
          title="Product types"
          icon={<Boxes size={14} />}
          description="Which kinds of listings this store can sell. Each type brings its own checkout, fulfilment and inventory fields."
        >
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ALL_PRODUCT_TYPES.map(t => {
              const active = productTypes.includes(t);
              return (
                <SettingsChoice
                  key={t}
                  type="checkbox"
                  checked={active}
                  label={PRODUCT_TYPE_LABELS[t]}
                  description={PRODUCT_TYPE_HINTS[t]}
                  onChange={() => toggleType(t)}
                />
              );
            })}
          </div>
          {productTypes.length === 0 && (
            <p role="alert" className="mt-3 text-[11.5px] text-error">Select at least one type — sellers cannot publish listings until you do.</p>
          )}
        </SettingsCard>

        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />
      </div>
    </div>
  );
}

// ── Payment Methods (incl. "Markets" — which currencies checkout accepts) ──
export function PaymentMethodsTab() {
  const { store, storeId, loading, refetch, entitlements } = useStoreWorkspace();
  // Plan "markets" limit — how many checkout currencies this store may
  // accept, its own currency included (-1 = unlimited). Same rule the
  // backend enforces on save (StoreService.updateStore).
  const maxMarkets = typeof entitlements?.maxMarkets === 'number' ? entitlements.maxMarkets : -1;
  const [paymentCaptureMethod, setPaymentCaptureMethod] = useState<'automatic' | 'manual'>('automatic');
  // `null` is a real, distinct state here — "no restriction, every platform
  // currency is accepted" (the schema default) — never collapsed into an
  // array like `[baseCurrency]` just because nothing is set yet.
  const [enabledCurrencies, setEnabledCurrencies] = useState<SupportedCurrency[] | null>(null);
  const [customerAccounts, setCustomerAccounts] = useState<'optional' | 'required'>('optional');
  const [platformCurrencies, setPlatformCurrencies] = useState<string[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiGetEnabledCurrencies().then(res => setPlatformCurrencies(res.data.map(c => c.code))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!store) return;
    setPaymentCaptureMethod(store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic');
    setEnabledCurrencies(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies : null);
    setCustomerAccounts(store.customerAccounts === 'required' ? 'required' : 'optional');
  }, [store]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, paymentCaptureMethod, enabledCurrencies, customerAccounts });
      refetch();
      setSaveMsg({ ok: true, text: 'Payment methods updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update payment methods.' });
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    !!store &&
    (paymentCaptureMethod !== (store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic') ||
      customerAccounts !== (store.customerAccounts === 'required' ? 'required' : 'optional') ||
      JSON.stringify(enabledCurrencies ? enabledCurrencies.slice().sort() : null) !==
        JSON.stringify(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies.slice().sort() : null));

  if (loading) return null;

  return (
    <div className="px-4 lg:px-7 py-6">
      <div className="flex flex-col gap-5">
        {/* Cash on Delivery, bank transfer and custom providers live with the
           other manual payment methods on the Integrations tab (Shopify layout). */}
        <SettingsCard
          title="Payment capture"
          icon={<CreditCard size={14} />}
          description="Providers, Cash on Delivery, bank transfer and custom methods are managed on the Integrations tab."
        >
          <SettingsGroupLabel className="mb-2.5">When an online card payment is charged</SettingsGroupLabel>
          <div role="radiogroup" aria-label="When to capture payment" className="grid gap-2.5 sm:grid-cols-2">
            <SettingsChoice
              name="payment-capture-method"
              checked={paymentCaptureMethod === 'automatic'}
              label="Automatically at checkout"
              description="Charge the buyer the instant checkout succeeds."
              onChange={() => setPaymentCaptureMethod('automatic')}
            />
            <SettingsChoice
              name="payment-capture-method"
              checked={paymentCaptureMethod === 'manual'}
              label="Manually"
              description="Authorize the card, review the order, then capture it yourself before it ships."
              onChange={() => setPaymentCaptureMethod('manual')}
            />
          </div>
        </SettingsCard>

        {/* Markets — which currencies buyers may check out in on this store */}
        <SettingsCard
          title="Markets"
          icon={<Globe size={14} />}
          description="Which currencies buyers can pay in at checkout on your store."
        >
          {maxMarkets !== -1 && (
            <p className="mb-3 text-[11.5px] text-slate">
              Your plan allows up to <span className="font-semibold text-charcoal">{maxMarkets}</span> {maxMarkets === 1 ? 'currency' : 'currencies'}, your store currency included. Upgrade your plan for more.
            </p>
          )}

          <div className="border-y border-fog -mx-5 px-5">
            <SettingsRow
              label="Restrict to specific currencies"
              description={enabledCurrencies !== null
                ? 'On — buyers can only pay in the currencies switched on below.'
                : maxMarkets === -1
                  ? 'Off — buyers can pay in any currency this platform supports.'
                  : `Off — buyers can pay in your store currency plus the first ${Math.max(0, maxMarkets - 1)} other supported ${maxMarkets - 1 === 1 ? 'currency' : 'currencies'}.`}
            >
              <Toggle
                checked={enabledCurrencies !== null}
                ariaLabel="Restrict which currencies buyers can pay in"
                onChange={v => {
                  if (!v) { setEnabledCurrencies(null); return; }
                  // With a plan limit, seed only what fits — store currency first.
                  const base = store?.baseCurrency;
                  const ordered = base && platformCurrencies.includes(base)
                    ? [base, ...platformCurrencies.filter(c => c !== base)]
                    : [...platformCurrencies];
                  setEnabledCurrencies(maxMarkets === -1 ? ordered : ordered.slice(0, Math.max(1, maxMarkets)));
                }}
              />
            </SettingsRow>
          </div>

          {enabledCurrencies !== null && platformCurrencies.length > 0 && (
            <div className="mt-1">
              <SettingsGroupLabel className="mb-1">Accepted currencies · {enabledCurrencies.length}{maxMarkets !== -1 ? ` of ${maxMarkets}` : ''}</SettingsGroupLabel>
              <div className="divide-y divide-fog">
                {platformCurrencies.map(c => {
                  const isBase = c === store?.baseCurrency;
                  const checked = enabledCurrencies.includes(c);
                  const atLimit = maxMarkets !== -1 && enabledCurrencies.length >= maxMarkets;
                  return (
                    <SettingsRow
                      key={c}
                      label={c}
                      description={isBase ? 'Your store currency — always accepted.' : undefined}
                      className="py-2.5"
                    >
                      <Toggle
                        checked={checked}
                        disabled={isBase || (!checked && atLimit)}
                        ariaLabel={`Accept ${c} at checkout`}
                        onChange={v => {
                          if (isBase && !v) return; // can never disable your own store currency
                          setEnabledCurrencies(prev => (v ? [...(prev ?? []), c] : (prev ?? []).filter(x => x !== c)));
                        }}
                      />
                    </SettingsRow>
                  );
                })}
              </div>
            </div>
          )}
        </SettingsCard>

        {storeId && (
          <CustomerAccountsSection storeId={storeId} mode={customerAccounts} onMode={setCustomerAccounts} />
        )}

        {storeId && (
          <RemoveBrandingCard storeId={storeId} store={store ? { whiteLabelEnabled: store.whiteLabelEnabled } : null} refetch={refetch} />
        )}

        <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />
      </div>
    </div>
  );
}

// ── Remove Solvexo branding (shown at the bottom of Store Profile; custom domains live in `DomainsSection.tsx`) ──
// (Stripe Connect's "Payment Gateway" card used to live here — moved to the
// Integrations page, where a seller now manages every payment gateway,
// Stripe included, in one place. See StripeConnectSection in
// `features/seller/store/Dashboard/Operations/integrations/Integrations.tsx`.)

function RemoveBrandingCard({ storeId, store, refetch }: {
  storeId: string;
  store: { whiteLabelEnabled: boolean } | null;
  refetch: () => void;
}) {
  const navigate = useNavigate();
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [savingWhiteLabel, setSavingWhiteLabel] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {});
  }, [storeId]);

  const whiteLabelFeature = entitlements?.whiteLabelAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const locked = !!whiteLabelFeature && !whiteLabelFeature.allowed;
  const enabled = !!store?.whiteLabelEnabled;

  async function toggleWhiteLabel() {
    setSavingWhiteLabel(true); setMsg(null);
    try {
      await apiSetWhiteLabel(storeId, !enabled);
      refetch();
      setMsg({ ok: true, text: !enabled ? 'Solvexo branding is now hidden.' : 'Solvexo branding is visible again.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update this setting.' });
    } finally {
      setSavingWhiteLabel(false);
    }
  }

  return (
    <SettingsCard
      title="Remove Solvexo branding"
      icon={locked ? <Lock size={14} /> : <EyeOff size={14} />}
      description="Applies to the public storefront straight away — no Save needed."
    >
      <div className="-mx-5 border-y border-fog px-5">
        <SettingsRow
          label="Hide the 'Powered by Solvexo' badge"
          description={locked ? `Available on the ${whiteLabelFeature?.requiredPlan ?? 'Advanced'} plan.` : undefined}
        >
          <div className="flex items-center gap-2">
            {savingWhiteLabel && <Loader2 size={14} className="animate-spin text-slate" />}
            {locked ? (
              <Button size="sm" onClick={() => navigate(`/store/${storeId}/settings?tab=billing`)} className="min-h-[36px]">Upgrade plan</Button>
            ) : (
              <Toggle checked={enabled} onChange={() => { void toggleWhiteLabel(); }} disabled={savingWhiteLabel || !store} ariaLabel="Remove Solvexo branding" />
            )}
          </div>
        </SettingsRow>
      </div>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-3 text-[12px] ${msg.ok ? 'text-success' : 'text-error'}`}>{msg.text}</p>
      )}
    </SettingsCard>
  );
}

/** Settings Hub's "Domains" tab — thin wrapper resolving `useStoreWorkspace()`
 *  for the card above (which stays store-agnostic/props-driven so it could
 *  in principle be reused elsewhere). */
export function DomainSettingsTab() {
  const { storeId, loading } = useStoreWorkspace();
  if (loading) return null;
  return (
    <div className="px-4 lg:px-7 py-6">
      {storeId && (
        <div className="flex flex-col gap-5">
          <DomainsSection storeId={storeId} />
        </div>
      )}
    </div>
  );
}

// ── Store Visibility (real Shopify-style password/coming-soon gate — this is
// Shopify's "Password protect your online store" feature, NOT its separate
// "Customer privacy" cookie-consent settings; see `PrivacyTab` further down
// for that real, different feature) ─────────────────────────────────────────
function StoreVisibilityCard({ storeId, store, refetch }: {
  storeId: string;
  store: { privacyMode: StorePrivacyMode } | null;
  refetch: () => void;
}) {
  const [mode, setMode] = useState<StorePrivacyMode>('public');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { setMode(store?.privacyMode ?? 'public'); setPassword(''); setMsg(null); }, [store?.privacyMode]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      await apiUpdateStorePrivacy(storeId, { privacyMode: mode, password: password.trim() || undefined });
      setPassword('');
      refetch();
      setMsg({ ok: true, text: 'Storefront visibility updated.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update storefront visibility.' });
    } finally {
      setSaving(false);
    }
  }

  const isDirty = mode !== (store?.privacyMode ?? 'public') || password.trim().length > 0;

  const OPTIONS: { value: StorePrivacyMode; label: string; description: string; icon: typeof Globe }[] = [
    { value: 'public', label: 'Public', description: 'Anyone can view this store.', icon: Globe },
    { value: 'password', label: 'Password protected', description: 'Visitors must enter a password to view the store.', icon: Lock },
    { value: 'coming_soon', label: 'Coming soon', description: 'Show a "coming soon" page — no password needed.', icon: Clock },
  ];

  return (
    <SettingsCard
      title="Storefront visibility"
      icon={<EyeOff size={14} />}
      description="Who can reach your store while you build it."
    >
      <div role="radiogroup" aria-label="Store visibility" className="flex flex-col gap-2.5">
        {OPTIONS.map(opt => (
          <SettingsChoice
            key={opt.value}
            name="store-privacy-mode"
            checked={mode === opt.value}
            label={opt.label}
            description={opt.description}
            icon={<opt.icon size={14} />}
            onChange={() => setMode(opt.value)}
          />
        ))}
      </div>

      {mode === 'password' && (
        <div className="mt-4">
          <Field label="Password">
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={store?.privacyMode === 'password' ? 'Leave blank to keep current password' : 'Set a password'}
              className={inputCls}
            />
          </Field>
        </div>
      )}

      <SettingsSaveBar isDirty={isDirty} saving={saving} onSave={save} saveMsg={msg} />
    </SettingsCard>
  );
}

const DEFAULT_COOKIE_MESSAGE = 'We use cookies to improve your experience and for analytics. By continuing to browse, you agree to our use of cookies.';

function formatRequestDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Customer Privacy — the real Shopify-equivalent of Settings → Customer
// Privacy: cookie-consent banner (with real region scoping) + a real,
// submittable "Do Not Sell" request tool, not just a static disclosure.
// Deliberately does NOT build fake third-party app data-access permissions
// — this app has no third-party app marketplace, so there is nothing real
// to gate there (Shopify's own equivalent only exists because IT has one). ──
function CustomerPrivacyCard({ storeId, store, refetch }: {
  storeId: string;
  store: {
    cookieBannerEnabled: boolean; cookieBannerMessage: string | null; cookieBannerRegionMode: 'all' | 'eu_uk_only';
    cookieBannerPosition: 'bottom_bar' | 'bottom_corner'; cookieBannerColorMode: 'dark' | 'light' | 'brand';
    showDoNotSellLink: boolean; privacyRequests: StorePrivacyRequest[];
  } | null;
  refetch: () => void;
}) {
  const [cookieBannerEnabled, setCookieBannerEnabled] = useState(false);
  const [cookieBannerMessage, setCookieBannerMessage] = useState('');
  const [cookieBannerRegionMode, setCookieBannerRegionMode] = useState<'all' | 'eu_uk_only'>('all');
  const [cookieBannerPosition, setCookieBannerPosition] = useState<'bottom_bar' | 'bottom_corner'>('bottom_bar');
  const [cookieBannerColorMode, setCookieBannerColorMode] = useState<'dark' | 'light' | 'brand'>('dark');
  const [showDoNotSellLink, setShowDoNotSellLink] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    setCookieBannerEnabled(!!store.cookieBannerEnabled);
    setCookieBannerMessage(store.cookieBannerMessage ?? '');
    setCookieBannerRegionMode(store.cookieBannerRegionMode ?? 'all');
    setCookieBannerPosition(store.cookieBannerPosition ?? 'bottom_bar');
    setCookieBannerColorMode(store.cookieBannerColorMode ?? 'dark');
    setShowDoNotSellLink(!!store.showDoNotSellLink);
  }, [store]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, cookieBannerEnabled, cookieBannerMessage: cookieBannerMessage.trim() || null, cookieBannerRegionMode, cookieBannerPosition, cookieBannerColorMode, showDoNotSellLink });
      refetch();
      setSaveMsg({ ok: true, text: 'Privacy settings updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update privacy settings.' });
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async (requestId: string) => {
    setCompletingId(requestId);
    try {
      await apiCompletePrivacyRequest(storeId, requestId);
      refetch();
    } catch { /* the row's own "Mark Complete" button stays clickable to retry */ }
    finally { setCompletingId(null); }
  };

  const isDirty =
    !!store &&
    (cookieBannerEnabled !== !!store.cookieBannerEnabled ||
      cookieBannerMessage !== (store.cookieBannerMessage ?? '') ||
      cookieBannerRegionMode !== (store.cookieBannerRegionMode ?? 'all') ||
      cookieBannerPosition !== (store.cookieBannerPosition ?? 'bottom_bar') ||
      cookieBannerColorMode !== (store.cookieBannerColorMode ?? 'dark') ||
      showDoNotSellLink !== !!store.showDoNotSellLink);

  const requests = store?.privacyRequests ?? [];
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <SettingsCard
      title="Customer privacy"
      icon={<ShieldCheck size={14} />}
      description="Cookie consent and buyer data requests on your storefront."
    >
      <div className="-mx-5 border-y border-fog px-5">
        <SettingsRow
          label="Show a cookie consent banner"
          description='Visitors get a real banner with "Accept All" and "Manage Preferences" (Analytics/Marketing) — your tracking pixels only load for the categories they actually approve: Google Analytics under Analytics, Facebook/Google Ads/TikTok under Marketing.'
        >
          <Toggle checked={cookieBannerEnabled} onChange={setCookieBannerEnabled} ariaLabel="Show a cookie consent banner" />
        </SettingsRow>
      </div>

      {cookieBannerEnabled && (
        <>
          <div className="mt-4">
            <Field label="Banner message">
              <textarea
                value={cookieBannerMessage}
                onChange={e => setCookieBannerMessage(e.target.value)}
                placeholder={DEFAULT_COOKIE_MESSAGE}
                rows={3}
                maxLength={300}
                className={`${inputCls} resize-y min-h-[70px]`}
              />
              <p className="text-[11px] text-slate mt-1">Leave blank to use the default message shown above as a placeholder.</p>
            </Field>
          </div>

          <div className="mt-4">
            <SettingsGroupLabel className="mb-2">Who sees the banner</SettingsGroupLabel>
            <div role="radiogroup" aria-label="Who sees the banner" className="flex flex-col gap-2.5">
              <SettingsChoice
                name="cookie-region-mode"
                checked={cookieBannerRegionMode === 'all'}
                label="All visitors"
                description="Every visitor sees the banner, regardless of where they're browsing from."
                onChange={() => setCookieBannerRegionMode('all')}
              />
              <SettingsChoice
                name="cookie-region-mode"
                checked={cookieBannerRegionMode === 'eu_uk_only'}
                label="Only regions with consent laws (EU/UK)"
                description="Only shown to visitors whose location resolves to an EU country or the UK — everyone else browses with no banner."
                onChange={() => setCookieBannerRegionMode('eu_uk_only')}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <SettingsGroupLabel className="mb-2">Position</SettingsGroupLabel>
              <div role="radiogroup" aria-label="Banner position" className="flex flex-col gap-2">
                {([
                  { value: 'bottom_bar' as const, label: 'Bottom bar', desc: 'Full-width bar across the bottom.' },
                  { value: 'bottom_corner' as const, label: 'Bottom corner', desc: 'Compact floating card, bottom-right.' },
                ]).map(opt => (
                  <SettingsChoice
                    key={opt.value}
                    name="cookie-position"
                    checked={cookieBannerPosition === opt.value}
                    label={opt.label}
                    description={opt.desc}
                    onChange={() => setCookieBannerPosition(opt.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <SettingsGroupLabel className="mb-2">Color</SettingsGroupLabel>
              <div role="radiogroup" aria-label="Banner color" className="flex flex-col gap-2">
                {([
                  { value: 'dark' as const, label: 'Dark', desc: 'Black background, white text.' },
                  { value: 'light' as const, label: 'Light', desc: 'White background, dark text.' },
                  { value: 'brand' as const, label: 'Match my theme', desc: "Uses your storefront's brand color." },
                ]).map(opt => (
                  <SettingsChoice
                    key={opt.value}
                    name="cookie-color"
                    checked={cookieBannerColorMode === opt.value}
                    label={opt.label}
                    description={opt.desc}
                    onChange={() => setCookieBannerColorMode(opt.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 -mx-5 border-y border-fog px-5">
        <SettingsRow
          label='"Do Not Sell My Personal Information" link'
          description='Adds a real footer link (required in some regions, e.g. California/CCPA) — a visitor can submit a request, which shows up below for you to resolve.'
        >
          <Toggle checked={showDoNotSellLink} onChange={setShowDoNotSellLink} ariaLabel='Show a "Do Not Sell My Personal Information" footer link' />
        </SettingsRow>
      </div>

      {showDoNotSellLink && (
        <div className="mt-4">
          <SettingsGroupLabel className="mb-2">
            Data requests {pendingCount > 0 && <span className="text-brand-orange">({pendingCount} pending)</span>}
          </SettingsGroupLabel>
          {requests.length === 0 ? (
            <p className="text-[11.5px] text-slate">No requests submitted yet.</p>
          ) : (
            <div className="divide-y divide-fog">
              {requests.slice().reverse().map(r => (
                <SettingsRow
                  key={r._id}
                  label={r.email}
                  description={formatRequestDate(r.createdAt)}
                  className="py-2.5"
                >
                  {r.status === 'completed' ? (
                    <span className="text-[11px] font-semibold text-success">Resolved</span>
                  ) : (
                    <Button size="sm" variant="outline" loading={completingId === r._id} onClick={() => markComplete(r._id)}>Mark Complete</Button>
                  )}
                </SettingsRow>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-[11.5px] text-slate leading-relaxed">
        Your Privacy Policy page's own content is written in <span className="font-semibold text-charcoal">Settings → Policies</span> (create it from a template, then edit it) — the footer link above points to it automatically once it is published.
      </p>

      <SettingsSaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />
    </SettingsCard>
  );
}

/** Settings Hub's "Privacy" tab — both the storefront-access gate ("Store
 *  Visibility", Shopify's "Password protect your online store") and the
 *  real customer-privacy tools (cookie consent + data requests), merged
 *  into one tab since they're both genuinely "Privacy" from a seller's
 *  point of view even though they're two structurally distinct Shopify
 *  features under the hood. */
export function PrivacyTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  if (loading) return null;
  return (
    <div className="px-4 lg:px-7 py-6">
      <div className="flex flex-col gap-5">
        {storeId && <StoreVisibilityCard storeId={storeId} store={store ? { privacyMode: store.privacyMode } : null} refetch={refetch} />}
        {storeId && (
          <CustomerPrivacyCard
            storeId={storeId}
            store={store ? {
              cookieBannerEnabled: store.cookieBannerEnabled,
              cookieBannerMessage: store.cookieBannerMessage,
              cookieBannerRegionMode: store.cookieBannerRegionMode,
              cookieBannerPosition: store.cookieBannerPosition,
              cookieBannerColorMode: store.cookieBannerColorMode,
              showDoNotSellLink: store.showDoNotSellLink,
              privacyRequests: store.privacyRequests,
            } : null}
            refetch={refetch}
          />
        )}
      </div>
    </div>
  );
}
