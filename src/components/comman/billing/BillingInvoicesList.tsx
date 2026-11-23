import { PageJump } from '@/components/comman/ui/Pagination';
import { useEffect, useState } from 'react';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';
import { apiGetStoreInvoices, type PlatformPlanInvoice } from '@/api/services/platformPlans';
import { openSolvexoInvoice } from '@/utils/solvexoInvoice';
import { useToast } from '@/contexts/ToastContext';

const PER_PAGE = 10;
const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-success-bg text-success',
  pending: 'bg-warning-bg text-warning',
  failed: 'bg-error-bg text-error',
  refunded: 'bg-bone text-slate',
  partially_refunded: 'bg-bone text-slate',
};
const STATUS_LABEL: Record<string, string> = { paid: 'Paid', pending: 'Pending', failed: 'Failed', refunded: 'Refunded', partially_refunded: 'Partly refunded' };

/** The seller's Solvexo invoices (paged): number, date, amount with tax, status, refund, and invoice / download / pay links. */
export function BillingInvoicesList({ storeId, refreshKey = 0 }: { storeId: string; refreshKey?: number }) {
  const toast = useToast();
  const [invoices, setInvoices] = useState<PlatformPlanInvoice[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading flag for a data fetch
    setLoading(true); setError('');
    apiGetStoreInvoices(storeId, { page, limit: PER_PAGE })
      .then(res => {
        if (cancelled) return;
        setInvoices(res.data.invoices); setTotal(res.data.total); setPages(Math.max(1, res.data.pages));
        // A page past the end (e.g. after a refund shrinks the list) falls back to the last real page.
        if (res.data.invoices.length === 0 && res.data.total > 0 && page > 1) setPage(Math.max(1, res.data.pages));
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load invoices.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, nonce, refreshKey]);

  const show = async (invoiceId: string) => {
    setOpening(invoiceId);
    try { await openSolvexoInvoice(storeId, invoiceId); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Could not open the invoice.'); }
    finally { setOpening(null); }
  };

  if (loading && invoices.length === 0 && !error) {
    return <div className="flex flex-col gap-3 px-5 py-5">{Array.from({ length: 4 }, (_, i) => <SkeletonBox key={i} height="44px" />)}</div>;
  }
  if (error) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
        <p className="text-[13px] text-error">{error}</p>
        <Button size="sm" variant="outline" onClick={() => setNonce(n => n + 1)}>Retry</Button>
      </div>
    );
  }
  if (invoices.length === 0) return <p className="px-5 py-10 text-center text-[13px] text-slate">No invoices yet. They appear here after your first payment.</p>;

  return (
    <>
      <ul className="flex flex-col" aria-busy={loading}>
        {invoices.map(inv => (
          <li key={inv._id} className="flex items-center justify-between gap-3 flex-wrap px-5 py-3 border-b border-fog last:border-b-0">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-charcoal">{inv.invoiceNumber}</p>
              <p className="text-[11.5px] text-slate">
                {new Date(inv.createdAt).toLocaleDateString()} · ${inv.amountUSD.toFixed(2)}
                {(inv.taxAmountUSD ?? 0) > 0 && (
                  <span> (${(inv.subtotalUSD ?? inv.amountUSD - (inv.taxAmountUSD ?? 0)).toFixed(2)} + ${(inv.taxAmountUSD ?? 0).toFixed(2)} {inv.taxLabel ?? 'Tax'}{inv.taxRatePercent ? ` ${inv.taxRatePercent}%` : ''})</span>
                )}
                {inv.refundedAmountUSD > 0 && <span className="text-error"> · ${inv.refundedAmountUSD.toFixed(2)} refunded</span>}
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-full ${STATUS_STYLE[inv.status] ?? 'bg-bone text-slate'}`}>{STATUS_LABEL[inv.status] ?? inv.status}</span>
              {inv.status !== 'failed' && (
                <button type="button" onClick={() => show(inv._id)} disabled={opening === inv._id} className="text-[11px] font-semibold text-brand-orange hover:underline disabled:opacity-60 cursor-pointer">
                  {opening === inv._id ? 'Opening…' : 'Invoice'}
                </button>
              )}
              {(inv.hostedInvoiceUrl || inv.invoicePdfUrl) && (
                <a href={inv.status === 'failed' ? (inv.hostedInvoiceUrl ?? inv.invoicePdfUrl ?? '#') : (inv.invoicePdfUrl ?? inv.hostedInvoiceUrl ?? '#')} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-brand-orange hover:underline">
                  {inv.status === 'failed' ? 'Pay now' : 'Download'}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-fog">
          <span className="text-[11.5px] text-slate" aria-live="polite">Page {page} of {pages} · {total} invoices</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</Button>
            <PageJump page={page} totalPages={pages} onChange={setPage} />
          </div>
        </div>
      )}
    </>
  );
}
