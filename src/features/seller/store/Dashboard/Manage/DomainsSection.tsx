import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe, Copy, Check, Loader2, ShieldCheck, Plus, ExternalLink, RefreshCw, MoreHorizontal, Lock, Link2,
} from 'lucide-react';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import {
  apiListStoreDomains, apiAddStoreDomain, apiVerifyStoreDomain, apiSetPrimaryStoreDomain, apiRemoveStoreDomain,
  type StoreDomainsData, type StoreDomainEntry,
} from '@/api/services/store';
import { apiGetStoreEntitlements, type EntitlementsSummary } from '@/api/services/platformPlans';
import { useToast } from '@/contexts/ToastContext';
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

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="shrink-0 inline-flex items-center gap-1 min-h-[32px] px-2 rounded-md border border-bone bg-white text-[12px] text-slate hover:bg-cream hover:text-charcoal cursor-pointer focus-visible:ring-2 focus-visible:ring-brand-orange/50 outline-none"
    >
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="text-[12.5px] text-charcoal whitespace-nowrap">{value}</code>
      <CopyButton value={value} label={label} />
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: 'ok' | 'warn' | 'err'; children: React.ReactNode }) {
  const cls = {
    ok: 'text-success bg-success-bg',
    warn: 'text-warning bg-warning-bg',
    err: 'text-error bg-error-bg',
  }[tone];
  const dot = { ok: 'bg-success', warn: 'bg-warning', err: 'bg-error' }[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center text-[12px] font-medium px-2 py-0.5 rounded-full bg-bone text-charcoal">{children}</span>;
}

function DnsPanel({ domain, dns, dnsError, note, lastCheckedAt }: {
  domain: string; dns: StoreDomainsData['dns']; dnsError: string | null; note: string; lastCheckedAt: string | null;
}) {
  const { host, isApex } = dnsHostFor(domain);
  const hasA = !!dns.aRecord;
  const [tab, setTab] = useState<'CNAME' | 'A'>(isApex && hasA ? 'A' : 'CNAME');
  const row = tab === 'A'
    ? { type: 'A', name: '@', value: dns.aRecord ?? '' }
    : { type: 'CNAME', name: host, value: dns.cnameTarget };
  const reason = note || dnsError;

  return (
    <div className="mt-4 rounded-lg border border-bone bg-cream/60 p-3 sm:p-4">
      <p className="text-[14px] font-semibold text-charcoal">Configure DNS</p>
      <p className="text-[13px] text-slate mt-1">
        Add the record below at your domain provider (where you bought the domain). Changes can take a few minutes up to
        48 hours — this page checks automatically.
      </p>

      <div role="tablist" aria-label="DNS record type" className="flex gap-1 mt-3">
        {(['CNAME', 'A'] as const).map(t => {
          const disabled = t === 'A' && !hasA;
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setTab(t)}
              className={`min-h-[36px] px-3 rounded-md text-[13px] font-medium border cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                active ? 'bg-white border-brand-orange text-charcoal' : 'bg-transparent border-bone text-slate hover:bg-white'
              }`}
            >
              {t === 'A' ? 'A record' : 'CNAME'}
            </button>
          );
        })}
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-bone bg-white">
        <table className="w-full min-w-[480px] text-left border-collapse">
          <thead>
            <tr className="bg-cream text-[12px] text-slate">
              <th scope="col" className="font-semibold px-3 py-2">Type</th>
              <th scope="col" className="font-semibold px-3 py-2">Name</th>
              <th scope="col" className="font-semibold px-3 py-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-bone align-middle">
              <td className="px-3 py-2.5"><code className="text-[12.5px] font-semibold text-charcoal">{row.type}</code></td>
              <td className="px-3 py-2.5"><Cell value={row.name} label="record name" /></td>
              <td className="px-3 py-2.5"><Cell value={row.value} label="record value" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {isApex && (
        <p className="text-[12.5px] text-slate mt-3">
          Tip: you can also connect <strong>www.{domain}</strong> with a CNAME record and redirect the root domain to it at your provider.
        </p>
      )}

      {reason && (
        <p className="text-[12.5px] text-error mt-3" role="alert">{reason}</p>
      )}
      <p className="text-[12px] text-slate mt-2">Last checked {timeAgo(lastCheckedAt)}</p>
    </div>
  );
}

function RowMenu({ domain, canPrimary, onPrimary, onRemove, disabled }: {
  domain: string; canPrimary: boolean; onPrimary: () => void; onRemove: () => void; disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const item = 'w-full text-left px-3 min-h-[40px] text-[13px] bg-transparent border-none cursor-pointer hover:bg-cream outline-none focus-visible:bg-cream';
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`More actions for ${domain}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-9 h-9 inline-flex items-center justify-center rounded-md border border-bone bg-white text-slate hover:bg-cream hover:text-charcoal cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-20 min-w-[170px] rounded-lg border border-bone bg-white shadow-lg py-1">
          {canPrimary && (
            <button type="button" role="menuitem" className={`${item} text-charcoal`} onClick={() => { setOpen(false); onPrimary(); }}>
              Make primary
            </button>
          )}
          <button type="button" role="menuitem" className={`${item} text-error`} onClick={() => { setOpen(false); onRemove(); }}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

type Confirm =
  | { kind: 'primary'; domain: string }
  | { kind: 'remove'; domain: string; wasPrimary: boolean };

/** Settings → Domains: free address + connected domains, DNS instructions,
 *  refresh / make-primary / remove. Gated by the plan's `customDomainAllowed`. */
export function DomainsSection({ storeId }: { storeId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const canManage = hasNavPermission(TokenStorage.getUser(), 'settings.domains.manage');
  const [data, setData] = useState<StoreDomainsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [entitlements, setEntitlements] = useState<EntitlementsSummary | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [busy, setBusy] = useState<Record<string, string>>({}); // key (domain|'__default') -> action
  const [rowNote, setRowNote] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    setEntitlements(null);
    apiGetStoreEntitlements(storeId).then(res => { if (mounted.current) setEntitlements(res.data); }).catch(() => {});
  }, [storeId]);

  const domainFeature = entitlements?.customDomainAllowed as { allowed: boolean; requiredPlan: string | null } | undefined;
  const planBlocked = !!domainFeature && domainFeature.allowed === false;
  const goBilling = () => navigate(`/store/${storeId}/settings?tab=billing`);

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

  function openAdd() {
    setNewDomain(''); setAddError(''); setShowAdd(true);
  }

  async function addDomain() {
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain) { setAddError('Enter the domain you want to connect.'); return; }
    if (!/^([\p{L}\p{N}]([\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}$/u.test(domain)) {
      setAddError('Enter a valid domain, for example shop.yourbrand.com.');
      return;
    }
    setAdding(true); setAddError('');
    try {
      const res = await apiAddStoreDomain(storeId, domain);
      setData(res.data);
      setShowAdd(false); setNewDomain('');
      toast.success(`${domain} added. Configure the DNS record to finish setup.`);
    } catch (err) {
      setAddError(errMsg(err, 'Failed to add domain.'));
    } finally {
      setAdding(false);
    }
  }

  async function verify(domain: string) {
    setRowBusy(domain, 'verify'); setRowNote(p => ({ ...p, [domain]: '' }));
    try {
      const res = await apiVerifyStoreDomain(storeId, domain);
      setData(res.data);
      if (res.data.verified) toast.success(`${domain} is configured correctly.`);
      else setRowNote(p => ({ ...p, [domain]: res.data.reason || 'DNS record not found yet.' }));
    } catch (err) {
      setRowNote(p => ({ ...p, [domain]: errMsg(err, 'Verification failed — try again.') }));
    } finally {
      setRowBusy(domain, null);
    }
  }

  async function makePrimary(domain: string | null) {
    const key = domain ?? '__default';
    setRowBusy(key, 'primary');
    try {
      const res = await apiSetPrimaryStoreDomain(storeId, domain);
      setData(res.data);
      toast.success(`${domain ?? res.data.defaultDomain} is now your primary domain.`);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to change the primary domain.'));
    } finally {
      setRowBusy(key, null);
    }
  }

  async function remove(domain: string) {
    setRowBusy(domain, 'remove');
    try {
      const res = await apiRemoveStoreDomain(storeId, domain);
      setData(res.data);
      toast.success(`${domain} removed.`);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to remove domain.'));
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

  function sslLine(d: StoreDomainEntry) {
    if (d.status !== 'verified') return null;
    if (d.sslStatus === 'active') {
      return <span className="inline-flex items-center gap-1.5 text-[12.5px] text-success"><ShieldCheck size={14} /> SSL certificate: Active</span>;
    }
    if (d.sslStatus === 'pending') {
      return <span className="inline-flex items-center gap-1.5 text-[12.5px] text-warning"><Loader2 size={14} className="animate-spin" /> Issuing certificate…</span>;
    }
    if (d.sslStatus === 'failed') {
      return <span className="inline-flex items-center gap-1.5 text-[12.5px] text-error"><ShieldCheck size={14} /> SSL certificate: Failed</span>;
    }
    return null;
  }

  const cardCls = 'bg-white rounded-[10px] border border-bone p-4 sm:p-5';
  const addDisabled = planBlocked || (!!data && data.maxDomains > 0 && data.domains.length >= data.maxDomains);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold text-charcoal m-0">Domains</h2>
          <p className="text-[13px] text-slate mt-1 mb-0">
            Connect your own domain so customers find your store under your brand name.
          </p>
        </div>
        {canManage && (
          <Button size="md" icon={<Plus size={14} />} onClick={openAdd} disabled={addDisabled || !data} className="min-h-[40px]">
            Connect existing domain
          </Button>
        )}
      </div>

      {/* Plan gate */}
      {planBlocked && (
        <div className={`${cardCls} flex items-center justify-between gap-3 flex-wrap bg-cream`}>
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-bone flex items-center justify-center shrink-0"><Lock size={16} className="text-slate" /></span>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-charcoal m-0">
                Custom domains are available from the {domainFeature?.requiredPlan ?? 'Basic'} plan
              </p>
              <p className="text-[13px] text-slate mt-0.5 mb-0">Upgrade to serve your store from your own domain. Your free address keeps working.</p>
            </div>
          </div>
          <Button size="md" onClick={goBilling} className="min-h-[40px]">Upgrade plan</Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[1, 2].map(i => <div key={i} className="animate-pulse rounded-[10px] bg-bone h-[84px] w-full" />)}
        </div>
      )}

      {!loading && loadError && (
        <div className="flex items-center justify-between gap-3 flex-wrap text-[13px] text-error bg-error-bg rounded-[10px] px-4 py-3" role="alert">
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={() => load(false)} className="min-h-[36px]">Retry</Button>
        </div>
      )}

      {!loading && !loadError && data && (
        <>
          {/* Free address */}
          <div className={cardCls}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0"><Link2 size={16} className="text-brand-orange" /></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-charcoal m-0 break-all">{data.defaultDomain}</p>
                    <a
                      href={`https://${data.defaultDomain}`}
                      target="_blank" rel="noopener noreferrer"
                      aria-label={`Open ${data.defaultDomain} in a new tab`}
                      className="text-slate hover:text-charcoal inline-flex"
                    ><ExternalLink size={14} /></a>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[12px] text-slate">Free address</span>
                    {data.primaryDomain === null && <Pill>Primary</Pill>}
                  </div>
                </div>
              </div>
              {canManage && data.primaryDomain !== null && (
                <Button size="sm" variant="outline" loading={busy['__default'] === 'primary'} onClick={() => makePrimary(null)} className="min-h-[36px]">
                  Make primary
                </Button>
              )}
            </div>
          </div>

          {/* Connected domains */}
          {data.domains.map(d => {
            const b = busy[d.domain];
            const unverified = d.status !== 'verified';
            const checking = b === 'verify';
            const allSet = !unverified && d.sslStatus === 'active';
            return (
              <div key={d.domain} className={cardCls}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-bone flex items-center justify-center shrink-0"><Globe size={16} className="text-charcoal" /></span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold text-charcoal m-0 break-all">{d.domain}</p>
                        {!unverified && (
                          <a
                            href={`https://${d.domain}`}
                            target="_blank" rel="noopener noreferrer"
                            aria-label={`Open ${d.domain} in a new tab`}
                            className="text-slate hover:text-charcoal inline-flex"
                          ><ExternalLink size={14} /></a>
                        )}
                        {d.isPrimary && <Pill>Primary</Pill>}
                      </div>
                      <div className="flex items-center gap-x-3 gap-y-1.5 mt-2 flex-wrap" aria-live="polite">
                        {checking
                          ? <StatusBadge tone="warn"><Loader2 size={12} className="animate-spin" /> Checking…</StatusBadge>
                          : unverified
                            ? <StatusBadge tone="err">Invalid configuration</StatusBadge>
                            : <StatusBadge tone="ok">Valid configuration</StatusBadge>}
                        {!checking && sslLine(d)}
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm" variant="outline" icon={<RefreshCw size={13} className={checking ? 'animate-spin' : ''} />}
                        disabled={!!b} onClick={() => verify(d.domain)} className="min-h-[36px]"
                      >
                        Refresh
                      </Button>
                      <RowMenu
                        domain={d.domain}
                        canPrimary={!unverified && !d.isPrimary}
                        disabled={!!b && !checking}
                        onPrimary={() => setConfirm({ kind: 'primary', domain: d.domain })}
                        onRemove={() => setConfirm({ kind: 'remove', domain: d.domain, wasPrimary: d.isPrimary })}
                      />
                    </div>
                  )}
                </div>
                {(b === 'primary' || b === 'remove') && (
                  <p className="text-[12.5px] text-slate mt-2" role="status">{b === 'primary' ? 'Updating primary domain…' : 'Removing…'}</p>
                )}
                {!unverified && (
                  <p className="text-[12px] text-slate mt-3 mb-0">Last checked {timeAgo(d.lastCheckedAt)}</p>
                )}

                {unverified && (
                  <DnsPanel
                    domain={d.domain}
                    dns={data.dns}
                    dnsError={d.dnsError}
                    note={rowNote[d.domain] ?? ''}
                    lastCheckedAt={d.lastCheckedAt}
                  />
                )}

                {allSet && (
                  <p className="text-[13px] text-success mt-3 mb-0 flex items-center gap-1.5" role="status">
                    <Check size={14} /> All set — your store is live on this domain
                  </p>
                )}
              </div>
            );
          })}

          {data.domains.length === 0 && !planBlocked && (
            <p className="text-[13px] text-slate m-0">
              Your store is available at the free address above. Connect a domain you already own to serve your store from your own brand name.
            </p>
          )}
          {!data.httpsAutomation && data.domains.length > 0 && (
            <p className="text-[12px] text-slate m-0">HTTPS is set up by the platform team for new domains.</p>
          )}
          {data.maxDomains > 0 && (
            <p className="text-[12px] text-slate m-0">{data.domains.length} of {data.maxDomains} custom domains used.</p>
          )}
        </>
      )}

      {showAdd && canManage && !planBlocked && (
        <Modal
          title="Connect existing domain"
          onClose={() => { if (!adding) setShowAdd(false); }}
          footer={(
            <>
              <Button size="md" variant="outline" onClick={() => setShowAdd(false)} disabled={adding}>Cancel</Button>
              <Button size="md" loading={adding} onClick={() => void addDomain()}>Add domain</Button>
            </>
          )}
        >
          <form onSubmit={e => { e.preventDefault(); void addDomain(); }}>
            <label htmlFor="domains-add-input" className="text-[13px] font-semibold text-charcoal block mb-1.5">Domain</label>
            <input
              id="domains-add-input"
              value={newDomain}
              onChange={e => { setNewDomain(e.target.value); if (addError) setAddError(''); }}
              placeholder="shop.yourbrand.com"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={!!addError}
              aria-describedby="domains-add-help"
              className={`w-full px-3 py-[10px] min-h-[40px] rounded-lg text-[14px] border bg-white text-charcoal outline-none box-border focus:border-brand-orange ${addError ? 'border-error' : 'border-bone'}`}
            />
            <p id="domains-add-help" className="text-[12.5px] text-slate mt-1.5 mb-0">
              Enter the domain you own, without https://. You'll add one DNS record at your domain provider in the next step.
            </p>
            {addError && <p className="text-[12.5px] text-error mt-2 mb-0" role="alert">{addError}</p>}
            <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          </form>
        </Modal>
      )}

      {confirm && (
        <Modal
          title={confirm.kind === 'primary' ? 'Make primary domain' : 'Remove domain'}
          onClose={() => setConfirm(null)}
          footer={(
            <>
              <Button size="md" variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button size="md" variant={confirm.kind === 'remove' ? 'danger' : 'primary'} onClick={runConfirm}>
                {confirm.kind === 'primary' ? 'Make primary' : 'Remove'}
              </Button>
            </>
          )}
        >
          <p className="text-[14px] text-charcoal m-0">
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
