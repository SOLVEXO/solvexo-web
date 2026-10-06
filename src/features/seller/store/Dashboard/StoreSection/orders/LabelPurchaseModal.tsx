import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal, Button, Field, Select, SkeletonBox } from '@/components/comman/ui';
import type { LabelRate } from '@/api/services/orders';
import { apiListStoreIntegrations, type ShippingPackage } from '@/api/services/integrations';
import { currencySymbol } from '@/utils/currency';

/** Shared Shopify-style label purchase dialog: pick a package, choose a carrier rate, buy.
 *  The caller supplies how rates are loaded and what "buy" does (shipping label, partial-shipment label, return label). */
export function LabelPurchaseModal({ storeId, title, buyLabel, intro, loadRates, purchase, onClose, onPurchased }: {
  storeId: string;
  title: string;
  buyLabel: string;
  intro?: ReactNode;
  loadRates: (packageId: string) => Promise<LabelRate[]>;
  purchase: (choice: { rateId: string; packageId: string }) => Promise<unknown>;
  onClose: () => void;
  onPurchased: () => void;
}) {
  const [packages, setPackages] = useState<ShippingPackage[]>([]);
  const [packageId, setPackageId] = useState('');
  const [rates, setRates] = useState<LabelRate[]>([]);
  const [rateId, setRateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  // Callers pass inline closures — keep the latest in a ref so rate loading only re-runs on demand.
  const loadRef = useRef(loadRates);
  useEffect(() => { loadRef.current = loadRates; });

  // Saved packages live on the Shippo integration; staff without integration
  // access just quote with the store's default package (no picker shown).
  useEffect(() => {
    let cancelled = false;
    apiListStoreIntegrations(storeId)
      .then(res => {
        if (cancelled) return;
        const list = res.data.shipping?.config?.packages;
        if (Array.isArray(list)) setPackages(list as ShippingPackage[]);
      })
      .catch(() => { /* optional */ });
    return () => { cancelled = true; };
  }, [storeId]);

  const fetchRates = useCallback((pkg: string) => {
    return loadRef.current(pkg)
      .then(list => {
        setRates(list);
        if (list.length > 0) setRateId(list[0].rateId);
      })
      .catch((err: unknown) => { setRates([]); setLoadError(err instanceof Error ? err.message : 'Failed to load shipping rates.'); })
      .finally(() => setLoading(false));
  }, []);

  const reload = (pkg: string) => {
    setLoading(true); setLoadError(''); setRateId(''); setBuyError('');
    void fetchRates(pkg);
  };

  useEffect(() => { void fetchRates(''); }, [fetchRates]);

  const buy = () => {
    if (!rateId) return;
    setBuying(true); setBuyError('');
    purchase({ rateId, packageId })
      .then(() => onPurchased())
      .catch((err: unknown) => setBuyError(err instanceof Error ? err.message : 'Failed to buy the label.'))
      .finally(() => setBuying(false));
  };

  return (
    <Modal
      title={title}
      width={520}
      mobileSheet
      onClose={() => { if (!buying) onClose(); }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={buying}>Cancel</Button>
          <Button size="sm" onClick={buy} loading={buying} disabled={loading || !rateId}>{buyLabel}</Button>
        </>
      }
    >
      {intro}
      {packages.length > 0 && (
        <Field label="Package">
          <Select value={packageId} onChange={e => { setPackageId(e.target.value); reload(e.target.value); }} disabled={buying || loading}>
            <option value="">Default package</option>
            {packages.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.length}×{p.width}×{p.height} {p.unit}){p.isDefault ? ' — default' : ''}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <p className="text-[12px] font-semibold text-charcoal mt-3 mb-2">Carrier rates</p>
      {loading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading rates">
          {[0, 1, 2].map(i => <SkeletonBox key={i} height="52px" rounded="10px" />)}
        </div>
      ) : loadError ? (
        <div className="rounded-[10px] bg-error-bg px-3.5 py-3" role="alert">
          <p className="text-[12.5px] text-error mb-2">{loadError}</p>
          <Button size="sm" variant="outline" onClick={() => reload(packageId)}><RefreshCw size={13} /> Retry</Button>
        </div>
      ) : rates.length === 0 ? (
        <p className="text-[12.5px] text-slate">
          No carrier rates are available. Check the address and your Shippo carrier accounts, or close this and enter tracking details manually.
        </p>
      ) : (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label="Carrier rates">
          {rates.map(r => (
            <label
              key={r.rateId}
              className={`flex items-center gap-3 border rounded-[10px] px-3.5 py-2.5 cursor-pointer ${rateId === r.rateId ? 'border-brand-orange bg-[#FFF7F0]' : 'border-bone bg-white'}`}
            >
              <input type="radio" name="label-rate" checked={rateId === r.rateId} onChange={() => setRateId(r.rateId)} disabled={buying} />
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-carbon truncate">{r.carrier} — {r.service}</span>
                <span className="block text-[11.5px] text-slate">
                  {r.estimatedDays != null ? `${r.estimatedDays} day${r.estimatedDays === 1 ? '' : 's'}` : 'Delivery estimate unavailable'}
                </span>
              </span>
              <span className="text-[13px] font-bold text-carbon shrink-0">{currencySymbol(r.currency)}{r.amount.toFixed(2)}</span>
            </label>
          ))}
        </div>
      )}
      {buyError && <p className="text-[12px] text-error mt-3" role="alert">{buyError}</p>}
    </Modal>
  );
}
