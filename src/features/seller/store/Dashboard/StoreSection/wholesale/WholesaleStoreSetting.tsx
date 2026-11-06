import { useState } from 'react';
import { apiUpdateStore } from '@/api/services/store';
import { errorMessage } from '@/api/errorMessage';
import { can } from '@/hooks/auth/useCan';
import { useToast } from '@/contexts/ToastContext';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Card } from '@/components/comman/ui';

/** "Wholesale-only store": only approved company buyers can see prices, add to cart or check out. Retail stores leave it off. */
export function WholesaleStoreSetting({ storeId }: { storeId: string }) {
  const { store, refetch } = useStoreWorkspace();
  const toast = useToast();
  const canEdit = can('b2b.manage');
  const on = !!(store as { wholesaleOnly?: boolean } | null)?.wholesaleOnly;
  const [busy, setBusy] = useState(false);

  async function toggle(next: boolean) {
    setBusy(true);
    try {
      await apiUpdateStore({ storeId, wholesaleOnly: next });
      toast.success(next ? 'Wholesale-only store is on' : 'Wholesale-only store is off');
      refetch();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  }

  return (
    <Card padding="md">
      <label className="flex items-start gap-3 text-[13px] text-carbon">
        <input type="checkbox" className="mt-0.5" checked={on} disabled={!canEdit || busy} onChange={(e) => void toggle(e.target.checked)} />
        <span>
          <strong className="block text-[14px]">Wholesale-only store</strong>
          Only approved company buyers can see prices, add to cart or check out. Everyone else sees a message to sign in or apply for a wholesale account.
          Prices stay in the public product data your storefront loads, so this hides them in your theme and blocks ordering, it is not a security vault.
        </span>
      </label>
    </Card>
  );
}
