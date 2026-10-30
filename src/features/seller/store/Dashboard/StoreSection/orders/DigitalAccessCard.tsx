import { useCallback, useEffect, useState } from 'react';
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
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: 'resend' | 'reset-limit' | 'revoke') {
    setBusy(id + action);
    try {
      await client.post(`${base(storeId)}/access/${id}/${action}`);
      toast.show('success', action === 'revoke' ? 'Access revoked' : action === 'resend' ? 'Access renewed' : 'Download limit reset');
      await load();
    } catch (e: any) {
      toast.show('error', e?.response?.data?.message ?? 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  async function openLog() {
    setShowLog((v) => !v);
    if (log) return;
    try {
      setLog((await client.get(`${base(storeId)}/delivery-log`, { params: { customerId, limit: 20 } })) as LogRow[]);
    } catch {
      setLog([]);
    }
  }

  if (!rows?.length) return null;
  const btn = 'rounded-md border border-line px-2 py-1 text-[11px] disabled:opacity-50';
  return (
    <section className="rounded-xl border border-line bg-white p-4 flex flex-col gap-3" aria-label="Digital access">
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
              {r.status !== 'revoked' && <button type="button" className={`${btn} text-red-600`} disabled={!!busy} onClick={() => void act(r._id, 'revoke')}>Revoke</button>}
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
