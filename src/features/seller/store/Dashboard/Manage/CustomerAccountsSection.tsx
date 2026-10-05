import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStoreWorkspace, hasNavPermission } from '@/components/layouts/StoreLayout';
import { apiUpdateStore } from '@/api/services/store';
import { TokenStorage } from '@/api/services/auth';

type Mode = 'optional' | 'required';

const OPTIONS: { value: Mode; title: string; hint: string }[] = [
  { value: 'optional', title: 'Accounts are optional', hint: 'Customers can check out as guests or create an account.' },
  { value: 'required', title: 'Accounts are required', hint: 'Customers must sign in to check out.' },
];

/** Shopify Settings -> Customer accounts (Optional / Required). Saves through
 *  the same update-store call as the other settings; staff need
 *  `settings.general.manage` to change it. */
export function CustomerAccountsSection() {
  const { store, storeId, refetch } = useStoreWorkspace();
  const canEdit = hasNavPermission(TokenStorage.getUser(), 'settings.general.manage');
  const saved: Mode = store?.customerAccounts === 'required' ? 'required' : 'optional';
  const [mode, setMode] = useState<Mode>(saved);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => { setMode(saved); }, [saved]);

  const save = async () => {
    if (!storeId || saving || !canEdit) return;
    setSaving(true);
    setMsg(null);
    try {
      await apiUpdateStore({ storeId, customerAccounts: mode });
      refetch();
      setMsg({ ok: true, text: 'Customer accounts setting saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed to save customer accounts setting.' });
    } finally {
      setSaving(false);
    }
  };

  const dirty = mode !== saved;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 border border-bone mt-5">
      <p className="text-[14px] font-semibold text-charcoal mb-1">Customer accounts</p>
      <p className="text-[11px] text-slate mb-4">Choose whether customers need an account to check out.</p>

      <div role="radiogroup" aria-label="Customer accounts" className="flex flex-col gap-2">
        {OPTIONS.map(o => {
          const active = mode === o.value;
          return (
            <label
              key={o.value}
              className={`flex items-start gap-3 px-[14px] py-3 rounded-[9px] border ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} ${active ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-cream'}`}
            >
              <input
                type="radio"
                name="customer-accounts"
                value={o.value}
                checked={active}
                disabled={!canEdit || saving}
                onChange={() => { setMode(o.value); setMsg(null); }}
                className="mt-[3px]"
              />
              <span>
                <span className="block text-[13px] font-medium text-charcoal">{o.title}</span>
                <span className="block text-[11px] text-slate">{o.hint}</span>
              </span>
            </label>
          );
        })}
      </div>

      {!canEdit && <p className="text-[11px] text-slate mt-3">You need the "Manage general settings" permission to change this.</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || !canEdit}
          className="flex items-center gap-[7px] px-[18px] py-2 rounded-lg border-none text-[13px] font-semibold"
          style={{
            background: dirty && !saving && canEdit ? '#D97757' : '#E8E6DC',
            color: dirty && !saving && canEdit ? '#fff' : '#8C8A82',
            cursor: dirty && !saving && canEdit ? 'pointer' : 'not-allowed',
          }}
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save'}
        </button>
        {msg && (
          <span role="status" className="flex items-center gap-1.5 text-[12px]" style={{ color: msg.ok ? '#166534' : '#991B1B' }}>
            {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
