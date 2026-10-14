import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Link2, RefreshCw, ShieldCheck, Trash2, LogOut } from 'lucide-react';
import { Button, Modal, Toggle } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import {
  ADMIN_PERMISSION_AREAS, ADMIN_PERMISSION_LABELS, type AdminPermission, type AdminMember, type AdminRole, type AdminApproval,
  apiListAdmins, apiInviteAdmin, apiUpdateAdmin, apiResendAdminInvite, apiRevokeAdminSessions, apiSetAdminSuper, apiDeleteAdmin,
  apiListAdminRoles, apiCreateAdminRole, apiUpdateAdminRole, apiDeleteAdminRole,
  apiListAdminApprovals, apiDecideAdminApproval, apiGetAdminAudit,
} from '@/api/services/adminTeam';
import type { AdminActivityLogEntry } from '@/api/services/activityLog';
import { can } from '@/hooks/auth/useCan';
import { TokenStorage } from '@/api/services/auth';

const INPUT = 'w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40';
const errMsg = (e: unknown, fb = 'Something went wrong.') => (e instanceof Error ? e.message : fb);
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : '—');
const STATE_STYLE: Record<string, string> = {
  active: 'bg-green-50 text-green-700', invited: 'bg-amber-50 text-amber-700', inactive: 'bg-bone text-slate', access_expired: 'bg-red-50 text-red-700',
};
const STATE_LABEL: Record<string, string> = { active: 'Active', invited: 'Invite pending', inactive: 'Inactive', access_expired: 'Access ended' };

type Pane = 'admins' | 'roles' | 'approvals' | 'audit';
const PANES: { id: Pane; label: string }[] = [
  { id: 'admins', label: 'Admins' }, { id: 'roles', label: 'Roles' }, { id: 'approvals', label: 'Approvals' }, { id: 'audit', label: 'Audit trail' },
];

/** Settings → Team: the platform admin team. Visible to the owner / Super Admin and to admins holding `team.manage`. */
export function AdminTeam() {
  const [pane, setPane] = useState<Pane>('admins');
  return (
    <div className="px-4 sm:px-7 py-6 flex flex-col gap-5">
      <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Team sections">
        {PANES.map(p => (
          <button key={p.id} role="tab" aria-selected={pane === p.id} type="button" onClick={() => setPane(p.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border cursor-pointer ${pane === p.id ? 'bg-charcoal text-white border-charcoal' : 'bg-white text-graphite border-bone hover:bg-cream'}`}>
            {p.label}
          </button>
        ))}
      </div>
      {pane === 'admins' && <AdminsPane />}
      {pane === 'roles' && <RolesPane />}
      {pane === 'approvals' && <ApprovalsPane />}
      {pane === 'audit' && <AuditPane />}
    </div>
  );
}

function useLoad<T>(fn: () => Promise<{ data: T }>, key = '') {
  const fnRef = useRef(fn);
  useEffect(() => { fnRef.current = fn; });
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { setLoading(true); setError(''); fnRef.current().then(r => setData(r.data)).catch(e => setError(errMsg(e, 'Could not load.'))).finally(() => setLoading(false)); }, [key]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

function LoadState({ loading, error, onRetry }: { loading: boolean; error: string; onRetry: () => void }) {
  if (loading) return <p className="text-[13px] text-slate py-6">Loading…</p>;
  if (error) return (
    <div role="alert" className="border border-red-200 bg-red-50 rounded-xl p-4 flex items-center justify-between gap-3">
      <p className="text-[13px] text-error">{error}</p><Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
  return null;
}

// ── Admins ───────────────────────────────────────────────────────────────
function AdminsPane() {
  const toast = useToast();
  const me = TokenStorage.getUser<{ _id?: string; id?: string; isSuperAdmin?: boolean }>();
  const admins = useLoad<AdminMember[]>(apiListAdmins);
  const roles = useLoad<AdminRole[]>(apiListAdminRoles);
  const [invite, setInvite] = useState(false);
  const [edit, setEdit] = useState<AdminMember | null>(null);
  const [del, setDel] = useState<AdminMember | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const isOwner = !TokenStorage.getUser<{ teamAdmin?: boolean }>()?.teamAdmin;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); admins.reload(); } catch (e) { toast.error(errMsg(e)); }
  };
  const resend = async (a: AdminMember) => {
    try {
      const r = await apiResendAdminInvite(a._id);
      if (r.inviteUrl) setLink(r.inviteUrl);
      toast.success(r.emailSent ? 'Invite sent again.' : 'Email could not be sent — copy the link instead.');
      admins.reload();
    } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-slate">People who can sign in to this admin panel. Each one only sees what their role allows.</p>
        <Button size="sm" onClick={() => setInvite(true)} disabled={!roles.data?.length}><Plus size={14} /> Invite admin</Button>
      </div>
      <LoadState loading={admins.loading} error={admins.error} onRetry={admins.reload} />
      {admins.data && (
        <div className="bg-white border border-bone rounded-2xl overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead><tr className="text-left text-slate border-b border-bone">
              {['Name', 'Role', 'Status', 'Last sign-in', 'Sessions', ''].map(h => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}
            </tr></thead>
            <tbody>
              {admins.data.map(a => (
                <tr key={a._id} className="border-b border-bone last:border-0">
                  <td className="px-4 py-3"><p className="font-semibold text-charcoal">{a.name}</p><p className="text-[11.5px] text-slate">{a.email}</p></td>
                  <td className="px-4 py-3">{a.isSuperAdmin ? <span className="inline-flex items-center gap-1 font-semibold text-brand-orange"><ShieldCheck size={13} /> Super Admin</span> : (a.roleName ?? '—')}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATE_STYLE[a.state]}`}>{STATE_LABEL[a.state]}</span>
                    {a.accessExpiresAt && <p className="text-[11px] text-slate mt-0.5">Until {fmt(a.accessExpiresAt)}</p>}</td>
                  <td className="px-4 py-3 text-slate">{fmt(a.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-slate">{a.sessionCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-end flex-wrap">
                      {a.state === 'invited' && <Button size="xs" variant="outline" onClick={() => resend(a)}><RefreshCw size={12} /> Resend</Button>}
                      {!a.isSuperAdmin && <Button size="xs" variant="outline" onClick={() => setEdit(a)}>Edit</Button>}
                      {a.sessionCount > 0 && a._id !== (me?._id ?? me?.id) && <Button size="xs" variant="outline" onClick={() => run(() => apiRevokeAdminSessions(a._id), 'Signed out everywhere.')}><LogOut size={12} /> Sign out</Button>}
                      {isOwner && a._id !== (me?._id ?? me?.id) && (
                        <Button size="xs" variant="outline" onClick={() => run(() => apiSetAdminSuper(a._id, !a.isSuperAdmin), a.isSuperAdmin ? 'Now a team admin.' : 'Now a Super Admin.')}>
                          {a.isSuperAdmin ? 'Make team admin' : 'Make Super Admin'}
                        </Button>
                      )}
                      {isOwner && a._id !== (me?._id ?? me?.id) && <Button size="xs" variant="danger" onClick={() => setDel(a)}><Trash2 size={12} /></Button>}
                    </div>
                  </td>
                </tr>
              ))}
              {admins.data.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate">No admins yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {invite && roles.data && (
        <AdminFormModal roles={roles.data} onClose={() => setInvite(false)}
          onSave={async f => {
            const r = await apiInviteAdmin({ name: f.name, email: f.email, roleId: f.roleId, accessExpiresAt: f.accessExpiresAt });
            setInvite(false); admins.reload();
            if (r.inviteUrl) setLink(r.inviteUrl);
            toast.success(r.emailSent ? 'Invite sent.' : 'Admin added — email could not be sent, copy the link.');
          }} />
      )}
      {edit && roles.data && (
        <AdminFormModal roles={roles.data} admin={edit} onClose={() => setEdit(null)}
          onSave={async f => {
            await apiUpdateAdmin(edit._id, { name: f.name, roleId: f.roleId, status: f.status, accessExpiresAt: f.accessExpiresAt });
            setEdit(null); admins.reload(); toast.success('Saved.');
          }} />
      )}
      {del && (
        <Modal title="Delete admin" onClose={() => setDel(null)} width={420}
          footer={<><Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { const d = del; setDel(null); void run(() => apiDeleteAdmin(d._id), 'Admin deleted.'); }}>Delete</Button></>}>
          <p className="text-[13px] text-charcoal">Delete <b>{del.name}</b> ({del.email})? They lose access immediately and the email can be invited again later.</p>
        </Modal>
      )}
      {link && (
        <Modal title="Invite link" onClose={() => setLink(null)} width={480}
          footer={<Button onClick={() => { void navigator.clipboard?.writeText(link); toast.success('Link copied.'); }}><Link2 size={14} /> Copy link</Button>}>
          <p className="text-[12.5px] text-slate mb-2">Send this link to the person yourself if the email lands in spam. It works once and expires in a few days.</p>
          <input readOnly value={link} className={INPUT} onFocus={e => e.currentTarget.select()} aria-label="Invite link" />
        </Modal>
      )}
    </div>
  );
}

interface AdminForm { name: string; email: string; roleId: string; status: 'active' | 'inactive'; accessExpiresAt: string | null }

function AdminFormModal({ roles, admin, onClose, onSave }: { roles: AdminRole[]; admin?: AdminMember; onClose: () => void; onSave: (f: AdminForm) => Promise<void> }) {
  const [f, setF] = useState<AdminForm>({
    name: admin?.name ?? '', email: admin?.email ?? '', roleId: admin?.roleId ?? roles[0]?._id ?? '',
    status: admin?.status ?? 'active', accessExpiresAt: admin?.accessExpiresAt ? admin.accessExpiresAt.slice(0, 10) : null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (!f.name.trim()) { setError('Enter a name.'); return; }
    if (!admin && !/^\S+@\S+\.\S+$/.test(f.email.trim())) { setError('Enter a valid email.'); return; }
    setBusy(true); setError('');
    try { await onSave({ ...f, name: f.name.trim(), email: f.email.trim(), accessExpiresAt: f.accessExpiresAt ? new Date(f.accessExpiresAt + 'T23:59:59').toISOString() : null }); }
    catch (e) { setError(errMsg(e)); setBusy(false); }
  };
  return (
    <Modal title={admin ? 'Edit admin' : 'Invite admin'} onClose={onClose} width={460}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : admin ? 'Save' : 'Send invite'}</Button></>}>
      <div className="flex flex-col gap-3">
        <div><label htmlFor="at-name" className="text-[12px] font-medium text-graphite mb-1 block">Name</label>
          <input id="at-name" className={INPUT} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
        <div><label htmlFor="at-email" className="text-[12px] font-medium text-graphite mb-1 block">Email</label>
          <input id="at-email" type="email" className={INPUT} value={f.email} disabled={!!admin} onChange={e => setF({ ...f, email: e.target.value })} /></div>
        <div><label htmlFor="at-role" className="text-[12px] font-medium text-graphite mb-1 block">Role</label>
          <select id="at-role" className={INPUT} value={f.roleId} onChange={e => setF({ ...f, roleId: e.target.value })}>
            {roles.map(r => <option key={r._id} value={r._id}>{r.name}{r.readOnly ? ' (read-only)' : ''}</option>)}
          </select></div>
        <div><label htmlFor="at-exp" className="text-[12px] font-medium text-graphite mb-1 block">Access ends on (optional — temporary access)</label>
          <input id="at-exp" type="date" className={INPUT} value={f.accessExpiresAt ?? ''} onChange={e => setF({ ...f, accessExpiresAt: e.target.value || null })} /></div>
        {admin && (
          <div className="flex items-center justify-between"><span className="text-[13px] text-charcoal">Account active</span>
            <Toggle checked={f.status === 'active'} onChange={v => setF({ ...f, status: v ? 'active' : 'inactive' })} ariaLabel="Account active" /></div>
        )}
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Roles ────────────────────────────────────────────────────────────────
function RolesPane() {
  const toast = useToast();
  const roles = useLoad<AdminRole[]>(apiListAdminRoles);
  const [editing, setEditing] = useState<AdminRole | 'new' | null>(null);
  const [del, setDel] = useState<AdminRole | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-slate">A role is a set of pages an admin can open. A read-only role can look but never change anything.</p>
        <Button size="sm" onClick={() => setEditing('new')}><Plus size={14} /> New role</Button>
      </div>
      <LoadState loading={roles.loading} error={roles.error} onRetry={roles.reload} />
      <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))]">
        {roles.data?.map(r => (
          <div key={r._id} className="bg-white border border-bone rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div><p className="text-[13.5px] font-bold text-charcoal">{r.name}</p>
                <p className="text-[11.5px] text-slate">{r.adminCount ?? 0} admin{(r.adminCount ?? 0) === 1 ? '' : 's'}{r.readOnly ? ' · read-only' : ''}{r.isPreset ? ' · starter' : ''}</p></div>
            </div>
            {r.description && <p className="text-[12px] text-slate">{r.description}</p>}
            <p className="text-[11.5px] text-graphite">{r.permissions.map(p => ADMIN_PERMISSION_LABELS[p as AdminPermission]?.label ?? p).join(' · ') || 'No permissions'}</p>
            <div className="flex gap-1.5 mt-auto pt-1">
              <Button size="xs" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
              {!r.isPreset && <Button size="xs" variant="danger" onClick={() => setDel(r)}><Trash2 size={12} /></Button>}
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <RoleModal role={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)}
          onSave={async b => {
            if (editing === 'new') await apiCreateAdminRole(b); else await apiUpdateAdminRole(editing._id, b);
            setEditing(null); roles.reload(); toast.success('Role saved.');
          }} />
      )}
      {del && (
        <Modal title="Delete role" onClose={() => setDel(null)} width={420}
          footer={<><Button variant="outline" onClick={() => setDel(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => { const d = del; setDel(null); try { await apiDeleteAdminRole(d._id); toast.success('Role deleted.'); roles.reload(); } catch (e) { toast.error(errMsg(e)); } }}>Delete</Button></>}>
          <p className="text-[13px] text-charcoal">Delete the <b>{del.name}</b> role? A role that still has admins cannot be deleted.</p>
        </Modal>
      )}
    </div>
  );
}

function RoleModal({ role, onClose, onSave }: { role?: AdminRole; onClose: () => void; onSave: (b: { name: string; description: string; permissions: string[]; readOnly: boolean }) => Promise<void> }) {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [readOnly, setReadOnly] = useState(role?.readOnly ?? false);
  const [perms, setPerms] = useState<Set<string>>(new Set(role?.permissions ?? []));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toggle = (k: string) => setPerms(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const total = ADMIN_PERMISSION_AREAS.reduce((n, a) => n + a.keys.length, 0);
  const submit = async () => {
    if (name.trim().length < 2) { setError('Give the role a name.'); return; }
    if (perms.size === 0) { setError('Pick at least one permission.'); return; }
    setBusy(true); setError('');
    try { await onSave({ name: name.trim(), description: description.trim(), permissions: [...perms], readOnly }); }
    catch (e) { setError(errMsg(e)); setBusy(false); }
  };
  return (
    <Modal title={role ? `Edit role — ${role.name}` : 'New role'} onClose={onClose} width={720}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save role'}</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label htmlFor="ar-name" className="text-[12px] font-medium text-graphite mb-1 block">Role name</label>
            <input id="ar-name" className={INPUT} value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label htmlFor="ar-desc" className="text-[12px] font-medium text-graphite mb-1 block">Description</label>
            <input id="ar-desc" className={INPUT} value={description} onChange={e => setDescription(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-between border border-bone rounded-xl px-4 py-3">
          <div><p className="text-[13px] font-semibold text-charcoal">Read-only role</p><p className="text-[11.5px] text-slate">Can open the allowed pages but cannot change anything.</p></div>
          <Toggle checked={readOnly} onChange={setReadOnly} ariaLabel="Read-only role" />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] font-semibold text-charcoal">Permissions · {perms.size} of {total} selected</p>
          <div className="flex gap-3 text-[12px]">
            <button type="button" className="text-brand-orange cursor-pointer hover:underline" onClick={() => setPerms(new Set(ADMIN_PERMISSION_AREAS.flatMap(a => a.keys)))}>Select all</button>
            <button type="button" className="text-slate cursor-pointer hover:underline" onClick={() => setPerms(new Set())}>Clear</button>
          </div>
        </div>
        {ADMIN_PERMISSION_AREAS.map(a => (
          <fieldset key={a.area} className="border border-bone rounded-xl p-3">
            <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.06em] text-slate">{a.area}</legend>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
              {a.keys.map(k => (
                <div key={k} className="flex items-start gap-2">
                  <input id={'perm-' + k} type="checkbox" className="mt-1" checked={perms.has(k)} onChange={() => toggle(k)} />
                  <label htmlFor={'perm-' + k} className="cursor-pointer">
                    <span className="text-[12.5px] font-medium text-charcoal block">{ADMIN_PERMISSION_LABELS[k].label}</span>
                    <span className="text-[11.5px] text-slate">{ADMIN_PERMISSION_LABELS[k].hint}</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

// ── Approvals ────────────────────────────────────────────────────────────
function ApprovalsPane() {
  const toast = useToast();
  const [status, setStatus] = useState<'pending' | 'all'>('pending');
  const list = useLoad<AdminApproval[]>(() => apiListAdminApprovals(status), status);
  const decide = async (a: AdminApproval, approve: boolean) => {
    try { await apiDecideAdminApproval(a._id, approve); toast.success(approve ? 'Approved — they have 30 minutes to retry.' : 'Rejected.'); list.reload(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12.5px] text-slate">Big actions (payouts, commission, plans) by team admins wait here for a Super Admin.</p>
        <select aria-label="Filter approvals" className="border border-bone rounded-[8px] px-2 py-1.5 text-[12.5px]" value={status} onChange={e => setStatus(e.target.value as 'pending' | 'all')}>
          <option value="pending">Pending</option><option value="all">All</option>
        </select>
      </div>
      <LoadState loading={list.loading} error={list.error} onRetry={list.reload} />
      {list.data && list.data.length === 0 && <p className="text-[13px] text-slate py-6 text-center">Nothing waiting for approval.</p>}
      <div className="flex flex-col gap-2">
        {list.data?.map(a => (
          <div key={a._id} className="bg-white border border-bone rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[13px] font-semibold text-charcoal">{a.actionLabel}</p>
              <p className="text-[11.5px] text-slate">{a.requestedByName ?? 'An admin'} · {fmt(a.createdAt)} · {a.summary}</p>
              <p className="text-[11.5px] text-graphite capitalize">{a.stale ? 'expired' : a.status}{a.decidedByName ? ` by ${a.decidedByName}` : ''}</p>
            </div>
            {a.status === 'pending' && !a.stale && can('team.manage') && (
              <div className="flex gap-1.5"><Button size="sm" onClick={() => decide(a, true)}>Approve</Button><Button size="sm" variant="outline" onClick={() => decide(a, false)}>Reject</Button></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Audit trail ──────────────────────────────────────────────────────────
function AuditPane() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const audit = useLoad(() => apiGetAdminAudit({ page, limit: 25, search: q || undefined }), page + '|' + q);
  const logs: AdminActivityLogEntry[] = audit.data?.logs ?? [];
  const pg = audit.data?.pagination;
  return (
    <div className="flex flex-col gap-3">
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); setPage(1); setQ(search.trim()); }}>
        <input aria-label="Search audit trail" className={INPUT} placeholder="Search by admin email or action…" value={search} onChange={e => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <LoadState loading={audit.loading} error={audit.error} onRetry={audit.reload} />
      {!audit.loading && !audit.error && logs.length === 0 && <p className="text-[13px] text-slate py-6 text-center">No admin changes recorded yet.</p>}
      <div className="bg-white border border-bone rounded-2xl divide-y divide-bone">
        {logs.map(l => (
          <div key={l._id} className="px-4 py-2.5 flex items-start justify-between gap-3 flex-wrap">
            <div><p className="text-[12.5px] text-charcoal">{l.description ?? l.action}</p>
              <p className="text-[11.5px] text-slate">{l.actorName ?? 'Admin'}{l.ip ? ` · ${l.ip}` : ''}</p></div>
            <p className="text-[11.5px] text-slate whitespace-nowrap">{fmt(l.createdAt)}</p>
          </div>
        ))}
      </div>
      {pg && pg.totalPages > 1 && (
        <div className="flex items-center justify-between text-[12.5px] text-slate">
          <span>Page {pg.page} of {pg.totalPages}</span>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={page >= pg.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button></div>
        </div>
      )}
    </div>
  );
}
