import { tt } from '@/utils/tStatic';
interface Look { fontFamily: string; color: string; accent: string; border: string; muted?: string }

const STEPS = [tt('returns.step.requested', "Requested"), tt('returns.step.approved', "Approved"), tt('returns.step.received', "Received")];

function stepIndex(status: string): number {
  switch (status) {
    case 'requested': return 0;
    case 'approved': return 1;
    case 'received': return 2;
    case 'refunded':
    case 'exchanged':
    case 'closed': return 3;
    default: return -1;
  }
}

/** Shopify-style return path for a returned line: Requested -> Approved -> Received -> Refunded / Exchanged. */
export function ReturnProgress({ status, look, rejectReason }: { status: string | undefined | null; look: Look; rejectReason?: string | null }) {
  if (!status || status === 'none') return null;
  const muted = look.muted ?? look.color;
  const base = { fontFamily: look.fontFamily, fontSize: '11px' } as const;

  if (status === 'rejected') {
    return (
      <p role="status" style={{ ...base, color: muted, marginTop: '6px' }}>
        {tt('returns.declinedMsg', "Your return request was declined")}{rejectReason ? `: ${rejectReason}` : '.'}
      </p>
    );
  }
  const idx = stepIndex(status);
  const finalLabel = status === 'exchanged' ? tt('returns.step.exchanged', "Exchanged") : status === 'closed' ? tt('returns.step.closed', "Closed") : tt('returns.step.refunded', "Refunded");
  const labels = [...STEPS, finalLabel];
  return (
    <ol aria-label={tt('returns.progress', "Return progress")} className="flex items-center flex-wrap" style={{ gap: '6px', marginTop: '8px', padding: 0, listStyle: 'none' }}>
      {labels.map((label, k) => {
        const done = k <= idx;
        return (
          <li
            key={label}
            aria-current={k === idx ? 'step' : undefined}
            style={{ ...base, fontWeight: done ? 600 : 400, color: done ? look.accent : muted, border: `1px solid ${done ? look.accent : look.border}`, padding: '2px 8px', borderRadius: '9999px' }}
          >
            {label}
          </li>
        );
      })}
    </ol>
  );
}
