import { useState, useEffect } from 'react';
import { Save, Store, Loader2, CheckCircle, AlertCircle, Globe, Lock, Copy, Check, Clock, EyeOff, ShieldCheck } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, apiSetCustomDomain, apiVerifyCustomDomain, apiSetWhiteLabel, apiUpdateStorePrivacy, apiCompletePrivacyRequest, apiGetEnabledCurrencies, type ProductType, type CustomDomainStatus, type SupportedCurrency, type StorePrivacyMode, type StorePrivacyRequest, type TaxRegion } from '@/api/services/store';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  physical_products:    'Physical Products',
  digital_downloads:    'Digital Downloads',
  educational_resources:'Educational Resources',
  services_bookings:    'Services / Bookings',
  subscriptions:        'Subscriptions',
  in_person_pos:        'In-Person / POS',
};
const ALL_PRODUCT_TYPES: ProductType[] = [
  'physical_products', 'digital_downloads', 'educational_resources',
  'services_bookings', 'subscriptions', 'in_person_pos',
];

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SettingsSkeleton() {
  const box = (w: string, h: number) => (
    <div className="animate-pulse rounded-[6px] bg-bone" style={{ width: w, height: h }} />
  );
  return (
    <div className="px-4 lg:px-7 py-6">
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone max-w-[600px]">
        {[1,2,3,4].map(i => (
          <div key={i} className="mb-5">
            {box('100px', 12)}<div className="mt-2">{box('100%', 38)}</div>
          </div>
        ))}
        {box('120px', 36)}
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="text-[12px] font-semibold text-charcoal block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-[9px] rounded-lg text-[13px] border border-bone bg-bone text-charcoal outline-none box-border";

// Shared save-bar — every settings tab below uses the same "Save Changes"
// button + inline status-message pattern, so this is one implementation
// instead of 4 hand-rolled copies.
function SaveBar({ isDirty, saving, onSave, saveMsg }: {
  isDirty: boolean; saving: boolean; onSave: () => void;
  saveMsg: { ok: boolean; text: string } | null;
}) {
  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          className="flex items-center gap-[7px] px-[18px] py-2 rounded-lg border-none text-[13px] font-semibold transition-all duration-150"
          style={{
            background: isDirty && !saving ? '#D97757' : '#E8E6DC',
            color: isDirty && !saving ? '#fff' : '#8C8A82',
            cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Save Changes
        </button>
      </div>
      {saveMsg && (
        <div
          className="flex items-center gap-2 px-[14px] py-[10px] rounded-lg mb-[18px] text-[13px] border"
          style={{
            background: saveMsg.ok ? '#F0FDF4' : '#FFF1F2',
            borderColor: saveMsg.ok ? '#BBF7D0' : '#FECDD3',
            color: saveMsg.ok ? '#166534' : '#991B1B',
          }}
        >
          {saveMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {saveMsg.text}
        </div>
      )}
    </>
  );
}

// ── Store Profile — Basic Information + general store-identity behavior ────
// ("Product Types", "Payment Methods", "Custom Domain & White Label", and
// "Store Visibility" each moved out to their own Settings Hub tab — see
// `SettingsHub.tsx`'s TABS — since each is its own real configuration
// concern, not a sub-section of "General.")
export function StoreProfileTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [tagline,      setTagline]      = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [logo,         setLogo]         = useState('');
  const [coverImage,   setCoverImage]   = useState('');
  const [faviconUrl,   setFaviconUrl]   = useState('');
  const [reviewModerationEnabled, setReviewModerationEnabled] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [taxRate, setTaxRate] = useState(0);
  const [taxRegions, setTaxRegions] = useState<TaxRegion[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setTagline(store.tagline ?? '');
    setContactEmail(store.contactEmail ?? '');
    setContactPhone(store.contactPhone ?? '');
    setLogo(store.logo ?? '');
    setCoverImage(store.coverImage ?? '');
    setFaviconUrl(store.faviconUrl ?? '');
    setReviewModerationEnabled(!!store.reviewModerationEnabled);
    setLowStockThreshold(store.lowStockThreshold ?? 10);
    setTaxRate(store.taxRate ?? 0);
    setTaxRegions(store.taxRegions ?? []);
  }, [store]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, tagline, contactEmail, contactPhone, logo, coverImage, faviconUrl: faviconUrl || null, reviewModerationEnabled, lowStockThreshold, taxRate, taxRegions: taxRegions.filter(r => r.country.trim()) });
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
      logo !== (store.logo ?? '') ||
      coverImage !== (store.coverImage ?? '') ||
      faviconUrl !== (store.faviconUrl ?? '') ||
      reviewModerationEnabled !== !!store.reviewModerationEnabled ||
      lowStockThreshold !== (store.lowStockThreshold ?? 10) ||
      taxRate !== (store.taxRate ?? 0) ||
      JSON.stringify(taxRegions) !== JSON.stringify(store.taxRegions ?? []));

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="px-4 lg:px-7 py-6">
      <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

        {/* Left column — identity */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
              <Store size={15} className="text-brand-orange" />
            </div>
            <p className="text-[14px] font-semibold text-charcoal">Basic Information</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
            <Field label="Store Logo">
              <div className="flex items-center gap-3">
                <ImageUpload value={logo ? [logo] : []} onChange={urls => setLogo(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
                <p className="text-[11px] text-slate">PNG, JPG or WebP</p>
              </div>
            </Field>

            <Field label="Cover Image">
              <div className="flex items-center gap-3">
                <ImageUpload value={coverImage ? [coverImage] : []} onChange={urls => setCoverImage(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
                <p className="text-[11px] text-slate">PNG, JPG or WebP</p>
              </div>
            </Field>

            <Field label="Favicon (browser tab icon)">
              <div className="flex items-center gap-3">
                <ImageUpload value={faviconUrl ? [faviconUrl] : []} onChange={urls => setFaviconUrl(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
                <p className="text-[11px] text-slate">Square image works best. Falls back to your logo if not set.</p>
              </div>
            </Field>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Email">
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="support@yourstore.com" className={inputCls} />
            </Field>
            <Field label="Contact Phone">
              <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+1 555 123 4567" className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Right column — behavior + read-only identity */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
          <Field label="Low Stock Threshold">
            <input type="number" min={1} value={lowStockThreshold} onChange={e => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))} className={inputCls} />
            <p className="text-[11px] text-slate mt-1">Products at or below this stock count are flagged "Low Stock" in your Inventory page and dashboard alerts.</p>
          </Field>

          <Field label="Tax Rate (%)">
            <input type="number" min={0} max={100} step={0.01} value={taxRate} onChange={e => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} className={inputCls} />
            <p className="text-[11px] text-slate mt-1">The default rate, used only when no tax region below matches the buyer's address (and no TaxJar connection is active — see Integrations).</p>
          </Field>

          {/* Tax Regions — Shopify-"Tax regions"-style manual per-destination
             rates, checked before the flat Tax Rate above at checkout. */}
          <div className="border-t border-bone pt-[18px] mb-[18px]">
            <p className="text-[12px] font-semibold text-charcoal mb-1">Tax Regions</p>
            <p className="text-[11px] text-slate mb-3">Charge a different rate for specific countries or states, instead of one flat rate for every buyer. Leave State blank to cover the whole country.</p>
            {taxRegions.map((r, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
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
                <button
                  type="button"
                  onClick={() => setTaxRegions(rs => rs.filter((_, j) => j !== i))}
                  className="text-slate hover:text-red-500 text-[16px] px-1 shrink-0"
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
          </div>

          {/* Review moderation */}
          <div className="border-t border-bone pt-[18px]">
            <p className="text-[12px] font-semibold text-charcoal mb-3">Reviews</p>
            <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
              <div>
                <p className="text-[13px] font-medium text-charcoal">Require review approval</p>
                <p className="text-[11px] text-slate">New reviews stay hidden until you approve them. Off by default — reviews publish instantly.</p>
              </div>
              <Toggle checked={reviewModerationEnabled} onChange={setReviewModerationEnabled} ariaLabel="Require review approval" />
            </div>
          </div>

          <div className="mt-6 border-t border-bone pt-[18px]">
            <Field label="Store URL">
              <input value={store?.slug ?? ''} readOnly className={`${inputCls} text-slate cursor-default bg-[#f3f2ec]`} />
              <p className="text-[10px] text-slate mt-1">URL slug cannot be changed.</p>
            </Field>

            <Field label="Plan">
              <input value={store?.plan ?? ''} readOnly className={`${inputCls} text-slate cursor-default bg-[#f3f2ec]`} />
            </Field>

            <p className="text-[12px] font-semibold text-charcoal mb-3">Store Info</p>
            {[
              { label: 'Status',   value: store?.status   ?? '—' },
              { label: 'Seller',   value: store?.sellerType ?? '—' },
              { label: 'AI Credits', value: String(store?.aiCredits ?? 0) },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-[12px] py-1.5 border-b border-[#f3f2ec]">
                <span className="text-slate">{r.label}</span>
                <span className="font-semibold text-charcoal">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
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

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="px-4 lg:px-7 py-6">
      <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />

      <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
        <p className="text-[14px] font-semibold text-charcoal mb-2">Product Types</p>
        <p className="text-[11px] text-slate mb-4">What kind of products will you sell?</p>

        <div className="flex flex-col gap-2.5">
          {ALL_PRODUCT_TYPES.map(t => {
            const active = productTypes.includes(t);
            return (
              <div
                key={t}
                onClick={() => toggleType(t)}
                className="flex items-center gap-3 px-[14px] py-3 rounded-[9px] cursor-pointer transition-all duration-150 border"
                style={{ borderColor: active ? '#D97757' : '#E8E6DC', background: active ? '#FBECE4' : '#FAF9F5' }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center"
                  style={{ border: `2px solid ${active ? '#D97757' : '#CBCABA'}`, background: active ? '#D97757' : 'transparent' }}
                >
                  {active && <CheckCircle size={11} className="text-white" />}
                </div>
                <span className="text-[13px]" style={{ fontWeight: active ? 600 : 400, color: active ? '#D97757' : '#141413' }}>
                  {PRODUCT_TYPE_LABELS[t]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Payment Methods (incl. "Markets" — which currencies checkout accepts) ──
export function PaymentMethodsTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const [codEnabled, setCodEnabled] = useState(true);
  const [paymentCaptureMethod, setPaymentCaptureMethod] = useState<'automatic' | 'manual'>('automatic');
  // `null` is a real, distinct state here — "no restriction, every platform
  // currency is accepted" (the schema default) — never collapsed into an
  // array like `[baseCurrency]` just because nothing is set yet.
  const [enabledCurrencies, setEnabledCurrencies] = useState<SupportedCurrency[] | null>(null);
  const [platformCurrencies, setPlatformCurrencies] = useState<string[]>([]);
  const [saving,  setSaving]  = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    apiGetEnabledCurrencies().then(res => setPlatformCurrencies(res.data.map(c => c.code))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!store) return;
    setCodEnabled(store.codEnabled !== false);
    setPaymentCaptureMethod(store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic');
    setEnabledCurrencies(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies : null);
  }, [store]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, codEnabled, paymentCaptureMethod, enabledCurrencies });
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
    (codEnabled !== (store.codEnabled !== false) ||
      paymentCaptureMethod !== (store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic') ||
      JSON.stringify(enabledCurrencies ? enabledCurrencies.slice().sort() : null) !==
        JSON.stringify(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies.slice().sort() : null));

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="px-4 lg:px-7 py-6">
      <SaveBar isDirty={isDirty} saving={saving} onSave={handleSave} saveMsg={saveMsg} />

      <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
        <p className="text-[14px] font-semibold text-charcoal mb-4">Payment Methods</p>

        <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
          <div>
            <p className="text-[13px] font-medium text-charcoal">Cash on Delivery</p>
            <p className="text-[11px] text-slate">Let buyers pay in cash when their physical order arrives.</p>
          </div>
          <Toggle checked={codEnabled} onChange={setCodEnabled} ariaLabel="Enable Cash on Delivery" />
        </div>

        {/* Payment capture method — Shopify's real "Automatically at checkout"
           vs "Manually" setting. Only affects online Stripe checkouts on a
           single-store cart — see PaymentService.initiatePayment. */}
        <div className="mt-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
          <p className="text-[13px] font-medium text-charcoal mb-1">When to capture payment</p>
          <p className="text-[11px] text-slate mb-3">Controls when an online card payment is actually charged.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPaymentCaptureMethod('automatic')}
              className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-[12px] cursor-pointer ${paymentCaptureMethod === 'automatic' ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white'}`}
            >
              <span className="block font-semibold text-charcoal">Automatically at checkout</span>
              <span className="block text-slate mt-0.5">Charge the buyer the instant checkout succeeds.</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentCaptureMethod('manual')}
              className={`flex-1 text-left px-3 py-2.5 rounded-lg border text-[12px] cursor-pointer ${paymentCaptureMethod === 'manual' ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white'}`}
            >
              <span className="block font-semibold text-charcoal">Manually</span>
              <span className="block text-slate mt-0.5">Authorize the card, review the order, then capture it yourself before it ships.</span>
            </button>
          </div>
        </div>

        {/* Markets — which currencies buyers may check out in on this store */}
        <div className="mt-6 border-t border-bone pt-[18px]">
          <p className="text-[12px] font-semibold text-charcoal mb-1">Markets</p>
          <p className="text-[11px] text-slate mb-3">Which currencies can buyers pay in at checkout on your store?</p>

          <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream mb-2">
            <div>
              <p className="text-[13px] font-medium text-charcoal">Restrict to specific currencies</p>
              <p className="text-[11px] text-slate">
                {enabledCurrencies === null ? 'Off — buyers can pay in any currency this platform supports.' : 'On — buyers can only pay in the currencies checked below.'}
              </p>
            </div>
            <Toggle
              checked={enabledCurrencies !== null}
              ariaLabel="Restrict which currencies buyers can pay in"
              onChange={v => setEnabledCurrencies(v ? [...platformCurrencies] : null)}
            />
          </div>

          {enabledCurrencies !== null && (
            <div className="flex flex-col gap-2">
              {platformCurrencies.map(c => {
                const isBase = c === store?.baseCurrency;
                const checked = enabledCurrencies.includes(c);
                return (
                  <div key={c} className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
                    <p className="text-[13px] font-medium text-charcoal">{c}{isBase ? ' (your store currency)' : ''}</p>
                    <Toggle
                      checked={checked}
                      disabled={isBase}
                      ariaLabel={`Accept ${c} at checkout`}
                      onChange={v => {
                        if (isBase && !v) return; // can never disable your own store currency
                        setEnabledCurrencies(prev => (v ? [...(prev ?? []), c] : (prev ?? []).filter(x => x !== c)));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mirrors `CUSTOM_DOMAIN_CNAME_TARGET` in `solvexo-api/src/store/store.service.ts`
// — the frontend can't import a backend constant, so this literal must be
// kept in sync by hand if that value ever changes.
const CUSTOM_DOMAIN_CNAME_TARGET = 'stores.solvexo.store';

function CopyableRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[11px] text-slate w-14 shrink-0">{label}</span>
      <code className="flex-1 text-[12px] text-charcoal bg-white border border-bone rounded-md px-2 py-1 truncate">{value}</code>
      <button type="button" onClick={copy} title="Copy" className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md border-none bg-transparent text-slate hover:bg-white hover:text-charcoal cursor-pointer">
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

// ── Custom Domain & White Label ─────────────────────────────────────────────
// (Stripe Connect's "Payment Gateway" card used to live here — moved to the
// Integrations page, where a seller now manages every payment gateway,
// Stripe included, in one place. See StripeConnectSection in
// `features/seller/store/Dashboard/Operations/integrations/Integrations.tsx`.)

function DomainWhiteLabelCard({ storeId, store, refetch }: {
  storeId: string;
  store: { customDomain: string | null; customDomainStatus: CustomDomainStatus; whiteLabelEnabled: boolean } | null;
  refetch: () => void;
}) {
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [domain, setDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [savingWhiteLabel, setSavingWhiteLabel] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; reason: string | null } | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {});
  }, [storeId]);

  useEffect(() => { setDomain(store?.customDomain ?? ''); setVerifyResult(null); }, [store?.customDomain]);

  const domainFeature = entitlements?.customDomainAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const whiteLabelFeature = entitlements?.whiteLabelAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;

  async function saveDomain() {
    setSavingDomain(true); setMsg(''); setVerifyResult(null);
    try {
      await apiSetCustomDomain(storeId, domain.trim() || null);
      refetch();
      setMsg('Custom domain updated — add the DNS record below, then click Verify Domain.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to update domain.');
    } finally {
      setSavingDomain(false);
    }
  }

  async function verifyDomain() {
    setVerifying(true); setMsg('');
    try {
      const res = await apiVerifyCustomDomain(storeId);
      setVerifyResult({ verified: res.data.verified, reason: res.data.reason });
      refetch();
    } catch (err) {
      setVerifyResult({ verified: false, reason: err instanceof Error ? err.message : 'Verification failed — try again.' });
    } finally {
      setVerifying(false);
    }
  }

  async function toggleWhiteLabel() {
    setSavingWhiteLabel(true); setMsg('');
    try {
      await apiSetWhiteLabel(storeId, !store?.whiteLabelEnabled);
      refetch();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to update white-label setting.');
    } finally {
      setSavingWhiteLabel(false);
    }
  }

  const isVerified = store?.customDomainStatus === 'verified';

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
          <Globe size={15} className="text-brand-orange" />
        </div>
        <p className="text-[14px] font-semibold text-charcoal">Custom Domain & White Label</p>
      </div>

      {msg && <p className="text-[12px] text-slate mb-3">{msg}</p>}

      <Field label="Custom Domain">
        {domainFeature && !domainFeature.allowed ? (
          <div className="flex items-center gap-2 text-[12px] text-slate bg-[#f3f2ec] rounded-lg px-3 py-2.5">
            <Lock size={13} />
            Requires the {domainFeature.requiredPlan ?? 'a higher'} plan.
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="shop.yourbrand.com" className={inputCls} />
              <Button size="sm" loading={savingDomain} onClick={saveDomain}>Save</Button>
            </div>

            {store?.customDomain && (
              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {isVerified ? (
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-success bg-success-bg px-2.5 py-1 rounded-full">
                      <CheckCircle size={12} /> Verified — live on {store.customDomain}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-warning bg-warning-bg px-2.5 py-1 rounded-full">
                      <AlertCircle size={12} /> Not verified yet
                    </span>
                  )}
                </div>

                {!isVerified && (
                  <div className="bg-cream/60 border border-bone rounded-lg p-3">
                    <p className="text-[12px] text-charcoal font-medium mb-2">Add this DNS record with your domain registrar, then verify:</p>
                    <CopyableRow label="Type" value="CNAME" />
                    <CopyableRow label="Host" value={store.customDomain.split('.').slice(0, -2).join('.') || '@'} />
                    <CopyableRow label="Value" value={CUSTOM_DOMAIN_CNAME_TARGET} />
                    <p className="text-[11px] text-slate mt-2">DNS changes can take a few minutes to a few hours to propagate. A bare root domain (no subdomain, e.g. just "yourbrand.com") may not support a CNAME record with your registrar — a subdomain like "shop.yourbrand.com" is the more universally supported option.</p>

                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" loading={verifying} onClick={verifyDomain}>Verify Domain</Button>
                      {verifyResult && !verifyResult.verified && (
                        <p className="text-[11.5px] text-error">{verifyResult.reason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Field>

      <Field label="White-Label Branding">
        {whiteLabelFeature && !whiteLabelFeature.allowed ? (
          <div className="flex items-center gap-2 text-[12px] text-slate bg-[#f3f2ec] rounded-lg px-3 py-2.5">
            <Lock size={13} />
            Requires the {whiteLabelFeature.requiredPlan ?? 'a higher'} plan.
          </div>
        ) : (
          <label className="flex items-center gap-2.5 text-[12.5px] text-graphite cursor-pointer">
            <input type="checkbox" checked={!!store?.whiteLabelEnabled} disabled={savingWhiteLabel} onChange={toggleWhiteLabel} />
            Hide Solvexo branding on this store
          </label>
        )}
      </Field>
    </div>
  );
}

/** Settings Hub's "Domains" tab — thin wrapper resolving `useStoreWorkspace()`
 *  for the card above (which stays store-agnostic/props-driven so it could
 *  in principle be reused elsewhere). */
export function DomainSettingsTab() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  if (loading) return <SettingsSkeleton />;
  return (
    <div className="px-4 lg:px-7 py-6">
      {storeId && <DomainWhiteLabelCard storeId={storeId} store={store ? { customDomain: store.customDomain, customDomainStatus: store.customDomainStatus, whiteLabelEnabled: store.whiteLabelEnabled } : null} refetch={refetch} />}
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
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
          <EyeOff size={15} className="text-brand-orange" />
        </div>
        <p className="text-[14px] font-semibold text-charcoal">Store Visibility</p>
      </div>

      {msg && (
        <p className={`text-[12px] mb-3 ${msg.ok ? 'text-success' : 'text-error'}`}>{msg.text}</p>
      )}

      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => (
          <label
            key={opt.value}
            className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer"
            style={{ borderColor: mode === opt.value ? '#D97757' : '#EFEDE6', background: mode === opt.value ? '#FDF6F1' : 'transparent' }}
          >
            <input type="radio" name="store-privacy-mode" className="mt-1" checked={mode === opt.value} onChange={() => setMode(opt.value)} />
            <opt.icon size={15} className="mt-0.5 text-slate shrink-0" />
            <div>
              <p className="text-[12.5px] font-semibold text-charcoal">{opt.label}</p>
              <p className="text-[11.5px] text-slate">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {mode === 'password' && (
        <div className="mt-3">
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

      <div className="mt-4">
        <Button size="sm" loading={saving} disabled={!isDirty} onClick={save}>Save</Button>
      </div>
    </div>
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
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
          <ShieldCheck size={15} className="text-brand-orange" />
        </div>
        <p className="text-[14px] font-semibold text-charcoal">Customer Privacy</p>
      </div>

      {saveMsg && (
        <p className={`text-[12px] mb-3 ${saveMsg.ok ? 'text-success' : 'text-error'}`}>{saveMsg.text}</p>
      )}

      <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
        <div>
          <p className="text-[13px] font-medium text-charcoal">Show a cookie consent banner</p>
          <p className="text-[11px] text-slate">Visitors see a real banner with "Accept All" and "Manage Preferences" (Analytics/Marketing, like Shopify's own) — your tracking pixels only load for the categories they actually approve: Google Analytics under Analytics, Facebook/Google Ads/TikTok under Marketing.</p>
        </div>
        <Toggle checked={cookieBannerEnabled} onChange={setCookieBannerEnabled} ariaLabel="Show a cookie consent banner" />
      </div>

      {cookieBannerEnabled && (
        <>
          <div className="mt-3">
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

          <div className="mb-1">
            <p className="text-[12px] font-semibold text-charcoal mb-1.5">Who sees the banner</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer"
                style={{ borderColor: cookieBannerRegionMode === 'all' ? '#D97757' : '#EFEDE6', background: cookieBannerRegionMode === 'all' ? '#FDF6F1' : 'transparent' }}>
                <input type="radio" name="cookie-region-mode" className="mt-1" checked={cookieBannerRegionMode === 'all'} onChange={() => setCookieBannerRegionMode('all')} />
                <div>
                  <p className="text-[12.5px] font-semibold text-charcoal">All visitors</p>
                  <p className="text-[11.5px] text-slate">Every visitor sees the banner, regardless of where they're browsing from.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer"
                style={{ borderColor: cookieBannerRegionMode === 'eu_uk_only' ? '#D97757' : '#EFEDE6', background: cookieBannerRegionMode === 'eu_uk_only' ? '#FDF6F1' : 'transparent' }}>
                <input type="radio" name="cookie-region-mode" className="mt-1" checked={cookieBannerRegionMode === 'eu_uk_only'} onChange={() => setCookieBannerRegionMode('eu_uk_only')} />
                <div>
                  <p className="text-[12.5px] font-semibold text-charcoal">Only regions with consent laws (EU/UK)</p>
                  <p className="text-[11.5px] text-slate">Only shown to visitors whose location resolves to an EU country or the UK — everyone else browses with no banner.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
            <div>
              <p className="text-[12px] font-semibold text-charcoal mb-1.5">Position</p>
              <div className="flex flex-col gap-1.5">
                {([
                  { value: 'bottom_bar' as const, label: 'Bottom bar', desc: 'Full-width bar across the bottom.' },
                  { value: 'bottom_corner' as const, label: 'Bottom corner', desc: 'Compact floating card, bottom-right.' },
                ]).map(opt => (
                  <label key={opt.value} className="flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer"
                    style={{ borderColor: cookieBannerPosition === opt.value ? '#D97757' : '#EFEDE6', background: cookieBannerPosition === opt.value ? '#FDF6F1' : 'transparent' }}>
                    <input type="radio" name="cookie-position" className="mt-1" checked={cookieBannerPosition === opt.value} onChange={() => setCookieBannerPosition(opt.value)} />
                    <div>
                      <p className="text-[12px] font-semibold text-charcoal">{opt.label}</p>
                      <p className="text-[11px] text-slate">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-charcoal mb-1.5">Color</p>
              <div className="flex flex-col gap-1.5">
                {([
                  { value: 'dark' as const, label: 'Dark', desc: 'Black background, white text.' },
                  { value: 'light' as const, label: 'Light', desc: 'White background, dark text.' },
                  { value: 'brand' as const, label: 'Match my theme', desc: "Uses your storefront's brand color." },
                ]).map(opt => (
                  <label key={opt.value} className="flex items-start gap-2.5 rounded-lg border px-3 py-2 cursor-pointer"
                    style={{ borderColor: cookieBannerColorMode === opt.value ? '#D97757' : '#EFEDE6', background: cookieBannerColorMode === opt.value ? '#FDF6F1' : 'transparent' }}>
                    <input type="radio" name="cookie-color" className="mt-1" checked={cookieBannerColorMode === opt.value} onChange={() => setCookieBannerColorMode(opt.value)} />
                    <div>
                      <p className="text-[12px] font-semibold text-charcoal">{opt.label}</p>
                      <p className="text-[11px] text-slate">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
        <div>
          <p className="text-[13px] font-medium text-charcoal">"Do Not Sell My Personal Information" link</p>
          <p className="text-[11px] text-slate">Adds a real footer link (required in some regions, e.g. California/CCPA) — a visitor can submit a request, which shows up below for you to resolve.</p>
        </div>
        <Toggle checked={showDoNotSellLink} onChange={setShowDoNotSellLink} ariaLabel='Show a "Do Not Sell My Personal Information" footer link' />
      </div>

      <div className="mt-4">
        <Button size="sm" loading={saving} disabled={!isDirty} onClick={handleSave}>Save</Button>
      </div>

      {showDoNotSellLink && (
        <div className="mt-5 border-t border-bone pt-4">
          <p className="text-[12px] font-semibold text-charcoal mb-1">
            Data requests {pendingCount > 0 && <span className="text-brand-orange">({pendingCount} pending)</span>}
          </p>
          {requests.length === 0 ? (
            <p className="text-[11.5px] text-slate">No requests submitted yet.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {requests.slice().reverse().map(r => (
                <div key={r._id} className="flex items-center justify-between gap-3 px-[12px] py-2 rounded-[8px] border border-bone bg-cream">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-charcoal truncate">{r.email}</p>
                    <p className="text-[10.5px] text-slate">{formatRequestDate(r.createdAt)}</p>
                  </div>
                  {r.status === 'completed' ? (
                    <span className="text-[11px] font-semibold text-success shrink-0">Resolved</span>
                  ) : (
                    <Button size="sm" variant="outline" loading={completingId === r._id} onClick={() => markComplete(r._id)}>Mark Complete</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-bone pt-4">
        <p className="text-[11.5px] text-slate">
          Your Privacy Policy page's own content is edited from <span className="font-semibold text-charcoal">Online Store → Pages</span> — the footer link above will automatically point to it once you've created and tagged a "Privacy Policy" page there (Page Settings → Policy Type) and turned on "Show in footer".
        </p>
      </div>
    </div>
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
  if (loading) return <SettingsSkeleton />;
  return (
    <div className="px-4 lg:px-7 py-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate mb-2">Storefront Visibility</p>
          {storeId && <StoreVisibilityCard storeId={storeId} store={store ? { privacyMode: store.privacyMode } : null} refetch={refetch} />}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-slate mb-2">Customer Privacy</p>
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
    </div>
  );
}
