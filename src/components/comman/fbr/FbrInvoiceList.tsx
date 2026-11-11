import { useState } from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';
import { Button, Input, Select } from '@/components/comman/ui';
import { useKeyedLoad } from '@/components/comman/dashboard/useKeyedLoad';
import { useToast } from '@/contexts/ToastContext';
import type { FbrInvoiceRow, FbrList, FbrResolveInput, FbrStats, FbrStatus } from '@/api/services/fbrDi';

const FBR_STATUS_LABEL: Record<FbrStatus, string> = {
  pending: 'Waiting to be sent', submitted: 'Filed with FBR', failed: 'Failed — will retry', rejected: 'Rejected by FBR',
  needs_info: 'Needs your details', needs_review: 'Needs a credit/debit note', skipped: 'Skipped',
  held_rule: 'On hold: tax treatment not verified', unknown_outcome: 'Outcome unknown: check the FBR portal',
};
const TONE: Record<FbrStatus, string> = {
  pending: 'bg-bone text-slate', submitted: 'bg-success-bg text-success', failed: 'bg-warning-bg text-warning',
  rejected: 'bg-error-bg text-error', needs_info: 'bg-warning-bg text-warning', needs_review: 'bg-warning-bg text-warning', skipped: 'bg-bone text-slate',
  held_rule: 'bg-bone text-charcoal', unknown_outcome: 'bg-error-bg text-error',
};

/** Same shape the server checks: 7-digit NTN (or 13-digit CNIC), then "DI", then 13 digits. The server is the real check. */
const FBR_NUMBER = /^(\d{7}|\d{13})DI\d{13}$/;

function errMsg(e: unknown, fallback: string) { return e instanceof Error && e.message ? e.message : fallback; }
const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

interface Props {
  load: (p: { status?: string; page?: number }) => Promise<FbrList>;
  retry?: (id: string) => Promise<unknown>;
  /** Settles an invoice whose outcome is unknown (once per invoice). Leave out to hide the buttons (a person without that right). */
  resolve?: (id: string, body: FbrResolveInput) => Promise<unknown>;
  /** Bump to reload from outside (after saving settings). */
  refreshKey?: number;
  stats?: FbrStats | null;
  /** Label for the first column ("Invoice" / "Order"). */
  referenceLabel: string;
}

/**
 * FBR invoices with status, FBR number, the exact problem when something failed, Send again, and (for an unknown outcome) the two
 * ways to settle it after looking at the FBR portal. Loading / empty / error-with-retry states included.
 */
export function FbrInvoiceList({ load, retry, resolve, refreshKey = 0, stats, referenceLabel }: Props) {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<{ id: string; mode: 'filed' | 'resend' } | null>(null);
  const [number, setNumber] = useState('');
  // The result is tied to its request key, so a new filter / page / refresh shows the loading state again without setState in an effect.
  const { data, error, retry: reload } = useKeyedLoad(() => load({ status: status || undefined, page }), `${status}|${page}|${refreshKey}`);

  const doRetry = async (row: FbrInvoiceRow) => {
    if (!retry) return;
    setBusy(row._id);
    try { await retry(row._id); toast.success('Sent again — check the status.'); reload(); } catch (e) { toast.error(errMsg(e, 'Retry failed')); } finally { setBusy(null); }
  };

  const openPanel = (id: string, mode: 'filed' | 'resend') => { setPanel({ id, mode }); setNumber(''); };
  const doResolve = async (row: FbrInvoiceRow) => {
    if (!resolve || !panel) return;
    const body: FbrResolveInput = panel.mode === 'filed' ? { action: 'filed', fbrInvoiceNumber: number.trim() } : { action: 'resend' };
    setBusy(row._id);
    try {
      await resolve(row._id, body);
      toast.success(panel.mode === 'filed' ? 'Saved as filed with FBR.' : 'Sent again — check the status.');
      setPanel(null); reload();
    } catch (e) { toast.error(errMsg(e, 'Could not settle this invoice')); } finally { setBusy(null); }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="w-full sm:w-[280px]">
          <Select aria-label="Filter by status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All invoices{stats ? ` (${Object.values(stats).reduce((a, b) => a + b, 0)})` : ''}</option>
            {(Object.keys(FBR_STATUS_LABEL) as FbrStatus[]).map(s => <option key={s} value={s}>{FBR_STATUS_LABEL[s]}{stats ? ` (${stats[s] ?? 0})` : ''}</option>)}
          </Select>
        </div>
        <Button size="sm" variant="outline" icon={<RotateCw size={13} />} onClick={reload}>Refresh</Button>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-error/30 bg-error-bg px-4 py-3 text-[12.5px] text-error flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5"><AlertCircle size={14} />{error}</span>
          <Button size="sm" variant="outline" onClick={reload}>Try again</Button>
        </div>
      ) : !data ? (
        <div className="h-24 rounded-xl bg-bone animate-pulse" aria-label="Loading" />
      ) : data.items.length === 0 ? (
        <p className="text-[13px] text-slate py-4">Nothing here yet. Invoices appear a few minutes after a sale is paid.</p>
      ) : (
        <div className="divide-y divide-fog border-y border-fog">
          {data.items.map(r => (
            <div key={r._id} className="py-3 flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-charcoal truncate">{referenceLabel} {r.reference}{r.kind === 'adjustment' ? ' (refund / cancel)' : ''}</p>
                  <p className="text-[11.5px] text-slate">{fmtDate(r.createdAt)} · {r.mode === 'sandbox' ? 'Test (sandbox)' : 'Live'}{r.netAmount ? ` · Rs ${r.netAmount.toLocaleString('en-PK')} + tax Rs ${r.taxAmount.toLocaleString('en-PK')}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-semibold px-2 py-[3px] rounded-full ${TONE[r.status] ?? 'bg-bone text-slate'}`}>{FBR_STATUS_LABEL[r.status] ?? r.status}</span>
                  {retry && r.kind === 'sale' && ['failed', 'rejected', 'needs_info', 'pending'].includes(r.status) && (
                    <Button size="sm" variant="outline" loading={busy === r._id} onClick={() => doRetry(r)}>Send again</Button>
                  )}
                </div>
              </div>
              {r.fbrInvoiceNumber && <p className="text-[12px] text-charcoal">FBR invoice number: <b className="font-mono break-all">{r.fbrInvoiceNumber}</b></p>}
              {r.note && <p className="text-[12px] text-slate">{r.note}</p>}
              {r.errors?.length > 0 && r.status !== 'submitted' && (
                <ul className="text-[12px] text-error list-disc pl-5">
                  {r.errors.slice(0, 4).map((e, i) => <li key={i}>{e.code ? `${e.code}: ` : ''}{e.message}</li>)}
                </ul>
              )}
              {r.status === 'failed' && r.nextAttemptAt && <p className="text-[11.5px] text-slate">Next automatic try: {fmtDate(r.nextAttemptAt)} (attempt {r.attempts})</p>}
              {r.status === 'needs_info' && r.nextAttemptAt && <p className="text-[11.5px] text-slate">Checked again automatically: {fmtDate(r.nextAttemptAt)}</p>}

              {r.status === 'unknown_outcome' && r.kind === 'sale' && (
                r.resolvedAt ? (
                  <p className="text-[12px] text-slate">This was already settled once ({r.resolution === 'filed' ? 'marked as filed' : 'sent again'}). If it is still unclear, check the FBR portal directly.</p>
                ) : resolve ? (
                  <div className="rounded-lg border border-warning/40 bg-warning-bg px-3 py-2.5 flex flex-col gap-2" role="group" aria-label={`Settle invoice ${r.reference}`}>
                    <p className="text-[12.5px] text-charcoal">FBR may already have this invoice, so it is <b>not</b> sent again by itself. Open the FBR portal and look for it, then choose:</p>
                    {panel?.id !== r._id && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openPanel(r._id, 'filed')}>I checked: it WAS filed</Button>
                        <Button size="sm" variant="outline" onClick={() => openPanel(r._id, 'resend')}>I checked: it was NOT filed, send again</Button>
                      </div>
                    )}
                    {panel?.id === r._id && panel.mode === 'filed' && (
                      <div className="flex flex-col gap-2">
                        <Input label="FBR invoice number (exactly as the portal shows it)" value={number} maxLength={40} placeholder="7000007DI1747119701593" onChange={e => setNumber(e.target.value)} />
                        {number.trim() !== '' && !FBR_NUMBER.test(number.trim()) && <p className="text-[11.5px] text-error">That does not look like an FBR invoice number (7-digit NTN or 13-digit CNIC, then DI, then 13 digits).</p>}
                        <div className="flex gap-2">
                          <Button size="sm" loading={busy === r._id} disabled={!FBR_NUMBER.test(number.trim())} onClick={() => doResolve(r)}>Save as filed</Button>
                          <Button size="sm" variant="outline" onClick={() => setPanel(null)}>Cancel</Button>
                        </div>
                        <p className="text-[11.5px] text-slate">You can do this only once for this invoice. It is written to the audit log with your name.</p>
                      </div>
                    )}
                    {panel?.id === r._id && panel.mode === 'resend' && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[12.5px] text-charcoal">Send this invoice to FBR again? Do this <b>only</b> if you found no such invoice in the FBR portal, otherwise FBR will have it twice.</p>
                        <div className="flex gap-2">
                          <Button size="sm" loading={busy === r._id} onClick={() => doResolve(r)}>Yes, send it again</Button>
                          <Button size="sm" variant="outline" onClick={() => setPanel(null)}>Cancel</Button>
                        </div>
                        <p className="text-[11.5px] text-slate">You can do this only once for this invoice. It is written to the audit log with your name.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate">Only the store owner can settle this. Check the FBR portal and ask them.</p>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {data && pages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-slate">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
