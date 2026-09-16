import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Package } from 'lucide-react';
import { StripeCardPayment, isStripeConfigured } from '@/components/comman/ui/StripeCardPayment';
import { apiGetPublicInvoice, apiCreateInvoicePaymentIntent, type PublicInvoiceData } from '@/api/services/draftOrders';
import { currencySymbol } from '@/utils/currency';

/** Public, unauthenticated "Pay Invoice" page — reached via the secure,
 *  token-secured link `DraftOrdersService.sendInvoice()` emails a customer.
 *  See PublicDraftOrdersController for the backend routes this calls. */
export default function PayInvoicePage() {
  const { token = '' } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [starting, setStarting] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    apiGetPublicInvoice(token)
      .then(res => setInvoice(res.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'This invoice could not be found.'))
      .finally(() => setLoading(false));
  }, [token]);

  const startPayment = () => {
    setStarting(true);
    apiCreateInvoicePaymentIntent(token)
      .then(res => setClientSecret(res.data.clientSecret))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to start payment.'))
      .finally(() => setStarting(false));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-[13px] text-slate">Loading invoice…</div>;
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white border border-bone rounded-2xl p-6 text-center flex flex-col items-center gap-3">
          <AlertTriangle size={28} className="text-error" />
          <p className="text-[14px] font-semibold text-charcoal">{error}</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;
  const symbol = currencySymbol(invoice.currency);
  const alreadyPaid = invoice.isPaid || paid;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white border border-bone rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-bone flex items-center gap-3">
          {invoice.storeLogo
            ? <img src={invoice.storeLogo} alt={invoice.storeName} className="w-10 h-10 rounded-lg object-cover" />
            : <div className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center"><Package size={18} className="text-brand-orange" /></div>}
          <div>
            <p className="text-[14px] font-bold text-charcoal">{invoice.storeName}</p>
            <p className="text-[11px] text-slate">Invoice for {invoice.customerName}</p>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {invoice.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cream border border-bone shrink-0 flex items-center justify-center overflow-hidden">
                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package size={14} className="text-slate" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-charcoal truncate">{item.name}</p>
                <p className="text-[11px] text-slate">Qty {item.quantity}</p>
              </div>
              <p className="text-[12.5px] font-bold text-charcoal">{symbol}{(item.unitPrice * item.quantity).toFixed(2)}</p>
            </div>
          ))}

          <div className="h-px bg-bone my-1" />
          <div className="flex justify-between text-[12.5px]"><span className="text-slate">Subtotal</span><span className="text-charcoal">{symbol}{invoice.subtotal.toFixed(2)}</span></div>
          {invoice.discountAmount > 0 && <div className="flex justify-between text-[12.5px]"><span className="text-slate">Discount</span><span className="text-[#16a34a]">-{symbol}{invoice.discountAmount.toFixed(2)}</span></div>}
          {invoice.shippingAmount > 0 && <div className="flex justify-between text-[12.5px]"><span className="text-slate">Shipping</span><span className="text-charcoal">{symbol}{invoice.shippingAmount.toFixed(2)}</span></div>}
          {invoice.taxAmount > 0 && <div className="flex justify-between text-[12.5px]"><span className="text-slate">Tax</span><span className="text-charcoal">{symbol}{invoice.taxAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-[16px] font-bold text-charcoal pt-1"><span>Total</span><span>{symbol}{invoice.total.toFixed(2)}</span></div>
          {invoice.dueDate && <p className="text-[11px] text-slate">Due {new Date(invoice.dueDate).toLocaleDateString()}</p>}
        </div>

        <div className="px-6 pb-6">
          {alreadyPaid ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 size={32} className="text-success" />
              <p className="text-[14px] font-semibold text-charcoal">Payment received — thank you!</p>
            </div>
          ) : !isStripeConfigured() ? (
            <p className="text-[12.5px] text-slate text-center">Online payment isn't available right now — please contact {invoice.storeName} directly.</p>
          ) : clientSecret ? (
            <StripeCardPayment
              clientSecret={clientSecret}
              submitLabel={`Pay ${symbol}${invoice.total.toFixed(2)}`}
              onConfirmed={() => setPaid(true)}
            />
          ) : (
            <>
              {error && <p className="text-[12px] text-error mb-3">{error}</p>}
              <button
                type="button" onClick={startPayment} disabled={starting}
                className="w-full py-3 rounded-lg bg-[#D97757] text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
              >
                {starting ? 'Starting…' : `Pay ${symbol}${invoice.total.toFixed(2)}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
