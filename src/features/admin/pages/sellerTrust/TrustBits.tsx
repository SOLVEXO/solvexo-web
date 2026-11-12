import { useState } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Badge, Button, Modal, Textarea } from '@/components/comman/ui';
import type { PayoutHold, RiskLevel, RiskReason, VerificationStatus } from '@/api/services/admin/adminSellerTrust';
import { RISK, SEVERITY, VERIFICATION, deadlineText, fmtDate } from './trust.utils';

/** Verification status pill, with the days left (or overdue) under it while a deadline applies. */
export function VerificationPill({ status, dueAt, showDeadline = true }: { status: VerificationStatus | null | undefined; dueAt?: string | null; showDeadline?: boolean }) {
  const v = VERIFICATION[status ?? 'not_started'] ?? VERIFICATION.not_started;
  const left = showDeadline && status !== 'verified' ? deadlineText(dueAt) : null;
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge color={v.color} size="sm" dot>{v.label}</Badge>
      {left && <span className={`text-[11px] ${left.includes('overdue') ? 'text-error font-semibold' : 'text-slate'}`}>{left}</span>}
    </div>
  );
}

export function RiskPill({ level }: { level: RiskLevel | null | undefined }) {
  if (!level) return <span className="text-[12px] text-slate">—</span>;
  const r = RISK[level];
  return <Badge color={r.color} size="sm" dot>{r.label}</Badge>;
}

/** The tax number itself, or a red "Missing". */
export function NtnValue({ hasNtn, ntn }: { hasNtn?: boolean; ntn?: string | null }) {
  if (ntn) return <span className="text-[12.5px] text-charcoal tabular-nums break-all">{ntn}</span>;
  if (hasNtn) return <span className="text-[12px] text-graphite">On file</span>;
  return <span className="text-[12px] font-semibold text-error">Missing</span>;
}

export function RiskSignals({ reasons }: { reasons: RiskReason[] }) {
  if (reasons.length === 0) return <p className="text-[12.5px] text-slate">No risk signals.</p>;
  return (
    <ul className="flex flex-col gap-1.5" aria-label="Risk signals">
      {reasons.map(r => {
        const s = SEVERITY[r.severity] ?? SEVERITY.info;
        const Icon = r.severity === 'high' ? ShieldAlert : r.severity === 'medium' ? AlertTriangle : Info;
        return (
          <li key={r.code} className="flex items-center justify-between gap-3 rounded-lg bg-cream border border-bone px-3 py-2">
            <span className="flex items-center gap-2 text-[12.5px] text-charcoal min-w-0">
              <Icon size={14} className={r.severity === 'high' ? 'text-error shrink-0' : r.severity === 'medium' ? 'text-warning shrink-0' : 'text-slate shrink-0'} />
              {r.label}
            </span>
            <Badge color={s.color} size="sm">{s.label}</Badge>
          </li>
        );
      })}
    </ul>
  );
}

export function PayoutHoldNote({ hold }: { hold: PayoutHold | null | undefined }) {
  if (!hold?.active) return null;
  return (
    <p className="flex items-start gap-2 text-[12px] text-error bg-error-bg border border-error/20 rounded-lg px-3 py-2">
      <ShieldAlert size={13} className="shrink-0 mt-px" />
      <span>Payouts held{hold.at ? ` since ${fmtDate(hold.at)}` : ''}{hold.reason ? `: ${hold.reason}` : ''}</span>
    </p>
  );
}

/** Hold / release payouts — an inline confirm step with an optional reason (no window.confirm). */
export function PayoutHoldModal({ storeName, holding, stripeConnect, busy, onCancel, onConfirm }: {
  storeName: string;
  /** true = the store is currently held and this releases it. */
  holding: boolean;
  stripeConnect?: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      title={holding ? 'Release payout hold' : 'Hold payouts'}
      onClose={onCancel}
      footer={<>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant={holding ? 'secondary' : 'danger'} loading={busy} onClick={() => onConfirm(reason.trim())}>
          {holding ? 'Release hold' : 'Hold payouts'}
        </Button>
      </>}
    >
      <div className="flex flex-col gap-3">
        <p className="text-[13px] text-charcoal leading-[1.6]">
          {holding
            ? <>Release the payout hold on <strong>{storeName}</strong>? Payouts go back to normal unless the store is limited for missing verification.</>
            : <>Hold payouts for <strong>{storeName}</strong>? The seller can still sell and take cash on delivery; payouts of online payments wait until you release the hold.</>}
        </p>
        {stripeConnect && !holding && (
          <p className="text-[12px] text-warning bg-warning-bg rounded-lg px-3 py-2">
            This store is paid through Stripe Connect. Stripe pays it directly, so the hold only covers balances Solvexo holds.
          </p>
        )}
        {!holding && (
          <Textarea label="Reason (shown in the audit log)" value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="e.g. Sells cosmetics without a DRAP licence" />
        )}
      </div>
    </Modal>
  );
}
