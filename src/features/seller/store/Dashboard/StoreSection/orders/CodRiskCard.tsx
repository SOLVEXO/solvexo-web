import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { apiConfirmCodOrder, apiResendCodConfirmation } from '@/api/services/codProtection';
import type { SellerOrderDetail } from '@/api/services/product';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { Badge, Button } from '@/components/comman/ui';

type Cod = NonNullable<SellerOrderDetail['codProtection']>;

const LEVEL_COLOR = { low: 'green', medium: 'yellow', high: 'red' } as const;
const STATUS_TEXT: Record<string, string> = {
  awaiting: 'Waiting for the customer to confirm',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled by the customer',
  expired: 'Not confirmed in time (cancelled automatically)',
};

/** Risk verdict of a cash-on-delivery order: score, reasons, confirmation state, and what the seller can do while it waits. */
export function CodRiskCard({ storeId, orderId, cod, onChanged }: { storeId: string; orderId: string; cod: Cod; onChanged: () => void }) {
  const toast = useToast();
  const canEdit = can('orders.edit');
  const [busy, setBusy] = useState<'confirm' | 'resend' | null>(null);
  const c = cod.confirmation;

  async function run(kind: 'confirm' | 'resend') {
    setBusy(kind);
    try {
      if (kind === 'confirm') { await apiConfirmCodOrder(storeId, orderId); toast.success('Order confirmed'); }
      else { const r = await apiResendCodConfirmation(storeId, orderId); toast.success(r.sent.length ? `Confirmation sent by ${r.sent.join(' and ')}` : 'No contact detail to send to'); }
      onChanged();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }

  return (
    <section aria-label="Cash on delivery risk" className="rounded-xl border border-bone bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <ShieldAlert size={14} className="text-slate" aria-hidden />
        <p className="m-0 flex-1 text-[13px] font-bold text-charcoal">COD risk</p>
        <Badge color={LEVEL_COLOR[cod.level]} size="sm">{cod.level} · {cod.score}/100</Badge>
      </div>
      {cod.reasons.length > 0 ? (
        <ul className="m-0 mb-2 flex list-none flex-col gap-0.5 p-0 text-[12.5px] text-graphite">
          {cod.reasons.map(r => <li key={r.code}>{r.label}{r.points ? <span className="text-slate"> ({r.points > 0 ? '+' : ''}{r.points})</span> : null}</li>)}
        </ul>
      ) : <p className="m-0 mb-2 text-[12.5px] text-slate">No risk signals for this customer.</p>}
      {c && (
        <div className="flex flex-col gap-2 border-t border-bone pt-2">
          <p role="status" className="m-0 text-[12.5px] font-medium text-charcoal">
            {STATUS_TEXT[c.status]}{c.status === 'awaiting' ? ` · until ${new Date(c.expiresAt).toLocaleString()}` : ''}
          </p>
          {c.channels.length > 0 && <p className="m-0 text-xs text-slate">Message sent by {c.channels.join(' and ')}.</p>}
          {c.status === 'confirmed' && c.resolvedBy === 'seller' && <p className="m-0 text-xs text-slate">Confirmed by you{cod.override?.note ? `: ${cod.override.note}` : ''}.</p>}
          {c.status === 'awaiting' && canEdit && (
            <div className="flex flex-wrap gap-2">
              <Button size="xs" loading={busy === 'confirm'} onClick={() => void run('confirm')}>I reached the customer: confirm</Button>
              <Button size="xs" variant="outline" loading={busy === 'resend'} onClick={() => void run('resend')}>Send the message again</Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
