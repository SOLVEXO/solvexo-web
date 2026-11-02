import { useCallback, useState, type ReactNode } from 'react';
import { Button, Modal } from '@/components/comman/ui';
import { apiArchiveImpact, type ArchiveImpact } from '@/api/services/product';

interface Pending { impact: ArchiveImpact; run: () => void }

const LINES: { key: keyof ArchiveImpact; one: string; many: string }[] = [
  { key: 'draftOrders', one: 'open draft order', many: 'open draft orders' },
  { key: 'purchaseOrders', one: 'open purchase order', many: 'open purchase orders' },
  { key: 'menus', one: 'menu that links to it', many: 'menus that link to them' },
  { key: 'carts', one: 'customer cart that holds it', many: 'customer carts that hold them' },
];

/**
 * Before products are archived: asks the server what still points at them.
 * Nothing found = runs straight away; otherwise the seller sees the list and confirms.
 * A failed lookup never blocks archiving (it only skips the warning).
 */
export function useArchiveGuard(storeId: string) {
  const [pending, setPending] = useState<Pending | null>(null);

  const request = useCallback(async (ids: string[], run: () => void) => {
    let impact: ArchiveImpact | null = null;
    try { impact = (await apiArchiveImpact(storeId, ids)).data; } catch { impact = null; }
    if (!impact || impact.total === 0) { run(); return; }
    setPending({ impact, run });
  }, [storeId]);

  const modal: ReactNode = pending && (
    <Modal title="Archive this product?" onClose={() => setPending(null)} footer={
      <>
        <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
        <Button onClick={() => { const p = pending; setPending(null); p.run(); }}>Archive anyway</Button>
      </>
    }>
      <p className="text-[13px] text-slate mb-2">Archiving hides it from your store. Sales history and stock stay. These still use it:</p>
      <ul className="text-[13px] text-charcoal list-disc pl-5 mb-2">
        {LINES.filter(l => (pending.impact[l.key] as number) > 0).map(l => {
          const n = pending.impact[l.key] as number;
          return <li key={l.key}>{n} {n === 1 ? l.one : l.many}</li>;
        })}
      </ul>
      <p className="text-[12px] text-slate">Menu links to an archived product open a "not found" page until you unarchive it or change the link.</p>
    </Modal>
  );

  return { request, modal };
}
