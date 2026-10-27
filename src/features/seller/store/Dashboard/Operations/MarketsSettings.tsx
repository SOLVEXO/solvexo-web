import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Globe, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/comman/ui';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { Modal } from '@/components/comman/ui/Modal';
import { SettingsCard } from '@/components/comman/settings';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { useToast } from '@/contexts/ToastContext';
import { apiGetEnabledCurrencies } from '@/api/services/store';
import {
  apiCreateSellerMarket, apiDeleteSellerMarket, apiWarmUiLocales, apiListSellerMarkets, apiUpdateSellerMarket,
  type SellerMarket, type SellerMarketPayload,
} from '@/api/services/marketsSeller';
import { languageName } from '@/utils/languages';
import { COUNTRY_OPTIONS } from '@/utils/countries';
import { MarketEditorModal } from './markets/MarketEditorModal';

const COUNTRY_NAME = new Map(COUNTRY_OPTIONS.map(c => [c.code, c.name]));
const errText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

function countriesSummary(codes: string[]): string {
  if (codes.length === 0) return 'All other countries';
  const names = codes.map(c => COUNTRY_NAME.get(c) ?? c);
  return names.length > 4 ? `${names.slice(0, 4).join(', ')} +${names.length - 4} more` : names.join(', ');
}

/** Settings → Markets: one market per country group, each with its own currency, languages, address and pricing rules. */
export function MarketsSettings({ embedded = false }: { embedded?: boolean }) {
  const { storeId, store } = useStoreWorkspace();
  const toast = useToast();
  const [markets, setMarkets] = useState<SellerMarket[]>([]);
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<SellerMarket | 'new' | null>(null);
  const [deleting, setDeleting] = useState<SellerMarket | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);
  const load = useCallback(() => { setLoading(true); setError(''); setReloadKey(k => k + 1); }, []);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    Promise.all([apiListSellerMarkets(storeId), apiGetEnabledCurrencies()])
      .then(([m, c]) => {
        if (cancelled) return;
        setMarkets(m.data ?? []);
        setCurrencies((c.data ?? []).map(x => x.code));
      })
      .catch(err => { if (!cancelled) setError(errText(err, 'Failed to load markets.')); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, reloadKey]);

  const save = async (payload: SellerMarketPayload) => {
    if (editing && editing !== 'new') await apiUpdateSellerMarket(storeId, editing._id, payload);
    else await apiCreateSellerMarket(storeId, payload);
    apiWarmUiLocales(payload.languages ?? []);
    toast.success(editing && editing !== 'new' ? 'Market saved.' : 'Market added.');
    setEditing(null);
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await apiDeleteSellerMarket(storeId, deleting._id);
      toast.success(`"${deleting.name}" deleted.`);
      setDeleting(null);
      load();
    } catch (err) {
      setDeleteError(errText(err, 'Failed to delete the market.'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const addButton = <Button size="sm" icon={<Plus size={13} />} onClick={() => setEditing('new')}>Add market</Button>;

  // No skeleton — a settings tab switch must show content immediately, so
  // nothing renders until the list lands and then it appears in one go.
  if (loading) return null;

  return (
    <div className={embedded ? 'flex w-full flex-col gap-5' : 'flex w-full flex-col gap-5 px-4 lg:px-7 pt-5 pb-10'}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[18px] font-bold text-carbon leading-tight">Markets</h2>
          <p className="text-[12.5px] text-slate mt-0.5 leading-relaxed">
            Sell to different countries with a local currency, languages and pricing rules. A buyer is matched to the first active market that lists their country, otherwise to your primary market.
          </p>
        </div>
        {!error && markets.length > 0 && addButton}
      </div>

      {error && (
        <div role="alert">
          <SettingsCard
            tone="danger"
            icon={<AlertCircle size={14} />}
            title="Couldn't load markets"
            description={error}
            actions={<Button size="sm" variant="outline" icon={<RefreshCw size={12} />} onClick={load}>Retry</Button>}
          />
        </div>
      )}

      {!error && markets.length === 0 && (
        <EmptyState
          icon={<Globe size={28} className="text-brand-orange" />}
          title="No markets yet"
          description="Add a market to sell in another currency or language. Until then every buyer sees your store's own currency."
          action={{ label: 'Add market', onClick: () => setEditing('new'), icon: <Plus size={14} /> }}
        />
      )}

      {!error && markets.length > 0 && (
        <ul className="m-0 p-0 list-none grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))]">
          {markets.map(m => (
            <li key={m._id} className="rounded-xl border border-bone bg-white p-4 flex flex-col gap-3 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-carbon truncate">{m.name}</p>
                  <p className="text-[12px] text-slate mt-0.5">{countriesSummary(m.countries)}</p>
                </div>
                <div className="flex flex-wrap gap-1 justify-end shrink-0">
                  {m.isPrimary && <span className="text-[10.5px] font-semibold rounded-full bg-brand-pale-orange text-brand-deep-orange px-2 py-0.5">Primary</span>}
                  <span className={`text-[10.5px] font-semibold rounded-full px-2 py-0.5 ${m.isActive ? 'bg-success-bg text-success' : 'bg-cream text-slate'}`}>{m.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                <div><dt className="text-slate">Currency</dt><dd className="m-0 font-medium text-charcoal">{m.currency}</dd></div>
                <div><dt className="text-slate">Languages</dt><dd className="m-0 font-medium text-charcoal">{m.languages.length ? m.languages.map(languageName).join(', ') : 'Store default'}</dd></div>
                <div><dt className="text-slate">Address</dt><dd className="m-0 font-medium text-charcoal truncate">{m.domainType === 'subfolder' && m.subfolder ? `/${m.subfolder}` : m.domainType === 'subdomain' && m.domain ? m.domain : 'Main store address'}</dd></div>
                <div><dt className="text-slate">Pricing</dt><dd className="m-0 font-medium text-charcoal">{pricingLabel(m)}</dd></div>
              </dl>
              <div className="flex gap-2 mt-auto pt-1">
                <Button size="xs" variant="outline" icon={<Pencil size={12} />} onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}>Edit</Button>
                <Button size="xs" variant="ghost" icon={<Trash2 size={12} />} onClick={() => { setDeleteError(''); setDeleting(m); }} aria-label={`Delete ${m.name}`}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <MarketEditorModal
          key={editing === 'new' ? 'new' : editing._id}
          market={editing === 'new' ? null : editing}
          currencies={currencies.length ? currencies : ['USD']}
          storeCurrency={store?.baseCurrency ?? 'USD'}
          storeLanguage={store?.defaultLanguage ?? 'en'}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && (
        <Modal
          title="Delete market"
          onClose={() => { if (!deleteBusy) setDeleting(null); }}
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setDeleting(null)} disabled={deleteBusy}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteBusy}>Delete market</Button>
            </>
          )}
        >
          <p className="text-[13px] text-charcoal">Delete <b>{deleting.name}</b>? Buyers in its countries will fall back to your primary market.</p>
          {deleteError && <p role="alert" className="mt-2 text-[12.5px] text-error">{deleteError}</p>}
        </Modal>
      )}
    </div>
  );
}

function pricingLabel(m: SellerMarket): string {
  const r = m.pricingRule;
  const parts = [r.type === 'percentage' && r.percentageAdjustment ? `Rate ${r.percentageAdjustment > 0 ? '+' : ''}${r.percentageAdjustment}%` : 'Exchange rate'];
  if (r.conversionFee) parts.push(`${r.conversionFee}% fee`);
  if (r.useRounding) parts.push(`rounded ${r.roundingRule === 'nearest' ? 'to unit' : r.roundingRule === '1.00' ? 'whole' : `.${(r.roundingRule ?? '').slice(2)}`}`);
  return parts.join(', ');
}

