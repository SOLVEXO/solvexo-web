import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Input, Select, Toggle } from '@/components/comman/ui';
import { EntityPickerField } from '@/features/seller/store/Dashboard/OnlineStore/builder/SchemaForm';
import { useToast } from '@/contexts/ToastContext';
import { apiListVariants, type ProductVariant } from '@/api/services/product';
import {
  apiGetBundle, apiGetCartUpsell, apiGetRecommendations, apiRemoveBundle, apiSetBundle, apiSetCartUpsell, apiSetPreorder, apiSetRecommendations,
  type BundleView, type CartUpsellSettings, type PreorderSettings, type RecommendationsView,
} from '@/api/services/merchandising';

const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);

interface CompRow { productId: string; variantId: string; quantity: number; name: string }

/** Bundle · Pre-order · Related products for ONE product (edit page). Self-contained: loads/saves through api/merchandising. */
export function MerchandisingCard({ storeId, productId, isPhysical }: { storeId: string; productId: string; isPhysical: boolean }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [bundle, setBundle] = useState<BundleView | null>(null);
  const [rows, setRows] = useState<CompRow[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [pre, setPre] = useState<Record<string, PreorderSettings>>({});
  const [recs, setRecs] = useState<RecommendationsView | null>(null);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([apiGetBundle(storeId, productId), apiListVariants(productId), apiGetRecommendations(storeId, productId)])
      .then(([b, v, r]) => {
        setBundle(b.data);
        setRows(b.data.components.map((c) => ({ productId: c.productId, variantId: c.variantId, quantity: c.quantity, name: c.name })));
        setVariants(v.data);
        setPre(Object.fromEntries(v.data.map((x) => [x._id, ((x as unknown as { preorder?: PreorderSettings | null }).preorder ?? { enabled: false, expectedDate: null, limit: null, message: null }) as PreorderSettings])));
        setRecs(r.data); setRelatedIds(r.data.related.map((x) => x.id));
        setError('');
      })
      .catch((e) => setError(msg(e, 'Could not load')));
  }, [storeId, productId]);
  useEffect(() => { load(); }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, okText?: string) => {
    if (busy) return;
    setBusy(key); setError('');
    try { await fn(); if (okText) toast.success(okText); load(); } catch (e) { setError(msg(e, 'Failed')); } finally { setBusy(null); }
  };

  // Components are picked as PRODUCTS; each uses its default variant (the API itself supports any variant).
  const pickComponents = async (ids: string[]) => {
    const next: CompRow[] = [];
    for (const id of ids.filter((i: string) => i !== productId).slice(0, 20)) {
      const existing = rows.find((r) => r.productId === id);
      if (existing) { next.push(existing); continue; }
      const vs = (await apiListVariants(id)).data;
      const v = vs.find((x) => x.isDefault) ?? vs[0];
      if (v) next.push({ productId: id, variantId: v._id, quantity: 1, name: id });
    }
    setRows(next);
  };

  if (!isPhysical) return null;
  return (
    <Card>
      <div className="flex flex-col gap-5">
        <p className="text-[14px] font-bold text-charcoal m-0">{t('merch.title')}</p>
        {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}

        <section aria-labelledby="bundle-h" className="flex flex-col gap-2">
          <p id="bundle-h" className="text-[13px] font-bold text-charcoal m-0">{t('merch.bundle')}</p>
          <p className="text-[12px] text-slate m-0">{t('merch.bundleHelp')}</p>
          <EntityPickerField mode="products" multiple value={rows.map((r) => r.productId)} storeId={storeId} label={t('merch.pickComponents')} onPick={(ids: string[]) => void pickComponents(ids)} />
          {rows.map((r, i) => (
            <div key={r.productId} className="flex items-center gap-2 text-[12.5px]">
              <span className="flex-1 truncate">{bundle?.components.find((c) => c.productId === r.productId)?.name ?? r.name}</span>
              <Input type="number" min={1} max={999} step={1} className="w-20" aria-label={t('merch.quantity')} value={r.quantity}
                onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, quantity: Math.max(1, Math.floor(Number(e.target.value) || 1)) } : x)))} />
            </div>
          ))}
          {bundle?.isBundle && (
            <p className="text-[12px] text-slate m-0" role="status">
              {t('merch.availability', { count: bundle.available ?? 0 })}{bundle.available === null ? ` (${t('merch.unlimited')})` : ''}
              {bundle.compareAtPrice != null ? ` · ${t('merch.compareAt', { amount: bundle.compareAtPrice })}` : ''}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" loading={busy === 'bundle'} disabled={rows.length === 0 || busy !== null} onClick={() => void run('bundle', () => apiSetBundle(storeId, productId, rows.map(({ productId: p, variantId: v, quantity }) => ({ productId: p, variantId: v, quantity }))), t('merch.saved'))}>{t('merch.saveBundle')}</Button>
            {bundle?.isBundle && <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void run('unbundle', () => apiRemoveBundle(storeId, productId), t('merch.saved'))}>{t('merch.removeBundle')}</Button>}
          </div>
        </section>

        {!bundle?.isBundle && (
          <section aria-labelledby="pre-h" className="flex flex-col gap-3">
            <p id="pre-h" className="text-[13px] font-bold text-charcoal m-0">{t('merch.preorder')}</p>
            <p className="text-[12px] text-slate m-0">{t('merch.preorderHelp')}</p>
            {variants.map((v) => {
              const p = pre[v._id];
              if (!p) return null;
              const set = (patch: Partial<PreorderSettings>) => setPre((s) => ({ ...s, [v._id]: { ...s[v._id], ...patch } }));
              return (
                <div key={v._id} className="border border-bone rounded-[10px] p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-semibold text-charcoal">{v.sku}{v.options?.length ? ` — ${v.options.map((o) => o.value).join(' / ')}` : ''}</span>
                    <Toggle checked={p.enabled} onChange={(on: boolean) => set({ enabled: on })} ariaLabel={t('merch.preorder')} />
                  </div>
                  {p.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Field label={t('merch.expectedDate')}><Input type="date" value={p.expectedDate ? String(p.expectedDate).slice(0, 10) : ''} onChange={(e) => set({ expectedDate: e.target.value || null })} /></Field>
                      <Field label={t('merch.limit')} hint={p.sold ? t('merch.sold', { count: p.sold }) : undefined}><Input type="number" min={1} step={1} value={p.limit ?? ''} onChange={(e) => set({ limit: e.target.value ? Math.floor(Number(e.target.value)) : null })} /></Field>
                      <Field label={t('merch.message')}><Input maxLength={200} value={p.message ?? ''} onChange={(e) => set({ message: e.target.value || null })} /></Field>
                    </div>
                  )}
                  <div><Button size="sm" variant="outline" loading={busy === `pre-${v._id}`} disabled={busy !== null} onClick={() => void run(`pre-${v._id}`, () => apiSetPreorder(storeId, v._id, p.enabled || p.expectedDate || p.limit ? p : null), t('merch.saved'))}>{t('merch.save')}</Button></div>
                </div>
              );
            })}
          </section>
        )}

        <section aria-labelledby="rel-h" className="flex flex-col gap-2">
          <p id="rel-h" className="text-[13px] font-bold text-charcoal m-0">{t('merch.related')}</p>
          <p className="text-[12px] text-slate m-0">{t('merch.relatedHelp')}</p>
          <EntityPickerField mode="products" multiple value={relatedIds} storeId={storeId} label={t('merch.pickRelated')} onPick={(ids: string[]) => setRelatedIds(ids.filter((i: string) => i !== productId).slice(0, 12))} />
          <div><Button size="sm" loading={busy === 'rel'} disabled={busy !== null} onClick={() => void run('rel', () => apiSetRecommendations(storeId, productId, { relatedProductIds: relatedIds }), t('merch.saved'))}>{t('merch.save')}</Button></div>
          {recs && recs.autoPreview.length > 0 && (
            <p className="text-[12px] text-slate m-0">{t('merch.autoPreview')}: {recs.autoPreview.map((x) => x.name).join(', ')}</p>
          )}
        </section>
      </div>
    </Card>
  );
}

/** Store-level cart upsell block settings. */
export function CartUpsellCard({ storeId }: { storeId: string }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [s, setS] = useState<CartUpsellSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { apiGetCartUpsell(storeId).then((r) => setS(r.data)).catch((e) => setError(msg(e, 'Could not load'))); }, [storeId]);
  if (!s) return error ? <p className="text-[12.5px] text-error" role="alert">{error}</p> : null;
  const save = async () => { if (saving) return; setSaving(true); setError(''); try { setS((await apiSetCartUpsell(storeId, s)).data); toast.success(t('merch.saved')); } catch (e) { setError(msg(e, 'Failed')); } finally { setSaving(false); } };
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <p className="text-[14px] font-bold text-charcoal m-0">{t('merch.cartUpsell')}</p>
        <div className="flex items-center justify-between"><span className="text-[12.5px]">{t('merch.cartUpsellHelp')}</span><Toggle checked={s.enabled} onChange={(on: boolean) => setS({ ...s, enabled: on })} ariaLabel={t('merch.cartUpsell')} /></div>
        {s.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Field label={t('merch.upsellTitle')}><Input maxLength={80} value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} /></Field>
            <Field label={t('merch.maxItems')}><Input type="number" min={1} max={8} value={s.maxItems} onChange={(e) => setS({ ...s, maxItems: Math.min(8, Math.max(1, Math.floor(Number(e.target.value) || 1))) })} /></Field>
            <Field label={t('merch.mode')}>
              <Select value={s.mode} onChange={(e) => setS({ ...s, mode: e.target.value as CartUpsellSettings['mode'] })}>
                <option value="complementary">{t('merch.modeComplementary')}</option><option value="related">{t('merch.modeRelated')}</option><option value="best_sellers">{t('merch.modeBest')}</option>
              </Select>
            </Field>
          </div>
        )}
        {error && <p className="text-[12.5px] text-error" role="alert">{error}</p>}
        <div><Button size="sm" onClick={() => void save()} loading={saving}>{t('merch.save')}</Button></div>
      </div>
    </Card>
  );
}
