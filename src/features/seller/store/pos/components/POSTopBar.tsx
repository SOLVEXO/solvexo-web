import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ShoppingCart, ClipboardList, Package, BarChart2, Settings2, Banknote } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/comman/ui/Avatar';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { apiCashInOut } from '@/api/services/pos/posSessions';
import { usePosSession } from '../context/PosSessionContext';
import { ProfileOverlay } from './ProfileOverlay';
import type { ActiveTab } from '../pos.types';

const TAB_ICONS: Record<ActiveTab, LucideIcon> = {
  sale:     ShoppingCart,
  orders:   ClipboardList,
  products: Package,
  summary:  BarChart2,
  manage:   Settings2,
};

const OPERATOR_TABS: ActiveTab[] = ['sale', 'orders', 'products', 'summary'];
const OWNER_ONLY_TABS: ActiveTab[] = ['manage'];

interface POSTopBarProps {
  activeTab:    ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
}

export function POSTopBar({ activeTab, setActiveTab }: POSTopBarProps) {
  const navigate = useNavigate();
  const { storeId, mode, employee, registerName, sessionId, session, refreshSession, logout } = usePosSession();
  const [showCash, setShowCash] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const openedAt = session ? new Date(session.openedAt) : null;
  const tabs = mode === 'owner' ? [...OPERATOR_TABS, ...OWNER_ONLY_TABS] : OPERATOR_TABS;

  return (
    <div className="shrink-0 flex flex-wrap items-center gap-3 sm:gap-4 px-3 sm:px-5 py-2 sm:h-[52px] bg-pos-surface border-b border-carbon">
      {/* Logo */}
      <div className="flex items-center gap-[10px] shrink-0">
        <SolvexoIcon size={26} />
        <span className="hidden sm:inline text-[13px] font-bold text-white">POS Register</span>
        <div className="bg-carbon rounded-[6px] px-2 py-[2px]">
          <span className="text-[10px] text-brand-orange">● Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[2px] bg-carbon rounded-lg p-[3px] overflow-x-auto max-w-full">
        {tabs.map(tab => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'shrink-0 px-[14px] py-[6px] rounded-[6px] text-[12px] font-medium cursor-pointer border-0',
                'flex items-center gap-[5px] capitalize transition-colors duration-150',
                activeTab === tab
                  ? 'bg-brand-orange text-white'
                  : 'bg-transparent text-pos-faint',
              )}
            >
              <Icon size={12} />
              {tab === 'manage' ? 'Manage' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-w-[8px]" />

      {sessionId && (
        <button
          onClick={() => setShowCash(true)}
          className="hidden sm:flex items-center gap-[6px] px-3 py-[6px] rounded-lg text-[11px] cursor-pointer border border-carbon bg-transparent text-pos-faint"
        >
          <Banknote size={12} /> Cash In/Out
        </button>
      )}

      {/* Profile trigger */}
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-[10px] bg-transparent border-0 cursor-pointer p-0"
        title="View profile"
      >
        <div className="hidden md:block text-right">
          <p className="text-[11px] text-pos-muted">
            {openedAt ? `Shift: ${openedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Open` : ''}
          </p>
          <p className="text-[11px] font-medium text-brand-orange">
            {employee?.name ?? ''}{registerName ? ` · ${registerName}` : ''}
          </p>
        </div>
        <Avatar name={employee?.name ?? 'Employee'} size={30} variant="pos" />
      </button>

      {mode === 'owner' ? (
        <button
          onClick={() => navigate(`/seller/store/${storeId}/pos`)}
          className="px-3 py-[6px] rounded-lg text-[11px] cursor-pointer border border-carbon bg-transparent text-white/45"
        >
          ← Dashboard
        </button>
      ) : (
        <button
          onClick={() => logout()}
          className="px-3 py-[6px] rounded-lg text-[11px] cursor-pointer border border-carbon bg-transparent text-white/45"
        >
          Log Out
        </button>
      )}

      {showCash && sessionId && employee && (
        <CashAdjustmentOverlay
          sessionId={sessionId}
          employeeId={employee._id}
          onClose={() => setShowCash(false)}
          onDone={() => { setShowCash(false); refreshSession(); }}
        />
      )}

      {showProfile && employee && (
        <ProfileOverlay
          storeId={storeId}
          employeeId={employee._id}
          registerName={registerName}
          openedAt={openedAt}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

function CashAdjustmentOverlay({
  sessionId, employeeId, onClose, onDone,
}: {
  sessionId: string;
  employeeId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [type, setType]     = useState<'cash_in' | 'cash_out'>('cash_in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    if (!reason.trim()) { setError('Reason is required.'); return; }

    setError('');
    setSaving(true);
    try {
      await apiCashInOut(sessionId, { type, amount: amt, reason: reason.trim(), employeeId });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record cash adjustment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="w-[320px] bg-pos-surface border border-carbon rounded-2xl p-5">
        <p className="text-[14px] font-bold text-white mb-4">Cash In / Out</p>

        <div className="flex gap-[6px] mb-3">
          {(['cash_in', 'cash_out'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx(
                'flex-1 py-[7px] rounded-lg text-[12px] font-medium cursor-pointer border',
                type === t ? 'bg-brand-deep-orange border-brand-orange text-white' : 'bg-carbon border-transparent text-pos-faint',
              )}
            >
              {t === 'cash_in' ? 'Cash In' : 'Cash Out'}
            </button>
          ))}
        </div>

        <input
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Amount"
          inputMode="decimal"
          className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[8px] text-[13px] text-white outline-none box-border mb-2"
        />
        <input
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason"
          className="w-full bg-carbon border border-carbon rounded-lg px-3 py-[8px] text-[13px] text-white outline-none box-border mb-3"
        />

        {error && <p className="text-[11px] text-error mb-2">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-[9px] bg-carbon border-0 rounded-lg text-[12px] text-pos-faint cursor-pointer">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 py-[9px] bg-brand-orange border-0 rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
