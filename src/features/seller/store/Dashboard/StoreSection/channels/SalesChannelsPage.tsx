import { useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Badge, Button, Card, CopyIconButton, EmptyState, Table } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { useApi } from '../wholesale/wholesaleUtils';

interface Settings { enabled: boolean; currencies: string[]; lastFetchedAt: string | null; fetchCount: number; urls: { googleXml: string; metaCsv: string } }
interface Issue { productId: string; variantId: string; name: string; sku: string; missing: string[] }
interface Health { ready: number; withProblems: number; truncated: boolean; issues: Issue[] }

/** Product feeds for Google Merchant Center and the Meta (Facebook / Instagram) catalog. No key of ours is needed: paste the address into their dashboards. */
export default function SalesChannelsPage() {
  const { storeId } = useStoreWorkspace();
  return (
    <>
      <StorePageHeader title="Sales channels" subtitle="Product feeds for Google and Meta" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {can('products.view' as StaffPermission) ? <Body storeId={storeId} /> : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot view product feeds." />}
      </div>
    </>
  );
}

function Body({ storeId }: { storeId: string }) {
  const toast = useToast();
  const manage = can('marketing.manage' as StaffPermission);
  const s = useApi<Settings>(`/api/feeds/${storeId}`);
  const h = useApi<Health>(`/api/feeds/${storeId}/health`);
  const [busy, setBusy] = useState<string | null>(null);
  async function act(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try { await fn(); toast.success(ok); s.reload(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  }
  const columns: TableColumn<Issue>[] = [
    { key: 'n', header: 'Product', render: (i) => <div><div className="font-semibold text-carbon">{i.name}</div><div className="text-xs text-slate">{i.sku}</div></div> },
    { key: 'm', header: 'Missing', render: (i) => <div className="flex flex-wrap gap-1">{i.missing.map((m) => <Badge key={m} color="red" size="sm">{m}</Badge>)}</div> },
  ];
  if (s.error) return <ErrorLine message={errorMessage(s.error)} onRetry={s.reload} />;
  const d = s.data;
  return (
    <>
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 text-[13px] text-slate">Feeds list your active physical products, one item per variant. Anyone with the address can read it, so keep it private. It works only while the feed is on.</div>
          {d && <Badge color={d.enabled ? 'green' : 'gray'} size="sm">{d.enabled ? 'On' : 'Off'}</Badge>}
          {manage && d && <Button size="sm" variant={d.enabled ? 'outline' : 'primary'} loading={busy === 'toggle'} onClick={() => void act('toggle', () => client.patch(`/api/feeds/${storeId}`, { enabled: !d.enabled }), d.enabled ? 'Feed switched off' : 'Feed switched on')}>{d.enabled ? 'Switch off' : 'Switch on'}</Button>}
        </div>
        {d && (
          <dl className="m-0 mt-4 flex flex-col gap-3 text-[13px]">
            {([['Google Merchant Center (XML)', d.urls.googleXml], ['Meta catalog (CSV)', d.urls.metaCsv]] as const).map(([label, url]) => (
              <div key={label}><dt className="font-semibold text-carbon">{label}</dt><dd className="m-0 flex items-center gap-2 break-all font-mono text-xs">{url}<CopyIconButton value={url} /></dd></div>
            ))}
            <div className="text-xs text-slate">{d.fetchCount > 0 ? `Read ${d.fetchCount} time(s), last ${new Date(d.lastFetchedAt ?? '').toLocaleString()}` : 'Not read yet'}</div>
            {manage && <div><Button size="xs" variant="outline" loading={busy === 'rotate'} onClick={() => void act('rotate', () => client.post(`/api/feeds/${storeId}/rotate`, {}), 'New address created. Update it in Google / Meta.')}>Create a new address</Button></div>}
          </dl>
        )}
      </Card>
      <Card padding="md">
        <h3 className="m-0 mb-2 text-[14px] font-semibold text-carbon">Feed health</h3>
        {h.error ? <ErrorLine message={errorMessage(h.error)} onRetry={h.reload} /> : h.data && (
          <>
            <p className="m-0 mb-3 text-[13px] text-carbon">{h.data.ready.toLocaleString()} item(s) ready · {h.data.withProblems.toLocaleString()} with missing details (not sent until fixed){h.data.truncated ? ' · only the first 5,000 products are included' : ''}</p>
            <Table columns={columns} data={h.data.issues} keyExtractor={(i) => i.variantId} loading={h.loading} emptyState={{ title: 'Everything is ready', description: 'Every active variant has the details Google and Meta require.' }} />
          </>
        )}
      </Card>
    </>
  );
}
