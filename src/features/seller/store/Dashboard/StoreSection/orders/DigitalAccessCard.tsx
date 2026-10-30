import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '@/api/errorMessage';
import client from '@/api/client';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';

interface AccessRow {
  _id: string;
  resourceRef: string;
  status: 'active' | 'expired' | 'revoked';
  downloadCount: number;
  expiresAt: string | null;
  flagged?: boolean;
}
interface LogRow { _id: string; outcome: 'ok' | 'denied' | 'failed'; reason: string; ip: string; at: string; productId: string | null }

const base = (storeId: string) => `/api/digital/${storeId}`;

/** Seller: a digital order's access records (resend / reset limit / revoke) + the delivery log. Renders nothing for orders without digital items. */
export function DigitalAccessCard({ storeId, orderId, customerId }: { storeId: string; orderId: string; customerId?: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<AccessRow[] | null>(null);
  const [log, setLog] = useState<LogRow[] | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const canEdit = can('orders.edit');

  const load = useCallback(async () => {
    try {
      setRows((await client.get(`${base(storeId)}/orders/${orderId}/access`)) as AccessRow[]);
    } catch {
      setRows([]);
    }
  }, [storeId, orderId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the access rows once per order; load() sets state only after its request resolves
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: 'resend' | 'reset-limit' | 'revoke') {
    setBusy(id + action);
    try {
      await client.post(`${base(storeId)}/access/${id}/${action}`);
      toast.success(action === 'revoke' ? 'Access revoked' : action === 'resend' ? 'Access renewed' : 'Download limit reset');
      await load();
    } catch (e) {
      toast.error(errorMessage(e, 'Action failed'));
    } finally {
      setBusy(null);
    }
  }

  async function openLog() {
    setShowLog((v) => !v);
    if (log) return;
    try {
      setLog(((await client.get(`${base(storeId)}/delivery-log`, { params: { customerId, limit: 20 } })) as { items: LogRow[] }).items);
    } catch {
      setLog([]);
    }
  }

  if (!rows?.length) return null;
  const btn = 'rounded-md border border-bone bg-white text-carbon px-2 py-1 text-[11px] hover:bg-cream disabled:opacity-50 cursor-pointer';
  return (
    <section className="surface-panel rounded-xl p-4 flex flex-col gap-3" aria-label="Digital access">
      <h3 className="text-[14px] font-semibold">Digital access</h3>
      {rows.map((r) => (
        <div key={r._id} className="flex flex-wrap items-center gap-2 text-[12px]">
          <span className="font-medium capitalize">{r.status}</span>
          {r.flagged && <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">Flagged</span>}
          <span className="text-slate">{r.downloadCount} downloads{r.expiresAt ? ` · expires ${new Date(r.expiresAt).toLocaleDateString()}` : ''}</span>
          {canEdit && (
            <span className="ml-auto flex gap-1">
              {r.status !== 'revoked' && <button type="button" className={btn} disabled={!!busy} onClick={() => void act(r._id, 'resend')}>Resend</button>}
              <button type="button" className={btn} disabled={!!busy} onClick={() => void act(r._id, 'reset-limit')}>Reset limit</button>
              {r.status !== 'revoked' && <button type="button" className={`${btn} text-error`} disabled={!!busy} onClick={() => void act(r._id, 'revoke')}>Revoke</button>}
            </span>
          )}
        </div>
      ))}
      <button type="button" className="text-[12px] underline self-start" onClick={() => void openLog()}>{showLog ? 'Hide' : 'View'} delivery log</button>
      {showLog && (
        <ul className="text-[11px] flex flex-col gap-1">
          {log === null && <li>Loading...</li>}
          {log?.length === 0 && <li>No deliveries yet.</li>}
          {log?.map((l) => (
            <li key={l._id}>{new Date(l.at).toLocaleString()} · {l.outcome}{l.reason ? ` (${l.reason})` : ''} · {l.ip}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
