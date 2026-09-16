import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { apiListDisputes, apiSubmitDisputeEvidence, type DisputeRow } from '@/api/services/payment';
import { SkeletonBox, Button, Modal, Field, Textarea } from '@/components/comman/ui';
import { currencySymbol } from '@/utils/currency';

const STATUS_LABELS: Record<string, string> = {
  needs_response: 'Needs your response',
  warning_needs_response: 'Needs your response (inquiry)',
  under_review: 'Under review',
  warning_under_review: 'Under review (inquiry)',
  won: 'Won',
  lost: 'Lost',
  warning_closed: 'Closed',
  charge_refunded: 'Charge refunded',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusColor(status: string) {
  if (status.includes('needs_response')) return 'text-error';
  if (status === 'won') return 'text-success';
  if (status === 'lost') return 'text-error';
  return 'text-slate';
}

export default function DisputesList() {
  const { storeId, store } = useStoreWorkspace();
  const symbol = currencySymbol(store?.baseCurrency);

  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'open' | 'all'>('open');

  const [evidenceDispute, setEvidenceDispute] = useState<DisputeRow | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [customerCommunication, setCustomerCommunication] = useState('');
  const [shippingDocumentation, setShippingDocumentation] = useState('');
  const [uncategorizedText, setUncategorizedText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    apiListDisputes(storeId)
      .then(res => setDisputes(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load disputes.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (storeId) load(); }, [storeId]);

  const visible = filter === 'open'
    ? disputes.filter(d => d.status === 'needs_response' || d.status === 'warning_needs_response')
    : disputes;

  const openEvidenceModal = (d: DisputeRow) => {
    setEvidenceDispute(d);
    setProductDescription(''); setCustomerCommunication(''); setShippingDocumentation(''); setUncategorizedText('');
    setSubmitError('');
  };

  const handleSubmitEvidence = () => {
    if (!evidenceDispute) return;
    if (![productDescription, customerCommunication, shippingDocumentation, uncategorizedText].some(v => v.trim())) {
      setSubmitError('Add at least one piece of evidence.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    apiSubmitDisputeEvidence(storeId, evidenceDispute.disputeId, {
      productDescription: productDescription.trim() || undefined,
      customerCommunication: customerCommunication.trim() || undefined,
      shippingDocumentation: shippingDocumentation.trim() || undefined,
      uncategorizedText: uncategorizedText.trim() || undefined,
    })
      .then(() => { setEvidenceDispute(null); load(); })
      .catch((err: unknown) => setSubmitError(err instanceof Error ? err.message : 'Failed to submit evidence.'))
      .finally(() => setSubmitting(false));
  };

  return (
    <>
      <StorePageHeader
        title="Disputes"
        subtitle="Real Stripe payment disputes — respond with evidence before the due date."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-[7px] rounded-lg text-[12.5px] font-semibold cursor-pointer border ${filter === 'open' ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-bone'}`}
            >Needs Response</button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-[7px] rounded-lg text-[12.5px] font-semibold cursor-pointer border ${filter === 'all' ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-charcoal border-bone'}`}
            >All</button>
          </div>
        }
      />

      <div className="px-4 lg:px-7 py-5">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <SkeletonBox key={i} height={70} rounded="10px" />)}
          </div>
        )}

        {!loading && error && (
          <div className="bg-error-bg border border-error-border rounded-[10px] px-4 py-3 flex items-center gap-3">
            <AlertTriangle size={16} className="text-error shrink-0" />
            <span className="text-[13px] text-error flex-1">{error}</span>
            <button onClick={load} className="flex items-center gap-1 text-[12px] text-error font-semibold cursor-pointer">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="bg-white border border-bone rounded-[10px] py-14 flex flex-col items-center gap-2">
            <ShieldAlert size={28} className="text-slate" />
            <p className="text-[13px] text-slate">{filter === 'open' ? 'No disputes need a response right now.' : 'No disputes yet.'}</p>
          </div>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
            {visible.map(d => (
              <div key={d.disputeId} className="flex items-center gap-4 px-5 py-4 border-b border-bone last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[12.5px] font-bold ${statusColor(d.status)}`}>{STATUS_LABELS[d.status] ?? d.status}</span>
                    {d.reason && <span className="text-[11px] text-slate capitalize">— {d.reason.replace(/_/g, ' ')}</span>}
                  </div>
                  <p className="text-[11.5px] text-slate mt-1">
                    {d.orderIds.length > 0 ? `Order ${d.orderIds[0]}` : ''}
                    {d.evidenceDueBy && (d.status === 'needs_response' || d.status === 'warning_needs_response') && (
                      <span className="text-error font-semibold"> · Evidence due {formatDate(d.evidenceDueBy)}</span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-charcoal">{symbol}{d.amount.toLocaleString()}</p>
                </div>
                {(d.status === 'needs_response' || d.status === 'warning_needs_response') && (
                  <Button size="sm" onClick={() => openEvidenceModal(d)}>Submit Evidence</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {evidenceDispute && (
        <Modal
          title="Submit Dispute Evidence"
          onClose={() => { if (!submitting) setEvidenceDispute(null); }}
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEvidenceDispute(null)} disabled={submitting}>Cancel</Button>
              <Button size="sm" onClick={handleSubmitEvidence} loading={submitting}>Submit to Stripe</Button>
            </>
          }
        >
          {submitError && <p className="text-[12px] text-error mb-3">{submitError}</p>}
          <p className="text-[12.5px] text-slate mb-4">
            This is submitted directly to Stripe for review — once submitted it can't be edited, and Stripe (not Solvexo) decides the outcome.
          </p>
          <Field label="Product description" hint="What the customer purchased.">
            <Textarea rows={2} value={productDescription} onChange={e => setProductDescription(e.target.value)} />
          </Field>
          <Field label="Customer communication" hint="Emails/messages showing the customer's intent or satisfaction.">
            <Textarea rows={2} value={customerCommunication} onChange={e => setCustomerCommunication(e.target.value)} />
          </Field>
          <Field label="Shipping documentation" hint="Tracking number, carrier, delivery confirmation.">
            <Textarea rows={2} value={shippingDocumentation} onChange={e => setShippingDocumentation(e.target.value)} />
          </Field>
          <Field label="Additional notes">
            <Textarea rows={2} value={uncategorizedText} onChange={e => setUncategorizedText(e.target.value)} />
          </Field>
        </Modal>
      )}
    </>
  );
}
