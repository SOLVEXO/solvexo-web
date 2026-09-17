import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Check, X, ShieldCheck, KeyRound, Trash2 } from 'lucide-react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { SkeletonBox, EmptyState, Badge, Modal, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import {
  apiListStaff, apiCreateStaff, apiUpdateStaff, apiDeactivateStaff,
  apiListRoles, apiCreateRole, apiUpdateRole, apiDeleteRole,
  apiListApprovals, apiApproveRequest, apiRejectRequest,
  STAFF_PERMISSIONS, PERMISSION_LABELS,
  type StaffMember, type Role, type StaffPermission, type ApprovalRequestItem,
} from '@/api/services/staff';

const EMPTY_STAFF_FORM = { name: '', email: '', password: '', role: 'staff' as 'staff' | 'manager', roleId: '' };
const EMPTY_ROLE_FORM = { name: '', description: '', permissions: [] as StaffPermission[] };

/** Real, store-wide Staff RBAC management — Shopify-parity Roles (a named,
 *  reusable permission bundle — see the `Role` schema) assigned to staff,
 *  plus the approvals queue for large/damage stock adjustments. Its own
 *  top-level page (`/store/:storeId/staff`, Settings nav group) — moved out
 *  of the Inventory Hub, which is where it originally landed (a real
 *  architectural mismatch: Staff permissions now gate nearly every store
 *  section — Orders/Products/Finance/Settings/etc, not just Inventory — so
 *  burying management for them inside one module's tab bar was misleading).
 *  This is the SELLER-side management surface (reachable from the seller's
 *  own existing dashboard session) — a staff member's own login is at
 *  `/staff-login/:storeId` (see `StaffLoginPage.tsx`), a separate, real
 *  login distinct from the seller's own. */
export default function StaffPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { storeId } = useStoreWorkspace();
  const [subTab, setSubTab] = useState<'staff' | 'roles'>('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvalBusy, setApprovalBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiListStaff(storeId), apiListRoles(storeId), apiListApprovals(storeId, 'pending')])
      .then(([s, r, a]) => { setStaff(s.data); setRoles(r.data); setApprovals(a.data); })
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const roleName = (roleId: string | null) => roles.find(r => r._id === roleId)?.name ?? 'No role assigned';

  const handleApprove = async (id: string) => {
    setApprovalBusy(id);
    try { await apiApproveRequest(storeId, id); load(); } finally { setApprovalBusy(null); }
  };
  const handleReject = async (id: string) => {
    setApprovalBusy(id);
    try { await apiRejectRequest(storeId, id); load(); } finally { setApprovalBusy(null); }
  };

  return (
    <>
      {!embedded && (
        <StorePageHeader title="Staff" subtitle="Give staff their own scoped login and control what they can access across the whole store." />
      )}

      <div className="px-4 lg:px-7 pt-4 pb-8 flex flex-col gap-6">
        {/* ── Pending approvals ────────────────────────────────────────── */}
        {approvals.length > 0 && (
          <div className="bg-white rounded-xl border border-brand-orange/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-bone bg-brand-pale-orange flex items-center gap-2">
              <ShieldCheck size={15} className="text-brand-deep-orange" />
              <p className="text-[13px] font-bold text-charcoal">Pending Approvals ({approvals.length})</p>
            </div>
            <div className="divide-y divide-bone">
              {approvals.map(a => (
                <div key={a._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-charcoal truncate">{a.summary}</p>
                    <p className="text-[11px] text-slate">Requested by {a.requestedByName ?? 'a staff member'} · {new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="xs" variant="outline" icon={<X size={12} />} onClick={() => handleReject(a._id)} loading={approvalBusy === a._id}>Reject</Button>
                    <Button size="xs" variant="primary" icon={<Check size={12} />} onClick={() => handleApprove(a._id)} loading={approvalBusy === a._id}>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Staff / Roles sub-tabs ───────────────────────────────────── */}
        <div className="flex gap-1">
          {(['staff', 'roles'] as const).map(t => (
            <button key={t} type="button" onClick={() => setSubTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold border cursor-pointer ${subTab === t ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
              {t === 'staff' ? 'Staff Members' : 'Roles'}
            </button>
          ))}
        </div>

        {subTab === 'staff'
          ? <StaffList storeId={storeId} staff={staff} roles={roles} loading={loading} roleName={roleName} onChanged={load} />
          : <RolesList storeId={storeId} roles={roles} loading={loading} onChanged={load} />}
      </div>
    </>
  );
}

// ── Staff Members ──────────────────────────────────────────────────────

function StaffList({ storeId, staff, roles, loading, roleName, onChanged }: {
  storeId: string; staff: StaffMember[]; roles: Role[]; loading: boolean;
  roleName: (roleId: string | null) => string; onChanged: () => void;
}) {
  const [formOpen, setFormOpen] = useState<StaffMember | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_STAFF_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => { setForm(EMPTY_STAFF_FORM); setError(''); setFormOpen('new'); };
  const openEdit = (member: StaffMember) => {
    setForm({ name: member.name, email: member.email, password: '', role: member.role, roleId: member.roleId ?? '' });
    setError('');
    setFormOpen(member);
  };

  const handleSave = async () => {
    if (!formOpen) return;
    setError('');
    if (formOpen === 'new' && (!form.name.trim() || !form.email.trim() || form.password.length < 8)) {
      setError('Name, email, and an 8+ character password are required.');
      return;
    }
    setSaving(true);
    try {
      if (formOpen === 'new') {
        await apiCreateStaff(storeId, { name: form.name, email: form.email, password: form.password, role: form.role, roleId: form.roleId || undefined });
      } else {
        await apiUpdateStaff(storeId, formOpen._id, { name: form.name, role: form.role, roleId: form.roleId || undefined });
      }
      setFormOpen(null);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member: StaffMember) => {
    await apiDeactivateStaff(storeId, member._id);
    onChanged();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-slate max-w-[520px]">
          Give staff their own store-scoped login (at <code className="text-[11px]">/staff-login/{storeId}</code>) with only the Role's permissions. You always have full access regardless of what's set here.
        </p>
        <Button size="sm" icon={<Plus size={13} />} onClick={openNew} disabled={roles.length === 0}>Add Staff</Button>
      </div>
      {roles.length === 0 && !loading && (
        <p className="text-[12px] text-slate bg-cream rounded-lg px-3 py-2">Create a Role first (see the Roles tab above) before adding staff.</p>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="10px" />)}</div>
      ) : staff.length === 0 ? (
        <EmptyState icon={<Users size={28} className="text-brand-orange opacity-55" />} title="No staff accounts yet" description="Add one to give a warehouse worker or manager their own scoped login." action={roles.length > 0 ? { label: 'Add Staff', onClick: openNew, icon: <Plus size={14} /> } : undefined} />
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {staff.map(member => (
            <div key={member._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button type="button" onClick={() => openEdit(member)} className="min-w-0 text-left bg-transparent border-none cursor-pointer flex-1">
                <p className="text-[13px] font-semibold text-charcoal truncate">{member.name} <span className="text-slate font-normal">· {member.email}</span></p>
                <p className="text-[11px] text-slate">{roleName(member.roleId)}</p>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <Badge color={member.status === 'active' ? 'green' : 'gray'} size="sm">{member.status === 'active' ? 'Active' : 'Inactive'}</Badge>
                {member.status === 'active' && (
                  <Button size="xs" variant="ghost" onClick={() => handleDeactivate(member)}>Deactivate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal title={formOpen === 'new' ? 'Add Staff' : 'Edit Staff'} onClose={() => setFormOpen(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Email</label>
              <input type="email" value={form.email} disabled={formOpen !== 'new'} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40 disabled:bg-cream disabled:text-slate" />
            </div>
            {formOpen === 'new' && (
              <div>
                <label className="text-[12px] font-medium text-graphite mb-1 block">Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
              </div>
            )}
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Role</label>
              <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40 bg-white">
                <option value="">— Select a Role —</option>
                {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
              <p className="text-[11px] text-slate mt-1">Manage what each Role can do from the Roles tab.</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Label</label>
              <div className="flex gap-2">
                {(['staff', 'manager'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${form.role === r ? 'border-brand-orange bg-brand-pale-orange text-brand-deep-orange' : 'border-bone bg-white text-slate'}`}>
                    {r === 'manager' ? 'Manager' : 'Staff'}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-[12px] text-error">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Roles ───────────────────────────────────────────────────────────────

function RolesList({ storeId, roles, loading, onChanged }: { storeId: string; roles: Role[]; loading: boolean; onChanged: () => void }) {
  const [formOpen, setFormOpen] = useState<Role | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY_ROLE_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openNew = () => { setForm(EMPTY_ROLE_FORM); setError(''); setFormOpen('new'); };
  const openEdit = (role: Role) => {
    setForm({ name: role.name, description: role.description ?? '', permissions: role.permissions });
    setError('');
    setFormOpen(role);
  };

  const togglePermission = (p: StaffPermission) => {
    setForm(f => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p] }));
  };

  const handleSave = async () => {
    if (!formOpen) return;
    setError('');
    if (!form.name.trim()) { setError('A role name is required.'); return; }
    setSaving(true);
    try {
      if (formOpen === 'new') {
        await apiCreateRole(storeId, { name: form.name, description: form.description || undefined, permissions: form.permissions });
      } else {
        await apiUpdateRole(storeId, formOpen._id, { name: form.name, description: form.description || undefined, permissions: form.permissions });
      }
      setFormOpen(null);
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    try { await apiDeleteRole(storeId, role._id); onChanged(); } catch { /* surfaced via the role staying in the list */ }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-slate max-w-[520px]">
          A Role is a named, reusable bundle of permissions — assign it to multiple staff instead of picking permissions one-by-one (matches Shopify's own Role model).
        </p>
        <Button size="sm" icon={<Plus size={13} />} onClick={openNew}>New Role</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <SkeletonBox key={i} height={56} rounded="10px" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-bone divide-y divide-bone overflow-hidden">
          {roles.map(role => (
            <div key={role._id} className="flex items-center justify-between gap-3 px-4 py-3">
              <button type="button" onClick={() => openEdit(role)} className="min-w-0 text-left bg-transparent border-none cursor-pointer flex-1">
                <p className="text-[13px] font-semibold text-charcoal truncate flex items-center gap-1.5">
                  <KeyRound size={12} className="text-slate shrink-0" />
                  {role.name}
                  {role.isPreset && <Badge color="blue" size="sm">Preset</Badge>}
                </p>
                <p className="text-[11px] text-slate">{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}{role.description ? ` · ${role.description}` : ''}</p>
              </button>
              {!role.isPreset && (
                <Button size="xs" variant="ghost" icon={<Trash2 size={12} />} onClick={() => handleDelete(role)}>Delete</Button>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <Modal title={formOpen === 'new' ? 'New Role' : `Edit "${formOpen.name}"`} onClose={() => setFormOpen(null)} footer={
          <>
            <Button variant="ghost" onClick={() => setFormOpen(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
          </>
        }>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Role name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Warehouse Staff"
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1 block">Description (optional)</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-bone rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand-orange/40" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-graphite mb-1.5 block">Permissions</label>
              <div className="flex flex-col gap-2 border border-bone rounded-lg p-3 max-h-[340px] overflow-y-auto">
                {STAFF_PERMISSIONS.map(p => (
                  <div key={p} className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-charcoal">{PERMISSION_LABELS[p]}</span>
                    <Toggle checked={form.permissions.includes(p)} onChange={() => togglePermission(p)} size="sm" ariaLabel={PERMISSION_LABELS[p]} />
                  </div>
                ))}
              </div>
            </div>
            {error && <p className="text-[12px] text-error">{error}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
