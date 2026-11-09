import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import client from '@/api/client';
import { errorMessage } from '@/api/errorMessage';
import type { StaffPermission } from '@/api/services/staff';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button, Card, EmptyState, Input, TabBar, Table } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui/Table';
import { ErrorLine } from '../wholesale/ErrorLine';
import { shortDate, useApi } from '../wholesale/wholesaleUtils';

interface Config { synonyms: { terms: string[] }[]; pinned: { query: string; productIds: string[] }[]; filters: { key: string; enabled: boolean }[] }
interface Miss { _id: string; query: string; count: number; lastAt: string }
interface Prod { _id: string; name: string }
const FILTER_LABEL: Record<string, string> = { availability: 'Availability', price: 'Price', vendor: 'Brand', tags: 'Tags', options: 'Options (size, colour…)' };

/** How shoppers find things: words that mean the same, products to show first, which filters appear, and searches that found nothing. */
export default function SearchSettingsPage() {
  const { storeId } = useStoreWorkspace();
  const [tab, setTab] = useState('synonyms');
  return (
    <>
      <StorePageHeader title="Search & discovery" subtitle="Synonyms, pinned products, filters" />
      <div className="flex w-full flex-col gap-4 px-4 pb-8 pt-5 lg:px-7">
        {can('onlinestore.themes.manage' as StaffPermission) ? (
          <>
            <TabBar tabs={[{ id: 'synonyms', label: 'Synonyms' }, { id: 'pinned', label: 'Pinned products' }, { id: 'filters', label: 'Filters' }, { id: 'misses', label: 'No results' }]} active={tab} onChange={setTab} />
            {tab === 'misses' ? <Misses storeId={storeId} /> : <Editor storeId={storeId} tab={tab} />}
          </>
        ) : <EmptyState icon={<Lock size={22} />} title="No access" description="Your role cannot change search settings." />}
      </div>
    </>
  );
}

function Editor({ storeId, tab }: { storeId: string; tab: string }) {
  const toast = useToast();
  const base = `/api/search-discovery/${storeId}`;
  const cfg = useApi<Config>(base);
  const [syn, setSyn] = useState<string | null>(null);
  const [pins, setPins] = useState<{ query: string; products: Prod[] }[] | null>(null);
  const [filters, setFilters] = useState<Config['filters'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [find, setFind] = useState({ idx: -1, q: '', results: [] as Prod[] });

  useEffect(() => {
    const c = cfg.data; if (!c) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setSyn((v) => v ?? c.synonyms.map((g) => g.terms.join(', ')).join('\n'));
    setFilters((v) => v ?? c.filters);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [cfg.data]);
  useEffect(() => {
    const c = cfg.data; if (!c || pins) return;
    const ids = [...new Set(c.pinned.flatMap((p) => p.productIds))];
    void Promise.all(ids.map((id) => (client.get(`/api/products/getProductById/${id}`) as Promise<{ data?: { product?: Prod } }>).then((r) => r?.data?.product ?? { _id: id, name: id }).catch(() => ({ _id: id, name: id }))))
      .then((ps) => { const by = new Map(ps.map((p) => [p._id, p])); setPins(c.pinned.map((p) => ({ query: p.query, products: p.productIds.map((i) => by.get(i) ?? { _id: i, name: i }) }))); });
  }, [cfg.data, pins]);

  async function save(body: Partial<Config>) {
    setBusy(true);
    try { await client.put(base, body); toast.success('Saved'); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }
  async function search(idx: number, q: string) {
    setFind({ idx, q, results: [] });
    if (q.trim().length < 2) return;
    try { const r = (await client.get(`/api/products/store-products/${storeId}`, { params: { search: q, limit: 6 } })) as { data?: { products?: Prod[] } }; setFind({ idx, q, results: r?.data?.products ?? [] }); } catch { /* typing continues */ }
  }

  if (cfg.error) return <ErrorLine message={errorMessage(cfg.error)} onRetry={cfg.reload} />;
  if (tab === 'synonyms') return (
    <Card padding="md">
      <p className="mt-0 text-[13px] text-slate">One group per line, words separated by commas. A shopper who types any word of a group also finds products that match the others (for example <code>sofa, couch, settee</code>).</p>
      <textarea rows={8} aria-label="Synonym groups" className="w-full rounded-lg border border-bone px-3 py-2 text-[13px]" value={syn ?? ''} onChange={(e) => setSyn(e.target.value)} />
      <div className="mt-3"><Button loading={busy} onClick={() => void save({ synonyms: (syn ?? '').split('\n').map((l) => ({ terms: l.split(',') })) })}>Save synonyms</Button></div>
    </Card>
  );
  if (tab === 'filters') return (
    <Card padding="md">
      <p className="mt-0 text-[13px] text-slate">Choose which filters shoppers see and in what order.</p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {(filters ?? []).map((f, i) => (
          <li key={f.key} className="flex items-center gap-3 text-[13px]">
            <label className="flex flex-1 items-center gap-2"><input type="checkbox" checked={f.enabled} onChange={(e) => setFilters((filters ?? []).map((x) => (x.key === f.key ? { ...x, enabled: e.target.checked } : x)))} />{FILTER_LABEL[f.key] ?? f.key}</label>
            <Button size="xs" variant="outline" disabled={i === 0} onClick={() => { const a = [...(filters ?? [])]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; setFilters(a); }}>Up</Button>
            <Button size="xs" variant="outline" disabled={i === (filters ?? []).length - 1} onClick={() => { const a = [...(filters ?? [])]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; setFilters(a); }}>Down</Button>
          </li>
        ))}
      </ul>
      <div className="mt-3"><Button loading={busy} onClick={() => void save({ filters: filters ?? [] })}>Save filters</Button></div>
    </Card>
  );
  return (
    <Card padding="md">
      <p className="mt-0 text-[13px] text-slate">For an exact search word, these products are shown first (when the shopper has not picked another sort).</p>
      {(pins ?? []).map((p, i) => (
        <div key={i} className="mb-3 flex flex-col gap-2 rounded-lg border border-bone p-3">
          <Input label="When shoppers search for" value={p.query} onChange={(e) => setPins((pins ?? []).map((x, j) => (j === i ? { ...x, query: e.target.value } : x)))} />
          <div className="flex flex-wrap gap-2 text-xs">{p.products.map((pr) => <button key={pr._id} type="button" className="rounded-full border border-bone px-2 py-1" onClick={() => setPins((pins ?? []).map((x, j) => (j === i ? { ...x, products: x.products.filter((y) => y._id !== pr._id) } : x)))}>{pr.name} ✕</button>)}</div>
          <Input label="Add a product (type to search)" value={find.idx === i ? find.q : ''} onChange={(e) => void search(i, e.target.value)} />
          {find.idx === i && find.results.map((r) => <button key={r._id} type="button" className="text-left text-[13px] underline" onClick={() => { setPins((pins ?? []).map((x, j) => (j === i && !x.products.some((y) => y._id === r._id) ? { ...x, products: [...x.products, r] } : x))); setFind({ idx: -1, q: '', results: [] }); }}>{r.name}</button>)}
          <div><Button size="xs" variant="outline" onClick={() => setPins((pins ?? []).filter((_, j) => j !== i))}>Remove</Button></div>
        </div>
      ))}
      <div className="flex gap-2"><Button variant="outline" onClick={() => setPins([...(pins ?? []), { query: '', products: [] }])}>Add a search word</Button><Button loading={busy} onClick={() => void save({ pinned: (pins ?? []).map((p) => ({ query: p.query, productIds: p.products.map((x) => x._id) })) })}>Save pinned products</Button></div>
    </Card>
  );
}

function Misses({ storeId }: { storeId: string }) {
  const toast = useToast();
  const base = `/api/search-discovery/${storeId}/no-results`;
  const r = useApi<{ items: Miss[] }>(base);
  const columns: TableColumn<Miss>[] = [
    { key: 'q', header: 'Searched for', render: (m) => m.query },
    { key: 'c', header: 'Times', align: 'right', render: (m) => m.count },
    { key: 'd', header: 'Last', render: (m) => shortDate(m.lastAt) },
    { key: 'a', header: 'Actions', align: 'right', render: (m) => <Button size="xs" variant="outline" onClick={() => void (async () => { try { await client.delete(base, { params: { query: m.query } }); r.reload(); } catch (e) { toast.error(errorMessage(e)); } })()}>Dismiss</Button> },
  ];
  if (r.error) return <ErrorLine message={errorMessage(r.error)} onRetry={r.reload} />;
  return <Table columns={columns} data={r.data?.items ?? []} keyExtractor={(m) => m._id} loading={r.loading} emptyState={{ title: 'No empty searches', description: 'Searches that find nothing show up here, so you can add synonyms or products.' }} />;
}
