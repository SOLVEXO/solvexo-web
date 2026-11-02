import { formatMoney } from '@/utils/currency';
import type { SupplierDetail } from '@/api/services/purchaseOrders';

const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—');
const optionText = (o: { value: string }[]) => (o.length ? ` — ${o.map(x => x.value).join(' / ')}` : '');

/** What the supplier's page shows: contact, orders, what was bought, returns. */
export function SupplierDetailBody({ detail, currency, onOpenPo }: { detail: SupplierDetail; currency: string; onOpenPo: (id: string) => void }) {
  const s = detail.supplier;
  const facts: [string, string | null | undefined][] = [
    ['Contact', s.contactName], ['Email', s.email], ['Phone', s.phone], ['Address', [s.address, s.city, s.country].filter(Boolean).join(', ') || null],
    ['Lead time', s.leadTimeDays != null ? `${s.leadTimeDays} day${s.leadTimeDays === 1 ? '' : 's'}` : null], ['Payment terms', s.paymentTerms], ['Notes', s.notes],
  ];
  const head = 'text-[11px] uppercase tracking-wide text-slate font-semibold mb-1.5';
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0">
        {facts.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}><dt className="text-[11px] text-slate">{k}</dt><dd className="m-0 text-[13px] text-charcoal break-words">{v}</dd></div>
        ))}
        {facts.every(([, v]) => !v) && <p className="m-0 text-[12.5px] text-slate">No contact details saved yet.</p>}
      </dl>

      <section>
        <p className={head}>Recent purchase orders</p>
        {detail.recentPurchaseOrders.length === 0 ? <p className="m-0 text-[12.5px] text-slate">No purchase orders yet.</p> : (
          <ul className="m-0 p-0 list-none border border-bone rounded-lg divide-y divide-bone">
            {detail.recentPurchaseOrders.map(po => (
              <li key={po._id}>
                <button type="button" onClick={() => onOpenPo(po._id)} className="w-full flex items-center justify-between gap-3 px-3 py-2 bg-transparent border-0 cursor-pointer text-left hover:bg-mist">
                  <span className="text-[13px] font-medium text-charcoal">{po.poNumber}</span>
                  <span className="text-[12px] text-slate">{when(po.createdAt)} · {po.status.replace(/_/g, ' ')} · {formatMoney(po.total, po.currency || currency)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.preferredProducts.length > 0 && (
        <section>
          <p className={head}>Preferred supplier for ({detail.preferredProducts.length})</p>
          <p className="m-0 text-[13px] text-charcoal">{detail.preferredProducts.map(p => p.name).join(', ')}</p>
          <p className="m-0 mt-1 text-[11px] text-slate">Reorder suggestions for these products go to this supplier.</p>
        </section>
      )}

      <section>
        <p className={head}>Products bought from this supplier</p>
        {detail.products.length === 0 ? <p className="m-0 text-[12.5px] text-slate">Nothing ordered yet.</p> : (
          <div className="border border-bone rounded-lg overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead><tr className="text-left text-slate"><th className="px-3 py-2 font-medium">Product</th><th className="px-3 py-2 font-medium">SKU</th><th className="px-3 py-2 font-medium text-right">Last cost</th><th className="px-3 py-2 font-medium text-right">Qty ordered</th></tr></thead>
              <tbody>
                {detail.products.map(p => (
                  <tr key={p.variantId} className="border-t border-bone">
                    <td className="px-3 py-2 text-charcoal">{p.name}{optionText(p.options)}</td>
                    <td className="px-3 py-2 text-slate">{p.sku ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(p.lastUnitCost, currency)}</td>
                    <td className="px-3 py-2 text-right">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <p className={head}>Recent returns to this supplier</p>
        {detail.recentReturns.length === 0 ? <p className="m-0 text-[12.5px] text-slate">No returns.</p> : (
          <ul className="m-0 p-0 list-none border border-bone rounded-lg divide-y divide-bone">
            {detail.recentReturns.map(r => (
              <li key={r._id} className="px-3 py-2 flex items-center justify-between text-[12.5px]"><span className="text-charcoal">{when(r.createdAt)}</span><span className="text-slate">{r.total != null ? formatMoney(r.total, currency) : ''}{r.status ? ` · ${r.status}` : ''}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
