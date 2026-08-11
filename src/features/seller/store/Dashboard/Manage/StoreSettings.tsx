import { useState, useEffect } from 'react';
import { Save, Store, Loader2, CheckCircle, AlertCircle, Globe, Lock, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader, StoreNavMenu } from '@/components/layouts/StoreLayout';
import { apiUpdateStore, apiSetCustomDomain, apiSetWhiteLabel, type ProductType } from '@/api/services/store';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { apiGetCategoryTree, type CategoryNode } from '@/api/services/categories';
import { useMyStores } from '@/hooks/store/useMyStores';
import { ImageUpload, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { TabBar, type Tab } from '@/components/comman/ui/TabBar';
import { ActivityLogTab } from './tabs/ActivityLogTab';

const TABS: Tab[] = [
  { id: 'general',  label: 'General' },
  { id: 'activity', label: 'Activity Log' },
];

const STORE_SETTINGS_NAV: { id: string; label: string; Icon: typeof Store }[] = [
  { id: 'general',  label: 'General',      Icon: Store   },
  { id: 'activity', label: 'Activity Log', Icon: History },
];

// ── Mobile-only store hero — same native-app account-hub pattern already
// built for the top-level Seller Settings page (avatar/name/identity + a
// real stats strip), just re-keyed to a STORE's identity (logo, slug,
// marketplace status) instead of a person's. Products/Revenue come from the
// same useMyStores() list the "My Stores" page already uses — never
// fabricated numbers.
function MobileStoreHero({
  name, slug, logo, status, productCount, totalSalesUSD, aiCredits, loading,
}: {
  name?: string; slug?: string; logo?: string | null; status?: string;
  productCount: number | null; totalSalesUSD: number | null; aiCredits: number; loading: boolean;
}) {
  return (
    <div className="lg:hidden -mx-4 -mt-3">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-orange via-[#d98a6f] to-[#f0b8a0] px-6 pt-8 pb-12 flex flex-col items-center text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        {logo ? (
          <img
            loading="lazy" decoding="async"
            src={logo} alt={name ?? 'Store'}
            className="relative size-24 rounded-full object-cover ring-4 ring-white/40 bg-white"
          />
        ) : (
          <div className="relative size-24 rounded-full bg-white/15 ring-4 ring-white/40 flex items-center justify-center text-white text-[26px] font-bold">
            {name ? name.slice(0, 2).toUpperCase() : 'ST'}
          </div>
        )}
        <p className="relative text-[19px] font-bold text-white mt-3 leading-tight">{name ?? 'Your Store'}</p>
        {slug && <p className="relative text-[13px] text-white/75 mt-[2px]">/{slug}</p>}
        <span className="relative inline-flex mt-3 px-4 py-[6px] rounded-full bg-white/20 text-[11px] font-semibold text-white capitalize">
          {(status ?? 'pending').replace(/_/g, ' ')}
        </span>
      </div>

      <div className="relative -mt-6 mx-4 rounded-t-[24px] bg-white px-2 pt-5 pb-4 flex items-center">
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{loading || productCount == null ? '—' : productCount}</span>
          <span className="text-[11px] text-slate">Products</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">
            {loading || totalSalesUSD == null ? '—' : `$${totalSalesUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          </span>
          <span className="text-[11px] text-slate">Revenue</span>
        </div>
        <div className="w-px h-9 bg-bone" />
        <div className="flex-1 flex flex-col items-center gap-[2px]">
          <span className="text-[19px] font-bold text-brand-orange leading-none">{aiCredits.toLocaleString()}</span>
          <span className="text-[11px] text-slate">AI Credits</span>
        </div>
      </div>
    </div>
  );
}

// ── Mobile-only navigation menu — same grouped card-list pattern as Seller
// Settings; only 2 real destinations exist on this page (General, Activity
// Log), so it's one group rather than several — no filler items added just
// to look fuller.
function MobileStoreMenu({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="lg:hidden bg-white border border-bone rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate">Store</p>
      </div>
      <div className="divide-y divide-[#f5f4ef]">
        {STORE_SETTINGS_NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-[13px] bg-transparent border-0 cursor-pointer text-left transition-colors ${isActive ? 'bg-cream' : 'hover:bg-cream'}`}
            >
              <div className="w-8 h-8 rounded-[9px] bg-brand-pale-orange flex items-center justify-center shrink-0">
                <item.Icon size={15} className="text-brand-orange" />
              </div>
              <span className="flex-1 text-[13px] font-medium text-charcoal">{item.label}</span>
              <ChevronRight size={15} className="text-slate shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  physical_products:     'Physical Products',
  digital_downloads:     'Digital Downloads',
  educational_resources: 'Educational Resources',
  services:              'Services',
  in_person_pos:          'In-Person / POS',
};
const ALL_PRODUCT_TYPES: ProductType[] = [
  'physical_products', 'digital_downloads', 'educational_resources', 'services', 'in_person_pos',
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

// ── Custom Domain & White Label ─────────────────────────────────────────────
function DomainWhiteLabelCard({ storeId, store, refetch }: { storeId: string; store: { customDomain: string | null; whiteLabelEnabled: boolean } | null; refetch: () => void }) {
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [domain, setDomain] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [savingWhiteLabel, setSavingWhiteLabel] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiGetStoreEntitlements(storeId).then(res => setEntitlements(res.data)).catch(() => {});
  }, [storeId]);

  useEffect(() => { setDomain(store?.customDomain ?? ''); }, [store?.customDomain]);

  const domainFeature = entitlements?.customDomainAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const whiteLabelFeature = entitlements?.whiteLabelAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;

  async function saveDomain() {
    setSavingDomain(true); setMsg('');
    try {
      await apiSetCustomDomain(storeId, domain.trim() || null);
      refetch();
      setMsg('Custom domain updated.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to update domain.');
    } finally {
      setSavingDomain(false);
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
          <div className="flex gap-2">
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="shop.yourbrand.com" className={inputCls} />
            <Button size="sm" loading={savingDomain} onClick={saveDomain}>Save</Button>
          </div>
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StoreSettings() {
  const { store, storeId, loading, refetch } = useStoreWorkspace();
  const { stores: myStores } = useMyStores();
  const thisStoreListItem = myStores.find(s => s._id === storeId);

  const [activeTab, setActiveTab] = useState('general');
  // Mobile-only: whether we've drilled into a tab from the store account-hub
  // menu below — mirrors the same drill-in pattern just built for the
  // top-level Seller Settings page. Desktop ignores this; it always shows
  // the TabBar + content.
  const [mobileDrilledIn, setMobileDrilledIn] = useState(false);
  const [name,         setName]         = useState('');
  const [description,  setDescription]  = useState('');
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [logo,         setLogo]         = useState('');
  const [coverImage,   setCoverImage]   = useState('');
  const [categoryId,   setCategoryId]   = useState('');
  const [codEnabled,   setCodEnabled]   = useState(true);
  const [categories,   setCategories]   = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saveMsg,      setSaveMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  // Sync form when store loads
  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description ?? '');
    setProductTypes(store.productTypes ?? []);
    setLogo(store.logo ?? '');
    setCoverImage(store.coverImage ?? '');
    setCategoryId(store.categoryId ?? '');
    setCodEnabled(store.codEnabled !== false);
  }, [store]);

  useEffect(() => {
    apiGetCategoryTree()
      .then(res => setCategories(res.data ?? []))
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

  const toggleType = (t: ProductType) =>
    setProductTypes(prev => prev.includes(t) ? prev.filter(p => p !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!storeId || saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiUpdateStore({ storeId, name, description, productTypes, logo, coverImage, categoryId, codEnabled });
      refetch();
      setSaveMsg({ ok: true, text: 'Store updated successfully.' });
    } catch (err) {
      setSaveMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to update store.' });
    } finally {
      setSaving(false);
    }
  };

  // For the full store-section list rendered below the local General/
  // Activity Log menu (same lock rules as everywhere else in the workspace).
  const posEnabled = store?.enabledTools?.includes('pos_register') ?? false;
  const verified   = store?.status === 'active';

  const isDirty =
    !!store &&
    (name !== store.name ||
      description !== (store.description ?? '') ||
      logo !== (store.logo ?? '') ||
      coverImage !== (store.coverImage ?? '') ||
      categoryId !== (store.categoryId ?? '') ||
      JSON.stringify(productTypes.slice().sort()) !==
        JSON.stringify((store.productTypes ?? []).slice().sort()) ||
      codEnabled !== (store.codEnabled !== false));

  return (
    <div>
      <StorePageHeader
        title="Store Settings"
        subtitle={store?.name ?? ''}
        actions={
          activeTab === 'general' ? (
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
          ) : undefined
        }
      />

      {/* Mobile-only account hub — hero (logo/name/status + real Products/
         Revenue/AI Credits stats) + a grouped menu, replacing the TabBar
         below on small screens. Hidden once a tab has been opened. */}
      {!mobileDrilledIn && (
        <div className="lg:hidden flex flex-col gap-4 px-4 mb-5">
          <MobileStoreHero
            name={store?.name}
            slug={store?.slug}
            logo={store?.logo}
            status={store?.status}
            productCount={thisStoreListItem?.productCount ?? null}
            totalSalesUSD={thisStoreListItem?.totalSalesUSD ?? null}
            aiCredits={store?.aiCredits ?? 0}
            loading={loading}
          />
          <MobileStoreMenu active={activeTab} onSelect={id => { setActiveTab(id); setMobileDrilledIn(true); }} />

          {/* Every other store section — Sales/Catalog/Customers/Growth/
             Finance, plus Integrations/Business Verification from the
             Settings group ('settings' itself is excluded since the local
             General tab above already covers it). This is the one place
             the full store workspace list lives on mobile — not the
             Dashboard, which stays a pure metrics page. */}
          <StoreNavMenu storeId={storeId} verified={verified} posEnabled={posEnabled} excludeItemIds={['settings']} />
        </div>
      )}

      {/* Mobile-only back bar — shown only once a tab is open. */}
      {mobileDrilledIn && (
        <div className="lg:hidden flex items-center gap-2 px-4 mb-1">
          <button
            onClick={() => setMobileDrilledIn(false)}
            aria-label="Back to store menu"
            className="size-8 -ml-1 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer text-charcoal hover:bg-cream transition-colors"
          >
            <ChevronLeft size={19} />
          </button>
          <p className="text-[15px] font-bold text-carbon">{TABS.find(t => t.id === activeTab)?.label ?? 'Settings'}</p>
        </div>
      )}

      <div className="hidden lg:block px-4 md:px-7 pt-3">
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      <div className={mobileDrilledIn ? 'block' : 'hidden lg:block'}>
      {activeTab === 'activity' ? (
        <div className="px-4 lg:px-7 py-6">
          <ActivityLogTab />
        </div>
      ) : loading ? <SettingsSkeleton /> : (
        <div className="px-4 lg:px-7 py-6">

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
                    />
                    <p className="text-[11px] text-slate">PNG, JPG or WebP</p>
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

              <Field label="Category">
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">{categoriesLoading ? 'Loading categories…' : 'Select a category…'}</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
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
                  <Toggle checked={codEnabled} onChange={setCodEnabled} />
                </div>
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

            {storeId && <DomainWhiteLabelCard storeId={storeId} store={store ? { customDomain: store.customDomain, whiteLabelEnabled: store.whiteLabelEnabled } : null} refetch={refetch} />}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
