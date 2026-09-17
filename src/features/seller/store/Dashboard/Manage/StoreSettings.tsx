import { useState, useEffect } from 'react';
import { Save, Store, Loader2, CheckCircle, AlertCircle, Globe, Lock, Copy, Check, Clock, EyeOff } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, apiSetCustomDomain, apiVerifyCustomDomain, apiSetWhiteLabel, apiUpdateStorePrivacy, apiGetEnabledCurrencies, type ProductType, type CustomDomainStatus, type SupportedCurrency, type StorePrivacyMode } from '@/api/services/store';
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

// ── Store Privacy (real Shopify-style password/coming-soon gate) ───────────────
function StorePrivacyCard({ storeId, store, refetch }: {
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
        <p className="text-[14px] font-semibold text-charcoal">Store Privacy</p>
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

// ── Main ──────────────────────────────────────────────────────────────────────
// `embedded` was dropped from this signature — unlike its 5 sibling tab
// components, this one no longer has a real standalone (non-embedded) mode
// at all (see the doc comment on the return statement below), so keeping an
// always-true prop around just to match their shape would be dead weight,
// not real API consistency.
export default function StoreSettings() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [tagline,      setTagline]      = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [logo,         setLogo]         = useState('');
  const [coverImage,   setCoverImage]   = useState('');
  const [faviconUrl,   setFaviconUrl]   = useState('');
  const [codEnabled,   setCodEnabled]   = useState(true);
  const [paymentCaptureMethod, setPaymentCaptureMethod] = useState<'automatic' | 'manual'>('automatic');
  const [reviewModerationEnabled, setReviewModerationEnabled] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [taxRate, setTaxRate] = useState(0);
  // `null` is a real, distinct state here — "no restriction, every platform
  // currency is accepted" (the schema default) — never collapsed into an
  // array like `[baseCurrency]` just because nothing is set yet. Doing that
  // used to mean the very first unrelated General-tab save (e.g. just the
  // tagline) silently narrowed a store's buyers to one currency, with no
  // "Markets" action ever taken.
  const [enabledCurrencies, setEnabledCurrencies] = useState<SupportedCurrency[] | null>(null);
  // The platform's real, dynamic Markets currency list (AdminConfigService.
  // getEnabledCurrencies) — replaces the old hardcoded ['PKR','USD'] this
  // card used to render, both as the checklist itself and as the "nothing
  // set yet" default (see the sync effect below).
  const [platformCurrencies, setPlatformCurrencies] = useState<string[]>([]);
  useEffect(() => {
    apiGetEnabledCurrencies().then(res => setPlatformCurrencies(res.data.map(c => c.code))).catch(() => {});
  }, []);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // Sync form when store loads
  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setTagline(store.tagline ?? '');
    setContactEmail(store.contactEmail ?? '');
    setContactPhone(store.contactPhone ?? '');
    setProductTypes(store.productTypes ?? []);
    setLogo(store.logo ?? '');
    setCoverImage(store.coverImage ?? '');
    setFaviconUrl(store.faviconUrl ?? '');
    setCodEnabled(store.codEnabled !== false);
    setPaymentCaptureMethod(store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic');
    setReviewModerationEnabled(!!store.reviewModerationEnabled);
    setLowStockThreshold(store.lowStockThreshold ?? 10);
    setTaxRate(store.taxRate ?? 0);
    // Mirror the store's real value exactly — `null`/empty stays `null`
    // ("no restriction"), never collapsed into a guessed array. See this
    // field's own useState comment above for why that collapse was a bug.
    setEnabledCurrencies(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies : null);
  }, [store]);

  const toggleType = (t: ProductType) =>
    setProductTypes(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, tagline, contactEmail, contactPhone, productTypes, logo, coverImage, faviconUrl: faviconUrl || null, codEnabled, paymentCaptureMethod, reviewModerationEnabled, lowStockThreshold, taxRate, enabledCurrencies });
      refetch();
      setSaveMsg({ ok: true, text: 'Store updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update store.' });
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
      JSON.stringify(productTypes.slice().sort()) !==
        JSON.stringify((store.productTypes ?? []).slice().sort()) ||
      codEnabled !== (store.codEnabled !== false) ||
      paymentCaptureMethod !== (store.paymentCaptureMethod === 'manual' ? 'manual' : 'automatic') ||
      reviewModerationEnabled !== !!store.reviewModerationEnabled ||
      lowStockThreshold !== (store.lowStockThreshold ?? 10) ||
      taxRate !== (store.taxRate ?? 0) ||
      JSON.stringify(enabledCurrencies ? enabledCurrencies.slice().sort() : null) !==
        JSON.stringify(store.enabledCurrencies && store.enabledCurrencies.length > 0 ? store.enabledCurrencies.slice().sort() : null));

  // This component only ever renders embedded now — it's the Settings Hub's
  // "General" tab (`SettingsHub.tsx`), which owns the header, tab
  // navigation, and mobile account-hub menu that used to live here. Kept as
  // its own component (not inlined into the hub) since it's still a
  // sizeable, independent form with its own state/save logic.
  return (
    <div>
      <div className="px-4 lg:px-7 py-6">
        {loading ? <SettingsSkeleton /> : (
          <div>

          <div className="flex justify-end mb-4">
              <button
                onClick={handleSave}
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

          {/* Status message */}
          {saveMsg && (
            <div
              className="flex items-center gap-2 px-[14px] py-[10px] rounded-lg mb-[18px] text-[13px] border"
              style={{
                background: saveMsg.ok ? '#F0FDF4' : '#FFF1F2',
                borderColor: saveMsg.ok ? '#BBF7D0' : '#FECDD3',
                color: saveMsg.ok ? '#166534' : '#991B1B',
              }}
            >
              {saveMsg.ok
                ? <CheckCircle size={15} />
                : <AlertCircle size={15} />}
              {saveMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">

            {/* Left column */}
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
                    <ImageUpload
                      value={logo ? [logo] : []}
                      onChange={urls => setLogo(urls[0] ?? '')}
                      maxFiles={1}
                      storeId={storeId}
                    />
                    <p className="text-[11px] text-slate">PNG, JPG or WebP</p>
                  </div>
                </Field>

                <Field label="Cover Image">
                  <div className="flex items-center gap-3">
                    <ImageUpload
                      value={coverImage ? [coverImage] : []}
                      onChange={urls => setCoverImage(urls[0] ?? '')}
                      maxFiles={1}
                      storeId={storeId}
                    />
                    <p className="text-[11px] text-slate">PNG, JPG or WebP</p>
                  </div>
                </Field>

                <Field label="Favicon (browser tab icon)">
                  <div className="flex items-center gap-3">
                    <ImageUpload
                      value={faviconUrl ? [faviconUrl] : []}
                      onChange={urls => setFaviconUrl(urls[0] ?? '')}
                      maxFiles={1}
                      storeId={storeId}
                    />
                    <p className="text-[11px] text-slate">Square image works best. Falls back to your logo if not set.</p>
                  </div>
                </Field>
              </div>

              <Field label="Store Name *">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your store name"
                  className={inputCls}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your store…"
                  rows={4}
                  className={`${inputCls} resize-y min-h-[90px]`}
                />
              </Field>

              <Field label="Tagline">
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Handmade with love since 2020"
                  maxLength={100}
                  className={inputCls}
                />
                <p className="text-[11px] text-slate mt-1">A short line shown next to your store name on your storefront.</p>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Email">
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="support@yourstore.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Contact Phone">
                  <input
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+1 555 123 4567"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Low Stock Threshold">
                <input
                  type="number"
                  min={1}
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))}
                  className={inputCls}
                />
                <p className="text-[11px] text-slate mt-1">Products at or below this stock count are flagged "Low Stock" in your Inventory page and dashboard alerts.</p>
              </Field>

              <Field label="Tax Rate (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={taxRate}
                  onChange={e => setTaxRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className={inputCls}
                />
                <p className="text-[11px] text-slate mt-1">A flat percentage added to every order's subtotal at checkout. This is not a tax-compliance engine — set the rate that applies to your own business.</p>
              </Field>

              <Field label="Store URL">
                <input
                  value={store?.slug ?? ''}
                  readOnly
                  className={`${inputCls} text-slate cursor-default bg-[#f3f2ec]`}
                />
                <p className="text-[10px] text-slate mt-1">URL slug cannot be changed.</p>
              </Field>

              <Field label="Plan">
                <input
                  value={store?.plan ?? ''}
                  readOnly
                  className={`${inputCls} text-slate cursor-default bg-[#f3f2ec]`}
                />
              </Field>
            </div>

            {/* Right column */}
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
                      style={{
                        borderColor: active ? '#D97757' : '#E8E6DC',
                        background: active ? '#FBECE4' : '#FAF9F5',
                      }}
                    >
                      <div
                        className="w-[18px] h-[18px] rounded-[5px] shrink-0 flex items-center justify-center"
                        style={{
                          border: `2px solid ${active ? '#D97757' : '#CBCABA'}`,
                          background: active ? '#D97757' : 'transparent',
                        }}
                      >
                        {active && <CheckCircle size={11} className="text-white" />}
                      </div>
                      <span
                        className="text-[13px]"
                        style={{ fontWeight: active ? 600 : 400, color: active ? '#D97757' : '#141413' }}
                      >
                        {PRODUCT_TYPE_LABELS[t]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Payment methods */}
              <div className="mt-6 border-t border-bone pt-[18px]">
                <p className="text-[12px] font-semibold text-charcoal mb-3">Payment Methods</p>
                <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
                  <div>
                    <p className="text-[13px] font-medium text-charcoal">Cash on Delivery</p>
                    <p className="text-[11px] text-slate">Let buyers pay in cash when their physical order arrives.</p>
                  </div>
                  <Toggle checked={codEnabled} onChange={setCodEnabled} ariaLabel="Enable Cash on Delivery" />
                </div>

                {/* Payment capture method — Shopify's real "Automatically at
                   checkout" vs "Manually" setting. Only affects online
                   Stripe checkouts on a single-store cart — see
                   PaymentService.initiatePayment. */}
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
              </div>

              {/* Review moderation */}
              <div className="mt-6 border-t border-bone pt-[18px]">
                <p className="text-[12px] font-semibold text-charcoal mb-3">Reviews</p>
                <div className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
                  <div>
                    <p className="text-[13px] font-medium text-charcoal">Require review approval</p>
                    <p className="text-[11px] text-slate">New reviews stay hidden until you approve them. Off by default — reviews publish instantly.</p>
                  </div>
                  <Toggle checked={reviewModerationEnabled} onChange={setReviewModerationEnabled} ariaLabel="Require review approval" />
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
                      {enabledCurrencies === null
                        ? 'Off — buyers can pay in any currency this platform supports.'
                        : 'On — buyers can only pay in the currencies checked below.'}
                    </p>
                  </div>
                  <Toggle
                    checked={enabledCurrencies !== null}
                    ariaLabel="Restrict which currencies buyers can pay in"
                    onChange={v => {
                      // Turning restriction ON seeds the checklist from every
                      // currently-accepted currency (i.e. "everything, as it
                      // already was") so flipping this switch never itself
                      // narrows anything — the seller then deselects what
                      // they don't want. Turning it OFF clears back to `null`.
                      setEnabledCurrencies(v ? [...platformCurrencies] : null);
                    }}
                  />
                </div>

                {enabledCurrencies !== null && (
                  <div className="flex flex-col gap-2">
                    {platformCurrencies.map(c => {
                      const isBase = c === store?.baseCurrency;
                      const checked = enabledCurrencies.includes(c);
                      return (
                        <div key={c} className="flex items-center justify-between gap-3 px-[14px] py-3 rounded-[9px] border border-bone bg-cream">
                          <div>
                            <p className="text-[13px] font-medium text-charcoal">{c}{isBase ? ' (your store currency)' : ''}</p>
                          </div>
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

              {/* Read-only info */}
              <div className="mt-6 border-t border-bone pt-[18px]">
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

            {storeId && <DomainWhiteLabelCard storeId={storeId} store={store ? { customDomain: store.customDomain, customDomainStatus: store.customDomainStatus, whiteLabelEnabled: store.whiteLabelEnabled } : null} refetch={refetch} />}

            {storeId && <StorePrivacyCard storeId={storeId} store={store ? { privacyMode: store.privacyMode } : null} refetch={refetch} />}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
