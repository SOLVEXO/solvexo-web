import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Copy, Check, CheckCircle, AlertCircle, Loader2, ShieldCheck, Plus } from 'lucide-react';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import {
  apiListStoreDomains, apiAddStoreDomain, apiVerifyStoreDomain, apiSetPrimaryStoreDomain, apiRemoveStoreDomain,
  type StoreDomainsData, type StoreDomainEntry,
} from '@/api/services/store';
import { Modal } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';

const POLL_MS = 15_000;
const SECOND_LEVEL_TLDS = new Set(['co', 'com', 'org', 'net', 'gov', 'edu', 'ac']);

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Splits a domain into its DNS "host" label (what goes in the registrar's
 *  Name/Host column) and whether it is an apex/root domain. */
function dnsHostFor(domain: string): { host: string; isApex: boolean } {
  const labels = domain.toLowerCase().split('.').filter(Boolean);
  const registrableLen = labels.length >= 3 && labels[labels.length - 1].length === 2 && SECOND_LEVEL_TLDS.has(labels[labels.length - 2]) ? 3 : 2;
  const sub = labels.slice(0, Math.max(0, labels.length - registrableLen)).join('.');
  return sub ? { host: sub, isApex: false } : { host: '@', isApex: true };
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[11px] text-slate w-12 shrink-0">{label}</span>
      <code className="flex-1 text-[12px] text-charcoal bg-white border border-bone rounded-md px-2 py-1 truncate">{value}</code>
      <button type="button" onClick={copy} title="Copy" aria-label={`Copy ${label}`} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md border-none bg-transparent text-slate hover:bg-white hover:text-charcoal cursor-pointer">
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'err' | 'neutral'; children: React.ReactNode }) {
  const cls = {
    ok: 'text-success bg-success-bg',
    warn: 'text-warning bg-warning-bg',
    err: 'text-error bg-error-bg',
    neutral: 'text-charcoal bg-bone',
  }[tone];
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function DnsInstructions({ domain, dns }: { domain: string; dns: StoreDomainsData['dns'] }) {
  const { host, isApex } = dnsHostFor(domain);
  return (
    <div className="bg-cream/60 border border-bone rounded-lg p-3 mt-3">
      <p className="text-[12px] text-charcoal font-medium mb-2">Add this DNS record with your domain provider, then click Verify:</p>
      {!isApex ? (
        <>
          <CopyValue label="Type" value="CNAME" />
          <CopyValue label="Host" value={host} />
          <CopyValue label="Value" value={dns.cnameTarget} />
        </>
      ) : dns.aRecord ? (
        <>
          <CopyValue label="Type" value="A" />
          <CopyValue label="Host" value="@" />
          <CopyValue label="Value" value={dns.aRecord} />
        </>
      ) : (
        <p className="text-[12px] text-slate">
          Root domains can't use a CNAME record with most providers. Connect <strong>www.{domain}</strong> instead
          (CNAME, host <code>www</code>, value <code>{dns.cnameTarget}</code>) and redirect the root domain to it at your provider.
        </p>
      )}
      <p className="text-[11px] text-slate mt-2">DNS changes can take from a few minutes up to a few hours; this page checks again automatically.</p>
    </div>
  );
}

type Confirm =
  | { kind: 'primary'; domain: string }
  | { kind: 'remove'; domain: string; wasPrimary: boolean };

/** Shopify-style Settings → Domains: default address + connected domains,
 *  DNS instructions, verify / make-primary / remove. */
export function DomainsSection({ storeId }: { storeId: string }) {
  const canManage = hasNavPermission(TokenStorage.getUser(), 'settings.domains.manage');
  const [data, setData] = useState<StoreDomainsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState<Record<string, string>>({}); // key (domain|'__default') -> action
  const [rowNote, setRowNote] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const load = useCallback(async (silent: boolean) => {
    if (!silent) { setLoading(true); setLoadError(''); }
    try {
      const res = await apiListStoreDomains(storeId);
      if (mounted.current) setData(res.data);
    } catch (err) {
      if (mounted.current && !silent) setLoadError(errMsg(err, 'Failed to load domains.'));
    } finally {
      if (mounted.current && !silent) setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { setData(null); load(false); }, [load]);

  const needsPoll = !!data && data.domains.some(d => d.status !== 'verified' || d.sslStatus === 'pending');
  useEffect(() => {
    if (!needsPoll) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(true);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [needsPoll, load]);

  function setRowBusy(key: string, action: string | null) {
    setBusy(prev => {
      const next = { ...prev };
      if (action) next[key] = action; else delete next[key];
      return next;
    });
  }

  async function addDomain() {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;
    setAdding(true); setMsg(null);
    try {
      const res = await apiAddStoreDomain(storeId, domain);
      setData(res.data);
      setNewDomain(''); setShowAdd(false);
      setMsg({ ok: true, text: `${domain} added. Add the DNS record shown below, then click Verify.` });
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err, 'Failed to add domain.') });
    } finally {
      setAdding(false);
    }
  }

  async function verify(domain: string) {
    setRowBusy(domain, 'verify'); setRowNote(p => ({ ...p, [domain]: '' }));
    try {
      const res = await apiVerifyStoreDomain(storeId, domain);
      setData(res.data);
      if (!res.data.verified) setRowNote(p => ({ ...p, [domain]: res.data.reason || 'DNS record not found yet.' }));
    } catch (err) {
      setRowNote(p => ({ ...p, [domain]: errMsg(err, 'Verification failed — try again.') }));
    } finally {
      setRowBusy(domain, null);
    }
  }

  async function makePrimary(domain: string | null) {
    const key = domain ?? '__default';
    setRowBusy(key, 'primary'); setMsg(null);
    try {
      const res = await apiSetPrimaryStoreDomain(storeId, domain);
      setData(res.data);
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err, 'Failed to change the primary domain.') });
    } finally {
      setRowBusy(key, null);
    }
  }

  async function remove(domain: string) {
    setRowBusy(domain, 'remove'); setMsg(null);
    try {
      const res = await apiRemoveStoreDomain(storeId, domain);
      setData(res.data);
    } catch (err) {
      setMsg({ ok: false, text: errMsg(err, 'Failed to remove domain.') });
    } finally {
      setRowBusy(domain, null);
    }
  }

  async function runConfirm() {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    if (c.kind === 'primary') await makePrimary(c.domain);
    else await remove(c.domain);
  }

  function sslBadge(d: StoreDomainEntry) {
    if (d.status !== 'verified') return null;
    if (d.sslStatus === 'active') return <Badge tone="ok"><ShieldCheck size={11} /> HTTPS: Active</Badge>;
    if (d.sslStatus === 'pending') return <Badge tone="warn"><Loader2 size={11} className="animate-spin" /> Issuing certificate…</Badge>;
    if (d.sslStatus === 'failed') return <Badge tone="err"><AlertCircle size={11} /> HTTPS error</Badge>;
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] rounded-lg bg-brand-pale-orange flex items-center justify-center">
            <Globe size={15} className="text-brand-orange" />
          </div>
          <p className="text-[14px] font-semibold text-charcoal">Domains</p>
        </div>
        {canManage && data && (
          <Button size="sm" variant="outline" icon={<Plus size={12} />} onClick={() => { setShowAdd(s => !s); setMsg(null); }}>
            Connect existing domain
          </Button>
        )}
      </div>

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-[12px] mb-3 ${msg.ok ? 'text-success' : 'text-error'}`}>{msg.text}</p>
      )}

      {canManage && showAdd && (
        <form
          className="flex gap-2 mb-4"
          onSubmit={e => { e.preventDefault(); void addDomain(); }}
        >
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="shop.yourbrand.com"
            aria-label="Domain to connect"
            autoFocus
            className="w-full px-3 py-[9px] rounded-lg text-[13px] border border-bone bg-bone text-charcoal outline-none box-border"
          />
          <Button size="sm" type="submit" loading={adding} disabled={!newDomain.trim()}>Add</Button>
        </form>
      )}

      {loading && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[1, 2].map(i => <div key={i} className="animate-pulse rounded-lg bg-bone h-[52px] w-full" />)}
        </div>
      )}

      {!loading && loadError && (
        <div className="flex items-center justify-between gap-3 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2.5" role="alert">
          <span>{loadError}</span>
          <Button size="xs" variant="outline" onClick={() => load(false)}>Retry</Button>
        </div>
      )}

      {!loading && !loadError && data && (
        <>
          <div className="border border-bone rounded-lg divide-y divide-bone">
            {/* Free default address — always present */}
            <div className="p-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-charcoal truncate">{data.defaultDomain}</p>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {data.primaryDomain === null && <Badge tone="neutral">Primary</Badge>}
                  <Badge tone="ok"><CheckCircle size={11} /> Connected</Badge>
                </div>
              </div>
              {canManage && data.primaryDomain !== null && (
                <Button size="xs" variant="outline" loading={busy['__default'] === 'primary'} onClick={() => makePrimary(null)}>
                  Make primary
                </Button>
              )}
            </div>

            {data.domains.map(d => {
              const b = busy[d.domain];
              const unverified = d.status !== 'verified';
              return (
                <div key={d.domain} className="p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-charcoal truncate">{d.domain}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {d.isPrimary && <Badge tone="neutral">Primary</Badge>}
                        {unverified
                          ? <Badge tone="warn"><AlertCircle size={11} /> Needs setup</Badge>
                          : <Badge tone="ok"><CheckCircle size={11} /> Connected</Badge>}
                        {sslBadge(d)}
                      </div>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {unverified && (
                          <Button size="xs" variant="outline" loading={b === 'verify'} disabled={!!b && b !== 'verify'} onClick={() => verify(d.domain)}>
                            Verify
                          </Button>
                        )}
                        {!unverified && !d.isPrimary && (
                          <Button size="xs" variant="outline" loading={b === 'primary'} disabled={!!b && b !== 'primary'} onClick={() => setConfirm({ kind: 'primary', domain: d.domain })}>
                            Make primary
                          </Button>
                        )}
                        <Button size="xs" variant="danger" loading={b === 'remove'} disabled={!!b && b !== 'remove'} onClick={() => setConfirm({ kind: 'remove', domain: d.domain, wasPrimary: d.isPrimary })}>
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                  {unverified && (rowNote[d.domain] || d.dnsError) && (
                    <p className="text-[11.5px] text-error mt-2" role="alert">{rowNote[d.domain] || d.dnsError}</p>
                  )}
                  {unverified && <DnsInstructions domain={d.domain} dns={data.dns} />}
                </div>
              );
            })}
          </div>

          {data.domains.length === 0 && (
            <p className="text-[12px] text-slate mt-3">
              Your store is available at the free address above. Connect a domain you already own to serve your store from your own brand name.
            </p>
          )}
          {!data.httpsAutomation && (
            <p className="text-[11.5px] text-slate mt-3">HTTPS is set up by the platform team for new domains.</p>
          )}
          {data.maxDomains > 0 && (
            <p className="text-[11px] text-slate mt-1">{data.domains.length} of {data.maxDomains} custom domains used.</p>
          )}
        </>
      )}

      {confirm && (
        <Modal
          title={confirm.kind === 'primary' ? 'Make primary domain' : 'Remove domain'}
          onClose={() => setConfirm(null)}
          footer={(
            <>
              <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button size="sm" variant={confirm.kind === 'remove' ? 'danger' : 'primary'} onClick={runConfirm}>
                {confirm.kind === 'primary' ? 'Make primary' : 'Remove'}
              </Button>
            </>
          )}
        >
          <p className="text-[13px] text-charcoal">
            {confirm.kind === 'primary'
              ? `Customers and all other domains will redirect to ${confirm.domain}.`
              : confirm.wasPrimary
                ? `${confirm.domain} is your primary domain. If you remove it, customers fall back to your free address (${data?.defaultDomain ?? ''}).`
                : `Remove ${confirm.domain} from this store?`}
          </p>
        </Modal>
      )}
    </div>
  );
}
